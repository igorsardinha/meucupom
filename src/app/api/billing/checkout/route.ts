import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getOrCreateProfileForUser,
  redeemPlatformCouponForUser,
  setMercadoPagoPreapprovalForUser,
  validatePlatformCouponForUser,
} from "@/db/repository";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import {
  getMercadoPagoAccessToken,
  getPreApprovalClient,
  getProPriceBrl,
  isMercadoPagoEnabled,
} from "@/lib/mercadopago";

export async function POST(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!isMercadoPagoEnabled()) {
    return NextResponse.json(
      {
        error:
          "Pagamentos via Mercado Pago ainda não configurados neste ambiente (defina MP_ACCESS_TOKEN no Vercel).",
      },
      { status: 503 }
    );
  }

  // Parse optional payerEmail and couponCode from request body
  let customPayerEmail: string | null = null;
  let rawCouponCode: string | null = null;
  try {
    const json = (await request.json().catch(() => null)) as {
      payerEmail?: string;
      couponCode?: string;
    } | null;
    if (json && typeof json.payerEmail === "string" && json.payerEmail.includes("@")) {
      customPayerEmail = json.payerEmail.trim().toLowerCase();
    }
    if (json && typeof json.couponCode === "string" && json.couponCode.trim()) {
      rawCouponCode = json.couponCode.trim().toUpperCase();
    }
  } catch {
    // Body is optional
  }

  const payerEmail = customPayerEmail || session.user.email;

  await getOrCreateProfileForUser(session.user);
  const preApprovalClient = getPreApprovalClient();

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    request.headers.get("origin") ||
    "http://localhost:3000";

  let checkoutAmount = getProPriceBrl();
  let checkoutReason = "meucupom Pro (Mensal)";
  let validCouponToRedeem: string | null = null;
  let useCustomPlanPricing = false;

  if (rawCouponCode) {
    const validation = await validatePlatformCouponForUser(session.user.id, rawCouponCode);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (validation.discountPercent > 0) {
      const discountRate = Math.min(100, Math.max(1, validation.discountPercent)) / 100;
      checkoutAmount = Math.max(1, Math.round(getProPriceBrl() * (1 - discountRate) * 100) / 100);
      checkoutReason = `meucupom Pro (Mensal) - ${validation.discountPercent}% OFF (${validation.coupon.code})`;
      validCouponToRedeem = validation.coupon.code;
      useCustomPlanPricing = true;
    } else if (validation.durationDays >= 0) {
      // 100% free / permuta coupon: redeem directly without needing payment
      const redeemRes = await redeemPlatformCouponForUser(session.user.id, validation.coupon.code);
      if (!redeemRes.ok) {
        return NextResponse.json({ error: redeemRes.error }, { status: 400 });
      }
      return NextResponse.json({
        url: `${origin.replace(/\/+$/, "")}/painel?coupon_success=1`,
        message: redeemRes.message,
      });
    }
  }

  const rawPlanId = process.env.MP_PRO_PLAN_ID?.trim();
  const planId = !useCustomPlanPricing && rawPlanId && rawPlanId.length > 5 ? rawPlanId : null;

  try {
    const preapproval = await preApprovalClient.create({
      body: {
        reason: checkoutReason,
        external_reference: session.user.id,
        payer_email: payerEmail,
        back_url: `${origin.replace(/\/+$/, "")}/painel?checkout=return`,
        ...(planId
          ? { preapproval_plan_id: planId }
          : {
              auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: checkoutAmount,
                currency_id: "BRL",
              },
            }),
      },
    });

    if (!preapproval.init_point) {
      return NextResponse.json(
        { error: "Mercado Pago não retornou link de pagamento (init_point ausente)." },
        { status: 502 }
      );
    }

    if (preapproval.id) {
      await setMercadoPagoPreapprovalForUser(session.user.id, preapproval.id);
    }

    if (validCouponToRedeem) {
      await redeemPlatformCouponForUser(session.user.id, validCouponToRedeem).catch(() => null);
    }

    return NextResponse.json({ url: preapproval.init_point });
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const errObj = (typeof err === "object" && err !== null ? err : {}) as {
      status?: number;
      error?: string;
      causes?: unknown[];
    };

    const token = getMercadoPagoAccessToken();
    const isTestToken = token.startsWith("TEST-");
    const isProdToken = token.startsWith("APP_USR-");
    const isShortToken = token.length < 50; // Public key is usually ~36-44 chars, Access Token is ~70-80 chars

    console.error("[MercadoPago Checkout Error]", {
      message: rawMsg,
      status: errObj.status,
      causes: errObj.causes,
      userEmail: session.user.email,
      payerEmail,
      isTestToken,
      isProdToken,
      tokenLength: token.length,
      planId,
    });

    const isUnauthorized =
      rawMsg.toLowerCase().includes("unauthorized") ||
      rawMsg.toLowerCase().includes("access to resource") ||
      errObj.status === 401 ||
      errObj.status === 403;

    let friendlyError = rawMsg;
    if (isUnauthorized) {
      const isSuperAdmin = isSuperAdminEmail(session.user.email);
      if (isShortToken) {
        friendlyError =
          "Acesso não autorizado pelo Mercado Pago. Atenção: o valor de MP_ACCESS_TOKEN no Vercel parece ser a Chave Pública (Public Key) em vez do Token de Acesso (Access Token). No painel do Mercado Pago Developers, copie o campo 'Access Token'.";
      } else if (isTestToken && !payerEmail.endsWith("@testuser.com")) {
        friendlyError =
          "Acesso não autorizado pelo Mercado Pago. Você está usando credenciais de Teste (TEST-...), mas o e-mail não é um usuário de teste do Mercado Pago. Para testar em Sandbox, crie um usuário comprador em 'Contas de teste' no painel do Mercado Pago Developers, ou use o Access Token de Produção (APP_USR-...).";
      } else if (isSuperAdmin) {
        friendlyError =
          "O Mercado Pago bloqueou a assinatura com 'Unauthorized access to resource'. O Mercado Pago não permite que o dono/vendedor da conta assine o próprio plano (autocompra). Como você é Super Admin, pode ativar o plano Pro da sua conta instantaneamente pelo painel /admin (em 1 clique), ou testar o checkout usando outro e-mail de comprador.";
      } else {
        friendlyError =
          "O Mercado Pago recusou a assinatura (Unauthorized access to resource). Verifique se o e-mail logado não é o mesmo titular das credenciais do Mercado Pago (autocompra é bloqueada), ou se o Token de Acesso de produção no Vercel está correto e atualizado.";
      }
    }

    return NextResponse.json(
      {
        error: friendlyError,
        rawMessage: rawMsg,
        code: isUnauthorized ? "MP_UNAUTHORIZED" : "MP_ERROR",
      },
      { status: 502 }
    );
  }
}
