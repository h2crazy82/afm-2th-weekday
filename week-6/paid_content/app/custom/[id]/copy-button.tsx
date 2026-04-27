"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          alert("복사 실패 — 브라우저 권한 확인");
        }
      }}
      className="text-xs px-3 py-1 rounded border border-zinc-300 bg-white hover:bg-zinc-50"
    >
      {copied ? "✓ 복사됨" : "📋 본문 복사"}
    </button>
  );
}
