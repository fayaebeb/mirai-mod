import { desc, eq } from "drizzle-orm";
import { moderatorDb } from "./moderatorDb";
import { feedback, Feedback, inviteTokens, messages, type Message } from "@shared/moderatorSchema";
import { InviteToken } from "@shared/schema";
import { randomBytes } from "crypto";

export class ModeratorStorage {
  /**
   * Retrieves all unique session IDs from the messages table.
   * This is used to populate the moderator dashboard session list.
   */
  async getAllSessionIds(): Promise<string[]> {
    const results = await moderatorDb
      .select({ sessionId: messages.sessionId })
      .from(messages)
      .groupBy(messages.sessionId)
      .orderBy(messages.sessionId);

    return results
    .map(row => row.sessionId)
    .filter((id): id is string => id !== null);

  }

  async getAllMessages(): Promise<Message[]> {
    return await moderatorDb
      .select()
      .from(messages)
      .orderBy(messages.timestamp);
  }

  /**
   * Retrieves all messages for a specific session ID, ordered by timestamp.
   * This enables moderators to view the full chronological history of a session.
   * 
   * @param sessionId - The session ID for which to fetch messages.
   */
  async getMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return await moderatorDb
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.timestamp);
  }

  // ─── Feedback ──────────────────────────────────────

  async getAllFeedback(): Promise<Feedback[]> {
    return await moderatorDb
      .select()
      .from(feedback)
      .orderBy(feedback.createdAt);
  }

  async getFeedbackBySessionId(sessionId: string): Promise<Feedback[]> {
    return await moderatorDb
      .select()
      .from(feedback)
      .where(eq(feedback.sessionId, sessionId))
      .orderBy(feedback.createdAt);
  }

  async getFeedbackByUserId(userId: number): Promise<Feedback[]> {
    return await moderatorDb
      .select()
      .from(feedback)
      .where(eq(feedback.userId, userId))
      .orderBy(feedback.createdAt);
  }


  // ─── Invite Tokens ─────────────────────────────────

  async getUserAppInviteTokens(): Promise<InviteToken[]> {
    return await moderatorDb
      .select()
      .from(inviteTokens)
      .where(eq(inviteTokens.isValid, true))
      .orderBy(desc(inviteTokens.createdAt));
  }

  async createUserAppInviteToken(createdById: number): Promise<InviteToken> {
    const tokenString = randomBytes(32).toString("hex");
    const [newToken] = await moderatorDb
      .insert(inviteTokens)
      .values({
        token: tokenString,
        createdById,
        isValid: true,
      })
      .returning();
    return newToken;
  }
}