// Add only approved story modules here. No placeholder narratives or unapproved questions.
export const exhibitionConfig = {
  mode: "full",
  availableStoryIds: ["liza", "nikita", "ilya"],
  storyOrder: ["liza", "nikita", "ilya"],
  storyAccess: "sequential",
  statisticsRequiredStoryIds: {
    pilot: ["liza", "nikita"],
    full: ["liza", "nikita", "ilya"],
  },
  postStoriesPath: "/stories",
  fullVersionStoryCount: 3,
  finalQuizEnabled: true,
  epilogueEnabled: true,
  contentVersion: "pilot-1",
};
