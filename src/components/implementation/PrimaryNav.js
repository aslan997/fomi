"use client";

import clsx from "clsx";
import { Folder, House, Image as ImageIcon, Video, WandSparkles } from "lucide-react";
import { useStudio } from "./StudioProvider";

// Home/Image/Video/Saved filter the feed (Image/Video also switch the composer
// mode). Editing tools are outside the assessment scope, so that item is
// present for fidelity but explicitly unavailable.
const ITEMS = [
  { id: "all", label: "Home", icon: House, filled: true },
  { id: "image", label: "Images", icon: ImageIcon },
  { id: "video", label: "Videos", icon: Video, filled: true },
  { id: "edit", label: "Edit tools — coming soon", icon: WandSparkles, unavailable: true },
  { id: "saved", label: "Saved", icon: Folder, filled: true },
];

// Item width comes from --nav-item: 82px matches the mockup's icon spacing at
// desktop; tablets get a tighter 64px so the header doesn't crowd.
const INDICATOR_WIDTH = 58;

export function PrimaryNav({ variant = "header" }) {
  const { filter, setFilter, setMode, announce } = useStudio();
  const activeIndex = Math.max(0, ITEMS.findIndex((i) => i.id === filter));
  const isBar = variant === "bar";

  const select = (item) => {
    if (item.unavailable) {
      announce("Editing tools aren't part of this demo yet.");
      return;
    }
    setFilter(item.id);
    if (item.id === "image" || item.id === "video") setMode(item.id);
  };

  return (
    <nav
      aria-label="Library views"
      className={clsx(isBar ? "w-full" : "w-[calc(var(--nav-item)*5)] [--nav-item:64px] lg:[--nav-item:82px]")}
    >
      {/* Indicator track (header variant sits above the icons, bar variant on top edge). */}
      <div
        aria-hidden="true"
        className={clsx("relative h-[7px] rounded-full bg-st-track", isBar && "mx-auto h-[4px] w-full max-w-[410px]")}
      >
        <span
          className="absolute top-0 h-full rounded-full bg-st-indicator transition-transform duration-250 ease-out"
          style={
            isBar
              ? { width: `${100 / ITEMS.length}%`, transform: `translateX(${activeIndex * 100}%)` }
              : {
                  width: INDICATOR_WIDTH,
                  transform: `translateX(calc(var(--nav-item) * ${activeIndex} + (var(--nav-item) - ${INDICATOR_WIDTH}px) / 2))`,
                }
          }
        />
      </div>
      <ul className={clsx("flex", isBar ? "mx-auto max-w-[410px] justify-between" : "mt-[10px]")}>
        {ITEMS.map((item, index) => {
          const Icon = item.icon;
          const active = index === activeIndex;
          return (
            <li key={item.id} className={clsx(isBar ? "flex-1" : "w-(--nav-item)", "flex justify-center")}>
              <button
                type="button"
                onClick={() => select(item)}
                aria-pressed={item.unavailable ? undefined : active}
                aria-disabled={item.unavailable || undefined}
                aria-label={item.label}
                className={clsx(
                  "group relative grid h-11 w-11 place-items-center rounded-xl text-st-ink transition-colors duration-150",
                  "hover:bg-st-pill",
                  item.unavailable && "cursor-not-allowed"
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={2.25}
                  fill={item.filled ? "currentColor" : "none"}
                  className={clsx("transition-transform duration-150 group-active:scale-90", !active && !isBar && "opacity-90")}
                  aria-hidden="true"
                />
                <span
                  role="presentation"
                  className={clsx(
                    "pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md bg-st-ink px-2 py-1 text-[11px] font-medium text-st-page opacity-0 transition-opacity duration-150",
                    "group-hover:opacity-100 group-focus-visible:opacity-100",
                    isBar ? "bottom-full mb-2" : "top-full mt-1"
                  )}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
