// Add only approved story modules here. No placeholder narratives or final questions.
export const exhibitionConfig = {
  mode: "pilot",
  availableStoryIds: ["liza", "nikita", ...(import.meta.env?.VITE_ENABLE_ILYA_PREVIEW === "1" ? ["ilya"] : [])],
  storyOrder: ["liza", "nikita", "ilya"],
  storyAccess: "sequential",
  statisticsRequiredStoryIds: {
    pilot: ["liza", "nikita"],
    full: ["liza", "nikita", "ilya"],
  },
  postStoriesPath: "/stories",
  fullVersionStoryCount: 3,
  finalQuizEnabled: false,
  epilogueEnabled: false,
  contentVersion: "pilot-1",
};
