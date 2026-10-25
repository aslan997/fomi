"use client";

import { useId, useState } from "react";
import { Aperture, Crop, PenLine, Shuffle, Sun } from "lucide-react";
import { VARIATION_INTENTS } from "@/lib/workspace/options";
import { useWorkspace } from "./WorkspaceProvider";

const ICONS = { lighting: Sun, framing: Crop, subject: Shuffle, remix: PenLine };

/**
 * Branch options for one image. Lighting / Framing / Subject run immediately
 * (one decision, one click); Remix hands off to the composer for prompt edits.
 */
export function BranchMenuContent({ imageId, close }) {
  const { generate, startRemix, label, index, pending } = useWorkspace();
  const [note, setNote] = useState("");
  const id = useId();
  const entry = index.imageIndex.get(imageId);
  if (!entry) return null;

  const choose = (intent) => {
    close?.(false);
    if (intent === "remix") startRemix(imageId);
    else generate({ parentImageId: imageId, intent, note });
  };

  return (
    <div className="w-72 max-w-full text-[12px]">
      <p className="flex items-center gap-1.5 text-[11px] text-ws-muted">
        <Aperture size={12} aria-hidden="true" />
        Branch from <span className="font-mono text-ws-text">{label(entry.generation.generationId, entry.index)}</span>
      </p>
      <label htmlFor={`${id}-note`} className="mt-3 block text-[11px] font-medium text-ws-text-2">
        Direction <span className="font-normal text-ws-muted">(optional)</span>
      </label>
      <input
        id={`${id}-note`}
        value={note}
        maxLength={200}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. warmer, more dramatic"
        className="mt-1 w-full rounded-lg border border-ws-line bg-ws-bg px-2.5 py-1.5 text-[12px] text-ws-text placeholder:text-ws-muted focus:border-ws-line-strong focus:outline-none"
      />
      <ul className="mt-2 space-y-0.5" aria-label="What to explore">
        {VARIATION_INTENTS.map((intent) => {
          const Icon = ICONS[intent.id];
          return (
            <li key={intent.id}>
              <button
                type="button"
                disabled={Boolean(pending)}
                onClick={() => choose(intent.id)}
                className="group flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-ws-overlay focus-visible:bg-ws-overlay disabled:opacity-50"
              >
                <Icon size={15} className="mt-0.5 shrink-0 text-ws-text-2 group-hover:text-ws-accent" aria-hidden="true" />
                <span>
                  <span className="block font-medium text-ws-text">
                    {intent.label}
                    {intent.id === "remix" && <span className="font-normal text-ws-muted"> — edit prompt</span>}
                  </span>
                  <span className="block text-[11px] text-ws-muted">
                    Keeps {intent.keeps}, explores {intent.explores}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
