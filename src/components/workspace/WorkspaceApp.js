"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown, GitBranch, LayoutGrid, Menu, Star, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Popover } from "@/components/ui/Popover";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { WorkspaceProvider, useWorkspace } from "./WorkspaceProvider";
import { IconRail } from "./IconRail";
import { Composer } from "./Composer";
import { Canvas } from "./Canvas";
import { BranchTree } from "./BranchTree";
import { SelectionTray } from "./SelectionTray";
import { CompareDialog } from "./CompareDialog";
import { PreviewDialog } from "./PreviewDialog";
import { SettingsPanel } from "./SettingsPanel";

const isTyping = (el) => el?.closest?.("input, textarea, select, [contenteditable]");

/** Workspace-wide shortcuts. Ignored while typing or when a dialog is open. */
function useShortcuts() {
  const { rows, activeId, activate, index, selection, setCompareOpen, clearSelection } = useWorkspace();
  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(e.target) || document.querySelector("dialog[open]")) return;
      const order = rows.map((r) => r.generation.generationId);
      const at = order.indexOf(activeId);
      if (e.key === "]" && at < order.length - 1) activate(order[at + 1]);
      else if (e.key === "[" && at > 0) activate(order[at - 1]);
      else if (e.altKey && e.key === "ArrowUp") {
        const parent = index.byId.get(activeId)?.parentGenerationId;
        if (parent) {
          e.preventDefault();
          activate(parent);
        }
      } else if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && selection.length >= 2) setCompareOpen(true);
      else if (e.key === "Escape" && selection.length) clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, activeId, activate, index, selection, setCompareOpen, clearSelection]);
}

function MobileMenu() {
  const { view, setView } = useWorkspace();
  const item = (active) =>
    clsx("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px]", active ? "bg-ws-overlay text-ws-text" : "text-ws-text-2 hover:bg-ws-raised");
  return (
    <Popover
      align="start"
      triggerLabel="Menu"
      triggerClassName="grid h-9 w-9 place-items-center rounded-lg border border-ws-line text-ws-text-2 hover:text-ws-text"
      trigger={<Menu size={16} aria-hidden="true" />}
      panelClassName="rounded-xl border border-ws-line bg-ws-surface p-2 shadow-ws-pop"
    >
      {(close) => (
        <div className="w-72">
          <Link href="/" className={item(false)}>
            ← Assessment overview
          </Link>
          <button
            type="button"
            className={item(view === "canvas")}
            onClick={() => {
              setView("canvas");
              close();
            }}
          >
            <LayoutGrid size={15} aria-hidden="true" /> Workspace
          </button>
          <button
            type="button"
            className={item(view === "kept")}
            onClick={() => {
              setView("kept");
              close();
            }}
          >
            <Star size={15} aria-hidden="true" /> Kept assets
          </button>
          <div className="mt-2 border-t border-ws-line p-2 pt-3">
            <SettingsPanel close={close} />
          </div>
        </div>
      )}
    </Popover>
  );
}

function TopBar({ onOpenBranches }) {
  const { project, generations } = useWorkspace();
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ws-line px-4 lg:px-6">
      <div className="lg:hidden">
        <MobileMenu />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-ws-text">{project?.name ?? "Loading project…"}</p>
        <p className="truncate text-[11px] text-ws-muted">{project ? `${project.client} · ${generations.length} runs` : " "}</p>
      </div>
      <button
        type="button"
        onClick={onOpenBranches}
        className="ml-auto flex h-9 items-center gap-1.5 rounded-lg border border-ws-line px-3 text-[12px] text-ws-text-2 hover:bg-ws-raised hover:text-ws-text xl:hidden"
      >
        <GitBranch size={14} aria-hidden="true" /> Branches
      </button>
    </header>
  );
}

function Shell() {
  const { branchFromId, activeId } = useWorkspace();
  const [branchesOpen, setBranchesOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const desktop = useMediaQuery("(min-width: 1024px)", true);
  const wide = useMediaQuery("(min-width: 1280px)", true);
  useShortcuts();
  const showComposer = composerOpen || Boolean(branchFromId);

  // On small screens, bring the canvas into view when the user opens a
  // different generation (not on the initial load).
  const previousActive = useRef(null);
  useEffect(() => {
    const switched = previousActive.current !== null && previousActive.current !== activeId;
    previousActive.current = activeId;
    if (switched && window.matchMedia("(max-width: 1023px)").matches) {
      document.getElementById("ws-canvas")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [activeId]);

  return (
    <div data-portal-root className="ws min-h-dvh font-sans lg:grid lg:h-dvh lg:grid-cols-[56px_300px_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[56px_320px_minmax(0,1fr)_320px]">
      <div className="hidden lg:block">
        <IconRail />
      </div>

      {/* One composer instance at a time: side panel on desktop, collapsible on small screens. */}
      <aside aria-label="Composer" className="ws-scroll hidden border-r border-ws-line bg-ws-surface lg:block lg:overflow-y-auto">
        {desktop && <Composer />}
      </aside>

      <main className="flex min-w-0 flex-col lg:min-h-0">
        <TopBar onOpenBranches={() => setBranchesOpen(true)} />

        {/* Small screens: composer collapses above the canvas. */}
        <div className="border-b border-ws-line bg-ws-surface lg:hidden">
          <button
            type="button"
            aria-expanded={showComposer}
            aria-controls="ws-mobile-composer"
            onClick={() => setComposerOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-medium"
          >
            {branchFromId ? "Remix" : "New direction"}
            <ChevronDown size={16} className={clsx("transition-transform duration-200", showComposer && "rotate-180")} aria-hidden="true" />
          </button>
          <div id="ws-mobile-composer" hidden={!showComposer} className="-mt-2">
            {showComposer && !desktop && <Composer />}
          </div>
        </div>

        <div id="ws-canvas" className="ws-scroll relative min-h-0 flex-1 scroll-mt-0 px-4 py-6 lg:overflow-y-auto lg:px-8">
          <Canvas />
          <SelectionTray />
        </div>
      </main>

      <aside aria-label="Branch history" className="hidden border-l border-ws-line bg-ws-surface xl:block xl:min-h-0">
        {wide && <BranchTree />}
      </aside>

      <Dialog
        open={branchesOpen && !wide}
        onClose={() => setBranchesOpen(false)}
        label="Branch history"
        variant="ws-dialog ws-drawer"
        className="ws mt-0 mr-0 mb-0 ml-auto h-dvh w-[min(92vw,360px)] border-l border-ws-line bg-ws-surface p-0 font-sans"
      >
        <div className="flex h-full flex-col">
          <div className="flex justify-end px-2 pt-2">
            <button type="button" onClick={() => setBranchesOpen(false)} aria-label="Close branches" className="grid h-8 w-8 place-items-center rounded-lg text-ws-text-2 hover:bg-ws-raised">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <BranchTree onNavigate={() => setBranchesOpen(false)} />
          </div>
        </div>
      </Dialog>

      <CompareDialog />
      <PreviewDialog />
    </div>
  );
}

export function WorkspaceApp() {
  return (
    <WorkspaceProvider>
      <Shell />
    </WorkspaceProvider>
  );
}
