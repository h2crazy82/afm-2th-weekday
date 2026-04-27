import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { data, error } = await supabase
    .from("cart")
    .select("id, product_id, quantity, products(id, name, price, image_url)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const product_id = Number(body.product_id);
  const quantity = Math.max(1, Number(body.quantity ?? 1));
  if (!product_id) return NextResponse.json({ error: "product_id 필요" }, { status: 400 });

  // upsert
  const { data: existing } = await supabase
    .from("cart")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", product_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("cart")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("cart")
    .insert({ user_id: user.id, product_id, quantity })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
