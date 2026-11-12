export type PageLayout = "classic" | "compact";
export type ThemeMode = "dark" | "light" | "auto";
export type BgStyle =
  | "glow"
  | "solid"
  | "gradient"
  | "mesh"
  | "aurora"
  | "spotlight"
  | "dots"
  | "waves"
  | "zigzag"
  | "scallop"
  | "topo"
  | "hexagons"
  | "diamonds"
  | "crosses"
  | "confetti"
  | "grid-lines"
  | "sunset"
  | "duotone"
  | "orb";
export type CardStyle =
  | "solid"
  | "glass"
  | "outline"
  | "brutal"
  | "top-accent"
  | "left-accent"
  | "elevated"
  | "dashed";
export type RadiusStyle = "rounded" | "soft" | "pill" | "extra" | "sharp";
export type FontStyle =
  | "jakarta"
  | "inter"
  | "space"
  | "outfit"
  | "poppins"
  | "dm-sans"
  | "playfair"
  | "syne"
  | "montserrat"
  | "lora";
export type FeaturedAnimation =
  | "shimmer"
  | "pulse"
  | "float"
  | "bounce"
  | "gradient-border"
  | "none";
export type SocialDisplayStyle = "both" | "icon" | "text";
export type LinkItemKind = "coupon" | "link" | "divider";

export interface LinkItemData {
  id: string;
  profileId: string;
  kind: LinkItemKind;
  title: string;
  badge: string;
  logoUrl: string;
  accentColor: string;
  tag: string;
  description: string;
  couponCode: string;
  url: string;
  ctaLabel: string;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  clicksCount: number;
  copiesCount: number;
}

export interface CreatorProfileData {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  initials: string;
  avatarUrl: string;
  instagramHandle: string;
  instagramUrl: string;
  tiktokHandle: string;
  tiktokUrl: string;
  youtubeHandle: string;
  youtubeUrl: string;
  bio: string;
  footerText: string;
  sectionTitle: string;
  helperTip: string;
  layout: PageLayout;
  themeMode: ThemeMode;
  allowThemeToggle: boolean;
  bgStyle: BgStyle;
  cardStyle: CardStyle;
  radiusStyle: RadiusStyle;
  fontStyle: FontStyle;
  titleFontStyle: FontStyle;
  nameFontStyle: FontStyle;
  featuredAnimation: FeaturedAnimation;
  socialDisplayStyle: SocialDisplayStyle;
  accentColor: string;
  ctaColor: string;
  bgColor: string;
  cardColor: string;
  textColor: string;
  showBranding: boolean;
  viewsCount: number;
  plan: "free" | "pro";
  subscriptionStatus: "inactive" | "active" | "trialing" | "past_due" | "canceled" | "permuta";
  mpPayerId: string;
  mpPreapprovalId: string;
  currentPeriodEnd: string | null;
  onboardingCompleted: boolean;
  isSuspended: boolean;
}

export interface DailyAnalyticsPoint {
  date: string;
  views: number;
  copies: number;
  clicks: number;
}

export interface PublicPagePayload {
  profile: CreatorProfileData;
  items: LinkItemData[];
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  themeMode: ThemeMode;
  bgStyle: BgStyle;
  cardStyle: CardStyle;
  radiusStyle: RadiusStyle;
  fontStyle?: FontStyle;
  titleFontStyle?: FontStyle;
  accentColor: string;
  ctaColor: string;
  bgColor: string;
  cardColor: string;
  textColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "ocean-blue",
    name: "Azul Oceano",
    description: "Fundo escuro com destaque azul vibrante",
    themeMode: "dark",
    bgStyle: "glow",
    cardStyle: "solid",
    radiusStyle: "rounded",
    accentColor: "#38BDF8",
    ctaColor: "#1E60CF",
    bgColor: "#070C14",
    cardColor: "#0E1624",
    textColor: "#F4F8FD",
  },
  {
    id: "minimal-light",
    name: "Branco Limpo",
    description: "Fundo claro suave com alto contraste",
    themeMode: "light",
    bgStyle: "glow",
    cardStyle: "solid",
    radiusStyle: "rounded",
    accentColor: "#2563EB",
    ctaColor: "#1B57BD",
    bgColor: "#EEF4FB",
    cardColor: "#FFFFFF",
    textColor: "#0B172A",
  },
  {
    id: "emerald-club",
    name: "Clube Esmeralda",
    description: "Verde performance com cards translúcidos",
    themeMode: "dark",
    bgStyle: "mesh",
    cardStyle: "glass",
    radiusStyle: "rounded",
    accentColor: "#34D399",
    ctaColor: "#059669",
    bgColor: "#05120E",
    cardColor: "#0B1F18",
    textColor: "#ECFDF5",
  },
  {
    id: "sunset-coral",
    name: "Sunset Coral",
    description: "Gradiente quente ideal para lifestyle e moda",
    themeMode: "dark",
    bgStyle: "sunset",
    cardStyle: "glass",
    radiusStyle: "pill",
    accentColor: "#FB923C",
    ctaColor: "#EA580C",
    bgColor: "#160B0A",
    cardColor: "#241311",
    textColor: "#FFF7ED",
  },
  {
    id: "rose-studio",
    name: "Rosé Studio",
    description: "Claro elegante com título editorial",
    themeMode: "light",
    bgStyle: "gradient",
    cardStyle: "elevated",
    radiusStyle: "extra",
    titleFontStyle: "playfair",
    fontStyle: "dm-sans",
    accentColor: "#DB2777",
    ctaColor: "#BE185D",
    bgColor: "#FDF2F8",
    cardColor: "#FFFFFF",
    textColor: "#3B0A22",
  },
  {
    id: "midnight-violet",
    name: "Violeta Noturno",
    description: "Contraste marcante com borda em destaque",
    themeMode: "dark",
    bgStyle: "aurora",
    cardStyle: "outline",
    radiusStyle: "rounded",
    titleFontStyle: "syne",
    fontStyle: "inter",
    accentColor: "#A78BFA",
    ctaColor: "#7C3AED",
    bgColor: "#0B0714",
    cardColor: "#150F24",
    textColor: "#F5F3FF",
  },
  {
    id: "neon-lime",
    name: "Neon Sport",
    description: "Energia esportiva com borda 3D marcada",
    themeMode: "dark",
    bgStyle: "dots",
    cardStyle: "brutal",
    radiusStyle: "soft",
    titleFontStyle: "space",
    fontStyle: "jakarta",
    accentColor: "#A3E635",
    ctaColor: "#65A30D",
    bgColor: "#090D08",
    cardColor: "#121A10",
    textColor: "#F7FEE7",
  },
  {
    id: "gold-luxury",
    name: "Dourado Premium",
    description: "Preto fosco com destaque âmbar sofisticado",
    themeMode: "dark",
    bgStyle: "spotlight",
    cardStyle: "top-accent",
    radiusStyle: "rounded",
    titleFontStyle: "playfair",
    fontStyle: "outfit",
    accentColor: "#FBBF24",
    ctaColor: "#D97706",
    bgColor: "#0B0A08",
    cardColor: "#181511",
    textColor: "#FFFBEB",
  },
  {
    id: "ocean-waves",
    name: "Oceano Profundo",
    description: "Ondas turquesa com barra lateral",
    themeMode: "dark",
    bgStyle: "waves",
    cardStyle: "left-accent",
    radiusStyle: "rounded",
    accentColor: "#2DD4BF",
    ctaColor: "#0D9488",
    bgColor: "#041216",
    cardColor: "#092128",
    textColor: "#F0FDFA",
  },
  {
    id: "sand-terracotta",
    name: "Areia & Terracota",
    description: "Tema claro aconchegante e orgânico",
    themeMode: "light",
    bgStyle: "aurora",
    cardStyle: "solid",
    radiusStyle: "rounded",
    titleFontStyle: "poppins",
    fontStyle: "dm-sans",
    accentColor: "#C2410C",
    ctaColor: "#9A3412",
    bgColor: "#FAF5F0",
    cardColor: "#FFFFFF",
    textColor: "#27140C",
  },
  {
    id: "ruby-urban",
    name: "Rubi Urbano",
    description: "Grade geométrica com destaque vermelho intenso",
    themeMode: "dark",
    bgStyle: "grid-lines",
    cardStyle: "solid",
    radiusStyle: "sharp",
    titleFontStyle: "syne",
    fontStyle: "inter",
    accentColor: "#FB7185",
    ctaColor: "#E11D48",
    bgColor: "#12080C",
    cardColor: "#1E0E15",
    textColor: "#FFF1F2",
  },
  {
    id: "sky-fresh",
    name: "Céu Claro",
    description: "Visual diurno leve com borda tracejada de cupom",
    themeMode: "light",
    bgStyle: "orb",
    cardStyle: "dashed",
    radiusStyle: "rounded",
    titleFontStyle: "outfit",
    fontStyle: "jakarta",
    accentColor: "#0284C7",
    ctaColor: "#0369A1",
    bgColor: "#F0F9FF",
    cardColor: "#FFFFFF",
    textColor: "#082F49",
  },
  {
    id: "mint-pastel",
    name: "Menta Pastel",
    description: "Claro minimalista com cards elevados",
    themeMode: "light",
    bgStyle: "duotone",
    cardStyle: "elevated",
    radiusStyle: "extra",
    titleFontStyle: "poppins",
    fontStyle: "inter",
    accentColor: "#059669",
    ctaColor: "#047857",
    bgColor: "#ECFDF5",
    cardColor: "#FFFFFF",
    textColor: "#064E3B",
  },
  {
    id: "graphite-minimal",
    name: "Grafite Minimal",
    description: "Monocromático sóbrio e elegante",
    themeMode: "dark",
    bgStyle: "grid-lines",
    cardStyle: "outline",
    radiusStyle: "sharp",
    titleFontStyle: "space",
    fontStyle: "dm-sans",
    accentColor: "#E2E8F0",
    ctaColor: "#475569",
    bgColor: "#090B0E",
    cardColor: "#13171D",
    textColor: "#F8FAFC",
  },
  {
    id: "cyber-matrix",
    name: "Matrix Hexágonos",
    description: "Colmeia futurista em verde esmeralda com cards de vidro",
    themeMode: "dark",
    bgStyle: "hexagons",
    cardStyle: "glass",
    radiusStyle: "rounded",
    titleFontStyle: "space",
    fontStyle: "jakarta",
    accentColor: "#10B981",
    ctaColor: "#059669",
    bgColor: "#04100D",
    cardColor: "#0A1F1A",
    textColor: "#ECFDF5",
  },
  {
    id: "topo-explorer",
    name: "Topografia Aventura",
    description: "Curvas de relevo topográfico em tom âmbar e preto fosco",
    themeMode: "dark",
    bgStyle: "topo",
    cardStyle: "solid",
    radiusStyle: "soft",
    titleFontStyle: "syne",
    fontStyle: "inter",
    accentColor: "#F59E0B",
    ctaColor: "#D97706",
    bgColor: "#100E0A",
    cardColor: "#1A1712",
    textColor: "#FFFBEB",
  },
];

export interface BgStyleOption {
  id: BgStyle;
  label: string;
  category: "classic" | "pattern" | "atmosphere";
  isPattern?: boolean;
}

export const BG_STYLE_OPTIONS: BgStyleOption[] = [
  // 5 opções grátis
  { id: "glow", label: "Glow Radial (Original)", category: "classic" },
  { id: "solid", label: "Cor Sólida", category: "classic" },
  { id: "gradient", label: "Gradiente Suave", category: "classic" },
  { id: "mesh", label: "Mesh Colorido", category: "classic" },
  { id: "dots", label: "Grade Pontilhada", category: "pattern", isPattern: true },
  // Fundos com Desenhos e Padrões (Exclusivos Pro)
  { id: "waves", label: "Desenho: Ondas Suaves", category: "pattern", isPattern: true },
  { id: "zigzag", label: "Desenho: Zig-Zag", category: "pattern", isPattern: true },
  { id: "scallop", label: "Desenho: Ondas em Camadas", category: "pattern", isPattern: true },
  { id: "topo", label: "Desenho: Curvas Topográficas", category: "pattern", isPattern: true },
  { id: "hexagons", label: "Desenho: Colmeia / Hexágonos", category: "pattern", isPattern: true },
  { id: "diamonds", label: "Desenho: Losangos", category: "pattern", isPattern: true },
  { id: "crosses", label: "Desenho: Sinais (+)", category: "pattern", isPattern: true },
  { id: "confetti", label: "Desenho: Formas & Confete", category: "pattern", isPattern: true },
  { id: "grid-lines", label: "Desenho: Grade / Blueprint", category: "pattern", isPattern: true },
  // Atmosferas e Efeitos (Exclusivos Pro)
  { id: "aurora", label: "Aurora Boreal", category: "atmosphere" },
  { id: "spotlight", label: "Holofote no Topo", category: "atmosphere" },
  { id: "sunset", label: "Horizonte Degradê", category: "atmosphere" },
  { id: "duotone", label: "Duotone Diagonal", category: "atmosphere" },
  { id: "orb", label: "Esferas Difusas", category: "atmosphere" },
];

export interface RadiusOption {
  id: RadiusStyle;
  label: string;
  description: string;
}

export const RADIUS_OPTIONS: RadiusOption[] = [
  { id: "rounded", label: "Arredondado (Padrão 20px)", description: "Visual equilibrado e moderno" },
  { id: "soft", label: "Suave (14px)", description: "Arredondamento sutil e limpo" },
  { id: "sharp", label: "Reto / Geométrico (8px)", description: "Cantos retos e contemporâneos" },
  { id: "pill", label: "Pílula / Redondo Completo", description: "Bordas em cápsula arredondada (Pro)" },
  { id: "extra", label: "Super Arredondado (30px)", description: "Bordas pronunciadas e orgânicas (Pro)" },
];

export const QUICK_PALETTES = [
  { name: "Azul", accent: "#38BDF8", cta: "#1E60CF" },
  { name: "Esmeralda", accent: "#34D399", cta: "#059669" },
  { name: "Coral", accent: "#FB923C", cta: "#EA580C" },
  { name: "Rosa", accent: "#F472B6", cta: "#DB2777" },
  { name: "Violeta", accent: "#A78BFA", cta: "#7C3AED" },
  { name: "Lima", accent: "#A3E635", cta: "#65A30D" },
  { name: "Ouro", accent: "#FBBF24", cta: "#D97706" },
  { name: "Turquesa", accent: "#2DD4BF", cta: "#0D9488" },
  { name: "Rubi", accent: "#FB7185", cta: "#E11D48" },
  { name: "Índigo", accent: "#818CF8", cta: "#4F46E5" },
  { name: "Pêssego", accent: "#FDBA74", cta: "#C2410C" },
  { name: "Grafite", accent: "#CBD5E1", cta: "#334155" },
];

export const FONT_OPTIONS: { id: FontStyle; label: string; category: string }[] = [
  { id: "jakarta", label: "Plus Jakarta Sans", category: "Moderna e limpa" },
  { id: "inter", label: "Inter", category: "Neutra e legível" },
  { id: "space", label: "Space Grotesk", category: "Geométrica tech" },
  { id: "outfit", label: "Outfit", category: "Arredondada leve" },
  { id: "poppins", label: "Poppins", category: "Expressiva social" },
  { id: "dm-sans", label: "DM Sans", category: "Editorial minimal" },
  { id: "playfair", label: "Playfair Display", category: "Serifada elegante" },
  { id: "syne", label: "Syne", category: "Display marcante" },
  { id: "montserrat", label: "Montserrat", category: "Forte e geométrica" },
  { id: "lora", label: "Lora", category: "Clássica editorial" },
];

export const FEATURED_ANIMATION_OPTIONS: {
  id: FeaturedAnimation;
  label: string;
  description: string;
}[] = [
  { id: "shimmer", label: "Brilho + Pulso", description: "Reflexo de luz passando pelo card" },
  { id: "pulse", label: "Pulso Suave", description: "Anel de brilho respirando no contorno" },
  { id: "float", label: "Flutuação", description: "Movimento leve de levitação" },
  { id: "bounce", label: "Chamada / Balanço", description: "Pequeno destaque rítmico de atenção" },
  {
    id: "gradient-border",
    label: "Aura Gradiente",
    description: "Brilho colorido contínuo no destaque",
  },
  { id: "none", label: "Sem animação", description: "Estático, apenas visual destacado" },
];

export const DEFAULT_PROFILE_CUSTOMIZATION: Pick<
  CreatorProfileData,
  | "layout"
  | "themeMode"
  | "allowThemeToggle"
  | "bgStyle"
  | "cardStyle"
  | "radiusStyle"
  | "fontStyle"
  | "titleFontStyle"
  | "nameFontStyle"
  | "featuredAnimation"
  | "socialDisplayStyle"
  | "accentColor"
  | "ctaColor"
  | "bgColor"
  | "cardColor"
  | "textColor"
  | "sectionTitle"
  | "helperTip"
  | "footerText"
  | "showBranding"
> = {
  layout: "classic",
  themeMode: "dark",
  allowThemeToggle: true,
  bgStyle: "glow",
  cardStyle: "solid",
  radiusStyle: "rounded",
  fontStyle: "jakarta",
  titleFontStyle: "jakarta",
  nameFontStyle: "jakarta",
  featuredAnimation: "shimmer",
  socialDisplayStyle: "both",
  accentColor: "#38BDF8",
  ctaColor: "#1E60CF",
  bgColor: "#070C14",
  cardColor: "#0E1624",
  textColor: "#F4F8FD",
  sectionTitle: "Parceiros & Cupons",
  helperTip: "Toque no cupom para copiar e acesse pelo link oficial.",
  footerText: "Links de parceiro · Descontos sujeitos às condições vigentes em cada loja.",
  showBranding: true,
};

export function isSafeHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

const SAFE_DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;

export function isSafeMediaSrc(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }
  if (SAFE_DATA_IMAGE_RE.test(trimmed)) {
    return true;
  }
  return isSafeHttpUrl(trimmed);
}

export function isSafeHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

export function isSlugBlocked(slug: string): boolean {
  const blocked = [
    "api",
    "entrar",
    "painel",
    "login",
    "signup",
    "auth",
    "admin",
    "root",
    "sobre",
    "privacidade",
    "termos",
    "esqueci-senha",
    "redefinir-senha",
    "suporte",
    "pagamento",
    "pagamentos",
    "fatura",
    "cobranca",
    "pix",
    "banco",
    "oficial",
    "verificado",
    "whatsapp",
    "instagram",
    "google",
    "tiktok",
    "stripe",
    "meucupom",
  ];
  return blocked.includes(slug) || blocked.some((w) => w.length >= 5 && slug.includes(w));
}

export function sanitizeSlug(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "MC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function hexToRgb(hex: string): [number, number, number] | null {
  if (!isSafeHexColor(hex)) return null;
  const clean = hex.trim().slice(1);
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return 4.5;
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function pickReadableInk(bgHex: string): "#FFFFFF" | "#0B172A" {
  const darkContrast = getContrastRatio(bgHex, "#0B172A");
  const lightContrast = getContrastRatio(bgHex, "#FFFFFF");
  return lightContrast >= darkContrast ? "#FFFFFF" : "#0B172A";
}

export function isLightHex(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  return relativeLuminance(rgb) > 0.42;
}
