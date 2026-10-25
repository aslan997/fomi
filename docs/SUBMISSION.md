# Fomi Frontend Developer Assessment

- **Candidate:** {{CANDIDATE_NAME}}
- **Live app:** [{{VERCEL_URL}}]({{VERCEL_URL}})
- **Repository:** [https://github.com/aslan997/fomi](https://github.com/aslan997/fomi)

| Deliverable | Link |
| --- | --- |
| Part A: Mockup implementation | [{{VERCEL_URL}}/implementation]({{VERCEL_URL}}/implementation) |
| Part B: Original workspace (Fomi Studio) | [{{VERCEL_URL}}/workspace]({{VERCEL_URL}}/workspace) |
| Product thinking document | Included below (`docs/PRODUCT_THINKING.md`) |
| Architecture and engineering notes | `docs/ARCHITECTURE.md` |

## Summary

**Part A** recreates the supplied image generator design using spacing measured from the mockup and colors sampled from it (`docs/PART_A_SPEC.md`). Every visible control is functional: generation through a mocked API with loading, error/retry and empty states, feed filters, history navigation, a gallery, a full preview with keyboard navigation, save, download, reuse of settings, and a dark theme. Layouts are adapted for mobile, tablet, desktop and large screens.

**Part B (Fomi Studio)** is a creative continuity workspace. Any image can be **branched** with an explicit intent (Lighting, Framing, Subject or Remix), which keeps part of its look and explores the rest. A compact, keyboard-navigable **branch tree** shows lineage and the active path. **Compare** works across branches and explains the differences through attributes and a word-level prompt diff, and **Keep** preserves the chosen results.

## Engineering highlights

- Next.js 16 App Router, JavaScript and Tailwind v4 design tokens, with no UI kit or state management library.
- A mock API with shared validation, deterministic results and simulated failure modes. Part B variations are pre-rendered families of color grades and framings, so each branch is visibly continuous with its parent.
- Native `<dialog>` modals, the ARIA tree pattern, live-region announcements and reduced-motion support.
- 56 Playwright tests on desktop and mobile covering the API, the workflows in both apps and axe accessibility scans. Lint and the production build are clean.

## How to review

1. Open **Part A**, type a prompt and press Generate (or Ctrl+Enter). To see the error and retry flow, open **Support > Demo controls** and select **Fail** before generating.
2. Open **Part B**, hover over an image and choose **Branch > Lighting**. Use the **Branches** panel (or the arrow keys) to move through the lineage, then select images from two different branches and click **Compare**.

---

{{PRODUCT_THINKING}}
