import { Message } from "@shared/moderatorSchema";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui/avatar";
import { Card } from "./ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, FileText, Globe, Tag, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Badge } from "./ui/badge";

const formatTimestamp = (timestamp: string | Date) => {
  try {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ja,
    });
  } catch {
    return "日付エラー";
  }
};


// Helper function to parse message content into sections
const parseMessageContent = (content: string) => {
  const sections = { mainText: "", companyDocs: "", onlineInfo: "" };

  const companyMarker = "### 社内文書情報:";
  const onlineMarker = "### オンラインWeb情報:";

  const companyIndex = content.indexOf(companyMarker);
  const onlineIndex = content.indexOf(onlineMarker);

  if (companyIndex !== -1 && (onlineIndex === -1 || companyIndex < onlineIndex)) {
    sections.mainText = content.slice(0, companyIndex).trim();
    if (onlineIndex !== -1) {
      sections.companyDocs = content.slice(companyIndex + companyMarker.length, onlineIndex).trim();
      sections.onlineInfo = content.slice(onlineIndex + onlineMarker.length).trim();
    } else {
      sections.companyDocs = content.slice(companyIndex + companyMarker.length).trim();
    }
  } else if (onlineIndex !== -1) {
    sections.mainText = content.slice(0, onlineIndex).trim();
    sections.onlineInfo = content.slice(onlineIndex + onlineMarker.length).trim();
  } else {
    sections.mainText = content.trim();
  }

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
      className="mt-3 rounded-lg border border-noble-black-800 overflow-hidden transition-all duration-200"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-2 hover:bg-noble-black-900 rounded-t-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-noble-black-200" />
            <span className="text-sm font-medium text-noble-black-200">{title}</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-noble-black-200" />
          </motion.div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-3 bg-noble-black-900 text-noble-black-300"
        >
          <div className="  max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// Get badge variant based on category
const getCategoryBadgeVariant = (category: string) => {
  switch (category) {
    case "SELF":
      return "default"; // Default blue-ish style
    case "PRIVATE":
      return "secondary"; // Gray style
    case "ADMINISTRATIVE":
      return "destructive"; // Red style
    default:
      return "default";
  }
};

export default function ChatMsg({ message }: { message: Message }) {

  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiPosition, setEmojiPosition] = useState({ x: 0, y: 0 });
  const [decoration, setDecoration] = useState<string | null>(null);



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
  const sections = message.isBot ? parseMessageContent(message.content) : null;

  return (
    <div
      className={cn("flex w-full my-4 relative", {
        "justify-end": !message.isBot,
        "justify-start": message.isBot
      })}
    >



      {message.isBot && (
         
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 mr-0.5 bg-black border border-noble-black-500/20 rounded-full text-noble-black-100 flex items-center justify-center">み</div>
       
      )}

      <motion.div
        initial={message.isBot ? { x: -10, opacity: 0 } : { x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={message.isBot ? { scale: 1.02 } : { scale: 1 }}
        onHoverStart={handleBotMessageHover}
        className={cn("rounded-xl", {
          "max-w-[85%] sm:max-w-[75%] ml-auto self-end": !message.isBot,
          "max-w-[90%] sm:max-w-[90%] mr-auto self-start ml-2 sm:ml-3": message.isBot,
        })}
      >
        <Card
          className={cn(
            "px-2 py-1.5 sm:px-4 sm:py-3 text-sm sm:text-base",
            {
              "bg-noble-black-100  text-noble-black-900 border border-noble-black-900 shadow-md": !message.isBot,
              "bg-black backdrop-blur-md text-noble-black-300 border border-noble-black-900": message.isBot,
            }
          )}
        >
          {/* Display category badge */}



          <div className=" break-words font-medium max-w-none w-full">


            {message.isBot && sections ? (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-noble-black-100 hover:text-noble-black-400 underline"
                      >
                        {children}
                      </a>
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto w-full">
                        <table className="text-[11px] sm:text-sm border-collapse w-full min-w-[400px] text-noble-black-100" {...props} />
                      </div>
                    ),
                    td: ({ node, ...props }) => (
                      <td className="border border-noble-black-800 text-noble-black-100 px-1 py-0.5 sm:px-2 sm:py-1" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                      <th className="border border-noble-black-800 bg-black px-1 py-0.5 sm:px-2 sm:py-1 text-noble-black-100" {...props} />
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
                      icon={FileText}
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
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-noble-black-100 hover:text-noble-black-400 underline"
                    >
                      {children}
                    </a>
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto w-full">
                      <table className="text-[11px] sm:text-sm border-collapse w-full min-w-[400px] text-noble-black-100" {...props} />
                    </div>
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-noble-black-800 px-1 py-0.5 sm:px-2 sm:py-1 text-noble-black-100" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-noble-black-800 bg-black px-1 py-0.5 sm:px-2 sm:py-1 text-noble-black-100" {...props} />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {message.createdAt && (
            <div className={`text-[9px] sm:text-[10px] ${message.isBot ? "text-noble-black-100" : "text-noble-black-900"}  mt-1 text-right`}>
              {formatTimestamp(message.createdAt)}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}