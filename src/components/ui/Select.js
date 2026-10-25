"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Check } from "lucide-react";

const GAP = 6;
const MARGIN = 8;

/**
 * Custom select built on the ARIA "select-only combobox" pattern: a button
 * opens a listbox; focus moves to the listbox and the active option is
 * tracked with aria-activedescendant.
 *
 * Keyboard: ↑/↓ (opens when closed), Home/End, Enter/Space select,
 * Escape closes, Tab closes, type-ahead jumps by first letter.
 *
 * The panel is portalled into the nearest `[data-portal-root]` (which carries
 * the theme tokens and fonts) and positioned `fixed` against the trigger, so
 * scrollable panels can't clip it. It flips above when there's no room below.
 *
 * `options`: [{ value, label, description?, icon? }]
 * `classes`: { panel, option, optionActive, check, description } for theming.
 */
export function Select({
  label,
  value,
  options,
  onChange,
  trigger,
  triggerClassName,
  classes = {},
  minWidth = 200,
  align = "start",
  // When the trigger renders its own complete label (incl. visually hidden text), use it as the accessible name.
  nameFromContent = false,
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [portal, setPortal] = useState(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const typeahead = useRef({ text: "", timer: null });
  const id = useId();
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));

  const show = useCallback(
    (index = selectedIndex) => {
      setPortal(triggerRef.current?.closest("[data-portal-root]") ?? document.body);
      setActive(index);
      setOpen(true);
    },
    [selectedIndex]
  );

  const hide = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const choose = (index) => {
    const option = options[index];
    if (option && !option.disabled) onChange(option.value);
    hide();
  };

  // Position the panel next to the trigger; keep it on screen.
  const place = useCallback(() => {
    const list = listRef.current;
    const anchor = triggerRef.current;
    if (!list || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const width = Math.max(minWidth, r.width);
    const height = list.offsetHeight;
    const below = window.innerHeight - r.bottom - GAP - MARGIN;
    const flip = below < height && r.top - GAP - MARGIN > below;
    let left = align === "end" ? r.right - width : r.left;
    left = Math.min(Math.max(left, MARGIN), window.innerWidth - width - MARGIN);
    list.style.width = `${width}px`;
    list.style.left = `${left}px`;
    list.style.top = flip ? `${Math.max(MARGIN, r.top - GAP - height)}px` : `${r.bottom + GAP}px`;
    list.style.transformOrigin = flip ? "bottom" : "top";
  }, [align, minWidth]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    listRef.current?.focus({ preventScroll: true });
  }, [open, portal, place]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!listRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) hide(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, hide, place]);

  // Keep the active option visible while navigating.
  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const move = (delta) => {
    let i = active;
    for (let step = 0; step < options.length; step++) {
      i = (i + delta + options.length) % options.length;
      if (!options[i].disabled) break;
    }
    setActive(i);
  };

  const onListKeyDown = (e) => {
    const keys = {
      ArrowDown: () => move(1),
      ArrowUp: () => move(-1),
      Home: () => setActive(0),
      End: () => setActive(options.length - 1),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: () => hide(),
    };
    if (e.key === "Tab") {
      hide(false);
      return;
    }
    if (keys[e.key]) {
      e.preventDefault();
      e.stopPropagation();
      keys[e.key]();
      return;
    }
    if (e.key.length === 1 && /\S/.test(e.key)) {
      const t = typeahead.current;
      clearTimeout(t.timer);
      t.text += e.key.toLowerCase();
      t.timer = setTimeout(() => (t.text = ""), 600);
      const match = options.findIndex((o) => String(o.label).toLowerCase().startsWith(t.text));
      if (match !== -1) setActive(match);
    }
  };

  const listId = `${id}-list`;
  const optionId = (i) => `${id}-opt-${i}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={nameFromContent ? undefined : `${label}: ${options[selectedIndex]?.label ?? ""}`}
        onClick={() => (open ? hide(false) : show())}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            show(e.key === "ArrowUp" ? options.length - 1 : selectedIndex);
          }
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open &&
        portal &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={optionId(active)}
            onKeyDown={onListKeyDown}
            className={clsx("animate-pop fixed z-[100] max-h-[min(360px,60dvh)] overflow-y-auto outline-none", classes.panel)}
          >
            {options.map((option, i) => {
              const selected = i === selectedIndex;
              return (
                <li
                  key={String(option.value)}
                  id={optionId(i)}
                  data-index={i}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={option.disabled || undefined}
                  onPointerMove={() => active !== i && setActive(i)}
                  onClick={() => choose(i)}
                  className={clsx(
                    "flex cursor-pointer items-center gap-3 transition-colors duration-100 select-none",
                    classes.option,
                    i === active && classes.optionActive,
                    option.disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  {option.icon && <span className="grid shrink-0 place-items-center">{option.icon}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description && <span className={clsx("block truncate", classes.description)}>{option.description}</span>}
                  </span>
                  <Check size={15} strokeWidth={2.5} aria-hidden="true" className={clsx("shrink-0", classes.check, !selected && "invisible")} />
                </li>
              );
            })}
          </ul>,
          portal
        )}
    </>
  );
}

/** Small rectangle preview of an aspect ratio, for ratio pickers. */
export function RatioGlyph({ ratio, size = 16, className }) {
  const [w, h] = ratio.split(":").map(Number);
  const scale = size / Math.max(w, h);
  return (
    <span
      aria-hidden="true"
      className={clsx("inline-block rounded-[3px] border-[1.5px] border-current", className)}
      style={{ width: Math.max(6, w * scale), height: Math.max(6, h * scale) }}
    />
  );
}

/** Tiny grid showing how many results a run produces. */
export function CountGlyph({ count, className }) {
  return (
    <span aria-hidden="true" className={clsx("grid grid-cols-2 gap-[2px]", className)}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={clsx("h-[6px] w-[6px] rounded-[1.5px]", i < count ? "bg-current" : "bg-current opacity-20")} />
      ))}
    </span>
  );
}
