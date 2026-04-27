import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type DraftItem = {
  product_id: number;
  name: string;
  image_url: string | null;
  price: number;
  quantity: number;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const totalAmount = Number(body.totalAmount);
  const items: DraftItem[] = body.items || [];
  if (!totalAmount || items.length === 0) {
    return NextResponse.json({ error: "잘못된 주문" }, { status: 400 });
  }

  // 서버에서 합계를 다시 검증 (프론트 변조 방지) — 실제로는 product 가격을 DB에서 다시 읽어야 안전.
  // MVP에선 클라이언트가 보낸 가격을 일단 신뢰하되, 합계만 재계산.
  const computed = items.reduce((s, it) => s + it.price * it.quantity, 0);
  if (computed !== totalAmount) {
    return NextResponse.json({ error: "금액 불일치" }, { status: 400 });
  }

  // 토스 orderId — 우리 시스템 고유번호. 영문/숫자/-_, 6-64자
  const tossOrderId = `chorok-${user.id.slice(0, 8)}-${Date.now()}`;

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      total_price: totalAmount,
      status: "pending",
      toss_order_id: tossOrderId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // 주문 아이템 함께 저장 (status pending — 결제 승인 후 paid로 변경)
  const itemRows = items.map((it) => ({
    order_id: order.id,
    product_id: it.product_id,
    product_name: it.name,
    product_image: it.image_url,
    quantity: it.quantity,
    price: it.price,
  }));
  const { error: ie } = await admin.from("order_items").insert(itemRows);
  if (ie) {
    return NextResponse.json({ error: ie.message }, { status: 400 });
  }

  return NextResponse.json({ tossOrderId, orderRowId: order.id });
}
