import { NextResponse, type NextRequest } from "next/server";
import { uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { dailyEntrySchema, periodQuerySchema } from "@/lib/validation/tracking-schemas";
import { ApiError, handleRoute, notFound, unauthorized } from "@/server/http/errors";
import { readJsonBody } from "@/server/http/request-guards";
import { readAppSessionSecret } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { upsertDailyEntry } from "@/server/services/upsert-daily-entry";
import { getDb } from "@/server/db/client";
import { assertMembership } from "@/server/services/establishment-membership";
import { listDailyEntriesInRange } from "@/server/repositories/daily-entry-repository";
import { listSalesChannels } from "@/server/repositories/sales-channel-repository";
import { centsFromDb } from "@/server/db/money-codec";

export const dynamic = "force-dynamic";

/**
 * GET /api/app/establishments/[establishmentId]/daily-entries?from&to —
 * lists the raw entries in a date range (for the `/app/vendas` list/edit
 * screen). POST creates or edits the one entry for a
 * (date, channel) pair, under the same optimistic-lock discipline as the
 * diagnostic's answers.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ establishmentId: string }> },
): Promise<NextResponse> {
  return handleRoute(async () => {
    const { establishmentId } = await context.params;
    const parsedId = uuidParamSchema.safeParse(establishmentId);
    if (!parsedId.success) throw notFound();

    const user = await getCurrentUser(readAppSessionSecret(request));
    if (!user) throw unauthorized();

    const query = periodQuerySchema.safeParse({
      from: request.nextUrl.searchParams.get("from"),
      to: request.nextUrl.searchParams.get("to"),
    });
    if (!query.success) {
      throw new ApiError("validation_failed", "Período inválido", {
        issues: query.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }

    const db = getDb();
    await assertMembership(db, { establishmentId: parsedId.data, userId: user.id });

    const [rows, channels] = await Promise.all([
      listDailyEntriesInRange(db, {
        establishmentId: parsedId.data,
        fromDate: query.data.from,
        toDate: query.data.to,
      }),
      listSalesChannels(db, parsedId.data),
    ]);
    const channelNameById = new Map(channels.map((channel) => [channel.id, channel.name]));

    return NextResponse.json(
      {
        entries: rows.map((row) => ({
          id: row.id,
          entryDate: row.entryDate,
          channelId: row.salesChannelId,
          channelName: row.salesChannelId ? (channelNameById.get(row.salesChannelId) ?? null) : null,
          grossRevenueCents: centsFromDb(row.grossRevenueCents) ?? 0,
          ordersCount: row.ordersCount,
          discountsCents: centsFromDb(row.discountsCents) ?? 0,
          cancellationsCents: centsFromDb(row.cancellationsCents) ?? 0,
          knownFeesCents: centsFromDb(row.knownFeesCents) ?? 0,
          entriesVersion: row.entriesVersion,
        })),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ establishmentId: string }> },
): Promise<NextResponse> {
  return handleRoute(async () => {
    const { establishmentId } = await context.params;
    const parsedId = uuidParamSchema.safeParse(establishmentId);
    if (!parsedId.success) throw notFound();

    const user = await getCurrentUser(readAppSessionSecret(request));
    if (!user) throw unauthorized();

    const payload = await readJsonBody(request, dailyEntrySchema);
    const entry = await upsertDailyEntry(parsedId.data, user.id, payload);

    return NextResponse.json({ entry }, { status: 200, headers: { "Cache-Control": "no-store" } });
  });
}
