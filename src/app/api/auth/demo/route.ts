import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { DEMO_USER_EMAIL, ensureDatabaseReady } from "@/db/bootstrap";
import { getDbHandle } from "@/db";
import { getAuth, isDemoLoginEnabled } from "@/lib/auth";

const DEMO_PASSWORD = "DemoMeuCupom!2026";

export async function POST(request: Request) {
  if (!isDemoLoginEnabled()) {
    return NextResponse.json({ error: "Login demo desativado em produção." }, { status: 403 });
  }

  await ensureDatabaseReady();
  const auth = await getAuth();
  const handle = getDbHandle();

  // Ensure the seeded demo user has a credential account so Better Auth issues a real signed session.
  const existingUsers =
    handle.dialect === "sqlite"
      ? await handle.db
          .select({ id: handle.schema.user.id })
          .from(handle.schema.user)
          .where(eq(handle.schema.user.email, DEMO_USER_EMAIL))
          .limit(1)
      : await handle.db
          .select({ id: handle.schema.user.id })
          .from(handle.schema.user)
          .where(eq(handle.schema.user.email, DEMO_USER_EMAIL))
          .limit(1);

  const demoUserId = existingUsers[0]?.id;

  if (demoUserId) {
    const existingCreds =
      handle.dialect === "sqlite"
        ? await handle.db
            .select({ id: handle.schema.account.id })
            .from(handle.schema.account)
            .where(
              and(
                eq(handle.schema.account.userId, demoUserId),
                eq(handle.schema.account.providerId, "credential")
              )
            )
            .limit(1)
        : await handle.db
            .select({ id: handle.schema.account.id })
            .from(handle.schema.account)
            .where(
              and(
                eq(handle.schema.account.userId, demoUserId),
                eq(handle.schema.account.providerId, "credential")
              )
            )
            .limit(1);

    if (existingCreds.length === 0) {
      const ctx = await auth.$context;
      const hashedPassword = await ctx.password.hash(DEMO_PASSWORD);
      const now = new Date();
      if (handle.dialect === "sqlite") {
        await handle.db.insert(handle.schema.account).values({
          id: crypto.randomUUID(),
          accountId: demoUserId,
          providerId: "credential",
          userId: demoUserId,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await handle.db.insert(handle.schema.account).values({
          id: crypto.randomUUID(),
          accountId: demoUserId,
          providerId: "credential",
          userId: demoUserId,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  const response = await auth.api.signInEmail({
    body: {
      email: DEMO_USER_EMAIL,
      password: DEMO_PASSWORD,
    },
    headers: request.headers,
    asResponse: true,
  });

  return response;
}
