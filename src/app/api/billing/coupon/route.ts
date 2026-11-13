import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { redeemPlatformCouponForUser, validatePlatformCouponForUser } from "@/db/repository";
import { getAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Faça login para verificar cupons." }, { status: 401 });
  }

  const url = new URL(request.url);
  const code = (url.searchParams.get("code") || "").trim();
  if (!code) {
    return NextResponse.json({ error: "Informe o código do cupom." }, { status: 400 });
  }

  const result = await validatePlatformCouponForUser(session.user.id, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Faça login para utilizar um cupom." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { code?: string };
    const code = (body.code || "").trim();
    if (!code) {
      return NextResponse.json({ error: "Digite o código do cupom." }, { status: 400 });
    }

    const result = await redeemPlatformCouponForUser(session.user.id, code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      profile: result.profile,
      coupon: result.coupon,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao processar cupom.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
