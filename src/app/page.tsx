import { Suspense } from "react";
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
import { PublicBioView } from "@/components/PublicBioView";
import { getPublicPageBySlug } from "@/db/repository";
import { PLAN_CARDS } from "@/lib/plans";

async function ShowcasePhone() {
  const data = await getPublicPageBySlug("igorsardinha");
  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[380px] rounded-[36px] border-[6px] border-[#1A263A] bg-[#04070D] p-1.5 shadow-[0_28px_72px_rgba(2,6,14,0.75)]">
      <div className="h-[640px] overflow-y-auto rounded-[28px]">
        <PublicBioView profile={data.profile} items={data.items} previewMode />
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
    title: "Login com Google, Apple ou e-mail",
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
    <div className="min-h-dvh bg-[#070C14] text-[#F4F8FD] bg-[radial-gradient(circle_at_50%_-8%,rgba(47,108,181,0.34),transparent_48%),radial-gradient(circle_at_82%_20%,rgba(56,189,248,0.14),transparent_40%)]">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#1E60CF] to-[#38BDF8] text-sm font-black text-white shadow-lg">
            MC
          </span>
          <span className="text-xl">meucupom</span>
        </Link>

        <nav className="flex items-center gap-2.5">
          <Link
            href="/igorsardinha"
            className="hidden min-h-10 items-center rounded-full border border-[#94C5FF]/20 bg-white/5 px-4 text-sm font-semibold text-[#E2ECF7] transition hover:border-[#38BDF8]/50 sm:inline-flex"
          >
            Ver exemplo
          </Link>
          <Link
            href="/entrar"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#1E60CF] px-4 text-sm font-bold text-white shadow-[0_6px_18px_rgba(30,96,207,0.35)] transition hover:bg-[#256EE8]"
          >
            <span>Entrar</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-20 sm:px-6 lg:pt-12">
        <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3.5 py-1 text-xs font-bold text-[#7DD3FC]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Feito para o link da bio &amp; Stories</span>
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              Seus links e cupons de parceiros em uma página que{" "}
              <span className="bg-gradient-to-r from-[#38BDF8] to-[#60A5FA] bg-clip-text text-transparent">
                converte mais
              </span>
              .
            </h1>

            <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-[#9CB3CE] sm:text-lg">
              Inspirado em páginas de alta conversão para criadores e atletas: seu público copia o
              cupom com um toque, vê as logos oficiais das marcas e acessa seu link com visual
              personalizado por você.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/entrar"
                className="inline-flex min-h-[50px] items-center gap-2 rounded-2xl bg-[#1E60CF] px-6 text-base font-bold text-white shadow-[0_12px_28px_rgba(30,96,207,0.4)] transition hover:bg-[#256EE8]"
              >
                <span>Criar minha página grátis</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                href="/igorsardinha"
                className="inline-flex min-h-[50px] items-center gap-2 rounded-2xl border border-[#94C5FF]/20 bg-[#0E1624] px-5 text-base font-bold text-white transition hover:border-[#38BDF8]/50"
              >
                <span>Ver página @igorsardinha</span>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#9CB3CE]">
              <span>✓ Login com Google, Apple ou e-mail</span>
              <span>✓ Preview em tempo real</span>
              <span>✓ Sem código</span>
            </div>
          </div>

          <div>
            <Suspense
              fallback={
                <div className="mx-auto flex h-[640px] max-w-[380px] items-center justify-center rounded-[36px] border border-white/10 bg-[#0E1624] text-sm text-[#9CB3CE]">
                  Carregando preview...
                </div>
              }
            >
              <ShowcasePhone />
            </Suspense>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features-title" className="mt-20">
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
        <section id="planos" aria-labelledby="pricing-title" className="mt-20">
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

      <footer className="border-t border-white/10 py-6 text-center text-xs text-[#9CB3CE]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <p>meucupom · Plataforma de links e cupons para criadores</p>
          <div className="flex items-center gap-4">
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
