"use client";

import { useId, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Dices, LoaderCircle, Sparkles } from "lucide-react";
import {
  ASPECT_RATIOS,
  IMAGE_COUNTS,
  MODELS,
  NEGATIVE_PROMPT_MAX_LENGTH,
  PROMPT_MAX_LENGTH,
  STYLES,
} from "@/lib/generation-options";
import { creditCost, useStudio } from "./StudioProvider";

function ModeSwitch() {
  const { composer, setMode } = useStudio();
  return (
    <fieldset className="grid grid-cols-2 rounded-full bg-st-surface p-[3px]">
      <legend className="sr-only">Output type</legend>
      {["image", "video"].map((mode) => (
        <label key={mode} className="relative">
          <input
            type="radio"
            name="studio-mode"
            value={mode}
            checked={composer.mode === mode}
            onChange={() => setMode(mode)}
            className="peer sr-only"
          />
          <span
            className={clsx(
              "block cursor-pointer rounded-full py-[3px] text-center text-[10px] capitalize text-st-muted transition-colors duration-200",
              "peer-checked:bg-st-segment peer-checked:text-st-ink-2 peer-focus-visible:outline-2 peer-focus-visible:outline-(--focus-ring)"
            )}
          >
            {mode}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function PromptBox() {
  const { composer, updateComposer, generate, pending, credits } = useStudio();
  const id = useId();
  const textareaRef = useRef(null);
  const [blockedReason, setBlockedReason] = useState(null);
  const prompt = composer.prompt;
  const cost = creditCost(composer);
  const tooShort = prompt.trim().length < 3;
  const noCredits = cost > credits;
  const nearLimit = prompt.length > PROMPT_MAX_LENGTH * 0.9;

  const hint = noCredits
    ? `Not enough credits (${cost} needed, ${credits} left).`
    : tooShort
      ? "Describe what you want to create first (3+ characters)."
      : null;

  // The button keeps the mockup's full-strength look in the empty state; an
  // invalid submit explains itself and moves focus to where the fix is.
  const submit = (e) => {
    e?.preventDefault();
    if (pending) return;
    if (hint) {
      setBlockedReason(hint);
      if (tooShort) textareaRef.current?.focus();
      return;
    }
    setBlockedReason(null);
    generate();
  };

  return (
    <form onSubmit={submit} className="relative rounded-[16px] border-[1.5px] border-st-outline bg-st-surface shadow-st-prompt">
      <label htmlFor={id} className="sr-only">
        Prompt
      </label>
      <textarea
        ref={textareaRef}
        id={id}
        data-studio-prompt
        value={prompt}
        maxLength={PROMPT_MAX_LENGTH}
        onChange={(e) => {
          updateComposer({ prompt: e.target.value });
          if (blockedReason) setBlockedReason(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
        }}
        placeholder={composer.mode === "video" ? "Describe the scene and motion you want to see ..." : "Describe you imaginations to be converted to piece of art ..."}
        aria-describedby={`${id}-hint`}
        className="block h-[170px] w-full resize-none rounded-[16px] bg-transparent px-3 pt-[22px] pb-14 text-[11px] leading-[1.6] text-st-ink placeholder:text-st-ink-2 focus:outline-none"
      />
      <p id={`${id}-hint`} className="sr-only">
        Press Control+Enter to generate. Costs {cost} credit{cost > 1 ? "s" : ""}.
      </p>
      {blockedReason ? (
        <p role="alert" className="absolute right-3 bottom-[52px] left-3 text-[10px] leading-snug text-st-danger">
          {blockedReason}
        </p>
      ) : (
        nearLimit && (
          <p className="absolute bottom-[18px] left-3 text-[10px] tabular-nums text-st-muted" aria-hidden="true">
            {prompt.length}/{PROMPT_MAX_LENGTH}
          </p>
        )
      )}
      {/* Mockup colors kept for fidelity: white on #e39c85 is 2.2:1 — the one
          documented contrast exception (see docs/ARCHITECTURE.md). */}
      <button
        type="submit"
        data-contrast-exception="mockup"
        aria-disabled={Boolean(pending)}
        className={clsx(
          "absolute right-[10px] bottom-[12px] flex h-[34px] items-center gap-2 rounded-full bg-st-accent pr-[18px] pl-[14px] text-[15px] text-st-accent-ink transition-[background-color,transform] duration-150",
          pending ? "cursor-progress" : "hover:bg-st-accent-strong active:scale-[0.97]"
        )}
      >
        {pending ? (
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles size={16} fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
        )}
        {pending ? "Generating" : "Generate"}
      </button>
    </form>
  );
}

/** Native <select> styled as the mockup's pill chip. The visible text is decorative; the select is the control. */
function OptionChip({ label, value, onChange, options, display, className }) {
  return (
    <div
      className={clsx(
        "relative flex h-[26px] items-center justify-between gap-1 rounded-[9px] bg-st-chip pr-1 pl-2 text-[10px] whitespace-nowrap text-st-ink-2 focus-within:outline-2 focus-within:outline-(--focus-ring)",
        className
      )}
    >
      <span aria-hidden="true">{display}</span>
      <span aria-hidden="true" className="grid h-[16px] w-[18px] place-items-center rounded-full bg-st-pill">
        <ChevronDown size={11} />
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function OptionsRow() {
  const { composer, updateComposer } = useStudio();
  const model = MODELS[composer.mode].find((m) => m.id === composer.model);
  const noun = composer.mode === "video" ? "Clips" : "Images";
  return (
    <div className="flex gap-[6px]">
      <OptionChip
        label={`Number of ${noun.toLowerCase()}`}
        value={composer.count}
        onChange={(v) => updateComposer({ count: Number(v) })}
        options={IMAGE_COUNTS.map((n) => ({ value: n, label: `${n} ${n === 1 ? noun.slice(0, -1) : noun}` }))}
        display={`${composer.count} ${noun}`}
        className="flex-[1.25]"
      />
      <OptionChip
        label="Aspect ratio"
        value={composer.aspectRatio}
        onChange={(v) => updateComposer({ aspectRatio: v })}
        options={ASPECT_RATIOS[composer.mode].map((r) => ({ value: r, label: r }))}
        display={composer.aspectRatio}
        className="flex-[0.85]"
      />
      <OptionChip
        label="Model"
        value={composer.model}
        onChange={(v) => updateComposer({ model: v })}
        options={MODELS[composer.mode].map((m) => ({ value: m.id, label: `${m.label} — ${m.description}` }))}
        display={
          <>
            Model: <b className="font-semibold text-st-ink">{model?.label}</b>
          </>
        }
        className="flex-[1.6]"
      />
    </div>
  );
}

function Disclosure({ title, badge, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-full items-center justify-center rounded-full bg-st-surface text-[14px] font-medium text-st-ink-2 transition-colors duration-150 hover:bg-st-raised"
      >
        {title}
        {badge && <span className="ml-2 rounded-full bg-st-segment px-2 py-px text-[10px] font-medium text-st-ink-2">{badge}</span>}
        <span aria-hidden="true" className="absolute right-4 grid h-[16px] w-[20px] place-items-center rounded-md bg-st-pill">
          <ChevronDown size={12} className={clsx("transition-transform duration-200", open && "rotate-180")} />
        </span>
      </button>
      <div id={id} hidden={!open} className="px-1 pt-3">
        {children}
      </div>
    </div>
  );
}

const fieldLabel = "mb-1 block text-[11px] font-medium text-st-ink-2";
const fieldInput =
  "w-full rounded-[10px] border border-st-panel-border bg-st-surface px-2.5 py-1.5 text-[11px] text-st-ink placeholder:text-st-faint focus:border-st-accent focus:outline-none";

function AdvancedSettings() {
  const { composer, updateComposer } = useStudio();
  const id = useId();
  const randomSeed = composer.seed === null;
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${id}-neg`} className={fieldLabel}>
          Negative prompt
        </label>
        <textarea
          id={`${id}-neg`}
          rows={2}
          maxLength={NEGATIVE_PROMPT_MAX_LENGTH}
          value={composer.negativePrompt}
          onChange={(e) => updateComposer({ negativePrompt: e.target.value })}
          placeholder="What to avoid, e.g. blur, extra fingers"
          className={clsx(fieldInput, "resize-none")}
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${id}-cfg`} className={fieldLabel}>
            Prompt guidance
          </label>
          <output htmlFor={`${id}-cfg`} className="text-[11px] tabular-nums text-st-muted">
            {composer.guidance}
          </output>
        </div>
        <input
          id={`${id}-cfg`}
          type="range"
          min={1}
          max={20}
          step={0.5}
          value={composer.guidance}
          onChange={(e) => updateComposer({ guidance: Number(e.target.value) })}
          className="w-full accent-(--st-accent-strong)"
        />
      </div>
      <div>
        <label htmlFor={`${id}-seed`} className={fieldLabel}>
          Seed
        </label>
        <div className="flex gap-1.5">
          <input
            id={`${id}-seed`}
            type="number"
            inputMode="numeric"
            min={0}
            max={999999}
            placeholder="Random"
            value={randomSeed ? "" : composer.seed}
            onChange={(e) => {
              const n = e.target.value === "" ? null : Math.min(999999, Math.max(0, Math.trunc(Number(e.target.value))));
              updateComposer({ seed: Number.isNaN(n) ? null : n });
            }}
            className={fieldInput}
          />
          <button
            type="button"
            onClick={() => updateComposer({ seed: Math.floor(Math.random() * 1_000_000) })}
            aria-label="Pick a random seed"
            className="grid w-9 shrink-0 place-items-center rounded-[10px] border border-st-panel-border bg-st-surface text-st-ink-2 transition-colors hover:text-st-ink"
          >
            <Dices size={15} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1 text-[10px] text-st-muted">Same prompt + seed returns the same results.</p>
      </div>
    </div>
  );
}

function StylePicker() {
  const { composer, updateComposer } = useStudio();
  return (
    <fieldset className="grid grid-cols-2 gap-1.5">
      <legend className="sr-only">Style</legend>
      {STYLES.map((s) => (
        <label key={s.id}>
          <input
            type="radio"
            name="studio-style"
            value={s.id}
            checked={composer.style === s.id}
            onChange={() => updateComposer({ style: s.id })}
            className="peer sr-only"
          />
          <span className="block cursor-pointer rounded-full border border-transparent bg-st-surface py-1.5 text-center text-[11px] text-st-ink-2 transition-colors duration-150 hover:border-st-panel-border peer-checked:border-st-accent peer-checked:bg-st-segment peer-checked:text-st-ink peer-focus-visible:outline-2 peer-focus-visible:outline-(--focus-ring)">
            {s.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function Composer({ className }) {
  const { composer } = useStudio();
  const style = STYLES.find((s) => s.id === composer.style);
  return (
    <aside
      aria-label="Create"
      className={clsx("flex flex-col gap-[14px] rounded-[20px] border border-st-panel-border bg-st-panel px-[13px] pt-[14px] pb-6", className)}
    >
      <div className="px-2">
        <ModeSwitch />
      </div>
      <PromptBox />
      <OptionsRow />
      <div className="mt-2 space-y-[22px] px-1">
        <Disclosure title="Advance">
          <AdvancedSettings />
        </Disclosure>
        <Disclosure title="Styles" badge={composer.style !== "none" ? style?.label : null}>
          <StylePicker />
        </Disclosure>
      </div>
    </aside>
  );
}
