import { getPublicPageBySlug } from "@/db/repository";
import { sanitizeSlug } from "@/types/meucupom";
import { createCreatorAvatarImageResponse } from "@/lib/og-image";
import { NEUTRAL_SHOWCASE_PROFILE } from "@/lib/showcase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawSlug = url.searchParams.get("slug") || "";
  const decoded = decodeURIComponent(rawSlug);
  const clean = sanitizeSlug(decoded);

  const data = await getPublicPageBySlug(clean);
  if (!data) {
    return createCreatorAvatarImageResponse({
      ...NEUTRAL_SHOWCASE_PROFILE,
      id: "fallback",
      userId: "fallback",
      slug: clean || "meucupom",
      displayName: clean || "meucupom.bio",
      bio: "Crie sua página de links e cupons em minutos.",
      avatarUrl: "",
    });
  }

  return createCreatorAvatarImageResponse(data.profile);
}
