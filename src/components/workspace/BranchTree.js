"use client";

import Image from "next/image";
import { useRef } from "react";
import clsx from "clsx";
import { ChevronRight, GitBranch, LoaderCircle, Star } from "lucide-react";
import { findIntent } from "@/lib/workspace/options";
import { descendantCount, lineage } from "@/lib/workspace/tree";
import { PENDING_ID, useWorkspace } from "./WorkspaceProvider";

const INDENT = 16;

/** Connector lines for one row: continuing guides for ancestors + an elbow into this node. */
function Guides({ guides, depth, isLast, onPath }) {
  if (depth === 0) return null;
  return (
    <span aria-hidden="true" className="relative shrink-0 self-stretch" style={{ width: depth * INDENT }}>
      {guides.slice(1).map((continues, i) =>
        continues ? <span key={i} className="absolute top-0 bottom-0 w-px bg-ws-line-strong" style={{ left: (i + 0.5) * INDENT }} /> : null
      )}
      <span
        className={clsx("absolute top-0 w-px", isLast ? "h-1/2" : "bottom-0", onPath ? "bg-ws-accent/70" : "bg-ws-line-strong")}
        style={{ left: (depth - 0.5) * INDENT }}
      />
      <span
        className={clsx("absolute top-1/2 h-px", onPath ? "bg-ws-accent/70" : "bg-ws-line-strong")}
        style={{ left: (depth - 0.5) * INDENT, width: INDENT / 2 + 2 }}
      />
    </span>
  );
}

function PendingRow({ depth }) {
  return (
    <li role="none" className="flex items-center gap-2 px-2 py-1.5" style={{ paddingLeft: 8 + depth * INDENT }}>
      <LoaderCircle size={13} className="animate-spin text-ws-accent" aria-hidden="true" />
      <span className="text-[12px] text-ws-text-2">Generating…</span>
      <span className="ml-auto flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="skeleton-ws h-6 w-5 rounded-sm" />
        ))}
      </span>
    </li>
  );
}

/**
 * The project's iterations as a compact tree (ARIA tree pattern):
 * ↑/↓ move, → expands or enters children, ← collapses or goes to parent,
 * Enter/Space opens. Only the focused row is in the tab order.
 */
export function BranchTree({ onNavigate }) {
  const { rows, index, label, activeId, activate, kept, collapsed, toggleCollapsed, pending, generations, status } = useWorkspace();
  const listRef = useRef(null);
  const activePath = new Set(activeId && activeId !== PENDING_ID ? lineage(index, activeId) : []);
  const pendingParent = pending?.request.parentGenerationId ?? null;
  const focusTarget = rows.some((r) => r.generation.generationId === activeId) ? activeId : rows[0]?.generation.generationId;

  const focusRow = (id) => listRef.current?.querySelector(`[data-gen="${id}"]`)?.focus();
  const open = (id) => {
    activate(id);
    onNavigate?.();
  };

  const onKeyDown = (e, row, i) => {
    const id = row.generation.generationId;
    const keyActions = {
      ArrowDown: () => rows[i + 1] && focusRow(rows[i + 1].generation.generationId),
      ArrowUp: () => rows[i - 1] && focusRow(rows[i - 1].generation.generationId),
      Home: () => focusRow(rows[0].generation.generationId),
      End: () => focusRow(rows.at(-1).generation.generationId),
      ArrowRight: () => {
        if (row.childCount && collapsed[id]) toggleCollapsed(id);
        else if (row.childCount) focusRow(rows[i + 1].generation.generationId);
      },
      ArrowLeft: () => {
        if (row.childCount && !collapsed[id]) toggleCollapsed(id);
        else if (row.generation.parentGenerationId) focusRow(row.generation.parentGenerationId);
      },
      Enter: () => open(id),
      " ": () => open(id),
    };
    if (keyActions[e.key]) {
      e.preventDefault();
      keyActions[e.key]();
    }
  };

  const keptIn = (g) => g.images.filter((img) => kept[img.id]).length;

  return (
    <section aria-labelledby="branches-title" className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 id="branches-title" className="flex items-center gap-1.5 text-[13px] font-medium">
          <GitBranch size={14} className="text-ws-text-2" aria-hidden="true" /> Branches
        </h2>
        <span className="font-mono text-[11px] text-ws-muted">{generations.length} runs</span>
      </header>

      {status !== "ready" ? (
        <div className="space-y-2 px-4" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-ws h-10 rounded-lg" style={{ marginLeft: (i % 3) * 14 }} />
          ))}
        </div>
      ) : (
        <ul ref={listRef} role="tree" aria-labelledby="branches-title" className="ws-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {rows.map((row, i) => {
            const g = row.generation;
            const id = g.generationId;
            const active = id === activeId;
            const onPath = activePath.has(id);
            const intent = findIntent(g.variation?.intent);
            const parentImage = g.parentImageId ? index.imageIndex.get(g.parentImageId) : null;
            const keptCount = keptIn(g);
            const hiddenCount = collapsed[id] ? descendantCount(index, id) : 0;
            return [
              <li
                key={id}
                role="treeitem"
                data-gen={id}
                tabIndex={id === focusTarget ? 0 : -1}
                aria-selected={active}
                aria-expanded={row.childCount ? !collapsed[id] : undefined}
                aria-level={row.depth + 1}
                onClick={() => open(id)}
                onKeyDown={(e) => onKeyDown(e, row, i)}
                className={clsx(
                  "group flex min-h-[52px] cursor-pointer items-stretch rounded-lg pr-2 transition-colors duration-150 outline-offset-[-2px]",
                  active ? "bg-ws-overlay" : "hover:bg-ws-raised"
                )}
              >
                <span className="w-2 shrink-0" />
                <Guides guides={row.guides} depth={row.depth} isLast={row.isLast} onPath={onPath && row.depth > 0} />
                <span className="flex min-w-0 flex-1 items-center gap-2 py-1.5">
                  <span
                    aria-hidden="true"
                    className={clsx("h-2 w-2 shrink-0 rounded-full", active ? "bg-ws-accent" : onPath ? "bg-ws-accent/60" : "bg-ws-line-strong")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className={clsx("font-mono text-[12px]", active ? "text-ws-accent" : "text-ws-text")}>{label(id)}</span>
                      <span className="truncate text-[12px] text-ws-text-2">
                        {intent ? intent.label : "New direction"}
                        {parentImage && (
                          <span className="text-ws-muted">
                            {" "}
                            · <span className="sr-only">from </span>#{parentImage.index + 1}
                            <span className="sr-only"> of {label(parentImage.generation.generationId)}</span>
                          </span>
                        )}
                        {keptCount > 0 && <span className="sr-only">, {keptCount} kept</span>}
                      </span>
                    </span>
                    <span className="block truncate text-[11px] text-ws-muted">{g.variation?.note || g.prompt}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {keptCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-ws-accent" aria-hidden="true">
                        <Star size={10} fill="currentColor" />
                        {keptCount}
                      </span>
                    )}
                    <span className="flex gap-0.5" aria-hidden="true">
                      {g.images.slice(0, 3).map((img) => (
                        <span key={img.id} className={clsx("relative h-7 w-[22px] overflow-hidden rounded-[3px]", kept[img.id] && "ring-1 ring-ws-accent")}>
                          <Image src={img.url} alt="" fill sizes="22px" className="object-cover" />
                        </span>
                      ))}
                    </span>
                    {row.childCount > 0 && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapsed(id);
                        }}
                        aria-label={collapsed[id] ? `Expand ${label(id)}` : `Collapse ${label(id)}`}
                        className="grid h-6 w-6 place-items-center rounded-md text-ws-muted hover:bg-ws-line hover:text-ws-text"
                      >
                        {hiddenCount ? (
                          <span className="font-mono text-[10px]">+{hiddenCount}</span>
                        ) : (
                          <ChevronRight size={13} className={clsx("transition-transform duration-200", !collapsed[id] && "rotate-90")} />
                        )}
                      </button>
                    )}
                  </span>
                </span>
              </li>,
              pending && pendingParent === id && <PendingRow key={`${id}-pending`} depth={row.depth + 1} />,
            ];
          })}
          {pending && !pendingParent && <PendingRow depth={0} />}
        </ul>
      )}
    </section>
  );
}
