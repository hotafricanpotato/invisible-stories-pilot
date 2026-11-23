import { sceneFragments } from "../src/content/storyRegistry.js";
export function finishStory(state, id, model, registry) {
  const story = registry[id];
  for (let index = 0; index < story.steps.length; index++) {
    const step = story.steps[index];
    if (step.kind === "scene") {
      while (model.fragmentCount(state.stories[id], step.scene) < sceneFragments(step.scene).length) {
        const next = model.reducer(state, { type: "REVEAL_FRAGMENT", storyId: id, sceneId: step.id });
        if (next === state) throw new Error(`Cannot advance ${id}/${step.id}`);
        state = next;
      }
    }
    if (step.kind === "materials") for (const material of story.materials)
      state = model.reducer(state, { type: "MATERIAL", storyId: id, id: material.id });
    if (step.kind === "map") {
      for (const question of story.questions)
        state = model.reducer(state, { type: "MAP_ANSWER", storyId: id, id: question.id, value: question.correct });
      state = model.reducer(state, { type: "MAP_REVEAL", storyId: id });
    }
    if (index < story.steps.length - 1)
      state = model.reducer(state, { type: "STORY_ADVANCE", storyId: id, index });
  }
  return model.reducer(state, { type: "STORY_COMPLETE", storyId: id });
}
