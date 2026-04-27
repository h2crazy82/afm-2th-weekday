import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./_components/sign-out-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "프롬프트 마켓 — AI 콘텐츠 템플릿",
  description: "라라에듀 콘텐츠 제작자용 AI 프롬프트 템플릿. 결제 후 본문 열람.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ko">
      <body className="min-h-screen">
        <header className="border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">📚 프롬프트 마켓</Link>
            <div className="flex items-center gap-3 text-sm">
              {user ? (
                <>
                  <Link href="/mypage" className="text-zinc-700 hover:text-zinc-900">내 구매 이력</Link>
                  <span className="text-zinc-500 text-xs">{user.email}</span>
                  <SignOutButton />
                </>
              ) : (
                <Link href="/auth" className="btn-primary py-1.5">로그인</Link>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 py-8 text-center text-xs text-zinc-400">
          week-6 / paid_content — Next.js + Supabase + 토스페이먼츠
        </footer>
      </body>
    </html>
  );
}
