import crypto from "node:crypto";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import {
  FREE_MAX_ACTIVE_OR_TOTAL_LINKS,
  isAnimationAllowedForPlan,
  isBgStyleAllowedForPlan,
  isProPlan,
  isRadiusStyleAllowedForPlan,
} from "@/lib/plans";
import {
  computeInitials,
  CreatorProfileData,
  DailyAnalyticsPoint,
  DEFAULT_PROFILE_CUSTOMIZATION,
  isSafeHexColor,
  isSafeHttpUrl,
  isSafeMediaSrc,
  isSlugBlocked,
  LinkItemData,
  PlatformCouponData,
  PublicPagePayload,
  sanitizeSlug,
} from "@/types/meucupom";
import { ensureDatabaseReady } from "./bootstrap";
import { getDbHandle } from "./index";

function mapProfile(row: Record<string, unknown>): CreatorProfileData {
  const rawLayout = String(row.layout || "classic");
  const layout: CreatorProfileData["layout"] =
    rawLayout === "compact" ? "compact" : "classic";

  return {
    id: String(row.id),
    userId: String(row.userId),
    slug: String(row.slug),
    displayName: String(row.displayName),
    initials: computeInitials(String(row.displayName || row.initials || "MC")),
    avatarUrl: String(row.avatarUrl || ""),
    instagramHandle: String(row.instagramHandle || ""),
    instagramUrl: String(row.instagramUrl || ""),
    tiktokHandle: String(row.tiktokHandle || ""),
    tiktokUrl: String(row.tiktokUrl || ""),
    youtubeHandle: String(row.youtubeHandle || ""),
    youtubeUrl: String(row.youtubeUrl || ""),
    bio: String(row.bio || ""),
    footerText: String(row.footerText || ""),
    sectionTitle: String(row.sectionTitle || "Parceiros & Cupons"),
    helperTip: String(row.helperTip || ""),
    layout,
    themeMode: (row.themeMode as CreatorProfileData["themeMode"]) || "dark",
    allowThemeToggle: Boolean(row.allowThemeToggle),
    bgStyle: (row.bgStyle as CreatorProfileData["bgStyle"]) || "glow",
    cardStyle: (row.cardStyle as CreatorProfileData["cardStyle"]) || "solid",
    radiusStyle: (row.radiusStyle as CreatorProfileData["radiusStyle"]) || "rounded",
    fontStyle: (row.fontStyle as CreatorProfileData["fontStyle"]) || "jakarta",
    titleFontStyle:
      (row.titleFontStyle as CreatorProfileData["titleFontStyle"]) ||
      (row.fontStyle as CreatorProfileData["fontStyle"]) ||
      "jakarta",
    nameFontStyle:
      (row.nameFontStyle as CreatorProfileData["nameFontStyle"]) ||
      (row.titleFontStyle as CreatorProfileData["titleFontStyle"]) ||
      "jakarta",
    featuredAnimation:
      (row.featuredAnimation as CreatorProfileData["featuredAnimation"]) || "shimmer",
    socialDisplayStyle:
      (row.socialDisplayStyle as CreatorProfileData["socialDisplayStyle"]) || "both",
    accentColor: String(row.accentColor || "#38BDF8"),
    ctaColor: String(row.ctaColor || "#1E60CF"),
    bgColor: String(row.bgColor || "#070C14"),
    cardColor: String(row.cardColor || "#0E1624"),
    textColor: String(row.textColor || "#F4F8FD"),
    showBranding: Boolean(row.showBranding),
    viewsCount: Number(row.viewsCount || 0),
    plan: row.plan === "pro" ? "pro" : "free",
    subscriptionStatus:
      (row.subscriptionStatus as CreatorProfileData["subscriptionStatus"]) || "inactive",
    mpPayerId: String(row.mpPayerId || ""),
    mpPreapprovalId: String(row.mpPreapprovalId || ""),
    currentPeriodEnd: row.currentPeriodEnd
      ? new Date(row.currentPeriodEnd as string | number | Date).toISOString()
      : null,
    onboardingCompleted: Boolean(row.onboardingCompleted),
    isSuspended: Boolean(row.isSuspended),
  };
}

function mapItem(row: Record<string, unknown>): LinkItemData {
  const kind =
    row.kind === "link" ? "link" : row.kind === "divider" ? "divider" : "coupon";
  return {
    id: String(row.id),
    profileId: String(row.profileId),
    kind,
    title: String(row.title),
    badge: String(row.badge || ""),
    logoUrl: String(row.logoUrl || ""),
    accentColor: String(row.accentColor || "#38BDF8"),
    tag: String(row.tag || ""),
    description: String(row.description || ""),
    couponCode: String(row.couponCode || ""),
    url: String(row.url),
    ctaLabel: String(row.ctaLabel || ""),
    sortOrder: Number(row.sortOrder || 0),
    isActive: Boolean(row.isActive),
    isFeatured: Boolean(row.isFeatured),
    featuredLabel: String(row.featuredLabel || "Destaque"),
    featuredIcon: String(row.featuredIcon || "sparkles"),
    expiresAt: row.expiresAt
      ? new Date(row.expiresAt as string | number | Date).toISOString()
      : null,
    clicksCount: Number(row.clicksCount || 0),
    copiesCount: Number(row.copiesCount || 0),
  };
}

async function findAvailableSlug(baseRaw: string): Promise<string> {
  const handle = getDbHandle();
  let base = sanitizeSlug(baseRaw);
  if (!base || base.length < 3 || isSlugBlocked(base)) {
    base = `creator-${crypto.randomBytes(2).toString("hex")}`;
  }

  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing =
      handle.dialect === "sqlite"
        ? await handle.db
            .select({ id: handle.schema.creatorProfile.id })
            .from(handle.schema.creatorProfile)
            .where(eq(handle.schema.creatorProfile.slug, candidate))
            .limit(1)
        : await handle.db
            .select({ id: handle.schema.creatorProfile.id })
            .from(handle.schema.creatorProfile)
            .where(eq(handle.schema.creatorProfile.slug, candidate))
            .limit(1);

    if (existing.length === 0 && !isSlugBlocked(candidate)) {
      return candidate;
    }
    suffix += 1;
    candidate = `${base.slice(0, 34)}-${suffix}`;
  }
}

export async function checkSlugAvailability(
  rawSlug: string,
  currentUserId?: string
): Promise<{ available: boolean; normalized: string; reason?: string }> {
  await ensureDatabaseReady();
  const normalized = sanitizeSlug(rawSlug);
  if (normalized.length < 3) {
    return {
      available: false,
      normalized,
      reason: "Mínimo de 3 caracteres.",
    };
  }
  if (isSlugBlocked(normalized)) {
    return {
      available: false,
      normalized,
      reason: "Este endereço é reservado pelo sistema.",
    };
  }

  const handle = getDbHandle();
  const rows =
    handle.dialect === "sqlite"
      ? await handle.db
          .select({ userId: handle.schema.creatorProfile.userId })
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.slug, normalized))
          .limit(1)
      : await handle.db
          .select({ userId: handle.schema.creatorProfile.userId })
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.slug, normalized))
          .limit(1);

  if (rows.length > 0 && rows[0].userId !== currentUserId) {
    return {
      available: false,
      normalized,
      reason: "Este endereço já está em uso.",
    };
  }
  return { available: true, normalized };
}

export async function getPublicPageBySlug(rawSlug: string): Promise<PublicPagePayload | null> {
  await ensureDatabaseReady();
  const slug = sanitizeSlug(decodeURIComponent(rawSlug));
  if (!slug) return null;

  const handle = getDbHandle();
  if (handle.dialect === "sqlite") {
    const rows = await handle.db
      .select()
      .from(handle.schema.creatorProfile)
      .where(eq(handle.schema.creatorProfile.slug, slug))
      .limit(1);
    if (rows.length === 0) return null;

    const profile = mapProfile(rows[0] as unknown as Record<string, unknown>);
    const items = await handle.db
      .select()
      .from(handle.schema.linkItem)
      .where(
        and(
          eq(handle.schema.linkItem.profileId, profile.id),
          eq(handle.schema.linkItem.isActive, true)
        )
      )
      .orderBy(asc(handle.schema.linkItem.sortOrder));

    return {
      profile,
      items: items.map((r) => mapItem(r as unknown as Record<string, unknown>)),
    };
  }

  const rows = await handle.db
    .select()
    .from(handle.schema.creatorProfile)
    .where(eq(handle.schema.creatorProfile.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;

  const profile = mapProfile(rows[0] as unknown as Record<string, unknown>);
  const items = await handle.db
    .select()
    .from(handle.schema.linkItem)
    .where(
      and(
        eq(handle.schema.linkItem.profileId, profile.id),
        eq(handle.schema.linkItem.isActive, true)
      )
    )
    .orderBy(asc(handle.schema.linkItem.sortOrder));

  return {
    profile,
    items: items.map((r) => mapItem(r as unknown as Record<string, unknown>)),
  };
}

export async function getOrCreateProfileForUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): Promise<PublicPagePayload> {
  await ensureDatabaseReady();
  const handle = getDbHandle();

  const fetchExisting = async () => {
    if (handle.dialect === "sqlite") {
      const rows = await handle.db
        .select()
        .from(handle.schema.creatorProfile)
        .where(eq(handle.schema.creatorProfile.userId, user.id))
        .limit(1);
      if (rows.length === 0) return null;
      const profile = mapProfile(rows[0] as unknown as Record<string, unknown>);
      const items = await handle.db
        .select()
        .from(handle.schema.linkItem)
        .where(eq(handle.schema.linkItem.profileId, profile.id))
        .orderBy(asc(handle.schema.linkItem.sortOrder));
      return {
        profile,
        items: items.map((r) => mapItem(r as unknown as Record<string, unknown>)),
      };
    }

    const rows = await handle.db
      .select()
      .from(handle.schema.creatorProfile)
      .where(eq(handle.schema.creatorProfile.userId, user.id))
      .limit(1);
    if (rows.length === 0) return null;
    const profile = mapProfile(rows[0] as unknown as Record<string, unknown>);
    const items = await handle.db
      .select()
      .from(handle.schema.linkItem)
      .where(eq(handle.schema.linkItem.profileId, profile.id))
      .orderBy(asc(handle.schema.linkItem.sortOrder));
    return {
      profile,
      items: items.map((r) => mapItem(r as unknown as Record<string, unknown>)),
    };
  };

  const existing = await fetchExisting();
  if (existing) return existing;

  const displayName = (user.name || user.email?.split("@")[0] || "Novo Criador").trim();
  const emailPrefix = user.email?.split("@")[0] || displayName;
  const slug = await findAvailableSlug(emailPrefix);
  const initials = computeInitials(displayName);
  const isInstagramLocal = user.email?.endsWith("@instagram.meucupom.local");
  const igSlug = isInstagramLocal ? sanitizeSlug(emailPrefix) : "";
  const now = new Date();
  const profileId = crypto.randomUUID();

  const newProfileRow = {
    id: profileId,
    userId: user.id,
    slug,
    displayName,
    initials,
    avatarUrl: isSafeMediaSrc(user.image) ? user.image.trim() : "",
    instagramHandle: igSlug ? `@${igSlug}` : `@${slug}`,
    instagramUrl: igSlug ? `https://instagram.com/${igSlug}` : "",
    tiktokHandle: "",
    tiktokUrl: "",
    youtubeHandle: "",
    youtubeUrl: "",
    bio: "Meus links oficiais e cupons de desconto",
    ...DEFAULT_PROFILE_CUSTOMIZATION,
    viewsCount: 0,
    plan: "free",
    subscriptionStatus: "inactive",
    mpPayerId: "",
    mpPreapprovalId: "",
    currentPeriodEnd: null,
    onboardingCompleted: false,
    isSuspended: false,
    createdAt: now,
    updatedAt: now,
  };

  const starterItem = {
    id: crypto.randomUUID(),
    profileId,
    kind: "coupon",
    title: "Minha Loja Parceira",
    badge: "LP",
    logoUrl: "",
    accentColor: "#38BDF8",
    tag: "Destaque",
    description: "Edite ou substitua este cupom de exemplo pelo seu primeiro parceiro.",
    couponCode: "MEUCUPOM10",
    url: "https://example.com",
    ctaLabel: "Acessar loja",
    sortOrder: 0,
    isActive: true,
    isFeatured: false,
    clicksCount: 0,
    copiesCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (handle.dialect === "sqlite") {
    await handle.db.insert(handle.schema.creatorProfile).values(newProfileRow);
    await handle.db.insert(handle.schema.linkItem).values(starterItem);
  } else {
    await handle.db.insert(handle.schema.creatorProfile).values(newProfileRow);
    await handle.db.insert(handle.schema.linkItem).values(starterItem);
  }

  return (await fetchExisting())!;
}

export async function updateProfileForUser(
  userId: string,
  patch: Partial<Omit<CreatorProfileData, "id" | "userId" | "viewsCount">>
): Promise<{ ok: true; profile: CreatorProfileData } | { ok: false; error: string }> {
  await ensureDatabaseReady();
  const handle = getDbHandle();

  const existing =
    handle.dialect === "sqlite"
      ? await handle.db
          .select()
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.userId, userId))
          .limit(1)
      : await handle.db
          .select()
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.userId, userId))
          .limit(1);

  if (existing.length === 0) {
    return { ok: false, error: "Perfil não encontrado." };
  }

  const current = mapProfile(existing[0] as unknown as Record<string, unknown>);
  const userIsPro = isProPlan(current);
  let nextSlug = current.slug;

  if (typeof patch.slug === "string") {
    const cleaned = sanitizeSlug(patch.slug);
    if (cleaned.length < 3) {
      return { ok: false, error: "O endereço (@slug) precisa ter pelo menos 3 caracteres." };
    }
    if (isSlugBlocked(cleaned)) {
      return { ok: false, error: "Este endereço é reservado pelo sistema." };
    }
    if (cleaned !== current.slug) {
      const conflict =
        handle.dialect === "sqlite"
          ? await handle.db
              .select({ id: handle.schema.creatorProfile.id })
              .from(handle.schema.creatorProfile)
              .where(eq(handle.schema.creatorProfile.slug, cleaned))
              .limit(1)
          : await handle.db
              .select({ id: handle.schema.creatorProfile.id })
              .from(handle.schema.creatorProfile)
              .where(eq(handle.schema.creatorProfile.slug, cleaned))
              .limit(1);

      if (conflict.length > 0) {
        return { ok: false, error: "Este endereço já está em uso por outra pessoa." };
      }
    }
    nextSlug = cleaned;
  }

  if (patch.bgStyle !== undefined && !isBgStyleAllowedForPlan(patch.bgStyle, userIsPro)) {
    return {
      ok: false,
      error: "O estilo de fundo selecionado é exclusivo do Plano Pro.",
    };
  }

  if (patch.radiusStyle !== undefined && !isRadiusStyleAllowedForPlan(patch.radiusStyle, userIsPro)) {
    return {
      ok: false,
      error: "O estilo de borda selecionado é exclusivo do Plano Pro.",
    };
  }

  const displayName =
    typeof patch.displayName === "string" && patch.displayName.trim()
      ? patch.displayName.trim().slice(0, 80)
      : current.displayName;

  const updates = {
    slug: nextSlug,
    displayName,
    initials: computeInitials(displayName),
    avatarUrl:
      patch.avatarUrl !== undefined
        ? isSafeMediaSrc(patch.avatarUrl)
          ? patch.avatarUrl.trim()
          : ""
        : current.avatarUrl,
    instagramHandle:
      typeof patch.instagramHandle === "string"
        ? patch.instagramHandle.trim().slice(0, 50)
        : current.instagramHandle,
    instagramUrl:
      patch.instagramUrl !== undefined
        ? isSafeHttpUrl(patch.instagramUrl)
          ? patch.instagramUrl.trim()
          : ""
        : current.instagramUrl,
    tiktokHandle:
      typeof patch.tiktokHandle === "string"
        ? patch.tiktokHandle.trim().slice(0, 50)
        : current.tiktokHandle,
    tiktokUrl:
      patch.tiktokUrl !== undefined
        ? isSafeHttpUrl(patch.tiktokUrl)
          ? patch.tiktokUrl.trim()
          : ""
        : current.tiktokUrl,
    youtubeHandle:
      typeof patch.youtubeHandle === "string"
        ? patch.youtubeHandle.trim().slice(0, 60)
        : current.youtubeHandle,
    youtubeUrl:
      patch.youtubeUrl !== undefined
        ? isSafeHttpUrl(patch.youtubeUrl)
          ? patch.youtubeUrl.trim()
          : ""
        : current.youtubeUrl,
    bio: typeof patch.bio === "string" ? patch.bio.trim().slice(0, 220) : current.bio,
    footerText:
      typeof patch.footerText === "string"
        ? patch.footerText.trim().slice(0, 200)
        : current.footerText,
    sectionTitle:
      typeof patch.sectionTitle === "string"
        ? patch.sectionTitle.trim().slice(0, 60)
        : current.sectionTitle,
    helperTip:
      typeof patch.helperTip === "string"
        ? patch.helperTip.trim().slice(0, 140)
        : current.helperTip,
    layout: patch.layout ?? current.layout,
    themeMode: patch.themeMode ?? current.themeMode,
    allowThemeToggle:
      typeof patch.allowThemeToggle === "boolean"
        ? patch.allowThemeToggle
        : current.allowThemeToggle,
    bgStyle:
      patch.bgStyle !== undefined
        ? isBgStyleAllowedForPlan(patch.bgStyle, userIsPro)
          ? patch.bgStyle
          : current.bgStyle
        : current.bgStyle,
    cardStyle: patch.cardStyle ?? current.cardStyle,
    radiusStyle:
      patch.radiusStyle !== undefined
        ? isRadiusStyleAllowedForPlan(patch.radiusStyle, userIsPro)
          ? patch.radiusStyle
          : current.radiusStyle
        : current.radiusStyle,
    fontStyle: patch.fontStyle ?? current.fontStyle,
    titleFontStyle: patch.titleFontStyle ?? current.titleFontStyle,
    nameFontStyle: patch.nameFontStyle ?? current.nameFontStyle,
    featuredAnimation:
      patch.featuredAnimation !== undefined
        ? isAnimationAllowedForPlan(patch.featuredAnimation, userIsPro)
          ? patch.featuredAnimation
          : current.featuredAnimation
        : current.featuredAnimation,
    socialDisplayStyle: patch.socialDisplayStyle ?? current.socialDisplayStyle,
    accentColor: isSafeHexColor(patch.accentColor)
      ? patch.accentColor.trim().toUpperCase()
      : current.accentColor,
    ctaColor: isSafeHexColor(patch.ctaColor)
      ? patch.ctaColor.trim().toUpperCase()
      : current.ctaColor,
    bgColor: isSafeHexColor(patch.bgColor)
      ? patch.bgColor.trim().toUpperCase()
      : current.bgColor,
    cardColor: isSafeHexColor(patch.cardColor)
      ? patch.cardColor.trim().toUpperCase()
      : current.cardColor,
    textColor: isSafeHexColor(patch.textColor)
      ? patch.textColor.trim().toUpperCase()
      : current.textColor,
    showBranding: userIsPro
      ? typeof patch.showBranding === "boolean"
        ? patch.showBranding
        : current.showBranding
      : true,
    onboardingCompleted:
      typeof patch.onboardingCompleted === "boolean"
        ? patch.onboardingCompleted
        : current.onboardingCompleted,
    updatedAt: new Date(),
  };

  if (handle.dialect === "sqlite") {
    await handle.db
      .update(handle.schema.creatorProfile)
      .set(updates)
      .where(eq(handle.schema.creatorProfile.id, current.id));
    const [updated] = await handle.db
      .select()
      .from(handle.schema.creatorProfile)
      .where(eq(handle.schema.creatorProfile.id, current.id))
      .limit(1);
    return { ok: true, profile: mapProfile(updated as unknown as Record<string, unknown>) };
  }

  await handle.db
    .update(handle.schema.creatorProfile)
    .set(updates)
    .where(eq(handle.schema.creatorProfile.id, current.id));
  const [updated] = await handle.db
    .select()
    .from(handle.schema.creatorProfile)
    .where(eq(handle.schema.creatorProfile.id, current.id))
    .limit(1);
  return { ok: true, profile: mapProfile(updated as unknown as Record<string, unknown>) };
}

async function getProfileIdForUser(userId: string): Promise<string | null> {
  const handle = getDbHandle();
  const rows =
    handle.dialect === "sqlite"
      ? await handle.db
          .select({ id: handle.schema.creatorProfile.id })
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.userId, userId))
          .limit(1)
      : await handle.db
          .select({ id: handle.schema.creatorProfile.id })
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.userId, userId))
          .limit(1);
  return rows[0]?.id ?? null;
}

export async function createLinkItemForUser(
  userId: string,
  input: {
    kind: "coupon" | "link" | "divider";
    title?: string;
    badge?: string;
    logoUrl?: string;
    accentColor?: string;
    tag?: string;
    description?: string;
    couponCode?: string;
    url?: string;
    ctaLabel?: string;
    isFeatured?: boolean;
    featuredLabel?: string;
    featuredIcon?: string;
    expiresAt?: string | null;
  }
): Promise<{ ok: true; item: LinkItemData } | { ok: false; error: string }> {
  await ensureDatabaseReady();
  const handle = getDbHandle();

  const profileRows =
    handle.dialect === "sqlite"
      ? await handle.db
          .select()
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.userId, userId))
          .limit(1)
      : await handle.db
          .select()
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.userId, userId))
          .limit(1);

  if (profileRows.length === 0) return { ok: false, error: "Perfil não encontrado." };
  const profile = mapProfile(profileRows[0] as unknown as Record<string, unknown>);
  const profileId = profile.id;

  const isDivider = input.kind === "divider";
  const rawTitle = (input.title || "").trim().slice(0, 80);
  if (!isDivider && !rawTitle) {
    return { ok: false, error: "Informe o nome da marca ou título do link." };
  }
  if (!isDivider && !isSafeHttpUrl(input.url)) {
    return { ok: false, error: "Informe uma URL válida começando com https:// ou http://" };
  }

  const existingItems =
    handle.dialect === "sqlite"
      ? await handle.db
          .select({
            sortOrder: handle.schema.linkItem.sortOrder,
            kind: handle.schema.linkItem.kind,
          })
          .from(handle.schema.linkItem)
          .where(eq(handle.schema.linkItem.profileId, profileId))
      : await handle.db
          .select({
            sortOrder: handle.schema.linkItem.sortOrder,
            kind: handle.schema.linkItem.kind,
          })
          .from(handle.schema.linkItem)
          .where(eq(handle.schema.linkItem.profileId, profileId));

  if (!isDivider && !isProPlan(profile)) {
    const linkCount = existingItems.filter((it) => it.kind !== "divider").length;
    if (linkCount >= FREE_MAX_ACTIVE_OR_TOTAL_LINKS) {
      return {
        ok: false,
        error: `O plano Grátis permite até ${FREE_MAX_ACTIVE_OR_TOTAL_LINKS} cupons/links. Faça upgrade para o Pro para adicionar ilimitados.`,
      };
    }
  }

  const maxSort = existingItems.reduce((acc, r) => Math.max(acc, r.sortOrder), -1);
  const now = new Date();
  const newItem = {
    id: crypto.randomUUID(),
    profileId,
    kind: input.kind,
    title: rawTitle,
    badge: isDivider ? "" : computeInitials(rawTitle),
    logoUrl: !isDivider && isSafeMediaSrc(input.logoUrl) ? input.logoUrl.trim() : "",
    accentColor: isSafeHexColor(input.accentColor)
      ? input.accentColor.trim().toUpperCase()
      : "#38BDF8",
    tag: isDivider ? "" : (input.tag || "").trim().slice(0, 30),
    description: (input.description || "").trim().slice(0, 180),
    couponCode: input.kind === "coupon" ? (input.couponCode || "").trim().slice(0, 50) : "",
    url: isDivider ? "" : (input.url || "").trim(),
    ctaLabel: isDivider ? "" : (input.ctaLabel || `Ir para ${rawTitle}`).trim().slice(0, 60),
    sortOrder: maxSort + 1,
    isActive: true,
    isFeatured: isDivider ? false : Boolean(input.isFeatured),
    featuredLabel: isDivider ? "" : (input.featuredLabel || "Destaque").trim().slice(0, 30) || "Destaque",
    featuredIcon: isDivider ? "sparkles" : (input.featuredIcon || "sparkles").trim().slice(0, 30) || "sparkles",
    expiresAt: isDivider || !input.expiresAt ? null : new Date(input.expiresAt),
    clicksCount: 0,
    copiesCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (handle.dialect === "sqlite") {
    await handle.db.insert(handle.schema.linkItem).values(newItem);
  } else {
    await handle.db.insert(handle.schema.linkItem).values(newItem);
  }

  return { ok: true, item: mapItem(newItem as unknown as Record<string, unknown>) };
}

export async function updateLinkItemForUser(
  userId: string,
  itemId: string,
  patch: Partial<{
    kind: "coupon" | "link" | "divider";
    title: string;
    badge: string;
    logoUrl: string;
    accentColor: string;
    tag: string;
    description: string;
    couponCode: string;
    url: string;
    ctaLabel: string;
    isActive: boolean;
    isFeatured: boolean;
    featuredLabel: string;
    featuredIcon: string;
    expiresAt: string | null;
  }>
): Promise<{ ok: true; item: LinkItemData } | { ok: false; error: string }> {
  await ensureDatabaseReady();
  const profileId = await getProfileIdForUser(userId);
  if (!profileId) return { ok: false, error: "Perfil não encontrado." };

  const handle = getDbHandle();
  const rows =
    handle.dialect === "sqlite"
      ? await handle.db
          .select()
          .from(handle.schema.linkItem)
          .where(
            and(eq(handle.schema.linkItem.id, itemId), eq(handle.schema.linkItem.profileId, profileId))
          )
          .limit(1)
      : await handle.db
          .select()
          .from(handle.schema.linkItem)
          .where(
            and(eq(handle.schema.linkItem.id, itemId), eq(handle.schema.linkItem.profileId, profileId))
          )
          .limit(1);

  if (rows.length === 0) {
    return { ok: false, error: "Item não encontrado." };
  }

  const current = mapItem(rows[0] as unknown as Record<string, unknown>);
  const nextKind = patch.kind ?? current.kind;
  const isDivider = nextKind === "divider";
  const nextUrl = patch.url !== undefined ? patch.url.trim() : current.url;

  if (!isDivider && !isSafeHttpUrl(nextUrl)) {
    return { ok: false, error: "URL inválida. Use https:// ou http://" };
  }

  const nextTitle =
    typeof patch.title === "string"
      ? patch.title.trim().slice(0, 80)
      : current.title;

  if (!isDivider && !nextTitle) {
    return { ok: false, error: "Informe o nome da marca ou título do link." };
  }

  const updates = {
    kind: nextKind,
    title: nextTitle,
    badge: isDivider ? "" : computeInitials(nextTitle),
    logoUrl: isDivider
      ? ""
      : patch.logoUrl !== undefined
        ? isSafeMediaSrc(patch.logoUrl)
          ? patch.logoUrl.trim()
          : ""
        : current.logoUrl,
    accentColor: isSafeHexColor(patch.accentColor)
      ? patch.accentColor.trim().toUpperCase()
      : current.accentColor,
    tag: isDivider
      ? ""
      : typeof patch.tag === "string"
        ? patch.tag.trim().slice(0, 30)
        : current.tag,
    description:
      typeof patch.description === "string"
        ? patch.description.trim().slice(0, 180)
        : current.description,
    couponCode:
      nextKind !== "coupon"
        ? ""
        : typeof patch.couponCode === "string"
          ? patch.couponCode.trim().slice(0, 50)
          : current.couponCode,
    url: isDivider ? "" : nextUrl,
    ctaLabel: isDivider
      ? ""
      : typeof patch.ctaLabel === "string"
        ? patch.ctaLabel.trim().slice(0, 60)
        : current.ctaLabel,
    isActive: typeof patch.isActive === "boolean" ? patch.isActive : current.isActive,
    isFeatured: isDivider
      ? false
      : typeof patch.isFeatured === "boolean"
        ? patch.isFeatured
        : current.isFeatured,
    featuredLabel: isDivider
      ? ""
      : typeof patch.featuredLabel === "string"
        ? patch.featuredLabel.trim().slice(0, 30) || "Destaque"
        : current.featuredLabel,
    featuredIcon: isDivider
      ? "sparkles"
      : typeof patch.featuredIcon === "string"
        ? patch.featuredIcon.trim().slice(0, 30) || "sparkles"
        : current.featuredIcon,
    expiresAt: isDivider
      ? null
      : patch.expiresAt !== undefined
        ? patch.expiresAt
          ? new Date(patch.expiresAt)
          : null
        : current.expiresAt
          ? new Date(current.expiresAt)
          : null,
    updatedAt: new Date(),
  };

  if (handle.dialect === "sqlite") {
    await handle.db
      .update(handle.schema.linkItem)
      .set(updates)
      .where(eq(handle.schema.linkItem.id, itemId));
    const [updated] = await handle.db
      .select()
      .from(handle.schema.linkItem)
      .where(eq(handle.schema.linkItem.id, itemId))
      .limit(1);
    return { ok: true, item: mapItem(updated as unknown as Record<string, unknown>) };
  }

  await handle.db
    .update(handle.schema.linkItem)
    .set(updates)
    .where(eq(handle.schema.linkItem.id, itemId));
  const [updated] = await handle.db
    .select()
    .from(handle.schema.linkItem)
    .where(eq(handle.schema.linkItem.id, itemId))
    .limit(1);
  return { ok: true, item: mapItem(updated as unknown as Record<string, unknown>) };
}

export async function deleteLinkItemForUser(userId: string, itemId: string): Promise<boolean> {
  await ensureDatabaseReady();
  const profileId = await getProfileIdForUser(userId);
  if (!profileId) return false;

  const handle = getDbHandle();
  if (handle.dialect === "sqlite") {
    await handle.db
      .delete(handle.schema.linkItem)
      .where(
        and(eq(handle.schema.linkItem.id, itemId), eq(handle.schema.linkItem.profileId, profileId))
      );
    return true;
  }

  await handle.db
    .delete(handle.schema.linkItem)
    .where(
      and(eq(handle.schema.linkItem.id, itemId), eq(handle.schema.linkItem.profileId, profileId))
    );
  return true;
}

export async function reorderLinkItemsForUser(
  userId: string,
  orderedIds: string[]
): Promise<boolean> {
  await ensureDatabaseReady();
  const profileId = await getProfileIdForUser(userId);
  if (!profileId) return false;

  const handle = getDbHandle();
  const now = new Date();
  for (let i = 0; i < orderedIds.length; i += 1) {
    const id = orderedIds[i];
    if (handle.dialect === "sqlite") {
      await handle.db
        .update(handle.schema.linkItem)
        .set({ sortOrder: i, updatedAt: now })
        .where(
          and(eq(handle.schema.linkItem.id, id), eq(handle.schema.linkItem.profileId, profileId))
        );
    } else {
      await handle.db
        .update(handle.schema.linkItem)
        .set({ sortOrder: i, updatedAt: now })
        .where(
          and(eq(handle.schema.linkItem.id, id), eq(handle.schema.linkItem.profileId, profileId))
        );
    }
  }
  return true;
}

export async function recordProfileEvent(input: {
  slug: string;
  type: "view" | "click" | "copy";
  itemId?: string;
}): Promise<void> {
  await ensureDatabaseReady();
  const slug = sanitizeSlug(input.slug);
  if (!slug) return;

  const handle = getDbHandle();
  const now = new Date();

  const profiles =
    handle.dialect === "sqlite"
      ? await handle.db
          .select({ id: handle.schema.creatorProfile.id })
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.slug, slug))
          .limit(1)
      : await handle.db
          .select({ id: handle.schema.creatorProfile.id })
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.slug, slug))
          .limit(1);

  const profileId = profiles[0]?.id;
  if (!profileId) return;

  if (handle.dialect === "sqlite") {
    if (input.type === "view") {
      await handle.db
        .update(handle.schema.creatorProfile)
        .set({ viewsCount: sql`${handle.schema.creatorProfile.viewsCount} + 1` })
        .where(eq(handle.schema.creatorProfile.id, profileId));
      await handle.db.insert(handle.schema.profileEvent).values({
        id: crypto.randomUUID(),
        profileId,
        itemId: null,
        eventType: "view",
        createdAt: now,
      });
      return;
    }

    if (!input.itemId) return;
    if (input.type === "click") {
      await handle.db
        .update(handle.schema.linkItem)
        .set({ clicksCount: sql`${handle.schema.linkItem.clicksCount} + 1` })
        .where(
          and(
            eq(handle.schema.linkItem.id, input.itemId),
            eq(handle.schema.linkItem.profileId, profileId)
          )
        );
    } else if (input.type === "copy") {
      await handle.db
        .update(handle.schema.linkItem)
        .set({ copiesCount: sql`${handle.schema.linkItem.copiesCount} + 1` })
        .where(
          and(
            eq(handle.schema.linkItem.id, input.itemId),
            eq(handle.schema.linkItem.profileId, profileId)
          )
        );
    }
    await handle.db.insert(handle.schema.profileEvent).values({
      id: crypto.randomUUID(),
      profileId,
      itemId: input.itemId,
      eventType: input.type,
      createdAt: now,
    });
    return;
  }

  if (input.type === "view") {
    await handle.db
      .update(handle.schema.creatorProfile)
      .set({ viewsCount: sql`${handle.schema.creatorProfile.viewsCount} + 1` })
      .where(eq(handle.schema.creatorProfile.id, profileId));
    await handle.db.insert(handle.schema.profileEvent).values({
      id: crypto.randomUUID(),
      profileId,
      itemId: null,
      eventType: "view",
      createdAt: now,
    });
    return;
  }

  if (!input.itemId) return;
  if (input.type === "click") {
    await handle.db
      .update(handle.schema.linkItem)
      .set({ clicksCount: sql`${handle.schema.linkItem.clicksCount} + 1` })
      .where(
        and(
          eq(handle.schema.linkItem.id, input.itemId),
          eq(handle.schema.linkItem.profileId, profileId)
        )
      );
  } else if (input.type === "copy") {
    await handle.db
      .update(handle.schema.linkItem)
      .set({ copiesCount: sql`${handle.schema.linkItem.copiesCount} + 1` })
      .where(
        and(
          eq(handle.schema.linkItem.id, input.itemId),
          eq(handle.schema.linkItem.profileId, profileId)
        )
      );
  }
  await handle.db.insert(handle.schema.profileEvent).values({
    id: crypto.randomUUID(),
    profileId,
    itemId: input.itemId,
    eventType: input.type,
    createdAt: now,
  });
}

export async function getDailyAnalyticsForUser(
  userId: string,
  days: 7 | 14 | 30 | number
): Promise<DailyAnalyticsPoint[]> {
  await ensureDatabaseReady();
  const profileId = await getProfileIdForUser(userId);
  if (!profileId) return [];

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const handle = getDbHandle();
  const events =
    handle.dialect === "sqlite"
      ? await handle.db
          .select({
            eventType: handle.schema.profileEvent.eventType,
            createdAt: handle.schema.profileEvent.createdAt,
          })
          .from(handle.schema.profileEvent)
          .where(
            and(
              eq(handle.schema.profileEvent.profileId, profileId),
              gte(handle.schema.profileEvent.createdAt, since)
            )
          )
      : await handle.db
          .select({
            eventType: handle.schema.profileEvent.eventType,
            createdAt: handle.schema.profileEvent.createdAt,
          })
          .from(handle.schema.profileEvent)
          .where(
            and(
              eq(handle.schema.profileEvent.profileId, profileId),
              gte(handle.schema.profileEvent.createdAt, since)
            )
          );

  const byDay = new Map<string, DailyAnalyticsPoint>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { date: key, views: 0, copies: 0, clicks: 0 });
  }

  for (const ev of events) {
    const key = new Date(ev.createdAt).toISOString().slice(0, 10);
    const point = byDay.get(key);
    if (!point) continue;
    if (ev.eventType === "view") point.views += 1;
    else if (ev.eventType === "copy") point.copies += 1;
    else if (ev.eventType === "click") point.clicks += 1;
  }

  return Array.from(byDay.values());
}

export async function createAbuseReport(input: {
  slug: string;
  reason: string;
  details: string;
}): Promise<void> {
  await ensureDatabaseReady();
  const slug = sanitizeSlug(input.slug);
  if (!slug) return;

  const handle = getDbHandle();
  const rows =
    handle.dialect === "sqlite"
      ? await handle.db
          .select({ id: handle.schema.creatorProfile.id })
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.slug, slug))
          .limit(1)
      : await handle.db
          .select({ id: handle.schema.creatorProfile.id })
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.slug, slug))
          .limit(1);

  const report = {
    id: crypto.randomUUID(),
    profileId: rows[0]?.id ?? null,
    slug,
    reason: input.reason.trim().slice(0, 80),
    details: input.details.trim().slice(0, 500),
    createdAt: new Date(),
  };

  if (handle.dialect === "sqlite") {
    await handle.db.insert(handle.schema.abuseReport).values(report);
  } else {
    await handle.db.insert(handle.schema.abuseReport).values(report);
  }
}

export async function setMercadoPagoPreapprovalForUser(
  userId: string,
  mpPreapprovalId: string
): Promise<void> {
  await ensureDatabaseReady();
  const handle = getDbHandle();
  if (handle.dialect === "sqlite") {
    await handle.db
      .update(handle.schema.creatorProfile)
      .set({ mpPreapprovalId, updatedAt: new Date() })
      .where(eq(handle.schema.creatorProfile.userId, userId));
  } else {
    await handle.db
      .update(handle.schema.creatorProfile)
      .set({ mpPreapprovalId, updatedAt: new Date() })
      .where(eq(handle.schema.creatorProfile.userId, userId));
  }
}

export async function syncMercadoPagoSubscription(input: {
  userId?: string;
  mpPayerId?: string;
  mpPreapprovalId: string;
  plan: "free" | "pro";
  subscriptionStatus: CreatorProfileData["subscriptionStatus"];
  currentPeriodEnd: Date | null;
}): Promise<void> {
  await ensureDatabaseReady();
  const handle = getDbHandle();
  const updates = {
    plan: input.plan,
    subscriptionStatus: input.subscriptionStatus,
    mpPreapprovalId: input.mpPreapprovalId,
    ...(input.mpPayerId ? { mpPayerId: input.mpPayerId } : {}),
    currentPeriodEnd: input.currentPeriodEnd,
    updatedAt: new Date(),
  };

  if (input.userId) {
    if (handle.dialect === "sqlite") {
      await handle.db
        .update(handle.schema.creatorProfile)
        .set(updates)
        .where(eq(handle.schema.creatorProfile.userId, input.userId));
    } else {
      await handle.db
        .update(handle.schema.creatorProfile)
        .set(updates)
        .where(eq(handle.schema.creatorProfile.userId, input.userId));
    }
    return;
  }

  if (input.mpPreapprovalId) {
    if (handle.dialect === "sqlite") {
      await handle.db
        .update(handle.schema.creatorProfile)
        .set(updates)
        .where(eq(handle.schema.creatorProfile.mpPreapprovalId, input.mpPreapprovalId));
    } else {
      await handle.db
        .update(handle.schema.creatorProfile)
        .set(updates)
        .where(eq(handle.schema.creatorProfile.mpPreapprovalId, input.mpPreapprovalId));
    }
  }
}

export interface AdminUserSummary {
  userId: string;
  userName: string;
  email: string;
  userCreatedAt: string;
  profileId: string | null;
  slug: string;
  displayName: string;
  plan: "free" | "pro";
  subscriptionStatus: CreatorProfileData["subscriptionStatus"];
  mpPayerId: string;
  mpPreapprovalId: string;
  currentPeriodEnd: string | null;
  viewsCount: number;
  itemsCount: number;
  isSuspended: boolean;
  onboardingCompleted: boolean;
}

export interface AdminReportSummary {
  id: string;
  profileId: string | null;
  slug: string;
  reason: string;
  details: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}

export interface AdminOverviewData {
  users: AdminUserSummary[];
  reports: AdminReportSummary[];
  coupons: PlatformCouponData[];
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  await ensureDatabaseReady();
  const handle = getDbHandle();

  const [userRows, profileRows, itemRows, reportRows] =
    handle.dialect === "sqlite"
      ? await Promise.all([
          handle.db
            .select({
              id: handle.schema.user.id,
              name: handle.schema.user.name,
              email: handle.schema.user.email,
              createdAt: handle.schema.user.createdAt,
            })
            .from(handle.schema.user)
            .orderBy(desc(handle.schema.user.createdAt)),
          handle.db.select().from(handle.schema.creatorProfile),
          handle.db
            .select({
              profileId: handle.schema.linkItem.profileId,
              kind: handle.schema.linkItem.kind,
            })
            .from(handle.schema.linkItem),
          handle.db
            .select()
            .from(handle.schema.abuseReport)
            .orderBy(desc(handle.schema.abuseReport.createdAt)),
        ])
      : await Promise.all([
          handle.db
            .select({
              id: handle.schema.user.id,
              name: handle.schema.user.name,
              email: handle.schema.user.email,
              createdAt: handle.schema.user.createdAt,
            })
            .from(handle.schema.user)
            .orderBy(desc(handle.schema.user.createdAt)),
          handle.db.select().from(handle.schema.creatorProfile),
          handle.db
            .select({
              profileId: handle.schema.linkItem.profileId,
              kind: handle.schema.linkItem.kind,
            })
            .from(handle.schema.linkItem),
          handle.db
            .select()
            .from(handle.schema.abuseReport)
            .orderBy(desc(handle.schema.abuseReport.createdAt)),
        ]);

  const itemCountByProfile = new Map<string, number>();
  for (const item of itemRows) {
    if (item.kind !== "divider") {
      itemCountByProfile.set(
        item.profileId,
        (itemCountByProfile.get(item.profileId) ?? 0) + 1
      );
    }
  }

  const profileByUser = new Map<string, Record<string, unknown>>();
  for (const prof of profileRows) {
    profileByUser.set(prof.userId, prof as unknown as Record<string, unknown>);
  }

  const users: AdminUserSummary[] = userRows.map((u) => {
    const rawProf = profileByUser.get(u.id);
    const prof = rawProf ? mapProfile(rawProf) : null;
    return {
      userId: u.id,
      userName: u.name,
      email: u.email,
      userCreatedAt: new Date(u.createdAt).toISOString(),
      profileId: prof?.id ?? null,
      slug: prof?.slug ?? "",
      displayName: prof?.displayName ?? u.name,
      plan: prof?.plan ?? "free",
      subscriptionStatus: prof?.subscriptionStatus ?? "inactive",
      mpPayerId: prof?.mpPayerId ?? "",
      mpPreapprovalId: prof?.mpPreapprovalId ?? "",
      currentPeriodEnd: prof?.currentPeriodEnd ?? null,
      viewsCount: prof?.viewsCount ?? 0,
      itemsCount: prof ? (itemCountByProfile.get(prof.id) ?? 0) : 0,
      isSuspended: prof?.isSuspended ?? false,
      onboardingCompleted: prof?.onboardingCompleted ?? false,
    };
  });

  const reports: AdminReportSummary[] = reportRows.map((r) => ({
    id: r.id,
    profileId: r.profileId ?? null,
    slug: r.slug,
    reason: r.reason,
    details: r.details,
    status:
      r.status === "resolved" || r.status === "dismissed" ? r.status : "open",
    createdAt: new Date(r.createdAt).toISOString(),
  }));

  const coupons = await listPlatformCoupons();

  return { users, reports, coupons };
}

export async function adminUpdateUserProfile(input: {
  userId: string;
  plan?: "free" | "pro";
  subscriptionStatus?: CreatorProfileData["subscriptionStatus"];
  isSuspended?: boolean;
  mpPayerId?: string;
  mpPreapprovalId?: string;
  currentPeriodEnd?: Date | null;
}): Promise<boolean> {
  await ensureDatabaseReady();
  const handle = getDbHandle();

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (input.plan !== undefined) updates.plan = input.plan;
  if (input.subscriptionStatus !== undefined) {
    updates.subscriptionStatus = input.subscriptionStatus;
  }
  if (input.isSuspended !== undefined) updates.isSuspended = input.isSuspended;
  if (input.mpPayerId !== undefined) updates.mpPayerId = input.mpPayerId;
  if (input.mpPreapprovalId !== undefined) {
    updates.mpPreapprovalId = input.mpPreapprovalId;
  }
  if (input.currentPeriodEnd !== undefined) {
    updates.currentPeriodEnd = input.currentPeriodEnd;
  }

  if (handle.dialect === "sqlite") {
    await handle.db
      .update(handle.schema.creatorProfile)
      .set(updates)
      .where(eq(handle.schema.creatorProfile.userId, input.userId));
  } else {
    await handle.db
      .update(handle.schema.creatorProfile)
      .set(updates)
      .where(eq(handle.schema.creatorProfile.userId, input.userId));
  }
  return true;
}

export async function adminUpdateReportStatus(input: {
  reportId: string;
  status: "open" | "resolved" | "dismissed";
  suspendTarget?: boolean;
}): Promise<void> {
  await ensureDatabaseReady();
  const handle = getDbHandle();

  const existing =
    handle.dialect === "sqlite"
      ? await handle.db
          .select()
          .from(handle.schema.abuseReport)
          .where(eq(handle.schema.abuseReport.id, input.reportId))
          .limit(1)
      : await handle.db
          .select()
          .from(handle.schema.abuseReport)
          .where(eq(handle.schema.abuseReport.id, input.reportId))
          .limit(1);

  const report = existing[0];
  if (!report) return;

  if (handle.dialect === "sqlite") {
    await handle.db
      .update(handle.schema.abuseReport)
      .set({ status: input.status })
      .where(eq(handle.schema.abuseReport.id, input.reportId));
  } else {
    await handle.db
      .update(handle.schema.abuseReport)
      .set({ status: input.status })
      .where(eq(handle.schema.abuseReport.id, input.reportId));
  }

  if (input.suspendTarget) {
    if (report.profileId) {
      if (handle.dialect === "sqlite") {
        await handle.db
          .update(handle.schema.creatorProfile)
          .set({ isSuspended: true, updatedAt: new Date() })
          .where(eq(handle.schema.creatorProfile.id, report.profileId));
      } else {
        await handle.db
          .update(handle.schema.creatorProfile)
          .set({ isSuspended: true, updatedAt: new Date() })
          .where(eq(handle.schema.creatorProfile.id, report.profileId));
      }
    } else if (report.slug) {
      if (handle.dialect === "sqlite") {
        await handle.db
          .update(handle.schema.creatorProfile)
          .set({ isSuspended: true, updatedAt: new Date() })
          .where(eq(handle.schema.creatorProfile.slug, report.slug));
      } else {
        await handle.db
          .update(handle.schema.creatorProfile)
          .set({ isSuspended: true, updatedAt: new Date() })
          .where(eq(handle.schema.creatorProfile.slug, report.slug));
      }
    }
  }
}

function mapPlatformCoupon(row: Record<string, unknown>): PlatformCouponData {
  return {
    id: String(row.id),
    code: String(row.code || "").toUpperCase(),
    influencerName: String(row.influencerName || ""),
    influencerEmail: String(row.influencerEmail || ""),
    description: String(row.description || ""),
    plan: "pro",
    durationDays: Number(row.durationDays || 30),
    maxUses: Number(row.maxUses || 0),
    usedCount: Number(row.usedCount || 0),
    isActive: Boolean(row.isActive),
    expiresAt: row.expiresAt
      ? new Date(row.expiresAt as string | number | Date).toISOString()
      : null,
    createdAt: new Date(row.createdAt as string | number | Date).toISOString(),
    updatedAt: new Date(row.updatedAt as string | number | Date).toISOString(),
  };
}

export async function listPlatformCoupons(): Promise<PlatformCouponData[]> {
  await ensureDatabaseReady();
  const handle = getDbHandle();

  const rows =
    handle.dialect === "sqlite"
      ? await handle.db
          .select()
          .from(handle.schema.platformCoupon)
          .orderBy(desc(handle.schema.platformCoupon.createdAt))
      : await handle.db
          .select()
          .from(handle.schema.platformCoupon)
          .orderBy(desc(handle.schema.platformCoupon.createdAt));

  return rows.map((r) => mapPlatformCoupon(r as unknown as Record<string, unknown>));
}

export async function createPlatformCoupon(input: {
  code: string;
  influencerName: string;
  influencerEmail?: string;
  description?: string;
  durationDays?: number;
  maxUses?: number;
  expiresAt?: string | null;
}): Promise<{ ok: true; coupon: PlatformCouponData } | { ok: false; error: string }> {
  await ensureDatabaseReady();
  const handle = getDbHandle();

  const rawCode = (input.code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");

  if (rawCode.length < 3) {
    return { ok: false, error: "O código do cupom deve ter pelo menos 3 caracteres alfanuméricos." };
  }

  const influencerName = (input.influencerName || "").trim();
  if (!influencerName) {
    return { ok: false, error: "Informe o nome do influenciador/parceiro." };
  }

  const existing =
    handle.dialect === "sqlite"
      ? await handle.db
          .select({ id: handle.schema.platformCoupon.id })
          .from(handle.schema.platformCoupon)
          .where(eq(handle.schema.platformCoupon.code, rawCode))
          .limit(1)
      : await handle.db
          .select({ id: handle.schema.platformCoupon.id })
          .from(handle.schema.platformCoupon)
          .where(eq(handle.schema.platformCoupon.code, rawCode))
          .limit(1);

  if (existing.length > 0) {
    return { ok: false, error: `O código de cupom "${rawCode}" já existe.` };
  }

  const now = new Date();
  const newRow = {
    id: crypto.randomUUID(),
    code: rawCode,
    influencerName,
    influencerEmail: (input.influencerEmail || "").trim(),
    description: (input.description || "").trim(),
    plan: "pro",
    durationDays: typeof input.durationDays === "number" ? Math.max(0, input.durationDays) : 30,
    maxUses: typeof input.maxUses === "number" ? Math.max(0, input.maxUses) : 100,
    usedCount: 0,
    isActive: true,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    createdAt: now,
    updatedAt: now,
  };

  if (handle.dialect === "sqlite") {
    await handle.db.insert(handle.schema.platformCoupon).values(newRow);
  } else {
    await handle.db.insert(handle.schema.platformCoupon).values(newRow);
  }

  return { ok: true, coupon: mapPlatformCoupon(newRow as unknown as Record<string, unknown>) };
}

export async function togglePlatformCouponActive(
  couponId: string,
  isActive: boolean
): Promise<{ ok: boolean; error?: string }> {
  await ensureDatabaseReady();
  const handle = getDbHandle();

  if (handle.dialect === "sqlite") {
    await handle.db
      .update(handle.schema.platformCoupon)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(handle.schema.platformCoupon.id, couponId));
  } else {
    await handle.db
      .update(handle.schema.platformCoupon)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(handle.schema.platformCoupon.id, couponId));
  }

  return { ok: true };
}

export async function deletePlatformCoupon(
  couponId: string
): Promise<{ ok: boolean; error?: string }> {
  await ensureDatabaseReady();
  const handle = getDbHandle();

  if (handle.dialect === "sqlite") {
    await handle.db
      .delete(handle.schema.platformCoupon)
      .where(eq(handle.schema.platformCoupon.id, couponId));
  } else {
    await handle.db
      .delete(handle.schema.platformCoupon)
      .where(eq(handle.schema.platformCoupon.id, couponId));
  }

  return { ok: true };
}

export async function redeemPlatformCouponForUser(
  userId: string,
  rawCode: string
): Promise<
  | { ok: true; message: string; profile: CreatorProfileData; coupon: PlatformCouponData }
  | { ok: false; error: string }
> {
  await ensureDatabaseReady();
  const handle = getDbHandle();

  const code = (rawCode || "").trim().toUpperCase();
  if (!code) {
    return { ok: false, error: "Informe o código do cupom." };
  }

  const couponRows =
    handle.dialect === "sqlite"
      ? await handle.db
          .select()
          .from(handle.schema.platformCoupon)
          .where(eq(handle.schema.platformCoupon.code, code))
          .limit(1)
      : await handle.db
          .select()
          .from(handle.schema.platformCoupon)
          .where(eq(handle.schema.platformCoupon.code, code))
          .limit(1);

  if (couponRows.length === 0) {
    return { ok: false, error: "Cupom não encontrado. Verifique o código e tente novamente." };
  }

  const coupon = mapPlatformCoupon(couponRows[0] as unknown as Record<string, unknown>);

  if (!coupon.isActive) {
    return { ok: false, error: "Este cupom foi desativado ou expirou." };
  }

  if (coupon.expiresAt) {
    const expDate = new Date(coupon.expiresAt).getTime();
    if (Date.now() > expDate) {
      return { ok: false, error: "Este cupom expirou." };
    }
  }

  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "Este cupom já atingiu o limite máximo de utilizações." };
  }

  // Verificar se o usuário já resgatou este cupom específico
  const previousRedemption =
    handle.dialect === "sqlite"
      ? await handle.db
          .select({ id: handle.schema.platformCouponRedemption.id })
          .from(handle.schema.platformCouponRedemption)
          .where(
            and(
              eq(handle.schema.platformCouponRedemption.couponId, coupon.id),
              eq(handle.schema.platformCouponRedemption.userId, userId)
            )
          )
          .limit(1)
      : await handle.db
          .select({ id: handle.schema.platformCouponRedemption.id })
          .from(handle.schema.platformCouponRedemption)
          .where(
            and(
              eq(handle.schema.platformCouponRedemption.couponId, coupon.id),
              eq(handle.schema.platformCouponRedemption.userId, userId)
            )
          )
          .limit(1);

  if (previousRedemption.length > 0) {
    return { ok: false, error: "Você já utilizou este cupom anteriormente." };
  }

  // Buscar perfil e dados do usuário
  const profRows =
    handle.dialect === "sqlite"
      ? await handle.db
          .select()
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.userId, userId))
          .limit(1)
      : await handle.db
          .select()
          .from(handle.schema.creatorProfile)
          .where(eq(handle.schema.creatorProfile.userId, userId))
          .limit(1);

  if (profRows.length === 0) {
    return { ok: false, error: "Perfil do criador não encontrado." };
  }

  const currentProf = mapProfile(profRows[0] as unknown as Record<string, unknown>);

  const userRows =
    handle.dialect === "sqlite"
      ? await handle.db
          .select()
          .from(handle.schema.user)
          .where(eq(handle.schema.user.id, userId))
          .limit(1)
      : await handle.db
          .select()
          .from(handle.schema.user)
          .where(eq(handle.schema.user.id, userId))
          .limit(1);

  const currentUser = userRows[0];
  const now = new Date();

  // Calcular novo período
  let nextSubscriptionStatus: CreatorProfileData["subscriptionStatus"] = "active";
  let nextPeriodEnd: Date | null = null;

  if (coupon.durationDays === 0) {
    // Permuta permanente
    nextSubscriptionStatus = "permuta";
    nextPeriodEnd = null;
  } else {
    // Dias de Pro adicionados
    const currentEnd = currentProf.currentPeriodEnd ? new Date(currentProf.currentPeriodEnd) : null;
    const baseTime = currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd.getTime() : now.getTime();
    nextPeriodEnd = new Date(baseTime + coupon.durationDays * 86_400_000);
  }

  // Atualizar perfil
  const profileUpdates = {
    plan: "pro",
    subscriptionStatus: nextSubscriptionStatus,
    currentPeriodEnd: nextPeriodEnd,
    updatedAt: now,
  };

  if (handle.dialect === "sqlite") {
    await handle.db
      .update(handle.schema.creatorProfile)
      .set(profileUpdates)
      .where(eq(handle.schema.creatorProfile.id, currentProf.id));
  } else {
    await handle.db
      .update(handle.schema.creatorProfile)
      .set(profileUpdates)
      .where(eq(handle.schema.creatorProfile.id, currentProf.id));
  }

  // Registrar redenção
  const redemptionRow = {
    id: crypto.randomUUID(),
    couponId: coupon.id,
    couponCode: coupon.code,
    userId,
    profileId: currentProf.id,
    userEmail: currentUser?.email || "",
    userName: currentUser?.name || currentProf.displayName || "",
    redeemedAt: now,
  };

  if (handle.dialect === "sqlite") {
    await handle.db.insert(handle.schema.platformCouponRedemption).values(redemptionRow);
    await handle.db
      .update(handle.schema.platformCoupon)
      .set({
        usedCount: coupon.usedCount + 1,
        updatedAt: now,
      })
      .where(eq(handle.schema.platformCoupon.id, coupon.id));
  } else {
    await handle.db.insert(handle.schema.platformCouponRedemption).values(redemptionRow);
    await handle.db
      .update(handle.schema.platformCoupon)
      .set({
        usedCount: coupon.usedCount + 1,
        updatedAt: now,
      })
      .where(eq(handle.schema.platformCoupon.id, coupon.id));
  }

  const updatedProfile: CreatorProfileData = {
    ...currentProf,
    plan: "pro",
    subscriptionStatus: nextSubscriptionStatus,
    currentPeriodEnd: nextPeriodEnd ? nextPeriodEnd.toISOString() : null,
  };

  const benefitText =
    coupon.durationDays === 0
      ? "Plano Pro permanente ativado!"
      : `${coupon.durationDays} dias de Plano Pro grátis ativados!`;

  return {
    ok: true,
    message: `Parabéns! Cupom "${coupon.code}" aplicado com sucesso: ${benefitText} (Parceria com ${coupon.influencerName})`,
    profile: updatedProfile,
    coupon,
  };
}
