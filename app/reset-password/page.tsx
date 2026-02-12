import { redirect } from "next/navigation";

import bcrypt from "bcryptjs";

import { clearSessionsForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findValidPasswordResetToken } from "@/lib/password-reset";

type PageProps = {
  searchParams?:
    | {
        token?: string | string[];
        error?: string | string[];
      }
    | Promise<{
        token?: string | string[];
        error?: string | string[];
      }>;
};

async function resetPassword(formData: FormData) {
  "use server";

  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token || password.length < 10 || password !== confirmPassword) {
    redirect(
      "/reset-password?error=" +
        encodeURIComponent(
          "Reset link is invalid, the password is too short, or the passwords do not match."
        )
    );
  }

  const record = await findValidPasswordResetToken(token);

  if (!record) {
    redirect(
      "/reset-password?error=" +
        encodeURIComponent("Reset link is invalid or has expired.")
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    }),
  ]);

  await clearSessionsForUser(record.userId);
  redirect("/login?reset=1");
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const tokenParam = resolvedSearchParams?.token;
  const errorParam = resolvedSearchParams?.error;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  return (
    <div className="min-h-screen bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">Auth</p>
            <h1 className="text-3xl font-semibold tracking-tight">Choose a new password</h1>
            <p className="text-base text-ink-600">
              Enter a new password to complete the reset.
            </p>
          </div>
        </header>

        {token ? (
          <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
            <form action={resetPassword} className="flex flex-col gap-6">
              <input type="hidden" name="token" value={token} />
              <div className="grid gap-2">
                <label className="text-sm font-medium text-ink-700" htmlFor="password">
                  New password
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
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium text-ink-700"
                  htmlFor="confirmPassword"
                >
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  minLength={10}
                  required
                  className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-sand-50 transition hover:bg-ink-700"
                >
                  Update password
                </button>
              </div>
            </form>
          </section>
        ) : (
          <div className="rounded-2xl border border-sand-200 bg-white/80 px-6 py-4 text-sm text-ink-700 shadow-sm">
            This reset link is missing or invalid. Please request a new one.
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-white/80 px-6 py-4 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}
      </main>
    </div>
  );
}
