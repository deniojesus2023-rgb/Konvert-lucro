"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A modal wasn't part of the original prototype (every "new X" button just
 * toasted "disponível na versão completa"). This reuses the prototype's
 * own `.card` styling for the panel — same border, radius and shadow as
 * every other card in the app — so it reads as a native part of the
 * design system, not a bolted-on library's look.
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16,26,51,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 90,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card section-block"
        style={{ width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            {title}
          </div>
          <div className="icon-btn" onClick={onClose} title="Fechar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
