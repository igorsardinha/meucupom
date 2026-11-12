import Stripe from "stripe";

let cachedStripe: Stripe | null = null;

export function isStripeEnabled(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PRICE_ID_PRO?.trim()
  );
}

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY não configurada.");
  }
  if (!cachedStripe) {
    cachedStripe = new Stripe(key);
  }
  return cachedStripe;
}
