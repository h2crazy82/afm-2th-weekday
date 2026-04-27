import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/format";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, image_url, description")
    .order("id", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "관리자만 등록 가능합니다" }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  const price = Number(body.price);
  const image_url = body.image_url || null;
  const description = body.description || null;

  if (!name) return NextResponse.json({ error: "name 필수" }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "price는 0 이상" }, { status: 400 });
  }

  // products INSERT는 service-role로 (RLS 우회)
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .insert({ name, price, image_url, description })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
