import Link from "next/link";

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; message?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="max-w-md mx-auto card text-center">
      <div className="text-5xl mb-3">⚠️</div>
      <h1 className="text-xl font-bold">결제 실패</h1>
      <p className="mt-2 text-zinc-600">{sp.message || "결제가 완료되지 않았습니다."}</p>
      {sp.code && <p className="mt-1 text-xs text-zinc-400">code: {sp.code}</p>}
      <div className="mt-6 flex gap-2 justify-center">
        <Link href="/cart" className="btn-primary">장바구니로</Link>
        <Link href="/" className="btn-ghost">홈으로</Link>
      </div>
    </div>
  );
}
