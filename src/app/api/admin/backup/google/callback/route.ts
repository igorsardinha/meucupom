import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import {
  exchangeCodeForTokens,
  getGoogleOAuthRedirectUri,
  getOrCreateBackupFolder,
  saveGoogleDriveConnection,
} from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${origin}/admin?tab=backups&google_error=${encodeURIComponent(
        `Autorização cancelada: ${error}`
      )}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/admin?tab=backups&google_error=${encodeURIComponent(
        "Nenhum código de autorização recebido do Google."
      )}`
    );
  }

  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.redirect(
      `${origin}/admin?tab=backups&google_error=${encodeURIComponent(
        "Sessão expirada. Faça login novamente como Super Admin."
      )}`
    );
  }

  try {
    const redirectUri = getGoogleOAuthRedirectUri(origin);
    const { accessToken, refreshToken, expiresIn, email } = await exchangeCodeForTokens(
      code,
      redirectUri
    );

    // Cria ou localiza a pasta "MeuCupom.bio Backups" no Google Drive
    const { folderId, webViewLink } = await getOrCreateBackupFolder(accessToken);

    await saveGoogleDriveConnection({
      userId: session.user.id,
      email,
      accessToken,
      refreshToken,
      expiresIn,
      config: {
        folderId,
        folderName: "MeuCupom.bio Backups",
        folderWebViewLink: webViewLink,
        autoBackupEnabled: true,
        retentionCount: 30,
        lastError: null,
      },
    });

    return NextResponse.redirect(
      `${origin}/admin?tab=backups&google=connected&email=${encodeURIComponent(email)}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      `${origin}/admin?tab=backups&google_error=${encodeURIComponent(msg)}`
    );
  }
}
