//client/src/pages/UserAdd.tsx

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Plus, RefreshCw, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { InviteToken } from "@shared/moderatorSchema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Mirage } from 'ldrs/react'
import 'ldrs/react/Mirage.css'


export default function UserAdd() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();

  const {
    data: tokens,
    isLoading,
    error,
    refetch,
  } = useQuery<InviteToken[]>({
    queryKey: ["/api/user-app-invite-tokens"],
    enabled: !!user,
  });

  const createTokenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user-app-invite-tokens");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-app-invite-tokens"] });
      toast({
        title: "トークンを作成しました",
        description: "新しい招待トークンが生成されました",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "トークン生成に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token).then(
      () => {
        setCopiedToken(token);
        toast({
          title: "コピーしました",
          description: "招待トークンがクリップボードにコピーされました",
        });
        setTimeout(() => setCopiedToken(null), 2000);
      },
      () =>
        toast({
          title: "コピーに失敗しました",
          description: "トークンを手動でコピーしてください",
          variant: "destructive",
        })
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noble-black-900 text-noble-black-100 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 text-noble-black-100 bg-black border-noble-black-800"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-noble-black-100">
                ユーザーアカウント作成用トークン生成
              </h1>
            </div>

          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {/* Invite‑Token Generator */}
          <Card className="p-4 sm:p-6 bg-black border border-noble-black-800 backdrop-blur-sm shadow-md rounded-xl ">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-noble-black-100">
                ユーザーアカウント作成用トークン生成
              </h2>
              <div className="flex flex-col sm:flex-row sm:space-x-2 gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="w-full sm:w-auto text-noble-black-400 bg-noble-black-900 border-0"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  更新
                </Button>
                <Button
                  onClick={() => createTokenMutation.mutate()}
                  disabled={createTokenMutation.isPending}
                  className="w-full sm:w-auto bg-white hover:bg-noble-black-900 text-noble-black-900 hover:text-noble-black-100 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {createTokenMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      新しいトークンを作成
                    </>
                  )}
                </Button>

              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Mirage
                  size="60"
                  speed="2.5"
                  color="#f2f2f2"
                />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-500 rounded-md">
                トークンの読み込み中にエラーが発生しました。
              </div>
            ) : tokens && tokens.length > 0 ? (
              <div className="space-y-4">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="p-4 bg-noble-black-900 rounded-lg border border-noble-black-800 text-noble-black-300 flex justify-between items-center"

                  >
                    <div className="flex-1 truncate font-mono text-sm">
                      {token.token}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(token.token)}
                      className="text-noble-black-100 hover:text-noble-black-100 hover:bg-black"
                    >
                      {copiedToken === token.token ? (
                        "コピー済み"
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          コピー
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-[#f8f5f0] rounded-lg border border-[#e8d9c5] text-center text-muted-foreground">
                有効な招待トークンはありません。
                「新しいトークンを作成」ボタンをクリックして、トークンを作成してください。
              </div>
            )}
          </Card>


        </div>
      </div>
    </div>
  );
}