import { redirect } from "next/navigation";

import ThemeToggle from "@/app/ThemeToggle";
import { clearSession, getCurrentUser } from "@/lib/auth";
import { getBranding } from "@/lib/branding";

export default async function NavBar() {
  const [user, branding] = await Promise.all([getCurrentUser(), getBranding()]);

  async function handleLogout() {
    "use server";
    await clearSession();
    redirect("/login");
  }

  return (
    <header className="border-b border-sand-200/80 bg-sand-50/90">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <a href="/" className="flex items-center gap-3">
            {branding?.logoPath ? (
              <img
                src={branding.logoPath}
                alt={branding.companyName ? `${branding.companyName} logo` : "Company logo"}
                className="h-8 w-auto"
              />
            ) : null}
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-700">
              {branding?.companyName ?? "App"}
            </span>
          </a>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-ink-600">
            <a href="/bids" className="transition hover:text-ink-900">
              Bids
            </a>
            <a href="/admin" className="transition hover:text-ink-900">
              Admin
            </a>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-600">
          {user ? (
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink-500">
              <span>
                {user.firstName} {user.surname}
              </span>
              <span>·</span>
              <span>{user.role}</span>
            </div>
          ) : (
            <span className="text-xs uppercase tracking-[0.2em] text-ink-500">
              Not signed in
            </span>
          )}
          <ThemeToggle />
          {user ? (
            <form action={handleLogout}>
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-full border border-ink-200 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-700 transition hover:border-ink-300"
              >
                Logout
              </button>
            </form>
          ) : (
            <a
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-full border border-ink-200 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-700 transition hover:border-ink-300"
            >
              Login
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
