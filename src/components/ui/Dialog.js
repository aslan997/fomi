"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

/**
 * Modal built on the native <dialog> element: the browser provides the focus
 * trap, inert background, Escape-to-close and focus restoration on close.
 * Clicking the backdrop also closes it.
 */
export function Dialog({ open, onClose, labelledBy, label, className, variant = "st-dialog", children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // If the component unmounts while open (e.g. route change), release the top layer.
  useEffect(() => {
    const dialog = ref.current;
    return () => dialog?.open && dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-label={label}
      className={clsx(variant, className)}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
