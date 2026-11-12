import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteLinkItemForUser, updateLinkItemForUser } from "@/db/repository";
import { getAuth } from "@/lib/auth";

const updateItemSchema = z.object({
  kind: z.enum(["coupon", "link", "divider"]).optional(),
  title: z.string().max(80).optional(),
  logoUrl: z.string().max(500).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  tag: z.string().max(30).optional(),
  description: z.string().max(180).optional(),
  couponCode: z.string().max(50).optional(),
  url: z.string().max(1000).optional(),
  ctaLabel: z.string().max(60).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados inválidos." },
      { status: 400 }
    );
  }

  const result = await updateLinkItemForUser(session.user.id, id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ item: result.item });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  await deleteLinkItemForUser(session.user.id, id);
  return NextResponse.json({ ok: true });
}
