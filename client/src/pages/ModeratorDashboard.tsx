import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@shared/schema";
import {
  ArrowLeft,
  UserIcon,
  SearchIcon,
  MessageSquare,
  Users,
  Shield, ChevronRight, ChevronDown, StickyNote, CheckSquare, } from "lucide-react";
import { useLocation } from "wouter";
import ChatMsg from "@/components/chat-msg";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from 'framer-motion';

// Helper: extract raw email (or username) from sessionId
function getRawEmail(sessionId: string): string {
  const m = sessionId.match(/^(?:goal|notes|user)_[0-9]+_(.+)$/);
  return m ? m[1] : sessionId;
}

          // Helper: group sessions by email
function groupSessionsByEmail(sessions: string[]): Record<string, { prefix: string; sessionId: string }[]> {
  const sortOrder: Record<string, number> = { user: 0, notes: 1, goal: 2 };

  return sessions.reduce<Record<string, { prefix: string; sessionId: string }[]>>((acc, sessionId) => {
    const match = sessionId.match(/^(goal|notes|user)_(\d+)_(.+)$/);
    if (!match) return acc;
    const [, prefix, , rawEmail] = match;
    if (!acc[rawEmail]) acc[rawEmail] = [];
    acc[rawEmail].push({ prefix, sessionId });
    // Sort immediately if you prefer real-time ordering
    acc[rawEmail].sort((a, b) => sortOrder[a.prefix] - sortOrder[b.prefix]);
    return acc;
  }, {});
}


          export default function ModeratorDashboard() {
            const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
            const [searchTerm, setSearchTerm] = useState("");
            const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});
            const { toast } = useToast();
            const [, setLocation] = useLocation();
            const isMobile = useIsMobile();
            const bottomRef = useRef<HTMLDivElement | null>(null);

            // Fetch session IDs (typed)
            const {
              data: sessionIds,
              isLoading: isLoadingSessionIds,
              error: sessionIdsError
            } = useQuery<string[]>({
              queryKey: ["/api/moderator/sessions"],
              queryFn: async (): Promise<string[]> => {
                const res = await fetch("/api/moderator/sessions");
                if (!res.ok) throw new Error("Failed to fetch sessions");
                return res.json();
              },
              retry: 1
            });

            // Fetch messages for selected session (typed)
            const {
              data: messages,
              isLoading: isLoadingMessages,
              error: messagesError
            } = useQuery<Message[]>({
              queryKey: ["/api/moderator/messages", selectedSessionId],
              queryFn: async (): Promise<Message[]> => {
                const res = await fetch(`/api/moderator/messages/${selectedSessionId}`);
                if (!res.ok) throw new Error("Failed to fetch messages");
                return res.json();
              },
              enabled: !!selectedSessionId,
              retry: 1
            });

            // Auto-scroll on new messages
            useEffect(() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, [messages]);

            // Error notifications
            useEffect(() => {
              if (sessionIdsError) {
                toast({
                  title: "Error fetching sessions",
                  description:
                    sessionIdsError instanceof Error
                      ? sessionIdsError.message
                      : "Unknown error",
                  variant: "destructive"
                });
              }
              if (messagesError) {
                toast({
                  title: "Error fetching messages",
                  description:
                    messagesError instanceof Error
                      ? messagesError.message
                      : "Unknown error",
                  variant: "destructive"
                });
              }
            }, [sessionIdsError, messagesError, toast]);

            // Format relative timestamps
            const formatTimestamp = (timestamp: string) => {
              const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });
              const now = Date.now();
              let diff = Math.floor((new Date(timestamp).getTime() - now) / 1000);
              const divisions = [
                { amount: 60, unit: "seconds" },
                { amount: 60, unit: "minutes" },
                { amount: 24, unit: "hours" },
                { amount: 7, unit: "days" },
                { amount: 4.34524, unit: "weeks" },
                { amount: 12, unit: "months" },
                { amount: Infinity, unit: "years" }
              ] as const;
              for (const { amount, unit } of divisions) {
                if (Math.abs(diff) < amount) {
                  return rtf.format(Math.round(diff), unit.slice(0, -1) as Intl.RelativeTimeFormatUnit);
                }
                diff /= amount;
              }
              return rtf.format(Math.round(diff), "year");
            };

            // Filter and group by email
            const filtered = sessionIds?.filter((id: string) =>
              id.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const groupedByEmail = filtered ? groupSessionsByEmail(filtered) : {};

            return (
              <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100">
                <div className="container mx-auto px-4 py-6">
                  {/* Top Nav */}
                  <div className="flex items-center justify-between mb-6">
                    <Button variant="outline" onClick={() => setLocation("/")}> <ArrowLeft className="h-4 w-4" /> ホームに戻る </Button>
                    <Badge variant="secondary" className="flex items-center gap-1"> <Shield className="w-4 h-4" /> モデレーター専用 </Badge>
                  </div>

                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <h1 className="flex items-center gap-2 text-3xl font-bold whitespace-nowrap">
                      <Shield className="h-7 w-7 text-primary" />
                      モデレーターダッシュボード
                    </h1>
                    
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* User List */}
                    <Card className="md:col-span-4 shadow-md">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" /> ユーザー一覧
                        </CardTitle>
                        <CardDescription>チャット履歴を表示するには、ユーザーを選択してください</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Search */}
                        <div className="relative mb-4">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="ユーザーを検索..."
                            className="pl-9 w-full rounded-md border"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                          />
                        </div>

                        {isLoadingSessionIds ? (
                          <div className="flex justify-center items-center p-8">
                            <div className="animate-pulse flex flex-col items-center">
                              <Users className="h-8 w-8 text-muted mb-2" />
                              <p className="text-muted-foreground">読み込み中...</p>
                            </div>
                          </div>
                        ) : Object.keys(groupedByEmail).length ? (
                          <ScrollArea className="h-[calc(100vh-300px)] pr-2">
                            <div className="space-y-2">
                              {Object.entries(groupedByEmail).map(([email, sessions]) => {
                                const isExpanded = expandedEmails[email];
                                return (
                                  <div key={email}>
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-between"
                                      onClick={() =>
                                        setExpandedEmails(prev => ({ ...prev, [email]: !prev[email] }))
                                      }
                                    >
                                      <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4" />
                                        <span>{email}</span>
                                      </div>
                                      <ChevronRight
                                        className={`h-4 w-4 transition-transform duration-300 ${
                                          isExpanded ? 'rotate-90' : ''
                                        }`}
                                      />
                                    </Button>

                                    <AnimatePresence initial={false}>
                                      {isExpanded && (
                                        <motion.div
                                          key="content"
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                                          className="overflow-hidden ml-6 mt-1 space-y-1"
                                        >
                                          {sessions.map(({ prefix, sessionId }) => {
                                            const icon = prefix === 'user'
                                              ? <MessageSquare className="w-4 h-4 mr-2" />
                                              : prefix === 'notes'
                                              ? <StickyNote className="w-4 h-4 mr-2" />
                                              : <CheckSquare className="w-4 h-4 mr-2" />;
                                            const label = prefix === 'user' ? 'チャット' : prefix === 'notes' ? 'ノート' : 'タスク';

                                            return (
                                              <Button
                                                key={sessionId}
                                                variant={selectedSessionId === sessionId ? 'secondary' : 'ghost'}
                                                className="w-full justify-start text-sm flex items-center gap-2"
                                                onClick={() => setSelectedSessionId(sessionId)}
                                              >
                                                {icon}
                                                {label}
                                              </Button>
                                            );
                                          })}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg">
                            <Users className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">ユーザーが見つかりませんでした</p>
                          </div>
                        )}
                      </CardContent>
                      {filtered?.length ? (
                        <CardFooter className="bg-muted/30 text-center">
                          <span>{filtered.length} 人のユーザー</span>
                        </CardFooter>
                      ) : null}
                    </Card>

          {/* Chat Panel (unchanged) */}
          <Card className="md:col-span-8 border-0 shadow-md">
            <CardHeader className="bg-muted/30 border-b">
              {selectedSessionId ? (
                <CardTitle className="flex items-center gap-2 flex-nowrap overflow-x-auto">
                  <MessageSquare className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap shrink-0">チャット履歴:</span>
                  <Badge
                    variant="secondary"
                    className="ml-2 px-3 py-1 text-base h-auto leading-tight flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span className="text-base">
                      {selectedSessionId ? getRawEmail(selectedSessionId) : ""}
                    </span>
                  </Badge>
                  {messages && (
                    <Badge
                      variant="outline"
                      className="ml-auto px-2 py-0 text-xs whitespace-nowrap shrink-0"
                    >
                      {messages.length} メッセージ
                    </Badge>
                  )}
                </CardTitle>
              ) : (
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  チャット履歴
                </CardTitle>
              )}
              {!selectedSessionId && (
                <CardDescription>
                  左側のユーザー一覧から選択して、チャット履歴を表示してください
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-4 h-[calc(100vh-200px)]">
              {!selectedSessionId ? (
                <div className="flex flex-col items-center justify-center h-full border rounded-lg border-dashed">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-2">
                    チャット履歴を表示するには、ユーザーを選択してください
                  </p>
                  <Badge variant="outline" className="mt-2">
                    左側のユーザー一覧から選択
                  </Badge>
                </div>
              ) : isLoadingMessages ? (
                <div className="flex justify-center items-center p-8 h-full">
                  <div className="animate-pulse flex flex-col items-center">
                    <MessageSquare className="h-8 w-8 text-muted mb-2" />
                    <p className="text-muted-foreground">メッセージを読み込み中...</p>
                  </div>
                </div>
              ) : messages && messages.length > 0 ? (
                <ScrollArea className="h-full pr-2">
                  <div className="space-y-4">
                    {messages.map((message: Message) => (
                      <div key={message.id} className="group relative">
                        <ChatMsg message={message} />
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-full border rounded-lg border-dashed">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">このユーザーのメッセージが見つかりませんでした</p>
                </div>
              )}
            </CardContent>
            {selectedSessionId && messages && messages.length > 0 && (
              <CardFooter className="bg-muted/30 border-t px-4 py-1 text-xs text-muted-foreground justify-between">
                <span>最初のメッセージ: {formatTimestamp(messages[0].timestamp.toString())}</span>
                <span>最新のメッセージ: {formatTimestamp(messages[messages.length - 1].timestamp.toString())}</span>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}