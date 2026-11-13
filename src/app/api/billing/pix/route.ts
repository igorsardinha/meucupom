import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getOrCreateProfileForUser,
  grantProDaysToUser,
  redeemPlatformCouponForUser,
  validatePlatformCouponForUser,
} from "@/db/repository";
import { getAuth } from "@/lib/auth";
import {
  getPaymentClient,
  getProPriceBrl,
  isMercadoPagoEnabled,
} from "@/lib/mercadopago";

export async function POST(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  if (!isMercadoPagoEnabled()) {
    return NextResponse.json(
      { error: "Pagamentos via Mercado Pago ainda não configurados neste ambiente." },
      { status: 503 }
    );
  }

  let rawCouponCode: string | null = null;
  let customPayerEmail: string | null = null;
  let customPayerCpf: string | null = null;
  let customPayerName: string | null = null;

  try {
    const json = (await request.json().catch(() => null)) as {
      couponCode?: string;
      payerEmail?: string;
      payerCpf?: string;
      payerName?: string;
    } | null;

    if (json) {
      if (typeof json.couponCode === "string" && json.couponCode.trim()) {
        rawCouponCode = json.couponCode.trim().toUpperCase();
      }
      if (typeof json.payerEmail === "string" && json.payerEmail.includes("@")) {
        customPayerEmail = json.payerEmail.trim().toLowerCase();
      }
      if (typeof json.payerCpf === "string") {
        customPayerCpf = json.payerCpf.replace(/\D/g, "");
      }
      if (typeof json.payerName === "string" && json.payerName.trim()) {
        customPayerName = json.payerName.trim();
      }
    }
  } catch {
    // Body is optional
  }

  await getOrCreateProfileForUser(session.user);

  let amount = getProPriceBrl();
  let couponAppliedCode: string | null = null;

  if (rawCouponCode) {
    const validation = await validatePlatformCouponForUser(session.user.id, rawCouponCode);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    if (validation.discountPercent > 0) {
      const discountRate = Math.min(100, Math.max(1, validation.discountPercent)) / 100;
      amount = Math.max(1, Math.round(getProPriceBrl() * (1 - discountRate) * 100) / 100);
      couponAppliedCode = validation.coupon.code;
    } else if (validation.durationDays >= 0) {
      // Cupom 100% gratuito: ativa direto
      const redeemRes = await redeemPlatformCouponForUser(session.user.id, validation.coupon.code);
      if (!redeemRes.ok) {
        return NextResponse.json({ error: redeemRes.error }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        alreadyActivated: true,
        message: redeemRes.message,
      });
    }
  }

  const payerEmail = customPayerEmail || session.user.email;
  const fullName = customPayerName || session.user.name || "Criador";
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "Criador";
  const lastName = nameParts.slice(1).join(" ") || "meucupom";

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    request.headers.get("origin") ||
    "http://localhost:3000";

  const description = `Plano Pro meucupom (30 dias)${
    couponAppliedCode ? ` - Cupom ${couponAppliedCode}` : ""
  }`;

  try {
    const payment = await getPaymentClient().create({
      body: {
        transaction_amount: amount,
        description,
        payment_method_id: "pix",
        payer: {
          email: payerEmail,
          first_name: firstName,
          last_name: lastName,
          ...(customPayerCpf && customPayerCpf.length === 11
            ? { identification: { type: "CPF", number: customPayerCpf } }
            : {}),
        },
        external_reference: session.user.id,
        notification_url: `${origin.replace(/\/+$/, "")}/api/billing/webhook`,
        metadata: {
          user_id: session.user.id,
          coupon_code: couponAppliedCode || "",
          plan: "pro",
          days: 30,
        },
      },
    });

    const transactionData = payment.point_of_interaction?.transaction_data;
    const qrCode = transactionData?.qr_code;
    const qrCodeBase64 = transactionData?.qr_code_base64;

    if (!qrCode && !qrCodeBase64) {
      return NextResponse.json(
        { error: "Mercado Pago não retornou os dados do Pix. Verifique se o Pix está habilitado na sua conta." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      status: payment.status,
      amount,
      qrCode,
      qrCodeBase64,
      ticketUrl: transactionData?.ticket_url,
      expiresAt: payment.date_of_expiration,
    });
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const errObj = (typeof err === "object" && err !== null ? err : {}) as {
      status?: number;
      error?: string;
      message?: string;
      causes?: Array<{ description?: string }>;
    };

    const causeMsg =
      errObj.causes && Array.isArray(errObj.causes) && errObj.causes.length > 0
        ? errObj.causes.map((c) => c.description).filter(Boolean).join("; ")
        : "";

    return NextResponse.json(
      {
        error: causeMsg || errObj.message || rawMsg || "Erro ao gerar cobrança Pix no Mercado Pago.",
      },
      { status: 502 }
    );
  }
}

export async function GET(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const url = new URL(request.url);
  const paymentId = url.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ error: "Informe o paymentId." }, { status: 400 });
  }

  try {
    const payment = await getPaymentClient().get({ id: paymentId });
    const isApproved = payment.status === "approved";

    if (isApproved) {
      const targetUserId =
        payment.external_reference ||
        (typeof payment.metadata?.user_id === "string" ? payment.metadata.user_id : null) ||
        session.user.id;

      const updatedProfile = await grantProDaysToUser(targetUserId, 30, String(payment.id));

      const couponCode =
        typeof payment.metadata?.coupon_code === "string" ? payment.metadata.coupon_code : null;
      if (couponCode) {
        await redeemPlatformCouponForUser(targetUserId, couponCode).catch(() => null);
      }

      return NextResponse.json({
        ok: true,
        status: payment.status,
        isApproved: true,
        profile: updatedProfile,
      });
    }

    return NextResponse.json({
      ok: true,
      status: payment.status,
      isApproved: false,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao consultar status do Pix." },
      { status: 500 }
    );
  }
}
