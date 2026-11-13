import { getPublicPageBySlug } from "@/db/repository";
import { sanitizeSlug } from "@/types/meucupom";
import { createCreatorOgImageResponse, OG_IMAGE_SIZE } from "@/lib/og-image";
import { NEUTRAL_SHOWCASE_PROFILE } from "@/lib/showcase";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug || "");
  const clean = sanitizeSlug(decoded);

  const data = await getPublicPageBySlug(clean);
  if (!data) {
    return createCreatorOgImageResponse({
      ...NEUTRAL_SHOWCASE_PROFILE,
      id: "fallback",
      userId: "fallback",
      slug: clean || "meucupom",
      displayName: clean || "meucupom.bio",
      bio: "Crie sua página de links e cupons em minutos.",
      avatarUrl: "",
    });
  }

  return createCreatorOgImageResponse(data.profile, data.items);
}
