import { BidStage, BidStatus, OpportunityType, TcvTermBasis } from "@prisma/client";

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

export const opportunityTypeOptions: { value: OpportunityType; label: string }[] = [
  { value: "single_tender", label: "Single Tender" },
  { value: "combined_psq_itt", label: "Combined PSQ/ITT" },
  { value: "two_stage_psq_itt", label: "Two Stage PSQ/ITT" },
];

export const opportunityTypeValues = opportunityTypeOptions.map((option) => option.value);

const opportunityTypeLabelMap = new Map(
  opportunityTypeOptions.map((option) => [option.value, option.label])
);

export function getOpportunityTypeLabel(type: OpportunityType) {
  return opportunityTypeLabelMap.get(type) ?? type.replace(/_/g, " ");
}

export const bidStageOptions: { value: BidStage; label: string }[] = [
  { value: "psq", label: "PSQ" },
  { value: "itt", label: "ITT" },
];

export const bidStageValues = bidStageOptions.map((option) => option.value);

const bidStageLabelMap = new Map(bidStageOptions.map((option) => [option.value, option.label]));

export function getBidStageLabel(stage: BidStage) {
  return bidStageLabelMap.get(stage) ?? stage.toUpperCase();
}

export const tcvTermBasisOptions: { value: TcvTermBasis; label: string }[] = [
  { value: "initial_only", label: "Initial term only" },
  { value: "initial_plus_extension", label: "Initial + extension" },
];

export const tcvTermBasisValues = tcvTermBasisOptions.map((option) => option.value);

const tcvTermBasisLabelMap = new Map(
  tcvTermBasisOptions.map((option) => [option.value, option.label])
);

export function getTcvTermBasisLabel(basis: TcvTermBasis) {
  return tcvTermBasisLabelMap.get(basis) ?? basis.replace(/_/g, " ");
}

export function computeAnnualValueGbp(
  tcvGbp: number,
  initialTermMonths: number,
  extensionTermMonths: number,
  tcvTermBasis: TcvTermBasis
) {
  const extension = Number.isFinite(extensionTermMonths) ? extensionTermMonths : 0;
  const totalMonths =
    tcvTermBasis === "initial_plus_extension"
      ? initialTermMonths + extension
      : initialTermMonths;

  if (!Number.isFinite(totalMonths) || totalMonths <= 0) {
    return null;
  }

  return Math.round((tcvGbp * 12) / totalMonths);
}

export function formatCurrencyGbp(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}
