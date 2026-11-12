import { put } from "@vercel/blob";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    // Vercel Blob not configured: tell client to fall back to compressed inline WebP data URL.
    return NextResponse.json({ mode: "inline", url: null });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Envie apenas arquivos de imagem." }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagem deve ter até 4 MB." }, { status: 400 });
  }

  const ext = file.type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "webp";
  const blob = await put(`avatars/${session.user.id}-${Date.now()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ mode: "blob", url: blob.url });
}
