"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { STUDIO_SEED } from "@/data/studio-seed";
import { requestGeneration } from "@/lib/api/generate-client";
import { ASPECT_RATIOS, MODELS } from "@/lib/generation-options";
import { usePersistentReducer } from "@/hooks/usePersistentReducer";

const StudioContext = createContext(null);

export const STARTING_CREDITS = 240;
export const creditCost = ({ mode, count }) => count * (mode === "video" ? 4 : 1);

const initialState = {
  generations: STUDIO_SEED,
  favorites: {},
  credits: STARTING_CREDITS,
  pending: null,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "generate/start":
      return { ...state, pending: action.request, error: null };
    case "generate/success":
      return {
        ...state,
        pending: null,
        generations: [...state.generations, action.generation],
        credits: Math.max(0, state.credits - creditCost(action.request)),
      };
    case "generate/failure":
      return { ...state, pending: null, error: { message: action.message, retryable: action.retryable, request: action.request } };
    case "generate/cancel":
      return { ...state, pending: null };
    case "error/dismiss":
      return { ...state, error: null };
    case "favorite/toggle": {
      const favorites = { ...state.favorites };
      if (favorites[action.imageId]) delete favorites[action.imageId];
      else favorites[action.imageId] = true;
      return { ...state, favorites };
    }
    case "reset":
      return { ...initialState, generations: STUDIO_SEED };
    default:
      return state;
  }
}

const defaultComposer = {
  mode: "image",
  prompt: "",
  count: 4,
  aspectRatio: "1:1",
  model: MODELS.image[0].id,
  style: "none",
  guidance: 7,
  seed: null,
  negativePrompt: "",
};

export function StudioProvider({ children }) {
  const [state, dispatch] = usePersistentReducer(reducer, initialState, {
    key: "fomi.studio",
    select: ({ generations, favorites, credits }) => ({ generations, favorites, credits }),
  });
  const [composer, setComposer] = useState(defaultComposer);
  const [filter, setFilter] = useState("all");
  const [nextScenario, setNextScenario] = useState("success");
  const [announcement, setAnnouncement] = useState("");
  const [jumpTarget, setJumpTarget] = useState(null);
  const [previewImageId, setPreviewImageId] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const abortRef = useRef(null);

  /** Scrolls the feed to a generation; clears a filter that would hide it. */
  const jumpTo = useCallback((generationId) => {
    setFilter("all");
    setJumpTarget({ generationId, nonce: Date.now() });
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateComposer = useCallback((patch) => setComposer((c) => ({ ...c, ...patch })), []);

  /** Switching mode keeps the prompt but resets model/ratio to valid values for that mode. */
  const setMode = useCallback((mode) => {
    setComposer((c) => {
      if (c.mode === mode) return c;
      return {
        ...c,
        mode,
        model: MODELS[mode][0].id,
        aspectRatio: ASPECT_RATIOS[mode].includes(c.aspectRatio) ? c.aspectRatio : ASPECT_RATIOS[mode][0],
      };
    });
  }, []);

  const run = useCallback(
    async (request) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      dispatch({ type: "generate/start", request });
      const noun = request.mode === "video" ? "video" : "image";
      setAnnouncement(`Generating ${request.count} ${noun}${request.count > 1 ? "s" : ""}…`);

      try {
        const generation = await requestGeneration(request, { signal: controller.signal });
        dispatch({ type: "generate/success", generation, request });
        const n = generation.images.length;
        setAnnouncement(n ? `${n} ${noun}${n > 1 ? "s" : ""} ready.` : "Generation finished with no results.");
      } catch (err) {
        if (err.name === "AbortError") {
          dispatch({ type: "generate/cancel" });
          return;
        }
        dispatch({ type: "generate/failure", message: err.message, retryable: err.retryable, request });
        setAnnouncement(`Generation failed. ${err.message}`);
      }
    },
    [dispatch]
  );

  const generate = useCallback(() => {
    const { prompt, ...settings } = composer;
    run({ ...settings, prompt: prompt.trim(), collection: "studio", scenario: nextScenario });
    setNextScenario("success");
  }, [composer, nextScenario, run]);

  const retry = useCallback(() => {
    if (state.error) run({ ...state.error.request, scenario: "success" });
  }, [run, state.error]);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  /** Loads a past generation's prompt and settings back into the composer. */
  const reuse = useCallback((generation) => {
    setComposer((c) => ({
      ...c,
      mode: generation.type,
      prompt: generation.prompt,
      model: generation.model,
      aspectRatio: generation.aspectRatio,
      style: generation.style ?? "none",
      guidance: generation.guidance ?? 7,
      seed: generation.seed ?? null,
      negativePrompt: generation.negativePrompt ?? "",
      count: Math.max(1, generation.images.length),
    }));
    setAnnouncement("Prompt and settings loaded into the composer.");
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      composer,
      updateComposer,
      setMode,
      filter,
      setFilter,
      nextScenario,
      setNextScenario,
      generate,
      retry,
      cancel,
      reuse,
      jumpTarget,
      jumpTo,
      previewImageId,
      openPreview: setPreviewImageId,
      closePreview: () => setPreviewImageId(null),
      galleryOpen,
      setGalleryOpen,
      announce: setAnnouncement,
      dismissError: () => dispatch({ type: "error/dismiss" }),
      toggleFavorite: (imageId) => dispatch({ type: "favorite/toggle", imageId }),
      resetDemo: () => dispatch({ type: "reset" }),
    }),
    [state, composer, updateComposer, setMode, filter, nextScenario, generate, retry, cancel, reuse, jumpTarget, jumpTo, previewImageId, galleryOpen, dispatch]
  );

  return (
    <StudioContext.Provider value={value}>
      {children}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used inside <StudioProvider>");
  return ctx;
}
