"use client";

import { useEffect, useRef, useState } from "react";

interface RowMenuProps {
  onDelete: () => void;
  deleteLabel?: string;
}

/** The prototype's "⋯" row action, now a real (if minimal) dropdown instead of a toast placeholder. */
export function RowMenu({ onDelete, deleteLabel = "Excluir" }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <span
        className="row-link"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ⋯
      </span>
      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 4,
            padding: 4,
            zIndex: 30,
            minWidth: 120,
          }}
        >
          <div
            style={{ padding: "8px 10px", fontSize: 13, fontWeight: 600, color: "var(--red)", cursor: "pointer", borderRadius: "var(--radius-sm)" }}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            {deleteLabel}
          </div>
        </div>
      )}
    </div>
  );
}
