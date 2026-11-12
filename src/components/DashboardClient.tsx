"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid,
  Link2,
  Loader2,
  Lock,
  LogOut,
  Minus,
  MousePointerClick,
  Palette,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Upload,
  User,
  X,
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
  QUICK_PALETTES,
  RADIUS_OPTIONS,
  RadiusStyle,
  sanitizeSlug,
  SocialDisplayStyle,
  THEME_PRESETS,
  ThemeMode,
  ThemePreset,
} from "@/types/meucupom";
import { PublicBioView } from "./PublicBioView";

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
};

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
}: {
  preset: ThemePreset;
  isProTheme: boolean;
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

      {/* Pro crown pill badge if exclusive */}
      {isProTheme ? (
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

  const [analyticsDays, setAnalyticsDays] = useState<7 | 30>(7);
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
    window.setTimeout(() => {
      setStatusBanner((prev) => (prev?.text === text ? null : prev));
    }, 3500);
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

  async function handleStartCheckout() {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        notify(
          "error",
          data.error || "Não foi possível iniciar o checkout do Mercado Pago."
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      notify("error", "Erro de conexão ao iniciar checkout.");
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
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Erro ao carregar foto de perfil."
      );
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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#1E60CF] to-[#38BDF8] text-xs font-black text-white shadow-md shadow-[#1E60CF]/20">
              MC
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold tracking-tight text-white sm:text-lg">meucupom</span>
              <span className="text-xs font-bold text-[#38BDF8]">.bio</span>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Commercial Public Link Pill */}
            <div className="flex items-center rounded-full border border-[#38BDF8]/30 bg-[#0E1624] py-1 pl-3 pr-1 text-xs">
              <span className="font-mono text-[#7DD3FC]">/{profile.slug}</span>
              <button
                type="button"
                onClick={handleCopyPublicUrl}
                aria-label="Copiar link público"
                title="Copiar link da sua página"
                className="ml-2 inline-flex h-7 items-center gap-1 rounded-full bg-[#38BDF8]/15 px-2.5 text-[11px] font-bold text-[#7DD3FC] transition hover:bg-[#38BDF8]/25"
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
                className="ml-1 inline-flex h-7 items-center rounded-full px-2 text-[#9CB3CE] transition hover:bg-white/10 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              aria-label="Sair da conta"
              title="Sair da conta"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs font-semibold text-[#9CB3CE] transition hover:border-white/25 hover:text-white disabled:opacity-60"
            >
              {signingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="hidden md:inline">{signingOut ? "Saindo..." : "Sair"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Status Toast / Alert */}
      {statusBanner ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 bottom-20 z-50 flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-2xl lg:bottom-4 ${
            statusBanner.type === "error"
              ? "border-red-400/50 bg-[#2A0F14] text-red-100"
              : "border-emerald-400/50 bg-[#0A241C] text-emerald-100"
          }`}
        >
          {statusBanner.type === "error" ? (
            <AlertTriangle className="h-4 w-4 text-red-300" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4 text-emerald-300" aria-hidden="true" />
          )}
          <span>{statusBanner.text}</span>
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

                <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:flex sm:flex-wrap">
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
                </div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#94C5FF]/25 bg-[#0E1624]/60 p-10 text-center">
                  <p className="font-bold text-white">Sua página ainda não tem itens</p>
                  <p className="mt-1 text-sm text-[#9CB3CE]">
                    Clique em &quot;Novo Cupom&quot; ou &quot;Novo Link&quot; acima para começar.
                  </p>
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

                              <span
                                className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-xs font-black shadow-inner"
                                style={{
                                  borderColor:
                                    item.kind === "divider"
                                      ? "rgba(148, 197, 255, 0.25)"
                                      : `${item.accentColor}66`,
                                  backgroundColor:
                                    item.kind === "divider"
                                      ? "rgba(255, 255, 255, 0.05)"
                                      : `${item.accentColor}22`,
                                }}
                              >
                                {item.kind === "divider" ? (
                                  <Minus className="h-4 w-4 text-[#9CB3CE]" aria-hidden="true" />
                                ) : (
                                  computeInitials(item.title)
                                )}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <h2 className="text-sm font-bold text-white sm:text-base">
                                    {item.kind === "divider"
                                      ? item.title || "Divisória (espaçamento)"
                                      : item.title}
                                  </h2>

                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                      item.kind === "coupon"
                                        ? "border border-[#38BDF8]/30 bg-[#38BDF8]/15 text-[#7DD3FC]"
                                        : item.kind === "divider"
                                          ? "border border-white/15 bg-white/10 text-[#CBD5E1]"
                                          : "border border-purple-500/30 bg-purple-500/15 text-purple-200"
                                    }`}
                                  >
                                    {item.kind === "coupon"
                                      ? "Cupom"
                                      : item.kind === "divider"
                                        ? "Divisória"
                                        : "Link"}
                                  </span>

                                  {item.kind !== "divider" && item.isFeatured ? (
                                    <span
                                      style={{
                                        backgroundColor: `${profile.accentColor}26`,
                                        color: profile.accentColor,
                                        borderColor: `${profile.accentColor}50`,
                                      }}
                                      className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold"
                                    >
                                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                                      <span>Destaque</span>
                                    </span>
                                  ) : null}

                                  {!item.isActive ? (
                                    <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                                      Oculto
                                    </span>
                                  ) : null}

                                  {item.tag ? (
                                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-[#9CB3CE]">
                                      {item.tag}
                                    </span>
                                  ) : null}
                                </div>

                                {item.kind === "coupon" && (
                                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                    {item.couponCode ? (
                                      <span className="inline-flex items-center gap-1 rounded-lg border border-[#38BDF8]/40 bg-[#38BDF8]/12 px-2.5 py-0.5 font-mono text-xs font-black text-[#38BDF8]">
                                        <Tag className="h-3 w-3" aria-hidden="true" />
                                        {item.couponCode}
                                      </span>
                                    ) : null}
                                    {item.url ? (
                                      <span className="max-w-[200px] truncate text-xs text-[#9CB3CE] sm:max-w-sm">
                                        {item.url}
                                      </span>
                                    ) : null}
                                  </div>
                                )}

                                {item.kind === "link" && item.url ? (
                                  <p className="mt-1 max-w-[240px] truncate text-xs text-[#9CB3CE] sm:max-w-md">
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
                        <ThemePresetPreviewIcon preset={preset} isProTheme={isProTheme} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="block truncate text-sm font-bold text-white">
                              {preset.name}
                            </span>
                            {isProTheme ? (
                              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-300">
                                <Crown className="h-2.5 w-2.5 fill-amber-300" aria-hidden="true" />
                                <span>PRO</span>
                              </span>
                            ) : (
                              <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                Grátis
                              </span>
                            )}
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

                {themeProNotice ? (
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
                  <div className="grid grid-cols-2 gap-2.5">
                    {(
                      [
                        { id: "classic", label: "Lista Clássica", desc: "Cards completos em 1 coluna" },
                        { id: "compact", label: "Compacto", desc: "Visual mais enxuto e rápido" },
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
                        <LayoutGrid className="mx-auto mb-1 h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
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
              {/* Metrics Summary */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CB3CE]">
                    <Eye className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
                    <span>Visitas</span>
                  </div>
                  <p className="mt-1.5 text-2xl font-extrabold">{profile.viewsCount}</p>
                </div>

                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CB3CE]">
                    <Copy className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
                    <span>Cópias</span>
                  </div>
                  <p className="mt-1.5 text-2xl font-extrabold">{totalCopies}</p>
                </div>

                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CB3CE]">
                    <MousePointerClick className="h-3.5 w-3.5 text-[#A78BFA]" aria-hidden="true" />
                    <span>Cliques</span>
                  </div>
                  <p className="mt-1.5 text-2xl font-extrabold">{totalClicks}</p>
                </div>

                <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CB3CE]">
                    <BarChart3 className="h-3.5 w-3.5 text-[#FB923C]" aria-hidden="true" />
                    <span>Engajamento</span>
                  </div>
                  <p className="mt-1.5 text-2xl font-extrabold">
                    {profile.viewsCount > 0
                      ? `${Math.round(((totalCopies + totalClicks) / profile.viewsCount) * 100)}%`
                      : "0%"}
                  </p>
                </div>
              </div>

              {/* Daily Analytics Chart (7 / 30 days) */}
              <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold">Evolução diária</h2>
                    <p className="text-xs text-[#9CB3CE]">
                      Visitas, cópias de cupom e cliques por dia
                    </p>
                  </div>
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
                        setAnalyticsDays(30);
                      }}
                      className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-3 text-xs font-bold transition ${
                        analyticsDays === 30
                          ? "bg-[#1E60CF] text-white"
                          : "text-[#9CB3CE] hover:text-white"
                      }`}
                    >
                      {!userIsPro ? <Lock className="h-3 w-3" aria-hidden="true" /> : null}
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
                  <p className="py-6 text-center text-xs text-[#9CB3CE]">
                    Carregando gráfico...
                  </p>
                ) : analyticsPoints.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#9CB3CE]">
                    Ainda não há eventos registrados neste período.
                  </p>
                ) : (
                  (() => {
                    const maxDaily = Math.max(
                      1,
                      ...analyticsPoints.map((pt) => pt.views + pt.copies + pt.clicks)
                    );
                    return (
                      <div>
                        <div className="flex h-36 items-end gap-1.5 overflow-x-auto pt-4">
                          {analyticsPoints.map((pt) => {
                            const total = pt.views + pt.copies + pt.clicks;
                            const pct = Math.max(6, Math.round((total / maxDaily) * 100));
                            return (
                              <div
                                key={pt.date}
                                className="group flex min-w-[20px] flex-1 flex-col items-center gap-1.5"
                                title={`${pt.date}: ${pt.views} visitas, ${pt.copies} cópias, ${pt.clicks} cliques`}
                              >
                                <div className="flex h-28 w-full items-end justify-center">
                                  <div
                                    className="w-full max-w-[22px] rounded-t-md bg-gradient-to-t from-[#1E60CF] to-[#38BDF8] transition-all group-hover:brightness-125"
                                    style={{ height: `${total === 0 ? 4 : pct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-[#9CB3CE]">
                                  {pt.date.slice(5)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 border-t border-white/10 pt-3 text-xs text-[#9CB3CE]">
                          <span>
                            Visitas no período:{" "}
                            <strong className="text-white">
                              {analyticsPoints.reduce((a, b) => a + b.views, 0)}
                            </strong>
                          </span>
                          <span>
                            Cópias no período:{" "}
                            <strong className="text-[#34D399]">
                              {analyticsPoints.reduce((a, b) => a + b.copies, 0)}
                            </strong>
                          </span>
                          <span>
                            Cliques no período:{" "}
                            <strong className="text-[#7DD3FC]">
                              {analyticsPoints.reduce((a, b) => a + b.clicks, 0)}
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
              {/* Plan & Subscription Card */}
              <div className="rounded-2xl border border-[#94C5FF]/16 bg-[#0E1624] p-5 sm:p-6">
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
                      <button
                        type="button"
                        disabled={billingLoading}
                        onClick={handleStartCheckout}
                        className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-extrabold text-[#08101C] shadow-lg hover:bg-amber-300 disabled:opacity-60"
                      >
                        {billingLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Crown className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span>Assinar Plano Pro</span>
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
                        <p className="mt-1 text-2xl font-black text-white">
                          {card.priceLabel}
                          <span className="text-xs font-semibold text-[#9CB3CE]">
                            {" "}
                            {card.periodLabel}
                          </span>
                        </p>
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
                        <button
                          type="button"
                          disabled={billingLoading}
                          onClick={handleStartCheckout}
                          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#1E60CF] px-4 text-sm font-bold text-white hover:bg-[#256EE8] disabled:opacity-60"
                        >
                          <Crown className="h-4 w-4" aria-hidden="true" />
                          <span>Assinar Plano Pro</span>
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

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
                        <label
                          htmlFor="prof-avatar-upload"
                          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-[#1E60CF] px-4 text-sm font-bold text-white transition hover:bg-[#256EE8] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#38BDF8]"
                        >
                          <Upload className="h-4 w-4" aria-hidden="true" />
                          <span>Carregar foto</span>
                          <input
                            id="prof-avatar-upload"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={handleAvatarFileChange}
                            className="visually-hidden"
                          />
                        </label>

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

                  <div className="sm:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        className={`flex items-center gap-3 text-sm font-semibold ${
                          userIsPro ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!userIsPro}
                          checked={userIsPro ? profile.showBranding : true}
                          onChange={(e) =>
                            setProfile((p) => ({ ...p, showBranding: e.target.checked }))
                          }
                          className="h-4 w-4 accent-[#38BDF8]"
                        />
                        <span>Exibir selo &quot;Feito com meucupom&quot; no rodapé</span>
                      </label>
                      {!userIsPro ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab("plan")}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-400/25"
                        >
                          <Lock className="h-3 w-3" aria-hidden="true" />
                          <span>Remover no Pro</span>
                        </button>
                      ) : null}
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

                <div className="sm:col-span-2">
                  <label htmlFor="item-logo" className="mb-1 block text-sm font-semibold">
                    URL da logo (opcional — busca automática pelo site)
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
    </div>
  );
}
