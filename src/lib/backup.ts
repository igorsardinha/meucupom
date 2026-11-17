import fs from "node:fs";
import path from "node:path";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { getDbHandle } from "@/db/index";

export interface DatabaseBackupStats {
  user: number;
  session: number;
  account: number;
  verification: number;
  creatorProfile: number;
  linkItem: number;
  profileEvent: number;
  abuseReport: number;
  platformCoupon: number;
  platformCouponRedemption: number;
  totalRecords: number;
}

export interface DatabaseBackup {
  version: "1.0";
  app: "meucupom.bio";
  exportedAt: string;
  dialect: "sqlite" | "pg";
  environment: string;
  stats: DatabaseBackupStats;
  data: {
    user: Array<Record<string, unknown>>;
    session: Array<Record<string, unknown>>;
    account: Array<Record<string, unknown>>;
    verification: Array<Record<string, unknown>>;
    creatorProfile: Array<Record<string, unknown>>;
    linkItem: Array<Record<string, unknown>>;
    profileEvent: Array<Record<string, unknown>>;
    abuseReport: Array<Record<string, unknown>>;
    platformCoupon: Array<Record<string, unknown>>;
    platformCouponRedemption: Array<Record<string, unknown>>;
  };
}

function toDateOrNull(val: unknown): Date | null {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "number" || typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toDate(val: unknown, fallback = new Date()): Date {
  const d = toDateOrNull(val);
  return d || fallback;
}

function toBoolean(val: unknown, fallback = false): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0") return false;
  }
  return fallback;
}

function toNumber(val: unknown, fallback = 0): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = Number(val);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}

function toString(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Retorna as estatísticas atuais de registros em cada tabela do banco de dados.
 */
export async function getDatabaseStats(): Promise<
  DatabaseBackupStats & { dialect: "sqlite" | "pg"; dbPath?: string }
> {
  await ensureDatabaseReady();
  const handle = getDbHandle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = handle.db as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = handle.schema as any;

  const [
    users,
    sessions,
    accounts,
    verifications,
    profiles,
    items,
    events,
    reports,
    coupons,
    redemptions,
  ] = await Promise.all([
    anyDb.select({ id: schema.user.id }).from(schema.user),
    anyDb.select({ id: schema.session.id }).from(schema.session),
    anyDb.select({ id: schema.account.id }).from(schema.account),
    anyDb.select({ id: schema.verification.id }).from(schema.verification),
    anyDb.select({ id: schema.creatorProfile.id }).from(schema.creatorProfile),
    anyDb.select({ id: schema.linkItem.id }).from(schema.linkItem),
    anyDb.select({ id: schema.profileEvent.id }).from(schema.profileEvent),
    anyDb.select({ id: schema.abuseReport.id }).from(schema.abuseReport),
    anyDb.select({ id: schema.platformCoupon.id }).from(schema.platformCoupon),
    anyDb.select({ id: schema.platformCouponRedemption.id }).from(schema.platformCouponRedemption),
  ]);

  const stats: DatabaseBackupStats = {
    user: users.length,
    session: sessions.length,
    account: accounts.length,
    verification: verifications.length,
    creatorProfile: profiles.length,
    linkItem: items.length,
    profileEvent: events.length,
    abuseReport: reports.length,
    platformCoupon: coupons.length,
    platformCouponRedemption: redemptions.length,
    totalRecords:
      users.length +
      sessions.length +
      accounts.length +
      verifications.length +
      profiles.length +
      items.length +
      events.length +
      reports.length +
      coupons.length +
      redemptions.length,
  };

  const rawUrl = process.env.DATABASE_URL?.trim() || "";
  return {
    ...stats,
    dialect: handle.dialect,
    dbPath: handle.dialect === "sqlite" ? rawUrl || "file:./data/meucupom.db" : undefined,
  };
}

/**
 * Gera um backup completo e estruturado de todas as tabelas da aplicação.
 */
export async function createDatabaseBackup(): Promise<DatabaseBackup> {
  await ensureDatabaseReady();
  const handle = getDbHandle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = handle.db as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = handle.schema as any;

  const [
    users,
    sessions,
    accounts,
    verifications,
    profiles,
    items,
    events,
    reports,
    coupons,
    redemptions,
  ] = await Promise.all([
    anyDb.select().from(schema.user),
    anyDb.select().from(schema.session),
    anyDb.select().from(schema.account),
    anyDb.select().from(schema.verification),
    anyDb.select().from(schema.creatorProfile),
    anyDb.select().from(schema.linkItem),
    anyDb.select().from(schema.profileEvent),
    anyDb.select().from(schema.abuseReport),
    anyDb.select().from(schema.platformCoupon),
    anyDb.select().from(schema.platformCouponRedemption),
  ]);

  const stats: DatabaseBackupStats = {
    user: users.length,
    session: sessions.length,
    account: accounts.length,
    verification: verifications.length,
    creatorProfile: profiles.length,
    linkItem: items.length,
    profileEvent: events.length,
    abuseReport: reports.length,
    platformCoupon: coupons.length,
    platformCouponRedemption: redemptions.length,
    totalRecords:
      users.length +
      sessions.length +
      accounts.length +
      verifications.length +
      profiles.length +
      items.length +
      events.length +
      reports.length +
      coupons.length +
      redemptions.length,
  };

  return {
    version: "1.0",
    app: "meucupom.bio",
    exportedAt: new Date().toISOString(),
    dialect: handle.dialect,
    environment: process.env.NODE_ENV || "development",
    stats,
    data: {
      user: users as Array<Record<string, unknown>>,
      session: sessions as Array<Record<string, unknown>>,
      account: accounts as Array<Record<string, unknown>>,
      verification: verifications as Array<Record<string, unknown>>,
      creatorProfile: profiles as Array<Record<string, unknown>>,
      linkItem: items as Array<Record<string, unknown>>,
      profileEvent: events as Array<Record<string, unknown>>,
      abuseReport: reports as Array<Record<string, unknown>>,
      platformCoupon: coupons as Array<Record<string, unknown>>,
      platformCouponRedemption: redemptions as Array<Record<string, unknown>>,
    },
  };
}

/**
 * Valida a estrutura e integridade do payload de backup.
 */
export function validateBackupData(
  payload: unknown
): { valid: true; backup: DatabaseBackup } | { valid: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Arquivo de backup inválido: formato não é um objeto JSON." };
  }

  const obj = payload as Partial<DatabaseBackup>;

  if (obj.app !== "meucupom.bio") {
    return {
      valid: false,
      error: `Arquivo não pertence a esta aplicação (app identificado: "${obj.app || "desconhecido"}").`,
    };
  }

  if (obj.version !== "1.0") {
    return {
      valid: false,
      error: `Versão de backup não suportada: "${obj.version || "desconhecida"}".`,
    };
  }

  if (!obj.data || typeof obj.data !== "object") {
    return { valid: false, error: "Arquivo de backup corrompido: campo 'data' ausente." };
  }

  const d = obj.data;
  if (!Array.isArray(d.user) || !Array.isArray(d.creatorProfile) || !Array.isArray(d.linkItem)) {
    return {
      valid: false,
      error: "Arquivo de backup corrompido: tabelas essenciais ausentes ou mal formatadas.",
    };
  }

  return {
    valid: true,
    backup: obj as DatabaseBackup,
  };
}

/**
 * Salva um snapshot de segurança em disco antes de aplicar uma restauração destrutiva.
 */
async function savePreRestoreSnapshot(): Promise<string | null> {
  try {
    const snapshot = await createDatabaseBackup();
    const backupDir = path.join(process.cwd(), "data", "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `pre-restore-${timestamp}.json`;
    const fullPath = path.join(backupDir, filename);
    fs.writeFileSync(fullPath, JSON.stringify(snapshot, null, 2), "utf-8");
    return fullPath;
  } catch (err) {
    console.warn("[Backup] Não foi possível salvar o snapshot pré-restauração:", err);
    return null;
  }
}

/**
 * Executa a restauração completa ou mesclagem dos dados do backup.
 */
export async function restoreDatabaseBackup(
  backup: DatabaseBackup,
  mode: "clean" | "merge" = "clean"
): Promise<
  | {
      ok: true;
      stats: DatabaseBackupStats;
      preRestoreSnapshotPath?: string | null;
      mode: "clean" | "merge";
    }
  | { ok: false; error: string }
> {
  await ensureDatabaseReady();
  const handle = getDbHandle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = handle.db as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = handle.schema as any;

  // 1. Gera snapshot preventivo em modo limpo (se houver dados existentes)
  let preRestoreSnapshotPath: string | null = null;
  if (mode === "clean") {
    preRestoreSnapshotPath = await savePreRestoreSnapshot();
  }

  const now = new Date();

  // 2. Sanitiza e mapeia os dados para formatos fortemente tipados
  const users = (backup.data.user || []).map((row) => ({
    id: toString(row.id),
    name: toString(row.name, "Usuário"),
    email: toString(row.email).toLowerCase(),
    emailVerified: toBoolean(row.emailVerified, false),
    image: row.image ? toString(row.image) : null,
    createdAt: toDate(row.createdAt, now),
    updatedAt: toDate(row.updatedAt, now),
  }));

  const verifications = (backup.data.verification || []).map((row) => ({
    id: toString(row.id),
    identifier: toString(row.identifier),
    value: toString(row.value),
    expiresAt: toDate(row.expiresAt, now),
    createdAt: toDate(row.createdAt, now),
    updatedAt: toDate(row.updatedAt, now),
  }));

  const accounts = (backup.data.account || []).map((row) => ({
    id: toString(row.id),
    accountId: toString(row.accountId),
    providerId: toString(row.providerId),
    userId: toString(row.userId),
    accessToken: row.accessToken ? toString(row.accessToken) : null,
    refreshToken: row.refreshToken ? toString(row.refreshToken) : null,
    idToken: row.idToken ? toString(row.idToken) : null,
    accessTokenExpiresAt: toDateOrNull(row.accessTokenExpiresAt),
    refreshTokenExpiresAt: toDateOrNull(row.refreshTokenExpiresAt),
    scope: row.scope ? toString(row.scope) : null,
    password: row.password ? toString(row.password) : null,
    createdAt: toDate(row.createdAt, now),
    updatedAt: toDate(row.updatedAt, now),
  }));

  const sessions = (backup.data.session || []).map((row) => ({
    id: toString(row.id),
    expiresAt: toDate(row.expiresAt, now),
    token: toString(row.token),
    createdAt: toDate(row.createdAt, now),
    updatedAt: toDate(row.updatedAt, now),
    ipAddress: row.ipAddress ? toString(row.ipAddress) : null,
    userAgent: row.userAgent ? toString(row.userAgent) : null,
    userId: toString(row.userId),
  }));

  const profiles = (backup.data.creatorProfile || []).map((row) => ({
    id: toString(row.id),
    userId: toString(row.userId),
    slug: toString(row.slug).toLowerCase(),
    displayName: toString(row.displayName, "Criador"),
    initials: toString(row.initials, "MC"),
    avatarUrl: toString(row.avatarUrl, ""),
    instagramHandle: toString(row.instagramHandle, ""),
    instagramUrl: toString(row.instagramUrl, ""),
    tiktokHandle: toString(row.tiktokHandle, ""),
    tiktokUrl: toString(row.tiktokUrl, ""),
    youtubeHandle: toString(row.youtubeHandle, ""),
    youtubeUrl: toString(row.youtubeUrl, ""),
    publicEmail: toString(row.publicEmail, ""),
    bio: toString(row.bio, ""),
    footerText: toString(row.footerText, ""),
    sectionTitle: toString(row.sectionTitle, "Parceiros & Cupons"),
    helperTip: toString(row.helperTip, "Toque no cupom para copiar e acesse pelo link oficial."),
    layout: toString(row.layout, "classic"),
    themeMode: toString(row.themeMode, "dark"),
    allowThemeToggle: toBoolean(row.allowThemeToggle, true),
    bgStyle: toString(row.bgStyle, "glow"),
    cardStyle: toString(row.cardStyle, "solid"),
    radiusStyle: toString(row.radiusStyle, "rounded"),
    fontStyle: toString(row.fontStyle, "jakarta"),
    titleFontStyle: toString(row.titleFontStyle, "jakarta"),
    nameFontStyle: toString(row.nameFontStyle, "jakarta"),
    featuredAnimation: toString(row.featuredAnimation, "shimmer"),
    socialDisplayStyle: toString(row.socialDisplayStyle, "both"),
    accentColor: toString(row.accentColor, "#38BDF8"),
    ctaColor: toString(row.ctaColor, "#1E60CF"),
    bgColor: toString(row.bgColor, "#070C14"),
    cardColor: toString(row.cardColor, "#0E1624"),
    textColor: toString(row.textColor, "#F4F8FD"),
    showBranding: toBoolean(row.showBranding, true),
    viewsCount: toNumber(row.viewsCount, 0),
    plan: toString(row.plan, "free"),
    subscriptionStatus: toString(row.subscriptionStatus, "inactive"),
    mpPayerId: toString(row.mpPayerId, ""),
    mpPreapprovalId: toString(row.mpPreapprovalId, ""),
    currentPeriodEnd: toDateOrNull(row.currentPeriodEnd),
    onboardingCompleted: toBoolean(row.onboardingCompleted, false),
    isSuspended: toBoolean(row.isSuspended, false),
    isVerified: toBoolean(row.isVerified, false),
    createdAt: toDate(row.createdAt, now),
    updatedAt: toDate(row.updatedAt, now),
  }));

  const coupons = (backup.data.platformCoupon || []).map((row) => ({
    id: toString(row.id),
    code: toString(row.code).toUpperCase(),
    influencerName: toString(row.influencerName, "Parceiro"),
    influencerEmail: toString(row.influencerEmail, ""),
    description: toString(row.description, ""),
    plan: toString(row.plan, "pro"),
    durationDays: toNumber(row.durationDays, 30),
    discountPercent: toNumber(row.discountPercent, 0),
    maxUses: toNumber(row.maxUses, 100),
    usedCount: toNumber(row.usedCount, 0),
    isActive: toBoolean(row.isActive, true),
    expiresAt: toDateOrNull(row.expiresAt),
    createdAt: toDate(row.createdAt, now),
    updatedAt: toDate(row.updatedAt, now),
  }));

  const items = (backup.data.linkItem || []).map((row) => ({
    id: toString(row.id),
    profileId: toString(row.profileId),
    kind: toString(row.kind, "coupon"),
    title: toString(row.title, "Item"),
    badge: toString(row.badge, ""),
    logoUrl: toString(row.logoUrl, ""),
    accentColor: toString(row.accentColor, "#38BDF8"),
    tag: toString(row.tag, ""),
    description: toString(row.description, ""),
    couponCode: toString(row.couponCode, ""),
    url: toString(row.url, "https://meucupom.bio"),
    ctaLabel: toString(row.ctaLabel, ""),
    sortOrder: toNumber(row.sortOrder, 0),
    isActive: toBoolean(row.isActive, true),
    isFeatured: toBoolean(row.isFeatured, false),
    featuredLabel: toString(row.featuredLabel, "Destaque"),
    featuredIcon: toString(row.featuredIcon, "sparkles"),
    expiresAt: toDateOrNull(row.expiresAt),
    clicksCount: toNumber(row.clicksCount, 0),
    copiesCount: toNumber(row.copiesCount, 0),
    createdAt: toDate(row.createdAt, now),
    updatedAt: toDate(row.updatedAt, now),
  }));

  const redemptions = (backup.data.platformCouponRedemption || []).map((row) => ({
    id: toString(row.id),
    couponId: toString(row.couponId),
    couponCode: toString(row.couponCode),
    userId: toString(row.userId),
    profileId: toString(row.profileId),
    userEmail: toString(row.userEmail, ""),
    userName: toString(row.userName, ""),
    redeemedAt: toDate(row.redeemedAt, now),
  }));

  const reports = (backup.data.abuseReport || []).map((row) => ({
    id: toString(row.id),
    profileId: row.profileId ? toString(row.profileId) : null,
    slug: toString(row.slug),
    reason: toString(row.reason, "outro"),
    details: toString(row.details, ""),
    status: toString(row.status, "open"),
    createdAt: toDate(row.createdAt, now),
  }));

  const events = (backup.data.profileEvent || []).map((row) => ({
    id: toString(row.id),
    profileId: toString(row.profileId),
    itemId: row.itemId ? toString(row.itemId) : null,
    eventType: toString(row.eventType, "view"),
    createdAt: toDate(row.createdAt, now),
  }));

  try {
    if (handle.dialect === "sqlite") {
      await handle.client.execute("PRAGMA foreign_keys = OFF");
      try {
        if (mode === "clean") {
          await handle.client.execute("DELETE FROM profile_event");
          await handle.client.execute("DELETE FROM abuse_report");
          await handle.client.execute("DELETE FROM link_item");
          await handle.client.execute("DELETE FROM platform_coupon_redemption");
          await handle.client.execute("DELETE FROM platform_coupon");
          await handle.client.execute("DELETE FROM creator_profile");
          await handle.client.execute("DELETE FROM session");
          await handle.client.execute("DELETE FROM account");
          await handle.client.execute("DELETE FROM verification");
          await handle.client.execute("DELETE FROM user");
        }

        // Inserção em lotes (50 por vez)
        for (const chunk of chunkArray(users, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.user).values(chunk);
        }
        for (const chunk of chunkArray(verifications, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.verification).values(chunk);
        }
        for (const chunk of chunkArray(accounts, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.account).values(chunk);
        }
        for (const chunk of chunkArray(sessions, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.session).values(chunk);
        }
        for (const chunk of chunkArray(profiles, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.creatorProfile).values(chunk);
        }
        for (const chunk of chunkArray(coupons, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.platformCoupon).values(chunk);
        }
        for (const chunk of chunkArray(items, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.linkItem).values(chunk);
        }
        for (const chunk of chunkArray(redemptions, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.platformCouponRedemption).values(chunk);
        }
        for (const chunk of chunkArray(reports, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.abuseReport).values(chunk);
        }
        for (const chunk of chunkArray(events, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.profileEvent).values(chunk);
        }
      } finally {
        await handle.client.execute("PRAGMA foreign_keys = ON");
      }
    } else {
      // PostgreSQL
      const client = await handle.pool.connect();
      try {
        await client.query("BEGIN");

        if (mode === "clean") {
          await client.query(
            'TRUNCATE TABLE "profile_event", "abuse_report", "link_item", "platform_coupon_redemption", "platform_coupon", "creator_profile", "session", "account", "verification", "user" CASCADE'
          );
        }

        for (const chunk of chunkArray(users, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.user).values(chunk);
        }
        for (const chunk of chunkArray(verifications, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.verification).values(chunk);
        }
        for (const chunk of chunkArray(accounts, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.account).values(chunk);
        }
        for (const chunk of chunkArray(sessions, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.session).values(chunk);
        }
        for (const chunk of chunkArray(profiles, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.creatorProfile).values(chunk);
        }
        for (const chunk of chunkArray(coupons, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.platformCoupon).values(chunk);
        }
        for (const chunk of chunkArray(items, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.linkItem).values(chunk);
        }
        for (const chunk of chunkArray(redemptions, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.platformCouponRedemption).values(chunk);
        }
        for (const chunk of chunkArray(reports, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.abuseReport).values(chunk);
        }
        for (const chunk of chunkArray(events, 50)) {
          if (chunk.length > 0) await anyDb.insert(schema.profileEvent).values(chunk);
        }

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    const stats: DatabaseBackupStats = {
      user: users.length,
      session: sessions.length,
      account: accounts.length,
      verification: verifications.length,
      creatorProfile: profiles.length,
      linkItem: items.length,
      profileEvent: events.length,
      abuseReport: reports.length,
      platformCoupon: coupons.length,
      platformCouponRedemption: redemptions.length,
      totalRecords:
        users.length +
        sessions.length +
        accounts.length +
        verifications.length +
        profiles.length +
        items.length +
        events.length +
        reports.length +
        coupons.length +
        redemptions.length,
    };

    return {
      ok: true,
      stats,
      preRestoreSnapshotPath,
      mode,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Backup] Erro ao restaurar banco de dados:", err);
    return { ok: false, error: `Falha na restauração: ${msg}` };
  }
}
