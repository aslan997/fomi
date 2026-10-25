"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Download, Heart, Pause, Play, RotateCcw, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { assetFilename, downloadAsset } from "@/lib/download";
import { STYLES, findModel } from "@/lib/generation-options";
import { useStudio } from "./StudioProvider";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

const iconBtn =
  "grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 disabled:opacity-30";

/** Short silent loop with a single play/pause control (mock clips have no audio or timeline worth scrubbing). */
function LoopingVideo({ image }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(true);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  return (
    <>
      <video
        ref={ref}
        src={image.videoUrl}
        poster={image.url}
        autoPlay
        muted
        loop
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label={image.alt}
        className="h-full w-full object-contain"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause video" : "Play video"}
        className={clsx(iconBtn, "absolute top-3 left-3")}
      >
        {playing ? <Pause size={16} fill="currentColor" aria-hidden="true" /> : <Play size={16} fill="currentColor" aria-hidden="true" />}
      </button>
    </>
  );
}

function PreviewBody({ entries, index, onNavigate, onClose }) {
  const { favorites, toggleFavorite, reuse, announce } = useStudio();
  const [busy, setBusy] = useState(false);
  const { image, generation } = entries[index];
  const favorite = Boolean(favorites[image.id]);
  const model = findModel(generation.type, generation.model);
  const style = STYLES.find((s) => s.id === generation.style);
  const isVideo = Boolean(image.videoUrl);

  const download = async () => {
    setBusy(true);
    try {
      await downloadAsset(image.videoUrl ?? image.url, assetFilename(image));
      announce("Download started.");
    } catch {
      announce("Download failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex h-full flex-col lg:flex-row"
      onKeyDown={(e) => {
        if (e.target.closest("input, textarea, select, video")) return;
        if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
        if (e.key === "ArrowRight" && index < entries.length - 1) onNavigate(index + 1);
      }}
    >
      <div className="relative min-h-0 flex-1 bg-black/90">
        {isVideo ? (
          <LoopingVideo key={image.id} image={image} />
        ) : (
          <Image key={image.id} src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 70vw, 100vw" className="animate-reveal object-contain" />
        )}
        <div className="absolute inset-y-0 left-3 flex items-center">
          <button type="button" className={iconBtn} onClick={() => onNavigate(index - 1)} disabled={index === 0} aria-label="Previous">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-3 flex items-center">
          <button type="button" className={iconBtn} onClick={() => onNavigate(index + 1)} disabled={index === entries.length - 1} aria-label="Next">
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/80 tabular-nums">
          {index + 1} / {entries.length}
          {isVideo && " · mock preview clip"}
        </p>
      </div>

      <aside className="flex max-h-[46%] w-full shrink-0 flex-col overflow-y-auto bg-st-raised p-5 pb-5 text-st-ink lg:max-h-none lg:w-[320px]">
        <div className="flex items-start justify-between gap-3">
          <h2 id="preview-title" className="text-[15px] font-semibold">
            {isVideo ? "Video" : "Image"} details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="grid h-8 w-8 place-items-center rounded-full bg-st-pill text-st-ink-2 hover:text-st-ink"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-st-ink-2">{generation.prompt}</p>
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          {[
            ["Model", model?.label ?? generation.model],
            ["Ratio", generation.aspectRatio],
            ["Style", style?.label ?? "None"],
            ["Seed", generation.seed],
            ["Size", `${image.width}×${image.height}`],
            ["Created", dateFormat.format(new Date(generation.createdAt))],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-st-muted">{k}</dt>
              <dd className="font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        {/* Sticky so actions stay reachable when the details scroll on small screens. */}
        <div className="sticky -bottom-5 -mx-5 mt-auto grid grid-cols-2 gap-2 bg-st-raised px-5 pt-4 pb-5 lg:static lg:mx-0 lg:px-0 lg:pb-0">
          <button
            type="button"
            onClick={() => toggleFavorite(image.id)}
            aria-pressed={favorite}
            className={clsx(
              "flex items-center justify-center gap-1.5 rounded-full border py-2 text-[12px] font-medium transition-colors",
              favorite ? "border-st-accent bg-st-segment" : "border-st-panel-border hover:bg-st-pill"
            )}
          >
            <Heart size={14} fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
            {favorite ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={download}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-full border border-st-panel-border py-2 text-[12px] font-medium transition-colors hover:bg-st-pill disabled:opacity-60"
          >
            <Download size={14} aria-hidden="true" />
            Download
          </button>
          <button
            type="button"
            onClick={() => {
              reuse(generation);
              onClose();
              requestAnimationFrame(() => document.querySelector("[data-studio-prompt]")?.focus());
            }}
            className="col-span-2 flex items-center justify-center gap-1.5 rounded-full bg-st-accent py-2 text-[12px] font-medium text-st-cta-ink transition-colors hover:bg-st-accent-strong"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Reuse prompt &amp; settings
          </button>
        </div>
      </aside>
    </div>
  );
}

/** Lists every result in feed order so ←/→ moves through all of them. */
export function useAllEntries() {
  const { generations } = useStudio();
  return generations.flatMap((generation) => generation.images.map((image) => ({ image, generation })));
}

export function PreviewDialog() {
  const { previewImageId, openPreview, closePreview } = useStudio();
  const entries = useAllEntries();
  const index = entries.findIndex((e) => e.image.id === previewImageId);
  const open = index !== -1;

  return (
    <Dialog
      open={open}
      onClose={closePreview}
      labelledBy="preview-title"
      className="studio m-auto h-[min(92dvh,860px)] w-[min(96vw,1280px)] overflow-hidden rounded-[20px] p-0 font-poppins"
    >
      {open && <PreviewBody entries={entries} index={index} onNavigate={(i) => openPreview(entries[i].image.id)} onClose={closePreview} />}
    </Dialog>
  );
}
