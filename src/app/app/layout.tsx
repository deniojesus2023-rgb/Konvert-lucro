import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { APP_SESSION_COOKIE_NAME } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { AppHeader } from "./AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionSecret = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUser(sessionSecret);

  if (!user) {
    redirect("/entrar");
  }

  return (
    <>
      <AppHeader />
      <section className="diagnostic-screen">
        <div className="diagnostic-wrap">{children}</div>
      </section>
    </>
  );
}
