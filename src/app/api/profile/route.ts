import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateProfileForUser, updateProfileForUser } from "@/db/repository";
import { getAuth } from "@/lib/auth";

const profilePatchSchema = z.object({
  slug: z.string().min(3).max(40).optional(),
  displayName: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().max(350000).optional(),
  instagramHandle: z.string().max(50).optional(),
  instagramUrl: z.string().max(500).optional(),
  tiktokHandle: z.string().max(50).optional(),
  tiktokUrl: z.string().max(500).optional(),
  bio: z.string().max(220).optional(),
  footerText: z.string().max(200).optional(),
  sectionTitle: z.string().max(60).optional(),
  helperTip: z.string().max(140).optional(),
  layout: z.enum(["classic", "compact"]).optional(),
  themeMode: z.enum(["dark", "light", "auto"]).optional(),
  allowThemeToggle: z.boolean().optional(),
  bgStyle: z
    .enum([
      "glow",
      "solid",
      "gradient",
      "mesh",
      "aurora",
      "spotlight",
      "dots",
      "waves",
      "zigzag",
      "scallop",
      "topo",
      "hexagons",
      "diamonds",
      "crosses",
      "confetti",
      "grid-lines",
      "sunset",
      "duotone",
      "orb",
    ])
    .optional(),
  cardStyle: z
    .enum([
      "solid",
      "glass",
      "outline",
      "brutal",
      "top-accent",
      "left-accent",
      "elevated",
      "dashed",
    ])
    .optional(),
  radiusStyle: z.enum(["rounded", "soft", "pill", "extra", "sharp"]).optional(),
  fontStyle: z
    .enum([
      "jakarta",
      "inter",
      "space",
      "outfit",
      "poppins",
      "dm-sans",
      "playfair",
      "syne",
      "montserrat",
      "lora",
    ])
    .optional(),
  titleFontStyle: z
    .enum([
      "jakarta",
      "inter",
      "space",
      "outfit",
      "poppins",
      "dm-sans",
      "playfair",
      "syne",
      "montserrat",
      "lora",
    ])
    .optional(),
  nameFontStyle: z
    .enum([
      "jakarta",
      "inter",
      "space",
      "outfit",
      "poppins",
      "dm-sans",
      "playfair",
      "syne",
      "montserrat",
      "lora",
    ])
    .optional(),
  featuredAnimation: z
    .enum(["shimmer", "pulse", "float", "bounce", "gradient-border", "none"])
    .optional(),
  socialDisplayStyle: z.enum(["both", "icon", "text"]).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  ctaColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  bgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  cardColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  showBranding: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export async function GET() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const data = await getOrCreateProfileForUser(session.user);
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
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

  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados inválidos." },
      { status: 400 }
    );
  }

  const result = await updateProfileForUser(session.user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ profile: result.profile });
}
