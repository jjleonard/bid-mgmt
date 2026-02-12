import { redirect } from "next/navigation";

import bcrypt from "bcryptjs";

import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?:
    | {
        error?: string | string[];
      }
    | Promise<{
        error?: string | string[];
      }>;
};

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=" + encodeURIComponent("Email and password required."));
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    redirect("/login?error=" + encodeURIComponent("Invalid email or password."));
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    redirect("/login?error=" + encodeURIComponent("Invalid email or password."));
  }

  await createSession(user.id);
  redirect("/bids");
}

export default async function LoginPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const errorParam = resolvedSearchParams?.error;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  return (
    <div className="min-h-screen bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">Auth</p>
            <h1 className="text-3xl font-semibold tracking-tight">Login</h1>
            <p className="text-base text-ink-600">
              Sign in with your email address and password.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
          <form action={login} className="flex flex-col gap-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-ink-700" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-ink-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-sand-50 transition hover:bg-ink-700"
              >
                Login
              </button>
            </div>
          </form>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-white/80 px-6 py-4 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}
      </main>
    </div>
  );
}
