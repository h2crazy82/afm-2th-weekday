import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/format";
import { AdminProductForm } from "./product-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  if (!isAdmin(user.email)) {
    return (
      <div className="card text-red-600">
        관리자만 접근 가능합니다. 현재: {user.email}
      </div>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, image_url")
    .order("id", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">관리자 — 상품 등록</h1>
      <AdminProductForm />

      <h2 className="mt-8 mb-2 font-semibold">등록된 상품</h2>
      <div className="space-y-2">
        {(products ?? []).map((p) => (
          <div key={p.id} className="card flex items-center gap-4 text-sm">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt={p.name} className="h-12 w-12 object-cover rounded" />
            ) : (
              <div className="h-12 w-12 bg-zinc-100 rounded" />
            )}
            <span className="flex-1">{p.name}</span>
            <span className="font-medium">{p.price.toLocaleString()}원</span>
          </div>
        ))}
      </div>
    </div>
  );
}
