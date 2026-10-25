"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";

/**
 * Disclosure-style popover: a trigger button toggles a non-modal panel.
 * Closes on outside click, Escape (returning focus to the trigger) and when
 * focus leaves the panel. `children` may be a function receiving `close`.
 */
export function Popover({ trigger, triggerClassName, triggerLabel, panelClassName, align = "end", side = "bottom", children }) {
  const [open, setOpen] = useState(false);
  const [restoreFocus, setRestoreFocus] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const id = useId();

  const close = useCallback((restore = true) => {
    setOpen(false);
    setRestoreFocus(restore);
  }, []);

  useEffect(() => {
    if (!open && restoreFocus) triggerRef.current?.focus();
  }, [open, restoreFocus]);

  // Keep the panel inside its nearest clipping container (or the viewport) by
  // nudging it horizontally. Applied directly to the node: no re-render needed.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    let clip = panel.parentElement;
    while (clip && clip !== document.body && getComputedStyle(clip).overflowX === "visible") clip = clip.parentElement;
    const bounds = clip && clip !== document.body ? clip.getBoundingClientRect() : { left: 0, right: window.innerWidth };
    const rect = panel.getBoundingClientRect();
    const margin = 8;
    let shift = 0;
    if (rect.left < bounds.left + margin) shift = bounds.left + margin - rect.left;
    else if (rect.right > bounds.right - margin) shift = bounds.right - margin - rect.right;
    panel.style.translate = shift ? `${shift}px 0` : "";
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) close(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector("button, [href], input, select, textarea")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (open && e.relatedTarget && !rootRef.current?.contains(e.relatedTarget)) close(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={triggerLabel}
        className={triggerClassName}
        onClick={() => {
          setRestoreFocus(false);
          setOpen((o) => !o);
        }}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={panelRef}
          id={id}
          className={clsx(
            "animate-reveal absolute z-50",
            side === "right"
              ? ["left-full ml-2", align === "end" ? "bottom-0" : "top-0"]
              : [side === "bottom" ? "top-full mt-2" : "bottom-full mb-2", align === "end" ? "right-0" : "left-0"],
            panelClassName
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}
