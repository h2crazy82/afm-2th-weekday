"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { CUSTOM_GENERATION_PRICE, CATEGORIES } from "@/lib/claude";
import { won } from "@/lib/format";

export function CustomForm({
  clientKey,
  userEmail,
  userId,
}: {
  clientKey: string;
  userEmail: string;
  userId: string;
}) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [tone, setTone] = useState("중간");
  const [customRequest, setCustomRequest] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const widgetsRef = useRef<any>(null);

  // 토스 결제 위젯 로드
  useEffect(() => {
    let active = true;
    (async () => {
      const tossPayments = await loadTossPayments(clientKey);
      const widgets = tossPayments.widgets({ customerKey: userId || ANONYMOUS });
      widgetsRef.current = widgets;
      await widgets.setAmount({ currency: "KRW", value: CUSTOM_GENERATION_PRICE });
      await Promise.all([
        widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
        widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
      ]);
      if (active) setWidgetReady(true);
    })();
    return () => { active = false; };
  }, [clientKey, userId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (customRequest.trim().length < 20) {
      setErr("요구사항을 20자 이상 적어주세요.");
      return;
    }
    if (!widgetsRef.current) {
      setErr("결제 위젯이 아직 준비되지 않았습니다.");
      return;
    }
    setBusy(true);

    // 1) draft 주문 + 폼 데이터 저장
    const draftRes = await fetch("/api/custom-generations/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        companyName: companyName.trim() || null,
        industry: industry.trim() || null,
        employeeCount: employeeCount ? Number(employeeCount) : null,
        tone,
        customRequest: customRequest.trim(),
      }),
    });
    if (!draftRes.ok) {
      setBusy(false);
      const j = await draftRes.json();
      setErr(j.error || "주문 생성 실패");
      return;
    }
    const { tossOrderId, customId } = await draftRes.json();

    // 2) 토스 결제
    try {
      await widgetsRef.current.requestPayment({
        orderId: tossOrderId,
        orderName: `[프리미엄] ${category} 맞춤 프롬프트`,
        successUrl: `${window.location.origin}/payments/success?customId=${customId}`,
        failUrl: `${window.location.origin}/payments/fail`,
        customerEmail: userEmail,
      });
    } catch (e: any) {
      setBusy(false);
      setErr(e.message || "결제 시작 실패");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="card space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            카테고리 <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">회사명</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="예: 현대미포조선"
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">업종</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="예: 조선/중공업"
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">직원 수</label>
            <input
              type="number"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(e.target.value)}
              placeholder="예: 250"
              min={1}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">분위기</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="input">
              <option value="보수적">보수적</option>
              <option value="중간">중간</option>
              <option value="혁신적">혁신적</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            요구사항 <span className="text-red-500">*</span>
            <span className="ml-2 text-zinc-400 font-normal">({customRequest.length}/2000)</span>
          </label>
          <textarea
            value={customRequest}
            onChange={(e) => setCustomRequest(e.target.value.slice(0, 2000))}
            rows={5}
            required
            placeholder={`예: 1시간짜리 화학물질 안전 강의 자료를 만들어줘.\n실습 단계별 멘트 + 평가 5문항 포함.\n사고 사례 3건 (가상이어도 OK).`}
            className="input"
          />
          <p className="mt-1 text-xs text-zinc-500">최소 20자. 디테일하게 적을수록 좋은 결과.</p>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-2">결제 수단</h2>
        <div id="payment-method" className="card mb-3" />
        <div id="agreement" className="card mb-3" />
      </div>

      {err && (
        <div className="card border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{err}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={busy || !widgetReady}
        className="btn-primary w-full !bg-amber-600 hover:!bg-amber-700"
      >
        {busy
          ? "결제 진행중..."
          : widgetReady
          ? `${won(CUSTOM_GENERATION_PRICE)} 결제하고 AI 생성하기 →`
          : "결제 위젯 불러오는 중..."}
      </button>
      <p className="text-xs text-zinc-500 text-center">
        🧪 테스트 모드 — 실제 결제 X. 결제 완료 후 평균 5~10초 내 자동 생성.
      </p>
    </form>
  );
}
