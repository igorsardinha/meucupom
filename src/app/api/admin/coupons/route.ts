import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  createPlatformCoupon,
  deletePlatformCoupon,
  listPlatformCoupons,
  togglePlatformCouponActive,
} from "@/db/repository";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";

export async function GET() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  const coupons = await listPlatformCoupons();
  return NextResponse.json({ coupons });
}

export async function POST(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      code?: string;
      influencerName?: string;
      influencerEmail?: string;
      description?: string;
      durationDays?: number;
      maxUses?: number;
      expiresAt?: string | null;
    };

    if (!body.code || !body.influencerName) {
      return NextResponse.json(
        { error: "Código do cupom e nome do influenciador são obrigatórios." },
        { status: 400 }
      );
    }

    const res = await createPlatformCoupon({
      code: body.code,
      influencerName: body.influencerName,
      influencerEmail: body.influencerEmail,
      description: body.description,
      durationDays: typeof body.durationDays === "number" ? body.durationDays : 30,
      maxUses: typeof body.maxUses === "number" ? body.maxUses : 100,
      expiresAt: body.expiresAt,
    });

    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const coupons = await listPlatformCoupons();
    return NextResponse.json({ ok: true, coupon: res.coupon, coupons });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao criar cupom.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      couponId?: string;
      isActive?: boolean;
    };

    if (!body.couponId || typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    await togglePlatformCouponActive(body.couponId, body.isActive);
    const coupons = await listPlatformCoupons();
    return NextResponse.json({ ok: true, coupons });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar cupom.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get("couponId");
    if (!couponId) {
      return NextResponse.json({ error: "ID do cupom não informado." }, { status: 400 });
    }

    await deletePlatformCoupon(couponId);
    const coupons = await listPlatformCoupons();
    return NextResponse.json({ ok: true, coupons });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao remover cupom.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
