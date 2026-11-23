import DialogueMaterial from "./DialogueMaterial";
import SceneArtwork from "../story/SceneArtwork";
import { MaterialContent } from "../Story";
export default function MaterialViewer({ material, story, progress, onPosition, onClose }) {
  return <section className="material-viewer" aria-label={`Материал: ${material.title}`}
    onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
    {material.type === "dialogue" ? <DialogueMaterial material={material} story={story}
      position={progress.materialPositions[material.id]} onPosition={onPosition} onClose={onClose} /> : <>
      {story.presentation.materialCompletion === "read" && <SceneArtwork art={story.presentation.materialArtwork?.[material.id]} />}
      <MaterialContent material={material} story={story} />
    </>}
  </section>;
}
