import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PublicBioView } from "@/components/PublicBioView";
import { getPublicPageBySlug } from "@/db/repository";
import { getAppBaseUrl } from "@/lib/urls";
import { sanitizeSlug } from "@/types/meucupom";

function normalizeRouteSlug(raw: string): { decoded: string; clean: string } {
  const decoded = decodeURIComponent(raw);
  const clean = sanitizeSlug(decoded);
  return { decoded, clean };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { clean } = normalizeRouteSlug(slug);
  const data = await getPublicPageBySlug(clean);

  if (!data) {
    return {
      title: "Página não encontrada · meucupom",
    };
  }

  const { profile, items } = data;
  const activeCount = items.length;
  const description =
    profile.bio ||
    `Acesse os ${activeCount} links e cupons oficiais de ${profile.displayName}.`;

  const baseUrl = getAppBaseUrl();
  const ogImageUrl = `${baseUrl}/api/og?slug=${encodeURIComponent(clean)}`;

  return {
    title: `${profile.displayName} · Links e Cupons`,
    description,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: `${baseUrl}/${clean}`,
      siteName: "meucupom.bio",
      title: `${profile.displayName} · Links e Cupons`,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${profile.displayName} · Links e Cupons`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${profile.displayName} · Links e Cupons`,
      description,
      images: [ogImageUrl],
    },
  };
}

async function ProfileLoader({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const { decoded, clean } = normalizeRouteSlug(rawSlug);
  if (decoded.startsWith("@") && clean) {
    redirect(`/${clean}`);
  }

  const data = await getPublicPageBySlug(clean);
  if (!data) {
    notFound();
  }

  if (data.profile.isSuspended) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#070C14] px-4 text-center text-[#F4F8FD]">
        <div className="max-w-md rounded-3xl border border-red-400/25 bg-[#0E1624] p-7">
          <h1 className="text-xl font-extrabold">Página indisponível</h1>
          <p className="mt-2 text-sm text-[#9CB3CE]">
            Esta página foi suspensa por violar os Termos de Uso do meucupom.
          </p>
        </div>
      </div>
    );
  }

  return <PublicBioView profile={data.profile} items={data.items} />;
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#070C14] flex items-center justify-center text-sm text-[#9CB3CE]">
          Carregando cupons...
        </div>
      }
    >
      <ProfileLoader params={params} />
    </Suspense>
  );
}
