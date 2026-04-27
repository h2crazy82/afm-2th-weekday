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

export const isAdmin = (email: string | null | undefined) => {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim());
  return list.includes(email);
};
