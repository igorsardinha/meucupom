import { NextResponse } from "next/server";
import { z } from "zod";
import { recordProfileEvent } from "@/db/repository";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const trackSchema = z.object({
  slug: z.string().min(1).max(60),
  type: z.enum(["view", "click", "copy"]),
  itemId: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit({ key: `track:${ip}`, limit: 120, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordProfileEvent(parsed.data);
  return NextResponse.json({ ok: true });
}
