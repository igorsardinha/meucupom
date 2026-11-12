import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";
import { getOrCreateProfileForUser } from "@/db/repository";
import { getAuth } from "@/lib/auth";
import { isStripeEnabled } from "@/lib/stripe";

async function DashboardLoader() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/entrar");
  }

  const data = await getOrCreateProfileForUser(session.user);

  return (
    <DashboardClient
      initialProfile={data.profile}
      initialItems={data.items}
      userEmail={session.user.email}
      stripeEnabled={isStripeEnabled()}
    />
  );
}

export default function PainelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#070C14] text-sm text-[#9CB3CE]">
          Carregando seu painel...
        </div>
      }
    >
      <DashboardLoader />
    </Suspense>
  );
}
