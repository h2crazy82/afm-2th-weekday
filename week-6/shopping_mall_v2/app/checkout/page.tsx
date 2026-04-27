import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: rawCart } = await supabase
    .from("cart")
    .select("id, product_id, quantity, products(id, name, price, image_url)");

  const cart = (rawCart ?? []).map((row: any) => ({
    ...row,
    products: Array.isArray(row.products) ? row.products[0] : row.products,
  }));

  if (cart.length === 0) redirect("/cart");

  const items = cart.map((c: any) => ({
    product_id: c.products.id,
    name: c.products.name,
    image_url: c.products.image_url,
    price: c.products.price,
    quantity: c.quantity,
  }));
  const totalAmount = items.reduce((s: number, it: any) => s + it.price * it.quantity, 0);
  const orderName =
    items.length === 1
      ? items[0].name
      : `${items[0].name} 외 ${items.length - 1}건`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">결제하기</h1>
      <CheckoutForm
        clientKey={process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!}
        userEmail={user.email!}
        userId={user.id}
        items={items}
        totalAmount={totalAmount}
        orderName={orderName}
      />
    </div>
  );
}
