import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { won } from "@/lib/format";
import { CartActions } from "./cart-actions";

export const dynamic = "force-dynamic";

type CartRow = {
  id: number;
  product_id: number;
  quantity: number;
  products: {
    id: number;
    name: string;
    price: number;
    image_url: string | null;
  };
};

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: rawData } = await supabase
    .from("cart")
    .select("id, product_id, quantity, products(id, name, price, image_url)")
    .order("created_at", { ascending: false });

  // Supabase returns products as array sometimes — normalize
  const cart: CartRow[] = (rawData ?? []).map((row: any) => ({
    ...row,
    products: Array.isArray(row.products) ? row.products[0] : row.products,
  }));

  const total = cart.reduce((s, c) => s + c.products.price * c.quantity, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🛒 장바구니</h1>

      {cart.length === 0 ? (
        <div className="card text-center text-zinc-600">
          장바구니가 비어있습니다. <Link href="/" className="text-emerald-700 underline">상품 보러가기</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cart.map((c) => (
              <div key={c.id} className="card flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                  {c.products.image_url && (
                    <Image
                      src={c.products.image_url}
                      alt={c.products.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{c.products.name}</p>
                  <p className="text-sm text-zinc-600">{won(c.products.price)} × {c.quantity}</p>
                </div>
                <CartActions itemId={c.id} quantity={c.quantity} />
              </div>
            ))}
          </div>

          <div className="mt-6 card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">총 결제 금액</span>
              <span className="text-2xl font-bold text-emerald-700">{won(total)}</span>
            </div>
            <Link href="/checkout" className="btn-primary w-full mt-4">
              결제하기 →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
