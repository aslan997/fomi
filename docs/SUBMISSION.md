# Fomi — Frontend Developer Assessment

- **Candidate:** {{CANDIDATE_NAME}}
- **Live app:** [{{VERCEL_URL}}]({{VERCEL_URL}})
- **Repository:** [https://github.com/aslan997/fomi](https://github.com/aslan997/fomi)

| Deliverable | Link |
| --- | --- |
| Part A — Mockup implementation | [{{VERCEL_URL}}/implementation]({{VERCEL_URL}}/implementation) |
| Part B — Original workspace (*Fomi Studio*) | [{{VERCEL_URL}}/workspace]({{VERCEL_URL}}/workspace) |
| Product thinking document | Included below · `docs/PRODUCT_THINKING.md` |
| Architecture & engineering notes | `docs/ARCHITECTURE.md` |

## Summary

**Part A** recreates the supplied image-generator design with measured spacing and sampled colors (`docs/PART_A_SPEC.md`). Every visible control works: generation through a mocked API with loading, error/retry and empty states; feed filters; history jump; gallery; full preview with keyboard navigation; save, download, reuse settings; dark theme. Layouts are tuned for mobile, tablet, desktop and large screens.

**Part B — Fomi Studio** is a creative-continuity workspace. Any image can be **branched** with an explicit intent — *Lighting*, *Framing*, *Subject* or *Remix* — which keeps part of its look and explores the rest. A compact, keyboard-navigable **branch tree** shows lineage and the active path; **Compare** works across branches and explains differences (attributes and a word-level prompt diff); **Keep** preserves decisions.

## Engineering highlights

- Next.js 16 App Router, JavaScript, Tailwind v4 tokens; no UI kit or state library.
- Mock API with shared validation, deterministic results and simulated failure modes; Part B variations are pre-rendered grade × framing families so branches are visibly continuous with their parents.
- Native `<dialog>` modals, ARIA tree pattern, live-region announcements, reduced-motion support.
- 54 Playwright tests (desktop + mobile) covering API, both apps' workflows and axe accessibility scans; lint and production build clean.

## How to review

1. Open **Part A**, type a prompt and press Generate (or Ctrl+Enter). Try **Support → Demo controls → Fail** to see error + retry.
2. Open **Part B**. Hover an image → **Branch → Lighting**. Use the **Branches** panel (or arrow keys) to move through lineage. Select images from two branches → **Compare**.

---

{{PRODUCT_THINKING}}
