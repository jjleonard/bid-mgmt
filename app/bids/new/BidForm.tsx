"use client";

import { useMemo, useState } from "react";
import {
  bidStageOptions,
  bidStatusOptions,
  computeAnnualValueGbp,
  formatCurrencyGbp,
  opportunityTypeOptions,
  tcvTermBasisOptions,
} from "@/lib/bids";

type BidFormProps = {
  action: (formData: FormData) => Promise<void>;
};

export default function BidForm({ action }: BidFormProps) {
  const [opportunityType, setOpportunityType] = useState("single_tender");
  const [currentStage, setCurrentStage] = useState("psq");
  const [tcvGbp, setTcvGbp] = useState("");
  const [initialTermMonths, setInitialTermMonths] = useState("");
  const [extensionTermMonths, setExtensionTermMonths] = useState("");
  const [tcvTermBasis, setTcvTermBasis] = useState("initial_only");

  const annualValue = useMemo(() => {
    const tcv = Number(tcvGbp);
    const initial = Number(initialTermMonths);
    const extension = Number(extensionTermMonths || 0);

    if (!Number.isFinite(tcv) || !Number.isFinite(initial) || initial <= 0) {
      return null;
    }

    return computeAnnualValueGbp(tcv, initial, extension, tcvTermBasis as "initial_only" | "initial_plus_extension");
  }, [extensionTermMonths, initialTermMonths, tcvGbp, tcvTermBasis]);

  const isTwoStage = opportunityType === "two_stage_psq_itt";

  return (
    <form
      action={action}
      className="flex flex-col gap-8 rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm"
    >
      <section className="grid gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-ink-700" htmlFor="clientName">
            Client name
          </label>
          <input
            id="clientName"
            name="clientName"
            required
            placeholder="Acme Industries"
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
            placeholder="2026 Facilities RFP"
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
            defaultValue="pending"
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
            placeholder="https://company.sharepoint.com/sites/bids/..."
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
            placeholder="https://portal.example.com"
            className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
          />
        </div>
      </section>

      <div className="border-t border-sand-200/70 pt-6">
        <section className="rounded-xl border border-sand-100 bg-sand-50/60 px-4 py-4">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Opportunity</p>
              <p className="mt-2 text-sm text-ink-600">
                Capture the bid structure and which stage the team is working on right now.
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
                  className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                />
                <p className="text-xs text-ink-500">
                  Use this when the client will confirm whether the PSQ progresses to ITT.
                </p>
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
                Store the total contract value and term length to calculate the annual value.
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
                  placeholder="1250000"
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
                  placeholder="36"
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
                  placeholder="12"
                  className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                />
              </div>
            </div>

            <div className="rounded-xl border border-sand-100 bg-white px-4 py-3 text-sm text-ink-700">
              <span className="text-ink-500">Calculated annual value</span>
              <span className="ml-2 font-semibold text-ink-900">
                {formatCurrencyGbp(annualValue)}
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
              Track received, clarification, and submission deadlines for each stage.
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
                    className="h-10 rounded-lg border border-sand-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
                  />
                </div>
              </div>
            </fieldset>
          )}
        </section>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <a
          href="/bids"
          className="text-sm font-medium text-ink-500 transition hover:text-ink-700"
        >
          Back to bids
        </a>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-sand-50 transition hover:bg-ink-700"
        >
          Save bid
        </button>
      </div>
    </form>
  );
}
