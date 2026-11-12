"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function RedefinirSenhaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!token) {
      setErrorMsg("Token de redefinição inválido ou expirado.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (res.error) {
        setErrorMsg(res.error.message || "Token expirado ou inválido.");
        setLoading(false);
        return;
      }
      setDone(true);
      window.setTimeout(() => router.push("/entrar"), 1800);
    } catch {
      setErrorMsg("Erro de rede ao redefinir senha.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-[440px] flex-col justify-center">
      <div className="rounded-[24px] border border-[#94C5FF]/15 bg-[#0E1624] p-6 shadow-2xl sm:p-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Criar nova senha</h1>
        <p className="mt-1.5 text-sm text-[#9CB3CE]">
          Escolha uma nova senha com pelo menos 8 caracteres.
        </p>

        {done ? (
          <div className="mt-6 flex items-center gap-2.5 rounded-2xl border border-emerald-400/35 bg-emerald-500/12 p-4 text-sm text-emerald-100">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
            <span>Senha atualizada! Redirecionando para o login...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            {errorMsg ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-400/35 bg-red-500/12 p-3 text-sm text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            <div>
              <label htmlFor="new-pw" className="mb-1.5 block text-sm font-semibold">
                Nova senha
              </label>
              <input
                id="new-pw"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mc-input min-h-[48px] w-full rounded-[12px] border border-[#94C5FF]/20 bg-[#09101B] px-3.5 text-white"
              />
            </div>

            <div>
              <label htmlFor="confirm-pw" className="mb-1.5 block text-sm font-semibold">
                Confirmar nova senha
              </label>
              <input
                id="confirm-pw"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mc-input min-h-[48px] w-full rounded-[12px] border border-[#94C5FF]/20 bg-[#09101B] px-3.5 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[13px] bg-[#1E60CF] px-4 text-sm font-bold text-white hover:bg-[#256EE8] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Salvar nova senha</span>
            </button>

            <Link
              href="/entrar"
              className="text-center text-sm font-semibold text-[#9CB3CE] hover:text-white"
            >
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-dvh bg-[#070C14] px-4 py-10 text-[#F4F8FD]">
      <Suspense
        fallback={
          <div className="flex min-h-[80dvh] items-center justify-center text-sm text-[#9CB3CE]">
            Carregando...
          </div>
        }
      >
        <RedefinirSenhaForm />
      </Suspense>
    </div>
  );
}
