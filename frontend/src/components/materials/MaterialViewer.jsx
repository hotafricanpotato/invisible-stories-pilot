import { MaterialContent } from "../Story";
export default function MaterialViewer({ material, story, onClose }) {
  return <section className="material-viewer" aria-label={`Материал: ${material.title}`}
    onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
    <header className="material-viewer-heading">
      <h3>{material.title}</h3>
      <button type="button" onClick={onClose}>Закрыть материал</button>
    </header>
    <MaterialContent material={material} story={story} />
  </section>;
}
