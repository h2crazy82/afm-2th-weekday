import Link from "next/link";
import { redirect } from "next/navigation";
import { confirmTossPayment } from "@/lib/toss";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateCustomPrompt } from "@/lib/claude";
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
    customId?: string;
  }>;
}) {
  const sp = await searchParams;
  const { paymentKey, orderId, amount, contentId, customId } = sp;

  if (!paymentKey || !orderId || !amount) {
    return <div className="card text-center text-red-600">결제 파라미터가 누락되었습니다.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="card text-red-600">로그인 정보가 없습니다.</div>;

  // 1) 토스 결제 승인 (공통)
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

  const admin = createAdminClient();

  // ─────────────────────────────────────────────
  // 분기 A: 프리미엄 맞춤 프롬프트 생성 (customId)
  // ─────────────────────────────────────────────
  if (customId) {
    const { data: gen } = await admin
      .from("custom_generations")
      .select("*")
      .eq("id", Number(customId))
      .eq("toss_order_id", orderId)
      .maybeSingle();

    if (!gen) {
      return <div className="card text-red-600">draft 생성 row를 찾을 수 없습니다.</div>;
    }

    // 이미 생성 완료되어 있으면 그대로 이동
    if (gen.status === "generated") {
      redirect(`/custom/${gen.id}`);
    }

    // status를 paid로 갱신
    await admin
      .from("custom_generations")
      .update({
        status: "paid",
        toss_payment_key: paymentKey,
        paid_at: tossResult.approvedAt,
      })
      .eq("id", gen.id);

    // Claude API 호출 (실패해도 결제는 유지 — generation row에 에러 기록)
    try {
      const generated = await generateCustomPrompt({
        category: gen.category,
        companyName: gen.company_name,
        industry: gen.industry,
        employeeCount: gen.employee_count,
        tone: gen.tone,
        customRequest: gen.custom_request,
      });

      await admin
        .from("custom_generations")
        .update({
          generated_body: generated,
          generated_at: new Date().toISOString(),
          status: "generated",
        })
        .eq("id", gen.id);
    } catch (e: any) {
      await admin
        .from("custom_generations")
        .update({
          status: "failed",
          error_message: String(e.message || e).slice(0, 500),
        })
        .eq("id", gen.id);
    }

    redirect(`/custom/${gen.id}`);
  }

  // ─────────────────────────────────────────────
  // 분기 B: 기존 콘텐츠 단건 구매 (contentId)
  // ─────────────────────────────────────────────
  if (!contentId) {
    return <div className="card text-red-600">contentId 또는 customId가 필요합니다.</div>;
  }

  const { data: existing } = await admin
    .from("purchases")
    .select("id")
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
    await admin.from("purchases").insert({
      user_id: user.id,
      content_id: Number(contentId),
      amount: Number(amount),
      toss_payment_key: paymentKey,
      toss_order_id: orderId,
      paid_at: tossResult.approvedAt,
    });
  }

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
