import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import ChatInterface from "@/components/chat-interface";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FileText,
  ShieldAlert,
  LogOut,
  Wifi,
  User,
  Menu,
  WifiOff,
  Home,
  AlignJustify,
  Settings,
  UserPlus,
  SortAsc,
  Database,
  Search, ShieldPlus
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Spotlight } from "@/components/ui/spotlight";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const displayName = user?.username?.split("@")[0] || "";
  const { toast } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isMobile = useIsMobile();
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("oldest");
  const [dbFilter, setDbFilter] = useState<"data" | "db1" | "db2" | "all">(
    "all",
  );
  const [usernameFilter, setUsernameFilter] = useState<string>("");
  const [messageSearch, setMessageSearch] = useState<string>("");

  const renderHeader = () => (
    <header className="sticky top-0  border-b border-noble-black-900 bg-black shadow-sm z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center min-w-[80px] justify-start">
          <motion.div whileHover={{ scale: 1.05 }}>
            <img
              src="/images/pclogo.png"
              alt="Company Logo"
              className="h-5 sm:h-10"
            />
          </motion.div>
        </div>

        {/* Center: Sakura Logo */}
        <div className="flex justify-center flex-1">
          <div className="text-xl font-semibold z-20 h-16 sm:h-24 flex items-center justify-center cursor-pointer text-noble-black-100">みらい</div>
        </div>

        {/* Right: Username + AlignJustify */}
        <div className="flex items-center min-w-[80px] justify-end gap-2">
          {/* Username Display */}
          <div className="border border-noble-black-800 bg-noble-black-900  text-noble-black-100 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {displayName}
            </motion.span>

            {/* Badge - hidden on small screens */}
            <Badge className="hidden sm:inline bg-white text-noble-black-900 border hover:text-noble-black-100 rounded-full px-2 py-0.5 text-xs">
              モデレーター
            </Badge>
          </div>

          {/* AlignJustify Menu - moved inside flex container */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="group text-noble-black-100 border border-noble-black-800 bg-noble-black-900 shadow-sm hover:shadow-md hover:bg-noble-black-100 focus:ring-2 transition-transform duration-200 ease-in-out will-change-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <AlignJustify className="h-5 w-5 text-noble-black-100 group-hover:text-noble-black-900" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-64 sm:w-72 border-noble-black-800 bg-noble-black-900 text-noble-black-100 backdrop-blur-sm"
            >
              <DropdownMenuLabel className="text-noble-black-100 text-base font-semibold px-4 py-2">
                メニュー
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-noble-black-800" />

              <Link href="/admin">
                <DropdownMenuItem className="cursor-pointer text-noble-black-100 hover:bg-noble-black-100 hover:text-noble-black-900 px-4 py-3 text-base">
                  <ShieldPlus className="h-12 w-12  hover:bg-noble-black-900" />
                  モデレータ招待
                </DropdownMenuItem>
              </Link>

              <Link href="/useradd">
                <DropdownMenuItem className="cursor-pointer text-noble-black-100 hover:bg-noble-black-100 hover:text-noble-black-900 px-4 py-3 text-base">
                  <UserPlus className="h-8 w-8  hover:bg-noble-black-900" />
                  ユーザー招待
                </DropdownMenuItem>
              </Link>

              <Link href="/moderator">
                <DropdownMenuItem className="cursor-pointer text-noble-black-100 hover:bg-noble-black-100 hover:text-noble-black-900 px-4 py-3 text-base">
                  <ShieldAlert className="h-8 w-8  hover:bg-noble-black-900" />
                  モデレーター
                </DropdownMenuItem>
              </Link>

              <Link href="/files">
                <DropdownMenuItem className="cursor-pointer text-noble-black-100 hover:bg-noble-black-100 hover:text-noble-black-900 px-4 py-3 text-base">
                  <FileText className="h-8 w-8  hover:bg-noble-black-900" />
                  ファイル履歴
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator className="bg-noble-black-800" />

              <DropdownMenuItem
                onClick={() => setShowLogoutConfirm(true)}
                disabled={logoutMutation.isPending}
                className="cursor-pointer text-noble-black-100 hover:bg-noble-black-100 hover:text-noble-black-900  transition-colors  px-4 py-3 text-base"
              >
                <LogOut className="h-8 w-8  hover:bg-noble-black-900" />
                <motion.span
                  animate={{
                    scale: logoutMutation.isPending ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: logoutMutation.isPending ? Infinity : 0,
                  }}
                >
                  ログアウト
                </motion.span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );

  const renderLogoutDialog = () => (
    <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
      <AlertDialogContent className="mx-auto max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl rounded-xl p-6 bg-black border border-noble-black-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-noble-black-100 text-lg font-semibold">
            ログアウトしますか？
          </AlertDialogTitle>
          <AlertDialogDescription className="text-noble-black-400 mt-1">
            ログアウトすると、セッションが終了します。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-black text-noble-black-100 border border-noble-black-900  hover:bg-noble-black-800 hover:text-noble-black-100">
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => logoutMutation.mutate()}
            className="bg-red-600 hover:bg-red-700 text-white border border-red-700"
          >
            ログアウト
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <>
      {renderHeader()}
      {renderLogoutDialog()}

      <main className="h-full container mx-auto px-4 py-6  bg-noble-black-900 relative overflow-hidden">
          <Spotlight />

        <div className="relative z-40">

          <div className="  rounded-2xl shadow-xl overflow-hidden max-w-3xl mx-auto border border-noble-black-800 z-50 ">
            {/* Responsive Header Row */}
            <div className="px-4 py-4 sm:px-6 bg-black border-b border-noble-black-800 overflow-x-auto z-50">
              <div className="flex flex-nowrap items-center gap-3 sm:gap-6 min-w-max">
                {/* Title */}
                <h2 className="text-base sm:text-lg font-semibold text-noble-black-100 flex items-center gap-2 whitespace-nowrap shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 mr-0.5 bg-noble-black-900 border border-noble-black-500/20 rounded-full text-noble-black-100 flex items-center justify-center">み</div>

                  データ入力パネル
                </h2>

                <div className="relative shrink-0">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="メッセージ検索"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="w-[200px] pl-9 bg-noble-black-900 border border-noble-black-800 text-noble-black-100 shadow-sm rounded-md text-sm py-2 px-3"
                  />
                </div>

                {/* Filter Dropdown */}
                <div className="relative shrink-0">
                  <Database className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Select
                    value={dbFilter}
                    onValueChange={(val) => setDbFilter(val as typeof dbFilter)}
                  >
                    <SelectTrigger className="w-[150px] pl-9 bg-noble-black-900 border border-noble-black-800 text-noble-black-100 shadow-sm rounded-md text-sm">
                      <SelectValue placeholder="データベース" />
                    </SelectTrigger>
                    <SelectContent className="bg-noble-black-900 border border-noble-black-800 text-noble-black-100">
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="data">data</SelectItem>
                      <SelectItem value="db1">db1</SelectItem>
                      <SelectItem value="db2">db2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Dropdown */}
                <div className="relative shrink-0">
                  <SortAsc className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Select
                    value={sortBy}
                    onValueChange={(value) =>
                      setSortBy(value as "latest" | "oldest")
                    }
                  >
                    <SelectTrigger className="w-[130px] pl-9 bg-noble-black-900 border border-noble-black-800 text-noble-black-100 shadow-sm rounded-md text-sm ">
                      <SelectValue placeholder="並び替え" />
                    </SelectTrigger>
                    <SelectContent className="bg-noble-black-900 border text-noble-black-100 border-noble-black-800">
                      <SelectItem value="latest">最新順</SelectItem>
                      <SelectItem value="oldest">古い順</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative shrink-0">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="ユーザー名"
                    value={usernameFilter}
                    onChange={(e) => setUsernameFilter(e.target.value)}
                    className="w-[180px] pl-9 bg-noble-black-900 border border-noble-black-800 text-noble-black-100 shadow-sm rounded-md text-sm py-2 px-3"
                  />
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className={`${isMobile ? "p-3" : "p-6"} bg-black `}>
              <ChatInterface
                sortBy={sortBy}
                dbFilter={dbFilter}
                usernameFilter={usernameFilter}
                messageSearch={messageSearch}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-noble-black-800 py-3 bg-black backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <motion.p
            className="text-xs text-noble-black-100"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            桜AI - モデレーター版
          </motion.p>
        </div>
      </footer>
    </>
  );
}