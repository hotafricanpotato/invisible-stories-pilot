import data from "../content/statistics.json";
import { useExhibition } from "../state/Provider";
import { Choices, Note, Source } from "../components/UI";
const txt = (key, i) => data[key][i].text;
export default function Statistics({ index }) {
  const { state, dispatch } = useExhibition();
  const s = state.stats;
  const patch = (value) => dispatch({ type: "STATS_PATCH", value });
  const toggle = (id) =>
    patch({
      expanded: s.expanded.includes(id)
        ? s.expanded.filter((x) => x !== id)
        : [...s.expanded, id],
    });
  const key = ["russia", "world", "limits", "connection"][index];
  return (
    <>
      <div className="eyebrow">{txt(key, 0)}</div>
      <h1>{txt(key, 1)}</h1>
      {index === 0 && (
        <>
          <p className="lead">{txt(key, 2)}</p>
          <p className="caption">{txt(key, 3)}</p>
          <fieldset className="filter">
            <legend>Показать формы</legend>
            {["Все четыре", "Только нефизические"].map((x) => (
              <label key={x}>
                <input
                  type="radio"
                  name="russian-filter"
                  checked={s.filter === x}
                  onChange={() => patch({ filter: x })}
                />
                {x}
              </label>
            ))}
          </fieldset>
          {data.values
            .filter(
              ([name]) =>
                s.filter === "Все четыре" ||
                ["Психологическое", "Экономическое"].includes(name),
            )
            .map(([name, value]) => (
              <div className="stat-bar" key={name}>
                <div>
                  <span>{name}</span>
                  <strong>{String(value).replace(".", ",")}%</strong>
                </div>
                <div className="track">
                  <div
                    style={{
                      width: `${value}%`,
                      background: ["Психологическое", "Экономическое"].includes(
                        name,
                      )
                        ? "var(--accent)"
                        : "#75818e",
                    }}
                  />
                </div>
              </div>
            ))}
          <Note>
            <strong>Что важно?</strong>
            <p>{txt(key, 4).replace(/^Что важно\?/, "")}</p>
          </Note>
          <Source
            name="Российский научный фонд, проект СПбГУ"
            url={data.sources.russia}
            detail="Аннотация результатов исследования за 2024 год."
          />
        </>
      )}
      {index === 1 && (
        <>
          <p>{txt(key, 2)}</p>
          <div className="world-grid">
            {data.data.map(([id, heading, num, description, detail, url]) => (
              <section className="document" key={id}>
                <div className="eyebrow">{heading}</div>
                <div className="stat-number">{num}</div>
                <p>{description}</p>
                <button
                  className="disclosure"
                  aria-expanded={s.expanded.includes(id)}
                  aria-controls={`detail-${id}`}
                  onClick={() => toggle(id)}
                >
                  {s.expanded.includes(id)
                    ? "Скрыть пояснение ↑"
                    : "Что именно измеряли? ↓"}
                </button>
                {s.expanded.includes(id) && (
                  <Note>
                    <p id={`detail-${id}`}>{detail}</p>
                  </Note>
                )}
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Открыть первоисточник ↗
                </a>
              </section>
            ))}
          </div>
          <p className="caption">{txt(key, 3)}</p>
        </>
      )}
      {index === 2 && (
        <>
          <p className="lead">{txt(key, 2)}</p>
          <Choices
            name="limits"
            showLetters={false}
            legend="Выберите наиболее обоснованный вывод:"
            options={Object.fromEntries(
              data.limitOptions.map((x, i) => [String(i), x]),
            )}
            value={s.answer === null ? null : String(s.answer)}
            onChange={(v) => patch({ answer: Number(v) })}
          />
          <button
            className="primary"
            disabled={s.answer === null}
            onClick={() => patch({ revealed: true })}
          >
            Раскрыть объяснение
          </button>
          {s.revealed && (
            <>
              <Note>
                <strong>Что остаётся невидимым?</strong>
                <p>{txt(key, 3).replace(/^Что остаётся невидимым\?/, "")}</p>
              </Note>
              <p className="caption">{txt(key, 4)}</p>
            </>
          )}
          <Source
            name="UNICEF — Where we live and learn"
            url={data.sources.eca}
            detail="Разделы о пробелах, качестве и сопоставимости данных, 2025 год."
          />
        </>
      )}
      {index === 3 && (
        <>
          <p className="lead">{txt(key, 2)}</p>
          {data.connections.map(([label, text], i) => (
            <section className="connection" key={label}>
              <button
                className="disclosure"
                aria-expanded={s.expanded.includes(`connection-${i}`)}
                onClick={() => toggle(`connection-${i}`)}
              >
                {label}
                <span aria-hidden="true">
                  {s.expanded.includes(`connection-${i}`) ? "−" : "+"}
                </span>
              </button>
              {s.expanded.includes(`connection-${i}`) && <p>{text}</p>}
            </section>
          ))}
          <Note>
            <strong>Главный вывод</strong>
            <p>{txt(key, 3).replace(/^Главный вывод/, "")}</p>
          </Note>
          <p className="success">{txt(key, 4)}</p>
          <p className="caption">{txt(key, 5)}</p>
        </>
      )}
    </>
  );
}
