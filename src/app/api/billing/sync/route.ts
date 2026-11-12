import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrCreateProfileForUser,
  syncMercadoPagoSubscription,
} from "@/db/repository";
import { getAuth } from "@/lib/auth";
import {
  getPreApprovalClient,
  isMercadoPagoEnabled,
  mapMercadoPagoStatus,
} from "@/lib/mercadopago";

const syncSchema = z.object({
  preapprovalId: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
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

  let preapprovalId = "";
  try {
    const raw = await request.json();
    const parsed = syncSchema.safeParse(raw);
    if (parsed.success && parsed.data.preapprovalId) {
      preapprovalId = parsed.data.preapprovalId;
    }
  } catch {
    // Allow empty body; fallback to saved profile.mpPreapprovalId
  }

  const current = await getOrCreateProfileForUser(session.user);
  const targetId = preapprovalId || current.profile.mpPreapprovalId;
  if (!targetId) {
    return NextResponse.json({ profile: current.profile });
  }

  try {
    const sub = await getPreApprovalClient().get({ id: targetId });
    if (
      sub.external_reference &&
      sub.external_reference !== session.user.id
    ) {
      return NextResponse.json({ error: "Assinatura não pertence ao usuário." }, { status: 403 });
    }

    const mappedStatus = mapMercadoPagoStatus(sub.status);
    const isAuthorized = sub.status === "authorized";

    await syncMercadoPagoSubscription({
      userId: session.user.id,
      mpPayerId: sub.payer_id ? String(sub.payer_id) : undefined,
      mpPreapprovalId: sub.id || targetId,
      plan: isAuthorized ? "pro" : "free",
      subscriptionStatus: mappedStatus,
      currentPeriodEnd: sub.next_payment_date ? new Date(sub.next_payment_date) : null,
    });

    const refreshed = await getOrCreateProfileForUser(session.user);
    return NextResponse.json({ profile: refreshed.profile });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Não foi possível consultar assinatura no Mercado Pago.",
      },
      { status: 502 }
    );
  }
}
