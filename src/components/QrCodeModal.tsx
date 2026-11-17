"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { Download, Copy, Check, X, QrCode, ExternalLink } from "lucide-react";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  subtitle?: string;
  logoUrl?: string;
  initials?: string;
  accentColor?: string;
  badge?: string;
}

export function QrCodeModal({
  isOpen,
  onClose,
  url,
  title,
  subtitle,
  logoUrl,
  initials = "MC",
  accentColor = "#38BDF8",
  badge,
}: QrCodeModalProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [svgString, setSvgString] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const generating = !dataUrl;

  useEffect(() => {
    if (!isOpen || !url) return;

    let isMounted = true;

    async function generateCodes() {
      try {
        const png = await QRCode.toDataURL(url, {
          width: 600,
          margin: 2,
          color: {
            dark: "#070C14",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H",
        });

        const svg = await QRCode.toString(url, {
          type: "svg",
          margin: 2,
          color: {
            dark: "#070C14",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H",
        });

        if (isMounted) {
          setDataUrl(png);
          setSvgString(svg);
        }
      } catch (err) {
        console.error("Erro ao gerar QR Code:", err);
      }
    }

    void generateCodes();

    return () => {
      isMounted = false;
    };
  }, [isOpen, url]);

  // Fechar com tecla ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handleCopyImage() {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch {
      handleDownloadPng();
    }
  }

  function handleDownloadPng() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qrcode-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleDownloadSvg() {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `qrcode-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`QR Code para ${title}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-[#0E1624] p-6 text-white shadow-2xl"
      >
        {/* Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[#9CB3CE] transition hover:bg-white/15 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-8">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              backgroundColor: `color-mix(in oklab, ${accentColor} 20%, #0E1624)`,
              borderColor: `color-mix(in oklab, ${accentColor} 40%, transparent)`,
              color: accentColor,
            }}
          >
            <QrCode className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-extrabold text-white">{title}</h2>
            <p className="truncate text-xs text-[#9CB3CE]">
              {subtitle || "Aponte a câmera do celular para abrir"}
            </p>
          </div>
        </div>

        {/* Card do QR Code com logo central */}
        <div className="relative mt-5 flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
          {generating ? (
            <div className="flex h-56 w-56 items-center justify-center text-sm font-semibold text-[#070C14]">
              Gerando QR Code...
            </div>
          ) : dataUrl ? (
            <div className="relative flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl}
                alt={`QR Code para ${url}`}
                className="h-56 w-56 rounded-xl object-contain"
              />
              {/* Badge ou Logo Central */}
              <div
                className="absolute flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-[#0E1624] text-xs font-black shadow-lg"
                style={{
                  color: accentColor,
                }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{badge || initials}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-56 w-56 items-center justify-center text-sm text-red-500">
              Falha ao gerar QR Code.
            </div>
          )}

          {/* URL abreviada */}
          <div className="mt-3 flex max-w-full items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
            <span className="truncate">{url}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={generating || !dataUrl}
            className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#1E60CF] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#256EE8] active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Baixar PNG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            disabled={generating || !svgString}
            className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10 active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Baixar SVG</span>
          </button>

          <button
            type="button"
            onClick={handleCopyImage}
            disabled={generating || !dataUrl}
            className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-[#9CB3CE] transition hover:bg-white/10 hover:text-white active:scale-[0.98] disabled:opacity-50"
          >
            {copiedImage ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300">Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copiar Imagem</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-[#9CB3CE] transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copiar Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
