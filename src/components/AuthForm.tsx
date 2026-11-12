"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface AuthFormProps {
  googleEnabled: boolean;
  demoEnabled: boolean;
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
      />
      <path
        fill="#34A853"
        d="M3.4 7.3l3.2 2.3C7.5 7.4 9.6 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 8.3 2.4 5.1 4.5 3.4 7.3z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.6c2.5 0 4.7-.8 6.3-2.3l-3-2.5c-.8.6-1.9 1-3.3 1-2.5 0-4.6-1.7-5.4-4l-3.3 2.5c1.7 3.3 5 5.3 8.7 5.3z"
      />
      <path
        fill="#4285F4"
        d="M21.2 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.2-1 2.2-2.1 2.9l3 2.5c1.8-1.7 2.9-4.2 2.9-7.7z"
      />
    </svg>
  );
}

export function AuthForm({
  googleEnabled,
  demoEnabled,
}: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSocialSignIn(provider: "google", enabled: boolean) {
    setErrorMsg(null);
    if (!enabled) {
      setErrorMsg(
        "O login com Google ainda não está configurado neste ambiente (defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env.local)."
      );
      return;
    }

    setLoading(provider);
    try {
      const res = await authClient.signIn.social({
        provider,
        callbackURL: "/painel",
      });
      if (res?.error) {
        setErrorMsg(res.error.message || "Não foi possível iniciar o login social.");
        setLoading(null);
      }
    } catch {
      setErrorMsg("Erro ao conectar com o provedor social.");
      setLoading(null);
    }
  }

  async function handleDemoLogin() {
    setErrorMsg(null);
    setLoading("demo");
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(body.error || "Não foi possível entrar na conta demo.");
        setLoading(null);
        return;
      }
      router.push("/painel");
      router.refresh();
    } catch {
      setErrorMsg("Erro de rede ao iniciar sessão demo.");
      setLoading(null);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading("email");

    try {
      if (mode === "register") {
        const res = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim(),
          callbackURL: "/painel",
        });
        if (res.error) {
          setErrorMsg(res.error.message || "Não foi possível criar sua conta.");
          setLoading(null);
          return;
        }
      } else {
        const res = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: "/painel",
        });
        if (res.error) {
          setErrorMsg("E-mail ou senha inválidos.");
          setLoading(null);
          return;
        }
      }
      router.push("/painel");
      router.refresh();
    } catch {
      setErrorMsg("Ocorreu um erro ao autenticar. Tente novamente.");
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col justify-center px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#9CB3CE] transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Voltar para o início</span>
      </Link>

      <div className="rounded-[24px] border border-[#94C5FF]/15 bg-[#0E1624] p-6 shadow-[0_20px_50px_rgba(2,6,14,0.55)] sm:p-7">
        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 text-xs font-bold text-[#38BDF8]">
            <span>meucupom</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            {mode === "login" ? "Entrar no seu painel" : "Criar sua página grátis"}
          </h1>
          <p className="mt-1.5 text-sm text-[#9CB3CE]">
            Personalize seus links, cores, layout e cupons de parceiros.
          </p>
        </div>

        {/* Social Providers */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleSocialSignIn("google", googleEnabled)}
            className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-[13px] border border-white/15 bg-white px-4 text-sm font-bold text-[#0B172A] transition hover:bg-[#F1F5F9] disabled:opacity-60"
          >
            {loading === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <GoogleIcon />
            )}
            <span>Continuar com Google</span>
            {!googleEnabled ? (
              <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                Configurar .env
              </span>
            ) : null}
          </button>

          {demoEnabled ? (
            <button
              type="button"
              disabled={loading !== null}
              onClick={handleDemoLogin}
              className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-[13px] border border-[#38BDF8]/40 bg-[#38BDF8]/12 px-4 text-sm font-bold text-[#7DD3FC] transition hover:bg-[#38BDF8]/20 disabled:opacity-60"
            >
              {loading === "demo" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>Testar agora com conta Demo (@modelo)</span>
            </button>
          ) : null}
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9CB3CE]">
            ou com e-mail
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {errorMsg ? (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-[12px] border border-red-400/35 bg-red-500/12 p-3 text-sm text-red-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          {mode === "register" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-name" className="text-sm font-semibold text-[#E2ECF7]">
                Seu nome
              </label>
              <input
                id="auth-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maria Clara"
                className="mc-input min-h-[48px] w-full rounded-[12px] border border-[#94C5FF]/20 bg-[#09101B] px-3.5 text-white placeholder:text-[#647D9E] focus:border-[#38BDF8] focus:outline-none"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-email" className="text-sm font-semibold text-[#E2ECF7]">
              E-mail
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="mc-input min-h-[48px] w-full rounded-[12px] border border-[#94C5FF]/20 bg-[#09101B] px-3.5 text-white placeholder:text-[#647D9E] focus:border-[#38BDF8] focus:outline-none"
            />
            <span className="mc-error-msg">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Informe um endereço de e-mail válido.</span>
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="auth-password" className="text-sm font-semibold text-[#E2ECF7]">
                Senha
              </label>
              {mode === "login" ? (
                <Link
                  href="/esqueci-senha"
                  className="text-xs font-semibold text-[#38BDF8] hover:underline"
                >
                  Esqueci minha senha
                </Link>
              ) : null}
            </div>
            <div className="relative">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="mc-input min-h-[48px] w-full rounded-[12px] border border-[#94C5FF]/20 bg-[#09101B] pr-12 pl-3.5 text-white placeholder:text-[#647D9E] focus:border-[#38BDF8] focus:outline-none"
              />
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-1 my-auto flex h-10 w-10 items-center justify-center rounded-lg text-[#9CB3CE] hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading !== null}
            className="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#1E60CF] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(30,96,207,0.35)] transition hover:bg-[#256EE8] disabled:opacity-60"
          >
            {loading === "email" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            <span>{mode === "login" ? "Entrar com e-mail" : "Criar minha página"}</span>
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#9CB3CE]">
          {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setErrorMsg(null);
            }}
            className="font-bold text-[#38BDF8] underline-offset-4 hover:underline"
          >
            {mode === "login" ? "Criar conta grátis" : "Entrar"}
          </button>
        </p>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-[#7D97B8]">
          Ao continuar, você concorda com nossos{" "}
          <Link href="/termos" className="underline hover:text-white">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link href="/privacidade" className="underline hover:text-white">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
