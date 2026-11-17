import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import { executeGoogleDriveBackup, getGoogleDriveStatus } from "@/lib/google-drive";

export async function POST() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  try {
    const result = await executeGoogleDriveBackup();
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Falha ao enviar backup para o Google Drive." },
        { status: 500 }
      );
    }

    const status = await getGoogleDriveStatus();
    return NextResponse.json({ ok: true, result, status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erro ao executar backup no Google Drive: ${msg}` },
      { status: 500 }
    );
  }
}
