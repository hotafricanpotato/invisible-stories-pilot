import { assetUrl } from "../utils/assetUrl";
export default function StoryCard({ entry, number, story, status, onOpen }) {
  const cover = story?.presentation.selection?.cover ?? story?.presentation.artwork?.introduction?.src;
  const locked = status === "Недоступна";
  const label = status === "Пройдена" ? "Посмотреть снова" : status === "В процессе" ? "Продолжить" : "Начать историю";
  return (
    <article className="archive-story-card" data-story-theme={entry.theme} aria-labelledby={`card-${entry.id}`}>
      <div className="archive-card-art">
        {cover ? <img src={assetUrl(cover)}
          alt={story.presentation.selection.alt ?? story.presentation.artwork?.introduction?.label} /> : <div className="archive-card-pending" aria-hidden="true">03 / АРХИВ<br />В ПОДГОТОВКЕ</div>}
      </div>
      <div className="archive-card-body">
        <p className="eyebrow">ИСТОРИЯ {String(number).padStart(2, "0")}</p>
        <h2 id={`card-${entry.id}`}>{entry.name}</h2>
        <p className="archive-card-title">«{entry.title}»</p>
        <p className="archive-card-status">{status}</p>
        <p className="archive-card-hint" id={`hint-${entry.id}`}>
          {!story ? "История в разработке" : locked ? "Сначала завершите предыдущую историю" : status === "Пройдена" ? "Можно вернуться к любому пройденному этапу" : status === "В процессе" ? "Продолжите с сохранённого места" : "Откройте дело выставки"}
        </p>
        <button type="button" disabled={locked} aria-describedby={`hint-${entry.id}`} onClick={onOpen}>
          {locked ? "Недоступна" : label}
        </button>
      </div>
    </article>
  );
}
