import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, type IStorage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { processFile, storeInAstraDB, deleteFileFromAstraDB } from "./file-processor";
import { insertMessageSchema } from "@shared/schema";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { ModeratorStorage } from "./ModeratorStorage";
const moderatorStorage = new ModeratorStorage();


const client = new DataAPIClient(process.env.ASTRA_API_TOKEN || '');
const db = client.db(process.env.ASTRA_DB_URL || '');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024 * 1024, // 1GB limit
  },
  fileFilter: (req, file, cb) => {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, true);
  }
});


export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // File Upload Endpoint
  app.post("/api/upload", upload.array('files', 10), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ];
    
    const userId = req.user!.id;
    const { sessionId } = req.body;
    
    // Process each file and track results
    const results = [];
    
    for (const file of files) {
      // Validate file type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        results.push({
          filename: file.originalname,
          success: false,
          error: `Unsupported file type: ${file.mimetype}`
        });
        continue;
      }
      
      try {
        // Create file record
        const fileRecord = await storage.createFile(userId, {
          filename: file.originalname,
          originalName: file.originalname,
          contentType: file.mimetype,
          size: file.size,
          sessionId,
          status: "processing",
        });
        
        results.push({
          filename: file.originalname,
          success: true,
          fileId: fileRecord.id
        });
        
        // Process file asynchronously
        processFile(file, sessionId)
          .then(async () => {
            try {
              await storage.updateFileStatus(fileRecord.id, "completed");
              await storage.createMessage(userId, {
                content: `File processed successfully: ${file.originalname}`,
                isBot: true,
                sessionId,
                fileId: fileRecord.id,
              });
            } catch (storeError) {
              console.error("Error storing in AstraDB:", storeError);
              await storage.updateFileStatus(fileRecord.id, "completed");
              await storage.createMessage(userId, {
                content: `File processed but storage in AstraDB failed: ${file.originalname}`,
                isBot: true,
                sessionId,
                fileId: fileRecord.id,
              });
            }
          })
          .catch(async (error) => {
            console.error("Error processing file:", error);
            await storage.updateFileStatus(fileRecord.id, "error");
            await storage.createMessage(userId, {
              content: `Error processing file ${file.originalname}: ${error.message || "Unknown error"}`,
              isBot: true,
              sessionId,
              fileId: fileRecord.id,
            });
          });
      } catch (error) {
        console.error("Error creating file record:", error);
        results.push({
          filename: file.originalname,
          success: false,
          error: "Failed to create file record"
        });
      }
    }
    
    // Return the results of all file uploads
    res.json({ files: results });
  });

  // Chat API Route
  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const persistentSessionId = req.user!.username.split("@")[0];

    const result = insertMessageSchema.safeParse(req.body);
    if (!result.success) {
      console.error("Invalid request body:", result.error);
      return res.status(400).json({ error: "Invalid request data" });
    }

    const body = result.data;

    try {
      // Save the user message to local DB
      await storage.createMessage(req.user!.id, {
        content: body.content,
        isBot: false,
        sessionId: persistentSessionId,
      });

      console.log(`Sending request to FastAPI: ${body.content}`);

      const response = await fetch("https://mapi-on6dq.ondigitalocean.app/mimod", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: body.content,
          session_id: persistentSessionId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("FastAPI Error:", errorText);
        throw new Error(`FastAPI responded with status ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log("FastAPI Response:", JSON.stringify(apiResponse, null, 2));

      const formattedResponse = apiResponse.reply?.trim();

      if (!formattedResponse) {
        throw new Error("No 'reply' in FastAPI response");
      }

      // Save the bot message
      const botMessage = await storage.createMessage(req.user!.id, {
        content: formattedResponse,
        isBot: true,
        sessionId: persistentSessionId,
      });

      res.json(botMessage);
    } catch (error) {
      console.error("Error in chat processing:", error);
      res.status(500).json({
        message: "Failed to process message",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  app.get("/api/messages/:sessionId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const persistentSessionId = req.user!.username.split('@')[0];
      const messages = await storage.getMessagesByUserAndSession(
        req.user!.id,
        persistentSessionId
      );
      res.json(messages);
    } catch (error) {
      console.error("Error retrieving messages:", error);
      res.status(500).json({
        message: "Failed to retrieve messages",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });


  app.get("/api/files", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const allFiles = await storage.getAllFiles();
      res.json(allFiles);
    } catch (error) {
      console.error("Error retrieving file history:", error);
      res.status(500).json({
        message: "Failed to retrieve file history",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Add new DELETE endpoint for messages
  app.delete("/api/messages/:messageId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    try {
      // Get the message to check if it's a bot message and get the message ID
      const message = await storage.getMessage(messageId);

      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Check if this message belongs to the authenticated user
      if (message.userId !== req.user!.id) {
        return res.status(403).json({ error: "Permission denied" });
      }

      // If it's a bot message, check for AstraDB content to delete
      if (message.isBot) {
        // Extract MSGID from content using the correct format
        const msgIdMatch = message.content.match(/MSGID:\s*([a-f0-9-]+)/i);
        console.log("Extracted MSGID:", msgIdMatch ? msgIdMatch[1] : "Not found");

        if (msgIdMatch) {
          const astraMessageId = msgIdMatch[1];
          try {
            // Delete from AstraDB with proper metadata field
            await db.collection("data").deleteMany({
              "metadata.msgid": astraMessageId
            });
            console.log(`Successfully deleted message with MSGID ${astraMessageId} from AstraDB`);
          } catch (astraError) {
            console.error("Error deleting from AstraDB:", astraError);
            // Continue with local deletion even if AstraDB deletion fails
          }
        } else {
          console.log("No MSGID found in message content:", message.content);
        }
      }

      // Delete from local database
      const deletedMessage = await storage.deleteMessage(messageId);
      console.log(`Successfully deleted message ${messageId} from PostgreSQL`);

      res.json(deletedMessage);
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({
        message: "Failed to delete message",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Add new DELETE endpoint for files
  app.delete("/api/files/:fileId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const fileId = parseInt(req.params.fileId);
    if (isNaN(fileId)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }

    try {
      // Check if file exists and user has permission
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Verify file ownership
      //if (file.userId !== req.user!.id) {
      //  return res.status(403).json({ error: "Permission denied" });
      //}

      // First delete the vector data from AstraDB
      try {
        await deleteFileFromAstraDB(file.filename);
      } catch (astraError) {
        console.error("Error deleting from AstraDB:", astraError);
        // Continue with PostgreSQL deletion even if AstraDB deletion fails
      }

      // Then delete from PostgreSQL
      const deletedFile = await storage.deleteFile(fileId);

      res.json(deletedFile);
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({
        message: "Failed to delete file",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get all unique session IDs for the moderator dashboard
  app.get("/api/moderator/sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const sessionIds = await moderatorStorage.getAllSessionIds();
      res.json(sessionIds);
    } catch (error) {
      console.error("Error retrieving session IDs:", error);
      res.status(500).json({
        message: "Failed to retrieve session IDs",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get all messages for a specific session ID
  app.get("/api/moderator/messages/:sessionId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const sessionId = req.params.sessionId;
      const messages = await moderatorStorage.getMessagesBySessionId(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error retrieving messages for session:", error);
      res.status(500).json({
        message: "Failed to retrieve messages for session",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}