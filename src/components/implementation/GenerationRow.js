"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, ImageOff, LoaderCircle, RotateCcw, X } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { STYLES, findModel, ratioToNumber } from "@/lib/generation-options";
import { useStudio } from "./StudioProvider";
import { ImageTile } from "./ImageTile";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Layout shared by every feed row: prompt card beside (xl) or above (smaller) its results. */
function RowLayout({ card, children, id, highlightKey, labelledBy }) {
  return (
    <article
      id={id}
      aria-labelledby={labelledBy}
      className="relative grid scroll-mt-4 gap-3 xl:grid-cols-[248px_minmax(0,1fr)] xl:items-start lg:scroll-mt-[208px]"
    >
      {/* Keyed so each history jump replays the flash. */}
      {highlightKey != null && (
        <span key={highlightKey} aria-hidden="true" className="animate-flash pointer-events-none absolute -inset-1.5 z-10 rounded-[14px]" />
      )}
      {card}
      <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-4 sm:gap-[14px]">{children}</div>
    </article>
  );
}

function PromptText({ id, children }) {
  return (
    <p id={id} className="text-[10px] leading-[1.55] break-words text-st-ink-2">
      {children}
    </p>
  );
}

function DetailsPopover({ generation }) {
  const { reuse } = useStudio();
  const [copied, setCopied] = useState(false);
  const model = findModel(generation.type, generation.model);
  const style = STYLES.find((s) => s.id === generation.style);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(generation.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const rows = [
    ["Model", model?.label ?? generation.model],
    ["Type", generation.type === "video" ? "Video" : "Image"],
    ["Aspect ratio", generation.aspectRatio],
    ["Style", style?.label ?? "None"],
    ["Seed", generation.seed],
    ["Created", dateFormat.format(new Date(generation.createdAt))],
  ];

  return (
    <Popover
      side="top"
      triggerLabel="Model and generation details"
      triggerClassName="rounded-[8px] bg-st-surface px-3 py-[6px] text-[11px] text-st-ink transition-colors duration-150 hover:bg-st-raised hover:shadow-sm"
      trigger="Model"
      panelClassName="w-64 rounded-2xl bg-st-raised p-4 text-[12px] text-st-ink shadow-st-pop"
    >
      {(close) => (
        <>
          <dl className="space-y-1.5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-st-muted">{k}</dt>
                <dd className="text-right font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copy}
              className="flex items-center justify-center gap-1.5 rounded-full border border-st-panel-border py-1.5 text-[11px] font-medium transition-colors hover:bg-st-pill"
            >
              {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              {copied ? "Copied" : "Copy prompt"}
            </button>
            <button
              type="button"
              onClick={() => {
                reuse(generation);
                close(false);
                document.querySelector("[data-studio-prompt]")?.focus();
              }}
              className="flex items-center justify-center gap-1.5 rounded-full bg-st-accent py-1.5 text-[11px] font-medium text-st-cta-ink transition-colors hover:bg-st-accent-strong"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Reuse
            </button>
          </div>
        </>
      )}
    </Popover>
  );
}

const cardClass = "flex flex-col rounded-[16px] bg-st-card px-[12px] pt-[12px] pb-[10px]";

export function GenerationRow({ generation, highlightKey }) {
  const { reuse } = useStudio();
  const aspect = ratioToNumber(generation.aspectRatio);
  const promptId = `${generation.generationId}-prompt`;

  return (
    <RowLayout
      id={`gen-${generation.generationId}`}
      labelledBy={promptId}
      highlightKey={highlightKey}
      card={
        <div className={cardClass}>
          <PromptText id={promptId}>{generation.prompt}</PromptText>
          <div className="mt-2 flex justify-end">
            <DetailsPopover generation={generation} />
          </div>
        </div>
      }
    >
      {generation.images.length === 0 ? (
        <div className="col-span-full flex flex-col items-start gap-3 rounded-[10px] border border-dashed border-st-panel-border p-5 text-[12px] text-st-ink-2 sm:flex-row sm:items-center">
          <ImageOff size={18} className="shrink-0 text-st-muted" aria-hidden="true" />
          <p className="flex-1">No results for this prompt. Try rephrasing, or run it again with a different seed.</p>
          <button
            type="button"
            onClick={() => {
              reuse({ ...generation, seed: null });
              document.querySelector("[data-studio-prompt]")?.focus();
            }}
            className="rounded-full bg-st-surface px-3 py-1.5 text-[11px] font-medium text-st-ink shadow-sm hover:bg-st-raised"
          >
            Edit &amp; retry
          </button>
        </div>
      ) : (
        generation.images.map((image, i) => <ImageTile key={image.id} image={image} aspect={aspect} index={i} />)
      )}
    </RowLayout>
  );
}

export function PendingRow({ request }) {
  const { cancel } = useStudio();
  const aspect = ratioToNumber(request.aspectRatio);
  return (
    <RowLayout
      id="gen-pending"
      labelledBy="gen-pending-prompt"
      card={
        <div className={cardClass}>
          <PromptText id="gen-pending-prompt">{request.prompt}</PromptText>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-st-accent-strong">
              <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
              Generating…
            </span>
            <button
              type="button"
              onClick={cancel}
              className="flex items-center gap-1 rounded-[8px] bg-st-surface px-3 py-[6px] text-[11px] text-st-ink hover:bg-st-raised"
            >
              <X size={12} aria-hidden="true" />
              Cancel
            </button>
          </div>
        </div>
      }
    >
      {Array.from({ length: request.count }, (_, i) => (
        <div key={i} className="skeleton rounded-[8px]" style={{ aspectRatio: aspect, animationDelay: `${i * 120}ms` }} aria-hidden="true" />
      ))}
    </RowLayout>
  );
}

export function ErrorRow({ error }) {
  const { retry, dismissError } = useStudio();
  return (
    <RowLayout
      id="gen-error"
      labelledBy="gen-error-prompt"
      card={
        <div className={cardClass}>
          <PromptText id="gen-error-prompt">{error.request.prompt}</PromptText>
        </div>
      }
    >
      <div role="alert" className="col-span-full flex flex-col gap-3 rounded-[10px] bg-st-danger-soft p-5 text-[12px] text-st-ink sm:flex-row sm:items-center">
        <AlertCircle size={18} className="shrink-0 text-st-danger" aria-hidden="true" />
        <p className="flex-1">
          <strong className="font-semibold">Generation failed.</strong> {error.message}
        </p>
        <div className="flex gap-2">
          {error.retryable && (
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-1.5 rounded-full bg-st-accent px-3.5 py-1.5 text-[11px] font-medium text-st-cta-ink hover:bg-st-accent-strong"
            >
              <RotateCcw size={12} aria-hidden="true" />
              Retry
            </button>
          )}
          <button type="button" onClick={dismissError} className="rounded-full bg-st-surface px-3.5 py-1.5 text-[11px] font-medium hover:bg-st-raised">
            Dismiss
          </button>
        </div>
      </div>
    </RowLayout>
  );
}
