import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { won, formatDate } from "@/lib/format";
import { CopyButton } from "./copy-button";

export const dynamic = "force-dynamic";

export default async function CustomGenerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // RLS — 본인 row만 보임
  const { data: gen } = await supabase
    .from("custom_generations")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();

  if (!gen) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/mypage" className="text-sm text-zinc-600 hover:underline">← 내 구매 이력</Link>

      <div className="mt-2 mb-4">
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
          ✨ PREMIUM
        </span>
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
          {gen.category}
        </span>
        <h1 className="mt-2 text-xl font-bold">맞춤 프롬프트 #{gen.id}</h1>
        {gen.paid_at && (
          <p className="text-xs text-zinc-500">생성일: {formatDate(gen.paid_at)} · {won(gen.amount)}</p>
        )}
      </div>

      {/* 입력 정보 */}
      <details className="card mb-3">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700">
          내가 입력한 정보
        </summary>
        <div className="mt-3 space-y-1 text-sm text-zinc-700">
          <p><span className="text-zinc-500">카테고리:</span> {gen.category}</p>
          <p><span className="text-zinc-500">회사명:</span> {gen.company_name || "-"}</p>
          <p><span className="text-zinc-500">업종:</span> {gen.industry || "-"}</p>
          <p><span className="text-zinc-500">직원 수:</span> {gen.employee_count || "-"}</p>
          <p><span className="text-zinc-500">분위기:</span> {gen.tone || "-"}</p>
          <p className="pt-2 border-t border-zinc-100">
            <span className="text-zinc-500 block mb-1">요청:</span>
            <span className="whitespace-pre-line">{gen.custom_request}</span>
          </p>
        </div>
      </details>

      {/* 본문 */}
      {gen.status === "generated" && gen.generated_body ? (
        <div className="card">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              ✓ AI 생성 완료
            </span>
            <CopyButton text={gen.generated_body} />
          </div>
          <pre className="whitespace-pre-wrap break-words text-sm text-zinc-800 font-sans bg-zinc-50 rounded p-4 leading-relaxed">
            {gen.generated_body}
          </pre>
        </div>
      ) : gen.status === "failed" ? (
        <div className="card border-red-200 bg-red-50">
          <p className="font-semibold text-red-700">⚠️ AI 생성 실패</p>
          <p className="mt-1 text-sm text-red-600">{gen.error_message || "알 수 없는 오류"}</p>
          <p className="mt-3 text-xs text-zinc-600">
            결제는 성공했지만 AI 호출 단계에서 실패했어요. 관리자(h2crazy82@gmail.com)에게 문의하세요.
          </p>
        </div>
      ) : gen.status === "paid" ? (
        <div className="card text-center py-8">
          <div className="text-4xl mb-2 animate-pulse">⏳</div>
          <p className="font-semibold">AI가 만드는 중...</p>
          <p className="mt-1 text-sm text-zinc-600">5-10초 후 새로고침해주세요.</p>
          <Link href={`/custom/${gen.id}`} className="btn-ghost mt-3 inline-flex">새로고침</Link>
        </div>
      ) : (
        <div className="card text-center py-8 border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">결제 대기 중</p>
          <p className="mt-1 text-sm text-amber-700">결제가 완료되지 않았습니다.</p>
        </div>
      )}
    </div>
  );
}
