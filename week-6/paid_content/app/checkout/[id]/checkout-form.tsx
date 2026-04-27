"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { won } from "@/lib/format";

export function CheckoutForm({
  clientKey,
  userEmail,
  userId,
  contentId,
  title,
  price,
}: {
  clientKey: string;
  userEmail: string;
  userId: string;
  contentId: number;
  title: string;
  price: number;
}) {
  const [ready, setReady] = useState(false);
  const widgetsRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const tossPayments = await loadTossPayments(clientKey);
      const widgets = tossPayments.widgets({ customerKey: userId || ANONYMOUS });
      widgetsRef.current = widgets;
      await widgets.setAmount({ currency: "KRW", value: price });
      await Promise.all([
        widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
        widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
      ]);
      if (active) setReady(true);
    })();
    return () => { active = false; };
  }, [clientKey, price, userId]);

  async function pay() {
    if (!widgetsRef.current) return;

    const draftRes = await fetch("/api/purchases/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, amount: price }),
    });
    if (!draftRes.ok) {
      const j = await draftRes.json();
      alert(j.error || "주문 생성 실패");
      return;
    }
    const { tossOrderId } = await draftRes.json();

    try {
      await widgetsRef.current.requestPayment({
        orderId: tossOrderId,
        orderName: title,
        successUrl: `${window.location.origin}/payments/success?contentId=${contentId}`,
        failUrl: `${window.location.origin}/payments/fail`,
        customerEmail: userEmail,
      });
    } catch (e: any) {
      alert(e.message || "결제 시작 실패");
    }
  }

  return (
    <div>
      <div className="card mb-3">
        <p className="text-sm text-zinc-500">구매 콘텐츠</p>
        <p className="mt-1 font-medium">{title}</p>
        <p className="mt-2 text-2xl font-bold text-indigo-700">{won(price)}</p>
      </div>
      <div id="payment-method" className="card mb-3" />
      <div id="agreement" className="card mb-3" />
      <button onClick={pay} disabled={!ready} className="btn-primary w-full">
        {won(price)} 결제하고 열람하기
      </button>
      <p className="mt-2 text-xs text-zinc-500">
        🧪 테스트 모드 — 토스페이먼츠 테스트 카드로 결제됩니다. 실제 결제 X.
      </p>
    </div>
  );
}
