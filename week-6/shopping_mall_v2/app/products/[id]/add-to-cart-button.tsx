"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToCartButton({ productId }: { productId: number }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity: qty }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json();
      setMsg(j.error || "실패");
      return;
    }
    setMsg("장바구니에 담았습니다.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
        className="input w-20"
      />
      <button onClick={add} disabled={busy} className="btn-primary">
        {busy ? "..." : "장바구니"}
      </button>
      {msg && <span className="text-xs text-zinc-600">{msg}</span>}
    </div>
  );
}
