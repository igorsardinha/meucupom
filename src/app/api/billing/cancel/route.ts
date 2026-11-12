import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getOrCreateProfileForUser,
  syncMercadoPagoSubscription,
} from "@/db/repository";
import { getAuth } from "@/lib/auth";
import { getPreApprovalClient, isMercadoPagoEnabled } from "@/lib/mercadopago";

export async function POST() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!isMercadoPagoEnabled()) {
    return NextResponse.json(
      { error: "Mercado Pago não configurado neste ambiente." },
      { status: 503 }
    );
  }

  const { profile } = await getOrCreateProfileForUser(session.user);
  if (!profile.mpPreapprovalId) {
    return NextResponse.json(
      { error: "Nenhuma assinatura do Mercado Pago vinculada à sua conta." },
      { status: 400 }
    );
  }

  try {
    await getPreApprovalClient().update({
      id: profile.mpPreapprovalId,
      body: { status: "cancelled" },
    });

    await syncMercadoPagoSubscription({
      userId: session.user.id,
      mpPreapprovalId: profile.mpPreapprovalId,
      plan: "free",
      subscriptionStatus: "canceled",
      currentPeriodEnd: null,
    });

    const refreshed = await getOrCreateProfileForUser(session.user);
    return NextResponse.json({ ok: true, profile: refreshed.profile });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Não foi possível cancelar a assinatura no Mercado Pago.",
      },
      { status: 502 }
    );
  }
}
