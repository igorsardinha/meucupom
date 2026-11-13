"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlignJustify,
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Gift,
  GripVertical,
  KeyRound,
  LayoutGrid,
  Link2,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Minus,
  MousePointerClick,
  Palette,
  Pencil,
  Percent,
  Plus,
  QrCode,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TreePine,
  TrendingUp,
  Trophy,
  Upload,
  User,
  X,
  Zap,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  FREE_MAX_ACTIVE_OR_TOTAL_LINKS,
  isAnimationAllowedForPlan,
  isBgStyleAllowedForPlan,
  isProPlan,
  isRadiusStyleAllowedForPlan,
  isThemePresetAllowedForPlan,
  PLAN_CARDS,
} from "@/lib/plans";
import {
  BG_STYLE_OPTIONS,
  BgStyle,
  CardStyle,
  computeInitials,
  CreatorProfileData,
  DailyAnalyticsPoint,
  FEATURED_ANIMATION_OPTIONS,
  FeaturedAnimation,
  FONT_OPTIONS,
  FontStyle,
  getContrastRatio,
  isSafeMediaSrc,
  LinkItemData,
  LinkItemKind,
  PageLayout,
  PlatformCouponData,
  QUICK_PALETTES,
  RADIUS_OPTIONS,
  RadiusStyle,
  sanitizeSlug,
  SocialDisplayStyle,
  THEME_PRESETS,
  ThemeMode,
  ThemePreset,
} from "@/types/meucupom";
import { BrandIcon } from "@/components/BrandIcon";
import { BrandLogo } from "@/components/BrandLogo";
import { getBrandIconCandidates } from "@/lib/brand-icons";
import { PublicBioView } from "./PublicBioView";
import { LinktreeImportModal } from "./LinktreeImportModal";

interface DashboardClientProps {
  initialProfile: CreatorProfileData;
  initialItems: LinkItemData[];
  userEmail: string;
  mercadoPagoEnabled: boolean;
  isAdmin?: boolean;
}

type TabKey = "items" | "appearance" | "analytics" | "profile" | "plan";

interface ItemFormState {
  id: string | null;
  kind: LinkItemKind;
  title: string;
  url: string;
  couponCode: string;
  tag: string;
  description: string;
  ctaLabel: string;
  logoUrl: string;
  accentColor: string;
  isFeatured: boolean;
  featuredLabel: string;
  featuredIcon: string;
  expiresAt: string;
}

const EMPTY_ITEM_FORM: ItemFormState = {
  id: null,
  kind: "coupon",
  title: "",
  url: "",
  couponCode: "",
  tag: "",
  description: "",
  ctaLabel: "",
  logoUrl: "",
  accentColor: "#38BDF8",
  isFeatured: false,
  featuredLabel: "Destaque",
  featuredIcon: "sparkles",
  expiresAt: "",
};

const FEATURED_ICON_OPTIONS: Array<{
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "sparkles", label: "Brilho", icon: Sparkles },
  { key: "flame", label: "Fogo", icon: Flame },
  { key: "zap", label: "Raio", icon: Zap },
  { key: "star", label: "Estrela", icon: Star },
  { key: "trophy", label: "Troféu", icon: Trophy },
  { key: "tag", label: "Etiqueta", icon: Tag },
  { key: "gift", label: "Presente", icon: Gift },
  { key: "percent", label: "% Off", icon: Percent },
  { key: "clock", label: "Tempo", icon: Clock },
];

const FEATURED_LABEL_SUGGESTIONS = [
  "Destaque",
  "Oferta Relâmpago",
  "Exclusivo",
  "Top 1",
  "Mais Vendido",
  "Cupom VIP",
  "Imperdível",
  "Black Friday",
];

function toDateTimeLocalInput(isoString: string | null | undefined): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

function FeaturedIconViewer({
  iconKey,
  className = "h-3 w-3",
}: {
  iconKey?: string;
  className?: string;
}) {
  switch (iconKey) {
    case "flame":
      return <Flame className={className} aria-hidden="true" />;
    case "zap":
      return <Zap className={className} aria-hidden="true" />;
    case "star":
      return <Star className={className} aria-hidden="true" />;
    case "trophy":
      return <Trophy className={className} aria-hidden="true" />;
    case "tag":
      return <Tag className={className} aria-hidden="true" />;
    case "gift":
      return <Gift className={className} aria-hidden="true" />;
    case "percent":
      return <Percent className={className} aria-hidden="true" />;
    case "clock":
      return <Clock className={className} aria-hidden="true" />;
    case "sparkles":
    default:
      return <Sparkles className={className} aria-hidden="true" />;
  }
}

function DashboardCountdownBadge({ expiresAt }: { expiresAt: string }) {
  const [now] = useState(() => Date.now());
  const target = new Date(expiresAt).getTime();
  if (isNaN(target)) return null;
  const diff = target - now;
  if (diff <= 0) {
    return (
      <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-300">
        Expirado
      </span>
    );
  }
  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const label = days >= 1 ? `${days}d ${hours}h` : `${hours}h rest.`;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
      <Clock className="h-2.5 w-2.5" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

function BrandPreviewIcon({
  title,
  url,
  logoUrl,
  accentColor,
}: {
  title: string;
  url: string;
  logoUrl: string;
  accentColor: string;
}) {
  const candidates = useMemo(() => {
    return getBrandIconCandidates(title, url, logoUrl);
  }, [title, url, logoUrl]);

  const [currentKey, setCurrentKey] = useState("");
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const candidateKey = candidates.join("|");
  if (candidateKey !== currentKey) {
    setCurrentKey(candidateKey);
    setIdx(0);
    setLoaded(false);
  }

  const src = candidates[idx];
  const initials = computeInitials(title || "MC");
  const fallback = !src || !loaded;

  return (
    <div
      className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/15 text-xs font-bold"
      style={{
        background: !fallback ? "#FFFFFF" : `${accentColor}33`,
        color: "#FFFFFF",
      }}
    >
      {fallback ? <span>{initials}</span> : null}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth <= 1) {
              setLoaded(false);
              setIdx((i) => i + 1);
            } else {
              setLoaded(true);
            }
          }}
          onError={() => {
            setLoaded(false);
            setIdx((i) => i + 1);
          }}
          className={`absolute inset-1 h-[calc(100%-8px)] w-[calc(100%-8px)] rounded-lg object-contain ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </div>
  );
}

async function resizeAvatarToAsset(
  file: File
): Promise<{ blob: Blob; filename: string; dataUrl: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem (PNG, JPG ou WebP).");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("A imagem deve ter no máximo 8 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não foi possível ler esta imagem."));
      el.src = objectUrl;
    });

    const size = 360;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Navegador não suporta processamento de imagem.");
    }

    const minSide = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = Math.max(0, (img.naturalWidth - minSide) / 2);
    const sy = Math.max(0, (img.naturalHeight - minSide) / 2);
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

    const webp = canvas.toDataURL("image/webp", 0.86);
    const useWebp = webp.startsWith("data:image/webp") && webp.length < 280000;
    const mimeType = useWebp ? "image/webp" : "image/jpeg";
    const filename = useWebp ? "avatar.webp" : "avatar.jpg";
    const dataUrl = useWebp ? webp : canvas.toDataURL("image/jpeg", 0.85);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Falha ao processar imagem."))),
        mimeType,
        useWebp ? 0.86 : 0.85
      );
    });

    return { blob, filename, dataUrl };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function setupLightDismissFallback(dialog: HTMLDialogElement | null) {
  if (!dialog || "closedBy" in HTMLDialogElement.prototype) return () => {};
  let pressedOutside = false;
  const isOutside = (e: PointerEvent) => {
    const r = dialog.getBoundingClientRect();
    return (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    );
  };
  const onDown = (e: PointerEvent) => {
    pressedOutside = isOutside(e);
  };
  const onUp = (e: PointerEvent) => {
    if (pressedOutside && isOutside(e)) dialog.close();
  };
  dialog.addEventListener("pointerdown", onDown);
  dialog.addEventListener("pointerup", onUp);
  return () => {
    dialog.removeEventListener("pointerdown", onDown);
    dialog.removeEventListener("pointerup", onUp);
  };
}

function getThemePreviewStyle(preset: ThemePreset): {
  backgroundColor: string;
  backgroundImage?: string;
  backgroundSize?: string;
} {
  const safeAccent = preset.accentColor || "#38BDF8";
  const safeCta = preset.ctaColor || "#1E60CF";
  const svgUrl = (svg: string) =>
    `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

  switch (preset.bgStyle) {
    case "solid":
      return { backgroundColor: preset.bgColor, backgroundImage: "none" };
    case "gradient":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${safeCta} 45%, ${preset.bgColor}) 0%, ${preset.bgColor} 55%, color-mix(in oklab, ${safeAccent} 35%, ${preset.bgColor}) 100%)`,
      };
    case "mesh":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `radial-gradient(circle at 20% 20%, color-mix(in oklab, ${safeAccent} 50%, transparent) 0%, transparent 60%), radial-gradient(circle at 80% 30%, color-mix(in oklab, ${safeCta} 50%, transparent) 0%, transparent 60%)`,
      };
    case "aurora":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `radial-gradient(ellipse 90% 60% at 20% 0%, color-mix(in oklab, ${safeAccent} 55%, transparent), transparent 70%), radial-gradient(ellipse 80% 50% at 80% 20%, color-mix(in oklab, ${safeCta} 50%, transparent), transparent 70%)`,
      };
    case "spotlight":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `radial-gradient(circle at 50% 0%, color-mix(in oklab, ${safeAccent} 65%, transparent) 0%, color-mix(in oklab, ${safeCta} 30%, transparent) 35%, transparent 70%)`,
      };
    case "dots":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `radial-gradient(circle, color-mix(in oklab, ${safeAccent} 50%, transparent) 1.2px, transparent 1.2px)`,
        backgroundSize: "8px 8px",
      };
    case "waves":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `radial-gradient(circle at 50% 0%, color-mix(in oklab, ${safeCta} 35%, transparent), transparent 60%), ${svgUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="12" viewBox="0 0 32 12"><path d="M0 6 Q8 1 16 6 T32 6" fill="none" stroke="${safeAccent}" stroke-opacity="0.55" stroke-width="1.6"/></svg>`
        )}`,
        backgroundSize: "100% 100%, 32px 12px",
      };
    case "zigzag":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `radial-gradient(circle at 50% 0%, color-mix(in oklab, ${safeCta} 35%, transparent), transparent 60%), ${svgUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12"><path d="M0 9 L10 3 L20 9" fill="none" stroke="${safeAccent}" stroke-opacity="0.55" stroke-width="1.6"/></svg>`
        )}`,
        backgroundSize: "100% 100%, 20px 12px",
      };
    case "scallop":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `${svgUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="12" viewBox="0 0 24 12"><path d="M0 12 A12 12 0 0 1 24 12 M-12 6 A12 12 0 0 1 12 6 M12 6 A12 12 0 0 1 36 6" fill="none" stroke="${safeAccent}" stroke-opacity="0.5" stroke-width="1.4"/></svg>`
        )}`,
        backgroundSize: "24px 12px",
      };
    case "topo":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `radial-gradient(circle at 50% 0%, color-mix(in oklab, ${safeCta} 35%, transparent), transparent 60%), ${svgUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M0 14 C12 6 28 20 48 14 M0 34 C16 26 32 40 48 34 M12 24 C12 16 20 14 26 18 C32 22 30 30 22 30 C14 30 12 26 12 24 Z" fill="none" stroke="${safeAccent}" stroke-opacity="0.5" stroke-width="1.4"/></svg>`
        )}`,
        backgroundSize: "100% 100%, 48px 48px",
      };
    case "hexagons":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `radial-gradient(circle at 50% 0%, color-mix(in oklab, ${safeCta} 35%, transparent), transparent 60%), ${svgUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="20" viewBox="0 0 24 20"><path d="M6 0 L12 3 L12 10 L6 13 L0 10 L0 3 Z M18 10 L24 13 L24 20 M18 10 L12 13 L12 20 M18 0 L18 10" fill="none" stroke="${safeAccent}" stroke-opacity="0.5" stroke-width="1.2"/></svg>`
        )}`,
        backgroundSize: "100% 100%, 24px 20px",
      };
    case "diamonds":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `${svgUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path d="M9 0 L18 9 L9 18 L0 9 Z" fill="none" stroke="${safeAccent}" stroke-opacity="0.5" stroke-width="1.2"/></svg>`
        )}`,
        backgroundSize: "18px 18px",
      };
    case "crosses":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `${svgUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M8 5 V11 M5 8 H11" fill="none" stroke="${safeAccent}" stroke-opacity="0.55" stroke-width="1.4"/></svg>`
        )}`,
        backgroundSize: "16px 16px",
      };
    case "confetti":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `${svgUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="8" cy="8" r="1.5" fill="${safeAccent}" fill-opacity="0.6"/><rect x="20" y="6" width="5" height="2" rx="1" fill="${safeCta}" fill-opacity="0.6"/><polygon points="10,26 12,22 14,26" fill="none" stroke="${safeAccent}" stroke-opacity="0.5" stroke-width="1"/></svg>`
        )}`,
        backgroundSize: "36px 36px",
      };
    case "grid-lines":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `radial-gradient(circle at 50% 0%, color-mix(in oklab, ${safeAccent} 35%, transparent), transparent 60%), linear-gradient(to right, color-mix(in oklab, ${safeAccent} 24%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, ${safeAccent} 24%, transparent) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 12px 12px, 12px 12px",
      };
    case "sunset":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `linear-gradient(180deg, color-mix(in oklab, ${safeAccent} 60%, ${preset.bgColor}) 0%, color-mix(in oklab, ${safeCta} 45%, ${preset.bgColor}) 45%, ${preset.bgColor} 100%)`,
      };
    case "duotone":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${safeCta} 45%, ${preset.bgColor}) 0%, ${preset.bgColor} 50%, color-mix(in oklab, ${safeAccent} 40%, ${preset.bgColor}) 100%)`,
      };
    case "orb":
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `radial-gradient(circle at 20% 30%, color-mix(in oklab, ${safeAccent} 55%, transparent) 0%, transparent 60%), radial-gradient(circle at 80% 70%, color-mix(in oklab, ${safeCta} 55%, transparent) 0%, transparent 60%)`,
      };
    default:
      return {
        backgroundColor: preset.bgColor,
        backgroundImage: `radial-gradient(circle at 50% 0%, color-mix(in oklab, ${safeCta} 55%, transparent) 0%, transparent 70%), radial-gradient(circle at 80% 20%, color-mix(in oklab, ${safeAccent} 25%, transparent) 0%, transparent 50%)`,
      };
  }
}

function ThemePresetPreviewIcon({
  preset,
  isProTheme,
  userIsPro,
}: {
  preset: ThemePreset;
  isProTheme: boolean;
  userIsPro?: boolean;
}) {
  const bgStyle = useMemo(() => getThemePreviewStyle(preset), [preset]);

  const cardRadius =
    preset.radiusStyle === "pill"
      ? "rounded-full"
      : preset.radiusStyle === "extra"
        ? "rounded-[8px]"
        : preset.radiusStyle === "soft"
          ? "rounded-[4px]"
          : preset.radiusStyle === "sharp"
            ? "rounded-[1px]"
            : "rounded-[5px]";

  return (
    <div
      aria-hidden="true"
      className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 shadow-inner"
      style={bgStyle}
    >
      {/* Mini card mockup */}
      <div
        className={`relative flex h-6 w-9 items-center justify-center border shadow-md ${cardRadius}`}
        style={{
          backgroundColor:
            preset.cardStyle === "glass"
              ? `color-mix(in oklab, ${preset.cardColor} 65%, transparent)`
              : preset.cardColor,
          borderColor: `color-mix(in oklab, ${preset.accentColor} 55%, transparent)`,
          backdropFilter: preset.cardStyle === "glass" ? "blur(3px)" : undefined,
        }}
      >
        {/* Tiny button mockup inside card */}
        <div
          className={`h-1.5 w-4 ${preset.radiusStyle === "sharp" ? "rounded-[1px]" : "rounded-full"}`}
          style={{
            background: `linear-gradient(135deg, ${preset.ctaColor}, ${preset.accentColor})`,
          }}
        />
      </div>

      {/* Pro crown pill badge if exclusive and user is not Pro */}
      {isProTheme && !userIsPro ? (
        <span
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-amber-400/80 bg-[#140E04] text-amber-300 shadow-md"
          title="Tema exclusivo Pro"
        >
          <Crown className="h-2.5 w-2.5 fill-amber-300" />
        </span>
      ) : null}
    </div>
  );
}

export function DashboardClient({
  initialProfile,
  initialItems,
  userEmail,
  mercadoPagoEnabled,
  isAdmin = false,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTabRaw] = useState<TabKey>("items");
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const setActiveTab = (tab: TabKey) => {
    setActiveTabRaw(tab);
    setMobilePreviewOpen(false);
  };
  const [profile, setProfile] = useState<CreatorProfileData>(initialProfile);
  const [items, setItems] = useState<LinkItemData[]>(initialItems);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [checkoutCouponCode, setCheckoutCouponCode] = useState("");
  const [appliedCheckoutCoupon, setAppliedCheckoutCoupon] = useState<{
    code: string;
    influencerName: string;
    discountPercent: number;
    originalPrice: number;
    discountedPrice: number;
  } | null>(null);
  const [validatingCheckoutCoupon, setValidatingCheckoutCoupon] = useState(false);

  // Pix Payment State
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    paymentId: string | number;
    amount: number;
    qrCode?: string;
    qrCodeBase64?: string;
    expiresAt?: string;
  } | null>(null);
  const [pixStatus, setPixStatus] = useState<"pending" | "approved" | "error" | null>(null);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  const [analyticsDays, setAnalyticsDays] = useState<7 | 14 | 30>(7);
  const [analyticsPoints, setAnalyticsPoints] = useState<DailyAnalyticsPoint[]>([]);
  const [analyticsLocked, setAnalyticsLocked] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsReloadToken, setAnalyticsReloadToken] = useState(0);

  const [slugCheck, setSlugCheck] = useState<{
    slug: string;
    available: boolean;
    reason?: string;
  } | null>(null);

  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(
    () => !initialProfile.onboardingCompleted
  );
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [statusBanner, setStatusBanner] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [themeProNotice, setThemeProNotice] = useState<string | null>(null);
  const [isLinktreeImportOpen, setIsLinktreeImportOpen] = useState(false);

  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [deleteTarget, setDeleteTarget] = useState<LinkItemData | null>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    startIndex: number;
    startY: number;
    dy: number;
    pointerId: number;
  } | null>(null);
  const [grabbedId, setGrabbedId] = useState<string | null>(null);
  const [reorderStatus, setReorderStatus] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  const itemDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const handleRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const dragSlotsRef = useRef<Array<{ id: string; rect: DOMRect }>>([]);
  const dropIndexRef = useRef<number | null>(null);
  const grabOriginalOrderRef = useRef<LinkItemData[] | null>(null);
  const movingFocusRef = useRef(false);
  const itemsRef = useRef<LinkItemData[]>(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const clean1 = setupLightDismissFallback(itemDialogRef.current);
    const clean2 = setupLightDismissFallback(deleteDialogRef.current);
    return () => {
      clean1();
      clean2();
    };
  }, []);

  const hasUnsavedProfileChanges = useMemo(() => {
    return JSON.stringify(profile) !== JSON.stringify(initialProfile);
  }, [profile, initialProfile]);

  const totalCopies = useMemo(
    () => items.reduce((acc, item) => acc + item.copiesCount, 0),
    [items]
  );
  const totalClicks = useMemo(
    () => items.reduce((acc, item) => acc + item.clicksCount, 0),
    [items]
  );
  const topCoupon = useMemo(
    () =>
      items
        .filter((it) => it.kind === "coupon" && (it.copiesCount || 0) > 0)
        .sort((a, b) => (b.copiesCount || 0) - (a.copiesCount || 0))[0] || null,
    [items]
  );
  const topLink = useMemo(
    () =>
      items
        .filter((it) => it.kind === "link" && (it.clicksCount || 0) > 0)
        .sort((a, b) => (b.clicksCount || 0) - (a.clicksCount || 0))[0] || null,
    [items]
  );
  const contrastRatio = useMemo(
    () => getContrastRatio(profile.bgColor, profile.textColor),
    [profile.bgColor, profile.textColor]
  );

  const userIsPro = useMemo(() => isProPlan(profile), [profile]);
  const linkCount = useMemo(
    () => items.filter((it) => it.kind !== "divider").length,
    [items]
  );
  const atFreeLinkLimit = !userIsPro && linkCount >= FREE_MAX_ACTIVE_OR_TOTAL_LINKS;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const preapprovalId = params.get("preapproval_id") || undefined;
    if (!checkout && !preapprovalId) return;

    const timer = window.setTimeout(async () => {
      setActiveTab("plan");
      try {
        const res = await fetch("/api/billing/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preapprovalId }),
        });
        const data = (await res.json()) as { profile?: CreatorProfileData };
        if (res.ok && data.profile) {
          setProfile(data.profile);
          if (data.profile.plan === "pro") {
            notify("ok", "Assinatura Pro confirmada pelo Mercado Pago!");
          } else {
            notify("ok", "Pagamento em processamento no Mercado Pago.");
          }
        }
      } catch {
        notify("ok", "Retorno registrado. Clique em Atualizar status para conferir seu plano.");
      } finally {
        window.history.replaceState({}, "", "/painel");
      }
    }, 50);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeTab !== "analytics") return;
    let cancelled = false;

    async function loadAnalytics() {
      setAnalyticsLoading(true);
      try {
        const res = await fetch(`/api/analytics?days=${analyticsDays}`);
        const data = (await res.json()) as {
          locked?: boolean;
          points?: DailyAnalyticsPoint[];
        };
        if (cancelled) return;
        setAnalyticsLocked(Boolean(data.locked));
        setAnalyticsPoints(Array.isArray(data.points) ? data.points : []);
      } catch {
        if (!cancelled) {
          setAnalyticsPoints([]);
        }
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      }
    }

    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [activeTab, analyticsDays, analyticsReloadToken]);

  useEffect(() => {
    const candidate = sanitizeSlug(profile.slug);
    if (!candidate || candidate === initialProfile.slug || candidate.length < 3) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/slug/check?slug=${encodeURIComponent(candidate)}`);
        const data = (await res.json()) as {
          available: boolean;
          normalized: string;
          reason?: string;
        };
        setSlugCheck({
          slug: candidate,
          available: data.available,
          reason: data.reason,
        });
      } catch {
        setSlugCheck(null);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [profile.slug, initialProfile.slug]);

  function notify(type: "ok" | "error", text: string) {
    setStatusBanner({ type, text });
    const duration = text.length > 80 ? 9000 : 3500;
    window.setTimeout(() => {
      setStatusBanner((prev) => (prev?.text === text ? null : prev));
    }, duration);
  }

  async function handleCopyPublicUrl() {
    const url = `${window.location.origin}/${profile.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      notify("ok", `Seu link público: ${url}`);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const res = await authClient.signOut();
      if (res?.error) {
        await fetch("/api/auth/sign-out", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
      }
    } catch {
      try {
        await fetch("/api/auth/sign-out", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
      } catch {
        // Proceed with hard navigation to clear client state
      }
    } finally {
      window.location.href = `${window.location.origin}/entrar`;
    }
  }

  async function saveProfilePatch(patch?: Partial<CreatorProfileData>) {
    const payload = patch ? { ...profile, ...patch } : profile;
    if (patch) setProfile(payload);

    if (!userIsPro) {
      if (!isBgStyleAllowedForPlan(payload.bgStyle, false)) {
        notify(
          "error",
          `O estilo de fundo "${payload.bgStyle}" com desenho é exclusivo do Plano Pro. Escolha um dos 5 fundos grátis ou faça upgrade.`
        );
        setActiveTab("plan");
        return;
      }
      if (!isRadiusStyleAllowedForPlan(payload.radiusStyle, false)) {
        notify(
          "error",
          `O formato de borda "${payload.radiusStyle}" é exclusivo do Plano Pro. Escolha Arredondado, Suave ou Reto no plano Grátis.`
        );
        setActiveTab("plan");
        return;
      }
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: payload.slug,
          displayName: payload.displayName,
          avatarUrl: payload.avatarUrl,
          instagramHandle: payload.instagramHandle,
          instagramUrl: payload.instagramUrl,
          tiktokHandle: payload.tiktokHandle,
          tiktokUrl: payload.tiktokUrl,
          bio: payload.bio,
          footerText: payload.footerText,
          sectionTitle: payload.sectionTitle,
          helperTip: payload.helperTip,
          layout: payload.layout,
          themeMode: payload.themeMode,
          allowThemeToggle: payload.allowThemeToggle,
          bgStyle: payload.bgStyle,
          cardStyle: payload.cardStyle,
          radiusStyle: payload.radiusStyle,
          fontStyle: payload.fontStyle,
          titleFontStyle: payload.titleFontStyle,
          nameFontStyle: payload.nameFontStyle,
          featuredAnimation: payload.featuredAnimation,
          socialDisplayStyle: payload.socialDisplayStyle,
          accentColor: payload.accentColor,
          ctaColor: payload.ctaColor,
          bgColor: payload.bgColor,
          cardColor: payload.cardColor,
          textColor: payload.textColor,
          showBranding: payload.showBranding,
          onboardingCompleted: payload.onboardingCompleted,
        }),
      });
      const data = (await res.json()) as { profile?: CreatorProfileData; error?: string };
      if (!res.ok || !data.profile) {
        notify("error", data.error || "Não foi possível salvar as alterações.");
        return;
      }
      setProfile(data.profile);
      notify("ok", "Alterações salvas e publicadas!");
      router.refresh();
    } catch {
      notify("error", "Erro de conexão ao salvar.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleApplyCheckoutCoupon(customCode?: string) {
    const raw = (customCode || checkoutCouponCode).trim().toUpperCase();
    if (!raw) {
      notify("error", "Digite o código do cupom.");
      return;
    }
    setValidatingCheckoutCoupon(true);
    try {
      const res = await fetch(`/api/billing/coupon?code=${encodeURIComponent(raw)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        notify("error", data.error || "Cupom inválido ou expirado.");
        return;
      }
      if (data.discountPercent > 0) {
        setAppliedCheckoutCoupon({
          code: data.coupon.code,
          influencerName: data.coupon.influencerName,
          discountPercent: data.discountPercent,
          originalPrice: data.originalPriceBrl,
          discountedPrice: data.discountedPriceBrl,
        });
        notify(
          "ok",
          `Cupom "${data.coupon.code}" aplicado! ${data.discountPercent}% de desconto no checkout.`
        );
      } else if (data.durationDays >= 0) {
        // Cupom de dias de Pro ou permuta direta
        notify("ok", `Cupom "${data.coupon.code}" validado! Ativando benefício...`);
        const redeemRes = await fetch("/api/billing/coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: raw }),
        });
        const redeemData = await redeemRes.json();
        if (redeemRes.ok && redeemData.ok) {
          if (redeemData.profile) setProfile(redeemData.profile);
          notify("ok", redeemData.message || "Plano Pro ativado com sucesso!");
          router.refresh();
        } else {
          notify("error", redeemData.error || "Não foi possível resgatar o cupom.");
        }
      }
    } catch {
      notify("error", "Erro ao validar cupom.");
    } finally {
      setValidatingCheckoutCoupon(false);
    }
  }

  async function handleStartCheckout() {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: appliedCheckoutCoupon?.code || undefined,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string; message?: string };
      if (!res.ok || (!data.url && !data.message)) {
        notify(
          "error",
          data.error || "Não foi possível iniciar o checkout do Mercado Pago."
        );
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        notify("ok", data.message);
        router.refresh();
      }
    } catch {
      notify("error", "Erro de conexão ao iniciar checkout.");
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleGeneratePix() {
    setPixLoading(true);
    setPixError(null);
    setPixStatus("pending");
    try {
      const res = await fetch("/api/billing/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: appliedCheckoutCoupon?.code || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPixError(data.error || "Não foi possível gerar a cobrança Pix.");
        setPixStatus("error");
        return;
      }
      if (data.alreadyActivated) {
        notify("ok", data.message || "Plano Pro ativado com sucesso!");
        setPixModalOpen(false);
        router.refresh();
        return;
      }
      setPixData({
        paymentId: data.paymentId,
        amount: data.amount,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        expiresAt: data.expiresAt,
      });
    } catch {
      setPixError("Erro de conexão ao gerar o Pix.");
      setPixStatus("error");
    } finally {
      setPixLoading(false);
    }
  }

  function handleOpenPixModal() {
    setPixModalOpen(true);
    setPixData(null);
    setPixError(null);
    setPixStatus(null);
    setPixCopied(false);
    handleGeneratePix();
  }

  function handleCopyPixCode() {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setPixCopied(true);
    notify("ok", "Código Pix Copia e Cola copiado!");
    setTimeout(() => setPixCopied(false), 2500);
  }

  useEffect(() => {
    if (!pixModalOpen || !pixData?.paymentId || pixStatus === "approved") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/billing/pix?paymentId=${encodeURIComponent(String(pixData.paymentId))}`
        );
        const data = await res.json();
        if (res.ok && data.isApproved) {
          setPixStatus("approved");
          if (data.profile) {
            setProfile(data.profile);
          }
          notify("ok", "Pagamento Pix aprovado! Seu Plano Pro foi ativado.");
          setTimeout(() => {
            setPixModalOpen(false);
            router.refresh();
          }, 2500);
        }
      } catch {
        // Ignorar falhas esporádicas de conexão no polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pixModalOpen, pixData, pixStatus, router]);

  async function handleAdminSelfActivatePro() {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.userId,
          plan: "pro",
          subscriptionStatus: "active",
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        notify("error", json.error || "Não foi possível ativar plano Pro como Super Admin.");
        return;
      }
      setProfile((prev) => ({ ...prev, plan: "pro", subscriptionStatus: "active" }));
      notify("ok", "Plano Pro ativado nesta conta com sucesso (Super Admin)!");
      router.refresh();
    } catch {
      notify("error", "Erro ao ativar plano Pro.");
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleSyncSubscription() {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { profile?: CreatorProfileData; error?: string };
      if (!res.ok || !data.profile) {
        notify("error", data.error || "Não foi possível consultar assinatura.");
        return;
      }
      setProfile(data.profile);
      notify(
        "ok",
        data.profile.plan === "pro"
          ? "Plano Pro ativo e sincronizado!"
          : "Status atualizado: Plano Grátis."
      );
      router.refresh();
    } catch {
      notify("error", "Erro de conexão ao consultar status.");
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleCancelSubscription() {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = (await res.json()) as { profile?: CreatorProfileData; error?: string };
      if (!res.ok || !data.profile) {
        notify("error", data.error || "Não foi possível cancelar a assinatura.");
        return;
      }
      setProfile(data.profile);
      notify("ok", "Assinatura cancelada no Mercado Pago.");
      router.refresh();
    } catch {
      notify("error", "Erro de conexão ao cancelar assinatura.");
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleRedeemCoupon(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = couponInput.trim().toUpperCase();
    if (!trimmed) {
      notify("error", "Digite o código do cupom.");
      return;
    }
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const res = await fetch("/api/billing/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        profile?: CreatorProfileData;
        coupon?: PlatformCouponData;
      };
      if (!res.ok || !data.ok) {
        const errMsg = data.error || "Não foi possível validar este cupom.";
        setCouponMessage({ type: "error", text: errMsg });
        notify("error", errMsg);
        return;
      }
      if (data.profile) {
        setProfile(data.profile);
      }
      if (data.coupon && data.coupon.discountPercent > 0) {
        const disc = data.coupon.discountPercent;
        const orig = 19.9;
        const discounted = Math.max(1, Math.round(orig * (1 - disc / 100) * 100) / 100);
        setAppliedCheckoutCoupon({
          code: data.coupon.code,
          influencerName: data.coupon.influencerName,
          discountPercent: disc,
          originalPrice: orig,
          discountedPrice: discounted,
        });
      }
      setCouponInput("");
      const successMsg = data.message || "Cupom aplicado com sucesso!";
      setCouponMessage({ type: "ok", text: successMsg });
      notify("ok", successMsg);
      router.refresh();
    } catch {
      const errMsg = "Erro de conexão ao aplicar cupom.";
      setCouponMessage({ type: "error", text: errMsg });
      notify("error", errMsg);
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleCompleteOnboarding(nextTab?: TabKey) {
    await saveProfilePatch({ onboardingCompleted: true });
    setOnboardingOpen(false);
    if (nextTab) setActiveTab(nextTab);
  }

  function openCreateDialog(kind: LinkItemKind) {
    if (kind !== "divider" && atFreeLinkLimit) {
      notify(
        "error",
        `O plano Grátis permite até ${FREE_MAX_ACTIVE_OR_TOTAL_LINKS} links e cupons. Faça upgrade para o Pro!`
      );
      setActiveTab("plan");
      return;
    }
    setItemForm({
      ...EMPTY_ITEM_FORM,
      kind,
      accentColor: profile.accentColor,
    });
    itemDialogRef.current?.showModal();
  }

  function openEditDialog(item: LinkItemData) {
    setItemForm({
      id: item.id,
      kind: item.kind,
      title: item.title,
      url: item.url,
      couponCode: item.couponCode,
      tag: item.tag,
      description: item.description,
      ctaLabel: item.ctaLabel,
      logoUrl: item.logoUrl,
      accentColor: item.accentColor || profile.accentColor,
      isFeatured: item.isFeatured,
      featuredLabel: item.featuredLabel || "Destaque",
      featuredIcon: item.featuredIcon || "sparkles",
      expiresAt: toDateTimeLocalInput(item.expiresAt),
    });
    itemDialogRef.current?.showModal();
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    setSavingItem(true);

    try {
      const endpoint = itemForm.id ? `/api/items/${itemForm.id}` : "/api/items";
      const method = itemForm.id ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: itemForm.kind,
          title: itemForm.title.trim(),
          url: itemForm.kind === "divider" ? "" : itemForm.url.trim(),
          couponCode: itemForm.kind === "coupon" ? itemForm.couponCode.trim() : "",
          tag: itemForm.kind === "divider" ? "" : itemForm.tag.trim(),
          description: itemForm.description.trim(),
          ctaLabel: itemForm.kind === "divider" ? "" : itemForm.ctaLabel.trim(),
          logoUrl: itemForm.kind === "divider" ? "" : itemForm.logoUrl.trim(),
          accentColor: itemForm.accentColor,
          isFeatured: itemForm.kind === "divider" ? false : itemForm.isFeatured,
          featuredLabel:
            itemForm.kind === "divider" ? "" : itemForm.featuredLabel.trim() || "Destaque",
          featuredIcon:
            itemForm.kind === "divider" ? "sparkles" : itemForm.featuredIcon.trim() || "sparkles",
          expiresAt:
            itemForm.kind === "divider" || !itemForm.expiresAt.trim()
              ? null
              : new Date(itemForm.expiresAt).toISOString(),
        }),
      });
      const data = (await res.json()) as { item?: LinkItemData; error?: string };
      if (!res.ok || !data.item) {
        notify("error", data.error || "Não foi possível salvar o item.");
        setSavingItem(false);
        return;
      }

      if (itemForm.id) {
        setItems((prev) => prev.map((it) => (it.id === data.item!.id ? data.item! : it)));
        notify("ok", "Item atualizado!");
      } else {
        setItems((prev) => [...prev, data.item!]);
        notify("ok", "Item adicionado à sua página!");
      }
      itemDialogRef.current?.close();
    } catch {
      notify("error", "Erro de rede ao salvar item.");
    } finally {
      setSavingItem(false);
    }
  }

  async function toggleItemActive(item: LinkItemData) {
    const nextActive = !item.isActive;
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, isActive: nextActive } : it))
    );

    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: nextActive }),
    });
    if (!res.ok) {
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isActive: item.isActive } : it))
      );
      notify("error", "Erro ao alterar visibilidade.");
    }
  }

  async function toggleItemFeatured(item: LinkItemData) {
    const nextFeatured = !item.isFeatured;
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, isFeatured: nextFeatured } : it))
    );

    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: nextFeatured }),
    });
    if (res.ok) {
      notify(
        "ok",
        nextFeatured
          ? `"${item.title}" marcado como link destaque!`
          : `Destaque removido de "${item.title}".`
      );
    } else {
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isFeatured: item.isFeatured } : it))
      );
      notify("error", "Erro ao alterar destaque.");
    }
  }

  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarUploading(true);
    try {
      const { blob, filename, dataUrl } = await resizeAvatarToAsset(file);
      let finalAvatarUrl = dataUrl;

      try {
        const formData = new FormData();
        formData.append("file", blob, filename);
        const uploadRes = await fetch("/api/upload/avatar", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploaded = (await uploadRes.json()) as {
            mode?: "blob" | "inline";
            url?: string | null;
          };
          if (uploaded.mode === "blob" && uploaded.url) {
            finalAvatarUrl = uploaded.url;
          }
        }
      } catch {
        // Fallback to compressed inline WebP dataUrl when Blob upload is unavailable
      }

      await saveProfilePatch({ avatarUrl: finalAvatarUrl });
      notify("ok", "Foto de perfil atualizada com sucesso!");
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Erro ao carregar foto de perfil."
      );
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSendResetPasswordEmail() {
    if (!userEmail) {
      notify("error", "E-mail da conta não encontrado.");
      return;
    }
    setSendingResetEmail(true);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail.trim(),
          redirectTo: `${window.location.origin}/redefinir-senha`,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        notify("error", body.message || "Erro ao solicitar e-mail de redefinição.");
      } else {
        setResetEmailSent(true);
        notify("ok", `E-mail de redefinição enviado para ${userEmail}!`);
      }
    } catch {
      notify("error", "Erro ao solicitar redefinição de senha.");
    } finally {
      setSendingResetEmail(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangePasswordError(null);
    setChangePasswordSuccess(false);

    if (newPassword.length < 8) {
      setChangePasswordError("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError("A confirmação da nova senha não confere.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setChangePasswordError(
          body.message || "Erro ao alterar senha. Verifique se sua senha atual está correta."
        );
      } else {
        setChangePasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        notify("ok", "Senha alterada com sucesso!");
      }
    } catch {
      setChangePasswordError("Erro inesperado ao alterar senha.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function persistReorder(next: LinkItemData[]) {
    setItems(next);
    await fetch("/api/items/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((i) => i.id) }),
    });
  }

  function clearDropMarker() {
    const listEl = listRef.current;
    if (listEl) {
      listEl.removeAttribute("data-drop");
      listEl.style.removeProperty("--drop-x");
      listEl.style.removeProperty("--drop-y");
      listEl.style.removeProperty("--drop-w");
    }
    dropIndexRef.current = null;
  }

  function updateDropMarker(clientY: number, startIndex: number) {
    const listEl = listRef.current;
    const slots = dragSlotsRef.current;
    if (!listEl || slots.length === 0) return;

    const firstRect = slots[0].rect;
    const lastRect = slots[slots.length - 1].rect;
    const clampedY = Math.min(Math.max(clientY, firstRect.top), lastRect.bottom);

    let insertBefore = slots.length;
    for (let i = 0; i < slots.length; i += 1) {
      const r = slots[i].rect;
      const midpoint = r.top + r.height / 2;
      if (clampedY < midpoint) {
        insertBefore = i;
        break;
      }
    }

    dropIndexRef.current = insertBefore;

    if (insertBefore === startIndex || insertBefore === startIndex + 1) {
      listEl.removeAttribute("data-drop");
      return;
    }

    let markerY: number;
    if (insertBefore === 0) {
      markerY = firstRect.top - 6;
    } else if (insertBefore >= slots.length) {
      markerY = lastRect.bottom + 6;
    } else {
      const prevRect = slots[insertBefore - 1].rect;
      const nextRect = slots[insertBefore].rect;
      markerY = (prevRect.bottom + nextRect.top) / 2;
    }

    const listRect = listEl.getBoundingClientRect();
    listEl.setAttribute("data-drop", "true");
    listEl.style.setProperty("--drop-x", `${listRect.left}px`);
    listEl.style.setProperty("--drop-y", `${markerY}px`);
    listEl.style.setProperty("--drop-w", `${listRect.width}px`);
    listEl.style.setProperty("--drop-marker-color", profile.accentColor);
  }

  useEffect(() => {
    if (!dragState) return;

    const activeId = dragState.id;
    const activePointerId = dragState.pointerId;
    const startIndex = dragState.startIndex;
    const startY = dragState.startY;

    const cleanup = () => {
      document.documentElement.classList.remove("mc-dragging");
      clearDropMarker();
      setDragState(null);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      setDragState((prev) => (prev ? { ...prev, dy: e.clientY - startY } : null));
      updateDropMarker(e.clientY, startIndex);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      const insertBefore = dropIndexRef.current;
      cleanup();

      if (
        insertBefore === null ||
        insertBefore === startIndex ||
        insertBefore === startIndex + 1
      ) {
        return;
      }

      const targetIndex = insertBefore > startIndex ? insertBefore - 1 : insertBefore;
      const currentItems = itemsRef.current;
      const next = [...currentItems];
      const currentIdx = next.findIndex((it) => it.id === activeId);
      if (currentIdx === -1) return;

      const [moved] = next.splice(currentIdx, 1);
      next.splice(targetIndex, 0, moved);
      void persistReorder(next);
      setReorderStatus(
        `${moved.title || "Item"} movido para a posição ${targetIndex + 1} de ${next.length}.`
      );
      window.requestAnimationFrame(() => {
        itemRefs.current.get(activeId)?.scrollIntoView({
          block: "nearest",
          inline: "nearest",
        });
      });
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      cleanup();
      setReorderStatus("Reordenação cancelada.");
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cleanup();
        setReorderStatus("Reordenação cancelada.");
      }
    };

    const onLostCapture = (e: Event) => {
      if (e instanceof PointerEvent && e.pointerId !== activePointerId) return;
      cleanup();
    };

    const activeHandle = handleRefs.current.get(activeId);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
    document.addEventListener("keydown", onKeyDown);
    activeHandle?.addEventListener("lostpointercapture", onLostCapture);

    return () => {
      document.documentElement.classList.remove("mc-dragging");
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
      document.removeEventListener("keydown", onKeyDown);
      activeHandle?.removeEventListener("lostpointercapture", onLostCapture);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState?.id, dragState?.pointerId]);

  function handleDragPointerDown(
    e: React.PointerEvent<HTMLButtonElement>,
    item: LinkItemData,
    index: number
  ) {
    if (e.button !== 0 || dragState) return;
    e.preventDefault();

    const slots: Array<{ id: string; rect: DOMRect }> = [];
    for (const it of items) {
      const el = itemRefs.current.get(it.id);
      if (el) {
        slots.push({ id: it.id, rect: el.getBoundingClientRect() });
      }
    }
    dragSlotsRef.current = slots;
    dropIndexRef.current = index;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }
    document.documentElement.classList.add("mc-dragging");
    setDragState({
      id: item.id,
      startIndex: index,
      startY: e.clientY,
      dy: 0,
      pointerId: e.pointerId,
    });
  }

  function handleGrabKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    item: LinkItemData,
    index: number
  ) {
    const label = item.title || "Divisória";
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (grabbedId === item.id) {
        setGrabbedId(null);
        grabOriginalOrderRef.current = null;
        setReorderStatus(`${label} solto na posição ${index + 1} de ${items.length}.`);
      } else {
        grabOriginalOrderRef.current = items;
        setGrabbedId(item.id);
        setReorderStatus(
          `${label} selecionado na posição ${index + 1}. Use as setas do teclado para mover e Enter ou Espaço para soltar.`
        );
      }
      return;
    }

    if (grabbedId !== item.id) return;

    if (e.key === "Escape") {
      e.preventDefault();
      const orig = grabOriginalOrderRef.current;
      setGrabbedId(null);
      grabOriginalOrderRef.current = null;
      if (orig) {
        void persistReorder(orig);
      }
      setReorderStatus(`Movimentação de ${label} cancelada.`);
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const delta = e.key === "ArrowUp" ? -1 : 1;
      const target = index + delta;
      if (target < 0 || target >= items.length) return;

      const next = [...items];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      movingFocusRef.current = true;
      void persistReorder(next);

      window.requestAnimationFrame(() => {
        const li = itemRefs.current.get(item.id);
        li?.scrollIntoView({ block: "nearest", inline: "nearest" });
        handleRefs.current.get(item.id)?.focus({ preventScroll: true });
        movingFocusRef.current = false;
      });
      setReorderStatus(`${label} movido para a posição ${target + 1} de ${next.length}.`);
    }
  }

  async function confirmDeleteItem() {
    if (!deleteTarget) return;
    const idToDelete = deleteTarget.id;
    setItems((prev) => prev.filter((it) => it.id !== idToDelete));
    deleteDialogRef.current?.close();
    setDeleteTarget(null);

    const res = await fetch(`/api/items/${idToDelete}`, { method: "DELETE" });
    if (res.ok) {
      notify("ok", "Item removido.");
    } else {
      notify("error", "Não foi possível remover o item.");
    }
  }

  return (
    <div className="min-h-dvh bg-[#070C14] text-[#F4F8FD]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#94C5FF]/12 bg-[#070C14]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-3">
          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2 transition hover:opacity-90 sm:gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#1E60CF] to-[#145ca1] p-1.5 text-white shadow-md shadow-[#1E60CF]/20 sm:h-9 sm:w-9">
              <BrandIcon className="h-full w-full" />
            </span>
            <BrandLogo className="h-5 sm:h-6 w-auto" />
          </Link>

          {/* Right Actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {/* Commercial Public Link Pill */}
            <div className="flex max-w-[125px] items-center rounded-full border border-[#38BDF8]/30 bg-[#0E1624] py-0.5 pl-2 pr-1 text-xs sm:max-w-none sm:py-1 sm:pl-3">
              <span className="truncate font-mono text-[11px] text-[#7DD3FC] sm:text-xs">/{profile.slug}</span>
              <button
                type="button"
                onClick={handleCopyPublicUrl}
                aria-label="Copiar link público"
                title="Copiar link da sua página"
                className="ml-1 inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#38BDF8]/15 px-1.5 text-[10px] font-bold text-[#7DD3FC] transition hover:bg-[#38BDF8]/25 sm:ml-1.5 sm:h-7 sm:px-2.5 sm:text-[11px]"
              >
                {copiedUrl ? (
                  <>
                    <Check className="h-3 w-3" aria-hidden="true" />
                    <span className="hidden sm:inline">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" aria-hidden="true" />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>
              <Link
                href={`/${profile.slug}`}
                target="_blank"
                title="Abrir página pública em nova aba"
                aria-label="Abrir página pública"
                className="ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#9CB3CE] transition hover:bg-white/10 hover:text-white sm:h-7 sm:w-7"
              >
                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {/* Sign Out Button - shrink-0 guarantees it always stays visible on mobile */}
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              aria-label="Sair da conta"
              title="Sair da conta"
              className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full border border-white/10 px-2 text-[11px] font-semibold text-[#9CB3CE] transition hover:border-white/25 hover:text-white disabled:opacity-60 sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs"
            >
              {signingOut ? (
                <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              ) : (
                <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{signingOut ? "Saindo..." : "Sair"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Status Toast / Alert */}
      {statusBanner ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 bottom-20 z-50 flex max-w-[92vw] items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl sm:max-w-md lg:bottom-4 ${
            statusBanner.type === "error"
              ? "border-red-400/50 bg-[#2A0F14] text-red-100"
              : "border-emerald-400/50 bg-[#0A241C] text-emerald-100"
          }`}
        >
          {statusBanner.type === "error" ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
          ) : (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
          )}
          <span className="flex-1 leading-snug">{statusBanner.text}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="ml-1 text-xs opacity-70 hover:opacity-100"
            aria-label="Fechar aviso"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Main Split Grid */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-6 pb-28 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:pb-12">
        {/* Left: Editor */}
        <div className={mobilePreviewOpen ? "hidden lg:block" : "block"}>
          {/* 3-Step Guided Onboarding */}
          {onboardingOpen ? (
            <section
              aria-label="Configuração inicial guiada"
              className="mb-6 rounded-2xl border border-[#38BDF8]/35 bg-gradient-to-br from-[#0F2038] via-[#0E1728] to-[#0E1624] p-5 shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#7DD3FC]">
                    Primeiros passos · Etapa {onboardingStep} de 3
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCompleteOnboarding()}
                  className="text-xs font-semibold text-[#9CB3CE] hover:text-white"
                >
                  Pular configuração
                </button>
              </div>

              {onboardingStep === 1 ? (
                <div className="mt-4">
                  <h2 className="text-base font-extrabold text-white">
                    Escolha seu nome e seu endereço público
                  </h2>
                  <p className="mt-1 text-xs text-[#9CB3CE]">
                    Esse será o link que você vai colocar na bio do Instagram e TikTok.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="onb-name" className="mb-1 block text-xs font-bold">
                        Nome de exibição
                      </label>
                      <input
                        id="onb-name"
                        type="text"
                        value={profile.displayName}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, displayName: e.target.value }))
                        }
                        className="mc-input min-h-[44px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="onb-slug" className="mb-1 block text-xs font-bold">
                        Seu @slug público
                      </label>
                      <input
                        id="onb-slug"
                        type="text"
                        value={profile.slug}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, slug: sanitizeSlug(e.target.value) }))
                        }
                        className="mc-input min-h-[44px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 font-mono text-sm text-white"
                      />
                      {slugCheck && slugCheck.slug === sanitizeSlug(profile.slug) ? (
                        <p
                          className={`mt-1 text-[11px] font-semibold ${
                            slugCheck.available ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {slugCheck.available
                            ? `/${slugCheck.slug} está disponível`
                            : slugCheck.reason || "Slug indisponível"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(2)}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#1E60CF] px-4 text-xs font-bold text-white hover:bg-[#256EE8]"
                    >
                      <span>Próximo: Escolher visual</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {onboardingStep === 2 ? (
                <div className="mt-4">
                  <h2 className="text-base font-extrabold text-white">
                    Escolha o tema inicial da sua página
                  </h2>
                  <p className="mt-1 text-xs text-[#9CB3CE]">
                    Você pode personalizar cores, fontes e fundos depois na aba Aparência.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {THEME_PRESETS.slice(0, 6).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            themeMode: preset.themeMode,
                            bgStyle: preset.bgStyle,
                            bgColor: preset.bgColor,
                            cardColor: preset.cardColor,
                            textColor: preset.textColor,
                            accentColor: preset.accentColor,
                            ctaColor: preset.ctaColor,
                          }))
                        }
                        className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-[#09101B] p-2.5 text-left text-xs font-bold text-white hover:border-[#38BDF8]"
                      >
                        <span
                          aria-hidden="true"
                          className="h-5 w-5 shrink-0 rounded-full border border-white/20"
                          style={{
                            background: `linear-gradient(135deg, ${preset.bgColor}, ${preset.ctaColor})`,
                          }}
                        />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(1)}
                      className="min-h-[42px] rounded-xl border border-white/15 px-3.5 text-xs font-semibold text-[#9CB3CE] hover:text-white"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(3)}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#1E60CF] px-4 text-xs font-bold text-white hover:bg-[#256EE8]"
                    >
                      <span>Próximo: Finalizar</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {onboardingStep === 3 ? (
                <div className="mt-4">
                  <h2 className="text-base font-extrabold text-white">
                    Tudo pronto para cadastrar seus cupons!
                  </h2>
                  <p className="mt-1 text-xs text-[#9CB3CE]">
                    Clique em salvar e concluir para publicar seu endereço{" "}
                    <span className="font-mono text-[#7DD3FC]">/{profile.slug}</span> e começar a adicionar seus links.
                  </p>
                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(2)}
                      className="min-h-[42px] rounded-xl border border-white/15 px-3.5 text-xs font-semibold text-[#9CB3CE] hover:text-white"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      disabled={savingProfile}
                      onClick={() => void handleCompleteOnboarding("items")}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>Salvar e começar</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Navigation Tabs (Desktop only - Mobile uses the sticky bottom navigation) */}
          <div
            role="tablist"
            aria-label="Seções do painel"
            className="mb-6 hidden grid-cols-4 gap-2 rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-1.5 lg:grid"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "items"}
              onClick={() => setActiveTab("items")}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${
                activeTab === "items"
                  ? "bg-[#1E60CF] text-white shadow-md"
                  : "text-[#9CB3CE] hover:text-white"
              }`}
            >
              <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Links &amp; Cupons</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "appearance"}
              onClick={() => setActiveTab("appearance")}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${
                activeTab === "appearance"
                  ? "bg-[#1E60CF] text-white shadow-md"
                  : "text-[#9CB3CE] hover:text-white"
              }`}
            >
              <Palette className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Aparência</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${
                activeTab === "analytics"
                  ? "bg-[#1E60CF] text-white shadow-md"
                  : "text-[#9CB3CE] hover:text-white"
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Métricas</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "profile" || activeTab === "plan"}
              onClick={() => setActiveTab("profile")}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${
                activeTab === "profile" || activeTab === "plan"
                  ? "bg-[#1E60CF] text-white shadow-md"
                  : "text-[#9CB3CE] hover:text-white"
              }`}
            >
              <User className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Perfil &amp; Plano</span>
            </button>
          </div>

          {/* TAB 1: ITEMS */}
          {activeTab === "items" ? (
            <section aria-label="Gerenciar links e cupons" className="flex flex-col gap-5">
              {!userIsPro ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/8 px-4 py-3 text-xs">
                  <span className="font-semibold text-amber-100">
                    Plano Grátis: {linkCount}/{FREE_MAX_ACTIVE_OR_TOTAL_LINKS} links e cupons usados.
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("plan")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 font-extrabold text-[#08101C] hover:bg-amber-300"
                  >
                    <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Liberar ilimitado no Pro</span>
                  </button>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4 sm:p-5">
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight">
                    Seus Links e Cupons ({items.length})
                  </h1>
                  <p className="text-sm text-[#9CB3CE]">
                    Clique e arraste pelo ícone à esquerda para reordenar cupons, links e divisórias.
                  </p>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => openCreateDialog("coupon")}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#1E60CF] px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-[#256EE8] sm:px-4 sm:text-sm"
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">Novo Cupom</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateDialog("link")}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#38BDF8]/35 bg-[#38BDF8]/12 px-3 py-2 text-xs font-bold text-[#7DD3FC] hover:bg-[#38BDF8]/20 sm:px-4 sm:text-sm"
                  >
                    <Link2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">Novo Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateDialog("divider")}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#E2ECF7] hover:bg-white/10 sm:px-4 sm:text-sm"
                  >
                    <Minus className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">Divisória</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLinktreeImportOpen(true)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#39E09B]/40 bg-[#39E09B]/12 px-3 py-2 text-xs font-bold text-[#39E09B] hover:bg-[#39E09B]/20 transition-colors sm:px-4 sm:text-sm"
                  >
                    <TreePine className="h-4 w-4 shrink-0 text-[#39E09B]" aria-hidden="true" />
                    <span className="truncate">Importar Linktree</span>
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#94C5FF]/25 bg-[#0E1624]/60 p-10 text-center">
                  <p className="font-bold text-white">Sua página ainda não tem itens</p>
                  <p className="mt-1 text-sm text-[#9CB3CE]">
                    Clique em &quot;Novo Cupom&quot; ou traga tudo pronto do seu Linktree.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openCreateDialog("coupon")}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#1E60CF] px-4 py-2 text-xs font-bold text-white hover:bg-[#256EE8]"
                    >
                      <Plus className="h-4 w-4" /> Novo Cupom
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLinktreeImportOpen(true)}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#39E09B]/40 bg-[#39E09B]/15 px-4 py-2 text-xs font-bold text-[#39E09B] hover:bg-[#39E09B]/25 transition-colors"
                    >
                      <TreePine className="h-4 w-4 text-[#39E09B]" /> Importar do Linktree
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p role="status" className="visually-hidden">
                    {reorderStatus}
                  </p>
                  <ul ref={listRef} className="mc-sort-list relative flex flex-col gap-3">
                    {items.map((item, idx) => {
                      const isDragging = dragState?.id === item.id;
                      const isGrabbed = grabbedId === item.id;

                      return (
                        <li
                          key={item.id}
                          ref={(el) => {
                            if (el) itemRefs.current.set(item.id, el);
                            else itemRefs.current.delete(item.id);
                          }}
                          style={
                            isDragging
                              ? {
                                  transform: `translate3d(0, ${dragState.dy}px, 0) scale(1.015)`,
                                  zIndex: 30,
                                  pointerEvents: "none",
                                  boxShadow: "0 20px 44px rgba(2, 6, 14, 0.65)",
                                }
                              : undefined
                          }
                          className={`rounded-2xl border p-3 sm:p-4 transition-colors ${
                            isDragging || isGrabbed
                              ? "border-[#38BDF8] bg-[#131F33] shadow-lg shadow-[#38BDF8]/10"
                              : item.isActive
                                ? "border-[#94C5FF]/14 bg-[#0E1624] hover:border-[#38BDF8]/35"
                                : "border-white/10 bg-[#0B111C]/80 opacity-60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                            <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
                              <button
                                type="button"
                                ref={(el) => {
                                  if (el) handleRefs.current.set(item.id, el);
                                  else handleRefs.current.delete(item.id);
                                }}
                                aria-pressed={isGrabbed}
                                aria-label={`Reordenar ${item.title || "Divisória"}. Pressione e arraste ou use Espaço e setas do teclado`}
                                title="Clique e arraste para reordenar"
                                onPointerDown={(e) => handleDragPointerDown(e, item, idx)}
                                onKeyDown={(e) => handleGrabKeyDown(e, item, idx)}
                                onBlur={() => {
                                  if (!movingFocusRef.current && grabbedId === item.id) {
                                    setGrabbedId(null);
                                    grabOriginalOrderRef.current = null;
                                  }
                                }}
                                className={`mc-drag-handle mt-0.5 grid h-10 w-7 shrink-0 place-items-center rounded-xl border transition sm:w-8 ${
                                  isGrabbed
                                    ? "border-[#38BDF8] bg-[#38BDF8]/20 text-white"
                                    : "border-white/10 text-[#7D97B8] hover:border-white/20 hover:bg-white/5 hover:text-white focus-visible:border-[#38BDF8] focus-visible:bg-[#38BDF8]/15 focus-visible:text-white"
                                }`}
                              >
                                <GripVertical className="h-4 w-4" aria-hidden="true" />
                              </button>

                              {item.kind === "divider" ? (
                                <span
                                  className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-xs font-black shadow-inner"
                                  style={{
                                    borderColor: "rgba(148, 197, 255, 0.25)",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                                  }}
                                >
                                  <Minus className="h-4 w-4 text-[#9CB3CE]" aria-hidden="true" />
                                </span>
                              ) : (
                                <BrandPreviewIcon
                                  title={item.title}
                                  url={item.url}
                                  logoUrl={item.logoUrl}
                                  accentColor={item.accentColor}
                                />
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <h2 className="text-sm font-bold text-white sm:text-base">
                                    {item.kind === "divider"
                                      ? item.title || "Divisória (espaçamento)"
                                      : item.title}
                                  </h2>

                                  {item.kind === "divider" ? (
                                    <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#CBD5E1]">
                                      Divisória
                                    </span>
                                  ) : null}

                                  {item.kind !== "divider" && item.isFeatured ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                      <FeaturedIconViewer iconKey={item.featuredIcon} className="h-2.5 w-2.5" />
                                      <span>{item.featuredLabel || "Destaque"}</span>
                                    </span>
                                  ) : null}

                                  {item.kind !== "divider" && item.expiresAt ? (
                                    <DashboardCountdownBadge expiresAt={item.expiresAt} />
                                  ) : null}

                                  {item.tag ? (
                                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-[#9CB3CE]">
                                      {item.tag}
                                    </span>
                                  ) : null}

                                  {!item.isActive ? (
                                    <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                                      Oculto
                                    </span>
                                  ) : null}
                                </div>

                                {item.kind === "coupon" && (
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {item.couponCode ? (
                                      <span className="inline-flex items-center gap-1 rounded border border-[#38BDF8]/25 bg-[#38BDF8]/5 px-2 py-0.5 font-mono text-[11px] font-medium text-[#7DD3FC]">
                                        <Tag className="h-2.5 w-2.5 text-[#38BDF8]" aria-hidden="true" />
                                        <span>{item.couponCode}</span>
                                      </span>
                                    ) : null}
                                    {item.url ? (
                                      <span className="max-w-[200px] truncate text-xs text-[#7D97B8] sm:max-w-sm">
                                        {item.url}
                                      </span>
                                    ) : null}
                                  </div>
                                )}

                                {item.kind === "link" && item.url ? (
                                  <p className="mt-0.5 max-w-[240px] truncate text-xs text-[#7D97B8] sm:max-w-md">
                                    {item.url}
                                  </p>
                                ) : null}

                                {item.kind === "divider" && item.description ? (
                                  <p className="mt-1 truncate text-xs text-[#9CB3CE]">
                                    {item.description}
                                  </p>
                                ) : null}

                                {item.kind !== "divider" ? (
                                  <div className="mt-2 flex items-center gap-2.5 text-[11px] text-[#7D97B8]">
                                    <span className="inline-flex items-center gap-1">
                                      <Copy className="h-3 w-3 text-[#34D399]" aria-hidden="true" />
                                      <span className="font-bold text-white">{item.copiesCount}</span>{" "}
                                      {item.copiesCount === 1 ? "cópia" : "cópias"}
                                    </span>
                                    <span className="text-white/20">·</span>
                                    <span className="inline-flex items-center gap-1">
                                      <MousePointerClick className="h-3 w-3 text-[#7DD3FC]" aria-hidden="true" />
                                      <span className="font-bold text-white">{item.clicksCount}</span>{" "}
                                      {item.clicksCount === 1 ? "clique" : "cliques"}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {/* Actions Toolbar: grouped in a sleek non-wrapping row */}
                            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/8 bg-[#09101B] p-1">
                              {item.kind !== "divider" ? (
                                <button
                                  type="button"
                                  onClick={() => toggleItemFeatured(item)}
                                  aria-pressed={item.isFeatured}
                                  aria-label={
                                    item.isFeatured
                                      ? `Remover destaque de ${item.title}`
                                      : `Destacar ${item.title}`
                                  }
                                  title={
                                    item.isFeatured ? "Destaque ativo (clique para remover)" : "Destacar link"
                                  }
                                  className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                                    item.isFeatured
                                      ? "bg-amber-400/20 text-amber-300"
                                      : "text-[#9CB3CE] hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  <Star
                                    className={`h-4 w-4 ${item.isFeatured ? "fill-amber-300" : ""}`}
                                    aria-hidden="true"
                                  />
                                </button>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => toggleItemActive(item)}
                                aria-label={
                                  item.isActive
                                    ? `Ocultar ${item.title}`
                                    : `Mostrar ${item.title}`
                                }
                                title={item.isActive ? "Item visível (clique para ocultar)" : "Item oculto (clique para exibir)"}
                                className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                                  item.isActive
                                    ? "text-[#9CB3CE] hover:bg-white/10 hover:text-white"
                                    : "bg-amber-500/15 text-amber-300"
                                }`}
                              >
                                {item.isActive ? (
                                  <Eye className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditDialog(item)}
                                aria-label={`Editar ${item.title}`}
                                title="Editar item"
                                className="grid h-8 w-8 place-items-center rounded-lg text-[#9CB3CE] transition hover:bg-white/10 hover:text-white"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteTarget(item);
                                  deleteDialogRef.current?.showModal();
                                }}
                                aria-label={`Excluir ${item.title}`}
                                title="Excluir item"
                                className="grid h-8 w-8 place-items-center rounded-lg text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>
          ) : null}

          {/* TAB 2: APPEARANCE */}
          {activeTab === "appearance" ? (
            <section aria-label="Personalizar aparência e layout" className="flex flex-col gap-6">
              {/* Top Header & Quick Save */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4 sm:p-5">
                <div>
                  <h1 className="text-base font-extrabold tracking-tight sm:text-lg">
                    Aparência da Página
                  </h1>
                  <p className="mt-0.5 text-xs text-[#9CB3CE] sm:text-sm">
                    Temas prontos, desenhos de fundo, bordas e paleta de cores.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={() => saveProfilePatch()}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#1E60CF] px-4 text-xs font-bold text-white shadow-md hover:bg-[#256EE8] disabled:opacity-60 sm:min-h-[46px] sm:text-sm"
                >
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>Salvar aparência</span>
                </button>
              </div>

              {/* Presets */}
              <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold">Temas Prontos (1 clique)</h2>
                    <p className="mt-0.5 text-sm text-[#9CB3CE]">
                      Aplique uma combinação pronta de cores, desenhos e bordas.
                    </p>
                  </div>
                  {!userIsPro ? (
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
                      Temas com desenhos exclusivos no Pro
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {THEME_PRESETS.map((preset) => {
                    const isProTheme = !isThemePresetAllowedForPlan(preset, false);
                    const isSelected =
                      profile.bgStyle === preset.bgStyle &&
                      profile.cardStyle === preset.cardStyle &&
                      profile.radiusStyle === preset.radiusStyle &&
                      profile.bgColor === preset.bgColor;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setProfile((prev) => ({
                            ...prev,
                            themeMode: preset.themeMode,
                            bgStyle: preset.bgStyle,
                            cardStyle: preset.cardStyle,
                            radiusStyle: preset.radiusStyle,
                            fontStyle: preset.fontStyle ?? prev.fontStyle,
                            titleFontStyle: preset.titleFontStyle ?? prev.titleFontStyle,
                            accentColor: preset.accentColor,
                            ctaColor: preset.ctaColor,
                            bgColor: preset.bgColor,
                            cardColor: preset.cardColor,
                            textColor: preset.textColor,
                          }));
                          if (isProTheme && !userIsPro) {
                            setThemeProNotice(
                              `Você está testando o tema "${preset.name}" no celular ao lado. Para salvar fundos com desenhos e bordas exclusivas, faça upgrade para o Plano Pro 👑.`
                            );
                          } else {
                            setThemeProNotice(null);
                          }
                        }}
                        className={`relative flex items-center gap-3.5 rounded-2xl border p-3 text-left transition ${
                          isSelected
                            ? "border-[#38BDF8] bg-[#38BDF8]/10 shadow-[0_4px_20px_rgba(56,189,248,0.15)]"
                            : "border-white/12 bg-[#09101B] hover:border-white/25"
                        }`}
                      >
                        <ThemePresetPreviewIcon preset={preset} isProTheme={isProTheme} userIsPro={userIsPro} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="block truncate text-sm font-bold text-white">
                              {preset.name}
                            </span>
                            {!userIsPro ? (
                              isProTheme ? (
                                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-300">
                                  <Crown className="h-2.5 w-2.5 fill-amber-300" aria-hidden="true" />
                                  <span>PRO</span>
                                </span>
                              ) : (
                                <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                  Grátis
                                </span>
                              )
                            ) : null}
                          </div>

                          <p className="mt-0.5 truncate text-xs text-[#9CB3CE]">
                            {preset.description}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[#7D97B8]">
                            <span className="rounded bg-white/5 px-1.5 py-0.5">
                              Fundo:{" "}
                              {BG_STYLE_OPTIONS.find((b) => b.id === preset.bgStyle)?.label.replace(
                                "Desenho: ",
                                ""
                              ) || preset.bgStyle}
                            </span>
                            <span className="rounded bg-white/5 px-1.5 py-0.5">
                              Borda:{" "}
                              {RADIUS_OPTIONS.find((r) => r.id === preset.radiusStyle)?.label.split(
                                " "
                              )[0] || preset.radiusStyle}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {themeProNotice && !userIsPro ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-xs text-amber-200">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                      <span>{themeProNotice}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("plan")}
                      className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg bg-amber-400 px-3 font-extrabold text-[#08101C] hover:bg-amber-300"
                    >
                      <Crown className="h-3 w-3" aria-hidden="true" />
                      <span>Ver Plano Pro</span>
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Layout & Structure */}
              <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5">
                <h2 className="text-base font-extrabold">Layout e Estilo dos Cards</h2>

                <fieldset className="mt-4">
                  <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-[#9CB3CE]">
                    Disposição dos links
                  </legend>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {(
                      [
                        { id: "classic", label: "Lista Clássica", desc: "Cards completos em 1 coluna" },
                        { id: "compact", label: "Compacto", desc: "Visual mais enxuto e rápido" },
                        { id: "ultra-compact", label: "Ultra Compacto", desc: "Densidade máxima em linha única" },
                      ] as { id: PageLayout; label: string; desc: string }[]
                    ).map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer flex-col rounded-xl border p-3 text-center transition ${
                          profile.layout === opt.id
                            ? "border-[#38BDF8] bg-[#38BDF8]/12"
                            : "border-white/10 bg-[#09101B] hover:border-white/25"
                        }`}
                      >
                        <input
                          type="radio"
                          name="layout"
                          value={opt.id}
                          checked={profile.layout === opt.id}
                          onChange={() => setProfile((p) => ({ ...p, layout: opt.id }))}
                          className="sr-only"
                        />
                        {opt.id === "ultra-compact" ? (
                          <AlignJustify className="mx-auto mb-1 h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                        ) : (
                          <LayoutGrid className="mx-auto mb-1 h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                        )}
                        <span className="text-xs font-bold text-white">{opt.label}</span>
                        <span className="text-[11px] text-[#9CB3CE]">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="bg-style" className="block text-sm font-semibold">
                        Estilo de fundo
                      </label>
                      {!userIsPro ? (
                        <span className="text-[11px] font-semibold text-amber-300">
                          5 grátis · 14 Pro
                        </span>
                      ) : null}
                    </div>
                    <select
                      id="bg-style"
                      value={profile.bgStyle}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, bgStyle: e.target.value as BgStyle }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    >
                      {BG_STYLE_OPTIONS.map((opt) => {
                        const allowed = isBgStyleAllowedForPlan(opt.id, userIsPro);
                        return (
                          <option key={opt.id} value={opt.id} disabled={!allowed}>
                            {opt.label}
                            {!allowed ? " (Pro 👑)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {!userIsPro ? (
                      <p className="mt-1 text-xs text-[#9CB3CE]">
                        No plano Grátis: Glow, Sólido, Gradiente, Mesh e Pontilhado.{" "}
                        <button
                          type="button"
                          onClick={() => setActiveTab("plan")}
                          className="font-bold text-[#7DD3FC] underline hover:text-white"
                        >
                          Liberar 14 fundos com desenhos no Pro
                        </button>
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="card-style" className="mb-1.5 block text-sm font-semibold">
                      Bordas e superfície dos cards
                    </label>
                    <select
                      id="card-style"
                      value={profile.cardStyle}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, cardStyle: e.target.value as CardStyle }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    >
                      <option value="solid">Card Sólido (Padrão)</option>
                      <option value="glass">Vidro Translúcido (Glass)</option>
                      <option value="outline">Apenas Contorno</option>
                      <option value="brutal">Borda 3D Marcante</option>
                      <option value="top-accent">Faixa Colorida no Topo</option>
                      <option value="left-accent">Barra Colorida Lateral</option>
                      <option value="elevated">Elevado / Sombra Suave</option>
                      <option value="dashed">Borda Tracejada (Cupom)</option>
                    </select>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="radius-style" className="block text-sm font-semibold">
                        Arredondamento das bordas
                      </label>
                      {!userIsPro ? (
                        <span className="text-[11px] font-semibold text-amber-300">
                          3 grátis · 2 Pro
                        </span>
                      ) : null}
                    </div>
                    <select
                      id="radius-style"
                      value={profile.radiusStyle}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          radiusStyle: e.target.value as RadiusStyle,
                        }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    >
                      {RADIUS_OPTIONS.map((opt) => {
                        const allowed = isRadiusStyleAllowedForPlan(opt.id, userIsPro);
                        return (
                          <option key={opt.id} value={opt.id} disabled={!allowed}>
                            {opt.label}
                            {!allowed ? " (Pro 👑)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {!userIsPro ? (
                      <p className="mt-1 text-xs text-[#9CB3CE]">
                        No plano Grátis: Arredondado (20px), Suave (14px) e Reto (8px).{" "}
                        <button
                          type="button"
                          onClick={() => setActiveTab("plan")}
                          className="font-bold text-[#7DD3FC] underline hover:text-white"
                        >
                          Liberar bordas Pílula e Super Arredondada no Pro
                        </button>
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="name-font-style"
                      className="mb-1.5 block text-sm font-semibold"
                    >
                      Tipografia do seu nome
                    </label>
                    <select
                      id="name-font-style"
                      value={profile.nameFontStyle || profile.titleFontStyle || profile.fontStyle}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          nameFontStyle: e.target.value as FontStyle,
                        }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label} · {f.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="title-font-style"
                      className="mb-1.5 block text-sm font-semibold"
                    >
                      Tipografia dos títulos
                    </label>
                    <select
                      id="title-font-style"
                      value={profile.titleFontStyle || profile.fontStyle}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          titleFontStyle: e.target.value as FontStyle,
                        }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label} · {f.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="font-style" className="mb-1.5 block text-sm font-semibold">
                      Tipografia dos textos
                    </label>
                    <select
                      id="font-style"
                      value={profile.fontStyle}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, fontStyle: e.target.value as FontStyle }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label} · {f.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="featured-animation"
                      className="mb-1.5 block text-sm font-semibold"
                    >
                      Animação do link destaque
                    </label>
                    <select
                      id="featured-animation"
                      value={profile.featuredAnimation || "shimmer"}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          featuredAnimation: e.target.value as FeaturedAnimation,
                        }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    >
                      {FEATURED_ANIMATION_OPTIONS.map((opt) => {
                        const allowed = isAnimationAllowedForPlan(opt.id, userIsPro);
                        return (
                          <option key={opt.id} value={opt.id} disabled={!allowed}>
                            {opt.label} · {opt.description}
                            {!allowed ? " (Pro)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {!userIsPro ? (
                      <p className="mt-1 text-xs text-[#9CB3CE]">
                        No plano Grátis: Pulso e Brilho Contínuo.{" "}
                        <button
                          type="button"
                          onClick={() => setActiveTab("plan")}
                          className="font-bold text-[#7DD3FC] underline hover:text-white"
                        >
                          Desbloqueie todas no Pro
                        </button>
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="social-display-style"
                      className="mb-1.5 block text-sm font-semibold"
                    >
                      Redes sociais no topo (IG / TikTok)
                    </label>
                    <select
                      id="social-display-style"
                      value={profile.socialDisplayStyle || "both"}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          socialDisplayStyle: e.target.value as SocialDisplayStyle,
                        }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    >
                      <option value="both">Ícone + @arroba (Padrão)</option>
                      <option value="icon">Somente ícone</option>
                      <option value="text">Somente texto (@arroba)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-extrabold">Cores Personalizadas</h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      contrastRatio >= 4.5
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-amber-500/20 text-amber-200"
                    }`}
                  >
                    Contraste texto/fundo: {contrastRatio.toFixed(1)}:1{" "}
                    {contrastRatio >= 4.5 ? "· Ótimo" : "· Baixo"}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold text-[#9CB3CE]">
                    Combinações rápidas de destaque e botão:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PALETTES.map((pal) => (
                      <button
                        key={pal.name}
                        type="button"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            accentColor: pal.accent,
                            ctaColor: pal.cta,
                          }))
                        }
                        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/12 bg-[#09101B] px-3 py-1 text-xs font-semibold text-white transition hover:border-[#38BDF8]/60"
                      >
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-3.5 rounded-full"
                          style={{
                            background: `linear-gradient(135deg, ${pal.cta}, ${pal.accent})`,
                          }}
                        />
                        <span>{pal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(
                    [
                      { key: "bgColor", label: "Fundo" },
                      { key: "cardColor", label: "Cards" },
                      { key: "textColor", label: "Texto" },
                      { key: "accentColor", label: "Destaque" },
                      { key: "ctaColor", label: "Botão CTA" },
                    ] as const
                  ).map((c) => (
                    <label
                      key={c.key}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/12 bg-[#09101B] p-2.5"
                    >
                      <input
                        type="color"
                        value={profile[c.key]}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            [c.key]: e.target.value.toUpperCase(),
                          }))
                        }
                        className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-white">{c.label}</span>
                        <span className="font-mono text-[11px] text-[#9CB3CE]">
                          {profile[c.key]}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="theme-mode" className="mb-1.5 block text-sm font-semibold">
                      Tema padrão ao abrir
                    </label>
                    <select
                      id="theme-mode"
                      value={profile.themeMode}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          themeMode: e.target.value as ThemeMode,
                        }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    >
                      <option value="dark">Escuro</option>
                      <option value="light">Claro</option>
                      <option value="auto">Seguir dispositivo do visitante</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex min-h-[46px] w-full cursor-pointer items-center gap-3 rounded-xl border border-white/12 bg-[#09101B] px-3.5 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={profile.allowThemeToggle}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, allowThemeToggle: e.target.checked }))
                        }
                        className="h-4 w-4 accent-[#38BDF8]"
                      />
                      <span>Botão claro/escuro para visitantes</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  {hasUnsavedProfileChanges ? (
                    <span className="text-xs font-semibold text-amber-300">
                      Alterações não salvas
                    </span>
                  ) : null}
                  <button
                    type="button"
                    disabled={savingProfile}
                    onClick={() => saveProfilePatch()}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#1E60CF] px-5 text-sm font-bold text-white shadow-lg hover:bg-[#256EE8] disabled:opacity-60"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>Salvar aparência</span>
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {/* TAB 3: METRICS / ANALYTICS */}
          {activeTab === "analytics" ? (
            <section aria-label="Métricas e Analytics" className="flex flex-col gap-6">
              {/* Metrics Section Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4 sm:p-5">
                <div>
                  <h1 className="text-base font-extrabold tracking-tight sm:text-lg">
                    Métricas de Desempenho
                  </h1>
                  <p className="mt-0.5 text-xs text-[#9CB3CE] sm:text-sm">
                    Acompanhe acessos, cliques em links e cópias de cupons em tempo real.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={analyticsLoading}
                  onClick={() => setAnalyticsReloadToken((t) => t + 1)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-semibold text-[#9CB3CE] transition hover:text-white"
                >
                  {analyticsLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>Atualizar</span>
                </button>
              </div>
              {/* Metrics Summary - Linha 1: Métricas Gerais */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CB3CE]">
                    <Eye className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
                    <span>Visitas Totais</span>
                  </div>
                  <p className="mt-1.5 text-2xl font-extrabold">{profile.viewsCount}</p>
                  <p className="mt-0.5 text-[11px] text-[#7D97B8]">Acessos à sua bio</p>
                </div>

                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center justify-between gap-1 text-xs font-semibold text-[#9CB3CE]">
                    <span className="flex items-center gap-1.5">
                      <Copy className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
                      <span>Cópias</span>
                    </span>
                    {profile.viewsCount > 0 ? (
                      <span className="rounded-full bg-[#34D399]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#34D399]">
                        {((totalCopies / profile.viewsCount) * 100).toFixed(1)}% CTR
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-2xl font-extrabold text-[#34D399]">{totalCopies}</p>
                  <p className="mt-0.5 text-[11px] text-[#7D97B8]">Cópias de cupom</p>
                </div>

                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center justify-between gap-1 text-xs font-semibold text-[#9CB3CE]">
                    <span className="flex items-center gap-1.5">
                      <MousePointerClick className="h-3.5 w-3.5 text-[#A78BFA]" aria-hidden="true" />
                      <span>Cliques</span>
                    </span>
                    {profile.viewsCount > 0 ? (
                      <span className="rounded-full bg-[#A78BFA]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#C4B5FD]">
                        {((totalClicks / profile.viewsCount) * 100).toFixed(1)}% CTR
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-2xl font-extrabold text-[#7DD3FC]">{totalClicks}</p>
                  <p className="mt-0.5 text-[11px] text-[#7D97B8]">Cliques em links</p>
                </div>

                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CB3CE]">
                    <Activity className="h-3.5 w-3.5 text-[#FB923C]" aria-hidden="true" />
                    <span>Engajamento</span>
                  </div>
                  <p className="mt-1.5 text-2xl font-extrabold text-[#FB923C]">
                    {profile.viewsCount > 0
                      ? `${Math.round(((totalCopies + totalClicks) / profile.viewsCount) * 100)}%`
                      : "0%"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7D97B8]">Conversão da página</p>
                </div>
              </div>

              {/* Metrics Summary - Linha 2: Inteligência e Desempenho Adicional */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CB3CE]">
                    <TrendingUp className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
                    <span>Média Diária</span>
                  </div>
                  <p className="mt-1.5 text-xl font-extrabold text-white">
                    {analyticsPoints.length > 0
                      ? (analyticsPoints.reduce((a, b) => a + b.views, 0) / analyticsPoints.length).toFixed(1)
                      : "0.0"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7D97B8]">
                    Acessos/dia nos últimos {analyticsDays}d
                  </p>
                </div>

                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CB3CE]">
                    <BarChart3 className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
                    <span>Ações no Período</span>
                  </div>
                  <p className="mt-1.5 text-xl font-extrabold text-[#34D399]">
                    {analyticsPoints.reduce((a, b) => a + b.views + b.copies + b.clicks, 0)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7D97B8]">
                    Visitas + cliques + cópias
                  </p>
                </div>

                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CB3CE]">
                    <Tag className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                    <span>Top Cupom</span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-extrabold text-amber-200" title={topCoupon?.title || "Nenhum ainda"}>
                    {topCoupon ? topCoupon.title : "Nenhum ainda"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7D97B8]">
                    {topCoupon ? `${topCoupon.copiesCount} cópias` : "Sem dados de cópia"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CB3CE]">
                    <Award className="h-3.5 w-3.5 text-[#A78BFA]" aria-hidden="true" />
                    <span>Top Link</span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-extrabold text-[#C4B5FD]" title={topLink?.title || "Nenhum ainda"}>
                    {topLink ? topLink.title : "Nenhum ainda"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7D97B8]">
                    {topLink ? `${topLink.clicksCount} cliques` : "Sem dados de clique"}
                  </p>
                </div>
              </div>

              {/* Combo Chart: Colunas para Acessos + Linha para Cliques */}
              <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold">Evolução do período</h2>
                    <p className="text-xs text-[#9CB3CE]">
                      Colunas para acessos (visitas) e gráfico de linha para cliques nos links
                    </p>
                  </div>

                  {/* Interval Selector: 7 dias (Free), 14 dias (Pro), 30 dias (Pro) */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#09101B] p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAnalyticsLoading(true);
                        setAnalyticsDays(7);
                      }}
                      className={`min-h-8 rounded-lg px-3 text-xs font-bold transition ${
                        analyticsDays === 7
                          ? "bg-[#1E60CF] text-white"
                          : "text-[#9CB3CE] hover:text-white"
                      }`}
                    >
                      7 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnalyticsLoading(true);
                        setAnalyticsDays(14);
                      }}
                      className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-3 text-xs font-bold transition ${
                        analyticsDays === 14
                          ? "bg-[#1E60CF] text-white"
                          : "text-[#9CB3CE] hover:text-white"
                      }`}
                    >
                      {!userIsPro ? <Lock className="h-3 w-3 text-amber-300" aria-hidden="true" /> : null}
                      <span>14 dias</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnalyticsLoading(true);
                        setAnalyticsDays(30);
                      }}
                      className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-3 text-xs font-bold transition ${
                        analyticsDays === 30
                          ? "bg-[#1E60CF] text-white"
                          : "text-[#9CB3CE] hover:text-white"
                      }`}
                    >
                      {!userIsPro ? <Lock className="h-3 w-3 text-amber-300" aria-hidden="true" /> : null}
                      <span>30 dias</span>
                    </button>
                  </div>
                </div>

                {analyticsLocked ? (
                  <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/8 p-5 text-center sm:flex-row sm:text-left">
                    <div>
                      <p className="text-sm font-extrabold text-amber-100">
                        Histórico de {analyticsDays} dias exclusivo do Plano Pro
                      </p>
                      <p className="mt-0.5 text-xs text-[#9CB3CE]">
                        No plano Grátis você acompanha os totais gerais e os últimos 7 dias.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("plan")}
                      className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-amber-400 px-4 text-xs font-extrabold text-[#08101C] hover:bg-amber-300"
                    >
                      <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Fazer upgrade Pro</span>
                    </button>
                  </div>
                ) : analyticsLoading && analyticsPoints.length === 0 ? (
                  <p className="py-8 text-center text-xs text-[#9CB3CE]">
                    Carregando métricas e gráfico...
                  </p>
                ) : analyticsPoints.length === 0 ? (
                  <p className="py-8 text-center text-xs text-[#9CB3CE]">
                    Ainda não há eventos registrados neste período.
                  </p>
                ) : (
                  (() => {
                    const maxVal = Math.max(
                      1,
                      ...analyticsPoints.map((pt) => Math.max(pt.views, pt.clicks))
                    );
                    const niceMax =
                      maxVal <= 5 ? 5 : maxVal <= 10 ? 10 : Math.ceil(maxVal * 1.15);
                    const n = analyticsPoints.length;

                    // SVG Line calculation for clicks
                    const xForIndex = (i: number) => ((i + 0.5) / n) * 1000;
                    const yForValue = (val: number) => 145 - (val / niceMax) * 130;

                    const pathD = analyticsPoints
                      .map((pt, i) => `${i === 0 ? "M" : "L"} ${xForIndex(i).toFixed(1)} ${yForValue(pt.clicks).toFixed(1)}`)
                      .join(" ");

                    const areaD =
                      n > 0
                        ? `${pathD} L ${xForIndex(n - 1).toFixed(1)} 145 L ${xForIndex(0).toFixed(1)} 145 Z`
                        : "";

                    return (
                      <div>
                        {/* Chart Legend */}
                        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-sm bg-gradient-to-t from-[#1E60CF] to-[#38BDF8]" />
                            <span className="font-semibold text-white">Colunas: Acessos (Visitas)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-0.5 w-4 bg-[#34D399]" />
                            <span className="font-semibold text-[#34D399]">Linha: Cliques em Links</span>
                          </div>
                          <div className="ml-auto text-[11px] text-[#7D97B8]">
                            Passe o cursor sobre os dias para detalhes
                          </div>
                        </div>

                        {/* Chart Canvas Area */}
                        <div className="relative h-48 sm:h-56 w-full pt-4">
                          {/* Y-Axis Horizontal Grid Lines */}
                          <div className="pointer-events-none absolute inset-x-0 top-4 bottom-7 flex flex-col justify-between border-b border-white/10 text-[10px] text-[#7D97B8]">
                            <div className="flex items-center justify-between border-b border-dashed border-white/5 pb-1">
                              <span>{niceMax}</span>
                              <span className="border-t border-dashed border-white/10 w-full ml-2 opacity-30" />
                            </div>
                            <div className="flex items-center justify-between border-b border-dashed border-white/5 pb-1">
                              <span>{Math.round(niceMax / 2)}</span>
                              <span className="border-t border-dashed border-white/10 w-full ml-2 opacity-30" />
                            </div>
                            <div className="flex items-center justify-between pb-1">
                              <span>0</span>
                              <span className="border-t border-dashed border-white/10 w-full ml-2 opacity-30" />
                            </div>
                          </div>

                          {/* SVG Line Overlay for Cliques */}
                          <svg
                            viewBox="0 0 1000 160"
                            preserveAspectRatio="none"
                            className="pointer-events-none absolute inset-x-0 top-4 h-[145px] w-full overflow-visible z-20"
                          >
                            <defs>
                              <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34D399" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#34D399" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            {areaD ? <path d={areaD} fill="url(#clicksGradient)" /> : null}
                            {pathD ? (
                              <path
                                d={pathD}
                                fill="none"
                                stroke="#34D399"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            ) : null}
                            {analyticsPoints.map((pt, i) => {
                              const cx = xForIndex(i);
                              const cy = yForValue(pt.clicks);
                              return (
                                <g key={pt.date}>
                                  <circle cx={cx} cy={cy} r="4" fill="#0E1624" stroke="#34D399" strokeWidth="2" />
                                  <circle cx={cx} cy={cy} r="2" fill="#34D399" />
                                </g>
                              );
                            })}
                          </svg>

                          {/* Columns for Visitas */}
                          <div className="relative z-10 flex h-[145px] w-full items-end justify-between gap-1 sm:gap-2 px-1">
                            {analyticsPoints.map((pt) => {
                              const pct = Math.max(3, Math.round((pt.views / niceMax) * 100));
                              const dateParts = pt.date.split("-");
                              const shortDate = `${dateParts[2]}/${dateParts[1]}`;
                              return (
                                <div
                                  key={pt.date}
                                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                                >
                                  {/* Floating Hover Tooltip */}
                                  <div className="pointer-events-none absolute -top-16 z-40 hidden -translate-x-1/2 rounded-xl border border-white/20 bg-[#070C14] px-2.5 py-1.5 text-center text-[10px] shadow-2xl group-hover:block whitespace-nowrap left-1/2">
                                    <p className="font-extrabold text-white">{shortDate}</p>
                                    <p className="font-bold text-[#38BDF8]">{pt.views} visitas</p>
                                    <p className="font-bold text-[#34D399]">{pt.clicks} cliques</p>
                                    {pt.copies > 0 ? (
                                      <p className="font-bold text-amber-300">{pt.copies} cópias</p>
                                    ) : null}
                                  </div>

                                  {/* Bar */}
                                  <div
                                    className="w-full max-w-[20px] sm:max-w-[28px] rounded-t-sm sm:rounded-t-md bg-gradient-to-t from-[#1E60CF] via-[#256EE8] to-[#38BDF8] opacity-85 transition-all group-hover:opacity-100 group-hover:brightness-125"
                                    style={{ height: `${pt.views === 0 ? 3 : pct}%` }}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* X-Axis Date Labels */}
                          <div className="flex justify-between w-full pt-2 text-[10px] text-[#9CB3CE]">
                            {analyticsPoints.map((pt, idx) => {
                              const dateParts = pt.date.split("-");
                              const shortDate = `${dateParts[2]}/${dateParts[1]}`;
                              const showOnMobile =
                                analyticsDays === 7 ||
                                (analyticsDays === 14 && idx % 2 === 0) ||
                                (analyticsDays === 30 && idx % 4 === 0) ||
                                idx === analyticsPoints.length - 1;

                              return (
                                <span
                                  key={pt.date}
                                  className={`flex-1 text-center font-mono ${
                                    showOnMobile ? "inline" : "hidden sm:inline"
                                  }`}
                                >
                                  {shortDate}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Period Summary Footer */}
                        <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-3 text-xs text-[#9CB3CE]">
                          <span>
                            Visitas no período:{" "}
                            <strong className="text-white">
                              {analyticsPoints.reduce((a, b) => a + b.views, 0)}
                            </strong>
                          </span>
                          <span>
                            Cliques no período:{" "}
                            <strong className="text-[#34D399]">
                              {analyticsPoints.reduce((a, b) => a + b.clicks, 0)}
                            </strong>
                          </span>
                          <span>
                            Cópias no período:{" "}
                            <strong className="text-amber-300">
                              {analyticsPoints.reduce((a, b) => a + b.copies, 0)}
                            </strong>
                          </span>
                          <span>
                            Média diária:{" "}
                            <strong className="text-[#7DD3FC]">
                              {(analyticsPoints.reduce((a, b) => a + b.views, 0) / analyticsPoints.length).toFixed(1)} acessos/dia
                            </strong>
                          </span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Per-item Breakdown */}
              {items.length > 0 ? (
                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5">
                  <h2 className="mb-3 text-base font-extrabold">Desempenho por item</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-xs uppercase text-[#9CB3CE]">
                          <th className="py-2 pr-3 font-semibold">Marca / Link</th>
                          <th className="px-3 py-2 font-semibold">Tipo</th>
                          <th className="px-3 py-2 text-right font-semibold">Cópias</th>
                          <th className="py-2 pl-3 text-right font-semibold">Cliques</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items
                          .filter((it) => it.kind !== "divider")
                          .map((it) => (
                            <tr key={it.id} className="border-b border-white/5 last:border-0">
                              <td className="py-2.5 pr-3 font-semibold text-white">{it.title}</td>
                              <td className="px-3 py-2.5 text-xs text-[#9CB3CE]">
                                {it.kind === "coupon" ? "Cupom" : "Link"}
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono text-xs text-[#34D399]">
                                {it.copiesCount}
                              </td>
                              <td className="py-2.5 pl-3 text-right font-mono text-xs text-[#7DD3FC]">
                                {it.clicksCount}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* TAB 4: PERFIL & PLANO */}
          {activeTab === "profile" || activeTab === "plan" ? (
            <section aria-label="Perfil e plano de assinatura" className="flex flex-col gap-6">
              {/* Profile Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveProfilePatch();
                }}
                className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                    <h2 className="text-base font-extrabold">Dados do seu perfil</h2>
                  </div>
                  {userEmail ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-[#9CB3CE]">
                      {userEmail}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="prof-name" className="mb-1 block text-sm font-semibold">
                      Nome de exibição
                    </label>
                    <input
                      id="prof-name"
                      type="text"
                      required
                      value={profile.displayName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, displayName: e.target.value }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-slug" className="mb-1 block text-sm font-semibold">
                      Endereço público (slug)
                    </label>
                    <input
                      id="prof-slug"
                      type="text"
                      required
                      minLength={3}
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={profile.slug}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, slug: sanitizeSlug(e.target.value) }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 font-mono text-white"
                    />
                    {slugCheck && slugCheck.slug === sanitizeSlug(profile.slug) ? (
                      <p
                        className={`mt-1 text-xs font-semibold ${
                          slugCheck.available ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {slugCheck.available
                          ? `/${slugCheck.slug} disponível para uso`
                          : slugCheck.reason || "Este endereço não está disponível."}
                      </p>
                    ) : null}
                  </div>

                  <div className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold">
                      Foto de perfil
                    </span>
                    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/12 bg-[#09101B] p-3.5">
                      <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#38BDF8] bg-gradient-to-br from-[#1E60CF] to-[#38BDF8]">
                        {isSafeMediaSrc(profile.avatarUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profile.avatarUrl}
                            alt={`Foto atual de ${profile.displayName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-extrabold text-white">
                            {computeInitials(profile.displayName)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          disabled={avatarUploading}
                          onClick={() => avatarInputRef.current?.click()}
                          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-[#1E60CF] px-4 text-sm font-bold text-white transition hover:bg-[#256EE8] active:scale-[0.98] disabled:opacity-60"
                        >
                          {avatarUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Upload className="h-4 w-4" aria-hidden="true" />
                          )}
                          <span>{avatarUploading ? "Carregando foto..." : "Carregar foto"}</span>
                        </button>
                        <input
                          ref={avatarInputRef}
                          id="prof-avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                          tabIndex={-1}
                          aria-hidden="true"
                        />

                        {profile.avatarUrl ? (
                          <button
                            type="button"
                            onClick={() => saveProfilePatch({ avatarUrl: "" })}
                            className="inline-flex min-h-[44px] items-center rounded-xl border border-white/15 px-3.5 text-sm font-semibold text-[#9CB3CE] hover:text-white"
                          >
                            Remover foto
                          </button>
                        ) : null}

                        <p className="w-full text-xs text-[#9CB3CE]">
                          Envie uma imagem do seu aparelho (PNG, JPG ou WebP). Sem foto, usamos suas iniciais automaticamente ({computeInitials(profile.displayName)}).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="prof-bio" className="mb-1 block text-sm font-semibold">
                      Bio curta
                    </label>
                    <textarea
                      id="prof-bio"
                      rows={2}
                      value={profile.bio}
                      onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                      className="mc-input w-full rounded-xl border border-white/15 bg-[#09101B] p-3 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-ig" className="mb-1 block text-sm font-semibold">
                      @ do Instagram
                    </label>
                    <input
                      id="prof-ig"
                      type="text"
                      autoCorrect="off"
                      autoCapitalize="none"
                      value={profile.instagramHandle}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, instagramHandle: e.target.value }))
                      }
                      placeholder="@seuperfil"
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-ig-url" className="mb-1 block text-sm font-semibold">
                      Link do Instagram
                    </label>
                    <input
                      id="prof-ig-url"
                      type="url"
                      autoCorrect="off"
                      autoCapitalize="none"
                      value={profile.instagramUrl}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, instagramUrl: e.target.value }))
                      }
                      placeholder="https://instagram.com/seuperfil"
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-tt" className="mb-1 block text-sm font-semibold">
                      @ do TikTok
                    </label>
                    <input
                      id="prof-tt"
                      type="text"
                      autoCorrect="off"
                      autoCapitalize="none"
                      value={profile.tiktokHandle}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, tiktokHandle: e.target.value }))
                      }
                      placeholder="@seutiktok"
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-tt-url" className="mb-1 block text-sm font-semibold">
                      Link do TikTok
                    </label>
                    <input
                      id="prof-tt-url"
                      type="url"
                      autoCorrect="off"
                      autoCapitalize="none"
                      value={profile.tiktokUrl}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, tiktokUrl: e.target.value }))
                      }
                      placeholder="https://tiktok.com/@seutiktok"
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-yt" className="mb-1 block text-sm font-semibold">
                      Canal do YouTube (@ ou nome)
                    </label>
                    <input
                      id="prof-yt"
                      type="text"
                      autoCorrect="off"
                      autoCapitalize="none"
                      value={profile.youtubeHandle || ""}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, youtubeHandle: e.target.value }))
                      }
                      placeholder="@seucanal"
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-yt-url" className="mb-1 block text-sm font-semibold">
                      Link do YouTube
                    </label>
                    <input
                      id="prof-yt-url"
                      type="url"
                      autoCorrect="off"
                      autoCapitalize="none"
                      value={profile.youtubeUrl || ""}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, youtubeUrl: e.target.value }))
                      }
                      placeholder="https://youtube.com/@seucanal"
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-sec" className="mb-1 block text-sm font-semibold">
                      Título da lista
                    </label>
                    <input
                      id="prof-sec"
                      type="text"
                      value={profile.sectionTitle}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, sectionTitle: e.target.value }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-tip" className="mb-1 block text-sm font-semibold">
                      Dica rápida
                    </label>
                    <input
                      id="prof-tip"
                      type="text"
                      value={profile.helperTip}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, helperTip: e.target.value }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="prof-footer" className="mb-1 block text-sm font-semibold">
                      Texto do rodapé
                    </label>
                    <input
                      id="prof-footer"
                      type="text"
                      value={profile.footerText}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, footerText: e.target.value }))
                      }
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    />
                  </div>

                  {/* Branding / Watermark Card */}
                  <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-[#09101B]/80 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 p-1.5 text-white">
                          <BrandIcon className="h-full w-full" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">Marca d&apos;água no rodapé</h4>
                            {!userIsPro ? (
                              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                                Recurso Pro
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-[#9CB3CE]">
                            {userIsPro
                              ? "Você possui o Plano Pro: desmarque a caixa ao lado para remover completamente a logo da sua página."
                              : "No plano Grátis, sua página exibe a logo oficial meucupom.bio. Assine o Pro para ter uma página 100% white-label sem marca."}
                          </p>
                          <div className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1">
                            <span className="text-[10px] font-medium text-[#9CB3CE]">Prévia da logo:</span>
                            <BrandLogo className="h-3.5 w-auto" textColor="#FFFFFF" />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <label
                          className={`flex items-center gap-2 text-xs font-semibold ${
                            userIsPro ? "cursor-pointer text-white" : "cursor-not-allowed opacity-60 text-[#9CB3CE]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!userIsPro}
                            checked={userIsPro ? profile.showBranding : true}
                            onChange={(e) =>
                              setProfile((p) => ({ ...p, showBranding: e.target.checked }))
                            }
                            className="h-4 w-4 rounded accent-[#38BDF8]"
                          />
                          <span>Exibir logo na página</span>
                        </label>

                        {!userIsPro ? (
                          <button
                            type="button"
                            onClick={() => setActiveTab("plan")}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-[#08101C] hover:bg-amber-300 shadow-sm transition"
                          >
                            <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Remover logo no Pro</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#1E60CF] px-5 text-sm font-bold text-white shadow-lg hover:bg-[#256EE8] disabled:opacity-60"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>Salvar perfil</span>
                  </button>
                </div>
              </form>

              {/* Security & Password Reset Card */}
              <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1E60CF]/20 text-[#38BDF8]">
                      <KeyRound className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-white">Segurança e Senha</h2>
                      <p className="text-xs text-[#9CB3CE]">
                        Redefina sua senha por e-mail ou altere diretamente aqui.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={sendingResetEmail}
                      onClick={handleSendResetPasswordEmail}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-white/15 bg-[#09101B] px-3.5 text-xs font-bold text-white transition hover:border-[#38BDF8] disabled:opacity-60"
                    >
                      {sendingResetEmail ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
                      )}
                      <span>
                        {resetEmailSent ? "Reenviar link por e-mail" : "Enviar link por e-mail"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setChangePasswordOpen((prev) => !prev);
                        setChangePasswordError(null);
                        setChangePasswordSuccess(false);
                      }}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white/10 px-3.5 text-xs font-bold text-white transition hover:bg-white/15"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                      <span>{changePasswordOpen ? "Fechar" : "Alterar senha"}</span>
                    </button>
                  </div>
                </div>

                {resetEmailSent ? (
                  <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                    <span>
                      Enviamos um link seguro de redefinição para <strong>{userEmail}</strong>. Verifique sua caixa de entrada e spam.
                    </span>
                  </div>
                ) : null}

                {changePasswordOpen ? (
                  <form
                    onSubmit={handleChangePassword}
                    className="mt-4 rounded-xl border border-white/10 bg-[#09101B] p-4"
                  >
                    <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#7DD3FC]">
                      Criar nova senha
                    </h3>

                    {changePasswordError ? (
                      <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-2.5 text-xs text-red-200">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
                        <span>{changePasswordError}</span>
                      </div>
                    ) : null}

                    {changePasswordSuccess ? (
                      <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-200">
                        <Check className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                        <span>Senha alterada com sucesso!</span>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label
                          htmlFor="pwd-current"
                          className="mb-1 block text-xs font-semibold text-[#9CB3CE]"
                        >
                          Senha atual
                        </label>
                        <input
                          id="pwd-current"
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Sua senha atual"
                          className="mc-input min-h-[42px] w-full rounded-lg border border-white/15 bg-[#070C14] px-3 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="pwd-new"
                          className="mb-1 block text-xs font-semibold text-[#9CB3CE]"
                        >
                          Nova senha (mínimo 8)
                        </label>
                        <input
                          id="pwd-new"
                          type="password"
                          required
                          minLength={8}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Pelo menos 8 dígitos"
                          className="mc-input min-h-[42px] w-full rounded-lg border border-white/15 bg-[#070C14] px-3 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="pwd-confirm"
                          className="mb-1 block text-xs font-semibold text-[#9CB3CE]"
                        >
                          Confirmar nova senha
                        </label>
                        <input
                          id="pwd-confirm"
                          type="password"
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a nova senha"
                          className="mc-input min-h-[42px] w-full rounded-lg border border-white/15 bg-[#070C14] px-3 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setChangePasswordOpen(false)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-[#9CB3CE] hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1E60CF] px-4 text-xs font-bold text-white transition hover:bg-[#256EE8] disabled:opacity-60"
                      >
                        {changingPassword ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>Salvar nova senha</span>
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>

              {/* Plan & Subscription Card */}
              <div id="plan-section" className="rounded-2xl border border-[#94C5FF]/16 bg-[#0E1624] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown
                        className={`h-5 w-5 ${
                          userIsPro ? "text-amber-300" : "text-[#9CB3CE]"
                        }`}
                        aria-hidden="true"
                      />
                      <h2 className="text-lg font-extrabold text-white">
                        Seu plano atual: {userIsPro ? "Pro" : "Grátis"}
                      </h2>
                    </div>
                    <p className="mt-1 text-sm text-[#9CB3CE]">
                      {userIsPro
                        ? `Status da assinatura: ${profile.subscriptionStatus}. Todos os recursos liberados.`
                        : `Você está usando ${linkCount} de ${FREE_MAX_ACTIVE_OR_TOTAL_LINKS} links/cupons disponíveis no plano Grátis.`}
                    </p>
                    {profile.currentPeriodEnd ? (
                      <p className="mt-1 text-xs text-[#7DD3FC]">
                        Ciclo vigente até{" "}
                        {new Date(profile.currentPeriodEnd).toLocaleDateString("pt-BR")}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {!userIsPro ? (
                      <>
                        <button
                          type="button"
                          disabled={billingLoading || pixLoading}
                          onClick={handleStartCheckout}
                          className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-extrabold text-[#08101C] shadow-lg hover:bg-amber-300 disabled:opacity-60"
                        >
                          {billingLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Crown className="h-4 w-4" aria-hidden="true" />
                          )}
                          <span>
                            {appliedCheckoutCoupon
                              ? `Assinar Pro (-${appliedCheckoutCoupon.discountPercent}%)`
                              : "Assinar no Cartão"}
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={billingLoading || pixLoading}
                          onClick={handleOpenPixModal}
                          className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 text-sm font-bold text-emerald-200 shadow-md hover:bg-emerald-500/25 disabled:opacity-60"
                        >
                          <QrCode className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                          <span>Pagar com Pix</span>
                        </button>
                      </>
                    ) : null}

                    {!userIsPro && isAdmin ? (
                      <button
                        type="button"
                        disabled={billingLoading}
                        onClick={handleAdminSelfActivatePro}
                        className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/15 px-4 text-sm font-bold text-amber-200 hover:bg-amber-400/25 disabled:opacity-60"
                        title="Ativar Pro instantaneamente na sua própria conta sem custo (Super Admin)"
                      >
                        <ShieldCheck className="h-4 w-4 text-amber-300" aria-hidden="true" />
                        <span>Ativar Pro (Super Admin)</span>
                      </button>
                    ) : null}

                    {profile.mpPreapprovalId && !userIsPro ? (
                      <button
                        type="button"
                        disabled={billingLoading}
                        onClick={handleSyncSubscription}
                        className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-white/15 bg-[#09101B] px-4 text-sm font-bold text-white hover:border-[#38BDF8] disabled:opacity-60"
                      >
                        <CreditCard className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                        <span>Verificar pagamento</span>
                      </button>
                    ) : null}

                    {profile.mpPreapprovalId && userIsPro ? (
                      <button
                        type="button"
                        disabled={billingLoading}
                        onClick={handleCancelSubscription}
                        className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-red-400/35 bg-red-500/10 px-4 text-sm font-bold text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                      >
                        <CreditCard className="h-4 w-4 text-red-300" aria-hidden="true" />
                        <span>Cancelar assinatura</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {!mercadoPagoEnabled && !userIsPro ? (
                  <p className="mt-4 rounded-xl border border-white/10 bg-[#09101B] px-3.5 py-2.5 text-xs text-[#9CB3CE]">
                    Pagamentos via Mercado Pago ainda não configurados neste ambiente (`MP_ACCESS_TOKEN`).
                  </p>
                ) : null}
              </div>

              {/* Plan Comparison Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {PLAN_CARDS.map((card) => {
                  const isCurrent =
                    (card.id === "pro" && userIsPro) || (card.id === "free" && !userIsPro);
                  const isHighlighted = card.id === "pro";
                  return (
                    <div
                      key={card.id}
                      className={`flex flex-col justify-between rounded-2xl border p-5 ${
                        isHighlighted
                          ? "border-[#38BDF8]/45 bg-gradient-to-b from-[#10223A] to-[#0D1624]"
                          : "border-[#94C5FF]/14 bg-[#0E1624]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-extrabold text-white">{card.name}</h3>
                          {isCurrent ? (
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                              Plano atual
                            </span>
                          ) : null}
                        </div>
                        {card.id === "pro" && appliedCheckoutCoupon ? (
                          <div className="mt-1">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-sm line-through text-[#9CB3CE]">
                                {card.priceLabel}
                              </span>
                              <span className="text-2xl font-black text-emerald-400">
                                R$ {appliedCheckoutCoupon.discountedPrice.toFixed(2).replace(".", ",")}
                              </span>
                              <span className="text-xs font-semibold text-[#9CB3CE]">
                                {card.periodLabel}
                              </span>
                              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-extrabold text-emerald-300">
                                -{appliedCheckoutCoupon.discountPercent}% OFF
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-emerald-300">
                              <span>
                                Cupom <strong>{appliedCheckoutCoupon.code}</strong> ({appliedCheckoutCoupon.influencerName})
                              </span>
                              <button
                                type="button"
                                onClick={() => setAppliedCheckoutCoupon(null)}
                                className="text-[11px] font-bold text-red-300 underline hover:text-red-200"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 text-2xl font-black text-white">
                            {card.priceLabel}
                            <span className="text-xs font-semibold text-[#9CB3CE]">
                              {" "}
                              {card.periodLabel}
                            </span>
                          </p>
                        )}
                        <p className="mt-1 text-xs text-[#9CB3CE]">{card.description}</p>

                        <ul className="mt-4 space-y-2 text-xs text-[#E2ECF7]">
                          {card.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-2">
                              <CheckCircle2
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#38BDF8]"
                                aria-hidden="true"
                              />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {card.id === "pro" && !userIsPro ? (
                        <div className="mt-5 flex flex-col gap-2.5">
                          {!appliedCheckoutCoupon ? (
                            <div className="rounded-xl border border-white/10 bg-[#09101B]/90 p-2.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9CB3CE]">
                                <Tag className="h-3 w-3 text-amber-400" />
                                <span>Tem cupom de influenciador / desconto?</span>
                              </div>
                              <div className="mt-1.5 flex gap-1.5">
                                <input
                                  type="text"
                                  value={checkoutCouponCode}
                                  onChange={(e) =>
                                    setCheckoutCouponCode(
                                      e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleApplyCheckoutCoupon();
                                    }
                                  }}
                                  placeholder="Ex: SARDINHA10"
                                  className="min-h-[34px] w-full rounded-lg border border-white/15 bg-white/5 px-2.5 text-xs font-bold uppercase text-white placeholder:normal-case placeholder:font-normal placeholder:text-[#6A829F] focus:border-amber-400 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={validatingCheckoutCoupon || !checkoutCouponCode.trim()}
                                  onClick={() => handleApplyCheckoutCoupon()}
                                  className="inline-flex min-h-[34px] shrink-0 items-center justify-center rounded-lg bg-amber-400 px-3 text-xs font-extrabold text-[#08101C] transition hover:bg-amber-300 disabled:opacity-50"
                                >
                                  {validatingCheckoutCoupon ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    "Aplicar"
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : null}

                          <button
                            type="button"
                            disabled={billingLoading || pixLoading}
                            onClick={handleStartCheckout}
                            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#1E60CF] px-4 text-sm font-bold text-white hover:bg-[#256EE8] disabled:opacity-60"
                          >
                            <Crown className="h-4 w-4" aria-hidden="true" />
                            <span>
                              {appliedCheckoutCoupon
                                ? `Assinar no Cartão (R$ ${appliedCheckoutCoupon.discountedPrice.toFixed(2).replace(".", ",")}/mês)`
                                : "Assinar no Cartão de Crédito"}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={billingLoading || pixLoading}
                            onClick={handleOpenPixModal}
                            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-60"
                          >
                            <QrCode className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                            <span>
                              {appliedCheckoutCoupon
                                ? `Pagar com Pix (R$ ${appliedCheckoutCoupon.discountedPrice.toFixed(2).replace(".", ",")})`
                                : "Pagar com Pix (Instantâneo)"}
                            </span>
                          </button>
                          {isAdmin ? (
                            <button
                              type="button"
                              disabled={billingLoading}
                              onClick={handleAdminSelfActivatePro}
                              className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 text-xs font-bold text-amber-200 hover:bg-amber-400/20 disabled:opacity-60"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                              <span>Ativar Pro como Super Admin</span>
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Influencer / Partner Coupon Card */}
              <div className="rounded-2xl border border-[#94C5FF]/16 bg-gradient-to-br from-[#0F1E33] via-[#0E1624] to-[#0A101D] p-5 shadow-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1E60CF]/25 text-[#38BDF8]">
                      <Gift className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-white">
                          Cupom de Parceiro ou Influenciador
                        </h3>
                        <span className="rounded-full border border-[#38BDF8]/30 bg-[#1E60CF]/20 px-2 py-0.5 text-[10px] font-bold text-[#38BDF8]">
                          PRO
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#9CB3CE]">
                        Recebeu um cupom de algum criador parceiro? Digite abaixo para resgatar dias de Plano Pro gratuitamente.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleRedeemCoupon} className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Ex: PARCEIRO30"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white placeholder:normal-case placeholder:font-normal placeholder:text-[#6A829F] focus:border-[#38BDF8] focus:outline-none sm:w-48"
                      maxLength={32}
                      disabled={couponLoading}
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponInput.trim()}
                      className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#1E60CF] px-4 text-xs font-bold text-white transition hover:bg-[#256EE8] disabled:opacity-50"
                    >
                      {couponLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          <span>Aplicando...</span>
                        </>
                      ) : (
                        <>
                          <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Aplicar</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {couponMessage ? (
                  <div
                    className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                      couponMessage.type === "ok"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/30 bg-red-500/10 text-red-300"
                    }`}
                  >
                    {couponMessage.type === "ok" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                    )}
                    <span>{couponMessage.text}</span>
                  </div>
                ) : null}
              </div>

              {/* Super Admin Access Card if isAdmin */}
              {isAdmin ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/20 text-amber-300">
                      <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-200">Painel Super Admin</h3>
                      <p className="text-xs text-[#9CB3CE]">
                        Gerencie todos os usuários, assinaturas e status do sistema.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/admin"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-amber-400 px-4 text-xs font-extrabold text-[#08101C] hover:bg-amber-300"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>Acessar Painel</span>
                  </Link>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        {/* Right: Live Phone Preview */}
        <aside
          aria-label="Preview em tempo real"
          className={`${
            mobilePreviewOpen ? "block" : "hidden lg:block"
          } lg:sticky lg:top-20 lg:self-start`}
        >
          {/* Mobile Top Bar when in Preview Mode */}
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/12 bg-[#0E1624] p-3 shadow-md lg:hidden">
            <button
              type="button"
              onClick={() => setMobilePreviewOpen(false)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-bold text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Voltar ao editor</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPublicUrl}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#38BDF8]/30 bg-[#38BDF8]/15 px-3 text-xs font-bold text-[#7DD3FC]"
              >
                {copiedUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedUrl ? "Copiado" : "Copiar"}</span>
              </button>

              <Link
                href={`/${profile.slug}`}
                target="_blank"
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl bg-[#1E60CF] px-3 text-xs font-bold text-white shadow hover:bg-[#256EE8]"
              >
                <span>Abrir</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="mb-2 hidden items-center justify-between px-1 text-xs font-bold uppercase tracking-wider text-[#9CB3CE] lg:flex">
            <span>Preview ao vivo</span>
            <span className="font-mono text-[#7DD3FC]">/{profile.slug}</span>
          </div>

          <div className="mx-auto max-w-[390px] rounded-[32px] border-[4px] border-[#1A263A] bg-[#04070D] p-1.5 shadow-[0_24px_64px_rgba(0,0,0,0.6)] sm:rounded-[36px] sm:border-[6px]">
            <div className="h-[680px] overflow-y-auto rounded-[26px] sm:rounded-[28px]">
              <PublicBioView profile={profile} items={items} previewMode />
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav
        aria-label="Navegação móvel inferior"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/12 bg-[#090F1C]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom,8px)] shadow-[0_-8px_30px_rgba(0,0,0,0.6)] lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-center justify-between px-3 py-1">
          {/* Tab 1: Links & Cupons */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("items");
              setMobilePreviewOpen(false);
            }}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition ${
              !mobilePreviewOpen && activeTab === "items"
                ? "text-[#38BDF8]"
                : "text-[#9CB3CE] hover:text-white"
            }`}
          >
            <Tag className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] font-bold">Links</span>
            {!mobilePreviewOpen && activeTab === "items" ? (
              <span className="h-1 w-4 rounded-full bg-[#38BDF8]" />
            ) : (
              <span className="h-1 w-4" />
            )}
          </button>

          {/* Tab 2: Aparência */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("appearance");
              setMobilePreviewOpen(false);
            }}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition ${
              !mobilePreviewOpen && activeTab === "appearance"
                ? "text-[#38BDF8]"
                : "text-[#9CB3CE] hover:text-white"
            }`}
          >
            <Palette className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] font-bold">Aparência</span>
            {!mobilePreviewOpen && activeTab === "appearance" ? (
              <span className="h-1 w-4 rounded-full bg-[#38BDF8]" />
            ) : (
              <span className="h-1 w-4" />
            )}
          </button>

          {/* Tab 3: Central Elevated Floating Rounded PREVIEW Button */}
          <div className="relative -mt-6 flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setMobilePreviewOpen((p) => !p)}
              aria-label={mobilePreviewOpen ? "Voltar ao editor da página" : "Abrir preview ao vivo no celular"}
              title={mobilePreviewOpen ? "Voltar ao editor" : "Ver preview ao vivo"}
              className={`group flex h-14 w-14 flex-col items-center justify-center rounded-full shadow-xl transition-all duration-200 active:scale-95 ${
                mobilePreviewOpen
                  ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-white ring-4 ring-[#090F1C] shadow-emerald-500/40"
                  : "bg-gradient-to-tr from-[#1E60CF] via-[#256EE8] to-[#38BDF8] text-white ring-4 ring-[#090F1C] shadow-[#1E60CF]/50"
              }`}
            >
              {mobilePreviewOpen ? (
                <>
                  <ArrowLeft className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Editor</span>
                </>
              ) : (
                <>
                  <Smartphone className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" aria-hidden="true" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Preview</span>
                </>
              )}
            </button>
          </div>

          {/* Tab 4: Métricas */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("analytics");
              setMobilePreviewOpen(false);
            }}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition ${
              !mobilePreviewOpen && activeTab === "analytics"
                ? "text-[#38BDF8]"
                : "text-[#9CB3CE] hover:text-white"
            }`}
          >
            <BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] font-bold">Métricas</span>
            {!mobilePreviewOpen && activeTab === "analytics" ? (
              <span className="h-1 w-4 rounded-full bg-[#38BDF8]" />
            ) : (
              <span className="h-1 w-4" />
            )}
          </button>

          {/* Tab 5: Perfil & Plano */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("profile");
              setMobilePreviewOpen(false);
            }}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition ${
              !mobilePreviewOpen && (activeTab === "profile" || activeTab === "plan")
                ? "text-[#38BDF8]"
                : "text-[#9CB3CE] hover:text-white"
            }`}
          >
            <User className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] font-bold">Perfil</span>
            {!mobilePreviewOpen && (activeTab === "profile" || activeTab === "plan") ? (
              <span className="h-1 w-4 rounded-full bg-[#38BDF8]" />
            ) : (
              <span className="h-1 w-4" />
            )}
          </button>
        </div>
      </nav>

      {/* Add / Edit Item Modal (<dialog>) */}
      <dialog
        ref={itemDialogRef}
        closedby="any"
        aria-labelledby="item-dialog-title"
        className="mc-dialog"
      >
        <form onSubmit={handleSaveItem} className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="item-dialog-title" className="text-lg font-extrabold">
              {itemForm.id ? "Editar item" : "Adicionar à sua página"}
            </h2>
            <button
              type="button"
              onClick={() => itemDialogRef.current?.close()}
              aria-label="Fechar janela"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-[#9CB3CE] hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-[#09101B] p-1">
            <button
              type="button"
              onClick={() => setItemForm((f) => ({ ...f, kind: "coupon" }))}
              className={`min-h-10 rounded-lg text-xs font-bold transition ${
                itemForm.kind === "coupon"
                  ? "bg-[#1E60CF] text-white"
                  : "text-[#9CB3CE] hover:text-white"
              }`}
            >
              Cupom
            </button>
            <button
              type="button"
              onClick={() => setItemForm((f) => ({ ...f, kind: "link" }))}
              className={`min-h-10 rounded-lg text-xs font-bold transition ${
                itemForm.kind === "link"
                  ? "bg-[#1E60CF] text-white"
                  : "text-[#9CB3CE] hover:text-white"
              }`}
            >
              Link Comum
            </button>
            <button
              type="button"
              onClick={() => setItemForm((f) => ({ ...f, kind: "divider" }))}
              className={`min-h-10 rounded-lg text-xs font-bold transition ${
                itemForm.kind === "divider"
                  ? "bg-[#1E60CF] text-white"
                  : "text-[#9CB3CE] hover:text-white"
              }`}
            >
              Divisória
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="item-title" className="mb-1 block text-sm font-semibold">
                {itemForm.kind === "coupon"
                  ? "Nome da marca *"
                  : itemForm.kind === "divider"
                    ? "Texto da divisória (opcional)"
                    : "Título do link *"}
              </label>
              <input
                id="item-title"
                type="text"
                required={itemForm.kind !== "divider"}
                autoFocus
                value={itemForm.title}
                onChange={(e) => setItemForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={
                  itemForm.kind === "coupon"
                    ? "Ex: Insider"
                    : itemForm.kind === "divider"
                      ? "Ex: Suplementos (ou deixe vazio só para espaçar)"
                      : "Ex: Meu YouTube"
                }
                className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
              />
            </div>

            {itemForm.kind === "coupon" ? (
              <div className="sm:col-span-2">
                <label htmlFor="item-coupon" className="mb-1 block text-sm font-semibold">
                  Código do cupom
                </label>
                <input
                  id="item-coupon"
                  type="text"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={itemForm.couponCode}
                  onChange={(e) =>
                    setItemForm((f) => ({ ...f, couponCode: e.target.value.toUpperCase() }))
                  }
                  placeholder="Ex: BEMVINDO10"
                  className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 font-mono font-bold text-[#38BDF8]"
                />
              </div>
            ) : null}

            {itemForm.kind !== "divider" ? (
              <>
                <div className="sm:col-span-2">
                  <label htmlFor="item-url" className="mb-1 block text-sm font-semibold">
                    Link oficial (URL) *
                  </label>
                  <input
                    id="item-url"
                    type="url"
                    required
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={itemForm.url}
                    onChange={(e) => setItemForm((f) => ({ ...f, url: e.target.value }))}
                    placeholder="https://..."
                    className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="item-tag" className="mb-1 block text-sm font-semibold">
                    Categoria / Tag
                  </label>
                  <input
                    id="item-tag"
                    type="text"
                    value={itemForm.tag}
                    onChange={(e) => setItemForm((f) => ({ ...f, tag: e.target.value }))}
                    placeholder="Ex: Nutrição, 15% OFF"
                    className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="item-cta" className="mb-1 block text-sm font-semibold">
                    Texto do botão
                  </label>
                  <input
                    id="item-cta"
                    type="text"
                    value={itemForm.ctaLabel}
                    onChange={(e) => setItemForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                    placeholder="Ex: Ir para a loja"
                    className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                  />
                </div>
              </>
            ) : null}

            <div className="sm:col-span-2">
              <label htmlFor="item-desc" className="mb-1 block text-sm font-semibold">
                {itemForm.kind === "divider" ? "Descrição (opcional)" : "Descrição curta"}
              </label>
              <input
                id="item-desc"
                type="text"
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder={
                  itemForm.kind === "divider"
                    ? "Ex: Descontos exclusivos para corrida e triathlon"
                    : "Ex: Roupas tecnológicas para treino e dia a dia"
                }
                className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
              />
            </div>

            {itemForm.kind !== "divider" ? (
              <>
                <div>
                  <label htmlFor="item-color" className="mb-1 block text-sm font-semibold">
                    Cor do card
                  </label>
                  <div className="flex min-h-[46px] items-center gap-2 rounded-xl border border-white/15 bg-[#09101B] px-3">
                    <input
                      id="item-color"
                      type="color"
                      value={itemForm.accentColor}
                      onChange={(e) =>
                        setItemForm((f) => ({ ...f, accentColor: e.target.value.toUpperCase() }))
                      }
                      className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="font-mono text-xs text-[#9CB3CE]">
                      {itemForm.accentColor}
                    </span>
                  </div>
                </div>

                <div className="flex items-end">
                  <label
                    style={{
                      borderColor: `${profile.accentColor}66`,
                      backgroundColor: `${profile.accentColor}1A`,
                      color: profile.accentColor,
                      accentColor: profile.accentColor,
                    }}
                    className="flex min-h-[46px] w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 text-sm font-semibold"
                  >
                    <input
                      type="checkbox"
                      checked={itemForm.isFeatured}
                      onChange={(e) =>
                        setItemForm((f) => ({ ...f, isFeatured: e.target.checked }))
                      }
                      className="h-4 w-4"
                    />
                    <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Link destaque</span>
                  </label>
                </div>

                {itemForm.isFeatured ? (
                  <div className="space-y-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-4 sm:col-span-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                      <Sparkles className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                      <span>Personalizar Destaque</span>
                    </div>

                    <div>
                      <label htmlFor="item-featured-label" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
                        Texto da Etiqueta de Destaque
                      </label>
                      <input
                        id="item-featured-label"
                        type="text"
                        maxLength={30}
                        value={itemForm.featuredLabel}
                        onChange={(e) =>
                          setItemForm((f) => ({ ...f, featuredLabel: e.target.value }))
                        }
                        placeholder="Ex: OFERTA RELÂMPAGO, TOP 1, EXCLUSIVO"
                        className="mc-input min-h-[44px] w-full rounded-xl border border-white/20 bg-[#09101B] px-3 text-sm font-semibold text-white placeholder-white/30"
                      />
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {FEATURED_LABEL_SUGGESTIONS.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setItemForm((f) => ({ ...f, featuredLabel: sug }))}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                              (itemForm.featuredLabel || "").toLowerCase() === sug.toLowerCase()
                                ? "bg-amber-400 text-black shadow-sm"
                                : "border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20"
                            }`}
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
                        Ícone do Destaque
                      </label>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {FEATURED_ICON_OPTIONS.map((opt) => {
                          const IconComp = opt.icon;
                          const isSelected = (itemForm.featuredIcon || "sparkles") === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setItemForm((f) => ({ ...f, featuredIcon: opt.key }))}
                              className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition ${
                                isSelected
                                  ? "border-amber-400 bg-amber-400 text-black shadow-md shadow-amber-400/20"
                                  : "border-white/10 bg-[#09101B] text-white/80 hover:border-white/25 hover:text-white"
                              }`}
                            >
                              <IconComp className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {itemForm.kind === "coupon" ? (
                  <div className="space-y-3 rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <Clock className="h-4 w-4 text-amber-400" aria-hidden="true" />
                        <span>Expiração com Contagem Regressiva</span>
                      </div>
                      {itemForm.expiresAt ? (
                        <button
                          type="button"
                          onClick={() => setItemForm((f) => ({ ...f, expiresAt: "" }))}
                          className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline"
                        >
                          Remover expiração
                        </button>
                      ) : null}
                    </div>
                    <p className="text-xs text-[#9CB3CE]">
                      Exibe um cronômetro ao vivo na sua página (&quot;Expira em 04:32:15&quot;) aumentando a urgência e conversão do cupom.
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 24 * 3600 * 1000);
                          setItemForm((f) => ({ ...f, expiresAt: toDateTimeLocalInput(d.toISOString()) }));
                        }}
                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10"
                      >
                        +24 horas
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 3 * 24 * 3600 * 1000);
                          setItemForm((f) => ({ ...f, expiresAt: toDateTimeLocalInput(d.toISOString()) }));
                        }}
                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10"
                      >
                        +3 dias
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 7 * 24 * 3600 * 1000);
                          setItemForm((f) => ({ ...f, expiresAt: toDateTimeLocalInput(d.toISOString()) }));
                        }}
                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10"
                      >
                        +7 dias
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0);
                          setItemForm((f) => ({ ...f, expiresAt: toDateTimeLocalInput(endOfMonth.toISOString()) }));
                        }}
                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10"
                      >
                        Fim do mês
                      </button>
                    </div>

                    <input
                      id="item-expires-at"
                      type="datetime-local"
                      value={itemForm.expiresAt}
                      onChange={(e) => setItemForm((f) => ({ ...f, expiresAt: e.target.value }))}
                      className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                    />
                  </div>
                ) : null}

                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="item-logo" className="mb-1 block text-sm font-semibold">
                    URL da logo (opcional — busca automática ativa)
                  </label>
                  <input
                    id="item-logo"
                    type="text"
                    autoCorrect="off"
                    autoCapitalize="none"
                    value={itemForm.logoUrl}
                    onChange={(e) => setItemForm((f) => ({ ...f, logoUrl: e.target.value }))}
                    placeholder="Deixe em branco para usar a logo automática do domínio"
                    className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                  />

                  {/* Pré-visualização ao vivo da Logo */}
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <BrandPreviewIcon
                      title={itemForm.title}
                      url={itemForm.url}
                      logoUrl={itemForm.logoUrl}
                      accentColor={itemForm.accentColor}
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-semibold text-white">Pré-visualização da logo</p>
                      <p className="truncate text-[#9CB3CE]">
                        {itemForm.logoUrl
                          ? "Usando URL direta da logo"
                          : itemForm.url || itemForm.title
                            ? "Detectada automaticamente pela marca ou domínio do link"
                            : "Preencha a URL ou nome acima para visualizar"}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => itemDialogRef.current?.close()}
              className="min-h-[44px] rounded-xl border border-white/15 px-4 text-sm font-semibold text-[#9CB3CE] hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingItem}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1E60CF] px-5 text-sm font-bold text-white hover:bg-[#256EE8] disabled:opacity-60"
            >
              {savingItem ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              <span>{itemForm.id ? "Salvar alterações" : "Adicionar"}</span>
            </button>
          </div>
        </form>
      </dialog>

      {/* Delete Confirmation Modal (<dialog>) */}
      <dialog
        ref={deleteDialogRef}
        closedby="any"
        aria-labelledby="delete-dialog-title"
        className="mc-dialog"
      >
        <div className="p-6">
          <h2 id="delete-dialog-title" className="text-lg font-extrabold text-white">
            Remover &quot;{deleteTarget?.title || "esta divisória"}&quot;?
          </h2>
          <p className="mt-2 text-sm text-[#9CB3CE]">
            Este item será removido da sua página pública e suas métricas individuais serão apagadas.
          </p>
          <div className="mt-6 flex justify-end gap-2.5">
            <button
              type="button"
              autoFocus
              onClick={() => deleteDialogRef.current?.close()}
              className="min-h-[44px] rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDeleteItem}
              className="min-h-[44px] rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-500"
            >
              Remover
            </button>
          </div>
        </div>
      </dialog>

      {/* Pix Payment Modal */}
      {pixModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pix-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl border border-emerald-400/30 bg-[#0E1624] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <h3 id="pix-modal-title" className="text-base font-extrabold text-white">
                    Pagar com Pix
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-300">
                    Ativação Instantânea • Plano Pro (30 dias)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPixModalOpen(false)}
                className="rounded-lg p-1 text-[#9CB3CE] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              {pixLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                  <p className="mt-3 text-sm font-bold text-white">Gerando cobrança Pix...</p>
                  <p className="mt-1 text-xs text-[#9CB3CE]">Aguarde alguns instantes</p>
                </div>
              ) : pixError ? (
                <div className="py-6 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-500/20 text-red-300">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-white">Não foi possível gerar o Pix</p>
                  <p className="mt-1 text-xs text-red-300">{pixError}</p>
                  <div className="mt-5 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPixModalOpen(false)}
                      className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-[#9CB3CE] hover:text-white"
                    >
                      Fechar
                    </button>
                    <button
                      type="button"
                      onClick={handleGeneratePix}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-black hover:bg-emerald-400"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              ) : pixStatus === "approved" ? (
                <div className="py-8 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-10 w-10 animate-bounce" />
                  </div>
                  <p className="mt-3 text-lg font-black text-white">Pagamento Confirmado!</p>
                  <p className="mt-1 text-xs text-emerald-300">
                    Seu Plano Pro foi ativado com sucesso por 30 dias. Redirecionando...
                  </p>
                </div>
              ) : pixData ? (
                <div className="space-y-4">
                  {/* Amount and Discount */}
                  <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-center">
                    <span className="text-xs font-semibold text-[#9CB3CE]">Valor a pagar</span>
                    <p className="mt-0.5 text-2xl font-black text-emerald-400">
                      R$ {pixData.amount.toFixed(2).replace(".", ",")}
                    </p>
                    {appliedCheckoutCoupon ? (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        Cupom &quot;{appliedCheckoutCoupon.code}&quot; (-{appliedCheckoutCoupon.discountPercent}%)
                      </span>
                    ) : null}
                  </div>

                  {/* QR Code image */}
                  {pixData.qrCodeBase64 ? (
                    <div className="flex flex-col items-center">
                      <div className="rounded-2xl bg-white p-3 shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                          alt="QR Code Pix"
                          className="h-48 w-48 object-contain"
                        />
                      </div>
                      <p className="mt-2 text-center text-[11px] text-[#9CB3CE]">
                        Abra o app do seu banco e aponte a câmera para o QR Code
                      </p>
                    </div>
                  ) : null}

                  {/* Copia e Cola */}
                  {pixData.qrCode ? (
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
                        Ou copie o código Pix Copia e Cola:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={pixData.qrCode}
                          className="min-h-[40px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 font-mono text-xs text-[#9CB3CE] select-all focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPixCode}
                          className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 text-xs font-extrabold text-black hover:bg-emerald-300"
                        >
                          {pixCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span>{pixCopied ? "Copiado!" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Status indicator */}
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#09101B] py-2.5 text-xs font-semibold text-amber-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                    <span>Aguardando pagamento... A ativação é automática</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal de Importação do Linktree */}
      <LinktreeImportModal
        isOpen={isLinktreeImportOpen}
        onClose={() => setIsLinktreeImportOpen(false)}
        onImportSuccess={({ profile: updatedProfile, items: updatedItems, importedCount }) => {
          setProfile(updatedProfile);
          setItems(updatedItems);
          setStatusBanner({
            type: "ok",
            text: `${importedCount} item(ns) importado(s) do Linktree com sucesso!`,
          });
          router.refresh();
        }}
        existingItemsCount={items.filter((it) => it.kind !== "divider").length}
        userIsPro={userIsPro}
      />
    </div>
  );
}
