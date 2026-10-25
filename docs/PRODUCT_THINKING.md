# Fomi Studio — Product Thinking (Part B)

**Concept:** a creative continuity workspace. Instead of treating each generation as a disconnected batch, every result can become the starting point of a *branch* that keeps what works and explores one thing at a time.

---

## 1. What problem were you trying to solve?

**User.** A professional — art director, brand designer, content lead — who generates images daily for real projects (a campaign, a product launch, a series). They don't want *an* image; they want a *consistent set* that fits a direction the client already approved.

**Friction today.** Most generation tools are built around a prompt box and a results feed. That works for the first idea and breaks down on the tenth:

- **Every run is a fresh roll of the dice.** Re-prompting to change the light also changes the subject, the crop and the mood. Professionals end up fighting the tool to hold on to the parts they liked.
- **History is a timeline, not a structure.** A long chronological feed doesn't say *which* result a later run came from, or why it looks different. Going back to "the version before we made it warmer" means scrolling and guessing.
- **Good decisions get lost.** The best frame from Tuesday is somewhere in a feed of 200 images, detached from the reasoning that produced it.

**Why continuity matters.** Creative work converges: you lock the subject, then the light, then the framing. A tool that lets you *hold some variables fixed while exploring others* — and remembers how you got there — matches how professionals actually iterate. That's the bet of this workspace.

## 2. The three most important UX decisions

### a) Branch from an image, with an explicit intent
- **Problem:** "Make a variation" is ambiguous — variation of *what*? Users then over-describe in the prompt to protect what they like.
- **Decision:** every image has a **Branch** action offering four intents — *Lighting*, *Framing*, *Subject*, *Remix* — each stating what it **keeps** and what it **explores** (e.g. "Keeps subject & framing, explores light"). Lighting/Framing/Subject run in one click; Remix opens the composer with the parent's prompt, so edits are deliberate. An optional one-line "direction" ("colder, dusk") steers it.
- **Trade-off:** a fixed set of intents is less expressive than free-form controls (sliders per attribute, masks, references). I chose four intents that map to how art directors talk about images, over completeness.
- **Benefit:** one decision, one click, and the result is visibly continuous with its parent. In the demo, branching *Lighting* from a desert portrait returns the same scene in four grades — not four new scenes.

### b) A compact branch tree, not a node graph or a flat feed
- **Problem:** users need to know *where they are* and *how they got here* within seconds.
- **Decision:** a narrow tree panel. Each row: run label (G4), intent ("Subject · #2" = branched from image 2), the direction note, three thumbnails, kept count. Connectors show parentage; the **active path is highlighted in amber** from root to current run. The canvas header repeats this as a breadcrumb (`G1 › G2 › G4`) and shows the parent thumbnail with what was kept vs. explored. It's a real ARIA tree, fully keyboard-navigable.
- **Trade-off:** a node-graph canvas would show more relationships at once and allow merging, but it costs a lot of screen space, takes the canvas away from the images, and has a learning curve. The tree is read at a glance and stays out of the way.
- **Benefit:** returning to "the version before it got warmer" is one click on the parent row or breadcrumb, and every result carries its provenance.

### c) Selection that spans branches, with a "why it differs" compare
- **Problem:** the real decision is usually between candidates from *different* directions — e.g. the golden close-up from one branch vs. the cold wide shot from another.
- **Decision:** selection is global (up to 4) and survives navigating the tree. **Compare** shows them side by side with lineage, highlights the attributes that differ (light, framing, scene, branch type, seed), and **diffs the prompts word by word**. Branch pages show the same prompt diff against their parent. Starring an image **keeps** it; kept images are marked in the tree and collected in *Kept assets*.
- **Trade-off:** capped at four for legibility; no pixel-level tools (zoom sync, onion skin).
- **Benefit:** comparisons are explained, not just displayed — useful when justifying a choice to a client — and preferred versions are preserved instead of buried.

## 3. Features intentionally excluded

- **Node-based editing / branch merging.** Powerful but heavy; the tree covers the 90% case (where did this come from, take me back) without a second canvas.
- **Real AI integration.** The brief asks for a mocked backend. The mock is deterministic and honest: variations are pre-rendered grades/crops of the parent's scene, so continuity is demonstrable without pretending to generate.
- **Collaboration** (comments, shared cursors, approvals). Valuable for agencies, but it's a different product surface; the data model (flat, append-only generations with parents) would extend to it.
- **Inpainting, references, per-attribute sliders.** Kept the control surface small: prompt, model, ratio, count, and seed lock / negative prompt behind *Advanced*.
- **Full asset management** (folders, tags, export presets). *Kept assets* is the minimal version: the decisions you made, across branches.
- **Multiple projects.** The demo opens a single seeded project; the Projects menu says so rather than faking a list.

## 4. Inspiration — and where this differs

- **Figma:** selection-driven UI — select on the canvas, actions appear in context; quiet chrome so the work is the hero; a structural side panel. *Different:* the side panel is lineage, not layers, and there's no free canvas.
- **Cursor:** AI changes presented as reviewable diffs rather than silent replacements. That idea became the word-level prompt diff on branches and in Compare.
- **Krea:** fast, low-friction iteration where generating again is cheap. *Different:* each iteration is attached to a parent and an intent instead of joining a stream.
- **Higgsfield:** preset-driven creative controls and a results feed (Part A's mockup is in this family). *Different:* Part B replaces the feed with a tree and a single focused run.
- **Leonardo.ai:** per-image follow-up actions (e.g. variations from a result). *Different:* the follow-up states *what is kept*, and the relationship is recorded and navigable.

## 5. With another month

1. **Validate with users first.** Five to eight sessions with working art directors on a real brief: do the four intents match their mental model? Is "kept" the right primitive, or do they need "approved" vs. "maybe"?
2. **Persistence and sync.** Move projects from `localStorage` to a backend with optimistic updates; required for anything beyond a demo.
3. **Real generation pipeline.** Map intents to model controls (seed + prompt locking, image-to-image strength, ControlNet-style structure locks); stream partial results.
4. **Richer comparison.** Synced zoom/pan, A/B flicker, and "promote to hero" that pins a branch.
5. **Scale the tree.** Search and filter (by intent, kept), auto-collapse cold branches, and "jump to kept" — trees with 200+ runs need it.
6. **Collaboration.** Share a branch as a review link with comments per image.
7. **Accessibility pass with assistive tech.** Automated axe checks pass; next is testing the tree and compare with NVDA/VoiceOver users.

## 6. What differentiates the product?

**Creative Branching.** Most tools answer "show me more images." Fomi Studio answers "show me *this* image, but with different light" — and remembers that you asked.

- Every result can become a parent. Branching states what it **keeps** and what it **explores**, so continuity is the default instead of something you fight for in the prompt.
- The project is a **tree of decisions**, not a feed of outputs: you can see the path to the current image, step back to any ancestor, and compare across directions with the differences explained.
- **Kept** images turn exploration into a record of choices.

Another batch of images gives you more options. Continuity gives you *convergence* — fewer, better, consistent results, and a clear explanation of how you got them. For professionals working toward a brief, that's the scarcer thing.
