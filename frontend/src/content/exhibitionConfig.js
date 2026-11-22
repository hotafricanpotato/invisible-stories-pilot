// Add only approved story modules here. No placeholder narratives or final questions.
export const exhibitionConfig = {
  mode: "pilot",
  availableStoryIds: ["liza", "nikita"],
  storyOrder: ["liza", "nikita", "ilya"],
  // Temporary testing mode; switch to sequential when the full selection flow is ready.
  storyAccess: "independent",
  postStoriesPath: "/statistics/1",
  postStoriesLabel: "К невидимой статистике →",
  fullVersionStoryCount: 3,
  finalQuizEnabled: false,
  contentVersion: "pilot-1",
};
