"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query. Returns `serverValue` during SSR and
 * hydration, then the live value — so markup never mismatches.
 */
export function useMediaQuery(query, serverValue = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}
