# Architecture and Engineering Notes

## Stack

| Choice | Reason |
| --- | --- |
| Next.js 16 (App Router), JavaScript | Required by the brief. Pages are server components, and interactivity is limited to a small number of client components. |
| Tailwind CSS v4 | Design tokens are CSS variables exposed through `@theme`, so each part has its own scoped theme without separate configuration. |
| `lucide-react`, `clsx` | A consistent icon set and readable conditional class names. No other runtime dependencies are shipped to the client. |
| No UI kit, state library or animation library | The required interactions (dialogs, popovers, selects, a tree, transitions) are small enough to build and maintain directly. Native `<dialog>` provides focus trapping, an inert background, Escape handling and focus restoration. CSS transitions and keyframes cover motion. |
| Playwright and axe-core (development only) | End-to-end workflow tests at desktop and mobile sizes, plus automated WCAG checks. |

## Project structure

```
src/
  app/
    page.js                      overview (server component)
    implementation/              Part A route (Poppins is loaded only here)
    workspace/                   Part B route
    api/generate/route.js        mocked generation (both parts)
    api/projects/[projectId]/    mocked project loading (Part B)
  components/
    ui/                          Dialog, Popover, Select: shared primitives, unstyled by default
    implementation/              Part A (kept separate so Part B cannot affect its fidelity)
    workspace/                   Part B
  hooks/                         usePersistentReducer, useMediaQuery
  lib/
    generation-options.js        Part A options, shared by the UI and API validation
    workspace/                   Part B options, tree helpers, formatting
    mock/                        catalogs, deterministic generators, validators
    api/generate-client.js       fetch wrapper with typed errors and abort support
  data/                          seed history for each part
scripts/                         offline asset tooling (not shipped)
tests/                           Playwright: api, implementation, workspace, a11y
```

## Mock backend

`POST /api/generate` dispatches on `collection` (`studio` for Part A, `workspace` for Part B):

1. **Validate** every field against the same option lists the UI renders from, so there is a single source of truth. Invalid JSON returns `400`; invalid fields return `422` with a per-field `fields` map.
2. **Wait** for a short, deterministic delay so that loading states are realistic.
3. **Respond** with a generation object (`generationId`, `status`, `prompt`, `model`, `aspectRatio`, `seed`, `parentGenerationId`, `createdAt`, `images[]` and related fields). A `scenario` field (`success`, `error` or `empty`) lets reviewers trigger failure paths from the demo controls in the UI; `error` returns `503` with `retryable: true`.

Results are **deterministic**. Images are ranked by how well the prompt keywords match their tags, with ties broken by a seeded FNV hash, so the same prompt and seed always produce the same output. Nothing in the UI suggests that real AI generation is taking place.

The Part B variations needed the most design work. Each base photo was pre-rendered offline into **5 color grades × 4 framings** (`scripts/render-workspace-variants.cjs`). A variation request includes the parent image's look (`{ base, grade, framing }`) and an intent, and the generator keeps part of that look fixed:

| Intent | Keeps | Explores |
| --- | --- | --- |
| Lighting | subject, framing | grade |
| Framing | subject, grade | framing |
| Subject | grade, framing | base scene |
| Remix | subject | grade and framing, guided by prompt keywords |

As a result, each branch is visibly continuous with its parent instead of being an unrelated new batch, which is the central idea of Part B. A real backend would look up the parent on the server; because the mock is stateless, the client sends the parent's look with the request.

`GET /api/projects/[projectId]` returns the seeded project after about 450 ms (`connection()` keeps it request-time under Cache Components), which gives the workspace a real first-load state.

## State management

**Part A** uses `StudioProvider` (context with `useReducer`) for generations, favorites, mock credits and the pending and error states. The composer draft, filter and dialog state use plain `useState`. State is persisted with `usePersistentReducer`, which renders the seed data on the server, hydrates from `localStorage` after mount (avoiding hydration mismatches) and never writes the untouched initial state, which protects stored data from Strict Mode's double-invoked effects.

**Part B** uses `WorkspaceProvider`:

- The project is stored as a **flat list of generations**, each with `parentGenerationId` and `parentImageId`. Updates are appends, and the tree is derived from the list (`lib/workspace/tree.js`: `indexGenerations`, `flattenTree`, `lineage`, `diffWords`) and memoized. At this scale, recomputing is cheaper than maintaining a nested structure, and it keeps persistence simple.
- On load, local edits in `localStorage` take priority; otherwise the project is fetched from the API.
- Starting a generation switches the canvas to a pending view. A failure returns to the previous view with an error banner and leaves the prompt and settings unchanged. Cancelling aborts the request through `AbortController`.

## Accessibility

- Native `<dialog>` is used for every modal (preview, gallery, compare and the branch drawer).
- Dropdowns use a custom `Select` component (`components/ui/Select.js`) that follows the ARIA select-only combobox pattern. Focus moves to the listbox, `aria-activedescendant` tracks the active option, and ↑/↓, Home/End, Enter, Escape and type-ahead are supported. The panel is portalled into the themed app root and positioned with `position: fixed`, so scrolling panels cannot clip it, and it opens upwards when there is not enough space below. The native `<select>` was replaced because its operating-system menu cannot show the ratio and model previews or match either theme.
- The branch history implements the **ARIA tree pattern**: a single tab stop (roving `tabIndex`), ↑/↓, Home/End, → to expand or move into children, ← to collapse or move to the parent, and Enter or Space to open.
- Image cards are real buttons (`aria-pressed` for selection). Actions revealed on hover are also revealed on focus, and are always visible on touch devices (`@media (hover: none)`).
- Prompt diffs use `<ins>` and `<del>` with screen-reader prefixes ("added:", "removed:").
- A polite live region announces when a generation starts, finishes or fails.
- `prefers-reduced-motion` disables all animation.
- axe-core runs in the test suite against every route (WCAG 2.2 A/AA, serious and critical issues).

**Documented exception:** the Part A Generate button keeps the mockup's white text on coral (`#fff` on `#e39c85`, 2.2:1) for fidelity. It is marked with `data-contrast-exception="mockup"` and is the only element excluded from the axe check. Every coral button that was added beyond the mockup uses dark text (about 7:1), the muted grey sampled from the mockup was darkened to pass 4.5:1, and the Part A dark theme passes.

## Performance

- Server components are the default; client code is limited to the two application shells.
- `next/image` is used throughout with explicit `sizes`, and thumbnails request 22 to 72 px variants. Source images are local WebP files (about 5.6 MB for Part A and 6.3 MB for Part B), resized on demand by the image optimizer.
- Fonts are loaded through `next/font` (self-hosted, with no layout shift). Poppins is only loaded on `/implementation`.
- Every image and skeleton uses a fixed aspect-ratio box, so there is no layout shift when results arrive.
- Only one composer and one branch tree instance are mounted per breakpoint (`useMediaQuery`), rather than hidden duplicates.

## Responsive strategy

| | Part A | Part B |
| --- | --- | --- |
| ≥1280 | Mockup layout | Rail, composer, canvas (four results in a row) and branch tree |
| 1024–1279 | Prompt card stacks above its row | Tree moves to a drawer; 2×2 canvas |
| 640–1023 | Composer full-width above the feed; newest results first | Composer collapses above the canvas; four results in a row from 768 px |
| <640 | Bottom tab bar replaces the icon navigation; two-column grid | Menu replaces the rail; two-column canvas |

## Testing

`npm test` does not build the app. Run `npm run build` first, because Playwright serves the production build.

- `tests/api.spec.js`: validation, determinism, and the error and empty scenarios.
- `tests/implementation.spec.js`: generation, Ctrl+Enter, feedback on empty submit, error and retry, keyboard use of the preview, persistence of favorites, history navigation, gallery filters, theme persistence, download, the custom selects, and horizontal overflow.
- `tests/workspace.spec.js`: project loading, branching (Lighting keeps the scene), keyboard navigation of the tree, cross-branch compare, the remix prompt diff, keep and persistence, failure and retry, composer settings, the preview, inline validation, and horizontal overflow.
- `tests/a11y.spec.js`: axe scans of every route.

All tests run in a desktop project (1440×900) and a mobile project (Pixel 7).

## Known limitations

- There is no real generation, and the image library is small (22 photos for Part A and 6 scenes for Part B), so unrelated prompts return loosely matching results.
- Persistence uses `localStorage` in each browser; there are no accounts or sync.
- Part B variations are pre-rendered color grades and crops rather than new images. They demonstrate continuity, not image quality.
- The mock video clips are pan and zoom renders of still images and are labelled as mock previews in the UI.
- Popovers are positioned with CSS and nudged to stay inside their scroll container; a positioning library such as Floating UI would handle more edge cases.
