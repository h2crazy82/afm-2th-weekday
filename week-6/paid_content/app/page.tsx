import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { won } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: contents } = await supabase
    .from("contents")
    .select("id, title, preview, price, category, created_at")
    .order("id", { ascending: true });

  // 로그인한 사용자의 구매 콘텐츠 ID set
  const { data: { user } } = await supabase.auth.getUser();
  let purchasedIds = new Set<number>();
  if (user) {
    const { data: purchases } = await supabase
      .from("purchases")
      .select("content_id")
      .eq("user_id", user.id);
    purchasedIds = new Set((purchases ?? []).map((p) => p.content_id));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">📚 AI 프롬프트 템플릿 마켓</h1>
        <p className="mt-1 text-sm text-zinc-600">
          제조업 HRD·라라에듀 PM·강사가 매주 쓰는 프롬프트. 결제 후 영구 열람.
        </p>
      </div>

      {/* 프리미엄 카드 */}
      <Link
        href="/custom"
        className="block mb-6 rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
              ✨ PREMIUM
            </div>
            <h2 className="mt-2 text-lg font-bold text-amber-900">
              5개 템플릿이 부족해요? AI가 만들어드립니다.
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              회사·업종·요구사항을 입력하면 Claude AI가 그 자리에서 새 프롬프트를 생성합니다.
              결제 후 5~10초 내 자동 생성, 영구 보관.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-amber-700">₩39,000</p>
            <p className="text-xs text-amber-600">1회 생성</p>
          </div>
        </div>
      </Link>

      <div className="space-y-3">
        {(contents ?? []).map((c) => {
          const purchased = purchasedIds.has(c.id);
          return (
            <Link
              key={c.id}
              href={`/contents/${c.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {c.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {c.category}
                      </span>
                    )}
                    {purchased && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        ✓ 구매완료
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1.5 font-semibold">{c.title}</h2>
                  <p className="mt-2 text-sm text-zinc-600 whitespace-pre-line line-clamp-3">
                    {c.preview}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-indigo-700">{won(c.price)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
