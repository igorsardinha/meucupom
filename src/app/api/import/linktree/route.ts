import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateProfileForUser, importLinktreeItemsForUser } from "@/db/repository";
import { getAuth } from "@/lib/auth";
import { fetchAndParseLinktree } from "@/lib/linktree";

const previewSchema = z.object({
  action: z.literal("preview"),
  url: z.string().min(1, "Informe a URL ou nome de usuário do Linktree"),
});

const importItemSchema = z.object({
  kind: z.enum(["coupon", "link", "divider"]),
  title: z.string().max(80),
  couponCode: z.string().max(50).optional().default(""),
  url: z.string().max(1000).optional().default(""),
  badge: z.string().max(10).optional(),
  tag: z.string().max(30).optional(),
  ctaLabel: z.string().max(60).optional(),
  description: z.string().max(180).optional(),
});

const importSchema = z.object({
  action: z.literal("import"),
  items: z.array(importItemSchema).min(1, "Selecione ao menos um item para importar"),
  importProfile: z.boolean().optional().default(false),
  profileData: z
    .object({
      avatarUrl: z.string().max(500).optional(),
      bio: z.string().max(220).optional(),
      instagramUrl: z.string().max(300).optional(),
      instagramHandle: z.string().max(50).optional(),
      tiktokUrl: z.string().max(300).optional(),
      tiktokHandle: z.string().max(50).optional(),
      youtubeUrl: z.string().max(300).optional(),
      youtubeHandle: z.string().max(60).optional(),
    })
    .optional(),
  replaceExisting: z.boolean().optional().default(false),
});

const requestSchema = z.discriminatedUnion("action", [previewSchema, importSchema]);

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
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Dados inválidos.";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }

  const data = parsed.data;

  if (data.action === "preview") {
    try {
      const parsedData = await fetchAndParseLinktree(data.url);
      return NextResponse.json({ ok: true, preview: parsedData });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao consultar o Linktree.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (data.action === "import") {
    const result = await importLinktreeItemsForUser(session.user.id, {
      items: data.items,
      importProfile: data.importProfile,
      profileData: data.profileData,
      replaceExisting: data.replaceExisting,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      profile: result.profile,
      items: result.items,
      importedCount: result.importedCount,
    });
  }

  return NextResponse.json({ error: "Ação não suportada." }, { status: 400 });
}
