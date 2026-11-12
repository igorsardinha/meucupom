import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import { getAdminOverviewData } from "@/db/repository";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import { getProPriceBrl, isMercadoPagoEnabled } from "@/lib/mercadopago";

async function AdminLoader() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/entrar");
  }

  if (!isSuperAdminEmail(session.user.email)) {
    redirect("/painel");
  }

  const overview = await getAdminOverviewData();

  return (
    <AdminDashboardClient
      initialData={overview}
      adminEmail={session.user.email}
      mercadoPagoEnabled={isMercadoPagoEnabled()}
      proPriceBrl={getProPriceBrl()}
    />
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#070C14] text-sm text-[#9CB3CE]">
          Carregando painel Super Admin...
        </div>
      }
    >
      <AdminLoader />
    </Suspense>
  );
}
