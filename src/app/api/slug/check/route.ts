import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { checkSlugAvailability } from "@/db/repository";
import { getAuth } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit({ key: `slug:${ip}`, limit: 40, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get("slug") || "";
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  const result = await checkSlugAvailability(rawSlug, session?.user.id);
  return NextResponse.json(result);
}
