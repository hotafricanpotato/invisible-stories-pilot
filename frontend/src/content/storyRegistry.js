import ilya from "./ilya.json" with { type: "json" };
import ilyaPresentation from "./ilyaPresentation.js";
import { exhibitionConfig } from "./exhibitionConfig.js";
import liza from "./liza.json" with { type: "json" };
import lizaPresentation from "./lizaPresentation.js";
import nikita from "./nikita.json" with { type: "json" };

// Presentation belongs to the registry; approved scenario JSON stays untouched.
const nikitaPresentation = {
  archiveLabel: "ИСТОРИЯ 02 / КОГДА ВСЁ СПОКОЙНО",
  selection: {
    cover: "/assets/nikita/cover.jpg",
    alt: "Архивный коллаж истории Никиты",
    tag: "ДЕЛО 02 / НИКИТА, 14 ЛЕТ",
    description:
      "Один подросток, четыре повседневные сцены и то, что остаётся за кадром.",
    startLabel: "Начать историю Никиты →",
    continueLabel: "Продолжить историю Никиты →",
  },
  conclusionLabel: "ИСТОРИЯ 02 / ЗАКЛЮЧЕНИЕ",
  chatTitle: "Диалог с Димой",
  materialsCharacterName: "Никиты",
  mapIntroduction:
    "Вернитесь к трём эпизодам истории Никиты. Выберите наиболее обоснованную интерпретацию каждого из них.",
  noteLabel: "ЗАМЕТКИ / ТЕЛЕФОН НИКИТЫ",
  voiceLabel: "НЕОТПРАВЛЕННОЕ ГОЛОСОВОЕ / МАМЕ",
  theme: "nikita",
  sceneModes: { football: "mixed" },
  temporaryArtwork: true,
  artwork: {
    sunday: {
      src: "/assets/nikita/sunday.jpg",
      label: "АРХИВ / ВОСКРЕСЕНЬЕ",
      width: 587,
      height: 320,
    },
    messages_dima: {
      src: "/assets/nikita/messages.jpg",
      label: "АРХИВ / СООБЩЕНИЯ",
      width: 582,
      height: 480,
    },
    keys: {
      src: "/assets/story-design/nikita-keys-scene-desktop.webp",
      label: "АРХИВ / СРЕДА",
      width: 1920,
      height: 1080,
    },
    football: {
      src: "/assets/nikita/football.jpg",
      label: "АРХИВ / ПЯТНИЦА",
      width: 1122,
      height: 365,
    },
  },
};

export function sceneFragments(scene) {
  if (scene.fragments) return scene.fragments;
  const parts = [];
  const add = (kind, text) => {
    if (text) parts.push({ kind, text });
  };
  const messages = (items) =>
    items?.forEach((message) =>
      parts.push(
        message.type === "narration"
          ? { kind: "narration", text: message.text }
          : { kind: "message", message },
      ),
    );
  if (scene.type === "monologue") add("monologue", scene.text);
  else if (scene.type === "messages") {
    messages(scene.messages);
    add("narration", scene.narration);
    add("monologue", scene.monologue);
  } else {
    messages(scene.messages);
    add("monologue", scene.monologue_before);
    add("narration", scene.narration);
    add("monologue", scene.monologue_middle);
    messages(scene.dialogue);
    add("monologue", scene.monologue_after);
  }
  return parts;
}

export function defineStory(data, presentation = {}) {
  const scenes = data.stages.flatMap((stage) => stage.scenes ?? []);
  const materials =
    data.stages.find((stage) => stage.materials)?.materials ?? [];
  const questions =
    data.stages.find((stage) => stage.questions)?.questions ?? [];
  const conclusion = data.stages.find((stage) => stage.id === "conclusion");
  if (
    !data.id ||
    scenes.length === 0 ||
    scenes.some((scene) => sceneFragments(scene).length === 0) ||
    materials.length !== 3 ||
    questions.length !== 3 ||
    !conclusion
  )
    throw new Error(
      "A story requires an id, three materials, three questions and a conclusion",
    );
  // Preserve scenario stage order, including an approved final scene after the map.
  const steps = data.stages.flatMap((stage) => {
    if (stage.scenes)
      return stage.scenes.map((scene) => ({
        id: scene.id,
        kind: "scene",
        scene,
      }));
    if (stage.materials) return [{ id: "materials", kind: "materials" }];
    if (stage.questions) return [{ id: "map", kind: "map" }];
    if (stage.kind === "closing") return [{ id: stage.id, kind: "closing", content: stage }];
    if (stage.id === "conclusion")
      return [{ id: "conclusion", kind: "conclusion" }];
    throw new Error(`Unsupported stage: ${stage.id}`);
  });
  if (new Set(steps.map((step) => step.id)).size !== steps.length)
    throw new Error("Story step ids must be unique");
  return {
    ...data,
    scenes,
    materials,
    questions,
    conclusion,
    steps,
    presentation,
  };
}
export function createStoryRegistry(stories) {
  if (new Set(stories.map((story) => story.id)).size !== stories.length)
    throw new Error("Story ids must be unique");
  return Object.fromEntries(stories.map((story) => [story.id, story]));
}
// Add new approved definitions here only after their full scenarios are supplied.
const approvedDefinitions = createStoryRegistry([
  defineStory(liza, lizaPresentation),
  defineStory(nikita, nikitaPresentation),
  defineStory(ilya, ilyaPresentation),
]);
// Keep all approved modules in storage, even while local preview access is disabled.
export const storyRegistry = approvedDefinitions;

// Source indices stay stable for migration; adjacent chat messages form one UI step.
export function fragmentRange(scene, position, mode) {
  const parts = sceneFragments(scene);
  if (scene.type === "messages") return { start: 1, end: parts.length };
  let start = position, end = position;
  if (scene.type !== "fragments" && (scene.type !== "dialogue" || mode === "mixed")) {
    if (parts[position - 1]?.kind === "message") {
      while (start > 1 && parts[start - 2].kind === "message") start--;
      while (end < parts.length && parts[end].kind === "message") end++;
    }
  }
  return { start, end };
}
