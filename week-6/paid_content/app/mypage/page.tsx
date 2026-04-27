import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { won, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: rawData } = await supabase
    .from("purchases")
    .select("id, content_id, amount, paid_at, toss_order_id, contents(id, title, category)")
    .eq("user_id", user.id)
    .order("paid_at", { ascending: false });

  type Row = {
    id: number;
    content_id: number;
    amount: number;
    paid_at: string | null;
    toss_order_id: string;
    contents: { id: number; title: string; category: string | null };
  };

  const purchases: Row[] = (rawData ?? []).map((p: any) => ({
    ...p,
    contents: Array.isArray(p.contents) ? p.contents[0] : p.contents,
  }));

  // 프리미엄 생성 이력
  const { data: customGens } = await supabase
    .from("custom_generations")
    .select("id, category, custom_request, amount, paid_at, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📂 내 구매 이력</h1>

      {/* 프리미엄 생성 이력 */}
      {(customGens ?? []).length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-amber-700 mb-2">✨ AI 맞춤 프롬프트</h2>
          <div className="space-y-2">
            {(customGens ?? []).map((g: any) => (
              <Link
                key={g.id}
                href={`/custom/${g.id}`}
                className="card flex items-center justify-between hover:shadow-md transition-shadow border-amber-200 bg-amber-50/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {g.category}
                    </span>
                    {g.status === "generated" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        ✓ 생성완료
                      </span>
                    )}
                    {g.status === "paid" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 animate-pulse">
                        ⏳ 생성중
                      </span>
                    )}
                    {g.status === "failed" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                        ⚠️ 실패
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-zinc-700 line-clamp-1">{g.custom_request}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {g.paid_at ? formatDate(g.paid_at) : "결제 진행중"} · {won(g.amount)}
                  </p>
                </div>
                <span className="text-zinc-400 shrink-0">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 일반 콘텐츠 구매 이력 */}
      <h2 className="text-sm font-semibold text-zinc-700 mb-2">📚 콘텐츠 구매</h2>
      {purchases.length === 0 ? (
        <div className="card text-center text-zinc-600">
          아직 구매한 콘텐츠가 없습니다.{" "}
          <Link href="/" className="text-indigo-700 underline">목록 보러가기</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => (
            <Link
              key={p.id}
              href={`/contents/${p.content_id}`}
              className="card flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                {p.contents?.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {p.contents.category}
                  </span>
                )}
                <p className="mt-1 font-medium">{p.contents?.title || "(삭제된 콘텐츠)"}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {p.paid_at ? formatDate(p.paid_at) : "결제 진행중"} · {won(p.amount)}
                </p>
              </div>
              <span className="text-zinc-400">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
