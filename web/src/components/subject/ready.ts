// Menus only list topics that are built: unbuilt ones are hidden, and so is any chapter
// left with no topics (the full map of each subject still lives in its topics.ts).

type Readyable = { ready: boolean }

export function readyTopics<S extends { topics: readonly Readyable[] }>(sections: readonly S[]): S[] {
  return sections
    .map((s) => ({ ...s, topics: s.topics.filter((t) => t.ready) }))
    .filter((s) => s.topics.length > 0)
}
