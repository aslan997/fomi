"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";
import { Check, Download, GitBranch, Maximize2, Star } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { assetFilename, downloadAsset } from "@/lib/download";
import { describeLook, ratioOf } from "@/lib/workspace/format";
import { BranchMenuContent } from "./BranchMenu";
import { useWorkspace } from "./WorkspaceProvider";

const actionClass =
  "grid h-8 w-8 place-items-center rounded-lg bg-black/55 text-white/90 backdrop-blur-md transition-[background-color,color,transform] duration-150 hover:bg-black/75 hover:text-white active:scale-90";

/**
 * Click (or Space/Enter) selects — the canvas works like a design tool.
 * Expand opens the preview; Branch opens intents in place.
 */
export function ImageCard({ image, generation, imageIndex, sizes }) {
  const { selection, toggleSelect, kept, toggleKeep, setPreviewImageId, label, index, activate, announce } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const selected = selection.includes(image.id);
  const isKept = Boolean(kept[image.id]);
  const branches = index.childrenOfImage.get(image.id) ?? [];
  const name = label(generation.generationId, imageIndex);

  const download = async () => {
    setBusy(true);
    try {
      await downloadAsset(image.url, assetFilename(image));
      announce(`Downloading ${name}.`);
    } catch {
      announce("Download failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={clsx(
        "group/card relative rounded-xl bg-ws-raised outline-offset-2 transition-[outline-color] duration-150",
        selected ? "outline-2 outline-ws-accent" : "outline-2 outline-transparent"
      )}
      style={{ aspectRatio: ratioOf(generation.aspectRatio) }}
    >
      <button
        type="button"
        onClick={() => toggleSelect(image.id)}
        onDoubleClick={() => setPreviewImageId(image.id)}
        aria-pressed={selected}
        aria-label={`${name}: ${describeLook(image.look)}. ${selected ? "Selected" : "Select"}`}
        className="absolute inset-0 block h-full w-full overflow-hidden rounded-xl focus-visible:outline-offset-[-3px]"
      >
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          className="animate-reveal object-cover transition-transform duration-300 ease-out group-hover/card:scale-[1.015]"
          style={{ animationDelay: `${imageIndex * 60}ms` }}
        />
      </button>

      {/* Selection checkbox: always visible when selected, otherwise on hover. */}
      <span
        aria-hidden="true"
        className={clsx(
          "pointer-events-none absolute top-2.5 left-2.5 grid h-5 w-5 place-items-center rounded-md border transition-opacity duration-150",
          selected ? "border-ws-accent bg-ws-accent text-ws-accent-ink" : "border-white/70 bg-black/30 opacity-0 group-hover/card:opacity-100"
        )}
      >
        {selected && <Check size={13} strokeWidth={3} />}
      </span>

      <span className="pointer-events-none absolute top-2.5 left-10 rounded-md bg-black/55 px-1.5 py-0.5 font-mono text-[10px] text-white/90 opacity-0 backdrop-blur-md transition-opacity duration-150 group-hover/card:opacity-100 group-focus-within/card:opacity-100">
        {name}
      </span>

      {isKept && (
        <Star size={15} fill="currentColor" aria-hidden="true" className="pointer-events-none absolute top-3 right-3 text-ws-accent drop-shadow transition-opacity group-hover/card:opacity-0 group-focus-within/card:opacity-0" />
      )}

      <div
        className={clsx(
          "absolute top-2 right-2 flex gap-1.5 transition-opacity duration-150",
          "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/card:opacity-100 [@media(hover:hover)]:group-focus-within/card:opacity-100"
        )}
      >
        <button type="button" onClick={() => toggleKeep(image.id)} aria-pressed={isKept} aria-label={isKept ? `Unkeep ${name}` : `Keep ${name}`} className={clsx(actionClass, isKept && "text-ws-accent")}>
          <Star size={15} fill={isKept ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <button type="button" onClick={download} disabled={busy} aria-label={`Download ${name}`} className={actionClass}>
          <Download size={15} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setPreviewImageId(image.id)} aria-label={`Open ${name} preview`} className={actionClass}>
          <Maximize2 size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-2">
        <span className="pointer-events-none truncate rounded-md bg-black/55 px-2 py-1 text-[11px] text-white/90 opacity-0 backdrop-blur-md transition-opacity duration-150 group-hover/card:opacity-100 group-focus-within/card:opacity-100">
          {describeLook(image.look)}
        </span>
        <div className="flex shrink-0 gap-1.5">
          {branches.length > 0 && (
            <button
              type="button"
              onClick={() => activate(branches.at(-1).generationId)}
              aria-label={`${branches.length} branch${branches.length > 1 ? "es" : ""} from ${name} — open latest`}
              className="flex h-8 items-center gap-1 rounded-lg bg-black/55 px-2 font-mono text-[11px] text-white/90 backdrop-blur-md hover:bg-black/75"
            >
              <GitBranch size={12} aria-hidden="true" />
              {branches.length}
            </button>
          )}
          <Popover
            side="top"
            triggerLabel={`Branch from ${name}`}
            triggerClassName="flex h-8 items-center gap-1.5 rounded-lg bg-ws-accent px-2.5 text-[12px] font-semibold text-ws-accent-ink shadow-lg transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-95 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/card:opacity-100 [@media(hover:hover)]:group-focus-within/card:opacity-100 aria-expanded:opacity-100"
            trigger={
              <>
                <GitBranch size={13} aria-hidden="true" />
                Branch
              </>
            }
            panelClassName="rounded-xl border border-ws-line bg-ws-surface p-3 shadow-ws-pop"
          >
            {(close) => <BranchMenuContent imageId={image.id} close={close} />}
          </Popover>
        </div>
      </div>
    </div>
  );
}
