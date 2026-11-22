export default function SceneNavigation({ start, end, total, onPrevious, onNext }) {
  return <nav className="scene-navigation" aria-label="Чтение сцены">
    <button type="button" disabled={start <= 1} onClick={onPrevious}>← Предыдущий фрагмент</button>
    <span role="status" aria-live="polite">Фрагмент {start === end ? end : `${start}–${end}`} из {total}</span>
    <button type="button" className="primary" disabled={end >= total}
      onKeyDown={event => { if (event.repeat && ["Enter", " "].includes(event.key)) event.preventDefault(); }}
      onClick={event => { if (event.detail <= 1) onNext(); }}>
      {end >= total ? "Сцена прочитана" : "Следующий фрагмент →"}
    </button>
  </nav>;
}
