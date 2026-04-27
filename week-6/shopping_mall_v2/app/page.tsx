import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { won } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  description: string | null;
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, image_url, description")
    .order("id", { ascending: true });

  if (error) {
    return <p className="text-red-600">상품 불러오기 실패: {error.message}</p>;
  }

  const products: Product[] = data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🌱 식물 가게</h1>
        <p className="mt-1 text-sm text-zinc-600">
          반려식물을 집까지. 결제는 안전한 토스페이먼츠를 사용합니다.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-zinc-500">아직 상품이 없습니다. 관리자가 등록을 기다립니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              {p.image_url ? (
                <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="aspect-square rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm">
                  이미지 없음
                </div>
              )}
              <div className="mt-3">
                <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                <p className="mt-1 text-emerald-700 font-semibold">{won(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
