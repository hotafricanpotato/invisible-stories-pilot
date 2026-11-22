import { useNavigate, useParams } from "react-router-dom";
import { storyRegistry } from "../content/storyRegistry.js";
import { useExhibition } from "../state/Provider";
import { storyPath, stepComplete } from "../state/model";
import { Scene } from "../components/Story";
import StoryMaterials from "../components/StoryMaterials";
import InvisibleMap from "../components/InvisibleMap";
import { Navigation, Progress, Paragraphs } from "../components/UI";
export default function StoryPage() {
  const { storyId, stepId } = useParams();
  const { state, dispatch } = useExhibition();
  const nav = useNavigate();
  const story = storyRegistry[storyId];
  if (!story) return null;
  const index = story.steps.findIndex((step) => step.id === stepId);
  if (index < 0) return null;
  const p = state.stories[storyId];
  const step = story.steps[index];
  const end = story.conclusion;
  const send = (type, data = {}) => dispatch({ type, storyId, ...data });
  const last = index === story.steps.length - 1;
  const previousStoryId =
    Object.keys(storyRegistry)[Object.keys(storyRegistry).indexOf(storyId) - 1];
  const nextStoryId =
    Object.keys(storyRegistry)[Object.keys(storyRegistry).indexOf(storyId) + 1];
  return (
    <div className={step.kind === "scene" || step.kind === "materials" ? "story-design" : undefined} data-story-theme={story.presentation.theme ?? story.id}>
      <div className="eyebrow">
        {story.presentation.archiveLabel ?? story.title}
      </div>
      <Progress current={index + 1} total={story.steps.length} label="Этап" />
      {step.kind === "scene" && (
        <Scene
          scene={step.scene}
          story={story}
          position={p.currentFragments[step.scene.id]}
          onPosition={(position) => send("READ_POSITION", { sceneId: step.scene.id, position })}
        />
      )}
      {step.kind === "materials" && (
        <StoryMaterials
          story={story}
          progress={p}
          onToggle={(id) => send("MATERIAL", { id })}
        />
      )}
      {step.kind === "map" && (
        <InvisibleMap
          story={story}
          progress={p}
          onAnswer={(id, value) => send("MAP_ANSWER", { id, value })}
          onReveal={() => send("MAP_REVEAL")}
        />
      )}
      {step.kind === "conclusion" && (
        <>
          <div className="eyebrow">
            {story.presentation.conclusionLabel ?? end.title}
          </div>
          <h1>{end.title}</h1>
          <p className="lead">{end.introduction}</p>
          {end.factors && (
            <div className="factor-grid">
              {end.factors.map((f, i) => (
                <article key={f.title}>
                  <div className="eyebrow">
                    ФАКТОР {String(i + 1).padStart(2, "0")}
                  </div>
                  <h2>{f.title}</h2>
                  <p>{f.text}</p>
                </article>
              ))}
            </div>
          )}
          <div className="ending">
            <Paragraphs text={end.final_text} />
            {end.final_emphasis && (
              <p className="emphasis">{end.final_emphasis}</p>
            )}
          </div>
        </>
      )}
      <Navigation
        back
        backLabel={step.kind === "scene" ? "← Предыдущий этап" : "← Назад"}
        next
        disabled={!stepComplete(story, p, index)}
        onBack={() =>
          nav(
            index
              ? storyPath(index - 1, storyId)
              : previousStoryId
                ? storyPath(
                    storyRegistry[previousStoryId].steps.length - 1,
                    previousStoryId,
                  )
                : "/stories",
          )
        }
        nextLabel={
          step.kind === "materials"
            ? "К карте невидимого →"
            : step.kind === "map"
              ? "К заключению →"
              : last
                ? nextStoryId
                  ? "К следующей истории →"
                  : "К невидимой статистике →"
                : "Далее →"
        }
        onNext={() => {
          if (last) {
            send("STORY_COMPLETE");
            nav(nextStoryId ? storyPath(0, nextStoryId) : "/statistics/1");
          } else {
            send("STORY_ADVANCE", { index });
            nav(storyPath(index + 1, storyId));
          }
        }}
      />
    </div>
  );
}
