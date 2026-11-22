export default function SceneNavigation({ start, end, total, onPrevious, onNext, nextDisabled = false }) {
  return <nav className="scene-navigation" aria-label="Навигация по истории">
    <button type="button" onClick={onPrevious}>← Назад</button>
    <span role="status" aria-live="polite">Фрагмент {start === end ? end : `${start}–${end}`} из {total}</span>
    <button type="button" className="primary" disabled={nextDisabled}
      onKeyDown={event => { if (event.repeat && ["Enter", " "].includes(event.key)) event.preventDefault(); }}
      onClick={event => { if (event.detail <= 1) onNext(); }}>Далее →</button>
  </nav>;
}
