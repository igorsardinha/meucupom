import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { syncStripeSubscription } from "@/db/repository";
import { getStripeClient } from "@/lib/stripe";
import type { CreatorProfileData } from "@/types/meucupom";

function mapStripeStatus(
  status: Stripe.Subscription.Status
): CreatorProfileData["subscriptionStatus"] {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due") return "past_due";
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
    return "canceled";
  }
  return "inactive";
}

function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const itemEnd = sub.items?.data?.[0]?.current_period_end;
  if (typeof itemEnd === "number") {
    return new Date(itemEnd * 1000);
  }
  return null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret missing." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid signature." },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        const mapped = mapStripeStatus(sub.status);
        await syncStripeSubscription({
          userId: session.metadata?.userId || sub.metadata?.userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          plan: mapped === "active" || mapped === "trialing" ? "pro" : "free",
          subscriptionStatus: mapped,
          currentPeriodEnd: getPeriodEnd(sub),
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      const mapped = mapStripeStatus(sub.status);
      const isActive = mapped === "active" || mapped === "trialing";
      await syncStripeSubscription({
        userId: sub.metadata?.userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        plan: isActive ? "pro" : "free",
        subscriptionStatus: mapped,
        currentPeriodEnd: getPeriodEnd(sub),
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
