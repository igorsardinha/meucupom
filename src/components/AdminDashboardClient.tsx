"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Database,
  Download,
  ExternalLink,
  Flag,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Terminal,
  Ticket,
  Trash2,
  Upload,
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
import type { CreatorProfileData, PlatformCouponData } from "@/types/meucupom";

interface AdminDashboardClientProps {
  initialData: AdminOverviewData;
  adminEmail: string;
  mercadoPagoEnabled: boolean;
  proPriceBrl: number;
  defaultTab?: AdminTab;
}

type AdminTab = "users" | "subscriptions" | "coupons" | "reports" | "backups";
type UserFilter = "all" | "pro" | "permuta" | "free" | "suspended";

interface BackupStatsState {
  dialect: string;
  totalRecords: number;
  tables?: Record<string, number>;
  [key: string]: unknown;
}

interface ParsedBackupInfo {
  version: string;
  app: string;
  createdAt: string;
  totalRecords: number;
  counts: Record<string, number>;
  rawBackup: unknown;
}

const TABLE_LABELS: Record<string, string> = {
  user: "Usuários (Auth)",
  session: "Sessões Ativas",
  account: "Contas Conectadas",
  verification: "Tokens de Verificação",
  creator_profile: "Perfis de Criadores",
  link_item: "Links & Cupons",
  profile_event: "Cliques & Visualizações",
  abuse_report: "Denúncias",
  platform_coupon: "Cupons Promocionais",
  platform_coupon_redemption: "Resgates de Cupons",
};

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
  defaultTab,
}: AdminDashboardClientProps) {
  const [data, setData] = useState<AdminOverviewData>(initialData);
  const [coupons, setCoupons] = useState<PlatformCouponData[]>(initialData.coupons || []);
  const [activeTab, setActiveTab] = useState<AdminTab>(defaultTab || "users");
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [isNewCouponOpen, setIsNewCouponOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    influencerName: "",
    influencerEmail: "",
    description: "",
    durationDays: 30,
    discountPercent: 10,
    maxUses: 100,
  });
  const [savingCoupon, setSavingCoupon] = useState(false);

  const [backupStats, setBackupStats] = useState<BackupStatsState | null>(null);
  const [loadingBackupStats, setLoadingBackupStats] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [parsedBackup, setParsedBackup] = useState<ParsedBackupInfo | null>(null);
  const [fileParseError, setFileParseError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<"clean" | "merge">("clean");
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [confirmRestoreInput, setConfirmRestoreInput] = useState("");
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{
    recordsRestored: number;
    preRestoreSnapshot?: string;
    mode: string;
  } | null>(null);

  const displayTables: Record<string, number> = useMemo(() => {
    if (!backupStats) return {};
    if (backupStats.tables && typeof backupStats.tables === "object") {
      return backupStats.tables;
    }
    const s = backupStats as unknown as Record<string, unknown>;
    return {
      user: Number(s.user || 0),
      session: Number(s.session || 0),
      account: Number(s.account || 0),
      verification: Number(s.verification || 0),
      creator_profile: Number(s.creatorProfile || s.creator_profile || 0),
      link_item: Number(s.linkItem || s.link_item || 0),
      profile_event: Number(s.profileEvent || s.profile_event || 0),
      abuse_report: Number(s.abuseReport || s.abuse_report || 0),
      platform_coupon: Number(s.platformCoupon || s.platform_coupon || 0),
      platform_coupon_redemption: Number(
        s.platformCouponRedemption || s.platform_coupon_redemption || 0
      ),
    };
  }, [backupStats]);

  React.useEffect(() => {
    if (defaultTab === "backups") {
      let active = true;
      fetch("/api/admin/backup?action=stats")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (active && json?.ok && json?.stats) {
            setBackupStats(json.stats);
          }
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }
  }, [defaultTab]);

  async function fetchBackupStats() {
    setLoadingBackupStats(true);
    try {
      const res = await fetch("/api/admin/backup?action=stats");
      if (!res.ok) {
        notify("error", "Não foi possível carregar estatísticas do banco.");
        return;
      }
      const json = await res.json();
      if (json.ok && json.stats) {
        setBackupStats(json.stats);
      }
    } catch {
      notify("error", "Erro ao carregar estatísticas do banco.");
    } finally {
      setLoadingBackupStats(false);
    }
  }

  async function handleDownloadBackup() {
    setDownloadingBackup(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        notify("error", err?.error || "Erro ao gerar arquivo de backup.");
        return;
      }
      const blob = await res.blob();
      const contentDisposition = res.headers.get("content-disposition");
      let filename = `meucupom-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      notify("ok", "Backup baixado com sucesso!");
      fetchBackupStats();
    } catch {
      notify("error", "Erro ao baixar arquivo de backup.");
    } finally {
      setDownloadingBackup(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileParseError(null);
    setParsedBackup(null);
    setRestoreResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        if (!json || typeof json !== "object") {
          throw new Error("Arquivo não contém um objeto JSON válido.");
        }
        if (json.app !== "meucupom.bio") {
          throw new Error(
            `Arquivo não pertence ao meucupom.bio (identificador: "${json.app || "indefinido"}").`
          );
        }
        if (!json.tables || typeof json.tables !== "object") {
          throw new Error("O arquivo não possui o objeto de tabelas obrigatório.");
        }

        const tableKeys = Object.keys(json.tables);
        const counts: Record<string, number> = {};
        let total = 0;
        for (const k of tableKeys) {
          const arr = json.tables[k];
          const len = Array.isArray(arr) ? arr.length : 0;
          counts[k] = len;
          total += len;
        }

        setParsedBackup({
          version: json.version || "1.0",
          app: json.app,
          createdAt: json.createdAt || new Date().toISOString(),
          totalRecords: total,
          counts,
          rawBackup: json,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido ao ler o arquivo JSON.";
        setFileParseError(msg);
        notify("error", msg);
      }
    };
    reader.onerror = () => {
      setFileParseError("Falha na leitura do arquivo local.");
    };
    reader.readAsText(file);
  }

  async function handleExecuteRestore() {
    if (confirmRestoreInput !== "RESTAURAR") {
      notify("error", 'Digite "RESTAURAR" em maiúsculas para confirmar.');
      return;
    }
    if (!parsedBackup?.rawBackup) {
      notify("error", "Nenhum arquivo de backup válido carregado.");
      return;
    }

    setRestoringBackup(true);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backup: parsedBackup.rawBackup,
          mode: restoreMode,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        notify("error", json.error || "Erro durante o processo de restauração.");
        return;
      }

      setRestoreResult(json.result);
      setIsRestoreModalOpen(false);
      setConfirmRestoreInput("");
      notify(
        "ok",
        `Sucesso! ${json.result.recordsRestored} registros restaurados no banco de dados.`
      );
      fetchBackupStats();
      refreshAll();
    } catch {
      notify("error", "Erro ao conectar com o servidor para restauração.");
    } finally {
      setRestoringBackup(false);
    }
  }

  function notify(type: "ok" | "error", text: string) {
    setBanner({ type, text });
    window.setTimeout(() => {
      setBanner((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }

  function handleCopyCoupon(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    notify("ok", `Código "${code}" copiado!`);
    window.setTimeout(() => setCopiedCode((prev) => (prev === code ? null : prev)), 2000);
  }

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    setSavingCoupon(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponForm),
      });
      const json = await res.json();
      if (!res.ok) {
        notify("error", json.error || "Não foi possível criar o cupom.");
        return;
      }
      setCoupons(json.coupons || []);
      setIsNewCouponOpen(false);
      setCouponForm({
        code: "",
        influencerName: "",
        influencerEmail: "",
        description: "",
        durationDays: 30,
        discountPercent: 10,
        maxUses: 100,
      });
      notify("ok", `Cupom "${json.coupon?.code}" criado com sucesso!`);
    } catch {
      notify("error", "Erro ao conectar para criar cupom.");
    } finally {
      setSavingCoupon(false);
    }
  }

  async function handleToggleCoupon(couponId: string, currentActive: boolean) {
    setBusyId(couponId);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId, isActive: !currentActive }),
      });
      const json = await res.json();
      if (!res.ok) {
        notify("error", json.error || "Não foi possível alterar status.");
        return;
      }
      setCoupons(json.coupons || []);
      notify("ok", !currentActive ? "Cupom ativado!" : "Cupom pausado.");
    } catch {
      notify("error", "Erro ao atualizar cupom.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteCoupon(couponId: string, code: string) {
    if (!window.confirm(`Deseja realmente excluir o cupom "${code}"?`)) return;
    setBusyId(couponId);
    try {
      const res = await fetch(`/api/admin/coupons?couponId=${encodeURIComponent(couponId)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        notify("error", json.error || "Não foi possível excluir o cupom.");
        return;
      }
      setCoupons(json.coupons || []);
      notify("ok", `Cupom "${code}" excluído.`);
    } catch {
      notify("error", "Erro ao excluir cupom.");
    } finally {
      setBusyId(null);
    }
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
      if (next.coupons) setCoupons(next.coupons);
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
      isVerified?: boolean;
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
          className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-1.5 sm:grid-cols-3 lg:grid-cols-5"
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
            aria-selected={activeTab === "coupons"}
            onClick={() => setActiveTab("coupons")}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${
              activeTab === "coupons"
                ? "bg-[#1E60CF] text-white shadow-md"
                : "text-[#9CB3CE] hover:text-white"
            }`}
          >
            <Ticket className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Cupons de Parceiros ({coupons.length})</span>
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

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "backups"}
            onClick={() => {
              setActiveTab("backups");
              if (!backupStats) fetchBackupStats();
            }}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${
              activeTab === "backups"
                ? "bg-[#1E60CF] text-white shadow-md"
                : "text-[#9CB3CE] hover:text-white"
            }`}
          >
            <Database className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Backup &amp; Dados</span>
          </button>
        </div>

        {/* Search + Filter bar for Users/Subscriptions */}
        {activeTab === "users" || activeTab === "subscriptions" ? (
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
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-bold text-white">{u.displayName || u.userName}</p>
                            {u.isVerified || u.plan === "pro" ? (
                              <span
                                title={
                                  u.isVerified
                                    ? "Verificado manualmente pelo Super Admin"
                                    : "Verificado automaticamente pelo Plano Pro"
                                }
                                className="inline-flex items-center gap-1 rounded-full bg-[#1E60CF]/20 px-2 py-0.5 text-[10px] font-extrabold text-[#7DD3FC]"
                              >
                                <CheckCircle2 className="h-3 w-3 text-[#38BDF8]" />
                                <span>Verificado</span>
                              </span>
                            ) : null}
                          </div>
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
                                      { isVerified: !u.isVerified },
                                      u.isVerified
                                        ? `Selo verificado removido de ${u.email}.`
                                        : `Selo verificado concedido a ${u.email}!`
                                    )
                                  }
                                  className={`inline-flex min-h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-bold transition disabled:opacity-60 ${
                                    u.isVerified
                                      ? "border-blue-400/40 bg-blue-500/20 text-blue-200 hover:bg-blue-500/30"
                                      : "border-white/15 bg-white/5 text-[#9CB3CE] hover:border-white/30 hover:text-white"
                                  }`}
                                  title="Conceder ou revogar selo de perfil verificado"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>{u.isVerified ? "Desverificar" : "Verificar"}</span>
                                </button>

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

        {/* TAB: INFLUENCER COUPONS */}
        {activeTab === "coupons" ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5">
              <div>
                <h2 className="text-lg font-bold text-white">Cupons de Influenciadores &amp; Parceiros</h2>
                <p className="mt-1 text-xs text-[#9CB3CE]">
                  Crie cupons exclusivos para influenciadores divulgarem o <strong>meucupom</strong>. Criadores que utilizarem o cupom ativam o Plano Pro automaticamente.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewCouponOpen(true)}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 text-xs font-extrabold text-[#08101C] shadow-md hover:from-amber-300 hover:to-amber-400"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Novo Cupom de Influenciador</span>
              </button>
            </div>

            {/* Quick stats for coupons */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0E1624] p-4">
                <span className="text-xs font-semibold text-[#9CB3CE]">Total de Cupons Criados</span>
                <p className="mt-1 text-2xl font-black text-white">{coupons.length}</p>
              </div>
              <div className="rounded-2xl border border-amber-400/25 bg-[#0E1624] p-4">
                <span className="text-xs font-semibold text-amber-300">Criadores Beneficiados</span>
                <p className="mt-1 text-2xl font-black text-white">
                  {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
                </p>
                <p className="mt-0.5 text-[10px] text-[#9CB3CE]">Ativações de Pro via parceiros</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/25 bg-[#0E1624] p-4">
                <span className="text-xs font-semibold text-emerald-300">Cupons Ativos</span>
                <p className="mt-1 text-2xl font-black text-white">
                  {coupons.filter((c) => c.isActive).length}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-[#9CB3CE]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Código do Cupom</th>
                      <th className="px-4 py-3 font-semibold">Influenciador / Parceiro</th>
                      <th className="px-4 py-3 font-semibold">Benefício</th>
                      <th className="px-4 py-3 font-semibold">Usos / Limite</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-[#9CB3CE]">
                          <Ticket className="mx-auto h-8 w-8 text-amber-400/50" aria-hidden="true" />
                          <p className="mt-2 text-sm font-bold text-white">Nenhum cupom de influenciador cadastrado</p>
                          <p className="mt-1 text-xs">
                            Clique no botão acima para criar o primeiro cupom (ex: SARDINHA, VIP30).
                          </p>
                        </td>
                      </tr>
                    ) : (
                      coupons.map((c) => {
                        const isBusy = busyId === c.id;
                        const benefitLabel =
                          c.durationDays === 0
                            ? "Permuta Permanente"
                            : `${c.durationDays} dias de Pro`;
                        const pct = c.maxUses > 0 ? Math.min(100, Math.round((c.usedCount / c.maxUses) * 100)) : 0;

                        return (
                          <tr key={c.id} className="hover:bg-white/[0.02]">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="rounded-lg border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 font-mono text-xs font-extrabold text-amber-300">
                                  {c.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCoupon(c.code)}
                                  title="Copiar código"
                                  className="rounded p-1 text-[#9CB3CE] hover:bg-white/10 hover:text-white"
                                >
                                  {copiedCode === c.code ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                              {c.description ? (
                                <p className="mt-1 truncate max-w-[200px] text-[11px] text-[#9CB3CE]">{c.description}</p>
                              ) : null}
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="font-bold text-white">{c.influencerName}</div>
                              {c.influencerEmail ? (
                                <p className="text-[11px] text-[#9CB3CE]">{c.influencerEmail}</p>
                              ) : null}
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="flex flex-col items-start gap-1">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                    c.durationDays === 0
                                      ? "bg-purple-500/20 text-purple-300"
                                      : "bg-[#1E60CF]/20 text-[#7DD3FC]"
                                  }`}
                                >
                                  {benefitLabel}
                                </span>
                                {c.discountPercent > 0 ? (
                                  <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                                    {c.discountPercent}% OFF no Checkout
                                  </span>
                                ) : null}
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="font-mono text-xs font-bold text-white">
                                {c.usedCount} {c.maxUses > 0 ? `/ ${c.maxUses}` : "(ilimitado)"}
                              </div>
                              {c.maxUses > 0 ? (
                                <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      pct >= 90 ? "bg-red-400" : pct >= 50 ? "bg-amber-400" : "bg-emerald-400"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              ) : null}
                            </td>

                            <td className="px-4 py-3.5">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleToggleCoupon(c.id, c.isActive)}
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition disabled:opacity-50 ${
                                  c.isActive
                                    ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                                    : "bg-white/10 text-[#9CB3CE] hover:bg-white/20"
                                }`}
                              >
                                {c.isActive ? "Ativo" : "Pausado"}
                              </button>
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDeleteCoupon(c.id, c.code)}
                                title="Excluir cupom"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Novo Cupom */}
            {isNewCouponOpen ? (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="coupon-modal-title"
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
              >
                <div className="w-full max-w-lg rounded-2xl border border-amber-400/30 bg-[#0E1624] p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-amber-400" />
                      <h3 id="coupon-modal-title" className="text-base font-bold text-white">
                        Novo Cupom de Influenciador
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNewCouponOpen(false)}
                      className="rounded-lg p-1 text-[#9CB3CE] hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateCoupon} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="modal-coupon-code" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
                        Código do Cupom *
                      </label>
                      <input
                        id="modal-coupon-code"
                        type="text"
                        required
                        value={couponForm.code}
                        onChange={(e) =>
                          setCouponForm((f) => ({
                            ...f,
                            code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                          }))
                        }
                        placeholder="Ex: SARDINHA, VIP30, FITNESS"
                        className="mc-input min-h-[44px] w-full rounded-xl border border-white/20 bg-[#09101B] px-3 font-mono text-sm font-bold uppercase text-amber-300 placeholder-white/30"
                      />
                    </div>

                    <div>
                      <label htmlFor="modal-influencer-name" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
                        Nome do Influenciador / Parceiro *
                      </label>
                      <input
                        id="modal-influencer-name"
                        type="text"
                        required
                        value={couponForm.influencerName}
                        onChange={(e) => setCouponForm((f) => ({ ...f, influencerName: e.target.value }))}
                        placeholder="Ex: Igor Sardinha"
                        className="mc-input min-h-[44px] w-full rounded-xl border border-white/20 bg-[#09101B] px-3 text-sm font-semibold text-white placeholder-white/30"
                      />
                    </div>

                    <div>
                      <label htmlFor="modal-influencer-email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
                        E-mail de Contato (Opcional)
                      </label>
                      <input
                        id="modal-influencer-email"
                        type="email"
                        value={couponForm.influencerEmail}
                        onChange={(e) => setCouponForm((f) => ({ ...f, influencerEmail: e.target.value }))}
                        placeholder="influenciador@exemplo.com"
                        className="mc-input min-h-[44px] w-full rounded-xl border border-white/20 bg-[#09101B] px-3 text-sm text-white placeholder-white/30"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
                        Benefício (Tempo de Pro Grátis)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { days: 30, label: "30 dias (Padrão)" },
                          { days: 60, label: "60 dias" },
                          { days: 90, label: "90 dias" },
                          { days: 365, label: "1 Ano" },
                          { days: 0, label: "Permuta Permanente" },
                        ].map((opt) => (
                          <button
                            key={opt.days}
                            type="button"
                            onClick={() => setCouponForm((f) => ({ ...f, durationDays: opt.days }))}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                              couponForm.durationDays === opt.days
                                ? "border-amber-400 bg-amber-400 text-black shadow-sm"
                                : "border-white/10 bg-[#09101B] text-white/80 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
                        Desconto na Assinatura (Checkout Mercado Pago)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { pct: 0, label: "0% (Apenas dias grátis)" },
                          { pct: 10, label: "10% OFF" },
                          { pct: 15, label: "15% OFF" },
                          { pct: 20, label: "20% OFF" },
                          { pct: 30, label: "30% OFF" },
                          { pct: 50, label: "50% OFF" },
                        ].map((opt) => (
                          <button
                            key={opt.pct}
                            type="button"
                            onClick={() => setCouponForm((f) => ({ ...f, discountPercent: opt.pct }))}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                              couponForm.discountPercent === opt.pct
                                ? "border-emerald-400 bg-emerald-400 text-black shadow-sm"
                                : "border-white/10 bg-[#09101B] text-white/80 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-[#9CB3CE]">
                        {couponForm.discountPercent > 0
                          ? `Aplica ${couponForm.discountPercent}% de desconto recorrente no checkout do Mercado Pago (R$ ${(19.9 * (1 - couponForm.discountPercent / 100)).toFixed(2).replace(".", ",")}/mês).`
                          : "Sem desconto percentual no checkout."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="modal-coupon-maxuses" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
                          Limite de Usos (0 = ilimitado)
                        </label>
                        <input
                          id="modal-coupon-maxuses"
                          type="number"
                          min={0}
                          value={couponForm.maxUses}
                          onChange={(e) => setCouponForm((f) => ({ ...f, maxUses: parseInt(e.target.value, 10) || 0 }))}
                          className="mc-input min-h-[44px] w-full rounded-xl border border-white/20 bg-[#09101B] px-3 text-sm font-semibold text-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="modal-coupon-desc" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
                          Observação / Campanha
                        </label>
                        <input
                          id="modal-coupon-desc"
                          type="text"
                          value={couponForm.description}
                          onChange={(e) => setCouponForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Ex: Campanha Instagram Reels"
                          className="mc-input min-h-[44px] w-full rounded-xl border border-white/20 bg-[#09101B] px-3 text-sm text-white placeholder-white/30"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsNewCouponOpen(false)}
                        className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-[#9CB3CE] hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingCoupon || !couponForm.code.trim() || !couponForm.influencerName.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2 text-xs font-extrabold text-[#08101C] hover:bg-amber-300 disabled:opacity-50"
                      >
                        {savingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        <span>Criar Cupom</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
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

        {activeTab === "backups" ? (
          <section aria-label="Backup e Restauração de Dados" className="space-y-6">
            {/* Overview & Health Card */}
            <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#38BDF8]/25 bg-[#38BDF8]/10 text-[#7DD3FC]">
                    <Database className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">
                      Integridade &amp; Status do Banco de Dados
                    </h2>
                    <p className="text-xs text-[#9CB3CE]">
                      Mecanismo:{" "}
                      <span className="font-semibold uppercase text-white">
                        {backupStats?.dialect || "Detectando..."}
                      </span>{" "}
                      · Total de registros:{" "}
                      <span className="font-semibold text-[#7DD3FC]">
                        {backupStats ? backupStats.totalRecords.toLocaleString("pt-BR") : "—"}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={loadingBackupStats}
                  onClick={fetchBackupStats}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loadingBackupStats ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  <span>{loadingBackupStats ? "Atualizando..." : "Recarregar Contagens"}</span>
                </button>
              </div>

              {Object.keys(displayTables).length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {Object.entries(displayTables).map(([tableKey, count]) => (
                    <div key={tableKey} className="rounded-xl border border-white/8 bg-[#08101C] p-2.5">
                      <span
                        className="block truncate text-[11px] font-medium text-[#9CB3CE]"
                        title={tableKey}
                      >
                        {TABLE_LABELS[tableKey] || tableKey}
                      </span>
                      <span className="mt-0.5 text-lg font-bold text-white">
                        {Number(count || 0).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : loadingBackupStats ? (
                <div className="mt-4 flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#7DD3FC]" />
                  <span className="ml-2 text-xs text-[#9CB3CE]">
                    Carregando contagens em tempo real...
                  </span>
                </div>
              ) : null}
            </div>

            {/* Two Column Grid: Export & Import */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Card 1: Exportar Backup */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-400">
                      <Download className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Exportar Backup Completo
                      </h3>
                      <p className="text-xs text-[#9CB3CE]">
                        Gere uma cópia exata de todos os dados da plataforma
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-[#9CB3CE]">
                    Gera um arquivo JSON estruturado com todas as 10 tabelas relacionais do sistema. O arquivo pode ser guardado com segurança em discos locais ou backups em nuvem (S3, Drive) e é 100% interoperável entre SQLite e PostgreSQL.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-[#9CB3CE]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>Usuários, sessões, contas vinculadas e tokens de verificação</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>Perfis de criadores, biografias, temas, redes sociais e links de cupons</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>Eventos agregados de cliques, denúncias e cupons de influenciadores</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>Timestamps serializados em formato ISO (ISO-8601 UTC) com hash de versão</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 border-t border-white/8 pt-4">
                  <button
                    type="button"
                    disabled={downloadingBackup}
                    onClick={handleDownloadBackup}
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 text-sm font-bold text-white shadow-lg hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50"
                  >
                    {downloadingBackup ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>
                      {downloadingBackup
                        ? "Gerando arquivo de backup..."
                        : "Baixar Backup Completo (.json)"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Card 2: Restaurar Backup */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/10 text-amber-300">
                      <Upload className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Restaurar Banco de Dados
                      </h3>
                      <p className="text-xs text-[#9CB3CE]">
                        Restaure tabelas a partir de um arquivo JSON do meucupom.bio
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/8 p-3 text-xs text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <div>
                      <span className="font-bold">Proteção Automática Ativa:</span> Um snapshot
                      de emergência do estado atual do banco será salvo no servidor antes de aplicar
                      qualquer restauração.
                    </div>
                  </div>

                  {/* Input de arquivo */}
                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-semibold text-[#9CB3CE]">
                      Selecione o arquivo de backup (.json):
                    </label>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileSelect}
                      className="block w-full cursor-pointer rounded-xl border border-white/10 bg-[#08101C] p-2 text-xs text-[#9CB3CE] file:mr-4 file:rounded-xl file:border-0 file:bg-[#1E60CF] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-[#1E60CF]/85"
                    />
                    {fileParseError ? (
                      <p className="mt-2 text-xs font-medium text-red-400">{fileParseError}</p>
                    ) : null}
                  </div>

                  {/* Detalhes do arquivo analisado */}
                  {parsedBackup ? (
                    <div className="mt-4 rounded-xl border border-[#38BDF8]/25 bg-[#08101C] p-3 text-xs">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-bold text-[#7DD3FC]">Arquivo Válido Verificado</span>
                        <span className="text-[10px] text-[#9CB3CE]">
                          Versão {parsedBackup.version}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#9CB3CE]">
                        <div>
                          <span>Criado em:</span>{" "}
                          <strong className="text-white">
                            {new Date(parsedBackup.createdAt).toLocaleString("pt-BR")}
                          </strong>
                        </div>
                        <div>
                          <span>Total de Registros:</span>{" "}
                          <strong className="text-white">
                            {parsedBackup.totalRecords.toLocaleString("pt-BR")}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-white/8 pt-3">
                        <label className="mb-1.5 block text-[11px] font-bold text-white">
                          Modo de Restauração:
                        </label>
                        <div className="space-y-2">
                          <label className="flex cursor-pointer items-start gap-2">
                            <input
                              type="radio"
                              name="restoreMode"
                              value="clean"
                              checked={restoreMode === "clean"}
                              onChange={() => setRestoreMode("clean")}
                              className="mt-0.5 text-[#1E60CF]"
                            />
                            <span className="text-[11px] text-[#9CB3CE]">
                              <strong className="text-white">
                                Substituição Completa (Limpar &amp; Recriar)
                              </strong>
                              : Apaga os registros existentes e recria o banco exatamente igual ao
                              arquivo. (Recomendado para migração/recovery)
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-2">
                            <input
                              type="radio"
                              name="restoreMode"
                              value="merge"
                              checked={restoreMode === "merge"}
                              onChange={() => setRestoreMode("merge")}
                              className="mt-0.5 text-[#1E60CF]"
                            />
                            <span className="text-[11px] text-[#9CB3CE]">
                              <strong className="text-white">Mesclagem Segura (Upsert)</strong>:
                              Atualiza registros existentes e insere novos sem deletar o que já
                              está salvo.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {restoreResult ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <div>
                        <strong className="block font-bold">
                          Restauração Concluída com Sucesso!
                        </strong>
                        <span>
                          {restoreResult.recordsRestored} registros processados em modo{" "}
                          <span className="font-semibold uppercase">{restoreResult.mode}</span>.
                          {restoreResult.preRestoreSnapshot
                            ? ` Snapshot de emergência salvo no servidor (${restoreResult.preRestoreSnapshot}).`
                            : ""}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 border-t border-white/8 pt-4">
                  <button
                    type="button"
                    disabled={!parsedBackup || restoringBackup}
                    onClick={() => {
                      setConfirmRestoreInput("");
                      setIsRestoreModalOpen(true);
                    }}
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 px-4 text-sm font-bold text-white shadow-lg hover:from-red-500 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    <span>Iniciar Restauração...</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: CLI e Linha de Comando */}
            <div className="rounded-2xl border border-[#94C5FF]/14 bg-[#0E1624] p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/25 bg-purple-500/10 text-purple-300">
                  <Terminal className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Comandos de Terminal (CLI)</h3>
                  <p className="text-xs text-[#9CB3CE]">
                    Para administradores executarem diretamente no servidor via SSH ou scripts cron
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-[#08101C] p-3.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-semibold text-white">Gerar backup no servidor:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("npm run db:backup");
                        notify("ok", "Comando db:backup copiado!");
                      }}
                      className="rounded p-1 text-[#9CB3CE] hover:text-white"
                      title="Copiar comando"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <code className="block rounded bg-black/40 p-2 font-mono text-emerald-400">
                    npm run db:backup
                  </code>
                  <p className="mt-1.5 text-[11px] text-[#9CB3CE]">
                    Gera snapshot salvo em{" "}
                    <span className="font-mono text-white">
                      backups/meucupom-backup-[timestamp].json
                    </span>
                    .
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#08101C] p-3.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-semibold text-white">Restaurar último backup:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("npm run db:restore");
                        notify("ok", "Comando db:restore copiado!");
                      }}
                      className="rounded p-1 text-[#9CB3CE] hover:text-white"
                      title="Copiar comando"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <code className="block rounded bg-black/40 p-2 font-mono text-amber-300">
                    npm run db:restore
                  </code>
                  <p className="mt-1.5 text-[11px] text-[#9CB3CE]">
                    Pede confirmação digitada no terminal ou use{" "}
                    <span className="font-mono text-white">--yes</span> para automações.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal: Confirmação de Restauração */}
            {isRestoreModalOpen ? (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="restore-modal-title"
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
              >
                <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0B1220] p-6 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                      <AlertOctagon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 id="restore-modal-title" className="text-base font-extrabold text-white">
                        Confirmar Restauração
                      </h3>
                      <p className="text-xs text-red-300">Ação de alto impacto no banco de dados</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-[#9CB3CE]">
                    <p>
                      Você está prestes a restaurar{" "}
                      <strong className="text-white">
                        {parsedBackup?.totalRecords} registros
                      </strong>{" "}
                      em modo{" "}
                      <strong className="uppercase text-white">
                        {restoreMode === "clean" ? "Substituição Completa" : "Mesclagem Segura"}
                      </strong>
                      .
                    </p>
                    {restoreMode === "clean" ? (
                      <p className="text-amber-200">
                        Atenção: Os dados atuais serão substituídos pelo conteúdo deste arquivo de
                        backup. Um snapshot de emergência será salvo no servidor antes da alteração.
                      </p>
                    ) : (
                      <p className="text-emerald-300">
                        Modo Mesclagem: Os registros existentes serão atualizados e novos registros
                        serão inseridos.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-[#08101C] p-3">
                    <label className="mb-1.5 block text-xs font-semibold text-white">
                      Para prosseguir, digite{" "}
                      <span className="font-mono font-bold text-red-400">RESTAURAR</span> abaixo:
                    </label>
                    <input
                      type="text"
                      value={confirmRestoreInput}
                      onChange={(e) => setConfirmRestoreInput(e.target.value)}
                      placeholder="RESTAURAR"
                      className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-sm font-bold tracking-widest text-white uppercase placeholder:text-white/20 focus:border-red-400 focus:outline-none"
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                    <button
                      type="button"
                      disabled={restoringBackup}
                      onClick={() => {
                        setIsRestoreModalOpen(false);
                        setConfirmRestoreInput("");
                      }}
                      className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-[#9CB3CE] hover:text-white disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={confirmRestoreInput !== "RESTAURAR" || restoringBackup}
                      onClick={handleExecuteRestore}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-md hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {restoringBackup ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>{restoringBackup ? "Restaurando..." : "Confirmar e Restaurar"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
