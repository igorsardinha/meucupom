import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getOrCreateProfileForUser } from "@/db/repository";
import { getAuth } from "@/lib/auth";
import { getStripeClient, isStripeEnabled } from "@/lib/stripe";

export async function POST(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!isStripeEnabled()) {
    return NextResponse.json(
      { error: "Stripe não configurado neste ambiente." },
      { status: 503 }
    );
  }

  const { profile } = await getOrCreateProfileForUser(session.user);
  if (!profile.stripeCustomerId) {
    return NextResponse.json(
      { error: "Nenhuma assinatura Stripe vinculada à sua conta." },
      { status: 400 }
    );
  }

  const stripe = getStripeClient();
  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${origin}/painel`,
  });

  return NextResponse.json({ url: portal.url });
}
