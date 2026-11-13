import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, Lock, Mail, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade · MeuCupom",
  description:
    "Política de Privacidade e Proteção de Dados (LGPD e Google API Services User Data Policy) do MeuCupom.",
};

export default function PrivacidadePage() {
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
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>LGPD (Lei nº 13.709/2018)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#38BDF8]/30 bg-[#1E60CF]/15 px-3 py-1 text-xs font-bold text-[#7DD3FC]">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Google API Services User Data Policy Compliant</span>
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Política de Privacidade
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
            aria-label="Sumário da Política de Privacidade"
            className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CB3CE]">
              Sumário de Navegação
            </h2>
            <ol className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 text-[#CBD5E1]">
              <li>
                <a href="#secao-1" className="hover:text-[#38BDF8] hover:underline">
                  1. Identificação da Plataforma e Controlador
                </a>
              </li>
              <li>
                <a href="#secao-2" className="hover:text-[#38BDF8] hover:underline">
                  2. Dados Pessoais que Coletamos
                </a>
              </li>
              <li>
                <a href="#secao-3" className="hover:text-[#38BDF8] hover:underline">
                  3. Dados Coletados via Google OAuth
                </a>
              </li>
              <li>
                <a href="#secao-4" className="hover:text-[#38BDF8] hover:underline">
                  4. Conformidade com as Políticas do Google
                </a>
              </li>
              <li>
                <a href="#secao-5" className="hover:text-[#38BDF8] hover:underline">
                  5. Finalidades do Tratamento de Dados
                </a>
              </li>
              <li>
                <a href="#secao-6" className="hover:text-[#38BDF8] hover:underline">
                  6. Compartilhamento com Terceiros
                </a>
              </li>
              <li>
                <a href="#secao-7" className="hover:text-[#38BDF8] hover:underline">
                  7. Segurança, Armazenamento e Retenção
                </a>
              </li>
              <li>
                <a href="#secao-8" className="hover:text-[#38BDF8] hover:underline">
                  8. Direitos do Titular e Exclusão de Dados
                </a>
              </li>
              <li>
                <a href="#secao-9" className="hover:text-[#38BDF8] hover:underline">
                  9. Como Revogar o Acesso via Google
                </a>
              </li>
              <li>
                <a href="#secao-10" className="hover:text-[#38BDF8] hover:underline">
                  10. Cookies e Métricas Agregadas
                </a>
              </li>
              <li>
                <a href="#secao-11" className="hover:text-[#38BDF8] hover:underline">
                  11. Contato do Encarregado (DPO) e Suporte
                </a>
              </li>
            </ol>
          </nav>

          <div className="space-y-8 text-sm leading-relaxed text-[#CBD5E1]">
            {/* 1 */}
            <section id="secao-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  1
                </span>
                Identificação da Plataforma e Controlador de Dados
              </h2>
              <p className="mt-2">
                O <strong>MeuCupom</strong> (disponível no endereço web oficial{" "}
                <a
                  href="https://meucupom.bio"
                  className="text-[#38BDF8] underline hover:text-white"
                >
                  https://meucupom.bio
                </a>
                ) é uma plataforma online desenvolvida para criadores de conteúdo, atletas,
                influenciadores digitais e profissionais que desejam criar páginas públicas
                personalizadas para centralizar seus links, códigos de cupons de desconto, redes
                sociais e parcerias comerciais.
              </p>
              <p className="mt-2">
                Esta Política de Privacidade estabelece nosso compromisso transparente com a
                segurança, confidencialidade e proteção dos dados pessoais de todos os usuários
                (criadores cadastrados) e visitantes de páginas públicas, em estrita observância à{" "}
                <strong>Lei Geral de Proteção de Dados Pessoais do Brasil (LGPD, Lei nº 13.709/2018)</strong>{" "}
                e aos regulamentos internacionais de segurança da informação.
              </p>
            </section>

            {/* 2 */}
            <section id="secao-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  2
                </span>
                Dados Pessoais que Coletamos
              </h2>
              <p className="mt-2">
                Coletamos estritamente os dados necessários para o fornecimento dos nossos serviços,
                categorizados da seguinte forma:
              </p>
              <ul className="mt-3 space-y-2 pl-4 list-disc text-[#CBD5E1]">
                <li>
                  <strong>Dados de Cadastro e Autenticação Direta:</strong> ao se cadastrar
                  utilizando e-mail e senha, coletamos seu nome completo, endereço de e-mail e uma
                  senha armazenada exclusivamente sob hash criptográfico seguro (bcrypt/argon2).
                </li>
                <li>
                  <strong>Informações de Perfil Criadas pelo Usuário:</strong> nome de exibição,
                  identificador de URL personalizado (slug, ex: meucupom.bio/seunome), biografia curta,
                  foto de perfil / avatar, links de redes sociais (Instagram, YouTube, TikTok, etc.)
                  e os links e cupons cadastrados (título, código do cupom, link de destino, loja e
                  regras de desconto).
                </li>
                <li>
                  <strong>Dados de Cobrança e Assinaturas Pro:</strong> para assinantes do Plano
                  Pro, as transações financeiras são intermediadas por processadores de pagamento
                  homologados (Mercado Pago). O MeuCupom <strong>não coleta, não processa e não armazena</strong>{" "}
                  dados sensíveis de cartão de crédito em seus servidores.
                </li>
                <li>
                  <strong>Métricas e Dados de Uso Agregados:</strong> contabilizamos visualizações de
                  páginas, cliques em links e cópias de códigos de cupom de forma anônima e
                  estatística para apresentar relatórios de desempenho exclusivos ao criador no seu
                  painel.
                </li>
              </ul>
            </section>

            {/* 3 */}
            <section id="secao-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  3
                </span>
                Dados Coletados via Google OAuth (Login com o Google)
              </h2>
              <p className="mt-2">
                Para oferecer uma experiência de cadastro e autenticação ágil e segura, o MeuCupom
                disponibiliza a opção de <strong>Entrar com o Google (Google Sign-In)</strong>.
              </p>
              <div className="mt-3 rounded-2xl border border-[#94C5FF]/15 bg-[#101C2E] p-4 text-xs leading-relaxed">
                <p className="font-semibold text-white">
                  Escopos solicitados da API do Google:
                </p>
                <ul className="mt-2 space-y-1.5 list-disc pl-4 text-[#9CB3CE]">
                  <li>
                    <code className="text-[#38BDF8]">openid</code>: verificação da identidade do
                    usuário via protocolo OpenID Connect.
                  </li>
                  <li>
                    <code className="text-[#38BDF8]">https://www.googleapis.com/auth/userinfo.email</code>{" "}
                    (ou escopo <code className="text-[#38BDF8]">email</code>): leitura do endereço de
                    e-mail principal associado à sua Conta do Google.
                  </li>
                  <li>
                    <code className="text-[#38BDF8]">https://www.googleapis.com/auth/userinfo.profile</code>{" "}
                    (ou escopo <code className="text-[#38BDF8]">profile</code>): leitura das
                    informações de perfil público do Google, especificamente o seu nome e a foto do
                    perfil.
                  </li>
                </ul>
                <p className="mt-3 text-white font-medium">
                  Dados específicos recebidos da API do Google:
                </p>
                <p className="mt-1 text-[#CBD5E1]">
                  Recebemos apenas o seu <strong>nome</strong>, <strong>endereço de e-mail</strong>,{" "}
                  <strong>URL da foto de perfil</strong> e o <strong>identificador exclusivo de usuário do Google (sub ID)</strong>.
                  Não temos acesso a e-mails do Gmail, arquivos do Google Drive, contatos, agenda ou
                  qualquer outro dado privado não autorizado explicitamente.
                </p>
              </div>
            </section>

            {/* 4 */}
            <section id="secao-4" className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <h2 className="text-lg font-bold text-amber-200 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-300" aria-hidden="true" />
                <span>4. Declaração Obrigatória: Google API Services User Data Policy</span>
              </h2>
              <p className="mt-2 text-white font-semibold">
                Requisitos de Uso Limitado (Limited Use Requirements):
              </p>
              <blockquote className="mt-2 border-l-2 border-amber-400/50 pl-4 italic text-amber-100/90">
                “O uso e a transferência para qualquer outro aplicativo das informações recebidas das
                APIs do Google pelo MeuCupom seguirão rigorosamente a{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-amber-200 hover:text-white inline-flex items-center gap-1"
                >
                  Política de Dados do Usuário dos Serviços de API do Google
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                , incluindo os requisitos de Uso Limitado (Limited Use requirements).”
              </blockquote>
              <div className="mt-4 space-y-2 text-xs text-amber-100/80">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-300 mt-0.5" />
                  <span>
                    <strong>Não Comercialização:</strong> Os dados de usuários obtidos via Google
                    OAuth nunca são vendidos, alugados ou transferidos a corretores de dados, parceiros
                    ou terceiros para fins comerciais.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-300 mt-0.5" />
                  <span>
                    <strong>Não Utilização para Publicidade:</strong> Os dados de usuários do Google
                    não são utilizados para exibir anúncios personalizados, campanhas de retargeting,
                    ou qualquer forma de publicidade comportamental.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-300 mt-0.5" />
                  <span>
                    <strong>Não Utilização para Treinamento de IA Geral:</strong> Os dados de
                    usuários do Google não são utilizados para treinar modelos fundacionais de
                    inteligência artificial ou aprendizado de máquina generalistas.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-300 mt-0.5" />
                  <span>
                    <strong>Sem Acesso Humano:</strong> Nenhum ser humano tem permissão para ler ou
                    inspecionar dados pessoais de usuários do Google, salvo quando estritamente
                    necessário para resolver problemas técnicos ou investigações de segurança com
                    autorização do titular, ou para cumprimento de ordem legal.
                  </span>
                </p>
              </div>
            </section>

            {/* 5 */}
            <section id="secao-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  5
                </span>
                Finalidades do Tratamento de Dados
              </h2>
              <p className="mt-2">Utilizamos os dados coletados com os seguintes propósitos legítimos:</p>
              <ul className="mt-3 space-y-2 pl-4 list-disc text-[#CBD5E1]">
                <li>
                  <strong>Autenticação e Manutenção de Conta:</strong> permitir que você crie uma
                  conta, faça login de forma segura e gerencie sua página bio personalizada.
                </li>
                <li>
                  <strong>Publicação da sua Página Bio:</strong> renderizar publicamente na internet o
                  perfil, links, fotos e cupons que você escolheu exibir aos seus seguidores.
                </li>
                <li>
                  <strong>Comunicações Transacionais Essenciais:</strong> envio de e-mails sobre o
                  status da sua conta (e-mail de confirmação de cadastro, link de recuperação e
                  redefinição de senha e alertas de segurança).
                </li>
                <li>
                  <strong>Prevenção a Fraudes e Segurança da Plataforma:</strong> garantir a
                  integridade do serviço, evitar práticas ilícitas (como golpes, phishing ou marcas
                  falsas) e proteger os direitos dos usuários e de terceiros.
                </li>
                <li>
                  <strong>Cumprimento Legal:</strong> cumprir ordens judiciais, obrigações do Marco
                  Civil da Internet (Lei nº 12.965/2014) e da LGPD (Lei nº 13.709/2018).
                </li>
              </ul>
            </section>

            {/* 6 */}
            <section id="secao-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  6
                </span>
                Compartilhamento com Terceiros e Operadores de Dados
              </h2>
              <p className="mt-2">
                O MeuCupom compartilha informações estritamente com prestadores de serviço essenciais
                (sub-processadores de dados) para a operação técnica da plataforma, todos sob
                cláusulas contratuais de confidencialidade e segurança da informação:
              </p>
              <ul className="mt-3 space-y-2 pl-4 list-disc text-[#CBD5E1]">
                <li>
                  <strong>Vercel Inc.:</strong> infraestrutura de computação em nuvem, servidores de
                  aplicação e entrega de conteúdo (CDN).
                </li>
                <li>
                  <strong>Neon Database / PostgreSQL:</strong> armazenamento e persistência de banco de
                  dados em ambiente criptografado.
                </li>
                <li>
                  <strong>Mercado Pago:</strong> processador de pagamentos para assinaturas do Plano Pro
                  (opera sob normas PCI-DSS).
                </li>
                <li>
                  <strong>Resend Technologies:</strong> serviço de disparo de e-mails transacionais
                  (boas-vindas e redefinição de senhas).
                </li>
              </ul>
              <p className="mt-2 font-medium text-white">
                Reiteramos: Nós <u>nunca</u> vendemos, licenciamos ou alugamos seus dados pessoais a
                agências de publicidade ou intermediários de dados.
              </p>
            </section>

            {/* 7 */}
            <section id="secao-7">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  7
                </span>
                Segurança, Armazenamento e Retenção dos Dados
              </h2>
              <p className="mt-2">
                Adotamos práticas técnicas e administrativas sólidas para proteger seus dados contra
                acesso não autorizado, perda, alteração ou destruição:
              </p>
              <ul className="mt-3 space-y-2 pl-4 list-disc text-[#CBD5E1]">
                <li>
                  <strong>Criptografia em Trânsito:</strong> todas as conexões entre o seu navegador e
                  a plataforma são protegidas por criptografia HTTPS/TLS de última geração.
                </li>
                <li>
                  <strong>Criptografia em Repouso:</strong> senhas e chaves são submetidas a algoritmos
                  criptográficos unidirecionais seguros antes de serem gravadas no banco de dados.
                </li>
                <li>
                  <strong>Tempo de Retenção:</strong> mantemos seus dados ativos enquanto você possuir
                  uma conta cadastrada conosco. Ao solicitar a exclusão da sua conta, os dados são
                  definitivamente removidos de nossos bancos operacionais em até 15 (quinze) dias
                  úteis, ressalvadas obrigações legais de guarda de registros de acesso a aplicações
                  (previstas pelo art. 15 da Lei nº 12.965/2014 - Marco Civil da Internet).
                </li>
              </ul>
            </section>

            {/* 8 */}
            <section id="secao-8">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  8
                </span>
                Direitos do Titular de Dados e Solicitação de Exclusão (LGPD)
              </h2>
              <p className="mt-2">
                Nos termos do artigo 18 da LGPD, você, como titular dos dados pessoais, tem o direito
                de, a qualquer momento e mediante requisição:
              </p>
              <ul className="mt-3 space-y-1.5 pl-4 list-disc text-[#CBD5E1]">
                <li>Confirmar a existência de tratamento de seus dados pessoais;</li>
                <li>Acessar os dados pessoais armazenados;</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados diretamente no painel;</li>
                <li>Solicitar a eliminação dos dados pessoais tratados com o seu consentimento;</li>
                <li>Revogar o consentimento fornecido a qualquer momento.</li>
              </ul>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
                <p className="font-bold text-white">
                  Como solicitar a exclusão completa dos seus dados:
                </p>
                <p className="mt-1 text-[#CBD5E1]">
                  Para solicitar a exclusão definitiva da sua conta e de todos os dados associados
                  (perfil, links, cupons, fotos e métricas), envie um e-mail a partir do e-mail
                  cadastrado para{" "}
                  <a
                    href="mailto:privacidade@meucupom.bio"
                    className="font-semibold text-[#38BDF8] underline"
                  >
                    privacidade@meucupom.bio
                  </a>{" "}
                  ou{" "}
                  <a
                    href="mailto:contato@meucupom.bio"
                    className="font-semibold text-[#38BDF8] underline"
                  >
                    contato@meucupom.bio
                  </a>{" "}
                  com o assunto <em>“Solicitação de Exclusão de Conta e Dados - LGPD”</em>. Seu
                  pedido será processado com confirmação em até 15 dias úteis.
                </p>
              </div>
            </section>

            {/* 9 */}
            <section id="secao-9">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  9
                </span>
                Como Revogar o Acesso à sua Conta Google
              </h2>
              <p className="mt-2">
                Se você fez login ou vinculou sua conta ao Google, é possível revogar o acesso do
                aplicativo MeuCupom à sua Conta Google a qualquer momento diretamente nas
                configurações de segurança oficiais do Google:
              </p>
              <div className="mt-3 rounded-2xl border border-[#94C5FF]/15 bg-[#101C2E] p-4 text-xs">
                <ol className="space-y-1.5 list-decimal pl-4 text-[#CBD5E1]">
                  <li>
                    Acesse a página de segurança e permissões da sua Conta Google em:{" "}
                    <a
                      href="https://myaccount.google.com/permissions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#38BDF8] underline inline-flex items-center gap-1"
                    >
                      https://myaccount.google.com/permissions
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>Localize <strong>MeuCupom</strong> na lista de aplicativos e serviços de terceiros;</li>
                  <li>Clique em <strong>Remover o acesso</strong> para revogar as permissões concedidas.</li>
                </ol>
              </div>
            </section>

            {/* 10 */}
            <section id="secao-10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E60CF] text-xs font-bold text-white">
                  10
                </span>
                Cookies e Tecnologias de Sessão
              </h2>
              <p className="mt-2">
                O MeuCupom utiliza apenas <strong>cookies estritamente necessários</strong> para o
                funcionamento do serviço:
              </p>
              <ul className="mt-2 space-y-1.5 pl-4 list-disc text-[#CBD5E1]">
                <li>
                  <strong>Cookies de Sessão e Autenticação:</strong> necessários para manter o criador
                  autenticado no painel de controle durante sua navegação.
                </li>
                <li>
                  <strong>Cookies de Segurança e CSRF:</strong> necessários para prevenir requisições
                  maliciosas e falsificação de solicitações entre sites.
                </li>
              </ul>
              <p className="mt-2">
                Não utilizamos cookies de terceiros para fins de vigilância de navegação ou venda de
                anúncios.
              </p>
            </section>

            {/* 11 */}
            <section id="secao-11" className="rounded-2xl border border-[#94C5FF]/20 bg-[#0A121F] p-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#38BDF8]" aria-hidden="true" />
                <span>11. Contato do Encarregado de Proteção de Dados (DPO) e Suporte</span>
              </h2>
              <p className="mt-2">
                Para exercer seus direitos de privacidade, esclarecer dúvidas sobre o tratamento de
                dados ou relatar qualquer incidente de segurança, entre em contato com nosso
                Encarregado pelo Tratamento de Dados Pessoais (DPO):
              </p>
              <div className="mt-3 space-y-1 text-xs text-[#CBD5E1]">
                <p>
                  <strong>Plataforma:</strong> MeuCupom (meucupom.bio)
                </p>
                <p>
                  <strong>Canal de Privacidade (DPO):</strong>{" "}
                  <a
                    href="mailto:privacidade@meucupom.bio"
                    className="font-semibold text-[#38BDF8] underline"
                  >
                    privacidade@meucupom.bio
                  </a>
                </p>
                <p>
                  <strong>Suporte Geral:</strong>{" "}
                  <a
                    href="mailto:contato@meucupom.bio"
                    className="font-semibold text-[#38BDF8] underline"
                  >
                    contato@meucupom.bio
                  </a>
                </p>
                <p>
                  <strong>Jurisdição:</strong> República Federativa do Brasil
                </p>
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}