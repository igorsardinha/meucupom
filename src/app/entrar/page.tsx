import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import {
  getAuth,
  isAppleOAuthEnabled,
  isDemoLoginEnabled,
  isGoogleOAuthEnabled,
} from "@/lib/auth";

async function AuthGate() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/painel");
  }

  return (
    <AuthForm
      googleEnabled={isGoogleOAuthEnabled()}
      appleEnabled={isAppleOAuthEnabled()}
      demoEnabled={isDemoLoginEnabled()}
    />
  );
}

export default function EntrarPage() {
  return (
    <div className="min-h-dvh bg-[#070C14] bg-[radial-gradient(circle_at_50%_-10%,rgba(47,108,181,0.32),transparent_52%)]">
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center text-sm text-[#9CB3CE]">
            Carregando...
          </div>
        }
      >
        <AuthGate />
      </Suspense>
    </div>
  );
}
