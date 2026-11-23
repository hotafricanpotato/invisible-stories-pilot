import { storyCatalog } from "../content/storyCatalog.js";
import { exhibitionConfig } from "../content/exhibitionConfig.js";
import { storyRegistry, sceneFragments, fragmentRange } from "../content/storyRegistry.js";
export const STORAGE_KEY = "invisible-stories:pilot:v1";
const blankStory = (story) => ({
  started: false,
  unlocked: 0,
  currentStepId: story.steps[0].id,
  opened: [],
  active: null,
  answers: {},
  revealed: false,
  completed: false,
  ...(story.materials.some(m => m.type === "dialogue") ? {
    materialPositions: Object.fromEntries(story.materials.filter(m => m.type === "dialogue").map(m => [m.id, 1])),
    reachedMaterialPositions: Object.fromEntries(story.materials.filter(m => m.type === "dialogue").map(m => [m.id, 1])),
  } : {}),
  currentFragments: Object.fromEntries(story.scenes.map((scene) => [scene.id, 1])),
  revealedFragments: Object.fromEntries(
    story.scenes.map((scene) => [scene.id, 1]),
  ),
});
const count = (value, max) =>
  Number.isInteger(value) ? Math.max(1, Math.min(max, value)) : 1;
export const quizPath = (i) => `/quiz/${i + 1}`;

export function createExhibitionModel(registry, options = {}) {
  const ids = Object.keys(registry);
  const initialState = () => ({
    version: 6,
    contentVersion: exhibitionConfig.contentVersion,
    cursor: "/",
    legacyStoryAccess: [],
    legacyStatsAccess: false,
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
  const order = options.storyOrder ?? ids;
  const requiredIds = options.statisticsRequiredStoryIds?.[options.mode]
    ?? (options.mode === "full" ? order : ids);
  const canEnter = (s, id) => Object.hasOwn(registry, id) && order.includes(id) &&
    (!options.availableStoryIds || options.availableStoryIds.includes(id)) && (
    s.stories[id]?.completed === true ||
    order.slice(0, order.indexOf(id)).every(previous => s.stories[previous]?.completed === true)
  );
  const allStoriesComplete = (s) => requiredIds.length > 0 && requiredIds.every(
    id => Object.hasOwn(registry, id) && s.stories[id]?.completed === true,
  );
  const canEnterStats = allStoriesComplete;
  const storyStatus = (s, id) => {
    if (!canEnter(s, id)) return "Недоступна";
    if (s.stories[id].completed) return "Пройдена";
    return s.stories[id].started ? "В процессе" : "Доступна";
  };
  const resumePath = (s, id) => {
    const index = registry[id].steps.findIndex(step => step.id === s.stories[id].currentStepId);
    return storyPath(index >= 0 ? index : s.stories[id].unlocked, id);
  };
  const completionMessage = (s, id) => {
    if (!s.stories[id]?.completed) return null;
    const nextId = order[order.indexOf(id) + 1];
    if (nextId && canEnter(s, nextId))
      return `История ${registry[id].presentation.materialsCharacterName ?? registry[id].character} завершена. Теперь доступна история ${registry[nextId].presentation.materialsCharacterName ?? registry[nextId].character}`;
    if (canEnterStats(s)) return `История ${storyCatalog.find(entry => entry.id === id)?.genitive ?? id} завершена. Теперь доступен раздел «Невидимая статистика»`;
    return "История завершена. Следующая история находится в разработке";
  };
  const fragmentCount = (progress, scene) =>
    count(progress.revealedFragments[scene.id], sceneFragments(scene).length);
  const materialComplete = (story, progress, material) =>
    progress.opened.includes(material.id) && (story.presentation.materialCompletion !== "read" || material.type !== "dialogue" ||
      count(progress.reachedMaterialPositions?.[material.id], material.fragments.length) >= material.fragments.length);
  const stepComplete = (story, progress, index) => {
    const step = story.steps[index];
    if (step.kind === "scene")
      return (
        fragmentCount(progress, step.scene) >= sceneFragments(step.scene).length
      );
    if (step.kind === "materials")
      return story.materials.every((m) => materialComplete(story, progress, m));
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
                [match[1]]: { ...s.stories[match[1]], currentStepId: match[2], started: true },
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
      return canEnterStats(s) &&
        a.index === s.stats.unlocked &&
        a.index < 3
        ? { ...s, stats: { ...s.stats, unlocked: a.index + 1 } }
        : s;
    if (a.type === "STATS_COMPLETE")
      return canEnterStats(s) && s.stats.unlocked === 3
        ? { ...s, stats: { ...s.stats, completed: true } }
        : s;
    if (!Object.hasOwn(registry, a.storyId)) return s;
    const story = registry[a.storyId];
    if (!canEnter(s, story.id)) return s;
    const p = s.stories[story.id];
    const update = (patch) => ({
      ...s,
      stories: { ...s.stories, [story.id]: { ...p, started: true, ...patch } },
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
      case "MATERIAL_POSITION": {
        const m = story.materials.find(m => m.id === a.id && m.type === "dialogue");
        if (!m || p.active !== m.id || !p.opened.includes(m.id) ||
          p.unlocked < story.steps.findIndex(step => step.kind === "materials") || !Number.isInteger(a.position)) return s;
        const reached = count(p.reachedMaterialPositions?.[m.id], m.fragments.length);
        if (a.position < 1 || a.position > m.fragments.length || a.position > reached + 1) return s;
        if (p.materialPositions?.[m.id] === a.position && reached >= a.position) return s;
        return update({
          materialPositions: {...p.materialPositions, [m.id]: a.position},
          reachedMaterialPositions: {...p.reachedMaterialPositions, [m.id]: Math.max(reached, a.position)},
        });
      }
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
    if (path === "/stories") return path;
    if (path.startsWith("/quiz/")) return "/stories";
    const match = path.match(/^\/stories\/([^/]+)\/([^/]+)$/);
    if (match && Object.hasOwn(registry, match[1])) {
      const id = match[1];
      const index = registry[id].steps.findIndex(
        (step) => step.id === match[2],
      );
      if (index < 0) return "/stories";
      if (!canEnter(s, id)) return "/stories";
      return index <= s.stories[id].unlocked
        ? path
        : storyPath(s.stories[id].unlocked, id);
    }
    if (match) return "/stories";
    if ((path.startsWith("/statistics/") || path === "/complete") && !canEnterStats(s)) return "/stories";
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
        ![1, 2, 3, 4, 5, 6].includes(input?.version) ||
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
      if (b.quiz.completed) {
        b.legacyStoryAccess = input.version < 4 && ids.includes("liza") && !input.stories?.liza
          ? ids.filter(id => id === "nikita")
          : (Array.isArray(input.legacyStoryAccess) ? input.legacyStoryAccess : []).filter(id => ids.includes(id));
      }
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
          Number.isInteger(saved.unlocked)
            ? Math.max(0, Math.min(story.steps.length - 1, saved.unlocked))
            : 0;
        for (const scene of story.scenes) {
          const index = story.steps.findIndex((step) => step.id === scene.id);
          const max = sceneFragments(scene).length;
          // In v1 all text on visited scene screens was already visible.
          p.revealedFragments[scene.id] =
            input.version === 1 && index <= p.unlocked
              ? max
              : count(saved.revealedFragments?.[scene.id], max);
          p.currentFragments[scene.id] = input.version >= 3
            ? count(saved.currentFragments?.[scene.id], p.revealedFragments[scene.id])
            : p.revealedFragments[scene.id];
        }
        for (const material of story.materials.filter(m => m.type === "dialogue")) {
          p.reachedMaterialPositions[material.id] = count(saved.reachedMaterialPositions?.[material.id], material.fragments.length);
          p.materialPositions[material.id] = count(saved.materialPositions?.[material.id], p.reachedMaterialPositions[material.id]);
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
        p.started = saved.started === true || p.completed || p.unlocked > 0 || p.opened.length > 0 ||
          Object.keys(p.answers).length > 0 || Object.values(p.revealedFragments).some(n => n > 1) ||
          (typeof input.cursor === "string" && input.cursor.startsWith(`/stories/${id}/`)) || false;
      }
      const stats = input.stats ?? {};
      b.legacyStatsAccess = b.quiz.completed && b.stories.nikita?.completed === true && (
        (input.version < 4 && ids.includes("liza") && !input.stories?.liza) || input.legacyStatsAccess === true
      );
      b.stats.unlocked =
        Number.isInteger(stats.unlocked)
          ? Math.max(0, Math.min(3, stats.unlocked))
          : 0;
      b.stats.completed =
        stats.completed === true &&
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
    materialComplete,
    allStoriesComplete,
    canEnter,
    canEnterStats,
    storyStatus,
    resumePath,
    completionMessage,
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
  materialComplete,
  allStoriesComplete,
  canEnter,
  canEnterStats,
  storyStatus,
  resumePath,
  completionMessage,
} = createExhibitionModel(storyRegistry, exhibitionConfig);
