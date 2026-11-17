import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import { disconnectGoogleDrive, getGoogleDriveStatus } from "@/lib/google-drive";

export async function POST() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  try {
    await disconnectGoogleDrive();
    const status = await getGoogleDriveStatus();
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erro ao desconectar: ${msg}` }, { status: 500 });
  }
}
