import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getDailyAnalyticsForUser, getOrCreateProfileForUser } from "@/db/repository";
import { getAuth } from "@/lib/auth";
import { isProPlan } from "@/lib/plans";

export async function GET(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { profile } = await getOrCreateProfileForUser(session.user);
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") === "30" ? 30 : 7;
  const pro = isProPlan(profile);

  if (!pro) {
    return NextResponse.json({
      locked: true,
      days,
      points: [],
    });
  }

  const points = await getDailyAnalyticsForUser(session.user.id, days);
  return NextResponse.json({
    locked: false,
    days,
    points,
  });
}
