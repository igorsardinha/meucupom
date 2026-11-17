import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import {
  executeGoogleDriveBackup,
  getGoogleDriveAccountRow,
  parseGoogleDriveConfig,
} from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  // 1. Validação de segurança: Vercel Cron Secret ou Super Admin
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  const isVercelCron =
    Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    request.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron) {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !isSuperAdminEmail(session.user.email)) {
      return NextResponse.json(
        { error: "Acesso não autorizado ao job de backup." },
        { status: 401 }
      );
    }
  }

  try {
    const row = await getGoogleDriveAccountRow();
    if (!row) {
      return NextResponse.json({
        ok: false,
        message: "Nenhuma conta do Google Drive conectada. O backup automático não foi executado.",
      });
    }

    const config = parseGoogleDriveConfig(row.idToken);
    if (!config.autoBackupEnabled) {
      return NextResponse.json({
        ok: true,
        message: "Backup automático está desativado nas preferências do Google Drive.",
      });
    }

    const result = await executeGoogleDriveBackup();
    return NextResponse.json({
      ok: result.ok,
      executedAt: new Date().toISOString(),
      result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Falha na execução do cron de backup: ${msg}` },
      { status: 500 }
    );
  }
}
