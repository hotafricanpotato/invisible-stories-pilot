import { Choices, Note } from "./UI";
export default function InvisibleMap({ story, progress, onAnswer, onReveal }) {
  const qs = story.questions;
  const allAnswered = qs.every((q) => progress.answers[q.id]);
  return (
    <>
      <h1>{story.presentation.mapTitle ?? "Карта невидимого"}</h1>
      <p>{story.presentation.mapIntroduction}</p>
      <p className="caption">
        Здесь нет оценки вашей личности. Важно разобраться в ситуации.
      </p>
      {qs.map((q) => (
        <section className="map-question" key={q.id}>
          <h2>{q.title}</h2>
          <blockquote>«{q.fragment}»</blockquote>
          <p>Как можно интерпретировать этот эпизод?</p>
          {progress.revealed ? (
            <>
              <div className="answer-box">
                <div className="eyebrow">ВАШ ВЫБОР</div>
                <p>
                  {progress.answers[q.id]}. {q.options[progress.answers[q.id]]}
                </p>
              </div>
              <Note>
                <div className="eyebrow">
                  НАИБОЛЕЕ ОБОСНОВАННАЯ ИНТЕРПРЕТАЦИЯ
                </div>
                <p>
                  <strong>
                    {q.correct}. {q.options[q.correct]}
                  </strong>
                </p>
                <p>{q.explanation}</p>
              </Note>
            </>
          ) : (
            <Choices
              name={`map-${story.id}-${q.id}`}
              legend="Выберите один ответ"
              options={q.options}
              value={progress.answers[q.id]}
              onChange={(value) => onAnswer(q.id, value)}
            />
          )}
        </section>
      ))}
      {!progress.revealed ? (
        <>
          <p className="caption">
            {!allAnswered && "Выберите ответы во всех трёх эпизодах."}
          </p>
          <button
            className="primary"
            disabled={!allAnswered}
            onClick={onReveal}
          >
            Раскрыть связи
          </button>
        </>
      ) : (
        <p className="success">
          Вы рассмотрели три эпизода и раскрыли связанные с ними формы семейного
          неблагополучия.
        </p>
      )}
    </>
  );
}
