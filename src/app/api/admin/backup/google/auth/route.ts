import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import { generateGoogleAuthUrl, getGoogleOAuthRedirectUri } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  try {
    const origin = request.nextUrl.origin;
    const redirectUri = getGoogleOAuthRedirectUri(origin);
    const state = Buffer.from(
      JSON.stringify({ userId: session.user.id, t: Date.now() })
    ).toString("base64url");

    const authUrl = generateGoogleAuthUrl(redirectUri, state);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(
      `${origin}/admin?tab=backups&google_error=${encodeURIComponent(msg)}`
    );
  }
}
