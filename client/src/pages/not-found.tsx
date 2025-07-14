import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <Card className="w-full max-w-md mx-4 bg-noble-black-900 text-noble-black-100 border border-noble-black-800 ">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-600 bg-red-950/50 rounded-full p-1" />
            <h1 className="text-2xl font-bold text-noble-black-100">404 ページが見つかりません</h1>
          </div>

          <p className="mt-4 text-sm text-noble-black-500">
            ルーターにページを追加し忘れていませんか？
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
