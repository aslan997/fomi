# Fomi Frontend Developer Assessment

Two deliverables in one Next.js app:

| Route | What it is |
| --- | --- |
| `/` | Short overview with links to both parts |
| `/implementation` | **Part A:** a faithful, responsive build of the supplied image generator mockup |
| `/workspace` | **Part B:** Fomi Studio, an original creative continuity workspace built around **Creative Branching** |

Both run against a **mocked** backend. No real AI generation takes place; results come from a local image library.

## Quick start

Requires Node 20+ (developed on Node 22).

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals rules) |
| `npm test` | Playwright end-to-end + accessibility tests (run `npm run build` first) |

Tests use the locally installed Google Chrome. To use Playwright's bundled Chromium instead: `npx playwright install chromium` and run with `PW_CHANNEL=""`.

## Mock API

### `POST /api/generate`

```jsonc
// Part A
{ "collection": "studio", "prompt": "snowy mountain at sunset", "mode": "image",
  "model": "fomi-portrait", "aspectRatio": "2:3", "count": 4,
  "style": "cinematic", "guidance": 7, "seed": null, "negativePrompt": "" }

// Part B: a branch of an existing image
{ "collection": "workspace", "prompt": "…", "model": "studio-v3", "aspectRatio": "4:5", "count": 4,
  "parentGenerationId": "g2", "parentImageId": "g2_0",
  "parentLook": { "base": "street", "grade": "golden", "framing": "standard" },
  "variation": { "intent": "lighting", "note": "colder" } }
```

- **200:** `{ generationId, status: "completed", prompt, model, aspectRatio, seed, parentGenerationId, createdAt, images: [{ id, url, width, height, alt, … }] }`
- **400:** malformed JSON. **422:** invalid fields (`error.fields` maps each field to a message).
- **503:** simulated outage (`error.retryable: true`).

Behavior is deterministic: the same prompt and seed return the same images, ranked by prompt keywords. A short simulated delay makes loading states visible. Add `"scenario": "error" | "empty"` to trigger the failure paths. Both apps expose this under **Support > Demo controls** (Part A) and **Settings > Demo controls** (Part B).

### `GET /api/projects/:projectId`

Returns the seeded Part B project (`atlas-fw26`) after a short delay; unknown ids return `404`.

## Using the apps

**Part A:** type a prompt and press **Generate** (or Ctrl+Enter). Image/Video switch modes; the header icons filter the feed (Home, Images, Videos, Saved); history thumbnails jump to their generation; hover a result to save or download; click to preview (←/→, Esc). The moon toggles a dark theme.

**Part B:** the project opens on a branch (G4). Hover over an image, choose **Branch**, then pick Lighting, Framing or Subject (these run immediately) or Remix (which opens the prompt in the composer). The **Branches** panel shows the lineage; click a row or use the arrow keys to move through it. Click images to select them, including across branches, then choose **Compare**. Star an image to keep it; **Kept assets** in the rail collects them. Shortcuts: `[` `]` previous/next run, Alt+↑ parent, `C` compare, Esc clear selection.

State is stored in `localStorage`; **Reset** lives in each app's demo controls.

## Project structure & decisions

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for structure, state management, the mock generators, accessibility, performance and responsive strategy.

Other docs:

- [docs/PRODUCT_THINKING.md](docs/PRODUCT_THINKING.md): Part B product thinking (the six assessment questions)
- [docs/PART_A_SPEC.md](docs/PART_A_SPEC.md): measurements and colors taken from the mockup, with observed and inferred details separated
- [docs/CREDITS.md](docs/CREDITS.md): image sources (Unsplash License)
- [docs/SUBMISSION.md](docs/SUBMISSION.md): submission summary

## Known limitations

- Generation is mocked; the image library is small, so unrelated prompts return loosely matching images.
- Persistence is per-browser `localStorage`.
- Part B variations are pre-rendered color grades and crops of six base photos. They demonstrate continuity, not image quality.
- Part A's Generate button keeps the mockup's white-on-coral colors (2.2:1 contrast) for fidelity; this is the one documented accessibility exception. All other text meets WCAG AA.
- Video results in Part A are short pan/zoom clips rendered from stills and labelled as mock previews.

## Deployment (Vercel)

1. Push the repository to GitHub.
2. In Vercel: **Add New → Project →** import the repo. Framework preset: **Next.js**; defaults for build (`next build`) and output.
3. No environment variables are required.
4. Deploy, then open `/`, `/implementation` and `/workspace` on the production URL.

The mock API runs as Vercel Functions; its simulated delays (≤3 s) are well within default limits.
