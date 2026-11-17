import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import {
  createDatabaseBackup,
  getDatabaseStats,
  restoreDatabaseBackup,
  validateBackupData,
} from "@/lib/backup";

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "stats") {
    try {
      const stats = await getDatabaseStats();
      const tables: Record<string, number> = {
        user: stats.user,
        session: stats.session,
        account: stats.account,
        verification: stats.verification,
        creator_profile: stats.creatorProfile,
        link_item: stats.linkItem,
        profile_event: stats.profileEvent,
        abuse_report: stats.abuseReport,
        platform_coupon: stats.platformCoupon,
        platform_coupon_redemption: stats.platformCouponRedemption,
      };
      return NextResponse.json({
        ok: true,
        stats: {
          ...stats,
          tables,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Erro ao obter estatísticas: ${msg}` }, { status: 500 });
    }
  }

  try {
    const backup = await createDatabaseBackup();
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `meucupom-backup-${dateStr}.json`;
    const json = JSON.stringify(backup, null, 2);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erro ao gerar backup: ${msg}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  try {
    let backupPayload: unknown = null;
    let mode: "clean" | "merge" = "clean";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const modeParam = formData.get("mode") as string | null;
      if (modeParam === "merge") {
        mode = "merge";
      }

      if (!file) {
        return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
      }

      const text = await file.text();
      try {
        backupPayload = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { error: "Arquivo corrompido ou formato JSON inválido." },
          { status: 400 }
        );
      }
    } else {
      const body = (await request.json().catch(() => null)) as {
        backup?: unknown;
        mode?: string;
      } | null;

      if (!body) {
        return NextResponse.json({ error: "Corpo da requisição vazio ou inválido." }, { status: 400 });
      }

      backupPayload = body.backup || body;
      if (body.mode === "merge") {
        mode = "merge";
      }
    }

    const validation = validateBackupData(backupPayload);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await restoreDatabaseBackup(validation.backup, mode);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      stats: result.stats,
      mode: result.mode,
      preRestoreSnapshotPath: result.preRestoreSnapshotPath,
      message: `Restauração concluída com sucesso! ${result.stats.totalRecords} registros importados.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erro interno na restauração: ${msg}` }, { status: 500 });
  }
}
