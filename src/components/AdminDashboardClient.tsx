"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Crown,
  ExternalLink,
  Flag,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { BrandIcon } from "@/components/BrandIcon";
import { BrandLogo } from "@/components/BrandLogo";
import type {
  AdminOverviewData,
  AdminReportSummary,
  AdminUserSummary,
} from "@/db/repository";
import { authClient } from "@/lib/auth-client";
import type { CreatorProfileData } from "@/types/meucupom";

interface AdminDashboardClientProps {
  initialData: AdminOverviewData;
  adminEmail: string;
  mercadoPagoEnabled: boolean;
  proPriceBrl: number;
}

type AdminTab = "users" | "subscriptions" | "reports";
type UserFilter = "all" | "pro" | "permuta" | "free" | "suspended";

const STATUS_LABELS: Record<CreatorProfileData["subscriptionStatus"], string> = {
  active: "Ativa",
  trialing: "Em teste",
  past_due: "Pendente/Pausada",
  canceled: "Cancelada",
  inactive: "Inativa",
  permuta: "Permuta",
};

export function AdminDashboardClient({
  initialData,
  adminEmail,
  mercadoPagoEnabled,
  proPriceBrl,
}: AdminDashboardClientProps) {
  const [data, setData] = useState<AdminOverviewData>(initialData);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function notify(type: "ok" | "error", text: string) {
    setBanner({ type, text });
    window.setTimeout(() => {
      setBanner((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const res = await authClient.signOut();
      if (res?.error) {
        await fetch("/api/auth/sign-out", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
      }
    } catch {
      try {
        await fetch("/api/auth/sign-out", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
      } catch {
        // Proceed with hard navigation
      }
    } finally {
      window.location.href = `${window.location.origin}/entrar`;
    }
  }

  async function refreshAll() {
    setBusyId("refresh");
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        notify("error", "Não foi possível atualizar os dados.");
        return;
      }
      const next = (await res.json()) as AdminOverviewData;
      setData(next);
      notify("ok", "Lista atualizada.");
    } catch {
      notify("error", "Erro de rede ao atualizar.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateUser(
    user: AdminUserSummary,
    patch: {
      plan?: "free" | "pro";
      subscriptionStatus?: CreatorProfileData["subscriptionStatus"];
      isSuspended?: boolean;
      currentPeriodEndDays?: number | null;
      syncMercadoPago?: boolean;
      cancelMercadoPago?: boolean;
    },
    successText: string
  ) {
    setBusyId(user.userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, ...patch }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        data?: AdminOverviewData;
        error?: string;
      };
      if (!res.ok || !json.data) {
        notify("error", json.error || "Não foi possível atualizar o usuário.");
        return;
      }
      setData(json.data);
      notify("ok", successText);
    } catch {
      notify("error", "Erro de conexão ao salvar alteração.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateReport(
    report: AdminReportSummary,
    status: "open" | "resolved" | "dismissed",
    suspendTarget?: boolean
  ) {
    setBusyId(report.id);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id, status, suspendTarget }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        data?: AdminOverviewData;
        error?: string;
      };
      if (!res.ok || !json.data) {
        notify("error", json.error || "Não foi possível atualizar a denúncia.");
        return;
      }
      setData(json.data);
      notify(
        "ok",
        suspendTarget
          ? "Página suspensa e denúncia marcada como resolvida."
          : "Status da denúncia atualizado."
      );
    } catch {
      notify("error", "Erro de conexão ao atualizar denúncia.");
    } finally {
      setBusyId(null);
    }
  }

  const stats = useMemo(() => {
    const totalUsers = data.users.length;
    const proUsers = data.users.filter((u) => u.plan === "pro" && !u.isSuspended).length;
    // Permutas são contas Pro concedidas por parceria; NÃO entram no faturamento
    const permutaUsers = data.users.filter(
      (u) => u.plan === "pro" && u.subscriptionStatus === "permuta" && !u.isSuspended
    ).length;
    // Apenas assinaturas pagas ativas geram faturamento (MRR)
    const paidSubscriptions = data.users.filter(
      (u) => u.plan === "pro" && u.subscriptionStatus === "active" && !u.isSuspended
    ).length;
    const suspendedCount = data.users.filter((u) => u.isSuspended).length;
    const openReports = data.reports.filter((r) => r.status === "open").length;
    const estimatedMrr = paidSubscriptions * proPriceBrl;
    return {
      totalUsers,
      proUsers,
      paidSubscriptions,
      permutaUsers,
      suspendedCount,
      openReports,
      estimatedMrr,
    };
  }, [data, proPriceBrl]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.users.filter((u) => {
      if (userFilter === "pro" && (u.plan !== "pro" || u.subscriptionStatus === "permuta")) return false;
      if (userFilter === "permuta" && u.subscriptionStatus !== "permuta") return false;
      if (userFilter === "free" && u.plan !== "free") return false;
      if (userFilter === "suspended" && !u.isSuspended) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        u.userName.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.slug.toLowerCase().includes(q) ||
        u.mpPreapprovalId.toLowerCase().includes(q)
      );
    });
  }, [data.users, searchQuery, userFilter]);

  return (
    <div className="min-h-dvh bg-[#070C14] text-[#F4F8FD]">
      <header className="sticky top-0 z-30 border-b border-amber-400/20 bg-[#070C14]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-1.5 text-[#08101C] shadow-md shadow-amber-400/20">
              <BrandIcon className="h-full w-full" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <BrandLogo className="h-5 w-auto" />
                <span className="rounded-full border border-amber-400/35 bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-[#9CB3CE]">{adminEmail}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/painel"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#38BDF8]/35 bg-[#38BDF8]/12 px-3.5 text-xs font-bold text-[#7DD3FC] hover:bg-[#38BDF8]/20"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Minha página (/painel)</span>
            </Link>

            <button
              type="button"
              disabled={busyId === "refresh"}
              onClick={refreshAll}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${busyId === "refresh" ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              <span>Atualizar</span>
            </button>

            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-semibold text-[#9CB3CE] hover:border-white/30 hover:text-white disabled:opacity-60"
            >
              {signingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{signingOut ? "Saindo..." : "Sair"}</span>
            </button>
          </div>
        </div>
      </header>

      {banner ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-2xl ${
            banner.type === "error"
              ? "border-red-400/50 bg-[#2A0F14] text-red-100"
              : "border-emerald-400/50 bg-[#0A241C] text-emerald-100"
          }`}
        >
          {banner.type === "error" ? (
            <AlertTriangle className="h-4 w-4 text-red-300" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4 text-emerald-300" aria-hidden="true" />
          )}
          <span>{banner.text}</span>
        </div>
      ) : null}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Global KPIs */}
        <section
          aria-label="Resumo da plataforma"
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
            <span className="text-xs font-semibold text-[#9CB3CE]">Usuários cadastrados</span>
            <p className="mt-1 text-2xl font-black text-white">{stats.totalUsers}</p>
          </div>
          <div className="rounded-2xl border border-[#38BDF8]/25 bg-[#0E1624] p-4">
            <span className="text-xs font-semibold text-[#7DD3FC]">Contas Pro</span>
            <p className="mt-1 text-2xl font-black text-white">{stats.proUsers}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/25 bg-[#0E1624] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">Receita mensal est.</span>
              {stats.permutaUsers > 0 ? (
                <span
                  className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300"
                  title={`${stats.permutaUsers} contas em permuta (isentas de faturamento)`}
                >
                  {stats.permutaUsers} permuta{stats.permutaUsers > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-2xl font-black text-white">
              R$ {stats.estimatedMrr.toFixed(2).replace(".", ",")}
            </p>
            <p className="mt-0.5 text-[10px] text-[#9CB3CE]">
              {stats.paidSubscriptions} pagas · {stats.permutaUsers} permutas isentas
            </p>
          </div>
          <div className="rounded-2xl border border-red-400/20 bg-[#0E1624] p-4">
            <span className="text-xs font-semibold text-red-300">Páginas suspensas</span>
            <p className="mt-1 text-2xl font-black text-white">{stats.suspendedCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/25 bg-[#0E1624] p-4">
            <span className="text-xs font-semibold text-amber-200">Denúncias abertas</span>
            <p className="mt-1 text-2xl font-black text-white">{stats.openReports}</p>
          </div>
        </section>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Módulos do Super Admin"
          className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${
              activeTab === "users"
                ? "bg-[#1E60CF] text-white shadow-md"
                : "text-[#9CB3CE] hover:text-white"
            }`}
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Usuários &amp; Páginas</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "subscriptions"}
            onClick={() => setActiveTab("subscriptions")}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${
              activeTab === "subscriptions"
                ? "bg-[#1E60CF] text-white shadow-md"
                : "text-[#9CB3CE] hover:text-white"
            }`}
          >
            <Crown className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Assinaturas ({stats.proUsers})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "reports"}
            onClick={() => setActiveTab("reports")}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${
              activeTab === "reports"
                ? "bg-[#1E60CF] text-white shadow-md"
                : "text-[#9CB3CE] hover:text-white"
            }`}
          >
            <Flag className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Denúncias ({stats.openReports})</span>
          </button>
        </div>

        {/* Search + Filter bar for Users/Subscriptions */}
        {activeTab !== "reports" ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-4">
            <div className="relative min-w-[240px] flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#9CB3CE]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, e-mail, @slug ou ID Mercado Pago..."
                className="mc-input min-h-[44px] w-full rounded-xl border border-white/15 bg-[#09101B] pr-3 pl-10 text-sm text-white"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "all", label: "Todos" },
                  { id: "pro", label: "Pro Pagos" },
                  { id: "permuta", label: "Permutas" },
                  { id: "free", label: "Grátis" },
                  { id: "suspended", label: "Suspensos" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setUserFilter(f.id)}
                  className={`min-h-9 rounded-full px-3.5 text-xs font-bold transition ${
                    userFilter === f.id
                      ? "bg-[#38BDF8] text-[#070C14]"
                      : "border border-white/12 bg-[#09101B] text-[#9CB3CE] hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* TAB: USERS */}
        {activeTab === "users" ? (
          <section className="overflow-hidden rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-[#09101B] text-xs uppercase text-[#9CB3CE]">
                    <th className="px-4 py-3 font-semibold">Usuário</th>
                    <th className="px-4 py-3 font-semibold">Página</th>
                    <th className="px-4 py-3 font-semibold">Plano &amp; Status</th>
                    <th className="px-4 py-3 font-semibold">Uso</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isBusy = busyId === u.userId;
                    return (
                      <tr
                        key={u.userId}
                        className="border-b border-white/6 last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3.5 align-top">
                          <p className="font-bold text-white">{u.displayName || u.userName}</p>
                          <p className="text-xs text-[#9CB3CE]">{u.email}</p>
                          <p className="mt-0.5 text-[11px] text-[#7DD3FC]">
                            Cadastro: {new Date(u.userCreatedAt).toLocaleDateString("pt-BR")}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          {u.slug ? (
                            <Link
                              href={`/${u.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#7DD3FC] hover:underline"
                            >
                              <span>/{u.slug}</span>
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </Link>
                          ) : (
                            <span className="text-xs text-[#9CB3CE]">Sem página criada</span>
                          )}
                          {u.isSuspended ? (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-200">
                              <Ban className="h-3 w-3" aria-hidden="true" />
                              Suspensa
                            </span>
                          ) : null}
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                                u.subscriptionStatus === "permuta"
                                  ? "border border-purple-400/35 bg-purple-500/20 text-purple-200"
                                  : u.plan === "pro"
                                    ? "bg-amber-400/20 text-amber-200"
                                    : "bg-white/10 text-[#9CB3CE]"
                              }`}
                            >
                              {u.subscriptionStatus === "permuta"
                                ? "Permuta"
                                : u.plan === "pro"
                                  ? "Pro"
                                  : "Grátis"}
                            </span>
                            {u.subscriptionStatus !== "permuta" ? (
                              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-[#9CB3CE]">
                                {STATUS_LABELS[u.subscriptionStatus]}
                              </span>
                            ) : null}
                          </div>
                          {u.mpPreapprovalId ? (
                            <p className="mt-1 font-mono text-[11px] text-[#9CB3CE]">
                              MP: {u.mpPreapprovalId}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-4 py-3.5 align-top text-xs text-[#9CB3CE]">
                          <p>
                            <strong className="text-white">{u.itemsCount}</strong> links/cupons
                          </p>
                          <p>
                            <strong className="text-white">{u.viewsCount}</strong> visitas
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-right align-top">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {u.profileId ? (
                              <>
                                {u.plan !== "pro" ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        updateUser(
                                          u,
                                          {
                                            plan: "pro",
                                            subscriptionStatus: "active",
                                            currentPeriodEndDays: 30,
                                          },
                                          `Plano Pro (Pago) ativado para ${u.email}.`
                                        )
                                      }
                                      className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-amber-400 px-2.5 text-xs font-extrabold text-[#08101C] hover:bg-amber-300 disabled:opacity-60"
                                    >
                                      <Crown className="h-3 w-3" aria-hidden="true" />
                                      <span>Ativar Pro</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        updateUser(
                                          u,
                                          {
                                            plan: "pro",
                                            subscriptionStatus: "permuta",
                                            currentPeriodEndDays: 365,
                                          },
                                          `Permuta ativada para ${u.email} (isento de faturamento).`
                                        )
                                      }
                                      className="inline-flex min-h-8 items-center rounded-lg border border-purple-400/40 bg-purple-500/15 px-2.5 text-xs font-bold text-purple-200 hover:bg-purple-500/25 disabled:opacity-60"
                                    >
                                      Permuta
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {u.subscriptionStatus === "permuta" ? (
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() =>
                                          updateUser(
                                            u,
                                            {
                                              plan: "pro",
                                              subscriptionStatus: "active",
                                              currentPeriodEndDays: 30,
                                            },
                                            `Conta ${u.email} convertida para Pro Pago.`
                                          )
                                        }
                                        className="inline-flex min-h-8 items-center rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-60"
                                      >
                                        Tornar Pago
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() =>
                                          updateUser(
                                            u,
                                            {
                                              plan: "pro",
                                              subscriptionStatus: "permuta",
                                              currentPeriodEndDays: 365,
                                            },
                                            `Conta ${u.email} convertida para Permuta (isenta).`
                                          )
                                        }
                                        className="inline-flex min-h-8 items-center rounded-lg border border-purple-400/40 bg-purple-500/15 px-2 text-xs font-bold text-purple-200 hover:bg-purple-500/25 disabled:opacity-60"
                                      >
                                        Mudar p/ Permuta
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        updateUser(
                                          u,
                                          {
                                            plan: "free",
                                            subscriptionStatus: "canceled",
                                            currentPeriodEndDays: null,
                                          },
                                          `Conta ${u.email} movida para Grátis.`
                                        )
                                      }
                                      className="inline-flex min-h-8 items-center rounded-lg border border-white/15 bg-[#09101B] px-2.5 text-xs font-bold text-[#E2ECF7] hover:border-white/30 disabled:opacity-60"
                                    >
                                      Mover p/ Grátis
                                    </button>
                                  </>
                                )}

                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    updateUser(
                                      u,
                                      { isSuspended: !u.isSuspended },
                                      u.isSuspended
                                        ? `Página /${u.slug} reativada.`
                                        : `Página /${u.slug} suspensa.`
                                    )
                                  }
                                  className={`inline-flex min-h-8 items-center rounded-lg px-2.5 text-xs font-bold disabled:opacity-60 ${
                                    u.isSuspended
                                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                      : "border border-red-400/35 bg-red-500/12 text-red-200 hover:bg-red-500/20"
                                  }`}
                                >
                                  {u.isSuspended ? "Reativar" : "Suspender"}
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#9CB3CE]">
                        Nenhum usuário encontrado com este filtro.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* TAB: SUBSCRIPTIONS */}
        {activeTab === "subscriptions" ? (
          <section className="space-y-4">
            {!mercadoPagoEnabled ? (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/8 p-4 text-xs text-amber-100">
                Integração com Mercado Pago aguardando `MP_ACCESS_TOKEN` no ambiente. Enquanto isso, você ainda pode ativar ou remover planos Pro manualmente por aqui.
              </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#09101B] text-xs uppercase text-[#9CB3CE]">
                      <th className="px-4 py-3 font-semibold">Assinante</th>
                      <th className="px-4 py-3 font-semibold">Plano</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">PreApproval Mercado Pago</th>
                      <th className="px-4 py-3 font-semibold">Validade / Renovação</th>
                      <th className="px-4 py-3 text-right font-semibold">Gerenciar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers
                      .filter((u) => u.plan === "pro" || Boolean(u.mpPreapprovalId))
                      .map((u) => {
                        const isBusy = busyId === u.userId;
                        return (
                          <tr
                            key={u.userId}
                            className="border-b border-white/6 last:border-0 hover:bg-white/[0.02]"
                          >
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-white">{u.displayName || u.userName}</p>
                              <p className="text-xs text-[#9CB3CE]">{u.email}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                                  u.subscriptionStatus === "permuta"
                                    ? "border border-purple-400/35 bg-purple-500/20 text-purple-200"
                                    : u.plan === "pro"
                                      ? "bg-amber-400/20 text-amber-200"
                                      : "bg-white/10 text-[#9CB3CE]"
                                }`}
                              >
                                {u.subscriptionStatus === "permuta"
                                  ? "Permuta"
                                  : u.plan === "pro"
                                    ? "Pro"
                                    : "Grátis"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-[#E2ECF7]">
                              {STATUS_LABELS[u.subscriptionStatus]}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs text-[#9CB3CE]">
                              {u.mpPreapprovalId ||
                                (u.subscriptionStatus === "permuta"
                                  ? "Parceria / Permuta (Isenta)"
                                  : "Liberação manual")}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-[#9CB3CE]">
                              {u.currentPeriodEnd
                                ? new Date(u.currentPeriodEnd).toLocaleDateString("pt-BR")
                                : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex flex-wrap justify-end gap-1.5">
                                {u.mpPreapprovalId && mercadoPagoEnabled ? (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      updateUser(
                                        u,
                                        { syncMercadoPago: true },
                                        `Assinatura de ${u.email} sincronizada com o Mercado Pago.`
                                      )
                                    }
                                    className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-[#38BDF8]/35 bg-[#38BDF8]/12 px-2.5 text-xs font-bold text-[#7DD3FC] hover:bg-[#38BDF8]/20 disabled:opacity-60"
                                  >
                                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                                    <span>Sincronizar MP</span>
                                  </button>
                                ) : null}

                                {u.mpPreapprovalId && mercadoPagoEnabled && u.plan === "pro" ? (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      updateUser(
                                        u,
                                        { cancelMercadoPago: true },
                                        `Assinatura Mercado Pago de ${u.email} cancelada.`
                                      )
                                    }
                                    className="inline-flex min-h-8 items-center rounded-lg border border-red-400/35 bg-red-500/12 px-2.5 text-xs font-bold text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                                  >
                                    Cancelar no MP
                                  </button>
                                ) : null}

                                {u.plan === "pro" ? (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      updateUser(
                                        u,
                                        {
                                          plan: "free",
                                          subscriptionStatus: "canceled",
                                          currentPeriodEndDays: null,
                                        },
                                        `Plano de ${u.email} revertido para Grátis.`
                                      )
                                    }
                                    className="inline-flex min-h-8 items-center rounded-lg border border-white/15 px-2.5 text-xs font-bold text-[#9CB3CE] hover:text-white disabled:opacity-60"
                                  >
                                    Revogar Pro
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      updateUser(
                                        u,
                                        {
                                          plan: "pro",
                                          subscriptionStatus: "active",
                                          currentPeriodEndDays: 30,
                                        },
                                        `Plano Pro reativado para ${u.email}.`
                                      )
                                    }
                                    className="inline-flex min-h-8 items-center rounded-lg bg-amber-400 px-2.5 text-xs font-extrabold text-[#08101C] hover:bg-amber-300 disabled:opacity-60"
                                  >
                                    Reativar Pro
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {filteredUsers.filter((u) => u.plan === "pro" || Boolean(u.mpPreapprovalId))
                      .length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#9CB3CE]">
                          Nenhuma assinatura ativa ou vinculada até o momento.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {/* TAB: REPORTS */}
        {activeTab === "reports" ? (
          <section className="space-y-3">
            {data.reports.length === 0 ? (
              <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-10 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-emerald-300" aria-hidden="true" />
                <p className="mt-2 font-bold text-white">Nenhuma denúncia registrada</p>
                <p className="mt-1 text-xs text-[#9CB3CE]">
                  Quando visitantes denunciarem alguma página, ela aparecerá aqui para revisão.
                </p>
              </div>
            ) : (
              data.reports.map((rep) => {
                const isBusy = busyId === rep.id;
                return (
                  <article
                    key={rep.id}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/${rep.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-mono text-sm font-bold text-[#7DD3FC] hover:underline"
                        >
                          <span>/{rep.slug}</span>
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            rep.status === "open"
                              ? "bg-amber-400/20 text-amber-200"
                              : rep.status === "resolved"
                              ? "bg-emerald-500/20 text-emerald-200"
                              : "bg-white/10 text-[#9CB3CE]"
                          }`}
                        >
                          {rep.status === "open"
                            ? "Em aberto"
                            : rep.status === "resolved"
                            ? "Resolvida"
                            : "Descartada"}
                        </span>
                        <span className="text-xs text-[#9CB3CE]">
                          {new Date(rep.createdAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-bold text-white">{rep.reason}</p>
                      {rep.details ? (
                        <p className="mt-1 text-xs text-[#9CB3CE]">{rep.details}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {rep.status !== "resolved" ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => updateReport(rep, "resolved", true)}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-60"
                        >
                          <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Suspender página</span>
                        </button>
                      ) : null}

                      {rep.status === "open" ? (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => updateReport(rep, "resolved", false)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/12 px-3 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Marcar resolvida</span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => updateReport(rep, "dismissed", false)}
                            className="inline-flex min-h-9 items-center rounded-xl border border-white/15 px-3 text-xs font-semibold text-[#9CB3CE] hover:text-white disabled:opacity-60"
                          >
                            Descartar
                          </button>
                        </>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
