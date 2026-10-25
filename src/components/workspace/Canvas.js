"use client";

import Image from "next/image";
import { Fragment } from "react";
import clsx from "clsx";
import { AlertCircle, ArrowUpLeft, ChevronRight, GitBranch, ImageOff, LoaderCircle, RotateCcw, Star, X } from "lucide-react";
import { WS_MODELS, findIntent } from "@/lib/workspace/options";
import { diffWords, lineage } from "@/lib/workspace/tree";
import { formatTime, ratioOf } from "@/lib/workspace/format";
import { ImageCard } from "./ImageCard";
import { PENDING_ID, useWorkspace } from "./WorkspaceProvider";

// A whole run stays visible at once on wide screens (one row of four), so
// siblings can be judged side by side without scrolling.
const GRID = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4";
const CARD_SIZES = "(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 768px) 24vw, 50vw";

function Lineage({ generationId }) {
  const { index, label, activate } = useWorkspace();
  const path = lineage(index, generationId);
  return (
    <nav aria-label="Lineage" className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
      {path.map((id, i) => {
        const current = i === path.length - 1;
        return (
          <Fragment key={id}>
            {i > 0 && <ChevronRight size={12} className="text-ws-muted" aria-hidden="true" />}
            {current ? (
              <span aria-current="page" className="rounded-md bg-ws-accent-soft px-1.5 py-0.5 text-ws-accent">
                {label(id)}
              </span>
            ) : (
              <button type="button" onClick={() => activate(id)} className="rounded-md px-1.5 py-0.5 text-ws-text-2 hover:bg-ws-raised hover:text-ws-text">
                {label(id)}
              </button>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

/** Shows the prompt; for a branch, highlights exactly what changed from its parent. */
function PromptDiff({ generation }) {
  const { index } = useWorkspace();
  const parent = generation.parentGenerationId ? index.byId.get(generation.parentGenerationId) : null;
  if (!parent || parent.prompt === generation.prompt) {
    return (
      <p className="text-[13px] leading-relaxed text-ws-text-2">
        {generation.prompt}
        {parent && <span className="ml-2 text-[11px] text-ws-muted">(same prompt as parent)</span>}
      </p>
    );
  }
  return (
    <p className="text-[13px] leading-relaxed text-ws-text-2">
      {diffWords(parent.prompt, generation.prompt).map((part, i) =>
        part.type === "same" ? (
          <span key={i}>{part.text}</span>
        ) : part.type === "added" ? (
          <ins key={i} className="mx-px rounded-sm bg-ws-accent-soft px-0.5 text-ws-accent no-underline">
            <span className="sr-only">added: </span>
            {part.text}
          </ins>
        ) : (
          <del key={i} className="mx-px px-0.5 text-ws-muted decoration-ws-muted/70">
            <span className="sr-only">removed: </span>
            {part.text}
          </del>
        )
      )}
    </p>
  );
}

function BranchOrigin({ generation }) {
  const { index, label, activate } = useWorkspace();
  const parent = index.imageIndex.get(generation.parentImageId);
  if (!parent) return null;
  const intent = findIntent(generation.variation?.intent);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ws-line bg-ws-surface p-2 pr-3">
      <button
        type="button"
        onClick={() => activate(parent.generation.generationId)}
        className="group relative h-14 w-11 shrink-0 overflow-hidden rounded-lg"
        aria-label={`Go to parent ${label(parent.generation.generationId, parent.index)}`}
      >
        <Image src={parent.image.url} alt="" fill sizes="44px" className="object-cover transition-transform duration-200 group-hover:scale-105" />
        <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpLeft size={14} className="text-white" aria-hidden="true" />
        </span>
      </button>
      <div className="min-w-0 text-[12px]">
        <p className="text-ws-text">
          <span className="font-medium">{intent?.label ?? "Variation"}</span>
          <span className="text-ws-muted"> branch of </span>
          <span className="font-mono">{label(parent.generation.generationId, parent.index)}</span>
        </p>
        <p className="truncate text-ws-text-2">
          {intent ? `Kept ${intent.keeps} · explored ${intent.explores}` : ""}
          {generation.variation?.note && <span className="text-ws-text"> — “{generation.variation.note}”</span>}
        </p>
      </div>
    </div>
  );
}

function ChildBranches({ generation }) {
  const { index, label, activate } = useWorkspace();
  const kids = index.children.get(generation.generationId) ?? [];
  return (
    <section aria-labelledby="child-branches" className="mt-10 border-t border-ws-line pt-5">
      <h3 id="child-branches" className="flex items-center gap-1.5 text-[12px] font-medium text-ws-text-2">
        <GitBranch size={13} aria-hidden="true" />
        Branches from {label(generation.generationId)}
        <span className="font-mono text-ws-muted">{kids.length}</span>
      </h3>
      {kids.length === 0 ? (
        <p className="mt-2 text-[12px] text-ws-muted">Hover an image and choose Branch to explore lighting, framing or subject while keeping the rest.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {kids.map((kid) => {
            const parent = index.imageIndex.get(kid.parentImageId);
            return (
              <li key={kid.generationId}>
                <button
                  type="button"
                  onClick={() => activate(kid.generationId)}
                  className="flex items-center gap-2.5 rounded-xl border border-ws-line bg-ws-surface p-1.5 pr-3 text-left transition-colors hover:border-ws-line-strong hover:bg-ws-raised"
                >
                  <span className="flex -space-x-3">
                    {kid.images.slice(0, 3).map((img) => (
                      <span key={img.id} className="relative h-10 w-8 overflow-hidden rounded-md ring-2 ring-ws-surface">
                        <Image src={img.url} alt="" fill sizes="32px" className="object-cover" />
                      </span>
                    ))}
                  </span>
                  <span className="text-[12px]">
                    <span className="block font-mono text-ws-text">{label(kid.generationId)}</span>
                    <span className="block text-ws-text-2">
                      {findIntent(kid.variation?.intent)?.label ?? "Variation"} · from #{(parent?.index ?? 0) + 1}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function GenerationView({ generation }) {
  const { label, kept } = useWorkspace();
  const model = WS_MODELS.find((m) => m.id === generation.model);
  const keptCount = generation.images.filter((i) => kept[i.id]).length;
  return (
    <article aria-labelledby="gen-title" className="mx-auto max-w-[1400px]">
      <header className="space-y-3">
        <Lineage generationId={generation.generationId} />
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="gen-title" className="font-mono text-[20px] font-medium tracking-tight text-ws-text">
            {label(generation.generationId)}
          </h2>
          <p className="flex flex-wrap gap-x-3 text-[12px] text-ws-muted">
            <span>{model?.label ?? generation.model}</span>
            <span className="font-mono">{generation.aspectRatio}</span>
            <span className="font-mono">seed {generation.seed}</span>
            <span>{formatTime(generation.createdAt)}</span>
            {keptCount > 0 && (
              <span className="flex items-center gap-1 text-ws-accent">
                <Star size={11} fill="currentColor" aria-hidden="true" /> {keptCount} kept
              </span>
            )}
          </p>
        </div>
        {generation.parentImageId && <BranchOrigin generation={generation} />}
        <PromptDiff generation={generation} />
      </header>

      {generation.images.length === 0 ? (
        <div className="mt-6 grid place-items-center rounded-xl border border-dashed border-ws-line-strong px-6 py-16 text-center">
          <ImageOff size={22} className="text-ws-muted" aria-hidden="true" />
          <p className="mt-3 text-[14px] font-medium">No results for this run</p>
          <p className="mt-1 max-w-sm text-[12px] text-ws-text-2">Nothing in the library matched. Adjust the prompt, or branch from another image.</p>
        </div>
      ) : (
        <div className={clsx(GRID, "mt-6")}>
          {generation.images.map((image, i) => (
            <ImageCard key={image.id} image={image} generation={generation} imageIndex={i} sizes={CARD_SIZES} />
          ))}
        </div>
      )}

      <ChildBranches generation={generation} />
    </article>
  );
}

function PendingView({ request }) {
  const { cancel, index, label } = useWorkspace();
  const parent = request.parentImageId ? index.imageIndex.get(request.parentImageId) : null;
  const intent = findIntent(request.variation?.intent);
  return (
    <section aria-label="Generating" aria-busy="true" className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] text-ws-text">
          <LoaderCircle size={15} className="animate-spin text-ws-accent" aria-hidden="true" />
          {parent ? (
            <>
              Branching <span className="font-medium">{intent?.label}</span> from{" "}
              <span className="font-mono">{label(parent.generation.generationId, parent.index)}</span>…
            </>
          ) : (
            "Generating a new direction…"
          )}
        </p>
        <button type="button" onClick={cancel} className="flex items-center gap-1.5 rounded-lg border border-ws-line px-3 py-1.5 text-[12px] text-ws-text-2 hover:text-ws-text">
          <X size={13} aria-hidden="true" /> Cancel
        </button>
      </div>
      <p className="mt-3 max-w-3xl text-[13px] text-ws-text-2">{request.prompt}</p>
      <div className={clsx(GRID, "mt-6")}>
        {Array.from({ length: request.count }, (_, i) => (
          <div key={i} className="skeleton-ws rounded-xl" style={{ aspectRatio: ratioOf(request.aspectRatio), animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </section>
  );
}

function KeptView() {
  const { generations, kept, label, activate, setPreviewImageId } = useWorkspace();
  const items = generations.flatMap((g) => g.images.map((image, i) => ({ image, g, i }))).filter(({ image }) => kept[image.id]);
  return (
    <section aria-labelledby="kept-title" className="mx-auto max-w-[1400px]">
      <h2 id="kept-title" className="text-[20px] font-medium">
        Kept assets
      </h2>
      <p className="mt-1 text-[12px] text-ws-text-2">Your preserved decisions across every branch. {items.length} kept.</p>
      {items.length === 0 ? (
        <p className="mt-10 text-center text-[13px] text-ws-muted">Star an image to keep it here.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {items.map(({ image, g, i }) => (
            <li key={image.id} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-ws-raised">
              <button type="button" onClick={() => setPreviewImageId(image.id)} aria-label={`Preview ${label(g.generationId, i)}`} className="absolute inset-0">
                <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1280px) 20vw, 45vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              </button>
              <button
                type="button"
                onClick={() => activate(g.generationId)}
                className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] text-white backdrop-blur-md hover:bg-black/80"
              >
                {label(g.generationId, i)} ↗
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ErrorBanner() {
  const { error, retry, dismissError } = useWorkspace();
  if (!error) return null;
  return (
    <div role="alert" className="mx-auto mb-5 flex max-w-[1400px] flex-wrap items-center gap-3 rounded-xl border border-ws-danger/30 bg-ws-danger-soft px-4 py-3 text-[13px]">
      <AlertCircle size={16} className="shrink-0 text-ws-danger" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-ws-text">
        <strong className="font-medium">{error.request.parentImageId ? "Branch failed." : "Generation failed."}</strong>{" "}
        <span className="text-ws-text-2">{error.message}</span>
      </p>
      {error.retryable && (
        <button type="button" onClick={retry} className="flex items-center gap-1.5 rounded-lg bg-ws-accent px-3 py-1.5 text-[12px] font-semibold text-ws-accent-ink hover:brightness-110">
          <RotateCcw size={13} aria-hidden="true" /> Retry
        </button>
      )}
      <button type="button" onClick={dismissError} className="rounded-lg px-3 py-1.5 text-[12px] text-ws-text-2 hover:bg-ws-raised hover:text-ws-text">
        Dismiss
      </button>
    </div>
  );
}

export function CanvasSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto max-w-[1400px]">
      <div className="skeleton-ws h-4 w-32 rounded" />
      <div className="skeleton-ws mt-4 h-6 w-20 rounded" />
      <div className="skeleton-ws mt-4 h-4 w-2/3 rounded" />
      <div className={clsx(GRID, "mt-6")}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton-ws aspect-[4/5] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function Canvas() {
  const { status, loadError, retryLoad, view, activeId, pending, index } = useWorkspace();

  let content;
  if (status === "loading") content = <CanvasSkeleton />;
  else if (status === "error")
    content = (
      <div role="alert" className="grid place-items-center py-24 text-center">
        <p className="text-[14px] font-medium">{loadError}</p>
        <button type="button" onClick={retryLoad} className="mt-3 rounded-lg bg-ws-accent px-3 py-1.5 text-[12px] font-semibold text-ws-accent-ink">
          Try again
        </button>
      </div>
    );
  else if (view === "kept") content = <KeptView />;
  else if (activeId === PENDING_ID && pending) content = <PendingView request={pending.request} />;
  else {
    const generation = index.byId.get(activeId);
    content = generation ? (
      <GenerationView key={generation.generationId} generation={generation} />
    ) : (
      <p className="py-24 text-center text-[13px] text-ws-muted">Write a prompt to start this project.</p>
    );
  }

  return (
    <>
      <ErrorBanner />
      {content}
    </>
  );
}
