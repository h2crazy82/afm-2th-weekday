"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { won } from "@/lib/format";

type Item = {
  product_id: number;
  name: string;
  image_url: string | null;
  price: number;
  quantity: number;
};

export function CheckoutForm({
  clientKey,
  userEmail,
  userId,
  items,
  totalAmount,
  orderName,
}: {
  clientKey: string;
  userEmail: string;
  userId: string;
  items: Item[];
  totalAmount: number;
  orderName: string;
}) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const widgetsRef = useRef<any>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        const widgets = tossPayments.widgets({ customerKey: userId || ANONYMOUS });
        widgetsRef.current = widgets;

        await widgets.setAmount({ currency: "KRW", value: totalAmount });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
          widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
        ]);
        if (active) {
          setReady(true);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [clientKey, totalAmount, userId]);

  async function pay() {
    if (!widgetsRef.current) return;

    // 1) 우리 DB에 pending order 생성 (orderId 발급)
    const draftRes = await fetch("/api/orders/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalAmount, orderName, items }),
    });
    if (!draftRes.ok) {
      const j = await draftRes.json();
      alert(j.error || "주문 생성 실패");
      return;
    }
    const { tossOrderId } = await draftRes.json();

    // 2) Toss 결제 위젯으로 결제 요청
    try {
      await widgetsRef.current.requestPayment({
        orderId: tossOrderId,
        orderName,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
        customerEmail: userEmail,
      });
    } catch (e: any) {
      alert(e.message || "결제 시작 실패");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h2 className="font-semibold mb-2">주문 상품</h2>
        <ul className="card divide-y divide-zinc-100">
          {items.map((it, i) => (
            <li key={i} className="py-2 flex justify-between text-sm">
              <span>
                {it.name} × {it.quantity}
              </span>
              <span className="font-medium">{won(it.price * it.quantity)}</span>
            </li>
          ))}
          <li className="py-2 flex justify-between font-semibold">
            <span>총액</span>
            <span className="text-emerald-700">{won(totalAmount)}</span>
          </li>
        </ul>
      </div>
      <div>
        <h2 className="font-semibold mb-2">결제 수단</h2>
        <div id="payment-method" className="card mb-3" />
        <div id="agreement" className="card mb-3" />
        {loading && <p className="text-sm text-zinc-500">결제 위젯 불러오는 중...</p>}
        <button onClick={pay} disabled={!ready} className="btn-primary w-full">
          {won(totalAmount)} 결제하기
        </button>
        <p className="mt-2 text-xs text-zinc-500">
          🧪 테스트 모드 — 토스페이먼츠 테스트 카드로 결제됩니다. 실제 결제 X.
        </p>
      </div>
    </div>
  );
}
