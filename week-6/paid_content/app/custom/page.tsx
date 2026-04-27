import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CUSTOM_GENERATION_PRICE, CATEGORIES } from "@/lib/claude";
import { CustomForm } from "./custom-form";
import { won } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CustomPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/custom");

  // ANTHROPIC_API_KEY 없으면 결제 시작 자체 차단
  const aiAvailable = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
          ✨ PREMIUM
        </div>
        <h1 className="mt-2 text-2xl font-bold">AI가 당신만의 프롬프트를 만들어드립니다</h1>
        <p className="mt-2 text-sm text-zinc-600">
          기본 5개 템플릿으로 부족한 상황? <strong>회사·업종·요구사항을 입력</strong>하면
          Claude AI가 그 자리에서 새 프롬프트를 만들어 드립니다.
          결제 후 평균 5~10초 내 생성, 영구 열람.
        </p>
        <p className="mt-3 text-3xl font-bold text-amber-600">{won(CUSTOM_GENERATION_PRICE)}</p>
        <p className="text-xs text-zinc-500">1회 생성 · 영구 보관 · Markdown / 다운로드</p>
      </div>

      {aiAvailable ? (
        <CustomForm
          clientKey={process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!}
          userEmail={user.email!}
          userId={user.id}
        />
      ) : (
        <div className="card border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-900">⚙️ AI 모듈 셋업 중</p>
          <p className="mt-1 text-sm text-amber-800">
            관리자가 <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> 환경변수를
            설정한 후 이용 가능합니다. 결제는 차단되어 있습니다.
          </p>
          <Link href="/" className="btn-ghost mt-3 inline-flex">기본 템플릿 5개 보기</Link>
        </div>
      )}

      <div className="mt-8 card bg-zinc-50">
        <h3 className="font-semibold text-sm">예시 — 어떻게 쓰나요?</h3>
        <ul className="mt-2 text-sm text-zinc-600 space-y-1.5 list-disc list-inside">
          <li>
            <strong>요청</strong>: "조선업 직원 250명 사업장 안전관리자용 1시간 화학물질 안전 강의 자료"
          </li>
          <li>
            <strong>출력</strong>: 4페이지 분량 산업안전 프롬프트 (위험 진단 + 안전 수칙 + 사례 + 퀴즈)
          </li>
          <li>
            <strong>활용</strong>: 출력된 프롬프트를 ChatGPT/Claude에 붙여넣고 ___ 변수만 채우면
            완성본 즉시 생성
          </li>
        </ul>
      </div>
    </div>
  );
}
