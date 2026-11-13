import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Copy,
  LayoutGrid,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandIcon } from "@/components/BrandIcon";
import { BrandLogo } from "@/components/BrandLogo";
import { PublicBioView } from "@/components/PublicBioView";
import { PLAN_CARDS } from "@/lib/plans";
import {
  NEUTRAL_SHOWCASE_ITEMS,
  NEUTRAL_SHOWCASE_PROFILE,
  NEUTRAL_SHOWCASE_SLUG,
} from "@/lib/showcase";

function ShowcasePhone() {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[32px] border-[5px] border-[#1A263A] bg-[#04070D] p-1 shadow-[0_28px_72px_rgba(2,6,14,0.75)] sm:max-w-[380px] sm:rounded-[36px] sm:border-[6px] sm:p-1.5">
      <div className="h-[560px] overflow-y-auto rounded-[26px] sm:h-[640px] sm:rounded-[28px]">
        <PublicBioView
          profile={NEUTRAL_SHOWCASE_PROFILE}
          items={NEUTRAL_SHOWCASE_ITEMS}
          previewMode
        />
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Copy,
    title: "Cópia em 1 toque no Instagram",
    description:
      "Fallback compatível com o navegador interno do Instagram e iOS para o seguidor copiar seu cupom sem falhas.",
  },
  {
    icon: Palette,
    title: "Personalize cores, fontes e tema",
    description:
      "Escolha temas prontos ou customize fundo, cards, cor de destaque, botões CTA e modo claro/escuro.",
  },
  {
    icon: LayoutGrid,
    title: "Link destaque e layouts",
    description:
      "Alterne entre lista clássica ou modo compacto, destaque seu link principal e combine cupons e links diretos.",
  },
  {
    icon: ShieldCheck,
    title: "Login com Google ou e-mail",
    description:
      "Entre rápido em segundos com segurança e comece a publicar seus cupons sem complicação.",
  },
  {
    icon: Sparkles,
    title: "Logos automáticas das marcas",
    description:
      "Basta colar o link oficial do parceiro que a logo é carregada automaticamente, com fallback em iniciais.",
  },
  {
    icon: BarChart3,
    title: "Métricas de cliques e cópias",
    description:
      "Veja quantas pessoas visitaram sua página, copiaram cada cupom e clicaram para comprar.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#070C14] text-[#F4F8FD] bg-[radial-gradient(circle_at_50%_-8%,rgba(47,108,181,0.34),transparent_48%),radial-gradient(circle_at_82%_20%,rgba(56,189,248,0.14),transparent_40%)]">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-2 sm:gap-3 transition hover:opacity-90"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1E60CF] to-[#145ca1] p-1.5 text-white shadow-lg shadow-[#1E60CF]/25 sm:h-10 sm:w-10">
            <BrandIcon className="h-full w-full" />
          </span>
          <BrandLogo className="h-5 sm:h-7 w-auto max-w-[150px] shrink-0 sm:max-w-none" />
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <Link
            href={`/${NEUTRAL_SHOWCASE_SLUG}`}
            className="hidden min-h-10 items-center rounded-full border border-[#94C5FF]/20 bg-white/5 px-4 text-sm font-semibold text-[#E2ECF7] transition hover:border-[#38BDF8]/50 md:inline-flex"
          >
            Ver exemplo
          </Link>
          <Link
            href="/entrar"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#1E60CF] px-3.5 text-xs font-bold text-white shadow-[0_6px_18px_rgba(30,96,207,0.35)] transition hover:bg-[#256EE8] sm:min-h-10 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <span>Entrar</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 pt-4 pb-20 sm:px-6 sm:pt-8 lg:pt-12">
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div>
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 py-1 pl-1.5 pr-3 text-[11px] font-bold text-[#7DD3FC] sm:text-xs">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1E60CF] p-1 text-white shadow sm:h-6 sm:w-6">
                <BrandIcon className="h-full w-full" />
              </span>
              <span className="truncate">meucupom.bio · Para o link da bio &amp; Stories</span>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.08]">
              Seus links e cupons de parceiros em uma página que{" "}
              <span className="bg-gradient-to-r from-[#38BDF8] to-[#60A5FA] bg-clip-text text-transparent">
                converte mais
              </span>
              .
            </h1>

            <p className="mt-4 max-w-[54ch] text-sm leading-relaxed text-[#9CB3CE] sm:mt-5 sm:text-lg sm:leading-relaxed">
              Inspirado em páginas de alta conversão para criadores e atletas: seu público copia o
              cupom com um toque, vê as logos oficiais das marcas e acessa seu link com visual
              personalizado por você.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-3.5">
              <Link
                href="/entrar"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1E60CF] px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(30,96,207,0.4)] transition hover:bg-[#256EE8] sm:min-h-[50px] sm:w-auto sm:text-base"
              >
                <span>Criar minha página grátis</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                href={`/${NEUTRAL_SHOWCASE_SLUG}`}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-[#94C5FF]/20 bg-[#0E1624] px-5 text-sm font-bold text-white transition hover:border-[#38BDF8]/50 sm:min-h-[50px] sm:w-auto sm:text-base"
              >
                <span>Ver modelo de página</span>
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#9CB3CE] sm:mt-6 sm:gap-4">
              <span>✓ Login com Google ou e-mail</span>
              <span>✓ Preview em tempo real</span>
              <span>✓ Sem código</span>
            </div>
          </div>

          <div className="mt-4 lg:mt-0">
            <ShowcasePhone />
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features-title" className="mt-16 sm:mt-20">
          <div className="mb-8 text-center">
            <h2 id="features-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Tudo o que um criador precisa para divulgar parceiros
            </h2>
            <p className="mt-2 text-sm text-[#9CB3CE] sm:text-base">
              Rápido para abrir no celular, bonito no DM do Instagram e fácil de personalizar.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <article
                  key={feat.title}
                  className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5 shadow-[0_12px_32px_rgba(2,6,14,0.35)]"
                >
                  <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-[#38BDF8]/30 bg-[#38BDF8]/12 text-[#38BDF8]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-white">{feat.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#9CB3CE]">
                    {feat.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Pricing */}
        <section id="planos" aria-labelledby="pricing-title" className="mt-16 sm:mt-20">
          <div className="mb-8 text-center">
            <h2 id="pricing-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Comece grátis e evolua quando precisar
            </h2>
            <p className="mt-2 text-sm text-[#9CB3CE] sm:text-base">
              Sem fidelidade. Cancele ou mude de plano a qualquer momento.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
            {PLAN_CARDS.map((plan) => {
              const isPro = plan.id === "pro";
              return (
                <article
                  key={plan.id}
                  className={`flex flex-col justify-between rounded-3xl border p-6 sm:p-7 ${
                    isPro
                      ? "border-[#38BDF8]/60 bg-gradient-to-b from-[#0F213B] to-[#0E1624] shadow-[0_18px_50px_rgba(30,96,207,0.28)]"
                      : "border-[#94C5FF]/14 bg-[#0E1624]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                      {isPro ? (
                        <span className="rounded-full bg-[#38BDF8]/20 px-3 py-0.5 text-xs font-extrabold text-[#7DD3FC]">
                          Mais popular
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm text-[#9CB3CE]">{plan.description}</p>

                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight text-white">
                        {plan.priceLabel}
                      </span>
                      <span className="text-sm font-semibold text-[#9CB3CE]">
                        {plan.periodLabel}
                      </span>
                    </div>

                    <ul className="mt-6 space-y-2.5 text-sm text-[#E2ECF7]">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#34D399]"
                            aria-hidden="true"
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/entrar"
                    className={`mt-7 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition ${
                      isPro
                        ? "bg-[#1E60CF] text-white shadow-lg hover:bg-[#256EE8]"
                        : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{isPro ? "Começar com Pro" : "Criar conta grátis"}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-xs text-[#9CB3CE]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#1E60CF] to-[#145ca1] p-1.5 text-white shadow-md">
              <BrandIcon className="h-full w-full" />
            </span>
            <BrandLogo className="h-5 w-auto" />
          </Link>
          <p>© 2026 meucupom.bio · Plataforma de links e cupons para criadores e atletas</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/termos" className="hover:text-white hover:underline">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-white hover:underline">
              Privacidade (LGPD)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
