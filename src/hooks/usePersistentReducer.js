"use client";

import { useEffect, useReducer, useRef } from "react";

const HYDRATE = "@@hydrate";

/**
 * useReducer that mirrors a slice of state to localStorage.
 *
 * The first render always uses `initialState` so server and client markup
 * match; stored state is applied right after mount. Storage failures (private
 * mode, quota, disabled storage) are ignored — the app keeps working in memory.
 *
 * @param select   picks the part of state worth persisting
 * @param version  bump to discard incompatible stored data
 */
export function usePersistentReducer(reducer, initialState, { key, version = 1, select = (s) => s }) {
  const storageKey = `${key}:v${version}`;

  const [state, dispatch] = useReducer((state, action) => {
    if (action.type === HYDRATE) return { ...state, ...action.payload };
    return reducer(state, action);
  }, initialState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) dispatch({ type: HYDRATE, payload: JSON.parse(raw) });
    } catch {
      // Corrupt or inaccessible storage: start from the initial state.
    }
  }, [storageKey]);

  const selectRef = useRef(select);
  useEffect(() => {
    selectRef.current = select;
  });

  useEffect(() => {
    // Never write the untouched initial state: it would overwrite stored data
    // before hydration has been applied.
    if (state === initialState) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(selectRef.current(state)));
    } catch {
      // Quota exceeded or storage disabled — not fatal.
    }
  }, [storageKey, state, initialState]);

  return [state, dispatch];
}
