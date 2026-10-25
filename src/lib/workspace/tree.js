// Pure helpers that derive the branch structure from a flat list of
// generations. Storing a flat list (each item knows its parent) keeps updates
// trivial; the tree is recomputed on render, which is cheap at this scale.

/** Indexes generations for O(1) lookups. `number` is the user-facing G1, G2… label. */
export function indexGenerations(generations) {
  const byId = new Map();
  const number = new Map();
  const children = new Map();
  const childrenOfImage = new Map();
  const imageIndex = new Map();

  generations.forEach((g, i) => {
    byId.set(g.generationId, g);
    number.set(g.generationId, i + 1);
    g.images.forEach((image, index) => imageIndex.set(image.id, { generation: g, image, index }));
  });

  for (const g of generations) {
    const parent = g.parentGenerationId;
    if (parent && byId.has(parent)) {
      children.set(parent, [...(children.get(parent) ?? []), g]);
      childrenOfImage.set(g.parentImageId, [...(childrenOfImage.get(g.parentImageId) ?? []), g]);
    }
  }

  return { byId, number, children, childrenOfImage, imageIndex };
}

/** Ids from the root down to `id` (inclusive). */
export function lineage(index, id) {
  const path = [];
  let current = index.byId.get(id);
  while (current) {
    path.unshift(current.generationId);
    current = current.parentGenerationId ? index.byId.get(current.parentGenerationId) : null;
  }
  return path;
}

/**
 * Depth-first rows for the branch panel. `guides[d]` says whether the
 * connector at depth d continues below this row (an ancestor has a later sibling).
 */
export function flattenTree(generations, index, collapsed = {}) {
  const rows = [];
  const visit = (g, depth, guides, isLast) => {
    const kids = index.children.get(g.generationId) ?? [];
    rows.push({ generation: g, depth, guides, isLast, childCount: kids.length });
    if (collapsed[g.generationId]) return;
    kids.forEach((child, i) => visit(child, depth + 1, [...guides, !isLast], i === kids.length - 1));
  };
  const roots = generations.filter((g) => !g.parentGenerationId || !index.byId.has(g.parentGenerationId));
  roots.forEach((root, i) => visit(root, 0, [], i === roots.length - 1));
  return rows;
}

/** Counts every descendant of a generation. */
export function descendantCount(index, id) {
  const kids = index.children.get(id) ?? [];
  return kids.reduce((n, k) => n + 1 + descendantCount(index, k.generationId), 0);
}

/**
 * Word-level diff (LCS) between two prompts, used to show exactly what changed
 * between a parent and its branch. Returns [{ text, type: "same"|"added"|"removed" }].
 */
export function diffWords(before, after) {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  const push = (text, type) => {
    const last = out.at(-1);
    if (last?.type === type) last.text += text;
    else out.push({ text, type });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push(a[i], "same");
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) push(a[i++], "removed");
    else push(b[j++], "added");
  }
  while (i < a.length) push(a[i++], "removed");
  while (j < b.length) push(b[j++], "added");
  return out;
}
