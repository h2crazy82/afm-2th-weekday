import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { won, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, total_price, status, paid_at, toss_order_id, toss_payment_key")
    .eq("id", Number(orderId))
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name, product_image, quantity, price")
    .eq("order_id", order.id);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/mypage" className="text-sm text-zinc-600 hover:underline">← 주문 내역</Link>

      <h1 className="mt-2 text-2xl font-bold">주문 상세</h1>
      <p className="text-xs text-zinc-500">주문번호: {order.toss_order_id}</p>

      <div className="card mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">결제 상태</span>
          <span className="badge">{order.status === "paid" ? "결제완료" : order.status}</span>
        </div>
        {order.paid_at && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">결제일시</span>
            <span>{formatDate(order.paid_at)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">총 결제금액</span>
          <span className="font-bold text-emerald-700">{won(order.total_price)}</span>
        </div>
      </div>

      <h2 className="mt-6 mb-2 font-semibold">주문 상품</h2>
      <div className="space-y-3">
        {(items ?? []).map((it) => (
          <div key={it.id} className="card flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
              {it.product_image && (
                <Image src={it.product_image} alt={it.product_name} fill sizes="64px" className="object-cover" unoptimized />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{it.product_name}</p>
              <p className="text-xs text-zinc-500">{won(it.price)} × {it.quantity}</p>
            </div>
            <p className="font-semibold">{won(it.price * it.quantity)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
