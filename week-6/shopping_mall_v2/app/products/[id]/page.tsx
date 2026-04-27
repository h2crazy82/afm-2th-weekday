import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { won } from "@/lib/format";
import { AddToCartButton } from "./add-to-cart-button";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, name, price, image_url, description")
    .eq("id", Number(id))
    .maybeSingle();

  if (!product) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
        {product.image_url && (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            unoptimized
          />
        )}
      </div>
      <div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="mt-2 text-emerald-700 text-2xl font-semibold">
          {won(product.price)}
        </p>
        <p className="mt-4 text-sm text-zinc-600 whitespace-pre-line">
          {product.description}
        </p>
        <div className="mt-6">
          {user ? (
            <AddToCartButton productId={product.id} />
          ) : (
            <Link href="/auth" className="btn-primary">
              로그인하고 장바구니에 담기
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
