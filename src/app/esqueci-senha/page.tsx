"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          redirectTo: `${window.location.origin}/redefinir-senha`,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setErrorMsg(body.message || "Não foi possível enviar o link de recuperação.");
      } else {
        setSent(true);
      }
    } catch {
      setErrorMsg("Erro de rede ao solicitar redefinição.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#070C14] px-4 py-10 text-[#F4F8FD] bg-[radial-gradient(circle_at_50%_-10%,rgba(47,108,181,0.32),transparent_52%)]">
      <div className="mx-auto flex min-h-[80dvh] max-w-[440px] flex-col justify-center">
        <Link
          href="/entrar"
          className="mb-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#9CB3CE] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Voltar para o login</span>
        </Link>

        <div className="rounded-[24px] border border-[#94C5FF]/15 bg-[#0E1624] p-6 shadow-2xl sm:p-7">
          <h1 className="text-2xl font-extrabold tracking-tight">Recuperar senha</h1>
          <p className="mt-1.5 text-sm text-[#9CB3CE]">
            Informe o e-mail da sua conta para receber o link de redefinição.
          </p>

          {sent ? (
            <div className="mt-6 rounded-2xl border border-emerald-400/35 bg-emerald-500/12 p-4 text-sm text-emerald-100">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                <div>
                  <p className="font-bold">Verifique seu e-mail</p>
                  <p className="mt-1 text-emerald-100/90">
                    Se existir uma conta cadastrada com <strong>{email}</strong>, enviamos um link
                    para criar uma nova senha. (Em modo local sem chave Resend, o link também é
                    impresso no terminal do servidor.)
                  </p>
                </div>
              </div>
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
                <label htmlFor="reset-email" className="mb-1.5 block text-sm font-semibold">
                  E-mail cadastrado
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
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
                  <Mail className="h-4 w-4" aria-hidden="true" />
                )}
                <span>Enviar link de redefinição</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
