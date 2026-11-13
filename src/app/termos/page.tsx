import Link from "next/link";
import { ArrowLeft, FileText, Mail, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Termos de Uso · MeuCupom",
  description:
    "Termos de Uso e Condições Gerais de Prestação de Serviços da plataforma MeuCupom.",
};

export default function TermosPage() {
  return (
    <div className="min-h-dvh bg-[#070C14] px-4 py-10 text-[#F4F8FD] bg-[radial-gradient(circle_at_50%_-10%,rgba(47,108,181,0.22),transparent_55%)]">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#9CB3CE] transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Voltar para o início</span>
        </Link>

        <article className="rounded-3xl border border-[#94C5FF]/15 bg-[#0E1624] p-6 shadow-2xl sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#38BDF8]/30 bg-[#1E60CF]/15 px-3 py-1 text-xs font-bold text-[#7DD3FC]">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Contrato de Serviços e Termos Gerais</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Conforme o Marco Civil da Internet (Lei nº 12.965/2014)</span>
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Termos de Uso e Condições Gerais
          </h1>
          <p className="mt-2 text-sm text-[#9CB3CE]">
            Aplicação: <strong>MeuCupom</strong> (acessível em{" "}
            <a
              href="https://meucupom.bio"
              className="text-[#38BDF8] underline hover:text-white"
            >
              https://meucupom.bio
            </a>
            ) · <strong>Última atualização: 13 de novembro de 2026</strong>
          </p>

          <hr className="my-6 border-[#94C5FF]/10" />

          {/* Table of contents */}
          <nav
            aria-label="Sumário dos Termos de Uso"
            className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CB3CE]">
              Sumário de Navegação
            </h2>
            <ol className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 text-[#CBD5E1]">
              <li>
                <a href="#termo-1" className="hover:text-[#38BDF8] hover:underline">
                  1. Aceitação dos Termos e Identificação
                </a>
              </li>
              <li>
                <a href="#termo-2" className="hover:text-[#38BDF8] hover:underline">
                  2. Descrição dos Serviços
                </a>
              </li>
              <li>
                <a href="#termo-3" className="hover:text-[#38BDF8] hover:underline">
                  3. Cadastro, Elegibilidade e Autenticação
                </a>
              </li>
              <li>
                <a href="#termo-4" className="hover:text-[#38BDF8] hover:underline">
                  4. Regras de Conduta e Uso Aceitável
                </a>
              </li>
              <li>
                <a href="#termo-5" className="hover:text-[#38BDF8] hover:underline">
                  5. Planos, Assinaturas e Pagamentos
                </a>
              </li>
              <li>
                <a href="#termo-6" className="hover:text-[#38BDF8] hover:underline">
                  6. Cancelamento e Direito de Arrependimento
                </a>
              </li>
              <li>
                <a href="#termo-7" className="hover:text-[#38BDF8] hover:underline">
                  7. Isenção de Responsabilidade sobre Lojas Terceiras
                </a>
              </li>
              <li>
                <a href="#termo-8" className="hover:text-[#38BDF8] hover:underline">
                  8. Propriedade Intelectual e Licenças
                </a>
              </li>
              <li>
                <a href="#termo-9" className="hover:text-[#38BDF8] hover:underline">
                  9. Moderação e Encerramento de Contas
                </a>
              </li>
              <li>
                <a href="#termo-10" className="hover:text-[#38BDF8] hover:underline">
                  10. Legislação Aplicável, Foro e Contato
                </a>
              </li>
            </ol>
          </nav>

          <div className="space-y-8 text-sm leading-relaxed text-[#CBD5E1]">
            {/* 1 */}
            <section id="termo-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  1
                </span>
                Aceitação dos Termos e Identificação da Plataforma
              </h2>
              <p className="mt-2">
                Estes Termos de Uso e Condições Gerais regulam o acesso e a utilização dos serviços
                disponibilizados pela plataforma <strong>MeuCupom</strong> através do endereço eletrônico{" "}
                <a
                  href="https://meucupom.bio"
                  className="text-[#38BDF8] underline hover:text-white"
                >
                  https://meucupom.bio
                </a>
                .
              </p>
              <p className="mt-2">
                Ao criar uma conta, navegar ou utilizar qualquer recurso do MeuCupom, você declara
                ter lido, compreendido e aceito integralmente todas as disposições deste documento e da
                nossa{" "}
                <Link href="/privacidade" className="text-[#38BDF8] underline hover:text-white">
                  Política de Privacidade
                </Link>
                . Caso não concorde com qualquer cláusula, você não deverá utilizar o serviço.
              </p>
            </section>

            {/* 2 */}
            <section id="termo-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  2
                </span>
                Descrição dos Serviços
              </h2>
              <p className="mt-2">
                O <strong>MeuCupom</strong> é uma ferramenta de produtividade digital que permite aos
                usuários (criadores de conteúdo, atletas, influenciadores e empresas) criar,
                personalizar e gerenciar uma página de bio pública para:
              </p>
              <ul className="mt-3 space-y-1.5 pl-4 list-disc text-[#CBD5E1]">
                <li>Centralizar links de afiliados e redes sociais em uma única URL rápida e responsiva;</li>
                <li>Divulgar cupons promocionais com botão de cópia com um clique e redirecionamento;</li>
                <li>Personalizar layouts, temas visuais, animações, fontes e fotos de perfil;</li>
                <li>Acompanhar métricas agregadas de acessos e cliques no painel de controle.</li>
              </ul>
            </section>

            {/* 3 */}
            <section id="termo-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  3
                </span>
                Cadastro, Elegibilidade e Autenticação
              </h2>
              <p className="mt-2">
                <strong>Elegibilidade:</strong> Para utilizar o MeuCupom, você deve ter pelo menos 18
                anos de idade ou possuir plena capacidade civil nos termos da legislação brasileira.
                Menores de 18 anos só podem utilizar o serviço sob supervisão e consentimento expresso
                de seus pais ou representantes legais.
              </p>
              <p className="mt-2">
                <strong>Autenticação e Login Social:</strong> O acesso pode ser realizado através de
                e-mail e senha cadastrados ou por meio de provedores de autenticação parceiros
                (Google OAuth, Apple Sign-In e Instagram). Ao optar pelo login social, você autoriza o
                MeuCupom a receber e processar os dados básicos necessários (nome, e-mail e foto) em
                conformidade com nossa Política de Privacidade.
              </p>
              <p className="mt-2">
                <strong>Segurança da Conta:</strong> Você é o único responsável pela guarda e
                confidencialidade das suas credenciais de acesso, respondendo por quaisquer atos
                praticados através de sua conta.
              </p>
            </section>

            {/* 4 */}
            <section id="termo-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  4
                </span>
                Regras de Conduta e Uso Aceitável
              </h2>
              <p className="mt-2">
                Ao utilizar a plataforma, você se compromete a publicar apenas conteúdos legítimos,
                verídicos e em conformidade com as leis vigentes. É <strong>expressamente proibido</strong>:
              </p>
              <ul className="mt-3 space-y-2 pl-4 list-disc text-[#CBD5E1]">
                <li>
                  Publicar links com intenção fraudulenta, esquemas de phishing, vírus, malwares ou
                  tentativas de captura indevida de dados de terceiros;
                </li>
                <li>
                  Falsificar identidade de terceiros, instituições financeiras, marcas registradas ou
                  órgãos governamentais;
                </li>
                <li>
                  Divulgar cupons enganosos, inverídicos ou que induzam o consumidor a erro manifesto;
                </li>
                <li>
                  Veicular conteúdos que promovam pornografia infantil, discurso de ódio, violência,
                  discriminação, comércio de produtos ilegais ou armas de fogo;
                </li>
                <li>
                  Utilizar ferramentas automatizadas (bots, crawlers desautorizados, scripts de abuso)
                  para sobrecarregar os servidores da plataforma.
                </li>
              </ul>
              <p className="mt-2">
                O MeuCupom reserva-se o direito de remover links e suspender ou banir preventivamente
                qualquer página que viole estas diretrizes, sem direito a qualquer indenização.
              </p>
            </section>

            {/* 5 */}
            <section id="termo-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  5
                </span>
                Planos, Assinaturas e Pagamentos
              </h2>
              <p className="mt-2">
                O MeuCupom oferece duas modalidades principais de utilização:
              </p>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="font-bold text-white text-sm">Plano Grátis</h3>
                  <p className="mt-1 text-[#9CB3CE]">
                    Acesso aos recursos essenciais para criação de página bio, temas básicos, limite
                    de até 5 links ou cupons cadastrados e exibição discreta do selo MeuCupom.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#38BDF8]/30 bg-[#1E60CF]/15 p-4">
                  <h3 className="font-bold text-white text-sm">Plano Pro</h3>
                  <p className="mt-1 text-[#CBD5E1]">
                    Links e cupons ilimitados, temas e animações avançadas, analytics detalhado,
                    remoção do selo da plataforma e suporte prioritário.
                  </p>
                </div>
              </div>
              <p className="mt-3">
                <strong>Processamento Financeiro:</strong> As assinaturas do Plano Pro são cobradas sob
                o regime de recorrência mensal através da instituição de pagamento homologada{" "}
                <strong>Mercado Pago</strong>. O valor da assinatura é debitado automaticamente a cada
                ciclo de 30 dias na forma de pagamento informada pelo usuário.
              </p>
            </section>

            {/* 6 */}
            <section id="termo-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  6
                </span>
                Cancelamento e Direito de Arrependimento
              </h2>
              <p className="mt-2">
                <strong>Cancelamento a Qualquer Momento:</strong> Você pode cancelar sua assinatura Pro
                a qualquer momento diretamente pelo painel do MeuCupom, na seção de Perfil e Plano. Ao
                cancelar, você não será cobrado em renovações futuras e continuará com acesso aos
                recursos Pro até o encerramento do período mensal já quitado.
              </p>
              <p className="mt-2">
                <strong>Direito de Arrependimento (CDC, Art. 49):</strong> Conforme o Código de Defesa
                do Consumidor brasileiro, nas contratações do Plano Pro realizadas pela internet, você
                tem o prazo de 7 (sete) dias corridos a contar da primeira contratação para exercer seu
                direito de arrependimento e solicitar o estorno integral do valor pago, bastando
                contatar nosso suporte por e-mail (<a href="mailto:contato@meucupom.bio" className="text-[#38BDF8] underline">contato@meucupom.bio</a>).
              </p>
            </section>

            {/* 7 */}
            <section id="termo-7">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  7
                </span>
                Isenção de Responsabilidade sobre Lojas Parceiras e Cupons
              </h2>
              <p className="mt-2">
                O MeuCupom é uma plataforma intermediária de publicação de links e agregação de
                cupons. O MeuCupom <strong>não é loja, fabricante, fornecedor, revendedor nem transportador</strong>{" "}
                de qualquer mercadoria ou serviço anunciado pelos criadores em suas páginas.
              </p>
              <p className="mt-2">
                Portanto, as condições de compra, regras de validade de cupons, descontos aplicados,
                políticas de frete, qualidade, garantia e entrega dos produtos são de responsabilidade
                única e exclusiva das respectivas lojas e marcas parceiras onde a compra final for
                realizada.
              </p>
            </section>

            {/* 8 */}
            <section id="termo-8">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  8
                </span>
                Propriedade Intelectual e Licenças
              </h2>
              <p className="mt-2">
                <strong>Conteúdo do Usuário:</strong> Você mantém todos os direitos autorais e de
                propriedade sobre os textos, imagens, logotipos e fotos que publica em sua página bio.
                Ao utilizar a plataforma, você concede ao MeuCupom uma licença não exclusiva, mundial e
                gratuita para hospedar, processar e exibir publicamente esse conteúdo exclusivamente com
                o objetivo de disponibilizar sua página na internet.
              </p>
              <p className="mt-2">
                <strong>Propriedade da Plataforma:</strong> A marca MeuCupom, logotipos, códigos-fonte,
                designs de interface, algoritmos e banco de dados são de propriedade exclusiva do
                MeuCupom, sendo vedada sua reprodução, cópia ou engenharia reversa sem autorização
                prévia por escrito.
              </p>
            </section>

            {/* 9 */}
            <section id="termo-9">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  9
                </span>
                Moderação, Denúncias e Encerramento de Contas
              </h2>
              <p className="mt-2">
                Qualquer usuário ou terceiro pode denunciar páginas que contenham conteúdo ilícito ou
                enganoso através do botão de denúncia presente no rodapé das páginas públicas ou pelo
                e-mail <a href="mailto:contato@meucupom.bio" className="text-[#38BDF8] underline">contato@meucupom.bio</a>.
              </p>
              <p className="mt-2">
                Reservamo-nos o direito de suspender ou encerrar unilateralmente a conta de qualquer
                usuário que descumpra estes Termos de Uso, as leis brasileiras ou diretrizes de marcas
                terceiras, sem que seja devida qualquer indenização.
              </p>
            </section>

            {/* 10 */}
            <section id="termo-10" className="rounded-2xl border border-[#94C5FF]/20 bg-[#0A121F] p-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#38BDF8]" aria-hidden="true" />
                <span>10. Legislação Aplicável, Foro e Canal de Atendimento</span>
              </h2>
              <p className="mt-2">
                Estes Termos de Uso são regidos e interpretados em conformidade com as leis da
                República Federativa do Brasil, em especial o Marco Civil da Internet (Lei nº
                12.965/2014) e a LGPD (Lei nº 13.709/2018).
              </p>
              <p className="mt-2">
                Fica eleito o foro da comarca de domicílio do consumidor ou, subsidiariamente, o foro
                central da capital competente para dirimir quaisquer controvérsias oriundas destes
                Termos.
              </p>
              <div className="mt-3 space-y-1 text-xs text-[#CBD5E1]">
                <p>
                  <strong>Suporte e Dúvidas:</strong>{" "}
                  <a
                    href="mailto:contato@meucupom.bio"
                    className="font-semibold text-[#38BDF8] underline"
                  >
                    contato@meucupom.bio
                  </a>
                </p>
                <p>
                  <strong>Privacidade e Dados:</strong>{" "}
                  <a
                    href="mailto:privacidade@meucupom.bio"
                    className="font-semibold text-[#38BDF8] underline"
                  >
                    privacidade@meucupom.bio
                  </a>
                </p>
                <p>
                  <strong>Site oficial:</strong>{" "}
                  <a
                    href="https://meucupom.bio"
                    className="font-semibold text-[#38BDF8] underline"
                  >
                    https://meucupom.bio
                  </a>
                </p>
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}