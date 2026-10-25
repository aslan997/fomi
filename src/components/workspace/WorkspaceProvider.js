"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { requestGeneration } from "@/lib/api/generate-client";
import { WS_MODELS } from "@/lib/workspace/options";
import { flattenTree, indexGenerations } from "@/lib/workspace/tree";

const WorkspaceContext = createContext(null);

const PROJECT_ID = "atlas-fw26";
const STORAGE_KEY = `fomi.workspace.${PROJECT_ID}:v1`;
export const MAX_SELECTION = 4;
export const PENDING_ID = "pending";

const initialState = {
  status: "loading", // loading | ready | error
  loadError: null,
  project: null,
  generations: [],
  kept: {},
  activeId: null,
  pending: null, // { request, previousActiveId }
  error: null, // { message, retryable, request, previousActiveId }
};

function reducer(state, action) {
  switch (action.type) {
    case "load/start":
      return { ...state, status: "loading", loadError: null };
    case "load/success": {
      const { generations, kept, activeGenerationId, ...project } = action.project;
      return {
        ...state,
        status: "ready",
        project: { id: project.id, name: project.name, client: project.client },
        generations,
        kept: kept ?? {},
        activeId: activeGenerationId ?? generations.at(-1)?.generationId ?? null,
      };
    }
    case "load/failure":
      return { ...state, status: "error", loadError: action.message };
    case "activate":
      return { ...state, activeId: action.id };
    case "keep/toggle": {
      const kept = { ...state.kept };
      if (kept[action.imageId]) delete kept[action.imageId];
      else kept[action.imageId] = true;
      return { ...state, kept };
    }
    case "generate/start":
      return {
        ...state,
        pending: { request: action.request, previousActiveId: state.activeId },
        error: null,
        activeId: PENDING_ID,
      };
    case "generate/success":
      return {
        ...state,
        pending: null,
        generations: [...state.generations, action.generation],
        activeId: action.generation.generationId,
      };
    case "generate/failure":
      return {
        ...state,
        pending: null,
        activeId: state.pending?.previousActiveId ?? state.activeId,
        error: { message: action.message, retryable: action.retryable, request: action.request },
      };
    case "generate/cancel":
      return { ...state, pending: null, activeId: state.pending?.previousActiveId ?? state.activeId };
    case "error/dismiss":
      return { ...state, error: null };
    default:
      return state;
  }
}

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const defaultComposer = { prompt: "", model: WS_MODELS[0].id, aspectRatio: "4:5", count: 4, seed: null, negativePrompt: "" };

export function WorkspaceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [composer, setComposer] = useState(defaultComposer);
  const [branchFromId, setBranchFromId] = useState(null); // image the composer will branch from
  const [selection, setSelection] = useState([]);
  const [collapsed, setCollapsed] = useState({});
  const [view, setView] = useState("canvas"); // canvas | kept
  const [previewImageId, setPreviewImageId] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [nextScenario, setNextScenario] = useState("success");
  const [announcement, setAnnouncement] = useState("");
  const [loadNonce, setLoadNonce] = useState(0);
  const abortRef = useRef(null);

  // Load: local edits win; otherwise fetch the project from the (mock) API.
  useEffect(() => {
    const stored = readStored();
    if (stored) {
      dispatch({ type: "load/success", project: stored });
      return;
    }
    const controller = new AbortController();
    dispatch({ type: "load/start" });
    fetch(`/api/projects/${PROJECT_ID}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))
      .then((project) => dispatch({ type: "load/success", project }))
      .catch((err) => {
        if (err.name !== "AbortError") dispatch({ type: "load/failure", message: "Couldn't load this project." });
      });
    return () => controller.abort();
  }, [loadNonce]);

  // Persist the project once loaded.
  useEffect(() => {
    if (state.status !== "ready") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...state.project,
          generations: state.generations,
          kept: state.kept,
          activeGenerationId: state.activeId === PENDING_ID ? state.pending?.previousActiveId : state.activeId,
        })
      );
    } catch {
      // Storage full or disabled: keep working in memory.
    }
  }, [state.status, state.project, state.generations, state.kept, state.activeId, state.pending]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const index = useMemo(() => indexGenerations(state.generations), [state.generations]);
  const rows = useMemo(() => flattenTree(state.generations, index, collapsed), [state.generations, index, collapsed]);

  const label = useCallback(
    (generationId, imageIndex) => {
      const n = index.number.get(generationId);
      if (!n) return "";
      return imageIndex == null ? `G${n}` : `G${n}·${imageIndex + 1}`;
    },
    [index]
  );

  const run = useCallback(
    async (request) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      dispatch({ type: "generate/start", request });
      setView("canvas");
      setAnnouncement(request.parentImageId ? "Creating branch…" : `Generating ${request.count} images…`);
      try {
        const generation = await requestGeneration(request, { signal: controller.signal });
        dispatch({ type: "generate/success", generation });
        setAnnouncement(`${generation.images.length} results ready.`);
      } catch (err) {
        if (err.name === "AbortError") {
          dispatch({ type: "generate/cancel" });
          setAnnouncement("Generation cancelled.");
          return;
        }
        dispatch({ type: "generate/failure", message: err.message, retryable: err.retryable, request });
        setAnnouncement(`Generation failed. ${err.message}`);
      }
    },
    []
  );

  /**
   * Starts a generation. With `parentImageId` it creates a branch: the intent
   * decides which part of the parent's look is kept and which is explored.
   */
  const generate = useCallback(
    ({ parentImageId = null, intent = "remix", note = "", prompt } = {}) => {
      const scenario = nextScenario;
      setNextScenario("success");
      const settings = {
        collection: "workspace",
        model: composer.model,
        aspectRatio: composer.aspectRatio,
        count: composer.count,
        seed: composer.seed,
        negativePrompt: composer.negativePrompt,
        scenario,
      };
      if (parentImageId) {
        const parent = index.imageIndex.get(parentImageId);
        if (!parent) return;
        run({
          ...settings,
          prompt: (prompt ?? parent.generation.prompt).trim(),
          parentGenerationId: parent.generation.generationId,
          parentImageId,
          parentLook: parent.image.look,
          variation: { intent, note: note.trim() },
        });
      } else {
        run({ ...settings, prompt: (prompt ?? composer.prompt).trim() });
      }
    },
    [composer, index, nextScenario, run]
  );

  /** Composer submit: a fresh direction, or a remix of the image it's branching from. */
  const submitComposer = useCallback(() => {
    if (branchFromId) {
      generate({ parentImageId: branchFromId, intent: "remix", prompt: composer.prompt });
      // The remix is now its own node; further edits start from wherever the user branches next.
      setBranchFromId(null);
    } else generate();
  }, [branchFromId, composer.prompt, generate]);

  const retry = useCallback(() => {
    if (state.error) run({ ...state.error.request, scenario: "success" });
  }, [run, state.error]);

  /** Opens the composer pre-filled to remix a specific image. */
  const startRemix = useCallback(
    (imageId) => {
      const entry = index.imageIndex.get(imageId);
      if (!entry) return;
      setBranchFromId(imageId);
      setComposer((c) => ({ ...c, prompt: entry.generation.prompt }));
      setAnnouncement(`Composer will branch from ${label(entry.generation.generationId, entry.index)}.`);
      requestAnimationFrame(() => document.querySelector("[data-ws-prompt]")?.focus());
    },
    [index, label]
  );

  const toggleSelect = useCallback((imageId) => {
    setSelection((sel) => {
      if (sel.includes(imageId)) return sel.filter((id) => id !== imageId);
      if (sel.length >= MAX_SELECTION) {
        setAnnouncement(`You can compare up to ${MAX_SELECTION} images.`);
        return sel;
      }
      return [...sel, imageId];
    });
  }, []);

  const activate = useCallback((id) => {
    dispatch({ type: "activate", id });
    setView("canvas");
  }, []);

  const resetProject = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setSelection([]);
    setBranchFromId(null);
    setLoadNonce((n) => n + 1);
    setAnnouncement("Project reset to the demo state.");
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      index,
      rows,
      label,
      composer,
      updateComposer: (patch) => setComposer((c) => ({ ...c, ...patch })),
      branchFromId,
      setBranchFromId,
      startRemix,
      selection,
      toggleSelect,
      clearSelection: () => setSelection([]),
      collapsed,
      toggleCollapsed: (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] })),
      view,
      setView,
      activate,
      previewImageId,
      setPreviewImageId,
      compareOpen,
      setCompareOpen,
      nextScenario,
      setNextScenario,
      generate,
      submitComposer,
      retry,
      cancel: () => abortRef.current?.abort(),
      dismissError: () => dispatch({ type: "error/dismiss" }),
      toggleKeep: (imageId) => dispatch({ type: "keep/toggle", imageId }),
      retryLoad: () => setLoadNonce((n) => n + 1),
      resetProject,
      announce: setAnnouncement,
    }),
    [state, index, rows, label, composer, branchFromId, startRemix, selection, toggleSelect, collapsed, view, activate, previewImageId, compareOpen, nextScenario, generate, submitComposer, retry, resetProject]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
