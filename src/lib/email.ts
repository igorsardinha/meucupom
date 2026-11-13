import { Resend } from "resend";

function getResendApiKey(): string {
  return (
    process.env.RESEND_API_KEY?.trim() ||
    process.env.RESEND_API_KEY_RESEND_API_KEY?.trim() ||
    process.env.RESEND_TOKEN?.trim() ||
    ""
  );
}

export function isEmailEnabled(): boolean {
  return Boolean(getResendApiKey());
}

function resolveAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://meucupom.bio"
  ).replace(/\/+$/, "");
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = getResendApiKey();
  const domain = process.env.RESEND_API_KEY_RESEND_EMAIL_DOMAIN?.trim();
  const configuredFrom = process.env.EMAIL_FROM?.trim();

  // Se houver EMAIL_FROM configurado, usa ele.
  // Senão, se houver domínio do Resend configurado, usa ele.
  // Caso contrário, tenta primeiro com meucupom.bio e faz fallback para onboarding@resend.dev se o domínio não estiver verificado.
  const primaryFrom =
    configuredFrom ||
    (domain ? `meucupom <noreply@${domain}>` : "meucupom <noreply@meucupom.bio>");

  if (!apiKey) {
    console.info(
      `[meucupom email fallback - sem RESEND_API_KEY]\nPara: ${input.to}\nAssunto: ${input.subject}\nConteúdo:\n${input.text}`
    );
    return;
  }

  const resend = new Resend(apiKey);

  try {
    const res = await resend.emails.send({
      from: primaryFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (res.error) {
      console.warn(
        `[meucupom email warning] Falha com remetente "${primaryFrom}": ${res.error.message}`
      );

      // Se falhou por domínio não verificado ou restrição de remetente, tenta com onboarding@resend.dev
      if (
        primaryFrom !== "meucupom <onboarding@resend.dev>" &&
        (res.error.message?.toLowerCase().includes("domain") ||
          res.error.message?.toLowerCase().includes("verify") ||
          res.error.name === "validation_error")
      ) {
        console.info("[meucupom email] Tentando envio pelo remetente padrão onboarding@resend.dev...");
        const retry = await resend.emails.send({
          from: "meucupom <onboarding@resend.dev>",
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
        });

        if (retry.error) {
          console.error(
            `[meucupom email error] Falha final ao enviar para ${input.to}: ${retry.error.message}`
          );
        } else {
          console.info(`[meucupom email] E-mail entregue com sucesso via onboarding@resend.dev para ${input.to}`);
        }
      }
    } else {
      console.info(`[meucupom email] E-mail enviado com sucesso para ${input.to} (${input.subject})`);
    }
  } catch (err) {
    console.error(`[meucupom email exception] Erro ao enviar e-mail para ${input.to}:`, err);
  }
}

/**
 * Envia e-mail de boas-vindas após a criação da conta.
 */
export async function sendWelcomeEmail(user: {
  email: string;
  name?: string | null;
}): Promise<void> {
  const appUrl = resolveAppUrl();
  const dashboardUrl = `${appUrl}/painel`;
  const creatorName = (user.name || "Criador").trim();

  const subject = "Bem-vindo(a) ao meucupom! 🚀";

  const text = `Olá, ${creatorName}!

Sua conta no meucupom foi criada com sucesso!

Agora você pode:
- Cadastrar seus links oficiais e cupons de marcas parceiras.
- Personalizar cores, estilo de cards e animações de destaque.
- Definir datas de expiração com contagem regressiva ao vivo.
- Colocar seu link na bio do Instagram, TikTok e YouTube.

Acesse seu painel agora mesmo:
${dashboardUrl}

Se precisar de ajuda ou tiver dúvidas, basta responder a este e-mail.

Equipe meucupom
https://meucupom.bio
`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070C14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F4F8FD;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070C14; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #0E1624; border: 1px solid rgba(148, 197, 255, 0.16); border-radius: 20px; padding: 36px 28px; text-align: left; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <!-- Logo Header -->
          <tr>
            <td style="padding-bottom: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <div style="display: inline-flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; background: #1E60CF; color: #ffffff; padding: 6px 12px; border-radius: 10px; font-weight: 900; font-size: 15px; letter-spacing: -0.5px;">meu<span style="color: #38BDF8;">cupom</span></span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding-top: 28px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; line-height: 1.3;">
                Sua conta está pronta, ${creatorName}! 🎉
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #CBD5E1;">
                Estamos muito felizes em ter você conosco no <strong>meucupom</strong>. Sua página de links e cupons já foi criada e está pronta para ser personalizada.
              </p>
            </td>
          </tr>

          <!-- Steps box -->
          <tr>
            <td style="background-color: rgba(30, 96, 207, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 14px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #38BDF8;">
                Próximos passos recomendados:
              </p>
              <ul style="margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.8; color: #E2E8F0;">
                <li><strong>Adicione seus cupons:</strong> cadastre as marcas que você divulga.</li>
                <li><strong>Escolha o destaque:</strong> personalize ícone e texto (ex: <em>Oferta Relâmpago</em>).</li>
                <li><strong>Urgência com contagem regressiva:</strong> ative data de expiração para aumentar conversões.</li>
                <li><strong>Compartilhe na Bio:</strong> coloque seu link oficial no Instagram, TikTok e YouTube.</li>
              </ul>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 32px 0 20px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #1E60CF, #256EE8); color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 8px 20px rgba(30, 96, 207, 0.35);">
                Acessar Meu Painel →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; line-height: 1.5; color: #7D97B8; text-align: center;">
              <p style="margin: 0 0 6px 0;">
                Este e-mail foi enviado automaticamente porque você criou uma conta no <strong>meucupom</strong>.
              </p>
              <p style="margin: 0;">
                <a href="${appUrl}" style="color: #38BDF8; text-decoration: none;">meucupom.bio</a> — Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  await sendTransactionalEmail({
    to: user.email,
    subject,
    text,
    html,
  });
}

/**
 * Envia e-mail para redefinição de senha com link seguro.
 */
export async function sendPasswordResetEmail(input: {
  email: string;
  name?: string | null;
  resetUrl: string;
}): Promise<void> {
  const appUrl = resolveAppUrl();
  const userName = (input.name || "Criador").trim();
  const subject = "Redefinir sua senha no meucupom";

  const text = `Olá, ${userName}!

Recebemos um pedido para redefinir a senha da sua conta no meucupom.

Para criar uma nova senha, clique no link abaixo:
${input.resetUrl}

Este link é seguro e expira em breve. Se você não solicitou a redefinição de senha, ignore este e-mail; sua conta continuará segura.

Equipe meucupom
https://meucupom.bio
`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070C14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F4F8FD;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070C14; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #0E1624; border: 1px solid rgba(148, 197, 255, 0.16); border-radius: 20px; padding: 36px 28px; text-align: left; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <span style="display: inline-block; background: #1E60CF; color: #ffffff; padding: 6px 12px; border-radius: 10px; font-weight: 900; font-size: 15px; letter-spacing: -0.5px;">meu<span style="color: #38BDF8;">cupom</span></span>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding-top: 24px;">
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #FFFFFF;">
                Recuperação de Senha
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #CBD5E1;">
                Olá, <strong>${userName}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta vinculada ao e-mail <strong>${input.email}</strong>.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                Clique no botão abaixo para definir sua nova senha com segurança:
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <a href="${input.resetUrl}" style="display: inline-block; background: #1E60CF; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 8px 20px rgba(30, 96, 207, 0.35);">
                Redefinir Minha Senha →
              </a>
            </td>
          </tr>

          <!-- Fallback URL -->
          <tr>
            <td style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px; font-size: 12px; color: #94A3B8; word-break: break-all;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #CBD5E1;">Se o botão não funcionar, copie e cole este link no navegador:</p>
              <a href="${input.resetUrl}" style="color: #38BDF8; text-decoration: underline;">${input.resetUrl}</a>
            </td>
          </tr>

          <!-- Security note & Footer -->
          <tr>
            <td style="padding-top: 24px; font-size: 12px; line-height: 1.5; color: #64748B;">
              <p style="margin: 0 0 6px 0;">
                Se você não fez este pedido, fique tranquilo: sua conta permanece segura e nenhuma alteração foi realizada.
              </p>
              <p style="margin: 0;">
                <a href="${appUrl}" style="color: #38BDF8; text-decoration: none;">meucupom.bio</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  await sendTransactionalEmail({
    to: input.email,
    subject,
    text,
    html,
  });
}
