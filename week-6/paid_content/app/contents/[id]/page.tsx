import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { won, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1) 콘텐츠 메타 (preview만 가져옴 — body는 권한 체크 후 별도 fetch)
  const { data: content } = await supabase
    .from("contents")
    .select("id, title, preview, price, category, created_at")
    .eq("id", Number(id))
    .maybeSingle();

  if (!content) notFound();

  // 2) 권한 체크 — 로그인 + purchases에 (user_id, content_id) 있어야 body 공개
  const { data: { user } } = await supabase.auth.getUser();
  let unlocked = false;
  let purchase: { paid_at: string | null; amount: number } | null = null;
  if (user) {
    const { data: p } = await supabase
      .from("purchases")
      .select("id, paid_at, amount")
      .eq("user_id", user.id)
      .eq("content_id", content.id)
      .maybeSingle();
    if (p) {
      unlocked = true;
      purchase = { paid_at: p.paid_at, amount: p.amount };
    }
  }

  // 3) body는 잠금 해제된 경우에만 별도 쿼리 (서버 사이드)
  let body: string | null = null;
  if (unlocked) {
    const { data: full } = await supabase
      .from("contents")
      .select("body")
      .eq("id", content.id)
      .maybeSingle();
    body = full?.body ?? null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="text-sm text-zinc-600 hover:underline">← 목록</Link>

      <div className="mt-2 mb-4">
        {content.category && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {content.category}
          </span>
        )}
        <h1 className="mt-2 text-2xl font-bold">{content.title}</h1>
      </div>

      {/* 미리보기 (항상 보임) */}
      <div className="card relative mb-4">
        <h3 className="text-xs font-medium text-zinc-500 mb-2">미리보기</h3>
        <p className="text-sm text-zinc-700 whitespace-pre-line">{content.preview}</p>
      </div>

      {/* 본문 또는 잠금 */}
      {unlocked && body ? (
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              ✓ 구매완료 — 영구 열람 가능
            </span>
            {purchase?.paid_at && (
              <span className="text-xs text-zinc-500">{formatDate(purchase.paid_at)}</span>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap break-words text-sm text-zinc-800 font-sans bg-zinc-50 rounded p-3 leading-relaxed">
              {body}
            </pre>
          </div>
        </div>
      ) : (
        <div className="card text-center py-8">
          <div className="text-4xl mb-2">🔒</div>
          <h3 className="font-semibold">잠긴 콘텐츠</h3>
          <p className="mt-1 text-sm text-zinc-600">
            결제하면 본문 전체를 영구 열람할 수 있습니다.
          </p>
          <p className="mt-3 text-2xl font-bold text-indigo-700">{won(content.price)}</p>
          {user ? (
            <Link href={`/checkout/${content.id}`} className="btn-primary mt-3">
              결제하고 열람 →
            </Link>
          ) : (
            <Link
              href={`/auth?next=/contents/${content.id}`}
              className="btn-primary mt-3"
            >
              로그인하고 결제하기
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
