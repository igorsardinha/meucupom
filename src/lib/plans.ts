import { CreatorProfileData, FeaturedAnimation } from "@/types/meucupom";

export type PlanTier = "free" | "pro";
export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

export const FREE_MAX_ACTIVE_OR_TOTAL_LINKS = 5;

export const PRO_ALLOWED_ANIMATIONS: FeaturedAnimation[] = [
  "shimmer",
  "pulse",
  "float",
  "bounce",
  "gradient-border",
  "none",
];

export const FREE_ALLOWED_ANIMATIONS: FeaturedAnimation[] = ["shimmer", "pulse", "none"];

export function isProPlan(profile: Pick<CreatorProfileData, "plan" | "subscriptionStatus">): boolean {
  if (profile.plan !== "pro") return false;
  return (
    profile.subscriptionStatus === "active" ||
    profile.subscriptionStatus === "trialing" ||
    profile.subscriptionStatus === "inactive"
  );
}

export function isAnimationAllowedForPlan(
  animation: FeaturedAnimation,
  isPro: boolean
): boolean {
  if (isPro) return PRO_ALLOWED_ANIMATIONS.includes(animation);
  return FREE_ALLOWED_ANIMATIONS.includes(animation);
}

export const PLAN_CARDS = [
  {
    id: "free" as const,
    name: "Grátis",
    priceLabel: "R$ 0",
    periodLabel: "para sempre",
    description: "Ideal para começar a divulgar seus primeiros parceiros.",
    features: [
      `Até ${FREE_MAX_ACTIVE_OR_TOTAL_LINKS} cupons ou links`,
      "Divisórias ilimitadas",
      "Login social com Google ou e-mail",
      "Layouts Clássico e Compacto + temas prontos",
      "Métricas totais de visitas, cópias e cliques",
    ],
    limitations: [
      "Selo \"Feito com meucupom\" no rodapé",
      "Animações básicas de destaque",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    priceLabel: "R$ 19,90",
    periodLabel: "/mês",
    description: "Para criadores e atletas que monetizam com vários parceiros.",
    features: [
      "Cupons e links ilimitados",
      "Remover selo \"Feito com meucupom\"",
      "Todas as animações de destaque (Flutuação, Balanço, Aura)",
      "Analytics detalhado com gráfico de 7 e 30 dias",
      "Prioridade em novos recursos e suporte",
    ],
    limitations: [],
  },
];
