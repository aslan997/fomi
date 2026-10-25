"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";
import { Heart, Play, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { useStudio } from "./StudioProvider";
import { useAllEntries } from "./PreviewDialog";

const TABS = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "saved", label: "Saved" },
];

export function GalleryDialog() {
  const { galleryOpen, setGalleryOpen, openPreview, favorites } = useStudio();
  const [tab, setTab] = useState("all");
  const entries = useAllEntries().toReversed();
  const shown = entries.filter(({ image, generation }) =>
    tab === "all" ? true : tab === "saved" ? favorites[image.id] : generation.type === tab
  );

  return (
    <Dialog
      open={galleryOpen}
      onClose={() => setGalleryOpen(false)}
      labelledBy="gallery-title"
      className="studio m-auto h-[min(90dvh,900px)] w-[min(96vw,1100px)] overflow-hidden rounded-[20px] bg-st-page p-0 font-poppins text-st-ink"
    >
      <div className="flex h-full flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-st-panel-border px-5 py-4">
          <h2 id="gallery-title" className="text-[16px] font-semibold">
            Gallery
          </h2>
          <span className="text-[12px] text-st-muted tabular-nums">{shown.length} items</span>
          <div role="group" aria-label="Filter gallery" className="ml-auto flex gap-1 rounded-full bg-st-pill p-1 sm:order-none">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={tab === t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  "rounded-full px-3 py-1 text-[12px] transition-colors duration-150",
                  tab === t.id ? "bg-st-raised font-medium text-st-ink shadow-sm" : "text-st-muted hover:text-st-ink"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setGalleryOpen(false)}
            aria-label="Close gallery"
            className="grid h-8 w-8 place-items-center rounded-full bg-st-pill text-st-ink-2 hover:text-st-ink"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        {shown.length === 0 ? (
          <p className="grid flex-1 place-items-center p-10 text-center text-[13px] text-st-muted">Nothing here yet.</p>
        ) : (
          <ul className="grid flex-1 auto-rows-max grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-4 lg:grid-cols-6">
            {shown.map(({ image, generation }) => (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => openPreview(image.id)}
                  aria-label={`Open ${image.alt}`}
                  className="group relative block aspect-[2/3] w-full overflow-hidden rounded-[8px] bg-st-card"
                >
                  <Image src={image.url} alt="" fill sizes="(min-width: 1024px) 170px, 30vw" className="object-cover transition-transform duration-200 group-hover:scale-105" />
                  {generation.type === "video" && (
                    <Play size={14} fill="currentColor" className="absolute bottom-2 left-2 text-white drop-shadow" aria-hidden="true" />
                  )}
                  {favorites[image.id] && (
                    <Heart size={14} fill="currentColor" className="absolute top-2 right-2 text-[#ff8a73] drop-shadow" aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
