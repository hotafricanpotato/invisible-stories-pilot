import { Scene } from "../Story";
import SceneNavigation from "../story/SceneNavigation";
export default function DialogueMaterial({ material, story, position, onPosition, onClose }) {
  // Use the existing scene renderer and reply controls without duplicating dialogue UI.
  const scene = { ...material, title: undefined, type: "fragments", time: undefined };
  const presentation = {...story.presentation, artwork: story.presentation.materialArtwork};
  return <div className="dialogue-material">
    {material.time && <p className="caption">{material.time}</p>}
    <Scene scene={scene} story={{...story, presentation}} position={position} onPosition={onPosition} />
    <SceneNavigation start={position} end={position} total={material.fragments.length}
      onPrevious={() => position > 1 ? onPosition(position - 1) : onClose()}
      onNext={() => position < material.fragments.length ? onPosition(position + 1) : onClose()} />
  </div>;
}
