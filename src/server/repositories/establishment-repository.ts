import { and, eq } from "drizzle-orm";
import { establishmentMembers, establishments } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

export interface EstablishmentRow {
  id: string;
  name: string;
  deliveryType: string | null;
  mainChannel: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function insertEstablishment(
  db: Executor,
  input: { name: string; deliveryType?: string | null; mainChannel?: string | null },
): Promise<EstablishmentRow> {
  const [row] = await db
    .insert(establishments)
    .values({
      name: input.name,
      deliveryType: input.deliveryType ?? null,
      mainChannel: input.mainChannel ?? null,
    })
    .returning();
  return row;
}

export async function findEstablishmentById(db: Executor, id: string): Promise<EstablishmentRow | null> {
  const [row] = await db.select().from(establishments).where(eq(establishments.id, id)).limit(1);
  return row ?? null;
}

export async function insertEstablishmentMember(
  db: Executor,
  input: { establishmentId: string; userId: string; role?: "owner" | "member" },
): Promise<void> {
  await db.insert(establishmentMembers).values({
    establishmentId: input.establishmentId,
    userId: input.userId,
    role: input.role ?? "owner",
  });
}

export async function findEstablishmentsForUser(db: Executor, userId: string): Promise<EstablishmentRow[]> {
  const rows = await db
    .select({ establishment: establishments })
    .from(establishmentMembers)
    .innerJoin(establishments, eq(establishmentMembers.establishmentId, establishments.id))
    .where(eq(establishmentMembers.userId, userId));
  return rows.map((row) => row.establishment);
}

/** Null when the user isn't a member — callers turn that into a 404, never a 403. */
export async function findMembership(
  db: Executor,
  input: { establishmentId: string; userId: string },
): Promise<{ role: "owner" | "member" } | null> {
  const [row] = await db
    .select({ role: establishmentMembers.role })
    .from(establishmentMembers)
    .where(
      and(
        eq(establishmentMembers.establishmentId, input.establishmentId),
        eq(establishmentMembers.userId, input.userId),
      ),
    )
    .limit(1);
  return row ?? null;
}
