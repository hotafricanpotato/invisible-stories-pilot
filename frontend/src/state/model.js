import { exhibitionConfig } from "../content/exhibitionConfig.js";
import { storyRegistry, sceneFragments, fragmentRange } from "../content/storyRegistry.js";
export const STORAGE_KEY = "invisible-stories:pilot:v1";
const blankStory = (story) => ({
  unlocked: 0,
  currentStepId: story.steps[0].id,
  opened: [],
  active: null,
  answers: {},
  revealed: false,
  completed: false,
  currentFragments: Object.fromEntries(story.scenes.map((scene) => [scene.id, 1])),
  revealedFragments: Object.fromEntries(
    story.scenes.map((scene) => [scene.id, 1]),
  ),
});
const count = (value, max) =>
  Number.isInteger(value) ? Math.max(1, Math.min(max, value)) : 1;
export const quizPath = (i) => `/quiz/${i + 1}`;

export function createExhibitionModel(registry) {
  const ids = Object.keys(registry);
  const initialState = () => ({
    version: 3,
    contentVersion: exhibitionConfig.contentVersion,
    cursor: "/",
    quiz: { answers: {}, completed: false },
    stories: Object.fromEntries(
      ids.map((id) => [id, blankStory(registry[id])]),
    ),
    stats: {
      unlocked: 0,
      filter: "Все четыре",
      expanded: [],
      answer: null,
      revealed: false,
      completed: false,
    },
  });
  const storyPath = (index, id = ids[0]) =>
    `/stories/${id}/${registry[id].steps[index].id}`;
  const canEnter = (s, id) =>
    s.quiz.completed &&
    ids
      .slice(0, ids.indexOf(id))
      .every((previous) => s.stories[previous].completed);
  const allStoriesComplete = (s) => ids.every((id) => s.stories[id].completed);
  const fragmentCount = (progress, scene) =>
    count(progress.revealedFragments[scene.id], sceneFragments(scene).length);
  const stepComplete = (story, progress, index) => {
    const step = story.steps[index];
    if (step.kind === "scene")
      return (
        fragmentCount(progress, step.scene) >= sceneFragments(step.scene).length
      );
    if (step.kind === "materials")
      return story.materials.every((m) => progress.opened.includes(m.id));
    if (step.kind === "map") return progress.revealed;
    return true;
  };
  function reducer(s, a) {
    if (a.type === "RESET") return initialState();
    if (a.type === "CURSOR") {
      if (allowedPath(a.path, s) !== a.path) return s;
      const match = a.path.match(/^\/stories\/([^/]+)\/([^/]+)$/);
      return {
        ...s,
        cursor: a.path,
        ...(match && Object.hasOwn(registry, match[1])
          ? {
              stories: {
                ...s.stories,
                [match[1]]: { ...s.stories[match[1]], currentStepId: match[2] },
              },
            }
          : {}),
      };
    }
    if (a.type === "QUIZ_ANSWER")
      return /^[0-4]$/.test(String(a.id)) &&
        ["A", "B", "C", "D"].includes(a.value)
        ? {
            ...s,
            quiz: {
              ...s.quiz,
              answers: { ...s.quiz.answers, [a.id]: a.value },
            },
          }
        : s;
    if (a.type === "QUIZ_COMPLETE")
      return Object.keys(s.quiz.answers).length === 5
        ? { ...s, quiz: { ...s.quiz, completed: true } }
        : s;
    if (a.type === "STATS_PATCH")
      return { ...s, stats: { ...s.stats, ...a.value } };
    if (a.type === "STATS_ADVANCE")
      return allStoriesComplete(s) &&
        a.index === s.stats.unlocked &&
        a.index < 3
        ? { ...s, stats: { ...s.stats, unlocked: a.index + 1 } }
        : s;
    if (a.type === "STATS_COMPLETE")
      return allStoriesComplete(s) && s.stats.unlocked === 3
        ? { ...s, stats: { ...s.stats, completed: true } }
        : s;
    if (!Object.hasOwn(registry, a.storyId)) return s;
    const story = registry[a.storyId];
    if (!canEnter(s, story.id)) return s;
    const p = s.stories[story.id];
    const update = (patch) => ({
      ...s,
      stories: { ...s.stories, [story.id]: { ...p, ...patch } },
    });
    switch (a.type) {
      case "READ_POSITION": {
        const index = story.steps.findIndex(step => step.kind === "scene" && step.id === a.sceneId);
        if (index < 0 || index > p.unlocked || !Number.isInteger(a.position)) return s;
        const scene = story.steps[index].scene;
        const max = sceneFragments(scene).length;
        if (a.position < 1 || a.position > max || a.position > fragmentCount(p, scene) + 1) return s;
        const range = fragmentRange(scene, a.position, story.presentation.sceneModes?.[scene.id]);
        const reached = Math.max(fragmentCount(p, scene), range.end);
        if (p.currentFragments[scene.id] === a.position && p.revealedFragments[scene.id] === reached) return s;
        return update({
          currentFragments: { ...p.currentFragments, [scene.id]: a.position },
          revealedFragments: { ...p.revealedFragments, [scene.id]: reached },
        });
      }
      case "REVEAL_FRAGMENT": {
        const index = story.steps.findIndex(
          (step) => step.id === a.sceneId && step.kind === "scene",
        );
        if (index < 0 || index > p.unlocked) return s;
        const scene = story.steps[index].scene;
        const visible = fragmentCount(p, scene);
        if (visible >= sceneFragments(scene).length) return s;
        return update({
          currentFragments: { ...p.currentFragments, [scene.id]: visible + 1 },
          revealedFragments: {
            ...p.revealedFragments,
            [scene.id]: visible + 1,
          },
        });
      }
      case "STORY_ADVANCE":
        return a.index === p.unlocked &&
          a.index < story.steps.length - 1 &&
          stepComplete(story, p, a.index)
          ? update({ unlocked: a.index + 1 })
          : s;
      case "MATERIAL":
        return p.unlocked >=
          story.steps.findIndex((step) => step.kind === "materials") &&
          story.materials.some((m) => m.id === a.id)
          ? update({
              active: p.active === a.id ? null : a.id,
              opened: [...new Set([...p.opened, a.id])],
            })
          : s;
      case "MAP_ANSWER": {
        const q = story.questions.find((q) => q.id === a.id);
        return !p.revealed &&
          p.unlocked >= story.steps.findIndex((step) => step.kind === "map") &&
          q &&
          Object.hasOwn(q.options, a.value)
          ? update({ answers: { ...p.answers, [a.id]: a.value } })
          : s;
      }
      case "MAP_REVEAL":
        return p.unlocked >=
          story.steps.findIndex((step) => step.kind === "map") &&
          story.questions.every((q) =>
            Object.hasOwn(q.options, p.answers[q.id]),
          )
          ? update({ revealed: true })
          : s;
      case "STORY_COMPLETE":
        return p.unlocked === story.steps.length - 1 &&
          p.revealed &&
          stepComplete(story, p, p.unlocked)
          ? update({ completed: true })
          : s;
      default:
        return s;
    }
  }
  function allowedPath(path, s) {
    if (path === "/") return path;
    if (/^\/quiz\/[1-5]$/.test(path)) {
      const first = [0, 1, 2, 3, 4].find((i) => !s.quiz.answers[i]);
      return first !== undefined && Number(path.at(-1)) - 1 > first
        ? quizPath(first)
        : path;
    }
    if (!s.quiz.completed)
      return quizPath([0, 1, 2, 3, 4].find((i) => !s.quiz.answers[i]) ?? 4);
    if (path === "/quiz/complete" || path === "/stories") return path;
    const match = path.match(/^\/stories\/([^/]+)\/([^/]+)$/);
    if (match && Object.hasOwn(registry, match[1])) {
      const id = match[1];
      const index = registry[id].steps.findIndex(
        (step) => step.id === match[2],
      );
      if (index < 0) return "/stories";
      if (!canEnter(s, id)) {
        const first = ids.find((id) => !s.stories[id].completed);
        return storyPath(s.stories[first].unlocked, first);
      }
      return index <= s.stories[id].unlocked
        ? path
        : storyPath(s.stories[id].unlocked, id);
    }
    if (match) return "/stories";
    if (!allStoriesComplete(s)) {
      const first = ids.find((id) => !s.stories[id].completed);
      return storyPath(s.stories[first].unlocked, first);
    }
    const stat = path.match(/^\/statistics\/([1-4])$/);
    if (stat)
      return Number(stat[1]) - 1 <= s.stats.unlocked
        ? path
        : `/statistics/${s.stats.unlocked + 1}`;
    if (path === "/complete")
      return s.stats.completed ? path : `/statistics/${s.stats.unlocked + 1}`;
    return "/";
  }
  function restore(raw) {
    try {
      const input = JSON.parse(raw);
      if (
        ![1, 2, 3].includes(input?.version) ||
        input.contentVersion !== exhibitionConfig.contentVersion
      )
        return initialState();
      const b = initialState();
      for (const [k, v] of Object.entries(input.quiz?.answers ?? {}))
        if (/^[0-4]$/.test(k) && ["A", "B", "C", "D"].includes(v))
          b.quiz.answers[k] = v;
      b.quiz.completed =
        input.quiz?.completed === true &&
        Object.keys(b.quiz.answers).length === 5;
      for (const id of ids) {
        const story = registry[id];
        const saved =
          input.version === 1
            ? id === "nikita"
              ? input.nikita
              : null
            : input.stories?.[id];
        if (!saved) continue;
        const p = b.stories[id];
        const opened = Array.isArray(saved.opened) ? saved.opened : [];
        p.opened = [
          ...new Set(
            opened.filter((id) => story.materials.some((m) => m.id === id)),
          ),
        ];
        p.active = p.opened.includes(saved.active) ? saved.active : null;
        for (const q of story.questions)
          if (Object.hasOwn(q.options, saved.answers?.[q.id]))
            p.answers[q.id] = saved.answers[q.id];
        p.revealed =
          saved.revealed === true &&
          story.questions.every((q) => Object.hasOwn(p.answers, q.id));
        p.unlocked =
          canEnter(b, id) && Number.isInteger(saved.unlocked)
            ? Math.max(0, Math.min(story.steps.length - 1, saved.unlocked))
            : 0;
        for (const scene of story.scenes) {
          const index = story.steps.findIndex((step) => step.id === scene.id);
          const max = sceneFragments(scene).length;
          // In v1 all text on visited scene screens was already visible.
          p.revealedFragments[scene.id] =
            input.version === 1 && canEnter(b, id) && index <= p.unlocked
              ? max
              : count(saved.revealedFragments?.[scene.id], max);
          p.currentFragments[scene.id] = input.version === 3
            ? count(saved.currentFragments?.[scene.id], p.revealedFragments[scene.id])
            : p.revealedFragments[scene.id];
        }
        for (let index = 0; index < p.unlocked; index++)
          if (!stepComplete(story, p, index)) {
            p.unlocked = index;
            break;
          }
        p.completed =
          saved.completed === true &&
          p.unlocked === story.steps.length - 1 &&
          p.revealed &&
          stepComplete(story, p, p.unlocked);
        p.currentStepId =
          story.steps.findIndex((step) => step.id === saved.currentStepId) <=
            p.unlocked &&
          story.steps.some((step) => step.id === saved.currentStepId)
            ? saved.currentStepId
            : story.steps[p.unlocked].id;
      }
      const stats = input.stats ?? {};
      b.stats.unlocked =
        allStoriesComplete(b) && Number.isInteger(stats.unlocked)
          ? Math.max(0, Math.min(3, stats.unlocked))
          : 0;
      b.stats.completed =
        stats.completed === true &&
        allStoriesComplete(b) &&
        b.stats.unlocked === 3;
      b.stats.filter =
        stats.filter === "Только нефизические"
          ? "Только нефизические"
          : "Все четыре";
      b.stats.expanded = (
        Array.isArray(stats.expanded) ? stats.expanded : []
      ).filter((x) =>
        [
          "global",
          "eca",
          "connection-0",
          "connection-1",
          "connection-2",
        ].includes(x),
      );
      b.stats.answer = [0, 1, 2].includes(stats.answer) ? stats.answer : null;
      b.stats.revealed = stats.revealed === true && b.stats.answer !== null;
      b.cursor =
        typeof input.cursor === "string" ? allowedPath(input.cursor, b) : "/";
      return b;
    } catch {
      return initialState();
    }
  }
  return {
    initialState,
    reducer,
    allowedPath,
    restore,
    storyPath,
    fragmentCount,
    stepComplete,
    allStoriesComplete,
  };
}
export const {
  initialState,
  reducer,
  allowedPath,
  restore,
  storyPath,
  fragmentCount,
  stepComplete,
  allStoriesComplete,
} = createExhibitionModel(storyRegistry);
