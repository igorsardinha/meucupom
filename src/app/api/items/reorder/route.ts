import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { reorderLinkItemsForUser } from "@/db/repository";
import { getAuth } from "@/lib/auth";

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).max(200),
});

export async function POST(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Lista de IDs inválida." }, { status: 400 });
  }

  await reorderLinkItemsForUser(session.user.id, parsed.data.orderedIds);
  return NextResponse.json({ ok: true });
}
