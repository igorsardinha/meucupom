import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  adminUpdateUserProfile,
  getAdminOverviewData,
} from "@/db/repository";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import {
  getPreApprovalClient,
  isMercadoPagoEnabled,
  mapMercadoPagoStatus,
} from "@/lib/mercadopago";

const patchUserSchema = z.object({
  userId: z.string().min(1),
  plan: z.enum(["free", "pro"]).optional(),
  subscriptionStatus: z
    .enum(["inactive", "active", "trialing", "past_due", "canceled", "permuta"])
    .optional(),
  isSuspended: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  mpPayerId: z.string().optional(),
  mpPreapprovalId: z.string().optional(),
  currentPeriodEndDays: z.number().int().min(0).max(3650).optional().nullable(),
  syncMercadoPago: z.boolean().optional(),
  cancelMercadoPago: z.boolean().optional(),
});

async function requireSuperAdmin() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Não autenticado.", status: 401 as const, session: null };
  }
  if (!isSuperAdminEmail(session.user.email)) {
    return { error: "Acesso restrito ao Super Admin.", status: 403 as const, session: null };
  }
  return { error: null, status: 200 as const, session };
}

export async function GET() {
  const authCheck = await requireSuperAdmin();
  if (authCheck.error || !authCheck.session) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const data = await getAdminOverviewData();
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const authCheck = await requireSuperAdmin();
  if (authCheck.error || !authCheck.session) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = patchUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const {
    userId,
    plan,
    subscriptionStatus,
    isSuspended,
    isVerified,
    mpPayerId,
    mpPreapprovalId,
    currentPeriodEndDays,
    syncMercadoPago,
    cancelMercadoPago,
  } = parsed.data;

  if (syncMercadoPago || cancelMercadoPago) {
    if (!isMercadoPagoEnabled()) {
      return NextResponse.json(
        { error: "Mercado Pago não configurado neste ambiente." },
        { status: 503 }
      );
    }

    const overview = await getAdminOverviewData();
    const targetUser = overview.users.find((u) => u.userId === userId);
    const targetPreapprovalId = mpPreapprovalId || targetUser?.mpPreapprovalId;
    if (!targetPreapprovalId) {
      return NextResponse.json(
        { error: "Usuário não possui assinatura Mercado Pago vinculada." },
        { status: 400 }
      );
    }

    const client = getPreApprovalClient();
    if (cancelMercadoPago) {
      await client.update({
        id: targetPreapprovalId,
        body: { status: "cancelled" },
      });
      await adminUpdateUserProfile({
        userId,
        plan: "free",
        subscriptionStatus: "canceled",
        currentPeriodEnd: null,
      });
    } else if (syncMercadoPago) {
      const sub = await client.get({ id: targetPreapprovalId });
      const mappedStatus = mapMercadoPagoStatus(sub.status);
      await adminUpdateUserProfile({
        userId,
        plan: sub.status === "authorized" ? "pro" : "free",
        subscriptionStatus: mappedStatus,
        mpPayerId: sub.payer_id ? String(sub.payer_id) : undefined,
        mpPreapprovalId: sub.id || targetPreapprovalId,
        currentPeriodEnd: sub.next_payment_date ? new Date(sub.next_payment_date) : null,
      });
    }

    const refreshed = await getAdminOverviewData();
    return NextResponse.json({ ok: true, data: refreshed });
  }

  let currentPeriodEnd: Date | null | undefined = undefined;
  if (currentPeriodEndDays !== undefined) {
    currentPeriodEnd =
      currentPeriodEndDays === null
        ? null
        : new Date(Date.now() + currentPeriodEndDays * 86_400_000);
  }

  await adminUpdateUserProfile({
    userId,
    plan,
    subscriptionStatus,
    isSuspended,
    isVerified,
    mpPayerId,
    mpPreapprovalId,
    currentPeriodEnd,
  });

  const refreshed = await getAdminOverviewData();
  return NextResponse.json({ ok: true, data: refreshed });
}
