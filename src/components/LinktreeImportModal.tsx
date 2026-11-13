"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  ExternalLink,
  Link2,
  Loader2,
  Minus,
  RotateCcw,
  Sparkles,
  Tag,
  TreePine,
  X,
} from "lucide-react";
import { FREE_MAX_ACTIVE_OR_TOTAL_LINKS } from "@/lib/plans";
import { CreatorProfileData, LinkItemData } from "@/types/meucupom";
import {
  extractLinktreeUsername,
  LinktreeParsedData,
  LinktreeParsedItem,
} from "@/lib/linktree";

interface LinktreeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: {
    profile: CreatorProfileData;
    items: LinkItemData[];
    importedCount: number;
  }) => void;
  existingItemsCount: number;
  userIsPro: boolean;
}

export function LinktreeImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  existingItemsCount,
  userIsPro,
}: LinktreeImportModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Estados do fluxo
  const [step, setStep] = useState<"input" | "preview" | "success">("input");
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Dados retornados da API
  const [previewData, setPreviewData] = useState<LinktreeParsedData | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [editableItems, setEditableItems] = useState<LinktreeParsedItem[]>([]);
  const [importProfileData, setImportProfileData] = useState(true);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  // Sincroniza abertura e fechamento do <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Reset ao fechar
  const handleClose = () => {
    setErrorMessage("");
    onClose();
  };

  // Buscar dados no Linktree (Step 1 -> Step 2)
  const handleFetchLinktree = async (overrideUrl?: string) => {
    const rawTarget = overrideUrl || urlInput;
    const cleanUser = extractLinktreeUsername(rawTarget);

    if (!cleanUser) {
      setErrorMessage(
        "Por favor, informe a URL ou o @usuário do Linktree (ex: linktr.ee/seunome ou @seunome)"
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/import/linktree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          url: cleanUser,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Falha ao buscar dados no Linktree.");
      }

      const parsed: LinktreeParsedData = data.preview;
      setPreviewData(parsed);
      setEditableItems(parsed.items);

      // Pré-seleciona todos os itens encontrados
      const allIds = new Set(parsed.items.map((it) => it.id));
      setSelectedItemIds(allIds);

      // Se usuário tem foto/bio/redes encontradas, sugere importar
      setImportProfileData(
        Boolean(
          parsed.profile.avatarUrl ||
            parsed.profile.bio ||
            parsed.profile.publicEmail ||
            parsed.profile.instagramUrl ||
            parsed.profile.tiktokUrl ||
            parsed.profile.youtubeUrl
        )
      );

      setStep("preview");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle de seleção de um item individual
  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Selecionar todos / desmarcar todos
  const toggleSelectAll = () => {
    if (selectedItemIds.size === editableItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(editableItems.map((it) => it.id)));
    }
  };

  // Atualizar código de cupom de um item inline
  const updateItemCouponCode = (id: string, newCode: string) => {
    setEditableItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const code = newCode.trim().toUpperCase();
        return {
          ...it,
          couponCode: code,
          kind: code ? "coupon" : it.kind === "divider" ? "divider" : "link",
        };
      })
    );
  };

  // Atualizar título de um item inline
  const updateItemTitle = (id: string, newTitle: string) => {
    setEditableItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, title: newTitle } : it))
    );
  };

  // Cálculos de limites do plano
  const selectedItems = editableItems.filter((it) => selectedItemIds.has(it.id));
  const selectedNonDividersCount = selectedItems.filter((it) => it.kind !== "divider").length;
  const projectedNonDividers = replaceExisting
    ? selectedNonDividersCount
    : existingItemsCount + selectedNonDividersCount;
  const isLimitExceeded = !userIsPro && projectedNonDividers > FREE_MAX_ACTIVE_OR_TOTAL_LINKS;

  // Executar Importação (Step 2 -> Step 3)
  const handleConfirmImport = async () => {
    if (selectedItems.length === 0) {
      setErrorMessage("Selecione ao menos um item para importar.");
      return;
    }

    if (isLimitExceeded) {
      setErrorMessage(
        `O plano Grátis permite no máximo ${FREE_MAX_ACTIVE_OR_TOTAL_LINKS} links e cupons. Desmarque alguns ou assine o Pro.`
      );
      return;
    }

    setIsImporting(true);
    setErrorMessage("");

    try {
      const payload = {
        action: "import",
        items: selectedItems.map((it) => ({
          kind: it.kind,
          title: it.title,
          couponCode: it.couponCode,
          url: it.url,
          badge: it.badge,
          tag: it.tag,
          ctaLabel: it.ctaLabel,
          description: "",
        })),
        importProfile: importProfileData,
        profileData: importProfileData && previewData
          ? {
              avatarUrl: previewData.profile.avatarUrl,
              bio: previewData.profile.bio,
              instagramUrl: previewData.profile.instagramUrl,
              instagramHandle: previewData.profile.instagramHandle,
              tiktokUrl: previewData.profile.tiktokUrl,
              tiktokHandle: previewData.profile.tiktokHandle,
              youtubeUrl: previewData.profile.youtubeUrl,
              youtubeHandle: previewData.profile.youtubeHandle,
              publicEmail: previewData.profile.publicEmail,
            }
          : undefined,
        replaceExisting,
      };

      const res = await fetch("/api/import/linktree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Falha ao importar itens.");
      }

      setImportedCount(data.importedCount || selectedItems.length);
      setStep("success");

      // Notifica o componente pai para atualizar a página
      onImportSuccess({
        profile: data.profile,
        items: data.items,
        importedCount: data.importedCount || selectedItems.length,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="mc-dialog fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-transparent backdrop:bg-black/75"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#94C5FF]/20 bg-[#0E1624] text-white shadow-2xl">
        {/* Header Modal com Tema Verde do Linktree */}
        <div className="flex items-center justify-between border-b border-[#94C5FF]/14 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#39E09B]/15 text-[#39E09B]">
              <TreePine className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="text-base font-bold sm:text-lg">
                Importar do Linktree
              </h2>
              <p className="text-xs text-[#9CB3CE]">
                Traga seus links, cupons e seções em segundos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-[#9CB3CE] hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensagem de Erro Geral */}
        {errorMessage ? (
          <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        ) : null}

        {/* Conteúdo Dinâmico por Etapa */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ETAPA 1: INPUT DO LINKTREE */}
          {step === "input" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-[#39E09B]/20 bg-[#39E09B]/5 p-4 text-xs text-[#E2ECF7] sm:text-sm">
                <p className="font-semibold text-[#39E09B] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#39E09B]" /> Detecção Inteligente de Cupons
                </p>
                <p className="mt-1 text-[#9CB3CE]">
                  O MeuCupom detecta automaticamente códigos de desconto e emojis promocionais nos títulos
                  (ex: &quot;Sua Loja 🏷️ DESCONTO10&quot;, &quot;🎟️ MEU10&quot; ou &quot;Marca | Cupom: PROMO&quot;).
                </p>
              </div>

              <div>
                <label
                  htmlFor="linktree-url-input"
                  className="block text-xs font-semibold text-[#E2ECF7] mb-1.5"
                >
                  Endereço ou @usuário do Linktree
                </label>
                <div className="relative">
                  <input
                    id="linktree-url-input"
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFetchLinktree();
                      }
                    }}
                    placeholder="ex: linktr.ee/seunome ou @seunome"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#94C5FF]/25 bg-[#070C14] px-4 py-3 text-sm text-white placeholder-[#9CB3CE]/50 focus:border-[#39E09B] focus:outline-none focus:ring-1 focus:ring-[#39E09B]"
                  />
                  {isLoading && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#39E09B]" />
                    </div>
                  )}
                </div>

                <p className="mt-2 text-xs text-[#9CB3CE]">
                  Você pode colar o endereço completo ou apenas o seu @usuário do Linktree.
                </p>
              </div>
            </div>
          )}

          {/* ETAPA 2: PREVIEW E SELEÇÃO */}
          {step === "preview" && previewData && (
            <div className="flex flex-col gap-4">
              {/* Card do Perfil Detectado */}
              <div className="rounded-xl border border-[#94C5FF]/18 bg-[#070C14]/80 p-3.5">
                <div className="flex items-center gap-3">
                  {previewData.profile.avatarUrl ? (
                    <Image
                      src={previewData.profile.avatarUrl}
                      alt={previewData.profile.displayName}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full border border-white/10 object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E60CF] text-base font-bold text-white">
                      {previewData.profile.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-bold text-white text-sm sm:text-base">
                      {previewData.profile.displayName}
                    </h3>
                    <p className="truncate text-xs text-[#9CB3CE]">
                      linktr.ee/{previewData.username}
                    </p>
                    {previewData.profile.bio ? (
                      <p className="mt-1 line-clamp-1 text-xs text-[#E2ECF7]/80">
                        {previewData.profile.bio}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Opção de importar dados do perfil */}
                <div className="mt-3 border-t border-white/5 pt-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#E2ECF7]">
                    <input
                      type="checkbox"
                      checked={importProfileData}
                      onChange={(e) => setImportProfileData(e.target.checked)}
                      className="h-4 w-4 rounded border-[#94C5FF]/30 bg-[#070C14] text-[#39E09B] focus:ring-[#39E09B]"
                    />
                    <span>
                      Importar foto de perfil e redes sociais encontradas (
                      {[
                        previewData.profile.instagramUrl ? "Instagram" : null,
                        previewData.profile.tiktokUrl ? "TikTok" : null,
                        previewData.profile.youtubeUrl ? "YouTube" : null,
                        previewData.profile.publicEmail ? "E-mail" : null,
                      ]
                        .filter(Boolean)
                        .join(", ") || "nenhuma rede adicional"}
                      )
                    </span>
                  </label>
                </div>
              </div>

              {/* Modo de Importação: Adicionar ou Substituir */}
              <div className="rounded-xl border border-[#94C5FF]/14 bg-[#070C14]/40 p-3">
                <span className="text-xs font-semibold text-[#9CB3CE] block mb-2">
                  Destino dos links importados:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      !replaceExisting
                        ? "border-[#39E09B] bg-[#39E09B]/10 text-white"
                        : "border-white/10 bg-white/5 text-[#9CB3CE]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="import-mode"
                      checked={!replaceExisting}
                      onChange={() => setReplaceExisting(false)}
                      className="h-3.5 w-3.5 text-[#39E09B]"
                    />
                    <div>
                      <p className="font-semibold text-white">Adicionar aos atuais</p>
                      <p className="text-[11px] text-[#9CB3CE]">
                        Mantém seus links existentes e acrescenta os novos ao final
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      replaceExisting
                        ? "border-amber-400 bg-amber-400/10 text-white"
                        : "border-white/10 bg-white/5 text-[#9CB3CE]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="import-mode"
                      checked={replaceExisting}
                      onChange={() => setReplaceExisting(true)}
                      className="h-3.5 w-3.5 text-amber-400"
                    />
                    <div>
                      <p className="font-semibold text-white">Substituir todos</p>
                      <p className="text-[11px] text-[#9CB3CE]">
                        Apaga os links atuais e deixa apenas os do Linktree
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Alerta de Limite do Plano Grátis */}
              {isLimitExceeded && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <Crown className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-bold">Limite do Plano Grátis atingido</p>
                    <p className="mt-0.5 text-amber-200/90">
                      Você selecionou {selectedNonDividersCount} links, resultando em{" "}
                      {projectedNonDividers} links no total (o limite grátis é de{" "}
                      {FREE_MAX_ACTIVE_OR_TOTAL_LINKS}). Desmarque alguns itens abaixo ou faça
                      upgrade para o plano Pro para importar sem limites.
                    </p>
                  </div>
                </div>
              )}

              {/* Lista de Itens Encontrados */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-[#E2ECF7]">
                    Itens detectados ({selectedItemIds.size}/{editableItems.length} selecionados)
                  </div>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-[#39E09B] hover:underline"
                  >
                    {selectedItemIds.size === editableItems.length
                      ? "Desmarcar todos"
                      : "Selecionar todos"}
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {editableItems.map((item) => {
                    const isSelected = selectedItemIds.has(item.id);
                    const isDivider = item.kind === "divider";
                    const isCoupon = item.kind === "coupon";

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 transition-colors ${
                          isSelected
                            ? isDivider
                              ? "border-purple-400/30 bg-purple-950/20"
                              : isCoupon
                                ? "border-[#39E09B]/40 bg-[#39E09B]/8"
                                : "border-[#38BDF8]/30 bg-[#38BDF8]/6"
                            : "border-white/10 bg-white/[0.02] opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItemSelection(item.id)}
                            className="mt-1 h-4 w-4 rounded border-[#94C5FF]/30 bg-[#070C14] text-[#39E09B] focus:ring-[#39E09B]"
                          />

                          <div className="flex-1 min-w-0">
                            {/* Badges de Tipo */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                              {isDivider ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                                  <Minus className="h-3 w-3" /> DIVISÓRIA
                                </span>
                              ) : isCoupon ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-[#39E09B]/30 bg-[#39E09B]/20 px-2 py-0.5 text-[10px] font-bold text-[#39E09B]">
                                  <Tag className="h-3 w-3" /> CUPOM
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md border border-[#38BDF8]/30 bg-[#38BDF8]/20 px-2 py-0.5 text-[10px] font-bold text-[#7DD3FC]">
                                  <Link2 className="h-3 w-3" /> LINK
                                </span>
                              )}

                              {item.groupTitle ? (
                                <span className="text-[10px] text-[#9CB3CE]">
                                  em: {item.groupTitle}
                                </span>
                              ) : null}
                            </div>

                            {/* Título Editável */}
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateItemTitle(item.id, e.target.value)}
                              placeholder="Título"
                              className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-semibold text-white focus:border-[#39E09B] focus:outline-none"
                            />

                            {/* Campo de Código do Cupom se for cupom ou link */}
                            {!isDivider && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                                  <span className="text-[10px] font-bold text-[#9CB3CE]">
                                    CUPOM:
                                  </span>
                                  <input
                                    type="text"
                                    value={item.couponCode}
                                    onChange={(e) =>
                                      updateItemCouponCode(item.id, e.target.value)
                                    }
                                    placeholder="Sem cupom"
                                    className="flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[11px] text-[#39E09B] placeholder-zinc-500 focus:border-[#39E09B] focus:outline-none"
                                  />
                                </div>

                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="inline-flex items-center gap-1 text-[11px] text-[#9CB3CE] hover:text-white truncate max-w-[200px]"
                                    title={item.url}
                                  >
                                    <span className="truncate">{item.url}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3: SUCESSO */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#39E09B]/20 text-[#39E09B] mb-4">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Importação concluída com sucesso!
              </h3>
              <p className="mt-2 text-sm text-[#9CB3CE] max-w-md">
                <strong className="text-white">{importedCount} itens</strong> foram
                importados do Linktree para a sua página. Você já pode reorganizar e
                personalizar cada um deles no painel.
              </p>
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="flex items-center justify-between border-t border-[#94C5FF]/14 bg-[#070C14]/60 px-5 py-3.5">
          {step === "input" && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#9CB3CE] hover:bg-white/5 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleFetchLinktree()}
                disabled={isLoading || !urlInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#39E09B] px-5 py-2.5 text-xs font-bold text-[#070C14] hover:bg-[#43E660] disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#070C14]" />
                    <span>Buscando no Linktree...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={() => setStep("input")}
                disabled={isImporting}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-[#9CB3CE] hover:bg-white/5 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Trocar link</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting || selectedItems.length === 0 || isLimitExceeded}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#39E09B] px-5 py-2.5 text-xs font-bold text-[#070C14] hover:bg-[#43E660] disabled:opacity-50 transition-colors shadow-lg shadow-[#39E09B]/20"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#070C14]" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Importar {selectedItems.length} Itens</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === "success" && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E60CF] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#256EE8] transition-colors"
              >
                <span>Ver itens no painel</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
