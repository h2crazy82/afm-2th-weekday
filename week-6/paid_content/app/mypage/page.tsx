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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📂 내 구매 이력</h1>

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
