"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { Headphones, Images, Moon, Sun } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { STARTING_CREDITS, useStudio } from "./StudioProvider";

const THEME_KEY = "fomi.studio.theme";

// Theme lives on <html data-studio-theme> (set before paint by an inline script),
// so we read it as an external store instead of duplicating it in React state.
function subscribeTheme(callback) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-studio-theme"] });
  return () => observer.disconnect();
}
const getTheme = () => document.documentElement.dataset.studioTheme ?? "light";

function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "light");
  const dark = theme === "dark";
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.studioTheme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="grid h-[30px] w-[30px] place-items-center rounded-full bg-st-pill text-st-faint transition-colors duration-150 hover:text-st-ink"
    >
      {dark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} fill="currentColor" strokeWidth={1.5} aria-hidden="true" />}
    </button>
  );
}

const pillClass =
  "flex h-[30px] items-center gap-1.5 rounded-[10px] bg-st-pill px-2.5 text-[11px] text-st-muted transition-colors duration-150 hover:text-st-ink";
const menuClass = "w-72 rounded-2xl bg-st-raised p-4 text-left text-st-ink shadow-st-pop";

function Kbd({ children }) {
  return <kbd className="rounded-md border border-st-panel-border bg-st-pill px-1.5 py-0.5 font-sans text-[11px] text-st-ink-2">{children}</kbd>;
}

function SupportMenu() {
  const { nextScenario, setNextScenario, resetDemo, announce } = useStudio();
  return (
    <Popover
      triggerClassName={pillClass}
      trigger={
        <>
          <Headphones size={15} className="text-st-ink" aria-hidden="true" />
          <span className="hidden sm:inline">Support</span>
        </>
      }
      triggerLabel="Support and demo controls"
      panelClassName={menuClass}
    >
      {(close) => (
        <div className="space-y-4 text-[12px]">
          <section>
            <h2 className="text-[13px] font-semibold">Keyboard shortcuts</h2>
            <dl className="mt-2 space-y-1.5 text-st-ink-2">
              <div className="flex justify-between gap-2">
                <dt>Generate</dt>
                <dd><Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd></dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Previous / next in preview</dt>
                <dd><Kbd>←</Kbd> <Kbd>→</Kbd></dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Close dialogs</dt>
                <dd><Kbd>Esc</Kbd></dd>
              </div>
            </dl>
          </section>
          <section className="border-t border-st-panel-border pt-3">
            <h2 className="text-[13px] font-semibold">Demo controls</h2>
            <p className="mt-1 text-st-muted">Generation is mocked: results come from a local image library. Choose how the next request behaves.</p>
            <fieldset className="mt-2 flex gap-1 rounded-full bg-st-pill p-1">
              <legend className="sr-only">Next generation outcome</legend>
              {["success", "error", "empty"].map((s) => (
                <label key={s} className="flex-1">
                  <input
                    type="radio"
                    name="scenario"
                    value={s}
                    checked={nextScenario === s}
                    onChange={() => setNextScenario(s)}
                    className="peer sr-only"
                  />
                  <span className="block cursor-pointer rounded-full py-1 text-center capitalize text-st-muted transition-colors peer-checked:bg-st-raised peer-checked:text-st-ink peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-(--focus-ring)">
                    {s === "error" ? "Fail" : s}
                  </span>
                </label>
              ))}
            </fieldset>
            <button
              type="button"
              onClick={() => {
                resetDemo();
                announce("Demo data reset.");
                close();
              }}
              className="mt-3 text-[12px] font-medium text-st-accent-strong underline-offset-2 hover:underline"
            >
              Reset demo data
            </button>
          </section>
        </div>
      )}
    </Popover>
  );
}

function AccountMenu() {
  const { credits } = useStudio();
  return (
    <Popover
      triggerClassName="block h-[30px] w-[30px] overflow-hidden rounded-full ring-offset-2 ring-offset-st-page transition-shadow hover:ring-2 hover:ring-st-segment"
      triggerLabel="Account"
      trigger={
        <Image src="/images/studio/history-07.webp" alt="" width={30} height={30} className="h-full w-full object-cover object-top" />
      }
      panelClassName={menuClass}
    >
      <div className="text-[12px]">
        <p className="text-[13px] font-semibold">Demo Creator</p>
        <p className="text-st-muted">Pro plan · mock account</p>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-st-ink-2">Credits</span>
          <span className="font-semibold tabular-nums">
            {credits} <span className="font-normal text-st-muted">/ {STARTING_CREDITS}</span>
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-st-track" aria-hidden="true">
          <div className="h-full rounded-full bg-st-accent transition-[width] duration-300" style={{ width: `${(credits / STARTING_CREDITS) * 100}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-st-muted">1 credit per image, 4 per video. Simulated for this demo.</p>
      </div>
    </Popover>
  );
}

export function HeaderActions() {
  const { setGalleryOpen } = useStudio();
  return (
    <div className="flex items-center justify-end gap-2 sm:gap-3">
      <button type="button" onClick={() => setGalleryOpen(true)} className={pillClass} aria-label="Open gallery">
        <Images size={15} className="text-st-ink" aria-hidden="true" />
        <span className="hidden sm:inline">Gallery</span>
      </button>
      <SupportMenu />
      <ThemeToggle />
      <AccountMenu />
    </div>
  );
}
