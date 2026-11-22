import { exhibitionConfig } from "../content/exhibitionConfig.js";
import { useNavigate, useParams } from "react-router-dom";
import { storyRegistry, sceneFragments, fragmentRange } from "../content/storyRegistry.js";
import { useExhibition } from "../state/Provider";
import { storyPath, stepComplete } from "../state/model";
import { Scene } from "../components/Story";
import SceneNavigation from "../components/story/SceneNavigation";
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
  const nextStoryId = Object.keys(storyRegistry).find(id => id !== storyId && !state.stories[id].completed);
  const afterStoriesPath = exhibitionConfig.postStoriesPath;
  const nextStoryLabel = nextStoryId ? `К истории ${storyRegistry[nextStoryId].presentation.materialsCharacterName ?? storyRegistry[nextStoryId].character} →` : exhibitionConfig.postStoriesLabel;
  const goBack = () => nav(index ? storyPath(index - 1, storyId)
    : previousStoryId && exhibitionConfig.storyAccess !== "independent" ? storyPath(storyRegistry[previousStoryId].steps.length - 1, previousStoryId) : "/stories");
  const goForward = () => {
    if (last) {
      send("STORY_COMPLETE");
      nav(nextStoryId ? storyPath(state.stories[nextStoryId].unlocked, nextStoryId) : afterStoriesPath);
    } else {
      send("STORY_ADVANCE", { index });
      nav(storyPath(index + 1, storyId));
    }
  };
  const position = step.kind === "scene" ? p.currentFragments[step.id] : null;
  const range = step.kind === "scene"
    ? fragmentRange(step.scene, position, story.presentation.sceneModes?.[step.id]) : null;
  const total = step.kind === "scene" ? sceneFragments(step.scene).length : 0;
  return (
    <div className="story-design">
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
          {end.final_text && <div className="ending">
            <Paragraphs text={end.final_text} />
            {end.final_emphasis && (
              <p className="emphasis">{end.final_emphasis}</p>
            )}
          </div>}
        </>
      )}
      {step.kind === "closing" && <section className="ending story-closing">
        <h1>{step.content.title}</h1><Paragraphs text={step.content.text} />
      </section>}
      {step.kind === "scene" ? <>
        <SceneNavigation start={range.start} end={range.end} total={total}
          onPrevious={() => range.start > 1 ? send("READ_POSITION", { sceneId: step.id, position: range.start - 1 }) : goBack()}
          onNext={() => range.end < total ? send("READ_POSITION", { sceneId: step.id, position: range.end + 1 }) : goForward()}
          nextDisabled={range.end >= total && !stepComplete(story, p, index)} />
        {range.end < total && stepComplete(story, p, index) &&
          <button type="button" className="stage-shortcut" onClick={goForward}>К следующему этапу →</button>}
      </> : <Navigation back next disabled={!stepComplete(story, p, index)}
        onBack={goBack} onNext={goForward}
        nextLabel={step.kind === "materials" ? "К карте невидимого →"
          : step.kind === "map" ? "К заключению →"
          : last ? nextStoryLabel : "Далее →"} />}
    </div>
  );
}
