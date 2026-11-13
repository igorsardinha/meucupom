import { computeInitials, isSafeHttpUrl, isSafeMediaSrc } from "@/types/meucupom";

export interface LinktreeParsedProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  instagramUrl: string;
  instagramHandle: string;
  tiktokUrl: string;
  tiktokHandle: string;
  youtubeUrl: string;
  youtubeHandle: string;
}

export interface LinktreeParsedItem {
  id: string;
  kind: "coupon" | "link" | "divider";
  title: string;
  rawTitle: string;
  couponCode: string;
  url: string;
  badge: string;
  tag: string;
  ctaLabel: string;
  groupTitle?: string;
  selected?: boolean;
}

export interface LinktreeParsedData {
  username: string;
  profile: LinktreeParsedProfile;
  items: LinktreeParsedItem[];
  stats: {
    totalItems: number;
    couponsCount: number;
    linksCount: number;
    dividersCount: number;
  };
}

/**
 * Normaliza qualquer entrada (URL completa, link curto, handle @ ou apenas o slug)
 * retornando somente o username do Linktree.
 */
export function extractLinktreeUsername(input: string): string {
  if (!input) return "";
  let trimmed = input.trim();

  // Remove protocolo
  trimmed = trimmed.replace(/^https?:\/\//i, "");

  // Remove domínio linktr.ee ou linktree.com
  trimmed = trimmed.replace(/^(?:www\.)?(?:linktr\.ee|linktree\.com)\//i, "");

  // Remove @ inicial
  trimmed = trimmed.replace(/^@+/, "");

  // Remove query params e hash
  trimmed = trimmed.split("?")[0].split("#")[0];

  // Remove barras e pega o primeiro segmento
  trimmed = trimmed.replace(/^\/+|\/+$/g, "");
  const slug = trimmed.split("/")[0].trim();

  // Sanitiza para manter apenas caracteres permitidos em usernames do Linktree
  return slug.replace(/[^a-zA-Z0-9._\-]/g, "");
}

/**
 * Detecta se o título contém indicação de código de cupom de desconto
 * (palavras-chave como "cupom", "código" ou emojis como 🏷️ e 🎟️)
 * e separa o nome limpo da loja / marca e o código do cupom.
 */
export function extractCouponFromTitle(rawTitle: string): {
  kind: "coupon" | "link";
  title: string;
  couponCode: string;
} {
  const original = (rawTitle || "").trim();
  if (!original) {
    return { kind: "link", title: "", couponCode: "" };
  }

  const emojiGroup = "(?:🏷\uFE0F?|🎟\uFE0F?|🎫)";
  const textKeywords = "(?:cupom|código|codigo|cód|cod|use(?:\\s+o\\s+cupom)?|desconto)";

  // Verifica se inicia com emoji de cupom/etiqueta
  const leadingEmojiMatch = original.match(new RegExp(`^${emojiGroup}\\s*`, "iu"));
  const hadLeadingEmoji = Boolean(leadingEmojiMatch);
  const cleanStart = leadingEmojiMatch
    ? original.slice(leadingEmojiMatch[0].length).trim()
    : original;

  // 1. Parênteses ou colchetes: "Marca (🏷️ CODIGO)", "Marca [Cupom: CODIGO]", "Marca (🎟️ CODIGO)"
  const bracketRegex = new RegExp(
    `^(.*?)\\s*[([{]\\s*(?:${emojiGroup}\\s*|${textKeywords}\\s*[:=]?\\s*|${emojiGroup}\\s*${textKeywords}\\s*[:=]?\\s*)([A-Za-z0-9_.\\-%]+)\\s*[)}\\]]\\s*$`,
    "iu"
  );
  const brkMatch = cleanStart.match(bracketRegex);
  if (brkMatch) {
    const cleanTitle = brkMatch[1]
      .trim()
      .replace(/^[-|–—•·/:]+/, "")
      .replace(/[-|–—•·/:]+$/, "")
      .trim();
    const couponCode = brkMatch[2].trim().toUpperCase();
    if (cleanTitle && couponCode) {
      return { kind: "coupon", title: cleanTitle, couponCode };
    }
  }

  // 2. Delimitador ou espaço seguido de emoji: "Marca | 🏷️ CODIGO", "Marca 🎟️ CODIGO", "Marca 🏷️ Cupom: CODIGO"
  const emojiRegex = new RegExp(
    `^(.*?)(?:\\s*[-|–—•·/:]\\s*|\\s+)${emojiGroup}\\s*(?:${textKeywords}\\s*[:=]?\\s*|[:=]\\s*)?([A-Za-z0-9_.\\-%]+)\\s*$`,
    "iu"
  );
  const emojiMatch = cleanStart.match(emojiRegex);
  if (emojiMatch) {
    const cleanTitle = emojiMatch[1]
      .trim()
      .replace(/^[-|–—•·/:]+/, "")
      .replace(/[-|–—•·/:]+$/, "")
      .trim();
    const couponCode = emojiMatch[2].trim().toUpperCase();
    if (cleanTitle && couponCode) {
      return { kind: "coupon", title: cleanTitle, couponCode };
    }
  }

  // 3. Delimitador seguido de palavra-chave: "Marca | Cupom: CODIGO", "Marca - Código CODIGO"
  const delRegex = new RegExp(
    `^(.*?)\\s*[-|–—•·/]\\s*${textKeywords}\\s*[:=]?\\s*([A-Za-z0-9_.\\-%]+)\\s*$`,
    "iu"
  );
  const delMatch = cleanStart.match(delRegex);
  if (delMatch) {
    const cleanTitle = delMatch[1].trim().replace(/^[-|–—•·/:]+/, "").trim();
    const couponCode = delMatch[2].trim().toUpperCase();
    if (cleanTitle && couponCode) {
      return { kind: "coupon", title: cleanTitle, couponCode };
    }
  }

  // 4. Palavra-chave + dois pontos no final: "Marca Cupom: CODIGO"
  const endRegex = new RegExp(
    `^(.*?)\\s+${textKeywords}\\s*[:=]\\s*([A-Za-z0-9_.\\-%]+)\\s*$`,
    "iu"
  );
  const endMatch = cleanStart.match(endRegex);
  if (endMatch) {
    const cleanTitle = endMatch[1].trim().replace(/^[-|–—•·/:]+/, "").trim();
    const couponCode = endMatch[2].trim().toUpperCase();
    if (cleanTitle && couponCode) {
      return { kind: "coupon", title: cleanTitle, couponCode };
    }
  }

  // 5. Caso com emoji inicial e separador: "🏷️ Nome da Loja: CODIGO" ou "🎟️ Nome da Loja - CODIGO"
  if (hadLeadingEmoji) {
    const splitMatch = cleanStart.match(/^(.*?)\s*[:\-|–—•·/]\s*([A-Za-z0-9_.\-%]+)\s*$/iu);
    if (splitMatch) {
      const cleanTitle = splitMatch[1].trim();
      const couponCode = splitMatch[2].trim().toUpperCase();
      if (cleanTitle && couponCode) {
        return { kind: "coupon", title: cleanTitle, couponCode };
      }
    }

    // Apenas emoji e código: "🏷️ CODIGO" ou "🎟️ CUPOM10"
    const standaloneMatch = cleanStart.match(
      new RegExp(`^(?:${textKeywords}\\s*[:=]?\\s*)?([A-Za-z0-9_.\-%]+)$`, "iu")
    );
    if (standaloneMatch) {
      const couponCode = standaloneMatch[1].trim().toUpperCase();
      return { kind: "coupon", title: `Cupom ${couponCode}`, couponCode };
    }
  }

  return { kind: "link", title: original, couponCode: "" };
}

/**
 * Extrai handle a partir da URL da rede social
 */
function extractHandleFromUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/+|\/+$/g, "");
    const segment = path.split("/")[0] || "";
    if (segment) {
      return segment.startsWith("@") ? segment : `@${segment}`;
    }
  } catch {
    // fallback
  }
  return "";
}

interface RawLinktreeLink {
  id?: string | number;
  type?: string;
  title?: string;
  url?: string;
  position?: number;
  parent?: { id?: string | number } | null;
}

/**
 * Faz a busca e a conversão do perfil e links públicos do Linktree.
 */
export async function fetchAndParseLinktree(
  usernameOrUrl: string
): Promise<LinktreeParsedData> {
  const username = extractLinktreeUsername(usernameOrUrl);
  if (!username) {
    throw new Error(
      "Nome de usuário ou URL do Linktree inválida. Exemplo: https://linktr.ee/seunome"
    );
  }

  const targetUrl = `https://linktr.ee/${username}`;
  let response: Response;

  try {
    response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      next: { revalidate: 0 },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Falha na conexão com o Linktree: ${msg}`);
  }

  if (response.status === 404) {
    throw new Error(
      `Perfil "${username}" não encontrado no Linktree. Verifique se o endereço foi digitado corretamente.`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Não foi possível acessar a página do Linktree (status HTTP ${response.status}). Tente novamente mais tarde.`
    );
  }

  const html = await response.text();

  // Extrai o script __NEXT_DATA__
  const nextDataMatch = html.match(
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );

  if (!nextDataMatch || !nextDataMatch[1]) {
    throw new Error(
      "Não foi possível extrair os dados da página do Linktree. O formato da página pode ter mudado."
    );
  }

  let nextData: Record<string, unknown>;
  try {
    nextData = JSON.parse(nextDataMatch[1]) as Record<string, unknown>;
  } catch {
    throw new Error("Erro ao interpretar os dados JSON do Linktree.");
  }

  const props = (nextData.props || {}) as Record<string, unknown>;
  const pageProps = (props.pageProps || {}) as Record<string, unknown>;
  const account = (pageProps.account || {}) as Record<string, unknown>;

  // Informações de Perfil
  const displayName = String(
    pageProps.pageTitle ||
      account.pageTitle ||
      pageProps.username ||
      account.username ||
      username
  ).trim();

  const bio = String(
    pageProps.description || account.description || ""
  ).trim();

  const rawAvatarUrl = String(
    pageProps.customAvatar ||
      pageProps.profilePictureUrl ||
      account.customAvatar ||
      account.profilePictureUrl ||
      ""
  ).trim();
  const avatarUrl = isSafeMediaSrc(rawAvatarUrl) ? rawAvatarUrl : "";

  // Redes Sociais
  const rawSocials = (pageProps.socialLinks || account.socialLinks || []) as Array<{
    type?: string;
    url?: string;
  }>;

  let instagramUrl = "";
  let tiktokUrl = "";
  let youtubeUrl = "";

  for (const s of rawSocials) {
    const type = String(s.type || "").toUpperCase();
    const url = String(s.url || "").trim();
    if (!isSafeHttpUrl(url)) continue;

    if (type.includes("INSTAGRAM") && !instagramUrl) {
      instagramUrl = url;
    } else if (type.includes("TIKTOK") && !tiktokUrl) {
      tiktokUrl = url;
    } else if (type.includes("YOUTUBE") && !youtubeUrl) {
      youtubeUrl = url;
    }
  }

  const profile: LinktreeParsedProfile = {
    username,
    displayName,
    bio,
    avatarUrl,
    instagramUrl,
    instagramHandle: extractHandleFromUrl(instagramUrl),
    tiktokUrl,
    tiktokHandle: extractHandleFromUrl(tiktokUrl),
    youtubeUrl,
    youtubeHandle: extractHandleFromUrl(youtubeUrl),
  };

  // Links e Grupos
  const rawLinks = (pageProps.links || account.links || []) as RawLinktreeLink[];

  const rootItems: RawLinktreeLink[] = [];
  const childrenByParentId = new Map<string, RawLinktreeLink[]>();

  for (const item of rawLinks) {
    if (!item) continue;
    const parentId =
      item.parent?.id !== undefined && item.parent?.id !== null
        ? String(item.parent.id)
        : null;

    if (parentId) {
      const list = childrenByParentId.get(parentId) || [];
      list.push(item);
      childrenByParentId.set(parentId, list);
    } else {
      rootItems.push(item);
    }
  }

  // Ordena itens raiz por posição
  rootItems.sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));

  // Ordena filhos por posição
  for (const list of childrenByParentId.values()) {
    list.sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
  }

  // Lista linear mantendo grupos e seus respectivos links
  const parsedItems: LinktreeParsedItem[] = [];

  const processLink = (link: RawLinktreeLink, groupTitle?: string) => {
    const rawTitle = String(link.title || "").trim();
    const url = String(link.url || "").trim();

    if (!rawTitle && !url) return;

    const { kind, title, couponCode } = extractCouponFromTitle(rawTitle);
    const cleanTitle = title || rawTitle || "Link";

    parsedItems.push({
      id: String(link.id || Math.random().toString(36).slice(2)),
      kind,
      title: cleanTitle.slice(0, 80),
      rawTitle,
      couponCode: couponCode.slice(0, 50),
      url: isSafeHttpUrl(url) ? url : "",
      badge: computeInitials(cleanTitle),
      tag: kind === "coupon" ? "Cupom" : "Link",
      ctaLabel: kind === "coupon" ? "Copiar cupom" : `Ir para ${cleanTitle.slice(0, 30)}`,
      groupTitle,
      selected: true,
    });
  };

  for (const root of rootItems) {
    const isGroup = String(root.type || "").toUpperCase() === "GROUP";

    if (isGroup) {
      const groupTitle = String(root.title || "Seção").trim().slice(0, 80);
      parsedItems.push({
        id: String(root.id || Math.random().toString(36).slice(2)),
        kind: "divider",
        title: groupTitle,
        rawTitle: groupTitle,
        couponCode: "",
        url: "",
        badge: "",
        tag: "",
        ctaLabel: "",
        selected: true,
      });

      const children = childrenByParentId.get(String(root.id)) || [];
      for (const child of children) {
        processLink(child, groupTitle);
      }
      childrenByParentId.delete(String(root.id));
    } else {
      processLink(root);
    }
  }

  // Se restaram filhos órfãos por algum motivo
  for (const [, children] of childrenByParentId.entries()) {
    for (const child of children) {
      processLink(child);
    }
  }

  const couponsCount = parsedItems.filter((it) => it.kind === "coupon").length;
  const linksCount = parsedItems.filter((it) => it.kind === "link").length;
  const dividersCount = parsedItems.filter((it) => it.kind === "divider").length;

  return {
    username,
    profile,
    items: parsedItems,
    stats: {
      totalItems: parsedItems.length,
      couponsCount,
      linksCount,
      dividersCount,
    },
  };
}
