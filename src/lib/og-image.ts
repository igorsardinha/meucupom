import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { CreatorProfileData } from "@/types/meucupom";
import { computeInitials } from "@/types/meucupom";

export const OG_IMAGE_SIZE = {
  width: 600,
  height: 600,
};

function generateFallbackSvg(displayName?: string): Buffer {
  const initials = computeInitials(displayName || "MeuCupom") || "MC";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="#0E1624"/>
      <circle cx="300" cy="300" r="230" fill="#1E60CF"/>
      <text x="300" y="365" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="180" font-weight="800" fill="#FFFFFF" text-anchor="middle">${initials}</text>
    </svg>
  `;
  return Buffer.from(svg);
}

export async function createCreatorAvatarImageResponse(
  profile?: CreatorProfileData | null
): Promise<Response> {
  let imageBuffer: Buffer | null = null;
  const avatarUrl = profile?.avatarUrl?.trim();

  if (avatarUrl) {
    if (avatarUrl.startsWith("data:image/")) {
      try {
        const parts = avatarUrl.split(",");
        if (parts[1]) {
          imageBuffer = Buffer.from(parts[1], "base64");
        }
      } catch {
        imageBuffer = null;
      }
    } else if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      try {
        const res = await fetch(avatarUrl, {
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          imageBuffer = Buffer.from(await res.arrayBuffer());
        }
      } catch {
        imageBuffer = null;
      }
    } else if (avatarUrl.startsWith("/") && !avatarUrl.startsWith("//")) {
      try {
        const publicPath = path.join(process.cwd(), "public", avatarUrl.replace(/^\/+/, ""));
        if (fs.existsSync(publicPath)) {
          imageBuffer = fs.readFileSync(publicPath);
        }
      } catch {
        imageBuffer = null;
      }
    }
  }

  try {
    let finalJpeg: Buffer;
    if (imageBuffer) {
      finalJpeg = await sharp(imageBuffer)
        .resize(600, 600, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 90 })
        .toBuffer();
    } else {
      const fallbackSvg = generateFallbackSvg(profile?.displayName);
      finalJpeg = await sharp(fallbackSvg)
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    return new Response(new Uint8Array(finalJpeg), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(finalJpeg.length),
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    const fallbackSvg = generateFallbackSvg(profile?.displayName);
    const fallbackJpeg = await sharp(fallbackSvg).jpeg({ quality: 90 }).toBuffer();
    return new Response(new Uint8Array(fallbackJpeg), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(fallbackJpeg.length),
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  }
}

// Backwards compatibility alias
export const createCreatorOgImageResponse = createCreatorAvatarImageResponse;
