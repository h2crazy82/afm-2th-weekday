import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { won, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total_price, status, paid_at, created_at, toss_order_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📦 내 주문 내역</h1>

      {(orders ?? []).length === 0 ? (
        <div className="card text-center text-zinc-600">
          아직 주문이 없습니다. <Link href="/" className="text-emerald-700 underline">상품 보러가기</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(orders ?? []).map((o) => (
            <Link
              key={o.id}
              href={`/mypage/orders/${o.id}`}
              className="card flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-xs text-zinc-500">주문번호 {o.toss_order_id}</p>
                <p className="font-medium">{won(o.total_price)}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {o.paid_at ? formatDate(o.paid_at) : formatDate(o.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${o.status === "paid" ? "" : "bg-zinc-100 text-zinc-700"}`}>
                  {o.status === "paid" ? "결제완료" : o.status}
                </span>
                <span className="text-zinc-400">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
