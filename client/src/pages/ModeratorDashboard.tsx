import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Chat, Message } from "@shared/moderatorSchema";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Shield,
  Menu
} from "lucide-react";
import { useLocation } from "wouter";
import ChatMsg from "@/components/chat-msg";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mirage } from "ldrs/react";
import 'ldrs/react/Mirage.css'


export default function ModeratorDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [loadAllMessages, setLoadAllMessages] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 1️⃣ All messages (for the “no user selected” view)
  const {
    data: allMessages,
    isLoading: loadingAllMessages,
    error: allMessagesError
  } = useQuery({
    queryKey: ["/api/moderator/messages/all"],
    queryFn: async () => {
      const res = await fetch("/api/moderator/messages/all");
      if (!res.ok) throw new Error("Failed to fetch all messages");
      return (await res.json()) as Message[];
    },
    enabled: loadAllMessages && selectedUserId === null
  });

  // 2️⃣ Users list
  const {
    data: users,
    isLoading: loadingUsers,
    error: usersError
  } = useQuery({
    queryKey: ["/api/moderator/users"],
    queryFn: async () => {
      const res = await fetch("/api/moderator/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return (await res.json()) as User[];
    },
  });

  // 3️⃣ Chats for the selected user
  const {
    data: chats,
    isLoading: loadingChats,
    error: chatsError
  } = useQuery({
    queryKey: ["/api/moderator/users", selectedUserId, "chats"],
    queryFn: async () => {
      const res = await fetch(
        `/api/moderator/users/${selectedUserId}/chats`
      );
      if (!res.ok) throw new Error("Failed to fetch chats");
      return (await res.json()) as Chat[];
    },
    enabled: selectedUserId !== null,
  });

  // 4️⃣ Messages for the selected chat
  const {
    data: chatMessages,
    isLoading: loadingChatMessages,
    error: chatMessagesError
  } = useQuery({
    queryKey: ["/api/moderator/chats", selectedChatId, "messages"],
    queryFn: async () => {
      const res = await fetch(
        `/api/moderator/chats/${selectedChatId}/messages`
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      return (await res.json()) as Message[];
    },
    enabled: selectedChatId !== null,
  });

  // Reset chat selection when user changes
  useEffect(() => {
    setSelectedChatId(null);
  }, [selectedUserId]);

  // Error toasts
  useEffect(() => {
    if (allMessagesError) {
      toast({
        title: "Error fetching all messages",
        description:
          allMessagesError instanceof Error
            ? allMessagesError.message
            : "Unknown error",
        variant: "destructive",
      });
    }
    if (usersError) {
      toast({
        title: "Error fetching users",
        description:
          usersError instanceof Error ? usersError.message : "Unknown error",
        variant: "destructive",
      });
    }
    if (chatsError) {
      toast({
        title: "Error fetching chats",
        description:
          chatsError instanceof Error ? chatsError.message : "Unknown error",
        variant: "destructive",
      });
    }
    if (chatMessagesError) {
      toast({
        title: "Error fetching chat messages",
        description:
          chatMessagesError instanceof Error
            ? chatMessagesError.message
            : "Unknown error",
        variant: "destructive",
      });
    }
  }, [allMessagesError, usersError, chatsError, chatMessagesError, toast]);

  // Auto‐scroll to bottom on new messages
  useLayoutEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [
    allMessages?.length,
    chatMessages?.length
  ]);

  // Filter users by search term
  const filteredUsers = users?.filter((u) =>
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Decide which messages to show in the right panel
  const activeMessages =
    selectedChatId !== null
      ? chatMessages
      : selectedUserId === null
        ? allMessages
        : null;

  return (
    <div className=" h-full md:h-screen flex items-center justify-between bg-gradient-to-br bg-black  md:overflow-hidden">
      <div className=" h-full flex flex-col mx-auto p-5 space-y-5  max-w-[90rem] w-full">
        {/* Header & Navigation */}
        <div className=" relative flex flex-col md:flex-row md:items-center md:justify-between gap-4  bg-noble-black-900 border border-noble-black-800 px-2 py-1 md:p-4 rounded-xl shadow-sm md:h-fit ">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-black text-noble-black-100 border border-noble-black-800 hover:bg-noble-black-100 hover:text-noble-black-900  hover:shadow-md transition-all duration-300 "
          >
            <ArrowLeft className="h-4 w-4 " />
            <span className="font-medium">ホームに戻る</span>
          </Button>

          <div className="hidden md:flex items-center gap-3">
            <Badge
              variant="outline"
              className="px-3 py-1.5 text-sm font-medium inline-flex items-center bg-black text-noble-black-100 border border-noble-black-800 hover:bg-noble-black-100 hover:text-noble-black-900"
            >
              <Shield className="w-4 h-4 mr-1.5 " />
              モデレーター専用
            </Badge>
            <Button
              onClick={() => setLocation("/feedback")}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-700  to-violet-950 shadow-lg transition-all duration-300 hover:opacity-90"
            >
              フィードバックを管理
            </Button>
          </div>

          {isMobile && (
            <div className="md:hidden flex justify-between items-center w-full">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="flex items-center gap-1 px-3 py-2 text-sm rounded-full  text-noble-black-100 hover:shadow-md transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 " />
                <span className="">戻る</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className=" text-noble-black-100 hover:shadow-md transition-all duration-300"
                  >
                    <Menu className="w-5 h-5 " />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 p-2 rounded-xl shadow-lg border "
                >
                  <DropdownMenuLabel className="flex items-center gap-2 ">
                    <Shield className="w-4 h-4" />
                    モデレーターメニュー
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setLocation("/")}
                    className="gap-2 rounded-lg hover:bg-primary/10 my-1 p-2"
                  >
                    ホームに戻る
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocation("/feedback")}
                    className="gap-2 rounded-lg hover:bg-primary/10 my-1 p-2"
                  >
                    フィードバックを管理
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Dashboard Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-5  md:space-y-0 h-fit">
          <div className="flex space-x-4 items-center ">
            <Shield className="h-8 w-8 text-noble-black-100" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-noble-black-100">
                モデレーターダッシュボード
              </h1>
              <p className="text-sm text-noble-black-400">
                ユーザー → チャット → メッセージ 管理
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-end space-x-4  ">
            <div className="flex space-x-2  bg-black border border-noble-black-800 text-noble-black-100   rounded-2xl shadow-sm">
              <div className="flex items-center space-x-2 px-4 py-3">
                <Users className="h-5 w-5  " />

                <div className="text-xs text-text-noble-black-100">ユーザー</div>

              </div>
              <div className="font-semibold px-3 py-2 bg-noble-black-900 rounded-r-2xl">{filteredUsers?.length || 0}</div>
            </div>

            <div className="flex  space-x-2  bg-black border border-noble-black-800 text-noble-black-100   rounded-2xl shadow-sm">
              <div className="flex items-center space-x-2 px-4 py-3">
                <MessageSquare className="h-5 w-5  " />

                <div className="text-xs text-text-noble-black-100">チャット</div>

              </div>
              <div className="font-semibold px-3 py-2 bg-noble-black-900 rounded-r-2xl">{chats?.length || 0}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden items-center justify-center space-y-5 md:space-y-0 md:space-x-5">

          {isMobile && (
            <div className="space-y-4 w-full">
              {/* User Selector */}
              <Select
                onValueChange={(val) => setSelectedUserId(Number(val))}
                value={selectedUserId?.toString() || ""}
              >
                <SelectTrigger className="w-full bg-black text-noble-black-100 border border-noble-black-800 rounded-2xl">
                  <SelectValue placeholder="ユーザーを選択..." />
                </SelectTrigger>
                <SelectContent className="bg-noble-black-900 border border-noble-black-800 text-noble-black-100 rounded-2xl">
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Chat Selector */}
              <Select
                onValueChange={(val) => setSelectedChatId(Number(val))}
                value={selectedChatId?.toString() || ""}
                disabled={!selectedUserId || !chats?.length}
              >
                <SelectTrigger className="w-full bg-black text-noble-black-100 border border-noble-black-800 rounded-2xl" >
                  <SelectValue placeholder="チャットを選択..." />
                </SelectTrigger>
                <SelectContent className="bg-noble-black-900 text-noble-black-100">
                  {chats?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.title ? (c.title.length > 15 ? `${c.title.slice(0, 15)}...` : c.title) : `Chat #${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ─── Users Panel */}
          <Card className="hidden md:flex shadow-md  flex-col h-[80rem] md:h-full overflow-hidden md:w-1/5 border-noble-black-800 rounded-2xl bg-noble-black-900 text-noble-black-100">
            <CardHeader className="bg-black border-noble-black-800 border-b rounded-t-2xl text-noble-black-100">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> ユーザー一覧
              </CardTitle>
              <CardDescription>ユーザーを選択してください</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2 bg-noble-black-900 flex-1 overflow-y-auto ">
              <div className="relative ">
                <Input
                  placeholder="ユーザー検索…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-black text-noble-black-100 border border-noble-black-800"
                />
              </div>
              {loadingUsers ? (
                <div className="flex justify-center items-center h-full p-8">
                  <Mirage
                    size="60"
                    speed="2.5"
                    color="#f2f2f2"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers?.map((u) => (
                    <Button
                      key={u.id}
                      variant={u.id === selectedUserId ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      {u.username}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Chats Panel */}
          <Card className="hidden shadow-md md:w-1/5 w-full md:flex flex-col md:h-full overflow-hidden border-noble-black-800 rounded-2xl bg-noble-black-900 text-noble-black-100">
            <CardHeader className="bg-black border-noble-black-800 border-b rounded-t-2xl text-noble-black-100">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> チャット一覧
              </CardTitle>
              <CardDescription>
                {selectedUserId
                  ? "チャットを選択してください"
                  : "ユーザーを先に選択"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2 flex-1 overflow-y-auto overflow-x-hidden bg-noble-black-900">
              {selectedUserId ? (
                loadingChats ? (
                  <div className="flex justify-center items-center h-full p-8">
                    <Mirage
                      size="60"
                      speed="2.5"
                      color="#f2f2f2"
                    />
                  </div>
                ) : (
                  <>
                    {chats?.length === 0 ? (
                      <div className="p-8 text-center h-full items-center justify-center flex  text-sm text-noble-black-100">
                        このユーザーにはチャットがありません
                      </div>
                    ) : (

                      <div className="space-y-1">
                        {chats?.map((c) => (
                          <Button
                            key={c.id}
                            variant={c.id === selectedChatId ? "secondary" : "ghost"}
                            className="w-full justify-start overflow-hidden "
                            onClick={() => setSelectedChatId(c.id)}
                          >
                            {c.title ? (c.title.length > 15 ? `${c.title.slice(0, 15)}...` : c.title) : `Chat #${c.id}`}
                          </Button>
                        ))}
                      </div>
                    )}

                  </>
                )
              ) : (
                <div className="p-8 text-center h-full items-center justify-center flex  text-sm text-noble-black-100">
                  ユーザーを選択してください
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Messages Panel */}
          <Card className="shadow-md md:w-3/5 w-full  h-[40rem] md:h-full flex flex-col  overflow-hidden border-noble-black-800 rounded-2xl bg-noble-black-900 text-noble-black-100 ">
            <CardHeader className="bg-black border-noble-black-800 border-b rounded-t-2xl text-noble-black-100">
              <CardTitle className="text-noble-black-100 flex items-center gap-2">
                メッセージ履歴
              </CardTitle>
              <CardDescription className="">
                {selectedChatId
                  ? `Chat #${selectedChatId}`
                  : selectedUserId
                    ? "チャットを選択してください"
                    : loadAllMessages
                      ? "全メッセージを表示中"
                      : "全メッセージを読み込むには下のボタンをクリック"}
              </CardDescription>
            </CardHeader>
            <CardContent className=" md:p-4  flex-1 overflow-y-auto">
              {!selectedUserId && !selectedChatId && !loadAllMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Button className="bg-black text-noble-black-100 border border-noble-black-800 hover:bg-noble-black-100 hover:text-noble-black-900" onClick={() => setLoadAllMessages(true)}>
                    全メッセージを読み込む
                  </Button>
                </div>
              ) : selectedUserId && selectedChatId && loadingChatMessages ? (
                <div className="flex justify-center items-center h-full p-8">
                  <Mirage
                    size="60"
                    speed="2.5"
                    color="#f2f2f2"
                  />
                </div>
              ) : activeMessages  && activeMessages.length > 0 ? (
                <div className=" md:pr-2">
                  <div className="space-y-4">
                    {activeMessages.map((msg) => (
                      <div key={msg.id} className=" ">
                        <ChatMsg message={msg} />
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                </div>
              ) : selectedChatId && activeMessages && activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-noble-black-100">
                  メッセージがありません
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-sm text-noble-black-100">
                  チャットを選択してください
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
