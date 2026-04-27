"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMsg(null);

    try {
      // 1) 서버에서 ImageKit auth params 받기
      const authRes = await fetch("/api/upload");
      if (!authRes.ok) throw new Error("auth params 실패");
      const { token, expire, signature, publicKey, urlEndpoint } = await authRes.json();

      // 2) 직접 ImageKit upload API에 multipart 전송
      const fd = new FormData();
      fd.append("file", file);
      fd.append("fileName", file.name);
      fd.append("publicKey", publicKey);
      fd.append("token", token);
      fd.append("expire", String(expire));
      fd.append("signature", signature);
      fd.append("folder", "/shopping-mall-v2");

      const upRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: fd,
      });
      const upJson = await upRes.json();
      if (!upRes.ok) throw new Error(upJson.message || "업로드 실패");
      setImageUrl(upJson.url);
      setMsg(`✅ 업로드 완료: ${upJson.name}`);
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: Number(price),
        description,
        image_url: imageUrl || null,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json();
      setMsg(`❌ ${j.error}`);
      return;
    }
    setMsg("✅ 상품 등록 완료");
    setName("");
    setPrice("");
    setDescription("");
    setImageUrl("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <div>
        <label className="block text-xs text-zinc-600 mb-1">상품 이미지</label>
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="text-sm" />
        {imageUrl && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="preview" className="h-32 rounded-lg object-cover" />
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs text-zinc-600 mb-1">상품명</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
      </div>
      <div>
        <label className="block text-xs text-zinc-600 mb-1">가격 (원)</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          min={0}
          className="input"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-600 mb-1">설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input"
        />
      </div>
      {msg && <p className="text-sm">{msg}</p>}
      <button type="submit" disabled={submitting || uploading} className="btn-primary w-full">
        {submitting ? "..." : "상품 등록"}
      </button>
    </form>
  );
}
