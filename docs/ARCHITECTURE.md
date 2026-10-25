# Architecture & Engineering Notes

## Stack

| Choice | Why |
| --- | --- |
| Next.js 16 (App Router), JavaScript | Required. Pages are server components; interactivity lives in a small number of client islands. |
| Tailwind CSS v4 | Design tokens are CSS variables exposed through `@theme`, so each part has its own scoped theme without separate configs. |
| `lucide-react`, `clsx` | Consistent icon set and readable conditional classes. Nothing else ships to the client. |
| No UI kit, no state library, no animation library | The interactions needed (dialogs, popovers, a tree, transitions) are small enough to own. Native `<dialog>` handles focus trapping, inert background, Escape and focus restoration. CSS transitions/keyframes cover motion. |
| Playwright + axe-core (dev only) | End-to-end workflow tests at desktop and mobile sizes, plus automated WCAG checks. |

## Layout

```
src/
  app/
    page.js                      overview (server component)
    implementation/              Part A route (+ Poppins, loaded only here)
    workspace/                   Part B route
    api/generate/route.js        mocked generation (both parts)
    api/projects/[projectId]/    mocked project load (Part B)
  components/
    ui/                          Dialog, Popover — shared, unstyled-by-default primitives
    implementation/              Part A (isolated so B can't affect its fidelity)
    workspace/                   Part B
  hooks/                         usePersistentReducer, useMediaQuery
  lib/
    generation-options.js        Part A options, shared by UI + API validation
    workspace/                   Part B options, tree helpers, formatting
    mock/                        catalogs, deterministic generators, validators
    api/generate-client.js       fetch wrapper with typed errors + abort
  data/                          seed history for each part
scripts/                         offline asset tooling (not shipped)
tests/                           Playwright: api, implementation, workspace, a11y
```

## Mock backend

`POST /api/generate` dispatches on `collection` (`studio` = Part A, `workspace` = Part B):

1. **Validate** every field against the same option lists the UI renders from (one source of truth). Invalid JSON → `400`; invalid fields → `422` with a per-field `fields` map.
2. **Wait** a short, deterministic delay so loading states are real.
3. **Respond** with a generation object (`generationId`, `status`, `prompt`, `model`, `aspectRatio`, `seed`, `parentGenerationId`, `createdAt`, `images[]`…). A `scenario` field (`success` / `error` / `empty`) lets reviewers exercise failure paths from the UI's demo controls; `error` returns `503` with `retryable: true`.

Results are **deterministic**: images are ranked by prompt-keyword matches against tags, ties broken by a seeded FNV hash. Same prompt + seed → same output. Nothing claims to be AI.

Part B variations are the interesting part. Every base photo was pre-rendered offline into **5 color grades × 4 framings** (`scripts/render-workspace-variants.cjs`). A variation request carries the parent image's look `{ base, grade, framing }` and an intent, and the generator holds part of the look fixed:

| Intent | Keeps | Explores |
| --- | --- | --- |
| Lighting | subject, framing | grade |
| Framing | subject, grade | framing |
| Subject | grade, framing | base scene |
| Remix | subject | grade/framing guided by prompt keywords |

So a branch is visibly continuous with its parent — the core claim of the product — rather than a random new batch. (A real backend would look the parent up server-side; the mock is stateless, so the client sends the look.)

`GET /api/projects/[projectId]` returns the seeded project after ~450 ms (`connection()` keeps it request-time under Cache Components), giving the workspace a genuine first-load state.

## State

**Part A** — `StudioProvider` (context + `useReducer`): generations, favorites, mock credits, pending/error. The composer draft, filter and dialog state are plain `useState`. Persisted with `usePersistentReducer`, which renders the seed on the server, hydrates from `localStorage` after mount (no hydration mismatch), and never writes the untouched initial state (protects stored data under Strict Mode's double effects).

**Part B** — `WorkspaceProvider`:
- The project is a **flat list of generations**, each with `parentGenerationId` + `parentImageId`. Updates are appends; the tree is *derived* (`lib/workspace/tree.js`: `indexGenerations`, `flattenTree`, `lineage`, `diffWords`) and memoized on the list. At this scale recomputing is cheaper than maintaining a nested structure, and it makes persistence trivial.
- Loading order: local edits in `localStorage` win; otherwise fetch the project from the API.
- Starting a generation switches the canvas to a pending view; failure returns to the previous view with an error banner (prompt and settings untouched); cancel aborts the request via `AbortController`.

## Accessibility

- Native `<dialog>` for every modal (preview, gallery, compare, branch drawer).
- Branch history implements the **ARIA tree pattern**: one tab stop (roving `tabIndex`), ↑/↓, Home/End, → expand/enter, ← collapse/parent, Enter/Space open.
- Image cards are real buttons (`aria-pressed` for selection); hover-revealed actions are also revealed on focus and always visible on touch (`@media (hover: none)`).
- Prompt diffs use `<ins>`/`<del>` with screen-reader prefixes ("added:", "removed:").
- Polite live region announces generation start/finish/failure.
- `prefers-reduced-motion` collapses all animation.
- axe-core runs in the test suite against all routes (WCAG 2.2 A/AA, serious/critical).

**Documented exception:** Part A's Generate button keeps the mockup's white-on-coral (`#fff` on `#e39c85`, 2.2:1) for fidelity. It is marked `data-contrast-exception="mockup"` and is the only element excluded from the axe check. Every *added* coral button uses dark text (~7:1), Part A's sampled muted grey was darkened to pass 4.5:1, and Part A's dark theme passes.

## Performance

- Server components by default; client code is limited to the two app shells.
- `next/image` everywhere with explicit `sizes`; thumbnails request 22–72 px variants. Local WebP sources (Part A ≈5.6 MB total, Part B ≈6.3 MB) — served resized by the optimizer.
- Fonts via `next/font` (self-hosted, no layout shift). Poppins is loaded only on `/implementation`.
- Fixed aspect-ratio boxes for every image and skeleton → no layout shift when results arrive.
- One composer / one branch tree instance is mounted per breakpoint (`useMediaQuery`), not hidden duplicates.

## Responsive strategy

| | Part A | Part B |
| --- | --- | --- |
| ≥1280 | Mockup layout | Rail · composer · canvas (4-up run) · branch tree |
| 1024–1279 | Prompt card stacks above its row | Tree moves to a drawer; 2×2 canvas |
| 640–1023 | Composer full-width above feed; newest-first feed | Composer collapsible above canvas; 4-up run at ≥768 |
| <640 | Bottom tab bar replaces icon nav; 2-col grid | Menu replaces rail; 2-col canvas |

## Testing

`npm test` builds nothing itself — run `npm run build` first; Playwright serves the production build.

- `tests/api.spec.js` — validation, determinism, error/empty scenarios.
- `tests/implementation.spec.js` — generate, Ctrl+Enter, empty-submit feedback, error + retry, preview (keyboard), favorites persistence, history jump, gallery filters, theme persistence, download, overflow.
- `tests/workspace.spec.js` — load, branch (lighting keeps the scene), tree keyboard navigation, cross-branch compare, remix prompt diff, keep + persistence, failure + retry, preview, overflow.
- `tests/a11y.spec.js` — axe on every route.

All run in a desktop (1440×900) and a mobile (Pixel 7) project.

## Known limitations

- No real generation; the image library is small (22 Part A photos, 6 Part B scenes), so unrelated prompts return loosely matching results.
- Persistence is per-browser `localStorage`; there's no account or sync.
- Part B variations are pre-rendered color grades/crops, not novel images — enough to demonstrate continuity, not image quality.
- Mock video clips are pan/zoom renders of stills, labelled as mock previews in the UI.
- Popovers are positioned with CSS and nudged to stay inside their scroll container; a positioning library (e.g. Floating UI) would handle more edge cases.
