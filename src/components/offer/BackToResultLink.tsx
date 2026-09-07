"use client";

import { useRouter } from "next/navigation";

export function BackToResultLink() {
  const router = useRouter();
  return (
    <button type="button" className="text-link" onClick={() => router.back()}>
      ← Voltar ao resultado
    </button>
  );
}
