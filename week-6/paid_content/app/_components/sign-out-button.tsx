"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.refresh();
        router.push("/");
      }}
      className="text-zinc-500 text-xs hover:text-zinc-900 underline"
    >
      로그아웃
    </button>
  );
}
