"use client";

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Flame,
  Flag,
  Gift,
  Link2,
  Moon,
  Percent,
  Share2,
  Sparkles,
  Star,
  Sun,
  Tag,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { InstagramIcon } from "@/components/InstagramIcon";
import { YouTubeIcon } from "@/components/YouTubeIcon";
import { BrandLogo } from "@/components/BrandLogo";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { getBrandIconCandidates } from "@/lib/brand-icons";
import {
  computeInitials,
  CreatorProfileData,
  FontStyle,
  isLightHex,
  isSafeHexColor,
  isSafeHttpUrl,
  isSafeMediaSrc,
  LinkItemData,
  pickReadableInk,
} from "@/types/meucupom";

function TikTokIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.26 8.26 0 0 0 4.84 1.55V6.97a4.85 4.85 0 0 1-1.08-.28Z" />
    </svg>
  );
}

interface PublicBioViewProps {
  profile: CreatorProfileData;
  items: LinkItemData[];
  previewMode?: boolean;
  fromLanding?: boolean;
}

const FONT_VARS: Record<FontStyle, string> = {
  jakarta: "var(--font-jakarta), system-ui, sans-serif",
  inter: "var(--font-inter), system-ui, sans-serif",
  space: "var(--font-space), system-ui, sans-serif",
  outfit: "var(--font-outfit), system-ui, sans-serif",
  poppins: "var(--font-poppins), system-ui, sans-serif",
  "dm-sans": "var(--font-dm-sans), system-ui, sans-serif",
  playfair: "var(--font-playfair), Georgia, serif",
  syne: "var(--font-syne), system-ui, sans-serif",
  montserrat: "var(--font-montserrat), system-ui, sans-serif",
  lora: "var(--font-lora), Georgia, serif",
};

function FeaturedBadgeIcon({
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

function CountdownBadge({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const target = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  if (isNaN(target)) return null;

  const diff = target - now;

  if (diff <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[0.6875rem] font-bold text-red-400">
        <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
        <span>Cupom Expirado</span>
      </span>
    );
  }

  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  // Mais de 24h: "⏱️ Expira em Xd Yh"
  if (days >= 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-amber-300">
        <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
        <span>Expira em {days}d {hours}h</span>
      </span>
    );
  }

  // Menos de 1h: Alta urgência com piscar sutil "⚡ Últimos MM:SS!"
  if (hours === 0) {
    const padM = String(minutes).padStart(2, "0");
    const padS = String(seconds).padStart(2, "0");
    return (
      <span className="inline-flex items-center gap-1 animate-pulse rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[0.6875rem] font-extrabold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
        <Zap className="h-2.5 w-2.5 shrink-0 fill-current" aria-hidden="true" />
        <span>Últimos {padM}:{padS}!</span>
      </span>
    );
  }

  // Entre 1h e 24h: Ticking em segundos "🔥 Expira em HH:MM:SS"
  const padH = String(hours).padStart(2, "0");
  const padM = String(minutes).padStart(2, "0");
  const padS = String(seconds).padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-0.5 text-[0.6875rem] font-bold text-amber-200">
      <Flame className="h-2.5 w-2.5 shrink-0 fill-current text-amber-400" aria-hidden="true" />
      <span>Expira em {padH}:{padM}:{padS}</span>
    </span>
  );
}

function BrandBadge({
  item,
  cardColor,
  textColor,
}: {
  item: LinkItemData;
  cardColor: string;
  textColor: string;
}) {
  const candidates = useMemo(() => {
    return getBrandIconCandidates(item.title, item.url, item.logoUrl);
  }, [item.title, item.url, item.logoUrl]);

  const [currentKey, setCurrentKey] = useState("");
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const candidateKey = candidates.join("|");
  if (candidateKey !== currentKey) {
    setCurrentKey(candidateKey);
    setCandidateIndex(0);
    setLoaded(false);
  }

  const currentSrc = candidates[candidateIndex];
  const initials = computeInitials(item.title);
  const showFallback = !currentSrc || !loaded;

  return (
    <span
      aria-hidden="true"
      className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[13px] border text-sm font-extrabold tracking-tight"
      style={{
        background: !showFallback
          ? "#FFFFFF"
          : `color-mix(in oklab, ${item.accentColor} 20%, ${cardColor})`,
        borderColor: !showFallback
          ? "rgba(148, 197, 255, 0.25)"
          : `color-mix(in oklab, ${item.accentColor} 45%, transparent)`,
        color: textColor,
        boxShadow: !showFallback ? "0 4px 12px rgba(2, 6, 14, 0.16)" : undefined,
      }}
    >
      {showFallback ? (
        <span>{item.kind === "link" ? <Link2 className="h-4 w-4" /> : initials}</span>
      ) : null}
      {currentSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentSrc}
          alt=""
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth <= 1) {
              setLoaded(false);
              setCandidateIndex((i) => i + 1);
            } else {
              setLoaded(true);
            }
          }}
          onError={() => {
            setLoaded(false);
            setCandidateIndex((i) => i + 1);
          }}
          className={`absolute inset-1.5 h-[calc(100%-12px)] w-[calc(100%-12px)] rounded-[7px] object-contain transition-opacity duration-150 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </span>
  );
}

async function copyTextWithFallback(text: string): Promise<boolean> {
  if (!text) return false;
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below for Instagram / iOS WebViews
    }
  }

  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.cssText =
    "position:fixed;inset-block-start:0;inset-inline-start:-9999px;opacity:0;font-size:16px";
  document.body.appendChild(textarea);

  let copied = false;
  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    textarea.remove();
  }
  return copied;
}

function subscribeColorScheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getColorSchemeSnapshot(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getColorSchemeServerSnapshot(): "dark" | "light" {
  return "dark";
}

export function PublicBioView({
  profile,
  items,
  previewMode = false,
  fromLanding = false,
}: PublicBioViewProps) {
  const isFromLanding = Boolean(fromLanding || profile.slug === "modelo");
  const [visitorOverride, setVisitorOverride] = useState<"dark" | "light" | null>(null);
  const systemScheme = useSyncExternalStore(
    subscribeColorScheme,
    getColorSchemeSnapshot,
    getColorSchemeServerSnapshot
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("Phishing ou golpe");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const reportDialogRef = useRef<HTMLDialogElement>(null);
  const lastAnnouncedRef = useRef("");
  const copyTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const trackedViewRef = useRef(false);

  useEffect(() => {
    if (previewMode || trackedViewRef.current) return;
    trackedViewRef.current = true;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: profile.slug, type: "view" }),
      keepalive: true,
    }).catch(() => {});
  }, [previewMode, profile.slug]);

  const effectiveScheme: "dark" | "light" =
    visitorOverride ??
    (profile.themeMode === "auto" ? systemScheme : profile.themeMode);

  const creatorBaseIsLight = isLightHex(profile.bgColor);
  const schemeMatchesCreator =
    (effectiveScheme === "light" && creatorBaseIsLight) ||
    (effectiveScheme === "dark" && !creatorBaseIsLight);

  const resolvedBg = schemeMatchesCreator
    ? profile.bgColor
    : effectiveScheme === "light"
      ? "#EEF4FB"
      : "#070C14";
  const resolvedCard = schemeMatchesCreator
    ? profile.cardColor
    : effectiveScheme === "light"
      ? "#FFFFFF"
      : "#0E1624";
  const resolvedText = schemeMatchesCreator
    ? profile.textColor
    : effectiveScheme === "light"
      ? "#0B172A"
      : "#F4F8FD";

  const mutedText =
    effectiveScheme === "light"
      ? `color-mix(in oklab, ${resolvedText} 68%, ${resolvedBg})`
      : `color-mix(in oklab, ${resolvedText} 66%, ${resolvedBg})`;
  const borderSubtle = `color-mix(in oklab, ${profile.accentColor} 22%, ${
    effectiveScheme === "light" ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.12)"
  })`;
  const borderStrong = `color-mix(in oklab, ${profile.accentColor} 45%, transparent)`;
  const pillBg = `color-mix(in oklab, ${profile.accentColor} 12%, transparent)`;
  const couponBg = `color-mix(in oklab, ${resolvedBg} 55%, ${resolvedCard})`;
  const ctaInk = pickReadableInk(profile.ctaColor);
  const titleFontFamily = FONT_VARS[profile.titleFontStyle || profile.fontStyle];
  const nameFontFamily =
    FONT_VARS[profile.nameFontStyle || profile.titleFontStyle || profile.fontStyle];
  const featuredAnimationClass =
    profile.featuredAnimation && profile.featuredAnimation !== "none"
      ? `mc-featured-${profile.featuredAnimation}`
      : "";

  const [cardRadius, controlRadius] = useMemo(() => {
    switch (profile.radiusStyle) {
      case "pill":
        return ["26px", "999px"];
      case "extra":
        return ["30px", "18px"];
      case "soft":
        return ["14px", "10px"];
      case "sharp":
        return ["8px", "6px"];
      default:
        return ["20px", "13px"];
    }
  }, [profile.radiusStyle]);

  const backgroundDesign = useMemo(() => {
    const safeAccent = isSafeHexColor(profile.accentColor)
      ? profile.accentColor
      : "#38BDF8";
    const safeCta = isSafeHexColor(profile.ctaColor) ? profile.ctaColor : "#1E60CF";
    const topGlow = `radial-gradient(circle at 50% -6%, color-mix(in oklab, ${safeCta} 30%, transparent), transparent 52%)`;
    const svgUrl = (svg: string) =>
      `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

    switch (profile.bgStyle) {
      case "solid":
        return { backgroundImage: "none", backgroundSize: undefined };
      case "gradient":
        return {
          backgroundImage: `linear-gradient(160deg, color-mix(in oklab, ${profile.ctaColor} 28%, ${resolvedBg}) 0%, ${resolvedBg} 52%, color-mix(in oklab, ${profile.accentColor} 18%, ${resolvedBg}) 100%)`,
          backgroundSize: undefined,
        };
      case "mesh":
        return {
          backgroundImage: `radial-gradient(circle at 18% 12%, color-mix(in oklab, ${profile.accentColor} 26%, transparent), transparent 44%), radial-gradient(circle at 86% 24%, color-mix(in oklab, ${profile.ctaColor} 28%, transparent), transparent 46%), radial-gradient(circle at 48% 90%, color-mix(in oklab, ${profile.accentColor} 16%, transparent), transparent 48%)`,
          backgroundSize: undefined,
        };
      case "aurora":
        return {
          backgroundImage: `radial-gradient(ellipse 90% 55% at 15% -5%, color-mix(in oklab, ${profile.accentColor} 32%, transparent), transparent 60%), radial-gradient(ellipse 80% 50% at 88% 12%, color-mix(in oklab, ${profile.ctaColor} 30%, transparent), transparent 58%), linear-gradient(180deg, color-mix(in oklab, ${profile.ctaColor} 10%, ${resolvedBg}) 0%, ${resolvedBg} 65%)`,
          backgroundSize: undefined,
        };
      case "spotlight":
        return {
          backgroundImage: `radial-gradient(circle at 50% 0%, color-mix(in oklab, ${profile.accentColor} 38%, transparent) 0%, color-mix(in oklab, ${profile.ctaColor} 16%, transparent) 30%, transparent 62%)`,
          backgroundSize: undefined,
        };
      case "dots":
        return {
          backgroundImage: `radial-gradient(circle at 50% -6%, color-mix(in oklab, ${profile.ctaColor} 28%, transparent), transparent 45%), radial-gradient(color-mix(in oklab, ${profile.accentColor} 24%, transparent) 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 20px 20px",
        };
      case "waves":
        return {
          backgroundImage: `${topGlow}, ${svgUrl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="28" viewBox="0 0 80 28"><path d="M0 14 Q20 2 40 14 T80 14" fill="none" stroke="${safeAccent}" stroke-opacity="0.22" stroke-width="1.6"/></svg>`
          )}`,
          backgroundSize: "100% 100%, 80px 28px",
        };
      case "zigzag":
        return {
          backgroundImage: `${topGlow}, ${svgUrl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" viewBox="0 0 40 24"><path d="M0 18 L20 6 L40 18" fill="none" stroke="${safeAccent}" stroke-opacity="0.22" stroke-width="1.6" stroke-linecap="square"/></svg>`
          )}`,
          backgroundSize: "100% 100%, 40px 24px",
        };
      case "scallop":
        return {
          backgroundImage: `${topGlow}, ${svgUrl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="24" viewBox="0 0 48 24"><path d="M0 24 A24 24 0 0 1 48 24 M-24 12 A24 24 0 0 1 24 12 M24 12 A24 24 0 0 1 72 12" fill="none" stroke="${safeAccent}" stroke-opacity="0.2" stroke-width="1.4"/></svg>`
          )}`,
          backgroundSize: "100% 100%, 48px 24px",
        };
      case "topo":
        return {
          backgroundImage: `${topGlow}, ${svgUrl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><path d="M0 32 C30 12 75 52 120 32 M0 88 C40 68 80 108 120 88 M28 60 C28 42 55 34 72 48 C88 62 82 82 58 84 C36 86 28 74 28 60 Z" fill="none" stroke="${safeAccent}" stroke-opacity="0.18" stroke-width="1.4"/></svg>`
          )}`,
          backgroundSize: "100% 100%, 120px 120px",
        };
      case "hexagons":
        return {
          backgroundImage: `${topGlow}, ${svgUrl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="48" viewBox="0 0 56 48"><path d="M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z M42 24 L56 32 L56 48 M42 24 L28 32 L28 48 M42 0 L42 24" fill="none" stroke="${safeAccent}" stroke-opacity="0.18" stroke-width="1.2"/></svg>`
          )}`,
          backgroundSize: "100% 100%, 56px 48px",
        };
      case "diamonds":
        return {
          backgroundImage: `${topGlow}, ${svgUrl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><path d="M18 0 L36 18 L18 36 L0 18 Z" fill="none" stroke="${safeAccent}" stroke-opacity="0.2" stroke-width="1.2"/></svg>`
          )}`,
          backgroundSize: "100% 100%, 36px 36px",
        };
      case "crosses":
        return {
          backgroundImage: `${topGlow}, ${svgUrl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 11 V21 M11 16 H21" fill="none" stroke="${safeAccent}" stroke-opacity="0.24" stroke-width="1.6" stroke-linecap="round"/></svg>`
          )}`,
          backgroundSize: "100% 100%, 32px 32px",
        };
      case "confetti":
        return {
          backgroundImage: `${topGlow}, ${svgUrl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84"><circle cx="16" cy="18" r="2.2" fill="${safeAccent}" fill-opacity="0.28"/><rect x="52" y="14" width="9" height="3" rx="1.5" transform="rotate(28 56 15)" fill="${safeCta}" fill-opacity="0.32"/><polygon points="24,62 29,53 34,62" fill="none" stroke="${safeAccent}" stroke-opacity="0.26" stroke-width="1.4"/><circle cx="64" cy="60" r="3.4" fill="none" stroke="${safeCta}" stroke-opacity="0.28" stroke-width="1.4"/><rect x="10" y="42" width="7" height="2.6" rx="1.3" transform="rotate(-32 13 43)" fill="${safeAccent}" fill-opacity="0.24"/></svg>`
          )}`,
          backgroundSize: "100% 100%, 84px 84px",
        };
      case "grid-lines":
        return {
          backgroundImage: `radial-gradient(circle at 50% 0%, color-mix(in oklab, ${profile.accentColor} 24%, transparent), transparent 52%), linear-gradient(to right, color-mix(in oklab, ${profile.accentColor} 10%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, ${profile.accentColor} 10%, transparent) 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 28px 28px, 28px 28px",
        };
      case "sunset":
        return {
          backgroundImage: `linear-gradient(180deg, color-mix(in oklab, ${profile.accentColor} 32%, ${resolvedBg}) 0%, color-mix(in oklab, ${profile.ctaColor} 24%, ${resolvedBg}) 42%, ${resolvedBg} 100%)`,
          backgroundSize: undefined,
        };
      case "duotone":
        return {
          backgroundImage: `linear-gradient(125deg, color-mix(in oklab, ${profile.ctaColor} 28%, ${resolvedBg}) 0%, ${resolvedBg} 48%, color-mix(in oklab, ${profile.accentColor} 24%, ${resolvedBg}) 100%)`,
          backgroundSize: undefined,
        };
      case "orb":
        return {
          backgroundImage: `radial-gradient(circle at 12% 28%, color-mix(in oklab, ${profile.accentColor} 32%, transparent) 0%, transparent 40%), radial-gradient(circle at 90% 72%, color-mix(in oklab, ${profile.ctaColor} 34%, transparent) 0%, transparent 42%)`,
          backgroundSize: undefined,
        };
      default:
        // "glow"
        return {
          backgroundImage: `radial-gradient(circle at 50% -6%, color-mix(in oklab, ${profile.ctaColor} 36%, transparent), transparent 48%), radial-gradient(circle at 78% 18%, color-mix(in oklab, ${profile.accentColor} 16%, transparent), transparent 40%), radial-gradient(circle at 18% 62%, color-mix(in oklab, ${profile.ctaColor} 12%, transparent), transparent 45%)`,
          backgroundSize: undefined,
        };
    }
  }, [profile.bgStyle, profile.accentColor, profile.ctaColor, resolvedBg]);

  const activeItems = useMemo(() => items.filter((item) => item.isActive), [items]);

  function announce(msg: string) {
    let next = msg;
    if (next === lastAnnouncedRef.current) {
      next += "\u00A0";
    }
    lastAnnouncedRef.current = next;
    setLiveStatus(next);
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    announce(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
      setLiveStatus("");
    }, 2400);
  }

  async function handleCopyCoupon(item: LinkItemData) {
    const code = item.couponCode.trim();
    if (!code) return;
    const ok = await copyTextWithFallback(code);
    if (ok) {
      setCopiedId(item.id);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 2200);
      showToast(`Cupom ${code} (${item.title}) copiado!`);
    } else {
      showToast(`Use o cupom ${code} no checkout`);
    }

    if (!previewMode) {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: profile.slug, type: "copy", itemId: item.id }),
        keepalive: true,
      }).catch(() => {});
    }
  }

  function handleLinkClick(item: LinkItemData) {
    if (previewMode) return;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: profile.slug, type: "click", itemId: item.id }),
      keepalive: true,
    }).catch(() => {});
  }

  async function handleShare() {
    const shareUrl =
      typeof window !== "undefined"
        ? previewMode
          ? `${window.location.origin}/${profile.slug}`
          : window.location.href
        : `/${profile.slug}`;
    const shareData = {
      title: `${profile.displayName} · Links e Cupons`,
      text: profile.instagramHandle
        ? `Links e cupons de parceiros do ${profile.instagramHandle}`
        : `Links e cupons de ${profile.displayName}`,
      url: shareUrl,
    };

    if (!previewMode && typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    const copied = await copyTextWithFallback(shareUrl);
    showToast(copied ? "Link da página copiado!" : "Copie a URL da barra de endereço");
  }

  const cardSurfaceStyle = (accent: string, isFeatured: boolean): React.CSSProperties => {
    // Featured cards follow the chosen theme's accentColor & ctaColor directly.
    const themeAccent = profile.accentColor;
    const borderColor = isFeatured
      ? themeAccent
      : `color-mix(in oklab, ${accent} 24%, ${borderSubtle})`;
    const baseShadow =
      effectiveScheme === "light"
        ? "0 8px 24px rgba(15, 23, 42, 0.07)"
        : "0 12px 32px rgba(2, 6, 14, 0.42)";

    const featuredBg = `linear-gradient(155deg, color-mix(in oklab, ${themeAccent} 16%, ${resolvedCard}) 0%, color-mix(in oklab, ${profile.ctaColor} 10%, ${resolvedCard}) 100%)`;

    const hasFeaturedAnim = isFeatured && (profile.featuredAnimation || "shimmer") !== "none";
    const resolvedShadow = hasFeaturedAnim ? undefined : baseShadow;

    const styleWithVar = (s: React.CSSProperties): React.CSSProperties =>
      isFeatured
        ? ({
            ...s,
            "--mc-featured-accent": themeAccent,
            "--mc-featured-cta": profile.ctaColor,
          } as React.CSSProperties)
        : s;

    switch (profile.cardStyle) {
      case "glass":
        return styleWithVar({
          borderRadius: cardRadius,
          background: isFeatured
            ? `color-mix(in oklab, ${themeAccent} 16%, color-mix(in oklab, ${resolvedCard} 76%, transparent))`
            : `color-mix(in oklab, ${resolvedCard} 72%, transparent)`,
          backdropFilter: "blur(14px)",
          border: `${isFeatured ? "1.5px" : "1px"} solid ${borderColor}`,
          boxShadow: resolvedShadow,
        });
      case "outline":
        return styleWithVar({
          borderRadius: cardRadius,
          background: isFeatured
            ? `color-mix(in oklab, ${themeAccent} 10%, transparent)`
            : "transparent",
          border: `${isFeatured ? "2px" : "1.5px"} solid ${
            isFeatured ? themeAccent : `color-mix(in oklab, ${accent} 38%, ${borderSubtle})`
          }`,
        });
      case "brutal":
        return styleWithVar({
          borderRadius: cardRadius,
          background: isFeatured ? featuredBg : resolvedCard,
          border: `2px solid ${isFeatured ? themeAccent : `color-mix(in oklab, ${themeAccent} 65%, ${resolvedText})`}`,
          boxShadow: hasFeaturedAnim
            ? undefined
            : `4px 4px 0 0 ${isFeatured ? profile.ctaColor : `color-mix(in oklab, ${themeAccent} 75%, transparent)`}`,
        });
      case "top-accent":
        return styleWithVar({
          borderRadius: cardRadius,
          background: isFeatured ? featuredBg : resolvedCard,
          border: `1px solid ${borderColor}`,
          borderTop: `4px solid ${isFeatured ? themeAccent : accent}`,
          boxShadow: resolvedShadow,
        });
      case "left-accent":
        return styleWithVar({
          borderRadius: cardRadius,
          background: isFeatured ? featuredBg : resolvedCard,
          border: `1px solid ${borderColor}`,
          borderLeft: `4px solid ${isFeatured ? themeAccent : accent}`,
          boxShadow: resolvedShadow,
        });
      case "elevated":
        return styleWithVar({
          borderRadius: cardRadius,
          background: isFeatured ? featuredBg : resolvedCard,
          border: `1px solid ${isFeatured ? themeAccent : "transparent"}`,
          boxShadow: hasFeaturedAnim
            ? undefined
            : effectiveScheme === "light"
              ? "0 16px 38px rgba(15, 23, 42, 0.12)"
              : "0 18px 42px rgba(0, 0, 0, 0.58)",
        });
      case "dashed":
        return styleWithVar({
          borderRadius: cardRadius,
          background: isFeatured ? featuredBg : resolvedCard,
          border: `1.5px dashed ${isFeatured ? themeAccent : `color-mix(in oklab, ${themeAccent} 55%, ${borderSubtle})`}`,
          boxShadow: resolvedShadow,
        });
      default:
        // "solid"
        return styleWithVar({
          borderRadius: cardRadius,
          background: isFeatured ? featuredBg : resolvedCard,
          border: `${isFeatured ? "1.5px" : "1px"} solid ${borderColor}`,
          boxShadow: resolvedShadow,
        });
    }
  };

  const avatarFailed = failedAvatarUrl === profile.avatarUrl;
  const hasValidAvatar = isSafeMediaSrc(profile.avatarUrl) && !avatarFailed;
  const igHref = isSafeHttpUrl(profile.instagramUrl)
    ? profile.instagramUrl
    : profile.instagramHandle
      ? `https://instagram.com/${profile.instagramHandle.replace(/^@+/, "")}`
      : "";
  const ttHref = isSafeHttpUrl(profile.tiktokUrl)
    ? profile.tiktokUrl
    : profile.tiktokHandle
      ? `https://www.tiktok.com/@${profile.tiktokHandle.replace(/^@+/, "")}`
      : "";
  const ytHref = isSafeHttpUrl(profile.youtubeUrl)
    ? profile.youtubeUrl
    : profile.youtubeHandle
      ? profile.youtubeHandle.startsWith("http")
        ? profile.youtubeHandle
        : profile.youtubeHandle.startsWith("@")
          ? `https://www.youtube.com/${profile.youtubeHandle}`
          : `https://www.youtube.com/@${profile.youtubeHandle}`
      : "";

  const isVerifiedCreator = Boolean(
    profile.isVerified ||
    profile.plan === "pro" ||
    profile.subscriptionStatus === "active" ||
    profile.subscriptionStatus === "permuta"
  );

  const listGridClass =
    profile.layout === "compact" ? "flex flex-col gap-2.5" : "flex flex-col gap-3.5";

  return (
    <div
      data-theme={effectiveScheme}
      style={{
        backgroundColor: resolvedBg,
        backgroundImage: backgroundDesign.backgroundImage,
        backgroundSize: backgroundDesign.backgroundSize,
        color: resolvedText,
        fontFamily: FONT_VARS[profile.fontStyle],
        colorScheme: effectiveScheme,
      }}
      className={`relative w-full overflow-x-hidden transition-colors duration-200 ${
        previewMode ? "min-h-full rounded-[28px]" : "min-h-dvh"
      }`}
    >
      <div className="mx-auto w-full max-w-[520px] px-4 pt-5 pb-10">
        {/* Top bar */}
        <nav
          aria-label="Ações da página"
          className="mb-6 flex items-center justify-end gap-2"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Compartilhar página"
              title="Compartilhar página"
              style={{
                background: pillBg,
                borderColor: borderSubtle,
                color: resolvedText,
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-transform active:scale-95"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
            </button>

            {profile.allowThemeToggle ? (
              <button
                type="button"
                onClick={() =>
                  setVisitorOverride(effectiveScheme === "dark" ? "light" : "dark")
                }
                aria-label={
                  effectiveScheme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
                }
                title="Alternar tema"
                style={{
                  background: pillBg,
                  borderColor: borderSubtle,
                  color: resolvedText,
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-transform active:scale-95"
              >
                {effectiveScheme === "dark" ? (
                  <Sun className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            ) : null}
          </div>
        </nav>

        {/* Hero */}
        <header className="mb-7 flex flex-col items-center gap-3.5 text-center">
          <div className="relative">
            <div
              style={{
                background: `linear-gradient(145deg, ${profile.ctaColor}, ${profile.accentColor})`,
                borderColor: profile.accentColor,
                boxShadow: `0 0 0 5px color-mix(in oklab, ${profile.accentColor} 22%, transparent), 0 14px 32px rgba(2, 6, 14, 0.35)`,
              }}
              className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border-[2.5px]"
            >
              {hasValidAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={`Foto de ${profile.displayName}`}
                  onError={() => setFailedAvatarUrl(profile.avatarUrl)}
                  className="h-full w-full object-cover object-[center_20%]"
                />
              ) : (
                <span
                  style={{ fontFamily: nameFontFamily }}
                  className="text-2xl font-extrabold tracking-tight text-white"
                >
                  {computeInitials(profile.displayName)}
                </span>
              )}
            </div>
            {/* Verified Tick Badge on Avatar (Pro, Permuta or Manually Verified by Admin) */}
            {isVerifiedCreator ? (
              <div
                className="absolute -bottom-1 -right-1 flex items-center justify-center drop-shadow-md"
                title="Perfil verificado meucupom"
              >
                <VerifiedBadge className="h-7 w-7" badgeColor="#1E60CF" tickColor="#FFFFFF" ringColor="#070C14" />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <h1
              style={{ fontFamily: nameFontFamily }}
              className="text-[clamp(1.45rem,4.5vw,1.8rem)] font-extrabold leading-tight tracking-tight"
            >
              {profile.displayName}
            </h1>
            {profile.bio ? (
              <p
                style={{ color: mutedText }}
                className="mx-auto max-w-[38ch] text-[0.9375rem] leading-snug"
              >
                {profile.bio}
              </p>
            ) : null}
          </div>

          {/* Social Links under bio text */}
          {(() => {
            const hasIg = Boolean(profile.instagramHandle || igHref);
            const hasTt = Boolean(profile.tiktokHandle || ttHref);
            const hasYt = Boolean(profile.youtubeHandle || ytHref);
            if (!hasIg && !hasTt && !hasYt) return null;

            const socialMode = profile.socialDisplayStyle || "both";
            const showIcon = socialMode !== "text";
            const showText = socialMode !== "icon";
            const igText = profile.instagramHandle || "Instagram";
            const ttText = profile.tiktokHandle || "TikTok";
            const ytText = profile.youtubeHandle || "YouTube";
            const iconOnlyClass =
              "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-transform hover:scale-105 active:scale-95 shadow-sm";
            const pillClass =
              "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-transform hover:scale-105 active:scale-[0.98] shadow-sm";

            return (
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                {hasIg ? (
                  igHref ? (
                    <a
                      href={igHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={!showText ? `Instagram ${igText}` : undefined}
                      title={!showText ? `Instagram ${igText}` : undefined}
                      style={{
                        background: pillBg,
                        borderColor: borderSubtle,
                        color: resolvedText,
                      }}
                      className={showText ? pillClass : iconOnlyClass}
                    >
                      {showIcon ? <InstagramIcon className="h-4 w-4 shrink-0" /> : null}
                      {showText ? <span className="max-w-[160px] truncate">{igText}</span> : null}
                    </a>
                  ) : (
                    <span
                      aria-label={!showText ? `Instagram ${igText}` : undefined}
                      title={!showText ? `Instagram ${igText}` : undefined}
                      style={{ background: pillBg, borderColor: borderSubtle }}
                      className={showText ? pillClass : iconOnlyClass}
                    >
                      {showIcon ? <InstagramIcon className="h-4 w-4 shrink-0" /> : null}
                      {showText ? <span className="max-w-[160px] truncate">{igText}</span> : null}
                    </span>
                  )
                ) : null}

                {hasTt ? (
                  <a
                    href={
                      ttHref ||
                      `https://www.tiktok.com/@${profile.tiktokHandle.replace(/^@+/, "")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={!showText ? `TikTok ${ttText}` : undefined}
                    title={!showText ? `TikTok ${ttText}` : undefined}
                    style={{
                      background: pillBg,
                      borderColor: borderSubtle,
                      color: resolvedText,
                    }}
                    className={showText ? pillClass : iconOnlyClass}
                  >
                    {showIcon ? <TikTokIcon className="h-4 w-4 shrink-0" /> : null}
                    {showText ? <span className="max-w-[150px] truncate">{ttText}</span> : null}
                  </a>
                ) : null}

                {hasYt ? (
                  <a
                    href={
                      ytHref ||
                      (profile.youtubeHandle
                        ? profile.youtubeHandle.startsWith("http")
                          ? profile.youtubeHandle
                          : `https://www.youtube.com/@${profile.youtubeHandle.replace(/^@+/, "")}`
                        : "https://www.youtube.com")
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={!showText ? `YouTube ${ytText}` : undefined}
                    title={!showText ? `YouTube ${ytText}` : undefined}
                    style={{
                      background: pillBg,
                      borderColor: borderSubtle,
                      color: resolvedText,
                    }}
                    className={showText ? pillClass : iconOnlyClass}
                  >
                    {showIcon ? (
                      <YouTubeIcon className="h-4 w-4 shrink-0 text-red-500" />
                    ) : null}
                    {showText ? <span className="max-w-[150px] truncate">{ytText}</span> : null}
                  </a>
                ) : null}
              </div>
            );
          })()}
        </header>

        {/* Partners & Links */}
        <main>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2
              style={{ color: mutedText, fontFamily: titleFontFamily }}
              className="text-xs font-bold uppercase tracking-[0.08em]"
            >
              {profile.sectionTitle || "Parceiros & Cupons"}
            </h2>
            <span style={{ color: profile.accentColor }} className="text-xs font-semibold">
              {(() => {
                const count = activeItems.filter((i) => i.kind !== "divider").length;
                return count === 1 ? "1 item" : `${count} itens`;
              })()}
            </span>
          </div>

          {profile.helperTip ? (
            <p
              style={{ color: mutedText }}
              className="mb-4 inline-flex items-center gap-1.5 text-[0.84375rem]"
            >
              <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{profile.helperTip}</span>
            </p>
          ) : null}

          {activeItems.length === 0 ? (
            <div
              style={cardSurfaceStyle(profile.accentColor, false)}
              className="p-6 text-center text-sm"
            >
              <p style={{ color: mutedText }}>Nenhum link ou cupom publicado ainda.</p>
            </div>
          ) : (
            <ul className={listGridClass}>
              {activeItems.map((item) => {
                if (item.kind === "divider") {
                  const hasText = Boolean(item.title.trim() || item.description.trim());
                  if (!hasText) {
                    return (
                      <li key={item.id} aria-hidden="true" className="py-3">
                        <div
                          style={{
                            background: `linear-gradient(90deg, transparent, ${borderSubtle}, transparent)`,
                          }}
                          className="h-px w-full"
                        />
                      </li>
                    );
                  }
                  return (
                    <li key={item.id} className="pt-4 pb-1">
                      <div className="flex items-center gap-3">
                        <span
                          style={{ background: borderSubtle }}
                          className="h-px flex-1"
                          aria-hidden="true"
                        />
                        {item.title.trim() ? (
                          <h3
                            style={{ fontFamily: titleFontFamily, color: resolvedText }}
                            className="text-center text-xs font-extrabold uppercase tracking-[0.09em]"
                          >
                            {item.title}
                          </h3>
                        ) : null}
                        <span
                          style={{ background: borderSubtle }}
                          className="h-px flex-1"
                          aria-hidden="true"
                        />
                      </div>
                      {item.description.trim() ? (
                        <p
                          style={{ color: mutedText }}
                          className="mt-1 text-center text-xs leading-snug"
                        >
                          {item.description}
                        </p>
                      ) : null}
                    </li>
                  );
                }

                const isCopied = copiedId === item.id;
                const itemAccent = item.isFeatured
                  ? profile.accentColor
                  : item.accentColor || profile.accentColor;
                const featuredBadgeBg = `linear-gradient(135deg, ${profile.ctaColor}, ${profile.accentColor})`;
                const featuredBadgeInk = pickReadableInk(profile.ctaColor);

                if (profile.layout === "compact") {
                  return (
                    <li
                      key={item.id}
                      style={cardSurfaceStyle(itemAccent, item.isFeatured)}
                      className={`flex flex-col gap-2.5 p-3.5 ${
                        item.isFeatured
                          ? featuredAnimationClass
                          : "transition-transform duration-150 hover:-translate-y-0.5"
                      }`}
                    >
                      {item.isFeatured || item.expiresAt ? (
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          {item.isFeatured ? (
                            <span
                              style={{ background: featuredBadgeBg, color: featuredBadgeInk }}
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-extrabold uppercase tracking-wider shadow-sm"
                            >
                              <FeaturedBadgeIcon iconKey={item.featuredIcon} className="h-3 w-3" />
                              <span>{item.featuredLabel || "Destaque"}</span>
                            </span>
                          ) : <span />}

                          {item.expiresAt ? (
                            <CountdownBadge expiresAt={item.expiresAt} />
                          ) : null}
                        </div>
                      ) : null}

                      {/* Compact layout intentionally omits category tag and description */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <BrandBadge
                            key={`${item.logoUrl}|${item.url}`}
                            item={item}
                            cardColor={resolvedCard}
                            textColor={resolvedText}
                          />
                          <h3
                            style={{ fontFamily: titleFontFamily }}
                            className="min-w-0 flex-1 truncate text-[0.96875rem] font-bold tracking-tight"
                          >
                            {item.title}
                          </h3>
                        </div>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleLinkClick(item)}
                          aria-label={item.ctaLabel || `Acessar ${item.title}`}
                          style={{
                            background: profile.ctaColor,
                            color: ctaInk,
                            borderRadius: controlRadius,
                          }}
                          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 px-3 text-xs font-bold whitespace-nowrap shadow-sm transition-opacity hover:opacity-95"
                        >
                          <span>Acessar</span>
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>

                      {item.kind === "coupon" && item.couponCode ? (
                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(item)}
                          aria-label={`Copiar cupom ${item.couponCode} da ${item.title}`}
                          style={{
                            background: isCopied
                              ? "rgba(52, 211, 153, 0.14)"
                              : couponBg,
                            borderColor: isCopied ? "#34D399" : borderStrong,
                            borderStyle: isCopied ? "solid" : "dashed",
                            borderRadius: controlRadius,
                            color: resolvedText,
                          }}
                          className="flex min-h-10 w-full items-center justify-between gap-2 border px-3 py-1.5 text-left transition-colors"
                        >
                          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[clamp(0.72rem,2.6vw,0.8125rem)] font-bold tracking-[0.02em]">
                            {item.couponCode}
                          </code>
                          <span
                            style={{
                              color: isCopied ? "#34D399" : profile.accentColor,
                            }}
                            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-bold"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Copiar</span>
                              </>
                            )}
                          </span>
                        </button>
                      ) : null}
                    </li>
                  );
                }

                return (
                  <li
                    key={item.id}
                    style={cardSurfaceStyle(itemAccent, item.isFeatured)}
                    className={`flex flex-col gap-3 ${
                      item.isFeatured
                        ? `${featuredAnimationClass} p-[18px]`
                        : "p-4 transition-transform duration-150 hover:-translate-y-0.5"
                    }`}
                  >
                    {item.isFeatured || item.expiresAt ? (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {item.isFeatured ? (
                          <span
                            style={{ background: featuredBadgeBg, color: featuredBadgeInk }}
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-extrabold uppercase tracking-wider shadow-sm"
                          >
                            <FeaturedBadgeIcon iconKey={item.featuredIcon} className="h-3 w-3" />
                            <span>{item.featuredLabel || "Destaque"}</span>
                          </span>
                        ) : <span />}

                        {item.expiresAt ? (
                          <CountdownBadge expiresAt={item.expiresAt} />
                        ) : null}
                      </div>
                    ) : null}

                    <div className="flex min-w-0 items-center gap-3">
                      <BrandBadge
                        key={`${item.logoUrl}|${item.url}`}
                        item={item}
                        cardColor={resolvedCard}
                        textColor={resolvedText}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            style={{ fontFamily: titleFontFamily }}
                            className="text-[1.0625rem] font-bold leading-snug tracking-tight"
                          >
                            {item.title}
                          </h3>
                          {item.tag ? (
                            <span
                              style={{
                                background: pillBg,
                                borderColor: borderSubtle,
                                color: mutedText,
                              }}
                              className="rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold"
                            >
                              {item.tag}
                            </span>
                          ) : null}
                        </div>
                        {item.description ? (
                          <p
                            style={{ color: mutedText }}
                            className="mt-0.5 text-sm leading-snug"
                          >
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {item.kind === "coupon" && item.couponCode ? (
                      <button
                        type="button"
                        onClick={() => handleCopyCoupon(item)}
                        aria-label={`Copiar cupom ${item.couponCode} da ${item.title}`}
                        style={{
                          background: isCopied ? "rgba(52, 211, 153, 0.14)" : couponBg,
                          borderColor: isCopied ? "#34D399" : borderStrong,
                          borderStyle: isCopied ? "solid" : "dashed",
                          borderRadius: controlRadius,
                          color: resolvedText,
                        }}
                        className="flex min-h-[48px] w-full items-center justify-between gap-2 border px-3 py-2 text-left transition-all active:scale-[0.99]"
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span
                            style={{ color: mutedText }}
                            className="text-[0.65rem] font-bold uppercase tracking-[0.08em]"
                          >
                            Cupom
                          </span>
                          <code className="overflow-x-auto whitespace-nowrap font-mono text-[clamp(0.72rem,2.7vw,0.875rem)] font-bold tracking-[0.02em]">
                            {item.couponCode}
                          </code>
                        </span>

                        <span
                          style={{
                            color: isCopied ? "#34D399" : profile.accentColor,
                            background: isCopied ? "transparent" : pillBg,
                            borderColor: isCopied ? "#34D399" : borderSubtle,
                          }}
                          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[9px] border px-2 py-1.5 text-xs font-bold"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Copiar</span>
                            </>
                          )}
                        </span>
                      </button>
                    ) : null}

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleLinkClick(item)}
                      style={{
                        background: profile.ctaColor,
                        color: ctaInk,
                        borderRadius: controlRadius,
                        boxShadow: `0 6px 18px color-mix(in oklab, ${profile.ctaColor} 32%, transparent)`,
                      }}
                      className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 px-4 py-2.5 text-[0.9375rem] font-bold tracking-tight transition-opacity hover:opacity-95 active:scale-[0.985]"
                    >
                      <span>{item.ctaLabel || `Ir para ${item.title}`}</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </main>

        <footer style={{ color: mutedText }} className="mt-7 text-center text-xs">
          {profile.footerText ? <p>{profile.footerText}</p> : null}
          {isFromLanding ? (
            <div className="mt-5 mb-2 flex flex-col items-center justify-center gap-2">
              <Link
                href="/entrar?mode=register"
                target={previewMode ? "_self" : undefined}
                className="group inline-flex min-h-[46px] items-center justify-center gap-2.5 rounded-full bg-[#1E60CF] px-6 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(30,96,207,0.35)] transition hover:bg-[#256EE8] hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4 text-[#7DD3FC]" aria-hidden="true" />
                <span>Criar sua página</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <p className="text-[11px] font-medium opacity-75">
                Crie sua página de links e cupons grátis em menos de 1 minuto
              </p>
            </div>
          ) : null}
          {profile.showBranding ? (
            <div className="mt-5 flex flex-col items-center justify-center">
              <Link
                href="/"
                target={previewMode ? "_self" : "_blank"}
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3.5 py-1.5 backdrop-blur-md transition hover:border-white/25 hover:bg-black/40 shadow-sm"
                aria-label="Criar sua página meucupom.bio grátis"
              >
                <span className="text-[11px] font-medium opacity-70">Feito com</span>
                <BrandLogo
                  className="h-3.5 w-auto"
                  textColor={effectiveScheme === "light" ? "#0F172A" : "#FFFFFF"}
                />
              </Link>
            </div>
          ) : null}
          {!previewMode ? (
            <p className="mt-3">
              <button
                type="button"
                onClick={() => reportDialogRef.current?.showModal()}
                className="inline-flex items-center gap-1 opacity-70 underline-offset-4 hover:opacity-100 hover:underline"
              >
                <Flag className="h-3 w-3" aria-hidden="true" />
                <span>Denunciar página</span>
              </button>
            </p>
          ) : null}
        </footer>
      </div>

      {!previewMode ? (
        <dialog
          ref={reportDialogRef}
          closedby="any"
          aria-labelledby="report-dialog-title"
          className="mc-dialog"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setReportSubmitting(true);
              try {
                const res = await fetch("/api/report", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    slug: profile.slug,
                    reason: reportReason,
                    details: reportDetails,
                  }),
                });
                reportDialogRef.current?.close();
                setReportDetails("");
                showToast(
                  res.ok
                    ? "Denúncia registrada. Obrigado por ajudar a manter a plataforma segura."
                    : "Não foi possível enviar a denúncia agora."
                );
              } catch {
                showToast("Erro ao enviar denúncia.");
              } finally {
                setReportSubmitting(false);
              }
            }}
            className="p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 id="report-dialog-title" className="text-lg font-extrabold text-white">
                Denunciar página
              </h2>
              <button
                type="button"
                onClick={() => reportDialogRef.current?.close()}
                aria-label="Fechar janela"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-[#9CB3CE] hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label htmlFor="report-reason" className="mb-1 block text-sm font-semibold">
                  Motivo
                </label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mc-input min-h-[46px] w-full rounded-xl border border-white/15 bg-[#09101B] px-3 text-white"
                >
                  <option value="Phishing ou golpe">Phishing ou golpe</option>
                  <option value="Falsa identidade">Falsa identidade</option>
                  <option value="Spam">Spam / links maliciosos</option>
                  <option value="Conteúdo impróprio">Conteúdo impróprio</option>
                </select>
              </div>

              <div>
                <label htmlFor="report-details" className="mb-1 block text-sm font-semibold">
                  Detalhes (opcional)
                </label>
                <textarea
                  id="report-details"
                  rows={3}
                  maxLength={500}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Descreva brevemente o problema..."
                  className="mc-input w-full rounded-xl border border-white/15 bg-[#09101B] p-3 text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => reportDialogRef.current?.close()}
                className="min-h-[44px] rounded-xl border border-white/15 px-4 text-sm font-semibold text-[#9CB3CE] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={reportSubmitting}
                className="min-h-[44px] rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {reportSubmitting ? "Enviando..." : "Enviar denúncia"}
              </button>
            </div>
          </form>
        </dialog>
      ) : null}

      {/* Live region outside buttons for screen readers */}
      <div role="status" aria-live="polite" className="visually-hidden">
        {liveStatus}
      </div>

      {toastMsg ? (
        <div
          aria-hidden="true"
          style={{
            background: effectiveScheme === "light" ? "#0B172A" : "#0E1624",
            color: "#F4F8FD",
            borderColor: profile.accentColor,
          }}
          className={`${
            previewMode
              ? "sticky bottom-3 mx-auto w-fit"
              : "fixed bottom-5 left-1/2 -translate-x-1/2"
          } z-30 max-w-[calc(100vw-32px)] rounded-full border px-4 py-2.5 text-center text-sm font-semibold shadow-2xl`}
        >
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
