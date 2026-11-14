import { exhibitionConfig } from "../content/exhibitionConfig.js";
export const STORAGE_KEY = "invisible-stories:pilot:v1";
export const initialState = () => ({
  version: 1,
  contentVersion: exhibitionConfig.contentVersion,
  cursor: "/",
  quiz: { answers: {}, completed: false },
  nikita: {
    unlocked: 0,
    opened: [],
    active: null,
    answers: {},
    revealed: false,
    completed: false,
  },
  stats: {
    unlocked: 0,
    filter: "Все четыре",
    expanded: [],
    answer: null,
    revealed: false,
    completed: false,
  },
});
export const steps = [
  "sunday",
  "messages_dima",
  "keys",
  "football",
  "materials",
  "map",
  "conclusion",
];
export const storyPath = (i) => `/stories/nikita/${steps[i]}`;
export const quizPath = (i) => `/quiz/${i + 1}`;
export function reducer(s, a) {
  switch (a.type) {
    case "RESET":
      return initialState();
    case "CURSOR":
      return { ...s, cursor: a.path };
    case "QUIZ_ANSWER":
      return {
        ...s,
        quiz: { ...s.quiz, answers: { ...s.quiz.answers, [a.id]: a.value } },
      };
    case "QUIZ_COMPLETE":
      return Object.keys(s.quiz.answers).length === 5
        ? { ...s, quiz: { ...s.quiz, completed: true } }
        : s;
    case "STORY_ADVANCE": {
      const i = a.index;
      if (
        i !== s.nikita.unlocked ||
        i > 5 ||
        (i === 4 && s.nikita.opened.length < 3) ||
        (i === 5 && !s.nikita.revealed)
      )
        return s;
      return { ...s, nikita: { ...s.nikita, unlocked: i + 1 } };
    }
    case "MATERIAL":
      return {
        ...s,
        nikita: {
          ...s.nikita,
          active: s.nikita.active === a.id ? null : a.id,
          opened: [...new Set([...s.nikita.opened, a.id])],
        },
      };
    case "MAP_ANSWER":
      return s.nikita.revealed
        ? s
        : {
            ...s,
            nikita: {
              ...s.nikita,
              answers: { ...s.nikita.answers, [a.id]: a.value },
            },
          };
    case "MAP_REVEAL":
      return Object.keys(s.nikita.answers).length === 3
        ? { ...s, nikita: { ...s.nikita, revealed: true } }
        : s;
    case "STORY_COMPLETE":
      return s.nikita.unlocked === 6 && s.nikita.revealed
        ? { ...s, nikita: { ...s.nikita, completed: true } }
        : s;
    case "STATS_PATCH":
      return { ...s, stats: { ...s.stats, ...a.value } };
    case "STATS_ADVANCE":
      return a.index === s.stats.unlocked && a.index < 3
        ? { ...s, stats: { ...s.stats, unlocked: a.index + 1 } }
        : s;
    case "STATS_COMPLETE":
      return s.stats.unlocked === 3
        ? { ...s, stats: { ...s.stats, completed: true } }
        : s;
    default:
      return s;
  }
}
export function allowedPath(path, s) {
  if (path === "/") return path;
  if (/^\/quiz\/[1-5]$/.test(path)) {
    const i = Number(path.at(-1)) - 1;
    const first = [0, 1, 2, 3, 4].find((k) => !s.quiz.answers[k]);
    return first !== undefined && i > first ? quizPath(first) : path;
  }
  if (!s.quiz.completed)
    return quizPath([0, 1, 2, 3, 4].find((k) => !s.quiz.answers[k]) ?? 4);
  if (path === "/quiz/complete" || path === "/stories") return path;
  const i = steps.findIndex((x) => path === `/stories/nikita/${x}`);
  if (i >= 0)
    return i <= s.nikita.unlocked ? path : storyPath(s.nikita.unlocked);
  if (!s.nikita.completed) return storyPath(s.nikita.unlocked);
  const m = path.match(/^\/statistics\/([1-4])$/);
  if (m)
    return Number(m[1]) - 1 <= s.stats.unlocked
      ? path
      : `/statistics/${s.stats.unlocked + 1}`;
  if (path === "/complete")
    return s.stats.completed ? path : `/statistics/${s.stats.unlocked + 1}`;
  return "/";
}
export function restore(raw) {
  try {
    const s = JSON.parse(raw);
    if (
      s?.version !== 1 ||
      s.contentVersion !== exhibitionConfig.contentVersion
    )
      return initialState();
    const b = initialState();
    for (const [k, v] of Object.entries(s.quiz?.answers ?? {}))
      if (/^[0-4]$/.test(k) && ["A", "B", "C", "D"].includes(v))
        b.quiz.answers[k] = v;
    b.quiz.completed =
      s.quiz?.completed === true && Object.keys(b.quiz.answers).length === 5;
    b.nikita.opened = [
      ...new Set(
        (Array.isArray(s.nikita?.opened) ? s.nikita.opened : []).filter((x) =>
          ["dima_chat", "phone_note", "voice_message"].includes(x),
        ),
      ),
    ];
    b.nikita.active = b.nikita.opened.includes(s.nikita?.active)
      ? s.nikita.active
      : null;
    for (const [k, v] of Object.entries(s.nikita?.answers ?? {}))
      if (
        ["kitchen", "football", "unsent_message"].includes(k) &&
        ["A", "B", "C"].includes(v)
      )
        b.nikita.answers[k] = v;
    b.nikita.revealed =
      s.nikita?.revealed === true && Object.keys(b.nikita.answers).length === 3;
    b.nikita.unlocked = b.quiz.completed
      ? Math.max(
          0,
          Math.min(
            6,
            Number.isInteger(s.nikita?.unlocked) ? s.nikita.unlocked : 0,
          ),
        )
      : 0;
    if (b.nikita.opened.length < 3)
      b.nikita.unlocked = Math.min(4, b.nikita.unlocked);
    if (!b.nikita.revealed) b.nikita.unlocked = Math.min(5, b.nikita.unlocked);
    b.nikita.completed =
      s.nikita?.completed === true && b.nikita.unlocked === 6;
    b.stats.unlocked = b.nikita.completed
      ? Math.max(
          0,
          Math.min(
            3,
            Number.isInteger(s.stats?.unlocked) ? s.stats.unlocked : 0,
          ),
        )
      : 0;
    b.stats.completed =
      s.stats?.completed === true &&
      b.nikita.completed &&
      b.stats.unlocked === 3;
    b.stats.filter =
      s.stats?.filter === "Только нефизические"
        ? "Только нефизические"
        : "Все четыре";
    b.stats.expanded = (
      Array.isArray(s.stats?.expanded) ? s.stats.expanded : []
    ).filter((x) =>
      [
        "global",
        "eca",
        "connection-0",
        "connection-1",
        "connection-2",
      ].includes(x),
    );
    b.stats.answer = [0, 1, 2].includes(s.stats?.answer)
      ? s.stats.answer
      : null;
    b.stats.revealed = s.stats?.revealed === true && b.stats.answer !== null;
    b.cursor = typeof s.cursor === "string" ? allowedPath(s.cursor, b) : "/";
    return b;
  } catch {
    return initialState();
  }
}
