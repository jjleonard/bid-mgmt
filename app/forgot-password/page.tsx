import { redirect } from "next/navigation";

import {
  registerPasswordResetAttempt,
  sendPasswordResetForEmail,
} from "@/lib/password-reset";
import { getRequestIp } from "@/lib/request-ip";

type PageProps = {
  searchParams?:
    | {
        sent?: string | string[];
      }
    | Promise<{
        sent?: string | string[];
      }>;
};

async function requestReset(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (email) {
    const ipAddress = await getRequestIp();
    const allowed = await registerPasswordResetAttempt(email, ipAddress);

    try {
      if (allowed) {
        await sendPasswordResetForEmail(email);
      }
    } catch (error) {
      console.error("Password reset email failed.", error);
    }
  }

  redirect("/forgot-password?sent=1");
}

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const sentParam = resolvedSearchParams?.sent;
  const sent = Array.isArray(sentParam) ? sentParam[0] : sentParam;

  return (
    <div className="min-h-screen bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">Auth</p>
            <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
            <p className="text-base text-ink-600">
              Enter the email address tied to your account.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
          <form action={requestReset} className="flex flex-col gap-6">
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

            <div className="flex items-center justify-between text-sm">
              <a href="/login" className="text-ink-500 transition hover:text-ink-700">
                Back to login
              </a>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-sand-50 transition hover:bg-ink-700"
              >
                Send reset link
              </button>
            </div>
          </form>
        </section>

        {sent ? (
          <div className="rounded-2xl border border-sand-200 bg-white/80 px-6 py-4 text-sm text-ink-700 shadow-sm">
            If this email address exists in the database, we have sent an email.
          </div>
        ) : null}
      </main>
    </div>
  );
}
