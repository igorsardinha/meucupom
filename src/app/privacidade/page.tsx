import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade · meucupom",
  description: "Política de privacidade e tratamento de dados (LGPD) do meucupom.",
};

export default function PrivacidadePage() {
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
          <h1 className="text-3xl font-extrabold tracking-tight">Política de Privacidade</h1>
          <p className="mt-2 text-sm text-[#9CB3CE]">
            Em conformidade com a LGPD (Lei nº 13.709/2018)
          </p>

          <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#CBD5E1]">
            <section>
              <h2 className="text-base font-bold text-white">1. Dados coletados</h2>
              <p className="mt-1">
                Ao criar sua conta com Google, Instagram ou e-mail, armazenamos apenas os dados
                necessários para autenticação e montagem da sua página pública (nome, e-mail,
                foto de perfil e identificador social).
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white">2. Métricas e cookies</h2>
              <p className="mt-1">
                Utilizamos cookies essenciais de sessão para manter você conectado ao painel e
                contadores agregados de visualizações, cópias de cupons e cliques para exibição
                exclusiva ao criador dono da página.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white">3. Pagamentos</h2>
              <p className="mt-1">
                Os dados de cartão e cobrança de assinaturas Pro são processados diretamente pela
                Stripe; o meucupom não armazena números completos de cartão de crédito.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white">4. Exclusão e direitos do titular</h2>
              <p className="mt-1">
                Você pode editar suas informações públicas a qualquer momento no painel ou
                solicitar a exclusão completa da sua conta e dados associados pelos canais de
                suporte da plataforma.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
