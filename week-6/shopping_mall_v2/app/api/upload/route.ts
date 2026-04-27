import { NextResponse } from "next/server";
import { getImageKit } from "@/lib/imagekit";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/format";

// ImageKit upload-from-client는 server signature가 필요 — 이 endpoint가 그걸 발급
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "관리자만" }, { status: 403 });
  }

  const ik = getImageKit();
  const { token, expire, signature } = ik.getAuthenticationParameters();

  return NextResponse.json({
    token,
    expire,
    signature,
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
  });
}
