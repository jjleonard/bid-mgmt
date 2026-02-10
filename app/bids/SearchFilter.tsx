"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SearchFilterProps = {
  initialValue?: string;
};

export default function SearchFilter({ initialValue = "" }: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextValue = value.trim();
    const params = new URLSearchParams(searchParams.toString());

    params.delete("status");
    params.delete("sort");
    params.delete("dir");

    if (nextValue) {
      params.set("q", nextValue);
    } else {
      params.delete("q");
    }

    const queryString = params.toString();
    router.push(queryString ? `/bids?${queryString}` : "/bids");
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-2">
      <label className="text-sm font-medium text-ink-700" htmlFor="search">
        Search client
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id="search"
          name="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search by client name"
          className="h-10 w-64 max-w-full rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
        />
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full border border-ink-900 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-900 transition hover:bg-ink-900 hover:text-sand-50"
        >
          Search
        </button>
      </div>
    </form>
  );
}
