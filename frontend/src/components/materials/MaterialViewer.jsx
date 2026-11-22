import { MaterialContent } from "../Story";
export default function MaterialViewer({ material, story, onClose }) {
  return <section className="material-viewer" aria-label={`Материал: ${material.title}`}
    onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
    <MaterialContent material={material} story={story} />
  </section>;
}
