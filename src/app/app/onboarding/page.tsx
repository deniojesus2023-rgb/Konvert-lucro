import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { APP_SESSION_COOKIE_NAME } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { getDb } from "@/server/db/client";
import { findEstablishmentsForUser } from "@/server/repositories/establishment-repository";
import { OnboardingForm } from "./OnboardingForm";

/** Direct-signup onboarding: a logged-in user with no establishment yet names one. */
export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const sessionSecret = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUser(sessionSecret);
  if (!user) redirect("/entrar");

  const [establishment] = await findEstablishmentsForUser(getDb(), user.id);
  if (establishment) redirect("/app");

  return <OnboardingForm />;
}
