export const won = (n: number) =>
  new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(n);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

// 본문 앞 3줄 추출 (preview용)
export function previewLines(body: string, n = 3): string {
  return body.split(/\r?\n/).filter((l) => l.trim()).slice(0, n).join("\n");
}
