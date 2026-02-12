import { redirect } from "next/navigation";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import {
  registerPasswordResetAttempt,
  sendPasswordResetForEmail,
} from "@/lib/password-reset";
import { getRequestIp } from "@/lib/request-ip";

const roleOptions = ["engineer", "supervisor", "bids", "admin"] as const;

type PageProps = {
  searchParams?:
    | {
        created?: string | string[];
        error?: string | string[];
        resetSent?: string | string[];
      }
    | Promise<{
        created?: string | string[];
        error?: string | string[];
        resetSent?: string | string[];
      }>;
};

async function createUser(formData: FormData) {
  "use server";

  const firstName = String(formData.get("firstName") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const password = String(formData.get("password") ?? "");
  const bootstrapToken = String(formData.get("bootstrapToken") ?? "").trim();
  const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN?.trim();

  if (expectedToken && bootstrapToken !== expectedToken) {
    redirect(
      "/admin?error=" +
        encodeURIComponent("Bootstrap token did not match. User was not created.")
    );
  }

  if (!firstName || !surname || !email || !password) {
    redirect(
      "/admin?error=" +
        encodeURIComponent("All fields are required to create a user.")
    );
  }

  if (!email.includes("@")) {
    redirect(
      "/admin?error=" +
        encodeURIComponent("Email address must include an @ symbol.")
    );
  }

  if (!roleOptions.includes(role as (typeof roleOptions)[number])) {
    redirect(
      "/admin?error=" +
        encodeURIComponent("Role must be one of engineer, supervisor, bids, admin.")
    );
  }

  if (password.length < 10) {
    redirect(
      "/admin?error=" +
        encodeURIComponent("Password must be at least 10 characters long.")
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    redirect(
      "/admin?error=" +
        encodeURIComponent("A user with that email already exists.")
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      firstName,
      surname,
      email,
      role: role as (typeof roleOptions)[number],
      passwordHash,
    },
  });

  redirect("/admin?created=" + encodeURIComponent(email));
}

async function requestPasswordReset(formData: FormData) {
  "use server";

  const email = String(formData.get("resetEmail") ?? "").trim().toLowerCase();

  if (email) {
    const ipAddress = await getRequestIp();
    const allowed = await registerPasswordResetAttempt(email, ipAddress);

    try {
      if (allowed) {
        await sendPasswordResetForEmail(email);
      }
    } catch (error) {
      console.error("Admin password reset email failed.", error);
    }
  }

  redirect("/admin?resetSent=1");
}

export default async function AdminPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const createdParam = resolvedSearchParams?.created;
  const errorParam = resolvedSearchParams?.error;
  const resetSentParam = resolvedSearchParams?.resetSent;
  const created = Array.isArray(createdParam) ? createdParam[0] : createdParam;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const resetSent = Array.isArray(resetSentParam) ? resetSentParam[0] : resetSentParam;
  const bootstrapRequired = Boolean(process.env.ADMIN_BOOTSTRAP_TOKEN?.trim());

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      firstName: true,
      surname: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">Admin</p>
            <h1 className="text-3xl font-semibold tracking-tight">User access</h1>
            <p className="text-base text-ink-600">
              Create users who can sign in once authentication is enabled.
            </p>
          </div>
        </header>

        {bootstrapRequired ? (
          <section className="rounded-2xl border border-sand-200 bg-white/80 px-6 py-4 text-sm text-ink-700 shadow-sm">
            Bootstrap mode is enabled. A one-time token is required to create users.
          </section>
        ) : null}

        <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
          <form action={createUser} className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-ink-700" htmlFor="firstName">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  required
                  className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-ink-700" htmlFor="surname">
                  Surname
                </label>
                <input
                  id="surname"
                  name="surname"
                  required
                  className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                <label className="text-sm font-medium text-ink-700" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  defaultValue="engineer"
                  className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-ink-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={10}
                required
                className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
              />
              <p className="text-xs text-ink-500">Minimum 10 characters.</p>
            </div>

            {bootstrapRequired ? (
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium text-ink-700"
                  htmlFor="bootstrapToken"
                >
                  Bootstrap token
                </label>
                <input
                  id="bootstrapToken"
                  name="bootstrapToken"
                  type="password"
                  required
                  className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                />
              </div>
            ) : null}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-sand-50 transition hover:bg-ink-700"
              >
                Create user
              </button>
            </div>
          </form>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-white/80 px-6 py-4 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}

        {created ? (
          <div className="rounded-2xl border border-sand-200 bg-white/80 px-6 py-4 text-sm text-ink-700 shadow-sm">
            Created user: {created}
          </div>
        ) : null}

        {resetSent ? (
          <div className="rounded-2xl border border-sand-200 bg-white/80 px-6 py-4 text-sm text-ink-700 shadow-sm">
            If this email address exists in the database, we have sent an email.
          </div>
        ) : null}

        <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Recent users</p>
          </div>
          {recentUsers.length === 0 ? (
            <p className="mt-6 text-sm text-ink-600">No users created yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-100 bg-sand-50/60 px-4 py-3 text-sm text-ink-700"
                >
                  <div>
                    <span className="font-medium text-ink-900">
                      {user.firstName} {user.surname}
                    </span>
                    <span className="text-ink-500"> · {user.email}</span>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-ink-500">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Password reset</p>
            <h2 className="text-lg font-semibold text-ink-900">Send reset email</h2>
            <p className="text-sm text-ink-600">
              Send a password reset email on behalf of a user.
            </p>
          </div>
          <form action={requestPasswordReset} className="mt-6 flex flex-col gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-ink-700" htmlFor="resetEmail">
                User email address
              </label>
              <input
                id="resetEmail"
                name="resetEmail"
                type="email"
                required
                className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
              />
            </div>
            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full border border-ink-200 bg-white px-6 text-sm font-semibold text-ink-700 transition hover:border-ink-300"
              >
                Send reset email
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
