import { Resend } from "resend";

function getResendApiKey(): string {
  return (
    process.env.RESEND_API_KEY?.trim() ||
    process.env.RESEND_API_KEY_RESEND_API_KEY?.trim() ||
    ""
  );
}

export function isEmailEnabled(): boolean {
  return Boolean(getResendApiKey());
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = getResendApiKey();
  const domain = process.env.RESEND_API_KEY_RESEND_EMAIL_DOMAIN?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ||
    (domain ? `meucupom <noreply@${domain}>` : "meucupom <noreply@meucupom.app>");

  if (!apiKey) {
    console.info(
      `[meucupom email dev fallback]\nTo: ${input.to}\nSubject: ${input.subject}\n${input.text}`
    );
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
