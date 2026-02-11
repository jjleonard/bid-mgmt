"use client";

import { useMemo, useState } from "react";
import {
  bidStageOptions,
  bidStatusOptions,
  computeAnnualValueGbp,
  formatCurrencyGbp,
  getBidStageLabel,
  getBidStatusLabel,
  getOpportunityTypeLabel,
  getTcvTermBasisLabel,
  opportunityTypeOptions,
  tcvTermBasisOptions,
} from "@/lib/bids";

type BidDetails = {
  id: string;
  clientName: string;
  bidName: string;
  status: string;
  opportunityType: string;
  currentStage: string | null;
  nextStageDate: string | null;
  psqReceivedAt: string | null;
  psqClarificationDeadlineAt: string | null;
  psqSubmissionDeadlineAt: string | null;
  psqSubmissionTime: string | null;
  ittReceivedAt: string | null;
  ittClarificationDeadlineAt: string | null;
  ittSubmissionDeadlineAt: string | null;
  ittSubmissionTime: string | null;
  tcvGbp: number | null;
  initialTermMonths: number | null;
  extensionTermMonths: number | null;
  tcvTermBasis: string | null;
  annualValueGbp: number | null;
  portalUrl: string | null;
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
  const statusLabel = getBidStatusLabel(bid.status as (typeof bidStatusOptions)[number]["value"]);
  const [opportunityType, setOpportunityType] = useState(
    bid.opportunityType || "single_tender"
  );
  const [currentStage, setCurrentStage] = useState(bid.currentStage || "psq");
  const [tcvGbp, setTcvGbp] = useState(bid.tcvGbp?.toString() ?? "");
  const [initialTermMonths, setInitialTermMonths] = useState(
    bid.initialTermMonths?.toString() ?? ""
  );
  const [extensionTermMonths, setExtensionTermMonths] = useState(
    bid.extensionTermMonths?.toString() ?? ""
  );
  const [tcvTermBasis, setTcvTermBasis] = useState(
    bid.tcvTermBasis || "initial_only"
  );

  const annualValuePreview = useMemo(() => {
    const tcv = Number(tcvGbp);
    const initial = Number(initialTermMonths);
    const extension = Number(extensionTermMonths || 0);

    if (!Number.isFinite(tcv) || !Number.isFinite(initial) || initial <= 0) {
      return null;
    }

    return computeAnnualValueGbp(
      tcv,
      initial,
      extension,
      tcvTermBasis as "initial_only" | "initial_plus_extension"
    );
  }, [extensionTermMonths, initialTermMonths, tcvGbp, tcvTermBasis]);

  const isTwoStage = opportunityType === "two_stage_psq_itt";

  const formatDateValue = (value: string | null) => {
    if (!value) {
      return "—";
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-GB", { timeZone: "Europe/London" });
  };

  const formatTimeValue = (value: string | null) => value || "—";

  if (!isEditing) {
    const opportunityLabel = getOpportunityTypeLabel(
      bid.opportunityType as (typeof opportunityTypeOptions)[number]["value"]
    );
    const currentStageLabel = bid.currentStage
      ? getBidStageLabel(bid.currentStage as (typeof bidStageOptions)[number]["value"])
      : "—";
    const tcvTermLabel = bid.tcvTermBasis
      ? getTcvTermBasisLabel(bid.tcvTermBasis as (typeof tcvTermBasisOptions)[number]["value"])
      : "—";

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
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Client</p>
            <p className="text-lg font-medium text-ink-900">{bid.clientName}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Bid name</p>
            <p className="text-lg font-medium text-ink-900">{bid.bidName}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Status</p>
            <p className="text-lg font-medium text-ink-900 capitalize">
              {statusLabel}
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
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
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
              Portal link
            </p>
            {bid.portalUrl ? (
              <a
                href={bid.portalUrl}
                className="text-lg font-medium text-ink-900 underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Open portal
              </a>
            ) : (
              <p className="text-lg font-medium text-ink-900">—</p>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-sand-200/70 pt-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                Opportunity type
              </p>
              <p className="text-base font-medium text-ink-900">{opportunityLabel}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Current stage</p>
              <p className="text-base font-medium text-ink-900">{currentStageLabel}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                Next stage date
              </p>
              <p className="text-base font-medium text-ink-900">
                {formatDateValue(bid.nextStageDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-sand-200/70 pt-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Total value</p>
              <p className="text-base font-medium text-ink-900">
                {formatCurrencyGbp(bid.tcvGbp)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Term length</p>
              <p className="text-base font-medium text-ink-900">
                {bid.initialTermMonths ? `${bid.initialTermMonths} months` : "—"}
                {bid.extensionTermMonths
                  ? ` + ${bid.extensionTermMonths} months`
                  : ""}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Annual value</p>
              <p className="text-base font-medium text-ink-900">
                {formatCurrencyGbp(bid.annualValueGbp)}
              </p>
              <p className="text-xs text-ink-500">{tcvTermLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-sand-200/70 pt-8">
          <div className="grid gap-6 md:grid-cols-2">
            {bid.opportunityType === "two_stage_psq_itt" ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-500">PSQ dates</p>
                <div className="space-y-2 text-sm text-ink-700">
                  <p>Received: {formatDateValue(bid.psqReceivedAt)}</p>
                  <p>Clarification deadline: {formatDateValue(bid.psqClarificationDeadlineAt)}</p>
                  <p>Submission deadline: {formatDateValue(bid.psqSubmissionDeadlineAt)}</p>
                  <p>Submission time: {formatTimeValue(bid.psqSubmissionTime)}</p>
                </div>
              </div>
            ) : null}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                {bid.opportunityType === "two_stage_psq_itt" ? "ITT dates" : "Stage dates"}
              </p>
              <div className="space-y-2 text-sm text-ink-700">
                <p>Received: {formatDateValue(bid.ittReceivedAt)}</p>
                <p>Clarification deadline: {formatDateValue(bid.ittClarificationDeadlineAt)}</p>
                <p>Submission deadline: {formatDateValue(bid.ittSubmissionDeadlineAt)}</p>
                <p>Submission time: {formatTimeValue(bid.ittSubmissionTime)}</p>
              </div>
            </div>
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

        <div className="grid gap-2">
          <label className="text-sm font-medium text-ink-700" htmlFor="portalUrl">
            Portal link
          </label>
          <input
            id="portalUrl"
            name="portalUrl"
            type="url"
            defaultValue={bid.portalUrl ?? ""}
            className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
          />
        </div>

        <div className="border-t border-sand-200/70 pt-6">
          <section className="rounded-xl border border-sand-100 bg-sand-50/60 px-4 py-4">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Opportunity</p>
                <p className="mt-2 text-sm text-ink-600">
                  Keep the structure and stage in sync with the live bid.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-ink-700" htmlFor="opportunityType">
                    Opportunity type
                  </label>
                  <select
                    id="opportunityType"
                    name="opportunityType"
                    required
                    value={opportunityType}
                    onChange={(event) => setOpportunityType(event.target.value)}
                    className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                  >
                    {opportunityTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {isTwoStage ? (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-ink-700" htmlFor="currentStage">
                      Current stage
                    </label>
                    <select
                      id="currentStage"
                      name="currentStage"
                      required
                      value={currentStage}
                      onChange={(event) => setCurrentStage(event.target.value)}
                      className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                    >
                      {bidStageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
              {isTwoStage ? (
                <div className="grid gap-2 md:max-w-sm">
                  <label className="text-sm font-medium text-ink-700" htmlFor="nextStageDate">
                    Next stage announcement date
                  </label>
                  <input
                    id="nextStageDate"
                    name="nextStageDate"
                    type="date"
                    defaultValue={bid.nextStageDate ?? ""}
                    className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                  />
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="border-t border-sand-200/70 pt-6">
          <section className="rounded-xl border border-sand-100 bg-sand-50/60 px-4 py-4">
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Contract value</p>
                <p className="mt-2 text-sm text-ink-600">
                  Update the total contract value to refresh the annual value.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-ink-700" htmlFor="tcvGbp">
                    Total contract value (GBP)
                  </label>
                  <input
                    id="tcvGbp"
                    name="tcvGbp"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    required
                    value={tcvGbp}
                    onChange={(event) => setTcvGbp(event.target.value)}
                    className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-ink-700" htmlFor="tcvTermBasis">
                    TCV covers
                  </label>
                  <select
                    id="tcvTermBasis"
                    name="tcvTermBasis"
                    required
                    value={tcvTermBasis}
                    onChange={(event) => setTcvTermBasis(event.target.value)}
                    className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                  >
                    {tcvTermBasisOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-ink-700" htmlFor="initialTermMonths">
                    Initial term (months)
                  </label>
                  <input
                    id="initialTermMonths"
                    name="initialTermMonths"
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={initialTermMonths}
                    onChange={(event) => setInitialTermMonths(event.target.value)}
                    className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-ink-700" htmlFor="extensionTermMonths">
                    Extension term (months)
                  </label>
                  <input
                    id="extensionTermMonths"
                    name="extensionTermMonths"
                    type="number"
                    min={0}
                    step={1}
                    value={extensionTermMonths}
                    onChange={(event) => setExtensionTermMonths(event.target.value)}
                    className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-sand-100 bg-white px-4 py-3 text-sm text-ink-700">
                <span className="text-ink-500">Calculated annual value</span>
                <span className="ml-2 font-semibold text-ink-900">
                  {formatCurrencyGbp(annualValuePreview)}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-sand-200/70 pt-6">
          <section className="grid gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Key dates</p>
            <p className="mt-2 text-sm text-ink-600">
              Review received, clarification, and submission dates for each stage.
            </p>
          </div>

          {isTwoStage ? (
            <div className="grid gap-6 md:grid-cols-2">
              <fieldset className="rounded-xl border border-sand-100 bg-white px-4 py-4">
                <legend className="px-2 text-xs uppercase tracking-[0.2em] text-ink-500">
                  PSQ stage
                </legend>
                <div className="mt-4 grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-ink-700" htmlFor="psqReceivedAt">
                      Bid received
                    </label>
                    <input
                      id="psqReceivedAt"
                      name="psqReceivedAt"
                      type="date"
                      defaultValue={bid.psqReceivedAt ?? ""}
                      className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label
                      className="text-sm font-medium text-ink-700"
                      htmlFor="psqClarificationDeadlineAt"
                    >
                      Clarification deadline
                    </label>
                    <input
                      id="psqClarificationDeadlineAt"
                      name="psqClarificationDeadlineAt"
                      type="date"
                      defaultValue={bid.psqClarificationDeadlineAt ?? ""}
                      className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label
                      className="text-sm font-medium text-ink-700"
                      htmlFor="psqSubmissionDeadlineAt"
                    >
                      Submission deadline
                    </label>
                    <input
                      id="psqSubmissionDeadlineAt"
                      name="psqSubmissionDeadlineAt"
                      type="date"
                      defaultValue={bid.psqSubmissionDeadlineAt ?? ""}
                      className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-ink-700" htmlFor="psqSubmissionTime">
                      Submission time (UK)
                    </label>
                    <input
                      id="psqSubmissionTime"
                      name="psqSubmissionTime"
                      type="time"
                      step={60}
                      defaultValue={bid.psqSubmissionTime ?? ""}
                      className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="rounded-xl border border-sand-100 bg-white px-4 py-4">
                <legend className="px-2 text-xs uppercase tracking-[0.2em] text-ink-500">
                  ITT stage
                </legend>
                <div className="mt-4 grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-ink-700" htmlFor="ittReceivedAt">
                      Bid received
                    </label>
                    <input
                      id="ittReceivedAt"
                      name="ittReceivedAt"
                      type="date"
                      defaultValue={bid.ittReceivedAt ?? ""}
                      className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label
                      className="text-sm font-medium text-ink-700"
                      htmlFor="ittClarificationDeadlineAt"
                    >
                      Clarification deadline
                    </label>
                    <input
                      id="ittClarificationDeadlineAt"
                      name="ittClarificationDeadlineAt"
                      type="date"
                      defaultValue={bid.ittClarificationDeadlineAt ?? ""}
                      className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label
                      className="text-sm font-medium text-ink-700"
                      htmlFor="ittSubmissionDeadlineAt"
                    >
                      Submission deadline
                    </label>
                    <input
                      id="ittSubmissionDeadlineAt"
                      name="ittSubmissionDeadlineAt"
                      type="date"
                      defaultValue={bid.ittSubmissionDeadlineAt ?? ""}
                      className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-ink-700" htmlFor="ittSubmissionTime">
                      Submission time (UK)
                    </label>
                    <input
                      id="ittSubmissionTime"
                      name="ittSubmissionTime"
                      type="time"
                      step={60}
                      defaultValue={bid.ittSubmissionTime ?? ""}
                      className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                    />
                  </div>
                </div>
              </fieldset>
            </div>
          ) : (
            <fieldset className="rounded-xl border border-sand-100 bg-white px-4 py-4">
              <legend className="px-2 text-xs uppercase tracking-[0.2em] text-ink-500">
                Stage dates
              </legend>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-ink-700" htmlFor="ittReceivedAt">
                    Bid received
                  </label>
                  <input
                    id="ittReceivedAt"
                    name="ittReceivedAt"
                    type="date"
                    defaultValue={bid.ittReceivedAt ?? ""}
                    className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium text-ink-700"
                    htmlFor="ittClarificationDeadlineAt"
                  >
                    Clarification deadline
                  </label>
                  <input
                    id="ittClarificationDeadlineAt"
                    name="ittClarificationDeadlineAt"
                    type="date"
                    defaultValue={bid.ittClarificationDeadlineAt ?? ""}
                    className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium text-ink-700"
                    htmlFor="ittSubmissionDeadlineAt"
                  >
                    Submission deadline
                  </label>
                  <input
                    id="ittSubmissionDeadlineAt"
                    name="ittSubmissionDeadlineAt"
                    type="date"
                    defaultValue={bid.ittSubmissionDeadlineAt ?? ""}
                    className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-ink-700" htmlFor="ittSubmissionTime">
                    Submission time (UK)
                  </label>
                  <input
                    id="ittSubmissionTime"
                    name="ittSubmissionTime"
                    type="time"
                    step={60}
                    defaultValue={bid.ittSubmissionTime ?? ""}
                    className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                  />
                </div>
              </div>
            </fieldset>
          )}
          </section>
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
