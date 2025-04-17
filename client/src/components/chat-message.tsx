import { Message as MessageType } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui/avatar";
import { Card } from "./ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Database, Globe, Cpu, Server } from "lucide-react";
import { Button } from "./ui/button";

// Extended Message type that includes the regenerate function
interface Message extends MessageType {
  onRegenerateAnswer?: () => void;
}

// Futuristic decorative elements to randomly add to bot messages
const botDecorations = [
  "⚡", "🔹", "💠", "🔷", "🔌", "📡", "🛰️", "⚙️", "🔋", "💻"
];

// Helper function to add decorations to bot messages
const addRandomDecoration = (original: string) => {
  if (Math.random() > 0.3) return original;
  const decoration = botDecorations[Math.floor(Math.random() * botDecorations.length)];
  const position = Math.floor(Math.random() * 3);
  if (position === 0) return `${decoration} ${original}`;
  if (position === 1) return `${original} ${decoration}`;
  return `${decoration} ${original} ${decoration}`;
};

// Helper function to parse message content into sections
const parseMessageContent = (content: string) => {
  const sections = {
    mainText: "",
    companyDocs: "",
    onlineInfo: ""
  };

  // Split by company docs marker
  const [beforeCompanyDocs, afterCompanyDocs = ""] = content.split("### 社内文書情報:");
  sections.mainText = beforeCompanyDocs.trim();

  // Split remaining content by online info marker
  const [companyDocs, onlineInfo = ""] = afterCompanyDocs.split("### オンラインWeb情報:");
  sections.companyDocs = companyDocs.trim();
  sections.onlineInfo = onlineInfo.trim();

  return sections;
};

const MessageSection = ({ 
  title, 
  content, 
  icon: Icon 
}: { 
  title: string; 
  content: string; 
  icon: React.ComponentType<any>; 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return null;

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="mt-2 rounded-md border border-blue-400/20 overflow-hidden transition-all duration-200"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between py-1 px-1.5 hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-3 w-3 text-blue-400" />
            <span className="text-xs font-mono text-blue-300">{title}</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3 w-3 text-blue-400" />
          </motion.div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-2 bg-slate-900/50 backdrop-blur-sm"
        >
          <div className="prose prose-xs prose-invert max-w-none w-full text-[10px] sm:text-xs">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => (
                  <p className="w-full block text-white my-1.5" {...props} />
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto w-full max-w-[calc(100%-16px)] mx-auto pb-1 relative">
                    <div>
                      <table className="text-[10px] sm:text-[11px] border-collapse table-auto border-spacing-0" {...props} />
                    </div>
                  </div>
                ),
                td: ({ node, ...props }) => (
                  <td className="border border-blue-400/30 px-1 py-0.5 sm:px-2 sm:py-1 break-words whitespace-normal min-w-[50px] max-w-[150px]" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="border border-blue-400/50 bg-slate-800 px-1 py-0.5 sm:px-2 sm:py-1 break-words whitespace-normal min-w-[50px] max-w-[150px]" {...props} />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function ChatMessage({ 
  message, 
  isFirstInGroup = true,
  isLastInGroup = true
}: { 
  message: Message;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiPosition, setEmojiPosition] = useState({ x: 0, y: 0 });
  const [decoration, setDecoration] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedContent, setDisplayedContent] = useState(message.content);
  const contentRef = useRef(message.content);

  // Only show typing animation for NEW bot messages (not existing ones on page load)
  useEffect(() => {
    // For all existing messages, display content immediately without animation
    setDisplayedContent(message.content);
    setIsTyping(false);

    // Typing animation is now handled by a separate mechanism in the chat interface
    // when new messages are received from the API
  }, [message.content]);

  useEffect(() => {
    if (message.isBot && Math.random() > 0.7) {
      setDecoration(botDecorations[Math.floor(Math.random() * botDecorations.length)]);
    }
  }, [message.isBot]);

  const handleBotMessageHover = () => {
    if (message.isBot) {
      setShowEmoji(true);
      setEmojiPosition({
        x: Math.random() * 40 - 20,
        y: -20 - Math.random() * 20,
      });
      setTimeout(() => setShowEmoji(false), 1000);
    }
  };

  // Parse message content if it's a bot message
  const sections = message.isBot ? parseMessageContent(displayedContent) : null;

  // Determine message bubble styling based on position in the group
  const getBubbleStyles = () => {
    if (message.isBot) {
      return {
        borderRadius: isFirstInGroup && isLastInGroup 
          ? '0.75rem' 
          : isFirstInGroup 
            ? '0.75rem 0.75rem 0.25rem 0.75rem' 
            : isLastInGroup 
              ? '0.25rem 0.75rem 0.75rem 0.75rem' 
              : '0.25rem 0.75rem 0.25rem 0.75rem',
        marginTop: isFirstInGroup ? '0.375rem' : '0.125rem',
        marginBottom: isLastInGroup ? '0.375rem' : '0.125rem'
      };
    } else {
      return {
        borderRadius: isFirstInGroup && isLastInGroup 
          ? '0.75rem' 
          : isFirstInGroup 
            ? '0.75rem 0.75rem 0.75rem 0.25rem' 
            : isLastInGroup 
              ? '0.75rem 0.25rem 0.75rem 0.75rem' 
              : '0.75rem 0.25rem 0.25rem 0.75rem',
        marginTop: isFirstInGroup ? '0.375rem' : '0.125rem',
        marginBottom: isLastInGroup ? '0.375rem' : '0.125rem'  
      };
    }
  };

  // Get message bubble styles
  const bubbleStyles = getBubbleStyles();

  return (
    <div
      className={cn("flex w-full relative overflow-visible", {
        "justify-end": !message.isBot,
        "justify-start": message.isBot,
        "mt-3": isFirstInGroup,
        "mt-0.5": !isFirstInGroup,
        "mb-0.5": !isLastInGroup,
        "mb-1": isLastInGroup
      })}
    >
      {showEmoji && message.isBot && (
        <motion.div
          className="absolute text-blue-300 z-10"
          style={{
            left: message.isBot ? "2.5rem" : "auto",
            right: message.isBot ? "auto" : "2.5rem",
            top: "-8px",
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
          animate={{
            x: emojiPosition.x,
            y: emojiPosition.y,
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.8],
            rotate: [-5, 5, -5],
          }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {Math.random() > 0.5 ? <Server size={14} /> : <Cpu size={14} />}
        </motion.div>
      )}

      {message.isBot && decoration && isFirstInGroup && (
        <motion.div 
          className="absolute -top-2 sm:-top-3 -left-1 text-xs sm:text-sm text-blue-400"
          animate={{ 
            y: [0, -3, 0],
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          {decoration}
        </motion.div>
      )}

      {/* Only show avatar for bot messages at the start of a group */}
      {message.isBot && isFirstInGroup ? (
        <Avatar className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 border border-blue-500/30 shadow-md bg-slate-950 mr-0.5">
          <motion.div
            whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
            transition={{ rotate: { duration: 0.5 } }}
          >
            <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-slate-950 border border-blue-500/20">
              <img
                src="/images/mirai.png"
                alt="AI Assistant"
                className="w-full h-full p-1 object-contain rounded-full"
              />
            </div>
          </motion.div>
        </Avatar>
      ) : message.isBot ? (
        <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 mr-0.5"></div>
      ) : null}

      <motion.div
        initial={message.isBot ? { x: -10, opacity: 0 } : { x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={message.isBot && !isTyping ? { scale: 1.01 } : { scale: 1 }}
        onHoverStart={handleBotMessageHover}
        className={cn("", {
          "w-auto max-w-[85%] ml-auto flex justify-end": !message.isBot,
          "w-auto max-w-[85%] flex flex-initial justify-start": message.isBot,
        })}
      >
        <Card
          className={cn(
            "px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs overflow-hidden",
            {
              "bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-500/50 shadow-md hover:shadow-lg w-auto inline-block": !message.isBot,
              "bg-slate-900/90 backdrop-blur-md text-white border border-blue-400/20 shadow-md hover:shadow-lg w-auto flex flex-col": message.isBot,
            }
          )}
          style={bubbleStyles}
        >
          {/* Enhanced futuristic tech pattern overlay for bot messages */}
          {message.isBot && (
            <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full" 
                style={{ 
                  backgroundImage: `
                    radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 15%),
                    radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 15%),
                    linear-gradient(60deg, transparent 0%, rgba(59, 130, 246, 0.1) 100%)
                  `,
                  backgroundSize: '100% 100%'
                }}
              />
              {/* Animated gradient line */}
              <motion.div 
                className="absolute h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"
                style={{ width: '150%', left: '-25%' }}
                animate={{ 
                  top: ['0%', '100%', '0%'],
                  opacity: [0, 0.5, 0],
                }}
                transition={{ 
                  duration: Math.random() * 5 + 10, 
                  repeat: Infinity,
                  ease: 'linear' 
                }}
              />
            </div>
          )}

          <div className={cn("prose prose-sm break-words leading-relaxed font-normal text-[11px] sm:text-xs overflow-hidden", {
            "prose-invert": true,
            "w-full min-w-0 max-w-full": message.isBot,
            "w-auto max-w-full": !message.isBot,
            "prose-p:my-1.5 prose-p:w-full": true,
            "prose-pre:whitespace-pre-wrap prose-pre:break-words prose-p:text-left prose-p:text-white prose-p:inline-flex prose-p:w-full": message.isBot
          })}>
            {message.isBot && sections ? (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => (
                      <p className="w-full block text-white my-1.5" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto w-full max-w-[calc(100%-16px)] mx-auto pb-1 relative">
                        <div>
                          <table className="text-[10px] sm:text-[11px] border-collapse table-auto border-spacing-0" {...props} />
                        </div>
                      </div>
                    ),
                    td: ({ node, ...props }) => (
                      <td className="border border-blue-400/30 px-1 py-0.5 sm:px-2 sm:py-1 break-words whitespace-normal min-w-[50px] max-w-[150px]" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                      <th className="border border-blue-400/50 bg-slate-800 px-1 py-0.5 sm:px-2 sm:py-1 break-words whitespace-normal min-w-[50px] max-w-[150px]" {...props} />
                    ),
                  }}
                >
                  {sections.mainText}
                </ReactMarkdown>

                {/* Source sections */}
                <div className="space-y-2">
                  {sections.companyDocs && (
                    <MessageSection
                      title="社内文書情報"
                      content={sections.companyDocs}
                      icon={Database}
                    />
                  )}

                  {sections.onlineInfo && (
                    <MessageSection
                      title="オンラインWeb情報"
                      content={sections.onlineInfo}
                      icon={Globe}
                    />
                  )}
                </div>
              </>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => (
                    <p className="w-full block text-white my-1.5" {...props} />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto w-full max-w-[calc(100%-16px)] mx-auto pb-1 relative">
                      <div>
                        <table className="text-[10px] sm:text-[11px] border-collapse table-auto border-spacing-0" {...props} />
                      </div>
                    </div>
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-blue-400/30 px-1 py-0.5 sm:px-2 sm:py-1 break-words whitespace-normal min-w-[50px] max-w-[150px]" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-blue-400/50 bg-slate-800 px-1 py-0.5 sm:px-2 sm:py-1 break-words whitespace-normal min-w-[50px] max-w-[150px]" {...props} />
                  ),
                }}
              >
                {displayedContent}
              </ReactMarkdown>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div 
                className="inline-flex items-center gap-1 text-blue-300 h-4 pl-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "0ms" }}></div>
                <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "150ms" }}></div>
                <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "300ms" }}></div>
              </motion.div>
            )}
          </div>

          {/* Show action buttons only when last in a group */}
          {isLastInGroup && !isTyping && (
            <div className="flex justify-between items-center mt-1.5">
              

              
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}