import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import {
  getGoogleDriveAccountRow,
  getGoogleDriveStatus,
  parseGoogleDriveConfig,
  saveGoogleDriveConnection,
} from "@/lib/google-drive";

export async function GET() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  try {
    const status = await getGoogleDriveStatus();
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erro ao obter status do Drive: ${msg}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const row = await getGoogleDriveAccountRow();
    if (!row) {
      return NextResponse.json({ error: "Google Drive não está conectado." }, { status: 400 });
    }

    const currentConfig = parseGoogleDriveConfig(row.idToken);
    const updatedConfig = {
      ...currentConfig,
      autoBackupEnabled:
        typeof body.autoBackupEnabled === "boolean"
          ? body.autoBackupEnabled
          : currentConfig.autoBackupEnabled,
      retentionCount:
        typeof body.retentionCount === "number" && body.retentionCount > 0
          ? body.retentionCount
          : currentConfig.retentionCount,
    };

    await saveGoogleDriveConnection({
      userId: row.userId,
      email: row.accountId,
      accessToken: row.accessToken || "",
      expiresIn: 3600,
      config: updatedConfig,
    });

    const status = await getGoogleDriveStatus();
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erro ao salvar configurações: ${msg}` }, { status: 500 });
  }
}
