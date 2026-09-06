import { generateSessionSecret, hashSessionSecret } from "@/domain/token/secrets";
import { getDb } from "@/server/db/client";
import { insertDraft } from "@/server/repositories/diagnostic-repository";

export interface StartedDiagnostic {
  id: string;
  status: "draft";
  answersVersion: number;
  /** Returned to the route only so it can be written into the httpOnly cookie. */
  sessionSecret: string;
}

/**
 * Creates an anonymous draft. The secret is generated here, hashed, and
 * only the hash is persisted — the plaintext leaves this process solely
 * inside the Set-Cookie header.
 */
export async function startDiagnostic(): Promise<StartedDiagnostic> {
  const sessionSecret = generateSessionSecret();
  const row = await insertDraft(getDb(), {
    draftSessionHash: hashSessionSecret(sessionSecret),
  });

  return {
    id: row.id,
    status: "draft",
    answersVersion: row.answersVersion,
    sessionSecret,
  };
}
