import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/format";
import { SignOutButton } from "./_components/sign-out-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "초록상회 — 식물 가게 v2",
  description: "이미지 업로드 + 토스 결제 + 마이페이지가 추가된 쇼핑몰 v2",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = isAdmin(user?.email);

  return (
    <html lang="ko">
      <body className="min-h-screen">
        <header className="border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">🌱 초록상회 v2</Link>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/cart" className="text-zinc-700 hover:text-zinc-900">장바구니</Link>
              {user ? (
                <>
                  <Link href="/mypage" className="text-zinc-700 hover:text-zinc-900">마이페이지</Link>
                  {admin && (
                    <Link href="/admin" className="rounded bg-zinc-900 px-2 py-1 text-white text-xs">관리자</Link>
                  )}
                  <span className="text-zinc-500 text-xs">{user.email}</span>
                  <SignOutButton />
                </>
              ) : (
                <Link href="/auth" className="btn-primary py-1.5">로그인</Link>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-zinc-400">
          week-6 / shopping_mall_v2 — Next.js + Supabase + 토스페이먼츠 + ImageKit
        </footer>
      </body>
    </html>
  );
}
