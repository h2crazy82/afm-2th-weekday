import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { quantity } = await req.json();
  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "quantity는 1 이상" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cart")
    .update({ quantity })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "item not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { error, count } = await supabase
    .from("cart")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!count) return NextResponse.json({ error: "item not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
