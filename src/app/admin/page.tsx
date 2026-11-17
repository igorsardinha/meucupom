import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import { getAdminOverviewData } from "@/db/repository";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import { getProPriceBrl, isMercadoPagoEnabled } from "@/lib/mercadopago";

interface AdminPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

async function AdminLoader({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const validTabs = ["users", "subscriptions", "coupons", "reports", "backups"] as const;
  const defaultTab =
    sp?.tab && validTabs.includes(sp.tab as (typeof validTabs)[number])
      ? (sp.tab as (typeof validTabs)[number])
      : undefined;

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
      defaultTab={defaultTab}
    />
  );
}

export default function AdminPage({ searchParams }: AdminPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#070C14] text-sm text-[#9CB3CE]">
          Carregando painel Super Admin...
        </div>
      }
    >
      <AdminLoader searchParams={searchParams} />
    </Suspense>
  );
}
