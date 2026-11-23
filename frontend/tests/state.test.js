import test from "node:test";
import assert from "node:assert/strict";
import { createExhibitionModel } from "../src/state/model.js";
import {
  storyRegistry,
  createStoryRegistry,
  defineStory,
  sceneFragments,
} from "../src/content/storyRegistry.js";
import { readFile } from "node:fs/promises";
const rawStory = JSON.parse(
  await readFile(
    new URL("../src/content/nikita.json", import.meta.url),
    "utf8",
  ),
);
const story = storyRegistry.nikita;
// Run the original pilot regression suite with its original single-story registry.
const { initialState, reducer, restore, allowedPath, storyPath, fragmentCount } = createExhibitionModel(createStoryRegistry([story]));
const apply = (s, type, rest = {}) =>
  reducer(s, { type, storyId: "nikita", ...rest });
const quizDone = (model = { initialState, reducer }) => {
  let s = model.initialState();
  for (let i = 0; i < 5; i++)
    s = model.reducer(s, { type: "QUIZ_ANSWER", id: i, value: "A" });
  return model.reducer(s, { type: "QUIZ_COMPLETE" });
};
function reachMaterials(
  s,
  model = { reducer, fragmentCount },
  id = "nikita",
  definition = story,
) {
  for (let i = 0; i < definition.scenes.length; i++) {
    const scene = definition.scenes[i];
    while (
      model.fragmentCount(s.stories[id], scene) < sceneFragments(scene).length
    )
      s = model.reducer(s, {
        type: "REVEAL_FRAGMENT",
        storyId: id,
        sceneId: scene.id,
      });
    s = model.reducer(s, { type: "STORY_ADVANCE", storyId: id, index: i });
  }
  return s;
}
function finishStory(
  s,
  model = { reducer, fragmentCount },
  id = "nikita",
  definition = story,
) {
  s = reachMaterials(s, model, id, definition);
  for (const m of definition.materials)
    s = model.reducer(s, { type: "MATERIAL", storyId: id, id: m.id });
  s = model.reducer(s, {
    type: "STORY_ADVANCE",
    storyId: id,
    index: definition.scenes.length,
  });
  for (const q of definition.questions)
    s = model.reducer(s, {
      type: "MAP_ANSWER",
      storyId: id,
      id: q.id,
      value: Object.keys(q.options)[0],
    });
  s = model.reducer(s, { type: "MAP_REVEAL", storyId: id });
  s = model.reducer(s, {
    type: "STORY_ADVANCE",
    storyId: id,
    index: definition.scenes.length + 1,
  });
  return model.reducer(s, { type: "STORY_COMPLETE", storyId: id });
}

test("archived quiz is optional; old URLs redirect to selection", () => {
  const s = initialState();
  assert.equal(apply(s, "QUIZ_COMPLETE").quiz.completed, false);
  for (const p of ["/quiz/1", "/quiz/5", "/quiz/complete", "/stories", "/statistics/4", "/complete"])
    assert.equal(allowedPath(p, s), "/stories");
  assert.equal(allowedPath(storyPath(0), s), storyPath(0));
  assert.equal(allowedPath(storyPath(6), s), storyPath(0));
  assert.equal(allowedPath("/stories/missing/map", s), "/stories");
  assert.deepEqual(apply(s, "QUIZ_ANSWER", { id: "bad", value: "Z" }), s);
});
test("one action reveals exactly one fragment; unread scenes cannot be skipped", () => {
  let s = quizDone();
  s = apply(s, "STORY_ADVANCE", { index: 0 });
  const scene = story.scenes[1];
  assert.equal(fragmentCount(s.stories.nikita, scene), 1);
  assert.equal(
    apply(s, "STORY_ADVANCE", { index: 1 }).stories.nikita.unlocked,
    1,
  );
  s = apply(s, "REVEAL_FRAGMENT", { sceneId: scene.id });
  assert.equal(fragmentCount(s.stories.nikita, scene), 2);
  assert.equal(
    fragmentCount(restore(JSON.stringify(s)).stories.nikita, scene),
    2,
  );
  const unchanged = apply(s, "REVEAL_FRAGMENT", {
    sceneId: story.scenes[3].id,
  });
  assert.deepEqual(unchanged, s);
  while (fragmentCount(s.stories.nikita, scene) < sceneFragments(scene).length)
    s = apply(s, "REVEAL_FRAGMENT", { sceneId: scene.id });
  assert.deepEqual(apply(s, "REVEAL_FRAGMENT", { sceneId: scene.id }), s);
  s = apply(s, "STORY_ADVANCE", { index: 1 });
  assert.equal(s.stories.nikita.unlocked, 2);
  const counts = s.stories.nikita.revealedFragments;
  s = apply(s, "CURSOR", { path: storyPath(1) });
  assert.deepEqual(s.stories.nikita.revealedFragments, counts);
});
test("all materials required, repeat opening is safe, invalid ids ignored", () => {
  let s = reachMaterials(quizDone());
  assert.equal(s.stories.nikita.unlocked, 4);
  assert.equal(
    apply(s, "STORY_ADVANCE", { index: 4 }).stories.nikita.unlocked,
    4,
  );
  for (const id of ["dima_chat", "dima_chat", "phone_note", "voice_message"])
    s = apply(s, "MATERIAL", { id });
  assert.equal(s.stories.nikita.opened.length, 3);
  assert.equal(s.stories.nikita.active, "voice_message");
  assert.deepEqual(apply(s, "MATERIAL", { id: "unknown" }), s);
  s = apply(s, "MATERIAL", { id: "voice_message" });
  assert.equal(s.stories.nikita.active, null);
  assert.equal(s.stories.nikita.opened.length, 3);
  s = apply(s, "STORY_ADVANCE", { index: 4 });
  assert.equal(s.stories.nikita.unlocked, 5);
  assert.deepEqual(restore(JSON.stringify(s)), s);
});
test("map can change before reveal, locks after reveal and never contributes to quiz", () => {
  let s = reachMaterials(quizDone());
  for (const m of story.materials) s = apply(s, "MATERIAL", { id: m.id });
  s = apply(s, "STORY_ADVANCE", { index: 4 });
  assert.equal(apply(s, "MAP_REVEAL").stories.nikita.revealed, false);
  for (const q of story.questions)
    s = apply(s, "MAP_ANSWER", { id: q.id, value: "A" });
  s = apply(s, "MAP_ANSWER", { id: "kitchen", value: "B" });
  assert.equal(s.stories.nikita.answers.kitchen, "B");
  assert.deepEqual(apply(s, "MAP_ANSWER", { id: "kitchen", value: "Z" }), s);
  assert.equal(
    apply(s, "STORY_ADVANCE", { index: 5 }).stories.nikita.unlocked,
    5,
  );
  const quiz = s.quiz;
  s = apply(s, "MAP_REVEAL");
  assert.deepEqual(apply(s, "MAP_ANSWER", { id: "kitchen", value: "C" }), s);
  assert.deepEqual(s.quiz, quiz);
});
test("complete pilot, statistics, storage roundtrip and reset", () => {
  let s = finishStory(quizDone());
  assert.equal(s.stories.nikita.completed, true);
  assert.equal(allowedPath("/statistics/4", s), "/statistics/1");
  for (let i = 0; i < 3; i++) s = apply(s, "STATS_ADVANCE", { index: i });
  assert.equal(allowedPath("/complete", s), "/statistics/4");
  s = apply(s, "STATS_COMPLETE");
  assert.equal(allowedPath("/complete", s), "/complete");
  assert.deepEqual(restore(JSON.stringify(s)), s);
  assert.deepEqual(apply(s, "RESET"), initialState());
});
test("v1 migration retains completed pilot, quiz, materials, map and statistics", () => {
  const modern = finishStory(quizDone());
  const legacy = {
    ...modern,
    version: 1,
    nikita: { ...modern.stories.nikita },
  };
  delete legacy.stories;
  delete legacy.nikita.revealedFragments;
  delete legacy.nikita.currentStepId;
  legacy.cursor = "/complete";
  legacy.stats = {
    ...legacy.stats,
    unlocked: 3,
    completed: true,
    filter: "Только нефизические",
    expanded: ["global"],
    answer: 1,
    revealed: true,
  };
  const b = restore(JSON.stringify(legacy));
  assert.equal(b.version, 6);
  assert.deepEqual(b.quiz, legacy.quiz);
  assert.equal(b.stories.nikita.completed, true);
  assert.deepEqual(b.stories.nikita.opened, legacy.nikita.opened);
  assert.deepEqual(b.stories.nikita.answers, legacy.nikita.answers);
  assert.deepEqual(b.stats, legacy.stats);
  assert.equal(b.cursor, "/complete");
  for (const scene of story.scenes)
    assert.equal(
      fragmentCount(b.stories.nikita, scene),
      sceneFragments(scene).length,
    );
});
test("v1 migration marks already-visible scene text read without unlocking new scenes", () => {
  const legacy = {
    version: 1,
    contentVersion: "pilot-1",
    quiz: quizDone().quiz,
    nikita: {
      unlocked: 2,
      opened: [],
      answers: {},
      revealed: false,
      completed: false,
    },
    cursor: storyPath(2),
  };
  const b = restore(JSON.stringify(legacy));
  assert.equal(b.stories.nikita.unlocked, 2);
  assert.equal(b.cursor, storyPath(2));
  for (const scene of story.scenes.slice(0, 3))
    assert.equal(
      fragmentCount(b.stories.nikita, scene),
      sceneFragments(scene).length,
    );
  assert.equal(fragmentCount(b.stories.nikita, story.scenes[3]), 1);
});
test("corrupt state cannot grant access or create unknown answers", () => {
  for (const raw of [
    null,
    "broken",
    "{}",
    '{"version":3}',
    JSON.stringify({ ...initialState(), contentVersion: "unknown" }),
  ])
    assert.deepEqual(restore(raw), initialState());
  const s = quizDone();
  s.stories.nikita = {
    ...s.stories.nikita,
    unlocked: 99,
    completed: true,
    revealed: true,
    opened: ["bad"],
    answers: { bad: "A" },
    revealedFragments: { keys: 999, football: -3 },
  };
  s.stats.completed = true;
  s.cursor = "/complete";
  const b = restore(JSON.stringify(s));
  assert.equal(b.stories.nikita.completed, false);
  assert.equal(b.stories.nikita.unlocked, 1);
  assert.equal(b.stats.completed, false);
  assert.deepEqual(b.stories.nikita.opened, []);
  assert.deepEqual(b.stories.nikita.answers, {});
  assert.equal(fragmentCount(b.stories.nikita, story.scenes[3]), 1);
});
test("independent stories with the same scene/material/question ids do not share progress", () => {
  // Test-only duplicate of the existing approved data; no new narratives or production stories.
  const copy = defineStory({ ...structuredClone(rawStory), id: "test-copy" });
  const registry = createStoryRegistry([story, copy]);
  const model = createExhibitionModel(registry);
  let s = quizDone(model);
  assert.equal(
    model.allowedPath(model.storyPath(0, "test-copy"), s),
    "/stories",
  );
  s = finishStory(s, model);
  const first = structuredClone(s.stories.nikita);
  s = model.reducer(s, {
    type: "STORY_ADVANCE",
    storyId: "test-copy",
    index: 0,
  });
  s = model.reducer(s, {
    type: "REVEAL_FRAGMENT",
    storyId: "test-copy",
    sceneId: "messages_dima",
  });
  assert.deepEqual(s.stories.nikita, first);
  assert.equal(s.stories["test-copy"].revealedFragments.messages_dima, 2);
  assert.equal(s.stories["test-copy"].completed, false);
  assert.deepEqual(s.stories["test-copy"].opened, []);
  assert.deepEqual(s.stories["test-copy"].answers, {});
  assert.equal(
    model.allowedPath("/statistics/1", s),
    "/stories",
  );
  assert.deepEqual(model.restore(JSON.stringify(s)), s);
  s = finishStory(s, model, "test-copy", copy);
  assert.equal(model.allowedPath("/statistics/1", s), "/statistics/1");
});
test("scene fragment adapter preserves exact approved event order and paragraphs", () => {
  const scene = story.scenes[3];
  const parts = sceneFragments(scene);
  assert.deepEqual(
    parts.map((p) => p.kind),
    [
      "message",
      "monologue",
      "narration",
      "monologue",
      "message",
      "message",
      "monologue",
    ],
  );
  assert.equal(parts[0].message, scene.messages[0]);
  assert.equal(parts[1].text, scene.monologue_before);
  assert.equal(parts[2].text, scene.narration);
  assert.equal(parts[3].text, scene.monologue_middle);
  assert.equal(parts[4].message, scene.dialogue[0]);
  assert.equal(parts[6].text, scene.monologue_after);
});

test("unknown prototype-like route ids and actions cannot crash or create a story", () => {
  const s = quizDone();
  for (const id of ["constructor", "toString", "__proto__"]) {
    assert.equal(allowedPath(`/stories/${id}/map`, s), "/stories");
    assert.deepEqual(reducer(s, { type: "STORY_COMPLETE", storyId: id }), s);
  }
});

test("stage order and gates also support a final scene after the educational conclusion", () => {
  // Reorder only existing approved test data, without inventing dialogue or shipping a new story.
  const data = structuredClone(rawStory);
  data.id = "test-ending";
  const scene = data.stages[1].scenes.pop();
  data.stages.push({ id: "ending", scenes: [scene] });
  const definition = defineStory(data);
  const model = createExhibitionModel(createStoryRegistry([definition]));
  assert.deepEqual(
    definition.steps.map((s) => s.id),
    [
      "sunday",
      "messages_dima",
      "keys",
      "materials",
      "map",
      "conclusion",
      "football",
    ],
  );
  let s = quizDone(model);
  for (let i = 0; i < definition.steps.length; i++) {
    const step = definition.steps[i];
    if (step.kind === "scene") {
      if (i === definition.steps.length - 1)
        assert.equal(
          model.reducer(s, { type: "STORY_COMPLETE", storyId: data.id })
            .stories[data.id].completed,
          false,
        );
      while (
        model.fragmentCount(s.stories[data.id], step.scene) <
        sceneFragments(step.scene).length
      )
        s = model.reducer(s, {
          type: "REVEAL_FRAGMENT",
          storyId: data.id,
          sceneId: step.id,
        });
    }
    if (step.kind === "materials")
      for (const m of definition.materials)
        s = model.reducer(s, { type: "MATERIAL", storyId: data.id, id: m.id });
    if (step.kind === "map") {
      for (const q of definition.questions)
        s = model.reducer(s, {
          type: "MAP_ANSWER",
          storyId: data.id,
          id: q.id,
          value: q.correct,
        });
      s = model.reducer(s, { type: "MAP_REVEAL", storyId: data.id });
    }
    if (i < definition.steps.length - 1)
      s = model.reducer(s, {
        type: "STORY_ADVANCE",
        storyId: data.id,
        index: i,
      });
  }
  s = model.reducer(s, { type: "STORY_COMPLETE", storyId: data.id });
  assert.equal(s.stories[data.id].completed, true);
  assert.deepEqual(model.restore(JSON.stringify(s)), s);
});


test("v2 migration retains reached position and v3 back navigation never loses progress", () => {
  let s = reachMaterials(quizDone());
  s.version = 2;
  delete s.stories.nikita.currentFragments;
  s = restore(JSON.stringify(s));
  assert.equal(s.stories.nikita.currentFragments.keys, 10);
  const reached = s.stories.nikita.revealedFragments.keys;
  s = apply(s, "READ_POSITION", { sceneId: "keys", position: 2 });
  assert.equal(s.stories.nikita.currentFragments.keys, 2);
  assert.equal(s.stories.nikita.revealedFragments.keys, reached);
  assert.equal(s.stories.nikita.unlocked, 4);
  assert.deepEqual(restore(JSON.stringify(s)), s);
});

test("reading position guards prevent skipping scenes; complete chats preserve source counts", () => {
  let s = quizDone();
  assert.deepEqual(apply(s, "READ_POSITION", { sceneId: "keys", position: 2 }), s);
  s = apply(s, "STORY_ADVANCE", { index: 0 });
  s = apply(s, "READ_POSITION", { sceneId: "messages_dima", position: 1 });
  assert.equal(s.stories.nikita.revealedFragments.messages_dima, 4);
  s = apply(s, "STORY_ADVANCE", { index: 1 });
  assert.deepEqual(apply(s, "READ_POSITION", { sceneId: "keys", position: 9 }), s);
  s = apply(s, "READ_POSITION", { sceneId: "keys", position: 2 });
  assert.equal(s.stories.nikita.currentFragments.keys, 2);
  assert.equal(s.stories.nikita.revealedFragments.keys, 2);
  s = apply(s, "READ_POSITION", { sceneId: "keys", position: 1 });
  assert.equal(s.stories.nikita.revealedFragments.keys, 2);
});
