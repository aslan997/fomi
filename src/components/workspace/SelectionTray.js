"use client";

import Image from "next/image";
import { Columns2, X } from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";

/** Appears when images are selected — selection spans branches, so you can compare across them. */
export function SelectionTray() {
  const { selection, index, label, toggleSelect, clearSelection, setCompareOpen } = useWorkspace();
  if (selection.length === 0) return null;
  const items = selection.map((id) => index.imageIndex.get(id)).filter(Boolean);

  return (
    <div className="pointer-events-none sticky bottom-4 z-20 mt-6 flex justify-center">
      <div
        role="region"
        aria-label="Selection"
        className="animate-reveal pointer-events-auto flex items-center gap-2 rounded-2xl border border-ws-line-strong bg-ws-surface/95 p-2 shadow-ws-pop backdrop-blur-md"
      >
        <ul className="flex gap-1.5">
          {items.map(({ image, generation, index: i }) => (
            <li key={image.id} className="group relative">
              <span className="relative block h-11 w-9 overflow-hidden rounded-md">
                <Image src={image.url} alt="" fill sizes="36px" className="object-cover" />
              </span>
              <button
                type="button"
                onClick={() => toggleSelect(image.id)}
                aria-label={`Remove ${label(generation.generationId, i)} from selection`}
                className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-ws-overlay text-ws-text opacity-0 ring-1 ring-ws-line-strong transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <span className="px-1 font-mono text-[11px] text-ws-text-2">{selection.length}/4</span>
        <button
          type="button"
          onClick={() => setCompareOpen(true)}
          disabled={selection.length < 2}
          title={selection.length < 2 ? "Select at least 2 images to compare" : undefined}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-ws-accent px-3 text-[12px] font-semibold text-ws-accent-ink transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Columns2 size={14} aria-hidden="true" />
          Compare
        </button>
        <button type="button" onClick={clearSelection} className="h-9 rounded-xl px-3 text-[12px] text-ws-text-2 hover:bg-ws-raised hover:text-ws-text">
          Clear
        </button>
      </div>
    </div>
  );
}
