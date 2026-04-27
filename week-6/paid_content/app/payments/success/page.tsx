import Link from "next/link";
import { confirmTossPayment } from "@/lib/toss";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { won, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PaymentsSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    paymentKey?: string;
    orderId?: string;
    amount?: string;
    contentId?: string;
  }>;
}) {
  const sp = await searchParams;
  const { paymentKey, orderId, amount, contentId } = sp;

  if (!paymentKey || !orderId || !amount || !contentId) {
    return (
      <div className="card text-center text-red-600">결제 파라미터가 누락되었습니다.</div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="card text-red-600">로그인 정보가 없습니다.</div>;
  }

  // 1) 토스 승인
  let tossResult;
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
        <Link href="/" className="btn-ghost">홈으로</Link>
      </div>
    );
  }

  // 2) DB에 purchases UPSERT (pending → paid)
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("purchases")
    .select("id, paid_at")
    .eq("toss_order_id", orderId)
    .maybeSingle();

  if (existing) {
    await admin
      .from("purchases")
      .update({
        toss_payment_key: paymentKey,
        paid_at: tossResult.approvedAt,
      })
      .eq("id", existing.id);
  } else {
    // draft가 안 만들어진 케이스 — fallback
    await admin.from("purchases").insert({
      user_id: user.id,
      content_id: Number(contentId),
      amount: Number(amount),
      toss_payment_key: paymentKey,
      toss_order_id: orderId,
      paid_at: tossResult.approvedAt,
    });
  }

  // 3) 콘텐츠 정보
  const { data: content } = await admin
    .from("contents")
    .select("title")
    .eq("id", Number(contentId))
    .maybeSingle();

  return (
    <div className="max-w-md mx-auto card text-center">
      <div className="text-6xl mb-3">🔓</div>
      <h1 className="text-2xl font-bold">결제 완료!</h1>
      <p className="mt-2 text-zinc-600">{content?.title || tossResult.orderName}</p>
      <p className="mt-4 text-2xl font-bold text-indigo-700">{won(tossResult.totalAmount)}</p>
      <div className="mt-3 text-xs text-zinc-500 space-y-1">
        <p>결제 수단: {tossResult.method}</p>
        <p>주문번호: {tossResult.orderId}</p>
        <p>승인일시: {formatDate(tossResult.approvedAt)}</p>
      </div>
      <div className="mt-6 flex gap-2 justify-center">
        <Link href={`/contents/${contentId}`} className="btn-primary">본문 열람하기 →</Link>
        <Link href="/mypage" className="btn-ghost">구매 이력</Link>
      </div>
    </div>
  );
}
