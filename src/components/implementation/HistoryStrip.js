"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useStudio } from "./StudioProvider";

function excerpt(text, words = 8) {
  const parts = text.split(/\s+/);
  return parts.length > words ? `${parts.slice(0, words).join(" ")}…` : text;
}

/** Newest-first index of every generation; selecting one scrolls the feed to it. */
export function HistoryStrip() {
  const { generations, pending, jumpTo, setGalleryOpen } = useStudio();
  const items = generations.filter((g) => g.images.length > 0).toReversed();

  return (
    <section
      aria-label="Generation history"
      className="flex items-center gap-3 rounded-[14px] border border-st-strip-border bg-st-strip p-2 shadow-st-strip sm:gap-[14px]"
    >
      <button
        type="button"
        onClick={() => setGalleryOpen(true)}
        className="grid h-[60px] w-[60px] shrink-0 place-content-center rounded-lg bg-st-surface text-center transition-transform duration-150 hover:scale-[1.03] active:scale-95 sm:h-[72px] sm:w-[72px]"
      >
        <span className="text-[13px] font-semibold leading-tight text-st-ink-2 sm:text-[14px]">History</span>
        <span className="text-[9px] leading-tight text-st-muted">View All</span>
      </button>

      <span aria-hidden="true" className="hidden h-7 w-1.5 shrink-0 rounded-full bg-st-surface sm:block" />

      <ul className="no-scrollbar fade-x-end flex min-w-0 flex-1 gap-3 overflow-x-auto py-0.5 pr-24 sm:gap-4">
        {pending && (
          <li className="shrink-0">
            <div className="skeleton h-[60px] w-[60px] rounded-[7px] sm:h-[72px] sm:w-[72px]" aria-label="Generation in progress" role="img" />
          </li>
        )}
        {items.map((g) => {
          const cover = g.images[0];
          return (
            <li key={g.generationId} className="shrink-0">
              <button
                type="button"
                onClick={() => jumpTo(g.generationId)}
                aria-label={`Show generation: ${excerpt(g.prompt)}`}
                className="group relative block h-[60px] w-[60px] overflow-hidden rounded-[7px] sm:h-[72px] sm:w-[72px]"
              >
                <Image
                  src={cover.url}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-cover transition-transform duration-200 group-hover:scale-110"
                />
                {g.type === "video" && (
                  <Play size={14} fill="currentColor" className="absolute bottom-1 left-1 text-white drop-shadow" aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
