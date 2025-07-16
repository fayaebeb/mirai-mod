import { Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui/avatar";
import { Card } from "./ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";
import React from "react";

interface MessageWithBot extends Omit<Message, 'isBot'> {
  isBot: boolean;
  username?: string; // username is optional (only on user messages)
}

export function getDbidTag(dbid?: string): { label: string; className: string, notBotClassName: string } {
  switch (dbid) {
    case "db1":
      return { label: "DB1", className: "bg-pink-950 text-pink-500", notBotClassName: "bg-pink-200 text-pink-800"  };
    case "db2":
      return { label: "DB2", className: "bg-blue-950 text-blue-500", notBotClassName: "bg-blue-200 text-blue-800" };
    case "db3":
      return { label: "DB3", className: "bg-green-950 text-green-500", notBotClassName: "bg-green-200 text-green-800" };
    default:
      return { label: dbid || "不明", className: "bg-gray-300 text-gray-700", notBotClassName: "bg-gray-300 text-gray-700" };
  }
}

export default function ChatMessage({ message }: { message: MessageWithBot }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMessage = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest("DELETE", `/api/messages/${messageId}`);
    },
    onSuccess: () => {
      // Extract the session ID from the current URL or component props
      const sessionIdFromURL = window.location.pathname.split('/').pop() || '';
      // Invalidate all queries related to messages for proper cache updates
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      // Also invalidate specific session query if available
      if (sessionIdFromURL) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", sessionIdFromURL] });
      }


      toast({
        title: "メッセージを削除しました",
        description: "メッセージが正常に削除されました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "メッセージの削除に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    },
  });

  return (
    <TooltipProvider>
      <div
        className={cn("flex gap-3 relative group pb-2", {
          "justify-end": !message.isBot,
        })}
      >
        {message.isBot && (
          <Avatar>
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 mr-0.5 bg-black border border-noble-black-500/20 rounded-full text-noble-black-100 flex items-center justify-center">ミ</div>
          </Avatar>
        )}

        <Card
          className={cn("px-4 py-3 max-w-[80%] rounded-lg relative flex flex-col gap-2", {
            "bg-noble-black-100  text-noble-black-900 border border-noble-black-900 shadow-md": !message.isBot,
            "bg-black backdrop-blur-md text-noble-black-300 border border-noble-black-900": message.isBot,
          })}
        >
          <div className="break-words ">
            {message.isBot ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>

          <div className="flex justify-between items-center space-x-2">
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger className="text-noble-black-400 hover:text-red-600 cursor-pointer" asChild>
                    
                      <Trash2 className="h-4 w-4 " />
                    
                  </AlertDialogTrigger>
                </TooltipTrigger>


              </Tooltip>

              <AlertDialogContent className="bg-black border border-neutral-800 text-noble-black-100">
                <AlertDialogHeader>
                  <AlertDialogTitle>メッセージを削除</AlertDialogTitle>
                  <AlertDialogDescription className="text-noble-black-400">
                    本当にこのメッセージを削除しますか？この操作は元に戻せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-black text-noble-black-100 border border-noble-black-900 hover:bg-noble-black-800 hover:text-noble-black-100">キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMessage.mutate(message.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    削除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {message.username && !message.isBot && (
              <div className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-full text-gray-600 font-medium shadow-sm">
                {message.username.split('@')[0]}
              </div>
            )}
            {message.dbid && (() => {
              const tag = getDbidTag(message.dbid);
              return (
                <div
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm",
                    message.isBot ? tag.className : tag.notBotClassName
                  )}
                >
                  {tag.label}
                </div>
              );
            })()}
          </div>


        </Card>
      </div>
    </TooltipProvider>
  );
}