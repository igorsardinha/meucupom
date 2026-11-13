import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      redirectTo?: string;
    };
    const email = body.email?.trim();
    if (!email) {
      return NextResponse.json({ error: "Informe o e-mail." }, { status: 400 });
    }

    const auth = await getAuth();
    const reqHeaders = await headers();
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      "https://meucupom.bio";

    const redirectTo = body.redirectTo || `${origin}/redefinir-senha`;

    await auth.api.requestPasswordReset({
      headers: reqHeaders,
      body: {
        email,
        redirectTo,
      },
    });

    return NextResponse.json({ ok: true, message: "Link enviado se o e-mail existir." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao processar recuperação de senha.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
