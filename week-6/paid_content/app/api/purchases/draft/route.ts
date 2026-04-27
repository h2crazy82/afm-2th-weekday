import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const contentId = Number(body.contentId);
  const amount = Number(body.amount);
  if (!contentId || !amount) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 콘텐츠 가격 검증 (서버에서 다시 읽어서)
  const { data: content } = await admin
    .from("contents")
    .select("id, price")
    .eq("id", contentId)
    .maybeSingle();

  if (!content) return NextResponse.json({ error: "콘텐츠 없음" }, { status: 404 });
  if (content.price !== amount) {
    return NextResponse.json({ error: "가격 불일치" }, { status: 400 });
  }

  // 이미 paid면 중복 결제 차단
  const { data: existing } = await admin
    .from("purchases")
    .select("id, paid_at")
    .eq("user_id", user.id)
    .eq("content_id", contentId)
    .maybeSingle();
  if (existing && existing.paid_at) {
    return NextResponse.json({ error: "이미 구매한 콘텐츠입니다" }, { status: 400 });
  }

  const tossOrderId = `paid-${user.id.slice(0, 8)}-${contentId}-${Date.now()}`;

  if (existing) {
    // pending row 갱신
    await admin
      .from("purchases")
      .update({ amount, toss_order_id: tossOrderId })
      .eq("id", existing.id);
  } else {
    await admin.from("purchases").insert({
      user_id: user.id,
      content_id: contentId,
      amount,
      toss_order_id: tossOrderId,
    });
  }

  return NextResponse.json({ tossOrderId });
}
