"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import clsx from "clsx";
import { Aperture, ArrowUp, ChevronDown, Dices, GitBranch, LoaderCircle, Lock, LockOpen, Sparkle, X, Zap } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { NEGATIVE_PROMPT_MAX_LENGTH, PROMPT_MAX_LENGTH } from "@/lib/generation-options";
import { WS_COUNTS, WS_MODELS, WS_RATIOS, describeLook } from "@/lib/workspace/options";
import { useWorkspace } from "./WorkspaceProvider";

const labelClass = "mb-1.5 block text-[11px] font-medium text-ws-text-2";

// A small, distinct mark per model so the picker reads at a glance.
const MODEL_MARKS = {
  "studio-v3": { icon: Sparkle, tone: "bg-ws-accent-soft text-ws-accent" },
  photoreal: { icon: Aperture, tone: "bg-[rgb(120_170_255/0.14)] text-[#9cc0ff]" },
  draft: { icon: Zap, tone: "bg-[rgb(150_220_160/0.13)] text-[#a6dcae]" },
};

function ModelMark({ id }) {
  const mark = MODEL_MARKS[id] ?? MODEL_MARKS["studio-v3"];
  const Icon = mark.icon;
  return (
    <span aria-hidden="true" className={clsx("grid h-8 w-8 shrink-0 place-items-center rounded-md", mark.tone)}>
      <Icon size={15} />
    </span>
  );
}

function Segmented({ label, options, value, onChange, name }) {
  return (
    <fieldset>
      <legend className={labelClass}>{label}</legend>
      <div className="flex rounded-lg border border-ws-line bg-ws-bg p-0.5">
        {options.map((o) => (
          <label key={o} className="flex-1">
            <input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} className="peer sr-only" />
            <span className="block cursor-pointer rounded-md py-1 text-center font-mono text-[11px] text-ws-muted transition-colors duration-150 peer-checked:bg-ws-overlay peer-checked:text-ws-text peer-focus-visible:outline-2 peer-focus-visible:outline-(--focus-ring) hover:text-ws-text">
              {o}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function BranchContext() {
  const { branchFromId, setBranchFromId, index, label } = useWorkspace();
  if (!branchFromId) return null;
  const entry = index.imageIndex.get(branchFromId);
  if (!entry) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-ws-accent/40 bg-ws-accent-soft p-2">
      <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded">
        <Image src={entry.image.url} alt="" fill sizes="32px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 text-[11px] leading-tight">
        <p className="flex items-center gap-1 font-medium text-ws-accent">
          <GitBranch size={12} aria-hidden="true" /> Branching from <span className="font-mono">{label(entry.generation.generationId, entry.index)}</span>
        </p>
        <p className="truncate text-ws-text-2">{describeLook(entry.image.look)} · edits become a remix</p>
      </div>
      <button
        type="button"
        onClick={() => setBranchFromId(null)}
        aria-label="Stop branching — start a new direction instead"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ws-text-2 hover:bg-ws-overlay hover:text-ws-text"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

function Advanced() {
  const { composer, updateComposer } = useWorkspace();
  const [open, setOpen] = useState(false);
  const id = useId();
  const locked = composer.seed !== null;
  return (
    <div className="border-t border-ws-line pt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md py-1 text-[12px] font-medium text-ws-text-2 hover:text-ws-text"
      >
        Advanced
        <ChevronDown size={14} className={clsx("transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
      </button>
      <div id={id} hidden={!open} className="space-y-3 pt-2">
        <div>
          <label htmlFor={`${id}-neg`} className={labelClass}>
            Negative prompt
          </label>
          <textarea
            id={`${id}-neg`}
            rows={2}
            maxLength={NEGATIVE_PROMPT_MAX_LENGTH}
            value={composer.negativePrompt}
            onChange={(e) => updateComposer({ negativePrompt: e.target.value })}
            placeholder="logos, text, harsh flash"
            className="w-full resize-none rounded-lg border border-ws-line bg-ws-bg px-2.5 py-2 text-[12px] text-ws-text placeholder:text-ws-muted focus:border-ws-line-strong focus:outline-none"
          />
        </div>
        <div>
          <span className={labelClass} id={`${id}-seed-label`}>
            Seed
          </span>
          <div className="flex gap-1.5" role="group" aria-labelledby={`${id}-seed-label`}>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Seed value"
              min={0}
              max={999999}
              value={locked ? composer.seed : ""}
              placeholder="Random each run"
              onChange={(e) => {
                const n = e.target.value === "" ? null : Math.min(999999, Math.max(0, Math.trunc(Number(e.target.value))));
                updateComposer({ seed: Number.isNaN(n) ? null : n });
              }}
              className="min-w-0 flex-1 rounded-lg border border-ws-line bg-ws-bg px-2.5 py-1.5 font-mono text-[12px] text-ws-text placeholder:font-sans placeholder:text-ws-muted focus:border-ws-line-strong focus:outline-none"
            />
            <button
              type="button"
              onClick={() => updateComposer({ seed: Math.floor(Math.random() * 1_000_000) })}
              aria-label="Roll a new seed"
              className="grid w-8 place-items-center rounded-lg border border-ws-line text-ws-text-2 hover:text-ws-text"
            >
              <Dices size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => updateComposer({ seed: locked ? null : Math.floor(Math.random() * 1_000_000) })}
              aria-pressed={locked}
              aria-label={locked ? "Unlock seed (random each run)" : "Lock seed"}
              className={clsx("grid w-8 place-items-center rounded-lg border", locked ? "border-ws-accent/50 text-ws-accent" : "border-ws-line text-ws-text-2 hover:text-ws-text")}
            >
              {locked ? <Lock size={14} aria-hidden="true" /> : <LockOpen size={14} aria-hidden="true" />}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-ws-muted">Lock the seed to change one thing at a time.</p>
        </div>
      </div>
    </div>
  );
}

export function Composer() {
  const { composer, updateComposer, submitComposer, pending, branchFromId } = useWorkspace();
  const [hint, setHint] = useState(null);
  const ref = useRef(null);
  const id = useId();
  const model = WS_MODELS.find((m) => m.id === composer.model);

  const submit = (e) => {
    e?.preventDefault();
    if (pending) return;
    if (composer.prompt.trim().length < 3) {
      setHint("Describe the direction first (3+ characters).");
      ref.current?.focus();
      return;
    }
    setHint(null);
    submitComposer();
  };

  return (
    <form onSubmit={submit} aria-label="Compose" className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-ws-text">{branchFromId ? "Remix" : "New direction"}</h2>
        <span className="text-[11px] text-ws-muted">Ctrl + Enter</span>
      </div>

      <BranchContext />

      <div className="rounded-xl border border-ws-line bg-ws-bg focus-within:border-ws-line-strong">
        <label htmlFor={id} className="sr-only">
          Prompt
        </label>
        <textarea
          ref={ref}
          id={id}
          data-ws-prompt
          value={composer.prompt}
          maxLength={PROMPT_MAX_LENGTH}
          onChange={(e) => {
            updateComposer({ prompt: e.target.value });
            if (hint) setHint(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
          }}
          rows={6}
          placeholder="Describe a scene, subject and light — e.g. model in a camel coat on a rain-soaked street at blue hour"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="block max-h-[40dvh] min-h-[132px] w-full resize-y rounded-xl bg-transparent px-3 py-2.5 text-[13px] leading-relaxed text-ws-text placeholder:text-ws-muted focus:outline-none"
        />
        {hint && (
          <p id={`${id}-hint`} role="alert" className="px-3 pb-2 text-[11px] text-ws-danger">
            {hint}
          </p>
        )}
      </div>

      <div>
        <span className={labelClass} aria-hidden="true">
          Model
        </span>
        <Select
          label="Model"
          nameFromContent
          value={composer.model}
          onChange={(v) => updateComposer({ model: v })}
          options={WS_MODELS.map((m) => ({ value: m.id, label: m.label, description: m.description, icon: <ModelMark id={m.id} /> }))}
          classes={{
            panel: "rounded-xl border border-ws-line-strong bg-ws-surface p-1 font-sans text-ws-text shadow-ws-pop",
            option: "rounded-lg px-2 py-2 text-[13px]",
            optionActive: "bg-ws-overlay",
            description: "text-[11px] text-ws-muted",
            check: "text-ws-accent",
          }}
          triggerClassName="group flex w-full items-center gap-2.5 rounded-lg border border-ws-line bg-ws-bg p-1.5 pr-2.5 text-left transition-colors duration-150 hover:border-ws-line-strong aria-expanded:border-ws-accent/60"
          trigger={
            <>
              <ModelMark id={model?.id} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] text-ws-text">
                  <span className="sr-only">Model: </span>
                  {model?.label}
                </span>
                <span className="block truncate text-[11px] text-ws-muted">{model?.description}</span>
              </span>
              <ChevronDown size={14} className="shrink-0 text-ws-muted transition-transform duration-200 group-aria-expanded:rotate-180" aria-hidden="true" />
            </>
          }
        />
      </div>

      <Segmented label="Aspect ratio" name="ws-ratio" options={WS_RATIOS} value={composer.aspectRatio} onChange={(v) => updateComposer({ aspectRatio: v })} />
      <Segmented label="Images per run" name="ws-count" options={WS_COUNTS} value={composer.count} onChange={(v) => updateComposer({ count: v })} />

      <Advanced />

      <button
        type="submit"
        aria-disabled={Boolean(pending)}
        className={clsx(
          "flex h-10 items-center justify-center gap-2 rounded-lg bg-ws-accent text-[13px] font-semibold text-ws-accent-ink transition-[filter,transform] duration-150",
          pending ? "cursor-progress opacity-70" : "hover:brightness-110 active:scale-[0.98]"
        )}
      >
        {pending ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : branchFromId ? <GitBranch size={15} aria-hidden="true" /> : <ArrowUp size={15} aria-hidden="true" />}
        {pending ? "Generating…" : branchFromId ? "Generate branch" : "Generate"}
      </button>
    </form>
  );
}
