import { and, eq } from "drizzle-orm";
import { salesChannels } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

export interface SalesChannelRow {
  id: string;
  establishmentId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export async function findOrCreateSalesChannel(
  db: Executor,
  input: { establishmentId: string; name: string },
): Promise<SalesChannelRow> {
  const [existing] = await db
    .select()
    .from(salesChannels)
    .where(and(eq(salesChannels.establishmentId, input.establishmentId), eq(salesChannels.name, input.name)))
    .limit(1);
  if (existing) return existing;

  const [row] = await db
    .insert(salesChannels)
    .values({ establishmentId: input.establishmentId, name: input.name })
    .onConflictDoNothing({
      target: [salesChannels.establishmentId, salesChannels.name],
    })
    .returning();
  if (row) return row;

  // Lost the insert race to a concurrent request — the row now exists.
  const [row2] = await db
    .select()
    .from(salesChannels)
    .where(and(eq(salesChannels.establishmentId, input.establishmentId), eq(salesChannels.name, input.name)))
    .limit(1);
  if (!row2) throw new Error("Falha ao criar ou encontrar o canal de vendas");
  return row2;
}

export async function listSalesChannels(db: Executor, establishmentId: string): Promise<SalesChannelRow[]> {
  return db.select().from(salesChannels).where(eq(salesChannels.establishmentId, establishmentId));
}
