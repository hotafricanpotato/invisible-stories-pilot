import { materialComplete } from "../state/model";
import MaterialViewer from "./materials/MaterialViewer";
import { Note, Progress } from "./UI";
export default function StoryMaterials({ story, progress, onToggle, onPosition }) {
  const allOpened = story.materials.every((m) =>
    materialComplete(story, progress, m),
  );
  return (
    <>
      <h1>То, что осталось за кадром</h1>
      <p>
        Перед вами три материала из жизни{" "}
        {story.materialsCharacterName ??
          story.presentation.materialsCharacterName ??
          story.character}
        . Откройте каждый из них. Порядок не имеет значения.
      </p>
      <Progress
        current={story.materials.filter(m => materialComplete(story, progress, m)).length}
        total={story.materials.length}
        label="Изучено материалов"
      />
      {story.materials.map((m, index) => (
        <section className="material" key={m.id} onKeyDown={event => {
          if (event.key === "Escape" && progress.active === m.id) {
            event.stopPropagation(); onToggle(m.id);
            document.querySelector(`[aria-controls="material-${story.id}-${m.id}"]`)?.focus();
          }
        }}>
          <div className="material-heading">
            <div>
              <h2>{story.presentation.materialNumbering && `${String(index + 1).padStart(2, "0")} — `}{m.title}</h2>
              <p className="caption">{m.description}</p>
            </div>
            {materialComplete(story, progress, m) && (
              <span className="studied">✓ МАТЕРИАЛ ИЗУЧЕН</span>
            )}
          </div>
          <button
            className="disclosure"
            aria-expanded={progress.active === m.id}
            aria-controls={`material-${story.id}-${m.id}`}
            onClick={() => onToggle(m.id)}
          >
            {progress.active === m.id
              ? "Закрыть материал ↑"
              : "Открыть материал ↓"}
          </button>
          {progress.active === m.id && (
            <div id={`material-${story.id}-${m.id}`}>
              <MaterialViewer material={m} story={story} progress={progress} onPosition={(position) => onPosition(m.id, position)} onClose={() => { onToggle(m.id); document.querySelector(`[aria-controls="material-${story.id}-${m.id}"]`)?.focus(); }} />
            </div>
          )}
        </section>
      ))}
      <Note>
        {allOpened
          ? "Все три материала изучены."
          : story.presentation.materialCompletion === "read" ? "Чтобы продолжить, изучите все три материала и дочитайте диалоги." : "Чтобы продолжить, откройте все три материала."}
      </Note>
    </>
  );
}
