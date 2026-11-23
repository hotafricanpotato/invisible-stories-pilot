import { useLocation, useNavigate } from "react-router-dom";
import { exhibitionConfig } from "../content/exhibitionConfig.js";
import { storyCatalog } from "../content/storyCatalog.js";
import { storyRegistry } from "../content/storyRegistry.js";
import { canEnterStats, completionMessage, resumePath, storyStatus } from "../state/model.js";
import { useExhibition } from "../state/Provider";
import StoryCard from "../components/StoryCard";
export default function StorySelection() {
  const { state } = useExhibition();
  const nav = useNavigate();
  const location = useLocation();
  const message = completionMessage(state, location.state?.completedStoryId);
  const statsAvailable = canEnterStats(state);
  const entries = exhibitionConfig.storyOrder.map(id => storyCatalog.find(entry => entry.id === id)).filter(Boolean);
  return (
    <section className="story-selection" aria-labelledby="selection-title">
      <p className="eyebrow">ЛИЧНЫЙ АРХИВ / ИСТОРИИ</p>
      <h1 id="selection-title">Три истории. Три разных дома.</h1>
      <p className="selection-intro">Истории открываются последовательно. Завершите одну, чтобы перейти к следующей</p>
      {message && <div className="selection-notice">
        <p role="status">{message}</p>
        <button type="button" aria-label="Скрыть уведомление" onClick={() => nav("/stories", { replace: true, state: null })}>×</button>
      </div>}
      <div className="archive-story-grid">
        {entries.map((entry, index) => <StoryCard key={entry.id} entry={entry} number={index + 1}
          story={exhibitionConfig.availableStoryIds.includes(entry.id) ? storyRegistry[entry.id] : undefined} status={storyStatus(state, entry.id)}
          onOpen={() => nav(resumePath(state, entry.id))} />)}
      </div>
      <div className="selection-statistics">
        <button type="button" className="primary" disabled={!statsAvailable} aria-describedby="statistics-condition"
          onClick={() => nav("/statistics")}>Перейти к „Невидимой статистике“</button>
        <p id="statistics-condition">„Невидимая статистика“ откроется после прохождения всех трёх историй</p>
      </div>
      <button type="button" className="selection-back" onClick={() => nav("/")}>← На главную</button>
    </section>
  );
}
