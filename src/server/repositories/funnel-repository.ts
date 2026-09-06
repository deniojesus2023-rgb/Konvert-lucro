import { funnelEvents } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

/**
 * Keys that must never reach the analytics table. Funnel metadata is
 * shipped to analytics tooling and read by humans debugging the funnel —
 * it is the wrong place for a session secret, a full result token, or the
 * lead's name/phone. The check is a hard failure, not a silent strip, so a
 * mistake surfaces in tests instead of quietly persisting.
 */
const FORBIDDEN_METADATA_KEYS = [
  "secret",
  "sessionsecret",
  "draftsessionhash",
  "token",
  "resulttoken",
  "name",
  "nome",
  "whatsapp",
  "phone",
  "telefone",
];

export function assertSafeFunnelMetadata(metadata: Record<string, unknown> | null): void {
  if (!metadata) return;

  for (const key of Object.keys(metadata)) {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
    if (FORBIDDEN_METADATA_KEYS.includes(normalized)) {
      throw new Error(
        `metadata do funil não pode conter a chave "${key}" (segredo, token completo ou dado pessoal)`,
      );
    }
  }
}

export async function recordFunnelEvent(
  db: Executor,
  input: {
    sessionId: string;
    eventName: string;
    diagnosticId?: string | null;
    leadId?: string | null;
    metadata?: Record<string, unknown> | null;
  },
): Promise<void> {
  assertSafeFunnelMetadata(input.metadata ?? null);

  await db.insert(funnelEvents).values({
    sessionId: input.sessionId,
    eventName: input.eventName,
    diagnosticId: input.diagnosticId ?? null,
    leadId: input.leadId ?? null,
    metadata: input.metadata ?? null,
  });
}
