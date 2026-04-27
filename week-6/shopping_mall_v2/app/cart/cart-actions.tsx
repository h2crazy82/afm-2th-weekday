"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CartActions({ itemId, quantity }: { itemId: number; quantity: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(delta: number) {
    const next = Math.max(1, quantity + delta);
    if (next === quantity) return;
    setBusy(true);
    await fetch(`/api/cart/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: next }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("이 상품을 장바구니에서 빼시겠어요?")) return;
    setBusy(true);
    await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => update(-1)} disabled={busy || quantity <= 1} className="btn-ghost px-2 py-1 text-xs">−</button>
      <span className="w-6 text-center text-sm">{quantity}</span>
      <button onClick={() => update(+1)} disabled={busy} className="btn-ghost px-2 py-1 text-xs">+</button>
      <button onClick={remove} disabled={busy} className="text-xs text-red-600 hover:underline ml-2">삭제</button>
    </div>
  );
}
