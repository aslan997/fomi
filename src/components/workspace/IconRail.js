"use client";

import Link from "next/link";
import clsx from "clsx";
import { FolderKanban, LayoutGrid, Settings2, Star } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { useWorkspace } from "./WorkspaceProvider";
import { SettingsPanel } from "./SettingsPanel";

const itemClass = (active) =>
  clsx(
    "group relative grid h-10 w-10 place-items-center rounded-[10px] transition-colors duration-150",
    active ? "bg-ws-overlay text-ws-text" : "text-ws-muted hover:bg-ws-raised hover:text-ws-text"
  );

function Tip({ children }) {
  return (
    <span
      role="presentation"
      className="pointer-events-none absolute left-full z-40 ml-2 rounded-md bg-ws-overlay px-2 py-1 text-[11px] font-medium whitespace-nowrap text-ws-text opacity-0 shadow-ws-pop transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  );
}

function ProjectsPanel() {
  const { project, generations } = useWorkspace();
  return (
    <div className="w-64 text-[12px]">
      <p className="text-[11px] font-medium tracking-wide text-ws-muted uppercase">Projects</p>
      <div className="mt-2 rounded-lg border border-ws-line-strong bg-ws-raised p-3">
        <p className="font-medium text-ws-text">{project?.name}</p>
        <p className="text-ws-text-2">
          {project?.client} · {generations.length} generations
        </p>
      </div>
      <p className="mt-2 text-[11px] text-ws-muted">This demo includes a single project.</p>
    </div>
  );
}

const popPanel = "rounded-xl border border-ws-line bg-ws-surface p-3 shadow-ws-pop";

/** Global navigation, kept visually quiet so the canvas stays dominant. */
export function IconRail() {
  const { view, setView } = useWorkspace();
  return (
    <nav aria-label="Workspace" className="flex h-full flex-col items-center gap-1 border-r border-ws-line bg-ws-surface py-3">
      <Link href="/" aria-label="Fomi — back to assessment overview" className="mb-3 grid h-9 w-9 place-items-center rounded-[10px] bg-ws-text text-ws-bg">
        <svg width="14" height="18" viewBox="0 0 22 28" aria-hidden="true" fill="currentColor">
          <path d="M2.2 1.6 20.8.4l-.9 6.1-11 .5-.2 4.6 8.9-.4-.9 5.6-8.2.3.3 9.6-6.6 1.1L2 15.1.6 14.6 2 10.3z" />
        </svg>
      </Link>
      <button type="button" className={itemClass(view === "canvas")} aria-current={view === "canvas" ? "page" : undefined} onClick={() => setView("canvas")} aria-label="Workspace">
        <LayoutGrid size={18} aria-hidden="true" />
        <Tip>Workspace</Tip>
      </button>
      <Popover
        triggerClassName={itemClass(false)}
        triggerLabel="Projects"
        side="right"
        align="start"
        trigger={
          <>
            <FolderKanban size={18} aria-hidden="true" />
            <Tip>Projects</Tip>
          </>
        }
        panelClassName={popPanel}
      >
        <ProjectsPanel />
      </Popover>
      <button type="button" className={itemClass(view === "kept")} aria-current={view === "kept" ? "page" : undefined} onClick={() => setView("kept")} aria-label="Kept assets">
        <Star size={18} aria-hidden="true" />
        <Tip>Kept assets</Tip>
      </button>
      <div className="mt-auto">
        <Popover
          triggerClassName={itemClass(false)}
          triggerLabel="Settings"
          side="right"
          align="end"
          trigger={
            <>
              <Settings2 size={18} aria-hidden="true" />
              <Tip>Settings</Tip>
            </>
          }
          panelClassName={popPanel}
        >
          {(close) => <SettingsPanel close={close} />}
        </Popover>
      </div>
    </nav>
  );
}
