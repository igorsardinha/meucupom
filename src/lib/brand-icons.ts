import { isSafeMediaSrc } from "@/types/meucupom";

/**
 * Normaliza uma URL ou string de domínio para extrair um hostname limpo.
 * Funciona mesmo se a URL não tiver protocolo (ex: "gsuplementos.com.br").
 */
export function extractCleanDomain(urlOrDomain: string): string {
  if (!urlOrDomain || typeof urlOrDomain !== "string") return "";
  const trimmed = urlOrDomain.trim();
  if (!trimmed) return "";

  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const hostname = new URL(withProto).hostname.toLowerCase();
    return hostname.replace(/^www\./i, "");
  } catch {
    // Fallback via regex simples
    const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})/i);
    return match ? match[1].toLowerCase() : "";
  }
}

/**
 * Mapeamento de domínios encurtadores e links de afiliados para os domínios
 * reais das marcas parceiras.
 */
const AFFILIATE_DOMAIN_MAP: Record<string, string> = {
  "amzn.to": "amazon.com.br",
  "a.co": "amazon.com.br",
  "z.cn": "amazon.com.br",
  "shope.ee": "shopee.com.br",
  "shp.ee": "shopee.com.br",
  "meli.la": "mercadolivre.com.br",
  "mercadolivre.com": "mercadolivre.com.br",
  "magalu.me": "magazineluiza.com.br",
  "compre.vc": "netshoes.com.br",
  "shein.top": "shein.com",
  "aliexpress.ru": "aliexpress.com",
  "s.click.aliexpress.com": "aliexpress.com",
};

/**
 * Dicionário de marcas populares (especialmente nichos fitness, criadores, vestuário e grandes lojas).
 * Mapeia palavras-chave do título ou domínio para os domínios oficiais mais consistentes.
 */
const BRAND_KEYWORD_MAP: Array<{ keywords: string[]; domain: string }> = [
  { keywords: ["growth", "gsuplementos", "growth supplements"], domain: "gsuplementos.com.br" },
  { keywords: ["max titanium", "maxtitanium"], domain: "maxtitanium.com.br" },
  { keywords: ["integralmedica", "integral medica"], domain: "integralmedica.com.br" },
  { keywords: ["dux", "dux nutrition", "duxnutrition"], domain: "duxnutrition.com" },
  { keywords: ["probiotica", "probiótica"], domain: "probiotica.com.br" },
  { keywords: ["darkness"], domain: "darkness.com.br" },
  { keywords: ["insider", "insider store"], domain: "insiderstore.com.br" },
  { keywords: ["manual", "manual brasil"], domain: "manual.com.br" },
  { keywords: ["mith", "mith oficial", "mith nation"], domain: "mithoficial.com.br" },
  { keywords: ["army", "use army", "usearmy"], domain: "usearmy.com.br" },
  { keywords: ["nike"], domain: "nike.com.br" },
  { keywords: ["adidas"], domain: "adidas.com.br" },
  { keywords: ["puma"], domain: "puma.com.br" },
  { keywords: ["under armour"], domain: "underarmour.com.br" },
  { keywords: ["asics"], domain: "asics.com.br" },
  { keywords: ["olympikus"], domain: "olympikus.com.br" },
  { keywords: ["netshoes"], domain: "netshoes.com.br" },
  { keywords: ["centauro"], domain: "centauro.com.br" },
  { keywords: ["decathlon"], domain: "decathlon.com.br" },
  { keywords: ["amazon"], domain: "amazon.com.br" },
  { keywords: ["shopee"], domain: "shopee.com.br" },
  { keywords: ["mercado livre", "mercadolivre"], domain: "mercadolivre.com.br" },
  { keywords: ["magalu", "magazine luiza"], domain: "magazineluiza.com.br" },
  { keywords: ["shein"], domain: "shein.com" },
  { keywords: ["aliexpress"], domain: "aliexpress.com" },
  { keywords: ["ifood"], domain: "ifood.com.br" },
  { keywords: ["uber"], domain: "uber.com" },
  { keywords: ["spotify"], domain: "spotify.com" },
  { keywords: ["youtube"], domain: "youtube.com" },
  { keywords: ["strava"], domain: "strava.com" },
  { keywords: ["smart fit", "smartfit"], domain: "smartfit.com.br" },
  { keywords: ["bluefit"], domain: "bluefit.com.br" },
  { keywords: ["apple"], domain: "apple.com" },
  { keywords: ["samsung"], domain: "samsung.com" },
];

/**
 * Obtém a lista em cascata de URLs candidatas para a logo/ícone da marca.
 * O componente tenta carregar em ordem; se um serviço falhar, passa para o próximo.
 */
export function getBrandIconCandidates(
  title: string,
  url: string,
  customLogoUrl?: string
): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const push = (uri: string) => {
    const clean = uri.trim();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      candidates.push(clean);
    }
  };

  // 1. Logo manual informada pelo usuário (se válida)
  if (customLogoUrl && isSafeMediaSrc(customLogoUrl)) {
    push(customLogoUrl);
  }

  // 2. Extrai e normaliza domínio da URL
  let domain = extractCleanDomain(url);

  // Mapeia links encurtados/afiliados (ex: amzn.to -> amazon.com.br)
  if (domain && AFFILIATE_DOMAIN_MAP[domain]) {
    domain = AFFILIATE_DOMAIN_MAP[domain];
  }

  // 3. Busca por palavra-chave no título ou domínio
  const normalizedTitle = (title || "").toLowerCase();
  for (const entry of BRAND_KEYWORD_MAP) {
    const matched = entry.keywords.some((k) => {
      if (normalizedTitle.includes(k)) return true;
      if (domain && domain.includes(k.replace(/\s+/g, ""))) return true;
      return false;
    });
    if (matched) {
      // Adiciona o domínio canônico da marca à frente se for diferente
      if (entry.domain !== domain) {
        domain = domain || entry.domain;
        addDomainProviders(entry.domain, push);
      }
      break;
    }
  }

  // 4. Se tiver domínio identificado, adiciona provedores de alta fidelidade
  if (domain) {
    addDomainProviders(domain, push);

    // Se o domínio for um subdomínio (ex: loja.gsuplementos.com.br), adiciona também o domínio raiz
    const parts = domain.split(".");
    if (parts.length > 2) {
      const isComBr = domain.endsWith(".com.br") || domain.endsWith(".net.br") || domain.endsWith(".org.br");
      let rootDomain = "";
      if (isComBr && parts.length > 3) {
        rootDomain = parts.slice(parts.length - 3).join(".");
      } else if (!isComBr && parts.length > 2) {
        rootDomain = parts.slice(parts.length - 2).join(".");
      }
      if (rootDomain && rootDomain !== domain) {
        addDomainProviders(rootDomain, push);
      }
    }
  }

  return candidates;
}

/**
 * Adiciona fontes em cascata para um domínio específico:
 * 1. Unavatar (agrega Clearbit, Favicon, Apple Touch Icon, Twitter)
 * 2. DuckDuckGo Favicon Service (alta disponibilidade global, suporta .com.br)
 * 3. Google S2 Favicons (128px de alta resolução)
 * 4. Icon Horse
 */
function addDomainProviders(domain: string, push: (uri: string) => void) {
  const enc = encodeURIComponent(domain);
  // Unavatar
  push(`https://unavatar.io/${enc}?fallback=false`);
  // DuckDuckGo
  push(`https://icons.duckduckgo.com/ip3/${enc}.ico`);
  // Google S2
  push(`https://www.google.com/s2/favicons?domain=${enc}&sz=128`);
  // Icon Horse
  push(`https://icon.horse/icon/${enc}`);
}
