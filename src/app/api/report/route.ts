import { NextResponse } from "next/server";
import { z } from "zod";
import { createAbuseReport } from "@/db/repository";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const reportSchema = z.object({
  slug: z.string().min(1).max(60),
  reason: z.string().min(3).max(80),
  details: z.string().max(500).optional().default(""),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit({ key: `report:${ip}`, limit: 5, windowSeconds: 3600 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Limite de denúncias atingido. Tente mais tarde." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados da denúncia inválidos." }, { status: 400 });
  }

  await createAbuseReport(parsed.data);
  return NextResponse.json({ ok: true });
}
