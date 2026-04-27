"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthInner() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
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
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password: pw })
        : await supabase.auth.signUp({ email, password: pw });
    setBusy(false);
    if (error) return setErr(error.message);
    // 하드 리로드 — 쿠키 + 서버 컴포넌트 한 번에 새로 가져옴
    window.location.href = next;
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex border-b border-zinc-200">
        <button
          onClick={() => setMode("signin")}
          className={`flex-1 py-2 text-sm font-medium ${
            mode === "signin" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-zinc-500"
          }`}
        >
          로그인
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 py-2 text-sm font-medium ${
            mode === "signup" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-zinc-500"
          }`}
        >
          회원가입
        </button>
      </div>
      <form onSubmit={submit} className="card space-y-3">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" placeholder="이메일" />
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} className="input" placeholder="비밀번호 (6자+)" />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "..." : mode === "signin" ? "로그인" : "회원가입"}
        </button>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="card text-zinc-500">불러오는 중...</div>}>
      <AuthInner />
    </Suspense>
  );
}
