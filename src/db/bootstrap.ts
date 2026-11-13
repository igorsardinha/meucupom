import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { DEFAULT_PROFILE_CUSTOMIZATION } from "@/types/meucupom";
import { getDbHandle } from "./index";

let initPromise: Promise<void> | null = null;

const SQLITE_DDL = [
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "emailVerified" integer NOT NULL DEFAULT 0,
    "image" text,
    "createdAt" integer NOT NULL,
    "updatedAt" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY NOT NULL,
    "expiresAt" integer NOT NULL,
    "token" text NOT NULL UNIQUE,
    "createdAt" integer NOT NULL,
    "updatedAt" integer NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" integer,
    "refreshTokenExpiresAt" integer,
    "scope" text,
    "password" text,
    "createdAt" integer NOT NULL,
    "updatedAt" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" integer NOT NULL,
    "createdAt" integer NOT NULL,
    "updatedAt" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "creator_profile" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
    "slug" text NOT NULL UNIQUE,
    "display_name" text NOT NULL,
    "initials" text NOT NULL DEFAULT 'MC',
    "avatar_url" text NOT NULL DEFAULT '',
    "instagram_handle" text NOT NULL DEFAULT '',
    "instagram_url" text NOT NULL DEFAULT '',
    "tiktok_handle" text NOT NULL DEFAULT '',
    "tiktok_url" text NOT NULL DEFAULT '',
    "youtube_handle" text NOT NULL DEFAULT '',
    "youtube_url" text NOT NULL DEFAULT '',
    "public_email" text NOT NULL DEFAULT '',
    "bio" text NOT NULL DEFAULT '',
    "footer_text" text NOT NULL DEFAULT '',
    "section_title" text NOT NULL DEFAULT 'Parceiros & Cupons',
    "helper_tip" text NOT NULL DEFAULT 'Toque no cupom para copiar e acesse pelo link oficial.',
    "layout" text NOT NULL DEFAULT 'classic',
    "theme_mode" text NOT NULL DEFAULT 'dark',
    "allow_theme_toggle" integer NOT NULL DEFAULT 1,
    "bg_style" text NOT NULL DEFAULT 'glow',
    "card_style" text NOT NULL DEFAULT 'solid',
    "radius_style" text NOT NULL DEFAULT 'rounded',
    "font_style" text NOT NULL DEFAULT 'jakarta',
    "title_font_style" text NOT NULL DEFAULT 'jakarta',
    "name_font_style" text NOT NULL DEFAULT 'jakarta',
    "featured_animation" text NOT NULL DEFAULT 'shimmer',
    "social_display_style" text NOT NULL DEFAULT 'both',
    "accent_color" text NOT NULL DEFAULT '#38BDF8',
    "cta_color" text NOT NULL DEFAULT '#1E60CF',
    "bg_color" text NOT NULL DEFAULT '#070C14',
    "card_color" text NOT NULL DEFAULT '#0E1624',
    "text_color" text NOT NULL DEFAULT '#F4F8FD',
    "show_branding" integer NOT NULL DEFAULT 1,
    "views_count" integer NOT NULL DEFAULT 0,
    "plan" text NOT NULL DEFAULT 'free',
    "subscription_status" text NOT NULL DEFAULT 'inactive',
    "mp_payer_id" text NOT NULL DEFAULT '',
    "mp_preapproval_id" text NOT NULL DEFAULT '',
    "current_period_end" integer,
    "onboarding_completed" integer NOT NULL DEFAULT 0,
    "is_suspended" integer NOT NULL DEFAULT 0,
    "is_verified" integer NOT NULL DEFAULT 0,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "link_item" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text NOT NULL REFERENCES "creator_profile"("id") ON DELETE CASCADE,
    "kind" text NOT NULL DEFAULT 'coupon',
    "title" text NOT NULL,
    "badge" text NOT NULL DEFAULT '',
    "logo_url" text NOT NULL DEFAULT '',
    "accent_color" text NOT NULL DEFAULT '#38BDF8',
    "tag" text NOT NULL DEFAULT '',
    "description" text NOT NULL DEFAULT '',
    "coupon_code" text NOT NULL DEFAULT '',
    "url" text NOT NULL,
    "cta_label" text NOT NULL DEFAULT '',
    "sort_order" integer NOT NULL DEFAULT 0,
    "is_active" integer NOT NULL DEFAULT 1,
    "is_featured" integer NOT NULL DEFAULT 0,
    "featured_label" text NOT NULL DEFAULT 'Destaque',
    "featured_icon" text NOT NULL DEFAULT 'sparkles',
    "expires_at" integer,
    "clicks_count" integer NOT NULL DEFAULT 0,
    "copies_count" integer NOT NULL DEFAULT 0,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "profile_event" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text NOT NULL REFERENCES "creator_profile"("id") ON DELETE CASCADE,
    "item_id" text REFERENCES "link_item"("id") ON DELETE CASCADE,
    "event_type" text NOT NULL,
    "created_at" integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_profile_event_profile_date" ON "profile_event"("profile_id", "created_at")`,
  `CREATE TABLE IF NOT EXISTS "abuse_report" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text REFERENCES "creator_profile"("id") ON DELETE CASCADE,
    "slug" text NOT NULL,
    "reason" text NOT NULL,
    "details" text NOT NULL DEFAULT '',
    "status" text NOT NULL DEFAULT 'open',
    "created_at" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "platform_coupon" (
    "id" text PRIMARY KEY NOT NULL,
    "code" text NOT NULL UNIQUE,
    "influencer_name" text NOT NULL,
    "influencer_email" text NOT NULL DEFAULT '',
    "description" text NOT NULL DEFAULT '',
    "plan" text NOT NULL DEFAULT 'pro',
    "duration_days" integer NOT NULL DEFAULT 30,
    "discount_percent" integer NOT NULL DEFAULT 0,
    "max_uses" integer NOT NULL DEFAULT 100,
    "used_count" integer NOT NULL DEFAULT 0,
    "is_active" integer NOT NULL DEFAULT 1,
    "expires_at" integer,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "platform_coupon_redemption" (
    "id" text PRIMARY KEY NOT NULL,
    "coupon_id" text NOT NULL REFERENCES "platform_coupon"("id") ON DELETE CASCADE,
    "coupon_code" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "profile_id" text NOT NULL,
    "user_email" text NOT NULL DEFAULT '',
    "user_name" text NOT NULL DEFAULT '',
    "redeemed_at" integer NOT NULL
  )`,
];

const PG_DDL = [
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image" text,
    "createdAt" timestamp NOT NULL,
    "updatedAt" timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY NOT NULL,
    "expiresAt" timestamp NOT NULL,
    "token" text NOT NULL UNIQUE,
    "createdAt" timestamp NOT NULL,
    "updatedAt" timestamp NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp,
    "refreshTokenExpiresAt" timestamp,
    "scope" text,
    "password" text,
    "createdAt" timestamp NOT NULL,
    "updatedAt" timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp NOT NULL,
    "createdAt" timestamp NOT NULL,
    "updatedAt" timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "creator_profile" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
    "slug" text NOT NULL UNIQUE,
    "display_name" text NOT NULL,
    "initials" text NOT NULL DEFAULT 'MC',
    "avatar_url" text NOT NULL DEFAULT '',
    "instagram_handle" text NOT NULL DEFAULT '',
    "instagram_url" text NOT NULL DEFAULT '',
    "tiktok_handle" text NOT NULL DEFAULT '',
    "tiktok_url" text NOT NULL DEFAULT '',
    "youtube_handle" text NOT NULL DEFAULT '',
    "youtube_url" text NOT NULL DEFAULT '',
    "public_email" text NOT NULL DEFAULT '',
    "bio" text NOT NULL DEFAULT '',
    "footer_text" text NOT NULL DEFAULT '',
    "section_title" text NOT NULL DEFAULT 'Parceiros & Cupons',
    "helper_tip" text NOT NULL DEFAULT 'Toque no cupom para copiar e acesse pelo link oficial.',
    "layout" text NOT NULL DEFAULT 'classic',
    "theme_mode" text NOT NULL DEFAULT 'dark',
    "allow_theme_toggle" boolean NOT NULL DEFAULT true,
    "bg_style" text NOT NULL DEFAULT 'glow',
    "card_style" text NOT NULL DEFAULT 'solid',
    "radius_style" text NOT NULL DEFAULT 'rounded',
    "font_style" text NOT NULL DEFAULT 'jakarta',
    "title_font_style" text NOT NULL DEFAULT 'jakarta',
    "name_font_style" text NOT NULL DEFAULT 'jakarta',
    "featured_animation" text NOT NULL DEFAULT 'shimmer',
    "social_display_style" text NOT NULL DEFAULT 'both',
    "accent_color" text NOT NULL DEFAULT '#38BDF8',
    "cta_color" text NOT NULL DEFAULT '#1E60CF',
    "bg_color" text NOT NULL DEFAULT '#070C14',
    "card_color" text NOT NULL DEFAULT '#0E1624',
    "text_color" text NOT NULL DEFAULT '#F4F8FD',
    "show_branding" boolean NOT NULL DEFAULT true,
    "views_count" integer NOT NULL DEFAULT 0,
    "plan" text NOT NULL DEFAULT 'free',
    "subscription_status" text NOT NULL DEFAULT 'inactive',
    "mp_payer_id" text NOT NULL DEFAULT '',
    "mp_preapproval_id" text NOT NULL DEFAULT '',
    "current_period_end" timestamp,
    "onboarding_completed" boolean NOT NULL DEFAULT false,
    "is_suspended" boolean NOT NULL DEFAULT false,
    "is_verified" boolean NOT NULL DEFAULT false,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "link_item" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text NOT NULL REFERENCES "creator_profile"("id") ON DELETE CASCADE,
    "kind" text NOT NULL DEFAULT 'coupon',
    "title" text NOT NULL,
    "badge" text NOT NULL DEFAULT '',
    "logo_url" text NOT NULL DEFAULT '',
    "accent_color" text NOT NULL DEFAULT '#38BDF8',
    "tag" text NOT NULL DEFAULT '',
    "description" text NOT NULL DEFAULT '',
    "coupon_code" text NOT NULL DEFAULT '',
    "url" text NOT NULL,
    "cta_label" text NOT NULL DEFAULT '',
    "sort_order" integer NOT NULL DEFAULT 0,
    "is_active" boolean NOT NULL DEFAULT true,
    "is_featured" boolean NOT NULL DEFAULT false,
    "featured_label" text NOT NULL DEFAULT 'Destaque',
    "featured_icon" text NOT NULL DEFAULT 'sparkles',
    "expires_at" timestamp,
    "clicks_count" integer NOT NULL DEFAULT 0,
    "copies_count" integer NOT NULL DEFAULT 0,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "profile_event" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text NOT NULL REFERENCES "creator_profile"("id") ON DELETE CASCADE,
    "item_id" text REFERENCES "link_item"("id") ON DELETE CASCADE,
    "event_type" text NOT NULL,
    "created_at" timestamp NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_profile_event_profile_date" ON "profile_event"("profile_id", "created_at")`,
  `CREATE TABLE IF NOT EXISTS "abuse_report" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text REFERENCES "creator_profile"("id") ON DELETE CASCADE,
    "slug" text NOT NULL,
    "reason" text NOT NULL,
    "details" text NOT NULL DEFAULT '',
    "status" text NOT NULL DEFAULT 'open',
    "created_at" timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "platform_coupon" (
    "id" text PRIMARY KEY NOT NULL,
    "code" text NOT NULL UNIQUE,
    "influencer_name" text NOT NULL,
    "influencer_email" text NOT NULL DEFAULT '',
    "description" text NOT NULL DEFAULT '',
    "plan" text NOT NULL DEFAULT 'pro',
    "duration_days" integer NOT NULL DEFAULT 30,
    "discount_percent" integer NOT NULL DEFAULT 0,
    "max_uses" integer NOT NULL DEFAULT 100,
    "used_count" integer NOT NULL DEFAULT 0,
    "is_active" boolean NOT NULL DEFAULT true,
    "expires_at" timestamp,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "platform_coupon_redemption" (
    "id" text PRIMARY KEY NOT NULL,
    "coupon_id" text NOT NULL REFERENCES "platform_coupon"("id") ON DELETE CASCADE,
    "coupon_code" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "profile_id" text NOT NULL,
    "user_email" text NOT NULL DEFAULT '',
    "user_name" text NOT NULL DEFAULT '',
    "redeemed_at" timestamp NOT NULL
  )`,
];

export const DEMO_USER_EMAIL = "demo@meucupom.app";

async function seedShowcaseProfile() {
  const handle = getDbHandle();
  const now = new Date();

  if (handle.dialect === "sqlite") {
    const existing = await handle.db
      .select({ id: handle.schema.creatorProfile.id })
      .from(handle.schema.creatorProfile)
      .where(eq(handle.schema.creatorProfile.slug, "modelo"))
      .limit(1);

    if (existing.length > 0) {
      await handle.db
        .update(handle.schema.creatorProfile)
        .set({
          plan: "pro",
          subscriptionStatus: "active",
          onboardingCompleted: true,
          instagramHandle: "",
          tiktokHandle: "",
          youtubeHandle: "",
          socialDisplayStyle: "icon",
        })
        .where(eq(handle.schema.creatorProfile.id, existing[0].id));
      await seedDemoEventsIfEmpty(existing[0].id, now);
      return;
    }

    const existingUser = await handle.db
      .select({ id: handle.schema.user.id })
      .from(handle.schema.user)
      .where(eq(handle.schema.user.email, DEMO_USER_EMAIL))
      .limit(1);

    const userId = existingUser[0]?.id ?? crypto.randomUUID();
    if (existingUser.length === 0) {
      await handle.db.insert(handle.schema.user).values({
        id: userId,
        name: "Criador Modelo",
        email: DEMO_USER_EMAIL,
        emailVerified: true,
        image: "",
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const existingByUser = await handle.db
        .select({ id: handle.schema.creatorProfile.id })
        .from(handle.schema.creatorProfile)
        .where(eq(handle.schema.creatorProfile.userId, userId))
        .limit(1);
      if (existingByUser.length > 0) {
        await handle.db
          .update(handle.schema.creatorProfile)
          .set({
            plan: "pro",
            subscriptionStatus: "active",
            onboardingCompleted: true,
            instagramHandle: "",
            tiktokHandle: "",
            youtubeHandle: "",
            socialDisplayStyle: "icon",
          })
          .where(eq(handle.schema.creatorProfile.id, existingByUser[0].id));
        await seedDemoEventsIfEmpty(existingByUser[0].id, now);
        return;
      }
    }

    const profileId = crypto.randomUUID();
    await handle.db.insert(handle.schema.creatorProfile).values({
      id: profileId,
      userId,
      slug: "modelo",
      displayName: "Criador Modelo",
      initials: "CM",
      avatarUrl: "",
      instagramHandle: "",
      instagramUrl: "https://instagram.com",
      tiktokHandle: "",
      tiktokUrl: "https://tiktok.com",
      youtubeHandle: "",
      youtubeUrl: "https://youtube.com",
      publicEmail: "",
      bio: "Links oficiais, parceiros e cupons selecionados para você economizar.",
      ...DEFAULT_PROFILE_CUSTOMIZATION,
      socialDisplayStyle: "icon",
      viewsCount: 186,
      plan: "pro",
      subscriptionStatus: "active",
      mpPayerId: "",
      mpPreapprovalId: "",
      currentPeriodEnd: null,
      onboardingCompleted: true,
      isSuspended: false,
      createdAt: now,
      updatedAt: now,
    });

    await handle.db.insert(handle.schema.linkItem).values(
      buildShowcaseItems(profileId, now)
    );
    await seedDemoEventsIfEmpty(profileId, now);
    return;
  }

  const existing = await handle.db
    .select({ id: handle.schema.creatorProfile.id })
    .from(handle.schema.creatorProfile)
    .where(eq(handle.schema.creatorProfile.slug, "modelo"))
    .limit(1);

  if (existing.length > 0) {
    await handle.db
      .update(handle.schema.creatorProfile)
      .set({
        plan: "pro",
        subscriptionStatus: "active",
        onboardingCompleted: true,
        instagramHandle: "",
        tiktokHandle: "",
        youtubeHandle: "",
        socialDisplayStyle: "icon",
      })
      .where(eq(handle.schema.creatorProfile.id, existing[0].id));
    await seedDemoEventsIfEmpty(existing[0].id, now);
    return;
  }

  const existingUser = await handle.db
    .select({ id: handle.schema.user.id })
    .from(handle.schema.user)
    .where(eq(handle.schema.user.email, DEMO_USER_EMAIL))
    .limit(1);

  const userId = existingUser[0]?.id ?? crypto.randomUUID();
  if (existingUser.length === 0) {
    await handle.db.insert(handle.schema.user).values({
      id: userId,
      name: "Criador Modelo",
      email: DEMO_USER_EMAIL,
      emailVerified: true,
      image: "",
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const existingByUser = await handle.db
      .select({ id: handle.schema.creatorProfile.id })
      .from(handle.schema.creatorProfile)
      .where(eq(handle.schema.creatorProfile.userId, userId))
      .limit(1);
    if (existingByUser.length > 0) {
      await handle.db
        .update(handle.schema.creatorProfile)
        .set({
          plan: "pro",
          subscriptionStatus: "active",
          onboardingCompleted: true,
          instagramHandle: "",
          tiktokHandle: "",
          youtubeHandle: "",
          socialDisplayStyle: "icon",
        })
        .where(eq(handle.schema.creatorProfile.id, existingByUser[0].id));
      await seedDemoEventsIfEmpty(existingByUser[0].id, now);
      return;
    }
  }

  const profileId = crypto.randomUUID();
  await handle.db.insert(handle.schema.creatorProfile).values({
    id: profileId,
    userId,
    slug: "modelo",
    displayName: "Criador Modelo",
    initials: "CM",
    avatarUrl: "",
    instagramHandle: "",
    instagramUrl: "https://instagram.com",
    tiktokHandle: "",
    tiktokUrl: "https://tiktok.com",
    youtubeHandle: "",
    youtubeUrl: "https://youtube.com",
    publicEmail: "",
    bio: "Links oficiais, parceiros e cupons selecionados para você economizar.",
    ...DEFAULT_PROFILE_CUSTOMIZATION,
    socialDisplayStyle: "icon",
    viewsCount: 186,
    plan: "pro",
    subscriptionStatus: "active",
    mpPayerId: "",
    mpPreapprovalId: "",
    currentPeriodEnd: null,
    onboardingCompleted: true,
    isSuspended: false,
    createdAt: now,
    updatedAt: now,
  });

  await handle.db.insert(handle.schema.linkItem).values(
    buildShowcaseItems(profileId, now)
  );
  await seedDemoEventsIfEmpty(profileId, now);
}

async function seedDemoEventsIfEmpty(profileId: string, now: Date) {
  const handle = getDbHandle();
  const existingEvents =
    handle.dialect === "sqlite"
      ? await handle.db
          .select({ id: handle.schema.profileEvent.id })
          .from(handle.schema.profileEvent)
          .where(eq(handle.schema.profileEvent.profileId, profileId))
          .limit(1)
      : await handle.db
          .select({ id: handle.schema.profileEvent.id })
          .from(handle.schema.profileEvent)
          .where(eq(handle.schema.profileEvent.profileId, profileId))
          .limit(1);

  if (existingEvents.length > 0) return;

  const samplePattern = [
    { daysAgo: 6, views: 14, copies: 7, clicks: 5 },
    { daysAgo: 5, views: 19, copies: 9, clicks: 6 },
    { daysAgo: 4, views: 16, copies: 8, clicks: 7 },
    { daysAgo: 3, views: 24, copies: 14, clicks: 10 },
    { daysAgo: 2, views: 21, copies: 11, clicks: 8 },
    { daysAgo: 1, views: 28, copies: 17, clicks: 12 },
    { daysAgo: 0, views: 20, copies: 12, clicks: 9 },
  ];

  const rows: Array<{
    id: string;
    profileId: string;
    itemId: string | null;
    eventType: string;
    createdAt: Date;
  }> = [];

  for (const day of samplePattern) {
    const baseTime = now.getTime() - day.daysAgo * 86_400_000;
    for (let i = 0; i < day.views; i += 1) {
      rows.push({
        id: crypto.randomUUID(),
        profileId,
        itemId: null,
        eventType: "view",
        createdAt: new Date(baseTime - i * 60_000),
      });
    }
    for (let i = 0; i < day.copies; i += 1) {
      rows.push({
        id: crypto.randomUUID(),
        profileId,
        itemId: null,
        eventType: "copy",
        createdAt: new Date(baseTime - i * 60_000),
      });
    }
    for (let i = 0; i < day.clicks; i += 1) {
      rows.push({
        id: crypto.randomUUID(),
        profileId,
        itemId: null,
        eventType: "click",
        createdAt: new Date(baseTime - i * 60_000),
      });
    }
  }

  if (handle.dialect === "sqlite") {
    await handle.db.insert(handle.schema.profileEvent).values(rows);
  } else {
    await handle.db.insert(handle.schema.profileEvent).values(rows);
  }
}

function buildShowcaseItems(profileId: string, now: Date) {
  return [
    {
      id: crypto.randomUUID(),
      profileId,
      kind: "coupon",
      title: "Loja Urbana",
      badge: "LU",
      logoUrl: "",
      accentColor: "#0EA5E9",
      tag: "Moda & Tech",
      description: "Roupas tecnológicas e acessórios para o dia a dia",
      couponCode: "BEMVINDO10",
      url: "https://exemplo.com.br",
      ctaLabel: "Ir para Loja Urbana",
      sortOrder: 0,
      isActive: true,
      isFeatured: true,
      featuredLabel: "Destaque",
      featuredIcon: "sparkles",
      expiresAt: null,
      clicksCount: 64,
      copiesCount: 98,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      profileId,
      kind: "coupon",
      title: "Nutri & Vida",
      badge: "NV",
      logoUrl: "",
      accentColor: "#10B981",
      tag: "Bem-estar",
      description: "Suplementos e snacks saudáveis com desconto especial",
      couponCode: "DESCONTO15",
      url: "https://exemplo.com.br",
      ctaLabel: "Ir para Nutri & Vida",
      sortOrder: 1,
      isActive: true,
      isFeatured: false,
      featuredLabel: "Destaque",
      featuredIcon: "sparkles",
      expiresAt: null,
      clicksCount: 41,
      copiesCount: 72,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      profileId,
      kind: "coupon",
      title: "Café da Manhã",
      badge: "CF",
      logoUrl: "",
      accentColor: "#F59E0B",
      tag: "Assinatura",
      description: "Cafés especiais moídos na hora na sua casa",
      couponCode: "CAFE20",
      url: "https://exemplo.com.br",
      ctaLabel: "Ir para Café da Manhã",
      sortOrder: 2,
      isActive: true,
      isFeatured: false,
      featuredLabel: "Destaque",
      featuredIcon: "sparkles",
      expiresAt: null,
      clicksCount: 29,
      copiesCount: 51,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      profileId,
      kind: "link",
      title: "Canal no YouTube",
      badge: "YT",
      logoUrl: "",
      accentColor: "#EF4444",
      tag: "Conteúdo",
      description: "Reviews, comparativos e novidades toda semana",
      couponCode: "",
      url: "https://youtube.com",
      ctaLabel: "Assistir agora",
      sortOrder: 3,
      isActive: true,
      isFeatured: false,
      featuredLabel: "Destaque",
      featuredIcon: "sparkles",
      expiresAt: null,
      clicksCount: 37,
      copiesCount: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

async function runColumnMigrations() {
  const handle = getDbHandle();
  if (handle.dialect === "sqlite") {
    const profCols = await handle.client.execute(`PRAGMA table_info("creator_profile")`);
    const profNames = new Set(profCols.rows.map((r) => String(r.name)));
    if (!profNames.has("tiktok_handle")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "tiktok_handle" text NOT NULL DEFAULT ''`
      );
    }
    if (!profNames.has("tiktok_url")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "tiktok_url" text NOT NULL DEFAULT ''`
      );
    }
    if (!profNames.has("youtube_handle")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "youtube_handle" text NOT NULL DEFAULT ''`
      );
    }
    if (!profNames.has("youtube_url")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "youtube_url" text NOT NULL DEFAULT ''`
      );
    }
    if (!profNames.has("public_email")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "public_email" text NOT NULL DEFAULT ''`
      );
    }
    if (!profNames.has("title_font_style")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "title_font_style" text NOT NULL DEFAULT 'jakarta'`
      );
    }
    if (!profNames.has("name_font_style")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "name_font_style" text NOT NULL DEFAULT 'jakarta'`
      );
    }
    if (!profNames.has("featured_animation")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "featured_animation" text NOT NULL DEFAULT 'shimmer'`
      );
    }
    if (!profNames.has("social_display_style")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "social_display_style" text NOT NULL DEFAULT 'both'`
      );
    }
    if (!profNames.has("plan")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "plan" text NOT NULL DEFAULT 'free'`
      );
    }
    if (!profNames.has("subscription_status")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "subscription_status" text NOT NULL DEFAULT 'inactive'`
      );
    }
    if (!profNames.has("mp_payer_id")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "mp_payer_id" text NOT NULL DEFAULT ''`
      );
    }
    if (!profNames.has("mp_preapproval_id")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "mp_preapproval_id" text NOT NULL DEFAULT ''`
      );
    }
    if (!profNames.has("current_period_end")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "current_period_end" integer`
      );
    }
    if (!profNames.has("onboarding_completed")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "onboarding_completed" integer NOT NULL DEFAULT 0`
      );
    }
    if (!profNames.has("is_suspended")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "is_suspended" integer NOT NULL DEFAULT 0`
      );
    }
    if (!profNames.has("is_verified")) {
      await handle.client.execute(
        `ALTER TABLE "creator_profile" ADD COLUMN "is_verified" integer NOT NULL DEFAULT 0`
      );
    }

    const itemCols = await handle.client.execute(`PRAGMA table_info("link_item")`);
    const itemNames = new Set(itemCols.rows.map((r) => String(r.name)));
    if (!itemNames.has("is_featured")) {
      await handle.client.execute(
        `ALTER TABLE "link_item" ADD COLUMN "is_featured" integer NOT NULL DEFAULT 0`
      );
    }
    if (!itemNames.has("featured_label")) {
      await handle.client.execute(
        `ALTER TABLE "link_item" ADD COLUMN "featured_label" text NOT NULL DEFAULT 'Destaque'`
      );
    }
    if (!itemNames.has("featured_icon")) {
      await handle.client.execute(
        `ALTER TABLE "link_item" ADD COLUMN "featured_icon" text NOT NULL DEFAULT 'sparkles'`
      );
    }
    if (!itemNames.has("expires_at")) {
      await handle.client.execute(
        `ALTER TABLE "link_item" ADD COLUMN "expires_at" integer`
      );
    }

    const reportCols = await handle.client.execute(`PRAGMA table_info("abuse_report")`);
    const reportNames = new Set(reportCols.rows.map((r) => String(r.name)));
    if (!reportNames.has("status")) {
      await handle.client.execute(
        `ALTER TABLE "abuse_report" ADD COLUMN "status" text NOT NULL DEFAULT 'open'`
      );
    }

    await handle.client.execute(`CREATE TABLE IF NOT EXISTS "platform_coupon" (
      "id" text PRIMARY KEY NOT NULL,
      "code" text NOT NULL UNIQUE,
      "influencer_name" text NOT NULL,
      "influencer_email" text NOT NULL DEFAULT '',
      "description" text NOT NULL DEFAULT '',
      "plan" text NOT NULL DEFAULT 'pro',
      "duration_days" integer NOT NULL DEFAULT 30,
      "discount_percent" integer NOT NULL DEFAULT 0,
      "max_uses" integer NOT NULL DEFAULT 100,
      "used_count" integer NOT NULL DEFAULT 0,
      "is_active" integer NOT NULL DEFAULT 1,
      "expires_at" integer,
      "created_at" integer NOT NULL,
      "updated_at" integer NOT NULL
    )`);

    await handle.client.execute(`CREATE TABLE IF NOT EXISTS "platform_coupon_redemption" (
      "id" text PRIMARY KEY NOT NULL,
      "coupon_id" text NOT NULL REFERENCES "platform_coupon"("id") ON DELETE CASCADE,
      "coupon_code" text NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "profile_id" text NOT NULL,
      "user_email" text NOT NULL DEFAULT '',
      "user_name" text NOT NULL DEFAULT '',
      "redeemed_at" integer NOT NULL
    )`);

    const coupCols = await handle.client.execute(`PRAGMA table_info("platform_coupon")`);
    const coupNames = new Set(coupCols.rows.map((r) => String(r.name)));
    if (!coupNames.has("discount_percent")) {
      await handle.client.execute(
        `ALTER TABLE "platform_coupon" ADD COLUMN "discount_percent" integer NOT NULL DEFAULT 0`
      );
    }
    return;
  }

  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "tiktok_handle" text NOT NULL DEFAULT ''`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "tiktok_url" text NOT NULL DEFAULT ''`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "youtube_handle" text NOT NULL DEFAULT ''`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "youtube_url" text NOT NULL DEFAULT ''`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "public_email" text NOT NULL DEFAULT ''`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "title_font_style" text NOT NULL DEFAULT 'jakarta'`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "name_font_style" text NOT NULL DEFAULT 'jakarta'`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "featured_animation" text NOT NULL DEFAULT 'shimmer'`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "social_display_style" text NOT NULL DEFAULT 'both'`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "plan" text NOT NULL DEFAULT 'free'`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "subscription_status" text NOT NULL DEFAULT 'inactive'`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "mp_payer_id" text NOT NULL DEFAULT ''`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "mp_preapproval_id" text NOT NULL DEFAULT ''`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "current_period_end" timestamp`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean NOT NULL DEFAULT false`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "is_suspended" boolean NOT NULL DEFAULT false`
  );
  await handle.pool.query(
    `ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "is_verified" boolean NOT NULL DEFAULT false`
  );
  await handle.pool.query(
    `ALTER TABLE "link_item" ADD COLUMN IF NOT EXISTS "is_featured" boolean NOT NULL DEFAULT false`
  );
  await handle.pool.query(
    `ALTER TABLE "link_item" ADD COLUMN IF NOT EXISTS "featured_label" text NOT NULL DEFAULT 'Destaque'`
  );
  await handle.pool.query(
    `ALTER TABLE "link_item" ADD COLUMN IF NOT EXISTS "featured_icon" text NOT NULL DEFAULT 'sparkles'`
  );
  await handle.pool.query(
    `ALTER TABLE "link_item" ADD COLUMN IF NOT EXISTS "expires_at" timestamp`
  );
  await handle.pool.query(
    `ALTER TABLE "abuse_report" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'open'`
  );
  await handle.pool.query(`CREATE TABLE IF NOT EXISTS "platform_coupon" (
    "id" text PRIMARY KEY NOT NULL,
    "code" text NOT NULL UNIQUE,
    "influencer_name" text NOT NULL,
    "influencer_email" text NOT NULL DEFAULT '',
    "description" text NOT NULL DEFAULT '',
    "plan" text NOT NULL DEFAULT 'pro',
    "duration_days" integer NOT NULL DEFAULT 30,
    "discount_percent" integer NOT NULL DEFAULT 0,
    "max_uses" integer NOT NULL DEFAULT 100,
    "used_count" integer NOT NULL DEFAULT 0,
    "is_active" boolean NOT NULL DEFAULT true,
    "expires_at" timestamp,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL
  )`);
  await handle.pool.query(`CREATE TABLE IF NOT EXISTS "platform_coupon_redemption" (
    "id" text PRIMARY KEY NOT NULL,
    "coupon_id" text NOT NULL REFERENCES "platform_coupon"("id") ON DELETE CASCADE,
    "coupon_code" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "profile_id" text NOT NULL,
    "user_email" text NOT NULL DEFAULT '',
    "user_name" text NOT NULL DEFAULT '',
    "redeemed_at" timestamp NOT NULL
  )`);
  await handle.pool.query(
    `ALTER TABLE "platform_coupon" ADD COLUMN IF NOT EXISTS "discount_percent" integer NOT NULL DEFAULT 0`
  );
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const handle = getDbHandle();
      if (handle.dialect === "sqlite") {
        for (const stmt of SQLITE_DDL) {
          await handle.client.execute(stmt);
        }
      } else {
        for (const stmt of PG_DDL) {
          await handle.pool.query(stmt);
        }
      }
      await runColumnMigrations();
      await seedShowcaseProfile();
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}
