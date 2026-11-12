# meucupom

Plataforma multiusuário de páginas de links e cupons para criadores e atletas, baseada no layout mobile-first do projeto `links`, com painel completo de personalização, métricas e login social (**Google** e **Instagram**).

## Recursos principais

- **Página pública rápida e mobile-first** (`/[slug]`, com suporte a `/@slug`):
  - Cópia de cupons em 1 toque com fallback compatível com o WebView interno do Instagram.
  - Carregamento automático da logo da marca pelo domínio (`icon.horse` + fallback Google Favicon + iniciais).
  - Open Graph dinâmico para prévias no Instagram DM e WhatsApp.
  - Botão de compartilhamento nativo (`navigator.share`) e alternância claro/escuro opcional para visitantes.
- **Painel do criador (`/painel`) com Preview ao Vivo**:
  - **Links & Cupons**: adicione parceiros com cupom copiável ou links comuns (YouTube, Strava, WhatsApp, site), reordene, pause/ative ou edite.
  - **Aparência & Layout**: temas prontos em 1 clique, 3 layouts (`Lista Clássica`, `Grid 2 Colunas`, `Compacto`), 4 estilos de fundo (`Glow`, `Sólido`, `Gradiente`, `Mesh`), 3 superfícies de card (`Sólido`, `Glass`, `Contorno`), arredondamento, fontes e 5 seletores de cor com indicador de contraste WCAG.
  - **Perfil & Métricas**: contagem de visitas na página, cópias por cupom e cliques por link.
- **Autenticação (`/entrar`)**:
  - Login social com **Google** e **Instagram** via `better-auth`.
  - Cadastro/login com e-mail e senha.
  - Botão de **Conta Demo (`@igorsardinha`)** em ambiente local para testar tudo imediatamente sem chaves externas.

---

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`:
- Página inicial: `http://localhost:3000`
- Exemplo público pré-carregado: `http://localhost:3000/igorsardinha`
- Login / Cadastro / Conta Demo: `http://localhost:3000/entrar`
- Painel editor: `http://localhost:3000/painel`

Na primeira execução, o banco SQLite local (`./data/meucupom.db`) e a página de exemplo `@igorsardinha` são criados automaticamente.

---

## Como ativar o Login Social (Google e Instagram)

Copie `.env.example` para `.env.local` (já criado para você no local) e preencha as chaves abaixo:

### 1. Google OAuth
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Crie um **OAuth 2.0 Client ID** (Web application).
3. Adicione em **Authorized redirect URIs**:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Produção: `https://SEU_DOMINIO/api/auth/callback/google`
4. Coloque `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env.local` (ou nas Environment Variables da Vercel).

### 2. Sign in with Apple (Opcional — requer Apple Developer Program)
1. No [Apple Developer Portal](https://developer.apple.com/account/), crie um **App ID** e um **Services ID** com **Sign in with Apple** habilitado.
2. No **Services ID**, configure o domínio e a **Return URL**:
   - Produção: `https://SEU_DOMINIO/api/auth/callback/apple` (a Apple exige domínio HTTPS público; para testar local use um túnel HTTPS como ngrok/cloudflared).
3. Gere uma chave `.p8` com **Sign in with Apple**, gere o JWT `client_secret` assinado com ES256 (válido por até 6 meses) e preencha `APPLE_CLIENT_ID` (Services ID) e `APPLE_CLIENT_SECRET` no `.env.local`.

### 2. Instagram Login (Instagram API with Instagram Login)
1. Acesse o [Meta for Developers](https://developers.facebook.com/) e crie um app com o produto **Instagram** (**Instagram API with Instagram Login**).
2. Configure a **Valid OAuth Redirect URI**:
   - Local: `http://localhost:3000/api/auth/callback/instagram`
   - Produção: `https://SEU_DOMINIO/api/auth/callback/instagram`
3. Copie o **Instagram App ID** (`INSTAGRAM_CLIENT_ID`) e **Instagram App Secret** (`INSTAGRAM_CLIENT_SECRET`).
4. Solicite a permissão `instagram_business_basic` (em modo de desenvolvimento, adicione sua própria conta do Instagram como testadora no painel da Meta).

---

## Deploy na Vercel (com Postgres / Neon)

1. Suba a pasta `meucupom` para um repositório ou conecte na Vercel.
2. Adicione um banco **Neon Postgres** pelo Vercel Marketplace (isso injeta `DATABASE_URL` automaticamente).
3. Configure as variáveis de ambiente na Vercel:
   - `BETTER_AUTH_SECRET` (string aleatória forte)
   - `BETTER_AUTH_URL` (ex: `https://meucupom.com.br` apenas em Production; deixe vazio em Preview)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET`
   - `ENABLE_DEMO_LOGIN=false` (em produção)

---

## Configuração dos Módulos SaaS (Opcionais em Dev)

Sem essas chaves, o app funciona localmente com fallbacks seguros (link de reset no log do servidor, avatar em WebP comprimido e rate limiting em memória). Para produção completa:

1. **Mercado Pago (Planos Grátis vs Pro)**:
   - No painel [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel), crie uma aplicação e copie o **Access Token de produção** (ou teste) para `MP_ACCESS_TOKEN`.
   - Em **Webhooks → Configurar notificações**, aponte a URL para `https://SEU_DOMINIO/api/billing/webhook`, marque os eventos **Assinaturas** (`subscription_preapproval` e `subscription_authorized_payment`) e copie a **Assinatura secreta** para `MP_WEBHOOK_SECRET`.
   - Opcionalmente defina `MP_PRO_PRICE_BRL` (padrão `19.90`) ou `MP_PRO_PLAN_ID` se preferir vincular a um plano pré-criado.
2. **Resend (Recuperação de senha em `/esqueci-senha`)**:
   - Crie uma API key no Resend e defina `RESEND_API_KEY` e `EMAIL_FROM`.
3. **Vercel Blob (Upload de foto de perfil em nuvem)**:
   - Conecte um Blob Store na Vercel para injetar `BLOB_READ_WRITE_TOKEN` (usado por `/api/upload/avatar`).
4. **Upstash Redis (Rate limiting distribuído + Anti-abuso)**:
   - Conecte um banco Redis da Upstash para injetar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (protege `/api/track` e `/api/report`).
5. **Páginas Legais e Denúncias**:
   - `/termos` e `/privacidade` já estão publicadas e linkadas na home e no login.
   - Visitantes podem reportar páginas suspeitas diretamente pelo modal **"Denunciar página"** no rodapé público (`POST /api/report`).
