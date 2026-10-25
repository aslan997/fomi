"use client";

import Link from "next/link";
import { StudioProvider } from "./StudioProvider";
import { PrimaryNav } from "./PrimaryNav";
import { HeaderActions } from "./HeaderActions";
import { HistoryStrip } from "./HistoryStrip";
import { Composer } from "./Composer";
import { Feed } from "./Feed";
import { PreviewDialog } from "./PreviewDialog";
import { GalleryDialog } from "./GalleryDialog";

function Logo() {
  return (
    <Link href="/" aria-label="Fomi — back to assessment overview" className="inline-flex rounded-md text-st-ink">
      <svg width="22" height="28" viewBox="0 0 22 28" aria-hidden="true" fill="currentColor">
        <path d="M2.2 1.6 20.8.4l-.9 6.1-11 .5-.2 4.6 8.9-.4-.9 5.6-8.2.3.3 9.6-6.6 1.1L2 15.1.6 14.6 2 10.3z" />
      </svg>
    </Link>
  );
}

// Horizontal gutters taken from the mockup (52px left, 40px right at 1440px).
const gutter = "px-4 sm:px-6 lg:pr-10 lg:pl-[52px]";

export function StudioApp() {
  return (
    <StudioProvider>
      <div data-portal-root className="studio min-h-dvh pb-24 font-poppins sm:pb-10">
        {/* Header + history stay pinned on desktop; the feed scrolls beneath them as in the mockup. */}
        <div className="bg-st-page lg:sticky lg:top-0 lg:z-20">
          <header className={`grid h-16 grid-cols-[auto_1fr] items-center gap-3 sm:h-[92px] sm:grid-cols-[1fr_auto_1fr] ${gutter}`}>
            <Logo />
            <div className="hidden pt-3 sm:block">
              <PrimaryNav />
            </div>
            <HeaderActions />
          </header>
          <div className={`pb-3 ${gutter} lg:pr-[46px]`}>
            <HistoryStrip />
          </div>
        </div>

        <div className={`flex flex-col gap-6 pt-1 lg:flex-row lg:items-start ${gutter}`}>
          <Composer className="lg:sticky lg:top-[200px] lg:max-h-[calc(100dvh-216px)] lg:min-h-[min(484px,calc(100dvh-216px))] lg:w-[272px] lg:shrink-0 lg:overflow-y-auto" />
          <Feed />
        </div>

        {/* Mobile: primary nav becomes a bottom tab bar. */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-st-panel-border bg-st-page/95 px-4 pb-[max(env(safe-area-inset-bottom),6px)] backdrop-blur sm:hidden">
          <PrimaryNav variant="bar" />
        </div>

        <PreviewDialog />
        <GalleryDialog />
      </div>
    </StudioProvider>
  );
}
