import { DashboardApp } from "@/components/dashboard/DashboardApp";

/**
 * The converted prototype ("Konvert — Burger da Vila"): sidebar + 10
 * views, navigated by client-side state, exactly as the original HTML's
 * `goTo()` swapped `.view`/`.view.active` — see DashboardApp for why every
 * view stays mounted instead of unmounting on switch.
 *
 * This is a visual/structural port only. Every value shown is the
 * prototype's own static demo data (`components/dashboard/data.ts`), not
 * yet wired to the real backend built in Fases 0-5.
 */
export default function AppPage() {
  return <DashboardApp />;
}
