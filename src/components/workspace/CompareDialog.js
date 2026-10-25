"use client";

import Image from "next/image";
import clsx from "clsx";
import { ArrowUpRight, Star, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { FRAMINGS, GRADES, findIntent } from "@/lib/workspace/options";
import { diffWords, lineage } from "@/lib/workspace/tree";
import { useWorkspace } from "./WorkspaceProvider";

/**
 * Side-by-side comparison of 2–4 images from anywhere in the tree. Attributes
 * that differ between candidates are highlighted, and prompts are diffed
 * against the first column, so the *reason* two results differ is visible.
 */
function CompareBody({ onClose }) {
  const { selection, index, label, kept, toggleKeep, activate, toggleSelect } = useWorkspace();
  const items = selection.map((id) => index.imageIndex.get(id)).filter(Boolean);
  if (items.length < 2) return <p className="p-8 text-center text-ws-text-2">Select at least two images to compare.</p>;

  const base = items[0];
  const attrs = [
    ["Light", (e) => GRADES[e.image.look.grade]],
    ["Framing", (e) => FRAMINGS[e.image.look.framing]],
    ["Scene", (e) => e.image.look.base],
    ["Branch", (e) => findIntent(e.generation.variation?.intent)?.label ?? "Root"],
    ["Seed", (e) => String(e.generation.seed)],
  ];
  const differs = (fn) => new Set(items.map(fn)).size > 1;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-ws-line px-5 py-3">
        <h2 id="compare-title" className="text-[14px] font-medium">
          Compare <span className="font-mono text-ws-muted">{items.length}</span>
        </h2>
        <button type="button" onClick={onClose} aria-label="Close compare" className="grid h-8 w-8 place-items-center rounded-lg text-ws-text-2 hover:bg-ws-raised hover:text-ws-text">
          <X size={16} aria-hidden="true" />
        </button>
      </header>
      <div className="ws-scroll grid min-h-0 flex-1 auto-cols-[minmax(240px,1fr)] grid-flow-col gap-4 overflow-auto p-5">
        {items.map((entry, col) => {
          const { image, generation, index: i } = entry;
          const name = label(generation.generationId, i);
          const isKept = Boolean(kept[image.id]);
          return (
            <section key={image.id} aria-label={name} className="flex min-w-0 flex-col">
              {/* Height-capped so attributes and prompt diffs stay visible alongside the images. */}
              <div className="relative mx-auto aspect-[4/5] h-[min(50dvh,520px)] max-w-full overflow-hidden rounded-xl bg-ws-raised">
                <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 25vw, 80vw" className="object-cover" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="font-mono text-[13px]">{name}</p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleKeep(image.id)}
                    aria-pressed={isKept}
                    aria-label={isKept ? `Unkeep ${name}` : `Keep ${name}`}
                    className={clsx("grid h-8 w-8 place-items-center rounded-lg border border-ws-line hover:bg-ws-raised", isKept ? "text-ws-accent" : "text-ws-text-2")}
                  >
                    <Star size={14} fill={isKept ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      activate(generation.generationId);
                      onClose();
                    }}
                    aria-label={`Open ${label(generation.generationId)} in canvas`}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-ws-line text-ws-text-2 hover:bg-ws-raised hover:text-ws-text"
                  >
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelect(image.id)}
                    aria-label={`Remove ${name} from comparison`}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-ws-line text-ws-text-2 hover:bg-ws-raised hover:text-ws-text"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="mt-1 font-mono text-[11px] text-ws-muted">{lineage(index, generation.generationId).map((id) => label(id)).join(" › ")}</p>
              <dl className="mt-3 space-y-1 text-[12px]">
                {attrs.map(([k, fn]) => {
                  const highlight = differs(fn);
                  return (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="text-ws-muted">{k}</dt>
                      <dd className={clsx(k === "Scene" && "capitalize", highlight ? "font-medium text-ws-accent" : "text-ws-text-2")}>
                        {fn(entry)}
                        {highlight && <span className="sr-only"> (differs)</span>}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              <p className="mt-3 border-t border-ws-line pt-3 text-[12px] leading-relaxed text-ws-text-2">
                {col === 0 || generation.prompt === base.generation.prompt ? (
                  <>
                    {generation.prompt}
                    {col > 0 && <span className="ml-1 text-ws-muted">(same prompt)</span>}
                  </>
                ) : (
                  diffWords(base.generation.prompt, generation.prompt).map((p, j) =>
                    p.type === "same" ? (
                      <span key={j}>{p.text}</span>
                    ) : p.type === "added" ? (
                      <ins key={j} className="mx-px rounded-sm bg-ws-accent-soft px-0.5 text-ws-accent no-underline">
                        <span className="sr-only">added: </span>
                        {p.text}
                      </ins>
                    ) : (
                      <del key={j} className="mx-px px-0.5 text-ws-muted">
                        <span className="sr-only">removed: </span>
                        {p.text}
                      </del>
                    )
                  )
                )}
              </p>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function CompareDialog() {
  const { compareOpen, setCompareOpen } = useWorkspace();
  const close = () => setCompareOpen(false);
  return (
    <Dialog
      open={compareOpen}
      onClose={close}
      labelledBy="compare-title"
      variant="ws-dialog"
      className="ws m-auto h-[min(94dvh,1000px)] w-[min(97vw,1500px)] overflow-hidden rounded-2xl border border-ws-line p-0 font-sans"
    >
      <CompareBody onClose={close} />
    </Dialog>
  );
}
