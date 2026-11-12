import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getOrCreateProfileForUser, setStripeCustomerIdForUser } from "@/db/repository";
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
      {
        error:
          "Pagamentos Stripe ainda não configurados neste ambiente (defina STRIPE_SECRET_KEY e STRIPE_PRICE_ID_PRO).",
      },
      { status: 503 }
    );
  }

  const { profile } = await getOrCreateProfileForUser(session.user);
  const stripe = getStripeClient();
  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: profile.displayName,
      metadata: {
        userId: session.user.id,
        profileId: profile.id,
        slug: profile.slug,
      },
    });
    customerId = customer.id;
    await setStripeCustomerIdForUser(session.user.id, customerId);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID_PRO!.trim(),
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: `${origin}/painel?checkout=success`,
    cancel_url: `${origin}/painel?checkout=canceled`,
    metadata: {
      userId: session.user.id,
      profileId: profile.id,
    },
    subscription_data: {
      metadata: {
        userId: session.user.id,
        profileId: profile.id,
      },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
