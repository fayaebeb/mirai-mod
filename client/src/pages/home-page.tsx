import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import ChatInterface from "@/components/chat-interface";
import { useEffect, useState } from "react";
import { FileText, ShieldAlert, LogOut, Wifi, WifiOff, Home, Settings, User, UserPlus } from "lucide-react";
import { useLocation } from "wouter"; // ✅ Correct router for your stack
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";



export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation(); // ✅ Use Wouter for navigation
  const isMobile = useIsMobile();

  // Extract username before '@' from email
  const displayName = user?.username?.split("@")[0];

  // Manage Network Status
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#7D2E3A] to-[#5D1E2A]">
      {/* ヘッダーセクション with Subtle Drop Shadow */}
      <header className="relative border-b bg-gradient-to-r from-[#f8eee2] to-[#f5e8d8] shadow-md sticky top-0 z-10 h-[7rem] sm:h-[8rem]">
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 max-w-screen-xl mx-auto w-full h-full">

          {/* LEFT: Pacific Logo */}
          <div className="flex-shrink-0">
            <img 
              src="/images/pclogo.png" 
              alt="Pacific Consultants Logo"
              className="h-5 sm:h-8"
            />
          </div>

          {/* RIGHT: Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-[70vw] sm:max-w-none">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="flex items-center gap-1 sm:gap-2 bg-white/80 hover:bg-white transition-colors whitespace-nowrap px-2 sm:px-3"
            >
              <UserPlus className="h-4 w-4 text-purple-600" />
              <span className="hidden sm:inline text-purple-800">招待管理</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/moderator")}
              className="flex items-center gap-1 sm:gap-2 bg-white/80 hover:bg-white transition-colors whitespace-nowrap px-2 sm:px-3"
            >
              <ShieldAlert className="h-4 w-4 text-orange-600" />
              <span className="hidden sm:inline text-orange-800">モデレーター</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/files")}
              className="flex items-center gap-1 sm:gap-2 bg-white/80 hover:bg-white transition-colors whitespace-nowrap px-2 sm:px-3"
            >
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline text-blue-800">ファイル履歴</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="flex items-center bg-white/90 hover:bg-white/100 transition-colors text-red-600 px-2 sm:px-3"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* CENTER: Absolutely positioned Sakura logo */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none text-center">
          <img
            src="/images/miraimod.png"
            alt="Sakura AI Logo"
            className="h-[5rem] sm:h-[7rem] w-auto drop-shadow-sm"
          />


        </div>
      </header>



      {/* Main Content with Improved Visuals */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="relative">
          {/* Decorative Elements */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-32 h-12 bg-[#f8eee2] rounded-full blur-2xl opacity-20"></div>

          {/* Chat Interface Container with Enhanced Styling */}
          <div className="bg-gradient-to-br from-[#f7e6d0] to-[#f5e1cb] rounded-2xl shadow-lg overflow-hidden max-w-3xl mx-auto border border-[#e8d6c0]">
            {/* Optional Chat Title */}
            <div className="px-4 py-3 bg-[#f2d9be]/70 border-b border-[#e8d6c0] flex justify-between items-center">
              <h2 className="text-[#7D2E3A] font-medium flex items-center gap-2">
                <img src="/images/mirai.png" alt="Icon" className="w-8 h-8" />
                ミライAIデータ入力パネル
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white/50 text-xs font-normal">
                  {isOnline ? "接続済み" : "オフライン"}
                </Badge>
              </div>
            </div>

            {/* Chat Interface Component */}
            <div className={isMobile ? "p-3" : "p-5"}>
              <ChatInterface />
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-4 px-6 bg-[#471a23] text-white/70 text-xs text-center">
        <div className="container mx-auto">
          <p>© 2025 ミライAI</p>
        </div>
      </footer>
    </div>
  );
}