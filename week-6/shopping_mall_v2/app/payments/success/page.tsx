import Link from "next/link";
import { confirmTossPayment } from "@/lib/toss";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { won, formatDate } from "@/lib/format";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export default async function PaymentsSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
}) {
  const sp = await searchParams;
  const { paymentKey, orderId, amount } = sp;

  if (!paymentKey || !orderId || !amount) {
    return (
      <div className="card text-center text-red-600">
        결제 파라미터가 누락되었습니다.
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="card text-red-600">로그인 정보가 없습니다.</div>;
  }

  // 1) 토스에 결제 승인 요청
  let tossResult: Awaited<ReturnType<typeof confirmTossPayment>>;
  try {
    tossResult = await confirmTossPayment({
      paymentKey,
      orderId,
      amount: Number(amount),
    });
  } catch (e: any) {
    return (
      <div className="card text-red-600 space-y-2">
        <p>결제 승인 실패: {e.message}</p>
        <Link href="/cart" className="btn-ghost">장바구니로 돌아가기</Link>
      </div>
    );
  }

  // 2) DB에 orders + order_items 저장 (서버 사이드, service-role)
  const admin = createAdminClient();

  // 이미 처리된 주문인지 확인 (중복 승인 방지)
  const { data: existing } = await admin
    .from("orders")
    .select("id")
    .eq("toss_order_id", orderId)
    .eq("status", "paid")
    .maybeSingle();

  let orderRowId: number;
  if (existing) {
    orderRowId = existing.id;
  } else {
    // pending row 찾아서 업데이트 (draft에서 만들어둠)
    const { data: pending } = await admin
      .from("orders")
      .select("id")
      .eq("toss_order_id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!pending) {
      return <div className="card text-red-600">draft 주문을 찾을 수 없습니다.</div>;
    }

    await admin
      .from("orders")
      .update({
        status: "paid",
        toss_payment_key: paymentKey,
        paid_at: tossResult.approvedAt,
        receiver_email: user.email,
      })
      .eq("id", pending.id);

    orderRowId = pending.id;
  }

  // 3) 장바구니 비우기
  const userClient = await createClient();
  await userClient.from("cart").delete().eq("user_id", user.id);

  // 4) 주문 상세 + 아이템 조회
  const { data: order } = await admin
    .from("orders")
    .select("id, total_price, paid_at, toss_order_id, toss_payment_key")
    .eq("id", orderRowId)
    .maybeSingle();

  const { data: items } = await admin
    .from("order_items")
    .select("product_name, quantity, price")
    .eq("order_id", orderRowId);

  // 5) 주문 확인 이메일 발송 (RESEND_API_KEY 있을 때만)
  let emailStatus: string | null = null;
  if (process.env.RESEND_API_KEY && user.email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const itemsHtml = (items ?? [])
        .map(
          (it) =>
            `<tr><td>${it.product_name}</td><td style="text-align:right">${it.quantity}개</td><td style="text-align:right">${won(it.price * it.quantity)}</td></tr>`
        )
        .join("");
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: user.email,
        subject: `🌱 초록상회 주문 확인 — ${tossResult.orderName}`,
        html: `
          <h2>주문 확인</h2>
          <p>${user.email}님, 결제가 완료되었습니다.</p>
          <p><strong>주문번호:</strong> ${order?.toss_order_id}</p>
          <p><strong>결제일:</strong> ${formatDate(tossResult.approvedAt)}</p>
          <table style="width:100%;border-collapse:collapse;margin-top:8px">
            <thead><tr><th>상품</th><th>수량</th><th>금액</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot><tr><td colspan="2"><strong>총액</strong></td><td style="text-align:right"><strong>${won(order?.total_price ?? 0)}</strong></td></tr></tfoot>
          </table>
        `,
      });
      emailStatus = "sent";
    } catch (e: any) {
      emailStatus = `failed: ${e.message}`;
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="card text-center">
        <div className="text-6xl mb-3">✅</div>
        <h1 className="text-2xl font-bold">결제 완료!</h1>
        <p className="mt-2 text-zinc-600">{tossResult.orderName}</p>
        <p className="mt-4 text-3xl font-bold text-emerald-700">
          {won(tossResult.totalAmount)}
        </p>
        <div className="mt-4 text-xs text-zinc-500 space-y-1">
          <p>결제 수단: {tossResult.method}</p>
          <p>주문번호: {tossResult.orderId}</p>
          <p>승인일시: {formatDate(tossResult.approvedAt)}</p>
          {emailStatus && (
            <p className={emailStatus === "sent" ? "text-emerald-700" : "text-orange-600"}>
              {emailStatus === "sent"
                ? `📧 주문 확인 이메일을 ${user.email}로 발송했습니다.`
                : `📧 이메일 발송 실패 (${emailStatus})`}
            </p>
          )}
        </div>
        <div className="mt-6 flex gap-2 justify-center">
          <Link href="/mypage" className="btn-primary">마이페이지에서 보기</Link>
          <Link href="/" className="btn-ghost">계속 쇼핑하기</Link>
        </div>
      </div>
    </div>
  );
}
