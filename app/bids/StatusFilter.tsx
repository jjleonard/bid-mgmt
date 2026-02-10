"use client";

import { useRouter, useSearchParams } from "next/navigation";

type StatusOption = { value: string; label: string };

type StatusFilterProps = {
  options: StatusOption[];
  selected: string;
};

export default function StatusFilter({ options, selected }: StatusFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }

    const queryString = params.toString();
    router.push(queryString ? `/bids?${queryString}` : "/bids");
  };

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-ink-700" htmlFor="status">
        Filter by status
      </label>
      <select
        id="status"
        name="status"
        value={selected}
        onChange={(event) => handleChange(event.target.value)}
        className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
      >
        <option value="all">All statuses</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
