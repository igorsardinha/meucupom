import {
  BgStyle,
  CreatorProfileData,
  FeaturedAnimation,
  RadiusStyle,
  ThemePreset,
} from "@/types/meucupom";

export type PlanTier = "free" | "pro";
export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "permuta";

export const FREE_MAX_ACTIVE_OR_TOTAL_LINKS = 5;

// Animações de destaque
export const PRO_ALLOWED_ANIMATIONS: FeaturedAnimation[] = [
  "shimmer",
  "pulse",
  "float",
  "bounce",
  "gradient-border",
  "none",
];

export const FREE_ALLOWED_ANIMATIONS: FeaturedAnimation[] = ["shimmer", "pulse", "none"];

// Estilos de fundo: exatamente 5 opções liberadas no Grátis; as outras 14 (especialmente com desenhos) são Pro
export const FREE_ALLOWED_BG_STYLES: BgStyle[] = [
  "glow",
  "solid",
  "gradient",
  "mesh",
  "dots",
];

// Estilos de borda: exatamente 3 opções liberadas no Grátis; pílula e super arredondada são Pro
export const FREE_ALLOWED_RADIUS_STYLES: RadiusStyle[] = [
  "rounded",
  "soft",
  "sharp",
];

export function isProPlan(profile: Pick<CreatorProfileData, "plan" | "subscriptionStatus">): boolean {
  if (profile.plan !== "pro") return false;
  return (
    profile.subscriptionStatus === "active" ||
    profile.subscriptionStatus === "trialing" ||
    profile.subscriptionStatus === "inactive" ||
    profile.subscriptionStatus === "permuta"
  );
}

export function isAnimationAllowedForPlan(
  animation: FeaturedAnimation,
  isPro: boolean
): boolean {
  if (isPro) return PRO_ALLOWED_ANIMATIONS.includes(animation);
  return FREE_ALLOWED_ANIMATIONS.includes(animation);
}

export function isBgStyleAllowedForPlan(
  bgStyle: BgStyle,
  isPro: boolean
): boolean {
  if (isPro) return true;
  return FREE_ALLOWED_BG_STYLES.includes(bgStyle);
}

export function isRadiusStyleAllowedForPlan(
  radius: RadiusStyle,
  isPro: boolean
): boolean {
  if (isPro) return true;
  return FREE_ALLOWED_RADIUS_STYLES.includes(radius);
}

export function isThemePresetAllowedForPlan(
  preset: Pick<ThemePreset, "bgStyle" | "radiusStyle">,
  isPro: boolean
): boolean {
  if (isPro) return true;
  return (
    isBgStyleAllowedForPlan(preset.bgStyle, false) &&
    isRadiusStyleAllowedForPlan(preset.radiusStyle, false)
  );
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
      "5 estilos de fundo clássicos (Glow, Sólido, Gradiente, Mesh, Pontilhado)",
      "3 formatos de borda (Arredondado, Suave e Reto)",
      "Layouts Clássico e Compacto + temas básicos",
      "Métricas totais de visitas, cópias e cliques",
    ],
    limitations: [
      "Selo oficial meucupom.bio no rodapé",
      "14 fundos exclusivos (com desenhos) e temas Pro bloqueados",
      "Bordas Pílula e Super Arredondada exclusivas do Pro",
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
      "Selo de perfil verificado (ícone de tick azul na foto)",
      "Remover logo meucupom.bio (página 100% white-label)",
      "Todos os 19 fundos (incluindo todos com desenhos: Ondas, Zig-zag, Colmeia, Grid, etc.)",
      "Todas as opções de borda (Pílula e Super Arredondada)",
      "Todos os temas prontos exclusivos com ícones visuais",
      "Todas as animações de destaque (Flutuação, Balanço, Aura)",
      "Analytics detalhado com gráfico de 7 e 30 dias",
      "Prioridade em novos recursos e suporte",
    ],
    limitations: [],
  },
];
