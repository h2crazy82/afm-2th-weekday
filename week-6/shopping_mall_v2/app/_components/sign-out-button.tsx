"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  return (
    <button
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/";
      }}
      className="text-zinc-500 text-xs hover:text-zinc-900 underline"
    >
      로그아웃
    </button>
  );
}
