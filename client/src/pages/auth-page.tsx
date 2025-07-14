import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { insertUserSchema, loginSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Mail, Lock, User, LogIn, Ticket } from "lucide-react";
import { DotPulse } from 'ldrs/react'
import 'ldrs/react/DotPulse.css'

// Default values shown

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();

  // Use the appropriate schema based on whether the user is logging in or registering
  const form = useForm({
    resolver: zodResolver(isLogin ? loginSchema : insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      inviteToken: "",
    },
  });

  // Reset form and validation when switching between login and registration
  useEffect(() => {
    form.reset();
    form.clearErrors();
  }, [isLogin, form]);

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user) {
    const onSubmit = form.handleSubmit((data) => {
      if (isLogin) {
        // For login, we only need username and password
        const { username, password } = data;
        loginMutation.mutate({ username, password });
      } else {
        // For registration, we need all fields including invite token
        registerMutation.mutate(data);
      }
    });

    return (
      <div className="min-h-screen flex flex-col md:grid md:grid-cols-2 bg-black">
        {/* Bot Logo in Mobile View */}
        <div className="flex flex-col items-center justify-center p-6 md:hidden">
          <img src="/images/mirai.png" alt="桜AI ロゴ" className="w-33 mb-2 drop-shadow-md" />

        </div>

        {/* Authentication Card */}
        <div className="flex flex-col items-center justify-center p-6 md:p-10">
          <img
            src="/images/pclogo.png"
            alt="会社ロゴ"
            className="w-32 mb-8 drop-shadow-sm transition-all duration-300 hover:scale-105"
          />
          <Card className="w-full max-w-md p-8 bg-noble-black-900 backdrop-blur-sm shadow-lg rounded-xl border border-noble-black-800">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-noble-black-100">
                {isLogin ? "お帰りなさい" : "アカウントを作成"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isLogin ? "アカウントにログイン" : "新しいアカウントを作成"}
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-noble-black-100 font-medium">メールアドレス</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            className="pl-10 py-6 h-12 bg-black border-noble-black-800 text-noble-black-100"
                            placeholder="example@email.com"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-noble-black-100 font-medium">パスワード</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            className="pl-10 py-6 h-12 bg-black border-noble-black-800 text-noble-black-100"
                            placeholder="••••••••"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isLogin && (
                  <FormField
                    control={form.control}
                    name="inviteToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=" text-noble-black-100 font-medium">招待トークン</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="text"
                              className="pl-10 py-6 h-12 bg-black border-noble-black-800 text-noble-black-100"
                              placeholder="招待トークンを入力してください"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full py-6 h-12 bg-black hover:bg-noble-black-100 text-noble-black-100 hover:text-noble-black-900 transition-colors duration-300 mt-2 shadow-md"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                >
                  {loginMutation.isPending || registerMutation.isPending ? (
                    <DotPulse
                      size="43"
                      speed="1.3"
                      color="#f2f2f2"
                    />
                  ) : isLogin ? (
                    <div className="flex items-center justify-center gap-2">
                      <LogIn className="h-4 w-4" />
                      <span>ログイン</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <User className="h-4 w-4" />
                      <span>アカウントを作成</span>
                    </div>
                  )}
                </Button>
              </form>
            </Form>
            <div className="mt-6 flex justify-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-noble-black-300 hover:text-noble-black-500"
              >
                {isLogin ? "アカウントが必要ですか？ サインアップ" : "すでにアカウントをお持ちですか？ ログイン"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Branding Section (Hidden in Mobile) */}
        <div className="hidden md:flex flex-col justify-center items-center p-10 bg-noble-black-900 text-[#16213e] rounded-l-2xl">
          <img src="/images/miraimod.png" alt="桜AI ロゴ" className="w-3/4 mb-8 drop-shadow-lg" />
        </div>
      </div>
    );
  }

  return null;
}