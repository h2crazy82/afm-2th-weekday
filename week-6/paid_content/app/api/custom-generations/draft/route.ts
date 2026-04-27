import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CUSTOM_GENERATION_PRICE, CATEGORIES } from "@/lib/claude";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI 모듈이 셋업되지 않았습니다 — 결제 차단됨" },
      { status: 503 }
    );
  }

  const body = await req.json();
  const category = String(body.category || "").trim();
  const customRequest = String(body.customRequest || "").trim();

  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "잘못된 카테고리" }, { status: 400 });
  }
  if (customRequest.length < 20) {
    return NextResponse.json({ error: "요구사항은 20자 이상" }, { status: 400 });
  }
  if (customRequest.length > 2000) {
    return NextResponse.json({ error: "요구사항은 2000자 이하" }, { status: 400 });
  }

  const tossOrderId = `custom-${user.id.slice(0, 8)}-${Date.now()}`;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("custom_generations")
    .insert({
      user_id: user.id,
      category,
      company_name: body.companyName || null,
      industry: body.industry || null,
      employee_count: body.employeeCount ? Number(body.employeeCount) : null,
      tone: body.tone || null,
      custom_request: customRequest,
      amount: CUSTOM_GENERATION_PRICE,
      toss_order_id: tossOrderId,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tossOrderId, customId: data.id });
}
