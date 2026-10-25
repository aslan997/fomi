"use client";

import { useEffect } from "react";
import { Heart, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useStudio } from "./StudioProvider";
import { ErrorRow, GenerationRow, PendingRow } from "./GenerationRow";

const FILTER_LABELS = { image: "Images", video: "Videos", saved: "Saved" };

function matchesFilter(generation, filter, favorites) {
  if (filter === "image" || filter === "video") return generation.type === filter;
  if (filter === "saved") return generation.images.some((img) => favorites[img.id]);
  return true;
}

/**
 * Desktop: chronological, newest at the bottom beside a pinned composer (as in
 * the mockup). Small screens stack the composer above the feed, so the order
 * flips to newest-first to keep fresh results next to the prompt. The order is
 * changed in the DOM, not with CSS, so focus order matches what's on screen.
 */
export function Feed() {
  const { generations, favorites, filter, setFilter, pending, error, jumpTarget } = useStudio();
  const desktop = useMediaQuery("(min-width: 1024px)", true);

  const visible = generations
    .filter((g) => matchesFilter(g, filter, favorites))
    .map((g) =>
      filter === "saved" ? { ...g, images: g.images.filter((img) => favorites[img.id]) } : g
    );

  // Desktop opens at the latest work, like the mockup. Reads the live media
  // query: during hydration `desktop` still holds the server value.
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    }
  }, []);

  const rows = visible.map((g) => (
    <GenerationRow
      key={g.generationId}
      generation={g}
      highlightKey={jumpTarget?.generationId === g.generationId ? jumpTarget.nonce : null}
    />
  ));
  const live = [pending && <PendingRow key="pending" request={pending} />, error && <ErrorRow key="error" error={error} />];
  const ordered = desktop ? [...rows, ...live] : [...live.toReversed(), ...rows.toReversed()];

  // Bring a new pending/error row into view.
  const activeRowId = pending ? "gen-pending" : error ? "gen-error" : null;
  useEffect(() => {
    if (activeRowId) document.getElementById(activeRowId)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeRowId]);

  // History strip jumps. The row itself replays its highlight via the jump nonce.
  useEffect(() => {
    if (jumpTarget) document.getElementById(`gen-${jumpTarget.generationId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [jumpTarget]);

  return (
    <section aria-label="Your creations" className="min-w-0 flex-1">
      {filter !== "all" && (
        <div className="mb-4 flex items-center justify-between rounded-full bg-st-pill py-1.5 pr-1.5 pl-4 text-[12px] text-st-ink-2">
          <span>
            Showing <strong className="font-semibold text-st-ink">{FILTER_LABELS[filter]}</strong> · {visible.length}{" "}
            {visible.length === 1 ? "generation" : "generations"}
          </span>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="flex items-center gap-1 rounded-full bg-st-surface px-2.5 py-1 text-[11px] font-medium text-st-ink hover:bg-st-raised"
          >
            <X size={12} aria-hidden="true" /> Show all
          </button>
        </div>
      )}

      {visible.length === 0 && !pending && !error ? (
        <div className="grid place-items-center rounded-[16px] border border-dashed border-st-panel-border px-6 py-20 text-center">
          {filter === "saved" ? (
            <>
              <Heart size={22} className="text-st-muted" aria-hidden="true" />
              <p className="mt-3 text-[14px] font-medium text-st-ink">Nothing saved yet</p>
              <p className="mt-1 max-w-xs text-[12px] text-st-muted">Use the heart on any result to keep it here.</p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-medium text-st-ink">No {FILTER_LABELS[filter]?.toLowerCase() ?? "creations"} yet</p>
              <p className="mt-1 max-w-xs text-[12px] text-st-muted">Write a prompt and press Generate to create your first one.</p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">{ordered}</div>
      )}
    </section>
  );
}
