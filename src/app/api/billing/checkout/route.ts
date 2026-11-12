import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getOrCreateProfileForUser,
  setMercadoPagoPreapprovalForUser,
} from "@/db/repository";
import { getAuth } from "@/lib/auth";
import {
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
          "Pagamentos via Mercado Pago ainda não configurados neste ambiente (defina MP_ACCESS_TOKEN).",
      },
      { status: 503 }
    );
  }

  await getOrCreateProfileForUser(session.user);
  const preApprovalClient = getPreApprovalClient();

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    request.headers.get("origin") ||
    "http://localhost:3000";

  const planId = process.env.MP_PRO_PLAN_ID?.trim();

  try {
    const preapproval = await preApprovalClient.create({
      body: {
        reason: "meucupom Pro (Mensal)",
        external_reference: session.user.id,
        payer_email: session.user.email,
        back_url: `${origin.replace(/\/+$/, "")}/painel?checkout=return`,
        status: "pending",
        ...(planId
          ? { preapproval_plan_id: planId }
          : {
              auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: getProPriceBrl(),
                currency_id: "BRL",
              },
            }),
      },
    });

    if (!preapproval.init_point) {
      return NextResponse.json(
        { error: "Mercado Pago não retornou link de pagamento." },
        { status: 502 }
      );
    }

    if (preapproval.id) {
      await setMercadoPagoPreapprovalForUser(session.user.id, preapproval.id);
    }

    return NextResponse.json({ url: preapproval.init_point });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro ao criar assinatura no Mercado Pago.",
      },
      { status: 502 }
    );
  }
}
