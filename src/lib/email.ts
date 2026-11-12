import { Resend } from "resend";

export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "meucupom <noreply@meucupom.app>";

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
