import test from "node:test";
import assert from "node:assert/strict";
import {
  allowedPath,
  initialState,
  reducer,
  restore,
  storyPath,
} from "../src/state/model.js";
const apply = (s, type, rest = {}) => reducer(s, { type, ...rest });
const quizDone = () => {
  let s = initialState();
  for (let i = 0; i < 5; i++)
    s = apply(s, "QUIZ_ANSWER", { id: i, value: "A" });
  return apply(s, "QUIZ_COMPLETE");
};
test("quiz cannot complete with missing answers or skip unanswered questions", () => {
  const s = initialState();
  assert.equal(apply(s, "QUIZ_COMPLETE").quiz.completed, false);
  for (const p of ["/quiz/5", "/stories", "/statistics/4", "/complete"])
    assert.equal(allowedPath(p, s), "/quiz/1");
});
test("all answers retained; quiz completion opens selection but no story skipping", () => {
  let s = quizDone();
  assert.equal(s.quiz.completed, true);
  assert.equal(allowedPath("/stories", s), "/stories");
  assert.equal(allowedPath(storyPath(6), s), storyPath(0));
  assert.equal(allowedPath("/complete", s), storyPath(0));
});
test("materials are unique and all required; map needs all answers and locks after reveal", () => {
  let s = quizDone();
  for (let i = 0; i < 4; i++) s = apply(s, "STORY_ADVANCE", { index: i });
  assert.equal(s.nikita.unlocked, 4);
  s = apply(s, "STORY_ADVANCE", { index: 4 });
  assert.equal(s.nikita.unlocked, 4);
  for (const id of ["dima_chat", "dima_chat", "phone_note", "voice_message"])
    s = apply(s, "MATERIAL", { id });
  assert.equal(s.nikita.opened.length, 3);
  s = apply(s, "STORY_ADVANCE", { index: 4 });
  assert.equal(s.nikita.unlocked, 5);
  s = apply(s, "MAP_REVEAL");
  assert.equal(s.nikita.revealed, false);
  for (const id of ["kitchen", "football", "unsent_message"])
    s = apply(s, "MAP_ANSWER", { id, value: "A" });
  s = apply(s, "STORY_ADVANCE", { index: 5 });
  assert.equal(s.nikita.unlocked, 5);
  s = apply(s, "MAP_REVEAL");
  const same = apply(s, "MAP_ANSWER", { id: "kitchen", value: "B" });
  assert.deepEqual(same, s);
  s = apply(s, "STORY_ADVANCE", { index: 5 });
  s = apply(s, "STORY_COMPLETE");
  assert.equal(s.nikita.completed, true);
  assert.equal(allowedPath("/statistics/4", s), "/statistics/1");
  assert.equal(allowedPath("/complete", s), "/statistics/1");
  for (let i = 0; i < 3; i++) s = apply(s, "STATS_ADVANCE", { index: i });
  assert.equal(allowedPath("/complete", s), "/statistics/4");
  s = apply(s, "STATS_COMPLETE");
  assert.equal(allowedPath("/complete", s), "/complete");
  assert.deepEqual(restore(JSON.stringify(s)), s);
  assert.deepEqual(apply(s, "RESET"), initialState());
});
test("storage rejects corruption and inconsistent progression", () => {
  for (const raw of [null, "broken", "{}", '{"version":2}'])
    assert.deepEqual(restore(raw), initialState());
  const s = initialState();
  s.nikita.unlocked = 6;
  s.nikita.completed = true;
  s.stats.completed = true;
  s.cursor = "/complete";
  const b = restore(JSON.stringify(s));
  assert.equal(b.nikita.completed, false);
  assert.equal(b.stats.completed, false);
  assert.equal(b.cursor, "/quiz/1");
});
