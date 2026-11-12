import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  adminUpdateReportStatus,
  getAdminOverviewData,
} from "@/db/repository";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";

const patchReportSchema = z.object({
  reportId: z.string().min(1),
  status: z.enum(["open", "resolved", "dismissed"]),
  suspendTarget: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!isSuperAdminEmail(session.user.email)) {
    return NextResponse.json(
      { error: "Acesso restrito ao Super Admin." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = patchReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  await adminUpdateReportStatus(parsed.data);
  const refreshed = await getAdminOverviewData();
  return NextResponse.json({ ok: true, data: refreshed });
}
