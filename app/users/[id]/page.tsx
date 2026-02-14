import { notFound } from "next/navigation";

import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params?:
    | {
        id?: string;
      }
    | Promise<{
        id?: string;
      }>;
  searchParams?:
    | {
        edit?: string | string[];
      }
    | Promise<{
        edit?: string | string[];
      }>;
};

const roleOptions = ["engineer", "supervisor", "bids", "admin"] as const;

async function updateUser(formData: FormData) {
  "use server";

  await requireAdminUser();

  const id = String(formData.get("id") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const disable = formData.get("disabled") === "on";

  if (!id || !roleOptions.includes(role as (typeof roleOptions)[number])) {
    redirect(`/users/${id}`);
  }

  await prisma.user.update({
    where: { id },
    data: {
      role: role as (typeof roleOptions)[number],
      disabledAt: disable ? new Date() : null,
    },
  });

  redirect(`/users/${id}`);
}

export default async function UserDetailsPage({ params, searchParams }: PageProps) {
  await requireAdminUser();
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const userId = resolvedParams?.id;
  const editParam = resolvedSearchParams?.edit;
  const edit = Array.isArray(editParam) ? editParam[0] === "1" : editParam === "1";

  if (!userId) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      surname: true,
      email: true,
      role: true,
      disabledAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-full bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-ink-500">User</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {user.firstName} {user.surname}
          </h1>
          <p className="text-base text-ink-600">{user.email}</p>
        </header>

        <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
          <div className="space-y-4 text-sm text-ink-700">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Role</span>
              <span className="text-xs uppercase tracking-[0.2em] text-ink-500">
                {user.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Status</span>
              <span className="text-xs uppercase tracking-[0.2em] text-ink-500">
                {user.disabledAt ? "Disabled" : "Active"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-ink-500">User ID</span>
              <span className="text-ink-600">{user.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Created</span>
              <span className="text-ink-600">{user.createdAt.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Updated</span>
              <span className="text-ink-600">{user.updatedAt.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-6">
            <a
              href={`/users/${user.id}?edit=1`}
              className="text-sm font-medium text-ink-500 hover:text-ink-700"
            >
              Edit user
            </a>
          </div>
        </section>

        {edit ? (
          <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Edit user</p>
              <h2 className="text-lg font-semibold text-ink-900">Role and access</h2>
              <p className="text-sm text-ink-600">
                Update the user role or disable access.
              </p>
            </div>
            <form action={updateUser} className="mt-6 flex flex-col gap-5">
              <input type="hidden" name="id" value={user.id} />
              <div className="grid gap-2">
                <label className="text-sm font-medium text-ink-700" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue={user.role}
                  className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none focus:border-ink-400"
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-3 text-sm text-ink-700">
                <input
                  type="checkbox"
                  name="disabled"
                  defaultChecked={Boolean(user.disabledAt)}
                  className="h-4 w-4 rounded border border-sand-200"
                />
                Disable account (prevents login)
              </label>
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-sand-50 hover:bg-ink-700"
                >
                  Save changes
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <div>
          <a href="/admin" className="text-sm font-medium text-ink-500 hover:text-ink-700">
            Back to admin
          </a>
        </div>
      </main>
    </div>
  );
}
