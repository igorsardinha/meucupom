import { NextResponse } from "next/server";
import { InvalidWebhookSignatureError } from "mercadopago";
import { syncMercadoPagoSubscription } from "@/db/repository";
import {
  getPreApprovalClient,
  isMercadoPagoEnabled,
  mapMercadoPagoStatus,
  verifyMercadoPagoWebhook,
} from "@/lib/mercadopago";

interface WebhookPayload {
  type?: string;
  topic?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
}

async function syncPreapprovalById(preapprovalId: string) {
  const sub = await getPreApprovalClient().get({ id: preapprovalId });
  const mapped = mapMercadoPagoStatus(sub.status);
  const isAuthorized = sub.status === "authorized";

  await syncMercadoPagoSubscription({
    userId: sub.external_reference || undefined,
    mpPayerId: sub.payer_id ? String(sub.payer_id) : undefined,
    mpPreapprovalId: sub.id || preapprovalId,
    plan: isAuthorized ? "pro" : "free",
    subscriptionStatus: mapped,
    currentPeriodEnd: sub.next_payment_date ? new Date(sub.next_payment_date) : null,
  });
}

export async function POST(request: Request) {
  if (!isMercadoPagoEnabled()) {
    return NextResponse.json({ error: "Mercado Pago not configured." }, { status: 503 });
  }

  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "MP_WEBHOOK_SECRET missing." }, { status: 503 });
  }

  const url = new URL(request.url);
  let body: WebhookPayload = {};
  try {
    body = (await request.json()) as WebhookPayload;
  } catch {
    body = {};
  }

  const dataId =
    url.searchParams.get("data.id") ||
    url.searchParams.get("id") ||
    (body.data?.id !== undefined ? String(body.data.id) : null);

  try {
    verifyMercadoPagoWebhook({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }
    return NextResponse.json({ error: "Webhook validation error." }, { status: 400 });
  }

  if (!dataId) {
    return NextResponse.json({ received: true });
  }

  const eventType = body.type || body.topic || url.searchParams.get("topic") || "";

  try {
    if (eventType === "subscription_preapproval" || eventType === "preapproval") {
      await syncPreapprovalById(dataId);
    } else if (eventType === "subscription_authorized_payment") {
      const token = process.env.MP_ACCESS_TOKEN!.trim();
      const res = await fetch(
        `https://api.mercadopago.com/authorized_payments/${encodeURIComponent(dataId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const payment = (await res.json()) as { preapproval_id?: string };
        if (payment.preapproval_id) {
          await syncPreapprovalById(payment.preapproval_id);
        }
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process webhook." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
