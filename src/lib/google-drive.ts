import { eq } from "drizzle-orm";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { getDbHandle } from "@/db";
import { createDatabaseBackup } from "./backup";

export interface GoogleDriveConfig {
  folderId: string | null;
  folderName: string;
  folderWebViewLink?: string | null;
  autoBackupEnabled: boolean;
  retentionCount: number;
  lastBackupAt: string | null;
  lastBackupStatus: "success" | "error" | null;
  lastBackupFileName: string | null;
  lastBackupFileId: string | null;
  lastBackupFileSize?: number;
  lastBackupWebViewLink?: string | null;
  lastError?: string | null;
}

export interface GoogleDriveStatus {
  connected: boolean;
  email: string | null;
  connectedAt: string | null;
  folderId: string | null;
  folderName: string;
  folderWebViewLink: string | null;
  autoBackupEnabled: boolean;
  retentionCount: number;
  lastBackupAt: string | null;
  lastBackupStatus: "success" | "error" | null;
  lastBackupFileName: string | null;
  lastBackupFileId: string | null;
  lastBackupFileSize?: number;
  lastBackupWebViewLink?: string | null;
  lastError: string | null;
  hasCredentialsConfigured: boolean;
  recentBackups?: Array<{
    id: string;
    name: string;
    createdTime: string;
    size?: string;
    webViewLink?: string;
  }>;
}

export const DEFAULT_GDRIVE_CONFIG: GoogleDriveConfig = {
  folderId: null,
  folderName: "MeuCupom.bio Backups",
  folderWebViewLink: null,
  autoBackupEnabled: true,
  retentionCount: 30,
  lastBackupAt: null,
  lastBackupStatus: null,
  lastBackupFileName: null,
  lastBackupFileId: null,
  lastBackupFileSize: 0,
  lastBackupWebViewLink: null,
  lastError: null,
};

/**
 * Obtém as credenciais do cliente Google (Client ID e Secret).
 */
export function getGoogleOAuthCredentials(): {
  clientId: string;
  clientSecret: string;
  isConfigured: boolean;
} {
  const clientId =
    process.env.GOOGLE_DRIVE_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret =
    process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    "";

  return {
    clientId,
    clientSecret,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

/**
 * Monta a URL de redirecionamento do OAuth do Google Drive.
 */
export function getGoogleOAuthRedirectUri(requestOrigin?: string): string {
  const base =
    requestOrigin ||
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://www.meucupom.bio";

  return `${base.replace(/\/$/, "")}/api/admin/backup/google/callback`;
}

/**
 * Gera a URL de consentimento do Google OAuth 2.0.
 */
export function generateGoogleAuthUrl(redirectUri: string, state: string): string {
  const { clientId, isConfigured } = getGoogleOAuthCredentials();
  if (!isConfigured) {
    throw new Error(
      "Credenciais do Google não configuradas. Preencha GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no ambiente."
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope:
      "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Troca o código de autorização pelos tokens de acesso e de atualização (refresh token).
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  email: string;
}> {
  const { clientId, clientSecret, isConfigured } = getGoogleOAuthCredentials();
  if (!isConfigured) {
    throw new Error("Credenciais do Google não configuradas.");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    const err = tokenJson.error_description || tokenJson.error || "Falha na troca de código OAuth.";
    throw new Error(`Google OAuth: ${err}`);
  }

  // Busca e-mail do usuário no Google
  let email = "admin@meucupom.bio";
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (userRes.ok) {
      const userJson = await userRes.json();
      if (userJson.email) email = userJson.email;
    }
  } catch {
    // Mantém fallback se userinfo falhar
  }

  return {
    accessToken: tokenJson.access_token,
    refreshToken: tokenJson.refresh_token || "",
    expiresIn: Number(tokenJson.expires_in) || 3600,
    email,
  };
}

/**
 * Atualiza o token de acesso utilizando o refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret, isConfigured } = getGoogleOAuthCredentials();
  if (!isConfigured) {
    throw new Error("Credenciais do Google não configuradas.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.access_token) {
    const err = json.error_description || json.error || "Falha ao renovar token do Google.";
    throw new Error(`Google OAuth Refresh: ${err}`);
  }

  return {
    accessToken: json.access_token,
    expiresIn: Number(json.expires_in) || 3600,
  };
}

/**
 * Retorna o registro da conta do Google Drive do banco de dados.
 */
export async function getGoogleDriveAccountRow() {
  await ensureDatabaseReady();
  const handle = getDbHandle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = handle.db as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = handle.schema as any;

  const rows = await anyDb
    .select()
    .from(schema.account)
    .where(eq(schema.account.providerId, "google_drive"))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0];
}

/**
 * Obtém a configuração de backup do Google Drive a partir da conta salva.
 */
export function parseGoogleDriveConfig(idToken: string | null): GoogleDriveConfig {
  if (!idToken) return { ...DEFAULT_GDRIVE_CONFIG };
  try {
    const parsed = JSON.parse(idToken);
    return { ...DEFAULT_GDRIVE_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_GDRIVE_CONFIG };
  }
}

/**
 * Salva ou atualiza a conexão do Google Drive no banco.
 */
export async function saveGoogleDriveConnection({
  userId,
  email,
  accessToken,
  refreshToken,
  expiresIn,
  config,
}: {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  config?: Partial<GoogleDriveConfig>;
}) {
  await ensureDatabaseReady();
  const handle = getDbHandle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = handle.db as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = handle.schema as any;

  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const existing = await getGoogleDriveAccountRow();

  const currentConfig = parseGoogleDriveConfig(existing?.idToken || null);
  const nextConfig: GoogleDriveConfig = {
    ...currentConfig,
    ...config,
  };

  if (existing) {
    const finalRefreshToken = refreshToken || existing.refreshToken;
    await anyDb
      .update(schema.account)
      .set({
        accountId: email || existing.accountId,
        accessToken,
        refreshToken: finalRefreshToken,
        accessTokenExpiresAt: expiresAt,
        idToken: JSON.stringify(nextConfig),
        updatedAt: new Date(),
      })
      .where(eq(schema.account.providerId, "google_drive"));
  } else {
    await anyDb.insert(schema.account).values({
      id: `gdrive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      providerId: "google_drive",
      accountId: email,
      accessToken,
      refreshToken: refreshToken || "",
      accessTokenExpiresAt: expiresAt,
      scope:
        "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email",
      idToken: JSON.stringify(nextConfig),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

/**
 * Desconecta a conta do Google Drive removendo o registro correspondente.
 */
export async function disconnectGoogleDrive(): Promise<void> {
  await ensureDatabaseReady();
  const handle = getDbHandle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = handle.db as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = handle.schema as any;

  await anyDb
    .delete(schema.account)
    .where(eq(schema.account.providerId, "google_drive"));
}

/**
 * Garante que o token de acesso seja válido, renovando-o se estiver perto de expirar.
 */
export async function getValidAccessToken(): Promise<{
  accessToken: string;
  email: string;
  config: GoogleDriveConfig;
}> {
  const row = await getGoogleDriveAccountRow();
  if (!row) {
    throw new Error("Nenhuma conta do Google Drive conectada no sistema.");
  }

  const config = parseGoogleDriveConfig(row.idToken);
  const nowMs = Date.now();
  const expiresMs = row.accessTokenExpiresAt
    ? new Date(row.accessTokenExpiresAt).getTime()
    : 0;

  // Se expirar em menos de 5 minutos (ou já expirou), renova
  if (expiresMs - nowMs < 5 * 60 * 1000) {
    if (!row.refreshToken) {
      throw new Error(
        "Token expirado e sem refresh token disponível. Reconecte o Google Drive no painel."
      );
    }

    const { accessToken, expiresIn } = await refreshAccessToken(row.refreshToken);
    await saveGoogleDriveConnection({
      userId: row.userId,
      email: row.accountId,
      accessToken,
      expiresIn,
      config,
    });

    return { accessToken, email: row.accountId, config };
  }

  return { accessToken: row.accessToken || "", email: row.accountId, config };
}

/**
 * Localiza ou cria a pasta "MeuCupom.bio Backups" no Google Drive.
 */
export async function getOrCreateBackupFolder(accessToken: string): Promise<{
  folderId: string;
  webViewLink: string | null;
}> {
  // 1. Procura pasta existente com esse nome que não esteja na lixeira
  const query = encodeURIComponent(
    "name = 'MeuCupom.bio Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=1`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.ok) {
    const json = await searchRes.json();
    if (json.files && json.files.length > 0) {
      return {
        folderId: json.files[0].id,
        webViewLink: json.files[0].webViewLink || null,
      };
    }
  }

  // 2. Se não encontrou, cria a pasta na raiz do Drive
  const createRes = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "MeuCupom.bio Backups",
        mimeType: "application/vnd.google-apps.folder",
        description: "Backups automáticos do banco de dados do meucupom.bio",
      }),
    }
  );

  const createJson = await createRes.json();
  if (!createRes.ok || !createJson.id) {
    throw new Error(
      `Erro ao criar pasta no Google Drive: ${createJson.error?.message || "Falha na requisição"}`
    );
  }

  return {
    folderId: createJson.id,
    webViewLink: createJson.webViewLink || null,
  };
}

/**
 * Lista os backups mais recentes salvos na pasta do Google Drive.
 */
export async function listDriveBackups(
  accessToken: string,
  folderId: string
): Promise<
  Array<{
    id: string;
    name: string;
    createdTime: string;
    size?: string;
    webViewLink?: string;
  }>
> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,createdTime,size,webViewLink)&pageSize=30`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) return [];
  const json = await res.json();
  return json.files || [];
}

/**
 * Remove backups antigos que excederem o limite de retenção configurado.
 */
export async function pruneOldDriveBackups(
  accessToken: string,
  folderId: string,
  retentionCount: number
): Promise<number> {
  if (retentionCount <= 0) return 0;

  const files = await listDriveBackups(accessToken, folderId);
  if (files.length <= retentionCount) return 0;

  const toDelete = files.slice(retentionCount);
  let deleted = 0;

  for (const f of toDelete) {
    try {
      const delRes = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (delRes.ok) deleted++;
    } catch {
      // Ignora erro individual para não travar
    }
  }

  return deleted;
}

/**
 * Executa o backup completo do banco de dados e envia para o Google Drive.
 */
export async function executeGoogleDriveBackup(): Promise<{
  ok: boolean;
  filename: string;
  fileId?: string;
  webViewLink?: string;
  folderWebViewLink?: string;
  size?: number;
  recordsCount: number;
  error?: string;
}> {
  const row = await getGoogleDriveAccountRow();
  if (!row) {
    return { ok: false, filename: "", recordsCount: 0, error: "Google Drive não conectado." };
  }

  let config = parseGoogleDriveConfig(row.idToken);

  try {
    // 1. Obtém token válido e atualizado
    const { accessToken, email } = await getValidAccessToken();

    // 2. Garante existência da pasta no Drive
    let folderId = config.folderId;
    let folderWebViewLink = config.folderWebViewLink;
    if (!folderId) {
      const folder = await getOrCreateBackupFolder(accessToken);
      folderId = folder.folderId;
      folderWebViewLink = folder.webViewLink;
      config = {
        ...config,
        folderId,
        folderWebViewLink,
      };
    }

    // 3. Gera snapshot dos dados
    const backup = await createDatabaseBackup();
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `meucupom-backup-${dateStr}.json`;
    const jsonContent = JSON.stringify(backup, null, 2);
    const byteSize = Buffer.byteLength(jsonContent, "utf8");

    // 4. Faz upload Multipart para o Google Drive
    const boundary = `-------meucupom_drive_${Date.now()}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: filename,
      parents: [folderId],
      mimeType: "application/json",
      description: `Backup do banco meucupom.bio (${backup.stats.totalRecords} registros).`,
    };

    const multipartBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      jsonContent +
      closeDelimiter;

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size,createdTime",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok || !uploadJson.id) {
      const errMsg =
        uploadJson.error?.message || uploadJson.error || "Erro no upload para o Google Drive.";
      throw new Error(errMsg);
    }

    // 5. Aplica política de retenção
    await pruneOldDriveBackups(accessToken, folderId, config.retentionCount || 30);

    // 6. Atualiza registro com o sucesso
    const nowIso = new Date().toISOString();
    const updatedConfig: GoogleDriveConfig = {
      ...config,
      folderId,
      folderWebViewLink,
      lastBackupAt: nowIso,
      lastBackupStatus: "success",
      lastBackupFileName: filename,
      lastBackupFileId: uploadJson.id,
      lastBackupFileSize: byteSize,
      lastBackupWebViewLink: uploadJson.webViewLink || null,
      lastError: null,
    };

    await saveGoogleDriveConnection({
      userId: row.userId,
      email,
      accessToken,
      expiresIn: 3600,
      config: updatedConfig,
    });

    return {
      ok: true,
      filename,
      fileId: uploadJson.id,
      webViewLink: uploadJson.webViewLink || undefined,
      folderWebViewLink: folderWebViewLink || undefined,
      size: byteSize,
      recordsCount: backup.stats.totalRecords,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const updatedConfig: GoogleDriveConfig = {
      ...config,
      lastBackupAt: new Date().toISOString(),
      lastBackupStatus: "error",
      lastError: errorMsg,
    };

    try {
      await saveGoogleDriveConnection({
        userId: row.userId,
        email: row.accountId,
        accessToken: row.accessToken || "",
        expiresIn: 3600,
        config: updatedConfig,
      });
    } catch {
      // Ignora erro ao salvar falha
    }

    return {
      ok: false,
      filename: "",
      recordsCount: 0,
      error: errorMsg,
    };
  }
}

/**
 * Retorna o status completo da integração com o Google Drive para o painel admin.
 */
export async function getGoogleDriveStatus(): Promise<GoogleDriveStatus> {
  const { isConfigured } = getGoogleOAuthCredentials();
  const row = await getGoogleDriveAccountRow();

  if (!row) {
    return {
      connected: false,
      email: null,
      connectedAt: null,
      folderId: null,
      folderName: "MeuCupom.bio Backups",
      folderWebViewLink: null,
      autoBackupEnabled: true,
      retentionCount: 30,
      lastBackupAt: null,
      lastBackupStatus: null,
      lastBackupFileName: null,
      lastBackupFileId: null,
      lastBackupFileSize: 0,
      lastBackupWebViewLink: null,
      lastError: null,
      hasCredentialsConfigured: isConfigured,
      recentBackups: [],
    };
  }

  const config = parseGoogleDriveConfig(row.idToken);
  let recentBackups: Array<{
    id: string;
    name: string;
    createdTime: string;
    size?: string;
    webViewLink?: string;
  }> = [];

  // Tenta listar os backups do drive se tiver pasta
  if (config.folderId) {
    try {
      const { accessToken } = await getValidAccessToken();
      recentBackups = await listDriveBackups(accessToken, config.folderId);
    } catch {
      // Continua mesmo se a listagem em tempo real falhar
    }
  }

  return {
    connected: true,
    email: row.accountId,
    connectedAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    folderId: config.folderId,
    folderName: config.folderName || "MeuCupom.bio Backups",
    folderWebViewLink: config.folderWebViewLink || null,
    autoBackupEnabled: config.autoBackupEnabled ?? true,
    retentionCount: config.retentionCount || 30,
    lastBackupAt: config.lastBackupAt,
    lastBackupStatus: config.lastBackupStatus,
    lastBackupFileName: config.lastBackupFileName,
    lastBackupFileId: config.lastBackupFileId,
    lastBackupFileSize: config.lastBackupFileSize,
    lastBackupWebViewLink: config.lastBackupWebViewLink,
    lastError: config.lastError || null,
    hasCredentialsConfigured: isConfigured,
    recentBackups,
  };
}
