import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { APP_SESSION_COOKIE_NAME } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { getDb } from "@/server/db/client";
import { findEstablishmentsForUser } from "@/server/repositories/establishment-repository";
import { DashboardApp } from "@/components/dashboard/DashboardApp";

/**
 * The converted prototype ("Konvert — Burger da Vila"): sidebar + 10
 * views, navigated by client-side state, exactly as the original HTML's
 * `goTo()` swapped `.view`/`.view.active` — see DashboardApp for why every
 * view stays mounted instead of unmounting on switch.
 *
 * Resolves the current user's establishment server-side (same pattern as
 * the old `/app/vendas` page) and hands its id down to the client shell,
 * which now fetches real data from the Fases 0-5 API instead of the
 * prototype's static demo arrays.
 */
export default async function AppPage() {
  const cookieStore = await cookies();
  const sessionSecret = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUser(sessionSecret);
  if (!user) redirect("/entrar");

  const [establishment] = await findEstablishmentsForUser(getDb(), user.id);
  if (!establishment) redirect("/app/onboarding");

  return (
    <DashboardApp
      establishmentId={establishment.id}
      establishmentName={establishment.name}
      timezone={establishment.timezone}
    />
  );
}
