export default function StorySequence({ visible, total, onReveal, children }) {
  return (
    <section
      className="story-sequence"
      aria-label="Последовательное чтение сцены"
    >
      {children}
      {total > 1 && (
        <div className="sequence-controls">
          <p className="caption" role="status" aria-live="polite">
            Открыто фрагментов: {visible} из {total}
          </p>
          <button
            type="button"
            disabled={visible >= total}
            onKeyDown={(event) => {
              if (event.repeat && (event.key === "Enter" || event.key === " "))
                event.preventDefault();
            }}
            onClick={(event) => {
              if (event.detail <= 1) onReveal();
            }}
          >
            {visible >= total ? "Сцена прочитана" : "Продолжить чтение"}
          </button>
        </div>
      )}
    </section>
  );
}
