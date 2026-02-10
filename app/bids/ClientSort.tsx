"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ClientSortProps = {
  active: boolean;
  direction: "asc" | "desc";
};

export default function ClientSort({ active, direction }: ClientSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextDirection = !active
    ? "asc"
    : direction === "asc"
      ? "desc"
      : "asc";

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", "client");
    params.set("dir", nextDirection);
    const queryString = params.toString();
    router.push(queryString ? `/bids?${queryString}` : "/bids");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-500 transition hover:text-ink-700"
      aria-label={`Sort by client name ${nextDirection}`}
    >
      Client
      <span className="inline-flex h-4 w-4 items-center justify-center">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="h-3.5 w-3.5"
        >
          <path
            d="M8 3l3 3H5l3-3z"
            fill={active && direction === "asc" ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path
            d="M8 13l-3-3h6l-3 3z"
            fill={active && direction === "desc" ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
