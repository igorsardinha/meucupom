import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { CreatorProfileData, LinkItemData } from "@/types/meucupom";
import { computeInitials } from "@/types/meucupom";
import { getAppBaseUrl } from "@/lib/urls";

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

// Attached SVG Icon Paths (Speech Bubble with User Avatar for MeuCupom branding)
const SVG_VIEWBOX = "255 85 240 255";
const BUBBLE_PATH =
  "M269.092 176.466 C293.772 116.428 363.705 88.561 422.771 115.743 C436.718 122.161 449.537 131.332 459.757 142.845 C468.165 152.317 475.287 162.772 480.129 174.524 C486.201 189.263 489.573 205.086 489.385 221.054 C488.642 284.153 435.194 336.107 371.948 334.124 C358.164 333.692 344.21 330.823 331.44 325.592 C327.189 323.851 323.107 321.7 319.083 319.493 C317.476 318.612 315.558 316.82 313.745 316.501 C311.728 316.146 305.852 318.43 303.62 319.049 C295.123 321.404 286.726 324.111 278.248 326.527 C274.697 327.539 268.276 330.629 265.179 327.737 C261.745 324.531 265.031 318.139 266.346 314.379 C269.285 305.969 272.036 297.444 274.705 288.946 C275.355 286.878 277.359 282.286 277.487 280.43 C277.582 279.05 275.216 275.577 274.512 274.197 C271.928 269.13 269.529 264.101 267.467 258.795 C262.364 245.665 260.557 231.144 260.609 217.141 C260.659 203.361 263.867 189.175 269.092 176.466 Z";
const HEAD_PATH =
  "M374.459 150.868 C367.138 150.868 359.674 152.935 352.879 157.516 C347.115 161.403 342.325 166.575 339.255 172.87 C336.419 178.684 335.059 184.705 334.946 191.162 C334.835 197.525 336.815 204.086 339.794 209.647 C347.257 223.581 361.303 230.609 375.264 230.609 L375.264 230.609 C389.582 230.609 403.811 223.218 410.761 208.305 C413.279 202.902 414.7 197.083 414.792 191.11 C415.152 167.761 395.388 150.868 374.459 150.868 Z";
const BODY_PATH =
  "M352.034 241.731 C337.776 241.731 324.564 248.896 314.996 259.329 C311.599 263.033 308.877 267.168 306.684 271.685 C306.345 272.382 305.772 273.159 305.659 273.936 C305.467 275.247 311.159 280.86 312.318 282.019 C320.251 289.953 329.327 296.128 339.543 300.73 C345.622 303.468 352.062 305.202 358.585 306.475 C364.088 307.55 369.637 308.074 375.154 308.074 L375.154 308.074 C401.782 308.074 427.673 295.859 444.105 274.318 C442.045 270.244 439.927 266.217 437.129 262.584 C428.399 251.246 414.625 242.478 400.073 241.809 C399.632 241.789 399.193 241.78 398.757 241.78 L398.757 241.78 C393.916 241.78 389.374 242.957 384.585 243.684 C381.413 244.166 378.298 244.396 375.183 244.396 L375.183 244.396 C372.095 244.396 369.006 244.17 365.86 243.738 C362.013 243.209 358.286 242.012 354.389 241.796 C353.601 241.752 352.816 241.731 352.034 241.731 Z";

async function resolveAvatarSrc(avatarUrl?: string | null): Promise<string | null> {
  if (!avatarUrl) return null;
  const trimmed = avatarUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  // Local static file in /public
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    try {
      const publicPath = path.join(process.cwd(), "public", trimmed.replace(/^\/+/, ""));
      if (fs.existsSync(publicPath)) {
        const ext = path.extname(publicPath).toLowerCase().slice(1);
        const mime =
          ext === "png"
            ? "image/png"
            : ext === "webp"
            ? "image/webp"
            : ext === "svg"
            ? "image/svg+xml"
            : "image/jpeg";
        const buf = fs.readFileSync(publicPath);
        return `data:${mime};base64,${buf.toString("base64")}`;
      }
    } catch {
      // Fallback to absolute URL
    }
    const baseUrl = getAppBaseUrl();
    return `${baseUrl}${trimmed}`;
  }

  // Remote HTTP(S) URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const res = await fetch(trimmed, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "image/jpeg";
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        return `data:${contentType};base64,${buf.toString("base64")}`;
      }
    } catch {
      // Fallback to the URL itself
    }
    return trimmed;
  }

  return null;
}

export async function createCreatorOgImageResponse(
  profile: CreatorProfileData,
  items: LinkItemData[] = []
): Promise<ImageResponse> {
  const avatarSrc = await resolveAvatarSrc(profile.avatarUrl);
  const initials = computeInitials(profile.displayName || profile.slug || "MC");
  const itemsCount = items.length;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#070C14",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(30, 96, 207, 0.45) 0%, transparent 65%), radial-gradient(circle at 90% 100%, rgba(56, 189, 248, 0.18) 0%, transparent 50%)",
          padding: "44px 56px",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand Logo & Icon */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg
              viewBox={SVG_VIEWBOX}
              width="46"
              height="46"
              style={{ display: "flex" }}
            >
              <path d={BUBBLE_PATH} fill="#1E60CF" />
              <path d={HEAD_PATH} fill="#FFFFFF" />
              <path d={BODY_PATH} fill="#FFFFFF" />
            </svg>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
              <span>meucupom</span>
              <span style={{ color: "#38BDF8" }}>.bio</span>
            </div>
          </div>

          {/* Verified Official Profile Badge with Tick */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              borderRadius: 999,
              backgroundColor: "rgba(30, 96, 207, 0.22)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              color: "#7DD3FC",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" style={{ display: "flex" }}>
              <circle cx="12" cy="12" r="10" fill="#38BDF8" />
              <path
                d="M7.8 12.2l2.8 2.8 5.6-5.6"
                stroke="#070C14"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span>Perfil Verificado</span>
          </div>
        </div>

        {/* Center: Creator Avatar with Verified Tick Badge + Name + Bio */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            marginTop: 8,
            marginBottom: 8,
          }}
        >
          {/* Avatar with Verified Tick Stamp Badge */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            {/* Outer Avatar Ring */}
            <div
              style={{
                width: 194,
                height: 194,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #38BDF8 0%, #1E60CF 100%)",
                padding: 5,
                boxShadow: "0 12px 36px rgba(30, 96, 207, 0.45)",
              }}
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt={profile.displayName}
                  width={184}
                  height={184}
                  style={{
                    width: 184,
                    height: 184,
                    borderRadius: 999,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 184,
                    height: 184,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0E1624",
                    color: "#FFFFFF",
                    fontSize: 64,
                    fontWeight: 800,
                  }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Verified Tick Badge overlapping Avatar */}
            <div
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" width="56" height="56" style={{ display: "flex" }}>
                <circle cx="12" cy="12" r="11.5" fill="#070C14" />
                <circle cx="12" cy="12" r="9.5" fill="#1E60CF" />
                <path
                  d="M7.8 12.2l2.8 2.8 5.6-5.6"
                  stroke="#FFFFFF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>

          {/* Display Name */}
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
              marginBottom: 4,
            }}
          >
            {profile.displayName}
          </div>

          {/* Handle */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#38BDF8",
              marginBottom: 10,
            }}
          >
            @{profile.slug}
          </div>

          {/* Bio */}
          {profile.bio ? (
            <div
              style={{
                fontSize: 18,
                color: "#9CB3CE",
                maxWidth: 720,
                lineHeight: 1.35,
              }}
            >
              {profile.bio.length > 115 ? `${profile.bio.slice(0, 112)}...` : profile.bio}
            </div>
          ) : null}
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(148, 197, 255, 0.14)",
            paddingTop: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9CB3CE", fontSize: 16 }}>
            <span>🔥</span>
            <span style={{ fontWeight: 600, color: "#E2ECF7" }}>
              {itemsCount} {itemsCount === 1 ? "cupom ou link ativo" : "cupons e links ativos"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#38BDF8",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <span>meucupom.bio/{profile.slug}</span>
            <span>→</span>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
    }
  );
}
