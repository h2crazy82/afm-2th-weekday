import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=/checkout/${id}`);

  const { data: content } = await supabase
    .from("contents")
    .select("id, title, price, category")
    .eq("id", Number(id))
    .maybeSingle();
  if (!content) notFound();

  // 이미 구매한 콘텐츠인지 확인
  const { data: existing } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("content_id", content.id)
    .maybeSingle();
  if (existing) redirect(`/contents/${content.id}`);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">결제하기</h1>
      <CheckoutForm
        clientKey={process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!}
        userEmail={user.email!}
        userId={user.id}
        contentId={content.id}
        title={content.title}
        price={content.price}
      />
    </div>
  );
}
