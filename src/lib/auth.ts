import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { getDbHandle } from "@/db";
import { sendTransactionalEmail } from "@/lib/email";

export function isGoogleOAuthEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function isInstagramOAuthEnabled(): boolean {
  return Boolean(
    process.env.INSTAGRAM_CLIENT_ID?.trim() && process.env.INSTAGRAM_CLIENT_SECRET?.trim()
  );
}

export function isAppleOAuthEnabled(): boolean {
  return Boolean(process.env.APPLE_CLIENT_ID?.trim() && process.env.APPLE_CLIENT_SECRET?.trim());
}

export function isDemoLoginEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_DEMO_LOGIN === "true";
}

function createAuthInstance() {
  const handle = getDbHandle();

  const socialProviders: {
    google?: { clientId: string; clientSecret: string };
    apple?: { clientId: string; clientSecret: string; appBundleIdentifier?: string };
  } = {};

  if (isGoogleOAuthEnabled()) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
    };
  }

  if (isAppleOAuthEnabled()) {
    socialProviders.apple = {
      clientId: process.env.APPLE_CLIENT_ID!.trim(),
      clientSecret: process.env.APPLE_CLIENT_SECRET!.trim(),
      appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER?.trim() || undefined,
    };
  }

  const plugins = [];

  if (isInstagramOAuthEnabled()) {
    const igClientId = process.env.INSTAGRAM_CLIENT_ID!.trim();
    const igClientSecret = process.env.INSTAGRAM_CLIENT_SECRET!.trim();

    plugins.push(
      genericOAuth({
        config: [
          {
            providerId: "instagram",
            name: "Instagram",
            authorizationUrl: "https://www.instagram.com/oauth/authorize",
            tokenUrl: "https://api.instagram.com/oauth/access_token",
            clientId: igClientId,
            clientSecret: igClientSecret,
            scopes: ["instagram_business_basic"],
            pkce: false,
            authentication: "post",
            getToken: async ({ code, redirectURI }) => {
              const body = new URLSearchParams({
                client_id: igClientId,
                client_secret: igClientSecret,
                grant_type: "authorization_code",
                redirect_uri: redirectURI,
                code,
              });
              const res = await fetch("https://api.instagram.com/oauth/access_token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: body.toString(),
              });
              if (!res.ok) {
                const detail = await res.text();
                throw new Error(`Instagram token exchange failed: ${detail}`);
              }
              const payload = (await res.json()) as {
                access_token?: string;
                user_id?: string | number;
                data?: Array<{ access_token?: string; user_id?: string | number }>;
              };
              const tokenData = payload.data?.[0] ?? payload;
              if (!tokenData.access_token) {
                throw new Error("Instagram access_token missing in response");
              }
              return {
                accessToken: tokenData.access_token,
                tokenType: "Bearer",
                raw: payload as Record<string, unknown>,
              };
            },
            getUserInfo: async (tokens) => {
              const url = new URL("https://graph.instagram.com/v21.0/me");
              url.searchParams.set("fields", "id,user_id,username,name,profile_picture_url");
              url.searchParams.set("access_token", tokens.accessToken ?? "");

              const res = await fetch(url.toString());
              if (!res.ok) {
                return null;
              }
              const data = (await res.json()) as {
                id?: string;
                user_id?: string;
                username?: string;
                name?: string;
                profile_picture_url?: string;
              };
              const stableId = String(data.user_id || data.id || "");
              if (!stableId) return null;
              const username = (data.username || stableId).replace(/^@+/, "");
              return {
                id: stableId,
                name: data.name || `@${username}`,
                email: `${username}@instagram.meucupom.local`,
                emailVerified: true,
                image: data.profile_picture_url,
                username,
              };
            },
          },
        ],
      })
    );
  }

  // Must remain the last plugin so Server Actions & Route Handlers set cookies properly.
  plugins.push(nextCookies());

  return betterAuth({
    secret:
      process.env.BETTER_AUTH_SECRET?.trim() ||
      "meucupom-local-dev-secret-change-me-in-production-2026",
    baseURL: process.env.BETTER_AUTH_URL?.trim() || undefined,
    trustedOrigins: async (request) => {
      const origins = new Set<string>([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://meucupom.bio",
        "https://www.meucupom.bio",
        "https://*.vercel.app",
      ]);

      const candidates = [
        process.env.BETTER_AUTH_URL?.trim(),
        process.env.NEXT_PUBLIC_APP_URL?.trim(),
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
        process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : undefined,
        process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : undefined,
      ];

      for (const item of candidates) {
        if (item) origins.add(item.replace(/\/+$/, ""));
      }

      if (request) {
        const originHeader = request.headers.get("origin")?.trim();
        const hostHeader =
          request.headers.get("x-forwarded-host")?.trim() ||
          request.headers.get("host")?.trim();
        if (originHeader && hostHeader) {
          try {
            const parsed = new URL(originHeader);
            if (parsed.host === hostHeader) {
              origins.add(parsed.origin);
            }
          } catch {
            // Ignore malformed origin header
          }
        }
      }

      return Array.from(origins);
    },
    database: drizzleAdapter(handle.db, {
      provider: handle.dialect === "pg" ? "pg" : "sqlite",
      schema: handle.schema,
    }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await sendTransactionalEmail({
          to: user.email,
          subject: "Redefinir sua senha no meucupom",
          text: `Olá, ${user.name || ""}! Use este link para redefinir sua senha no meucupom: ${url}`,
          html: `<p>Olá, <strong>${user.name || "criador"}</strong>!</p><p>Clique no botão abaixo para redefinir sua senha no <strong>meucupom</strong>:</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#1E60CF;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">Redefinir senha</a></p><p>Se não foi você, ignore este e-mail.</p>`,
        });
      },
    },
    socialProviders: Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    plugins,
  });
}

let cachedAuth: ReturnType<typeof createAuthInstance> | null = null;

export async function getAuth() {
  await ensureDatabaseReady();
  if (!cachedAuth) {
    cachedAuth = createAuthInstance();
  }
  return cachedAuth;
}
