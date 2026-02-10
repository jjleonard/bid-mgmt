"use client";

import { useState } from "react";
import { bidStatusOptions } from "@/lib/bids";

type BidDetails = {
  id: string;
  clientName: string;
  bidName: string;
  status: string;
  folderUrl: string;
};

type BidDetailsEditorProps = {
  bid: BidDetails;
  onSave: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

export default function BidDetailsEditor({
  bid,
  onSave,
  onDelete,
}: BidDetailsEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isEditing) {
    return (
      <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Details</p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500 transition hover:text-ink-700"
          >
            Edit details
          </button>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Client</p>
            <p className="text-lg font-medium text-ink-900">{bid.clientName}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Status</p>
            <p className="text-lg font-medium text-ink-900 capitalize">
              {bid.status.replace("_", " ")}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
              Bid name
            </p>
            <p className="text-lg font-medium text-ink-900">{bid.bidName}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
              SharePoint folder
            </p>
            <a
              href={bid.folderUrl}
              className="text-lg font-medium text-ink-900 underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Open folder
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
      <form action={onSave} className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Edit</p>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500 transition hover:text-ink-700"
          >
            Cancel
          </button>
        </div>

        <input type="hidden" name="id" value={bid.id} />

        <div className="grid gap-2">
          <label className="text-sm font-medium text-ink-700" htmlFor="clientName">
            Client name
          </label>
          <input
            id="clientName"
            name="clientName"
            required
            defaultValue={bid.clientName}
            className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-ink-700" htmlFor="bidName">
            Bid name
          </label>
          <input
            id="bidName"
            name="bidName"
            required
            defaultValue={bid.bidName}
            className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-ink-700" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={bid.status}
            className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
          >
            {bidStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-ink-700" htmlFor="folderUrl">
            SharePoint folder URL
          </label>
          <input
            id="folderUrl"
            name="folderUrl"
            type="url"
            required
            defaultValue={bid.folderUrl}
            className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
          />
        </div>

        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-sand-50 transition hover:bg-ink-700"
          >
            Save changes
          </button>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-sand-200 pt-6">
        {isConfirmingDelete ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-600">
            <span className="uppercase tracking-[0.2em] text-ink-500">
              Confirm delete?
            </span>
            <form action={onDelete}>
              <input type="hidden" name="id" value={bid.id} />
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-full border border-red-200 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 transition hover:border-red-400"
              >
                Delete
              </button>
            </form>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500 transition hover:text-ink-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500 transition hover:text-ink-700"
          >
            Delete bid
          </button>
        )}
      </div>
    </section>
  );
}
