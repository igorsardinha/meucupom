import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Termos de Uso · meucupom",
  description: "Termos de uso e condições gerais da plataforma meucupom.",
};

export default function TermosPage() {
  return (
    <div className="min-h-dvh bg-[#070C14] px-4 py-10 text-[#F4F8FD]">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#9CB3CE] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Voltar para o início</span>
        </Link>

        <article className="rounded-3xl border border-[#94C5FF]/15 bg-[#0E1624] p-6 sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Termos de Uso</h1>
          <p className="mt-2 text-sm text-[#9CB3CE]">
            Última atualização: novembro de 2026
          </p>

          <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#CBD5E1]">
            <section>
              <h2 className="text-base font-bold text-white">1. Sobre o meucupom</h2>
              <p className="mt-1">
                O <strong>meucupom</strong> é uma plataforma para criação e personalização de
                páginas de links e cupons de parceiros. Cada criador é integralmente responsável
                pelos links, códigos promocionais, imagens e textos publicados em sua página.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white">2. Uso aceitável e moderação</h2>
              <p className="mt-1">
                É proibido utilizar o meucupom para publicar golpes, phishing, conteúdo ilegal,
                falsificação de identidade de marcas/bancos ou spam. Páginas denunciadas ou que
                violem estas regras podem ser suspensas imediatamente sem aviso prévio.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white">3. Planos, assinaturas e cancelamento</h2>
              <p className="mt-1">
                O plano Grátis oferece recursos essenciais com limite de itens e selo da
                plataforma. O plano Pro é cobrado de forma recorrente mensal via Stripe e pode
                ser cancelado a qualquer momento pelo portal do assinante no painel, mantendo o
                acesso até o fim do ciclo já pago.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white">4. Cupons e lojas terceiras</h2>
              <p className="mt-1">
                Os descontos, validade de cupons e entregas são de responsabilidade exclusiva das
                respectivas lojas parceiras anunciadas pelos criadores.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
