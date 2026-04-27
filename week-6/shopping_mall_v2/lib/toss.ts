const TOSS_BASE = "https://api.tosspayments.com/v1";

export async function confirmTossPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const secret = process.env.TOSS_SECRET_KEY!;
  const auth = Buffer.from(secret + ":").toString("base64");

  const res = await fetch(`${TOSS_BASE}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "결제 승인 실패");
  }
  return data as {
    orderId: string;
    orderName: string;
    totalAmount: number;
    method: string;
    approvedAt: string;
    paymentKey: string;
    status: string;
  };
}
