"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const supabase = createClient();
    const fn =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password: pw })
        : supabase.auth.signUp({ email, password: pw });
    const { error } = await fn;
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    // 하드 리로드 — 쿠키 + 서버 컴포넌트 한 번에 새로 가져옴
    window.location.href = "/";
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex border-b border-zinc-200">
        <button
          onClick={() => setMode("signin")}
          className={`flex-1 py-2 text-sm font-medium ${
            mode === "signin"
              ? "border-b-2 border-emerald-600 text-emerald-700"
              : "text-zinc-500"
          }`}
        >
          로그인
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 py-2 text-sm font-medium ${
            mode === "signup"
              ? "border-b-2 border-emerald-600 text-emerald-700"
              : "text-zinc-500"
          }`}
        >
          회원가입
        </button>
      </div>

      <form onSubmit={submit} className="card space-y-3">
        <div>
          <label className="block text-xs text-zinc-600 mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-600 mb-1">비밀번호 (6자 이상)</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            minLength={6}
            className="input"
          />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "..." : mode === "signin" ? "로그인" : "회원가입"}
        </button>
      </form>

      <p className="mt-3 text-xs text-zinc-500 text-center">
        회원가입 시 Supabase가 이메일 인증을 요구할 수 있습니다.
      </p>
    </div>
  );
}
