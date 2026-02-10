import { BidStatus } from "@prisma/client";

export const bidStatusOptions: { value: BidStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "bid", label: "Bid" },
  { value: "no_bid", label: "No bid" },
  { value: "submitted", label: "Submitted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "dropped", label: "Dropped" },
  { value: "abandoned", label: "Abandoned" },
];

export const bidStatusValues = bidStatusOptions.map((option) => option.value);
