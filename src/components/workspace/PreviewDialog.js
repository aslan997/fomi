"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Download, Star, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { assetFilename, downloadAsset } from "@/lib/download";
import { describeLook } from "@/lib/workspace/format";
import { WS_MODELS } from "@/lib/workspace/options";
import { BranchMenuContent } from "./BranchMenu";
import { useWorkspace } from "./WorkspaceProvider";

const navBtn =
  "grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70 disabled:opacity-30";

function PreviewBody({ imageId, onClose }) {
  const { index, label, kept, toggleKeep, setPreviewImageId, announce } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const entry = index.imageIndex.get(imageId);
  if (!entry) return null;
  const { image, generation, index: i } = entry;
  const siblings = generation.images;
  const name = label(generation.generationId, i);
  const isKept = Boolean(kept[image.id]);
  const go = (to) => siblings[to] && setPreviewImageId(siblings[to].id);

  const download = async () => {
    setBusy(true);
    try {
      await downloadAsset(image.url, assetFilename(image));
      announce(`Downloading ${name}.`);
    } catch {
      announce("Download failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex h-full flex-col lg:flex-row"
      onKeyDown={(e) => {
        if (e.target.closest("input, textarea")) return;
        if (e.key === "ArrowLeft") go(i - 1);
        if (e.key === "ArrowRight") go(i + 1);
      }}
    >
      <div className="relative min-h-0 flex-1 bg-black">
        <Image key={image.id} src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 70vw, 100vw" className="animate-reveal object-contain" />
        <div className="absolute inset-y-0 left-3 flex items-center">
          <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous image" className={navBtn}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-3 flex items-center">
          <button type="button" onClick={() => go(i + 1)} disabled={i === siblings.length - 1} aria-label="Next image" className={navBtn}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
      <aside className="ws-scroll flex max-h-[50%] w-full shrink-0 flex-col gap-4 overflow-y-auto border-t border-ws-line bg-ws-surface p-5 lg:max-h-none lg:w-[340px] lg:border-t-0 lg:border-l">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 id="ws-preview-title" className="font-mono text-[16px]">
              {name}
            </h2>
            <p className="text-[12px] text-ws-text-2">{describeLook(image.look)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close preview" className="grid h-8 w-8 place-items-center rounded-lg text-ws-text-2 hover:bg-ws-raised hover:text-ws-text">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => toggleKeep(image.id)}
            aria-pressed={isKept}
            className={clsx(
              "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[12px] font-medium",
              isKept ? "border-ws-accent/50 bg-ws-accent-soft text-ws-accent" : "border-ws-line text-ws-text hover:bg-ws-raised"
            )}
          >
            <Star size={14} fill={isKept ? "currentColor" : "none"} aria-hidden="true" />
            {isKept ? "Kept" : "Keep"}
          </button>
          <button
            type="button"
            onClick={download}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-ws-line py-2 text-[12px] font-medium text-ws-text hover:bg-ws-raised disabled:opacity-60"
          >
            <Download size={14} aria-hidden="true" /> Download
          </button>
        </div>
        <div className="rounded-xl border border-ws-line bg-ws-bg p-3">
          <BranchMenuContent imageId={image.id} close={onClose} />
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          {[
            ["Model", WS_MODELS.find((m) => m.id === generation.model)?.label ?? generation.model],
            ["Ratio", generation.aspectRatio],
            ["Seed", generation.seed],
            ["Size", `${image.width}×${image.height}`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-ws-muted">{k}</dt>
              <dd className="font-mono text-ws-text">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[12px] leading-relaxed text-ws-text-2">{generation.prompt}</p>
      </aside>
    </div>
  );
}

export function PreviewDialog() {
  const { previewImageId, setPreviewImageId } = useWorkspace();
  const close = () => setPreviewImageId(null);
  return (
    <Dialog
      open={Boolean(previewImageId)}
      onClose={close}
      labelledBy="ws-preview-title"
      variant="ws-dialog"
      className="ws m-auto h-[min(94dvh,960px)] w-[min(97vw,1400px)] overflow-hidden rounded-2xl border border-ws-line p-0 font-sans"
    >
      {previewImageId && <PreviewBody imageId={previewImageId} onClose={close} />}
    </Dialog>
  );
}
