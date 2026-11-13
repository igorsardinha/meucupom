import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: "date" }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { mode: "date" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull(),
});

export const creatorProfile = pgTable("creator_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  initials: text("initials").notNull().default("MC"),
  avatarUrl: text("avatar_url").notNull().default(""),
  instagramHandle: text("instagram_handle").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  tiktokHandle: text("tiktok_handle").notNull().default(""),
  tiktokUrl: text("tiktok_url").notNull().default(""),
  youtubeHandle: text("youtube_handle").notNull().default(""),
  youtubeUrl: text("youtube_url").notNull().default(""),
  bio: text("bio").notNull().default(""),
  footerText: text("footer_text").notNull().default(""),
  sectionTitle: text("section_title").notNull().default("Parceiros & Cupons"),
  helperTip: text("helper_tip").notNull().default("Toque no cupom para copiar e acesse pelo link oficial."),
  layout: text("layout").notNull().default("classic"),
  themeMode: text("theme_mode").notNull().default("dark"),
  allowThemeToggle: boolean("allow_theme_toggle").notNull().default(true),
  bgStyle: text("bg_style").notNull().default("glow"),
  cardStyle: text("card_style").notNull().default("solid"),
  radiusStyle: text("radius_style").notNull().default("rounded"),
  fontStyle: text("font_style").notNull().default("jakarta"),
  titleFontStyle: text("title_font_style").notNull().default("jakarta"),
  nameFontStyle: text("name_font_style").notNull().default("jakarta"),
  featuredAnimation: text("featured_animation").notNull().default("shimmer"),
  socialDisplayStyle: text("social_display_style").notNull().default("both"),
  accentColor: text("accent_color").notNull().default("#38BDF8"),
  ctaColor: text("cta_color").notNull().default("#1E60CF"),
  bgColor: text("bg_color").notNull().default("#070C14"),
  cardColor: text("card_color").notNull().default("#0E1624"),
  textColor: text("text_color").notNull().default("#F4F8FD"),
  showBranding: boolean("show_branding").notNull().default(true),
  viewsCount: integer("views_count").notNull().default(0),
  plan: text("plan").notNull().default("free"),
  subscriptionStatus: text("subscription_status").notNull().default("inactive"),
  mpPayerId: text("mp_payer_id").notNull().default(""),
  mpPreapprovalId: text("mp_preapproval_id").notNull().default(""),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  isSuspended: boolean("is_suspended").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const linkItem = pgTable("link_item", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => creatorProfile.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("coupon"),
  title: text("title").notNull(),
  badge: text("badge").notNull().default(""),
  logoUrl: text("logo_url").notNull().default(""),
  accentColor: text("accent_color").notNull().default("#38BDF8"),
  tag: text("tag").notNull().default(""),
  description: text("description").notNull().default(""),
  couponCode: text("coupon_code").notNull().default(""),
  url: text("url").notNull(),
  ctaLabel: text("cta_label").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  featuredLabel: text("featured_label").notNull().default("Destaque"),
  featuredIcon: text("featured_icon").notNull().default("sparkles"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  clicksCount: integer("clicks_count").notNull().default(0),
  copiesCount: integer("copies_count").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const profileEvent = pgTable("profile_event", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => creatorProfile.id, { onDelete: "cascade" }),
  itemId: text("item_id").references(() => linkItem.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

export const abuseReport = pgTable("abuse_report", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").references(() => creatorProfile.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  reason: text("reason").notNull(),
  details: text("details").notNull().default(""),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

export const platformCoupon = pgTable("platform_coupon", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  influencerName: text("influencer_name").notNull(),
  influencerEmail: text("influencer_email").notNull().default(""),
  description: text("description").notNull().default(""),
  plan: text("plan").notNull().default("pro"),
  durationDays: integer("duration_days").notNull().default(30),
  discountPercent: integer("discount_percent").notNull().default(0),
  maxUses: integer("max_uses").notNull().default(100),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const platformCouponRedemption = pgTable("platform_coupon_redemption", {
  id: text("id").primaryKey(),
  couponId: text("coupon_id")
    .notNull()
    .references(() => platformCoupon.id, { onDelete: "cascade" }),
  couponCode: text("coupon_code").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  profileId: text("profile_id").notNull(),
  userEmail: text("user_email").notNull().default(""),
  userName: text("user_name").notNull().default(""),
  redeemedAt: timestamp("redeemed_at", { mode: "date" }).notNull(),
});
