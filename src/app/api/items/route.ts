import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createLinkItemForUser, getOrCreateProfileForUser } from "@/db/repository";
import { getAuth } from "@/lib/auth";

const createItemSchema = z
  .object({
    kind: z.enum(["coupon", "link", "divider"]).default("coupon"),
    title: z.string().max(80).optional().default(""),
    logoUrl: z.string().max(500).optional(),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    tag: z.string().max(30).optional(),
    description: z.string().max(180).optional(),
    couponCode: z.string().max(50).optional(),
    url: z.string().max(1000).optional().default(""),
    ctaLabel: z.string().max(60).optional(),
    isFeatured: z.boolean().optional(),
    featuredLabel: z.string().max(30).optional(),
    featuredIcon: z.string().max(30).optional(),
    expiresAt: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind !== "divider") {
      if (!data.title.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o nome da marca ou título do link.",
        });
      }
      if (!/^https?:\/\/.+/i.test(data.url.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe uma URL válida com https://",
        });
      }
    }
  });

export async function POST(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  await getOrCreateProfileForUser(session.user);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados inválidos." },
      { status: 400 }
    );
  }

  const result = await createLinkItemForUser(session.user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ item: result.item }, { status: 201 });
}
