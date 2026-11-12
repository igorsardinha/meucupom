import {
  MercadoPagoConfig,
  PreApproval,
  WebhookSignatureValidator,
} from "mercadopago";
import type { CreatorProfileData } from "@/types/meucupom";

let cachedConfig: MercadoPagoConfig | null = null;

export function getMercadoPagoAccessToken(): string {
  const raw = process.env.MP_ACCESS_TOKEN?.trim() || "";
  return raw.replace(/^["']|["']$/g, "").trim();
}

export function isMercadoPagoEnabled(): boolean {
  return Boolean(getMercadoPagoAccessToken());
}

export function getProPriceBrl(): number {
  const raw = Number(process.env.MP_PRO_PRICE_BRL?.trim());
  if (Number.isFinite(raw) && raw >= 1) {
    return Number(raw.toFixed(2));
  }
  return 19.9;
}

export function getMercadoPagoConfig(): MercadoPagoConfig {
  const accessToken = getMercadoPagoAccessToken();
  if (!accessToken) {
    throw new Error("MP_ACCESS_TOKEN não configurado.");
  }
  if (!cachedConfig) {
    cachedConfig = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10000 },
    });
  }
  return cachedConfig;
}

export function getPreApprovalClient(): PreApproval {
  return new PreApproval(getMercadoPagoConfig());
}

export function mapMercadoPagoStatus(
  status?: string | null
): CreatorProfileData["subscriptionStatus"] {
  if (status === "authorized") return "active";
  if (status === "paused") return "past_due";
  if (status === "cancelled") return "canceled";
  return "inactive";
}

export function verifyMercadoPagoWebhook(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): void {
  WebhookSignatureValidator.validate({
    xSignature: params.xSignature,
    xRequestId: params.xRequestId,
    dataId: params.dataId,
    secret: params.secret,
  });
}
