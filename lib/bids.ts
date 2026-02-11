import { BidStatus } from "@prisma/client";

export const bidStatusOptions: { value: BidStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "pipeline", label: "Pipeline" },
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

const bidStatusLabelMap = new Map(bidStatusOptions.map((option) => [option.value, option.label]));

export function getBidStatusLabel(status: BidStatus) {
  return bidStatusLabelMap.get(status) ?? status.replace("_", " ");
}
