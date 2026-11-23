import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useExhibition } from "../state/Provider";
import test from "../content/finalTest.json";
export default function FinalTestPage() {
  const { questionId } = useParams();
  const { state, dispatch } = useExhibition();
  const nav = useNavigate();
  const title = useRef(null);
  const review = questionId === "review";
  const page = Number(questionId);
  const question = test.questions[page - 1];
  useEffect(() => {
    if (!review) dispatch({ type: "FINAL_VISIT", page });
    title.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [questionId, review, page, dispatch]);
  if (!review && !question) return null;
  const answers = state.finalTest.answers;
  return <article className="final-test" aria-labelledby="final-test-title">
    <header className="final-test-intro">
      <p className="final-test-index">{review ? "ИТОГОВЫЙ ТЕСТ · РАЗБОР" : `ВОПРОС ${String(page).padStart(2,"0")} / 05`}</p>
      <h1 id="final-test-title" tabIndex={-1} ref={title}>{review ? "Разбор ситуаций" : test.title}</h1>
      {!review && page === 1 && test.introduction.map(p => <p key={p}>{p}</p>)}
    </header>
    {review ? <div className="final-test-review">
      {test.questions.map((q,index) => <section className="final-review-entry" key={q.id} aria-labelledby={`review-${q.id}`}>
        <p className="final-test-index">СИТУАЦИЯ {String(index+1).padStart(2,"0")}</p>
        <h2 id={`review-${q.id}`}>«{q.title}»</h2>
        <p className="final-review-situation">{q.situation}</p>
        <p className="final-review-question">{q.question}</p>
        <dl><dt>Ваш ответ</dt><dd>{answers[q.id]}. {q.options[answers[q.id]]}</dd>
          <dt>Наиболее обоснованный вариант</dt><dd>{q.key}. {q.options[q.key]}</dd></dl>
        <p className="final-review-explanation">{q.explanation}</p>
      </section>)}
      <nav className="final-test-navigation" aria-label="Навигация после разбора">
        <button onClick={() => { dispatch({type:"FINAL_RESET"}); nav("/final-test/1"); }}>Пройти ещё раз</button>
        <button className="primary" onClick={() => nav("/complete")}>Завершить просмотр</button>
      </nav>
    </div> : <>
      <section className="final-test-situation" aria-labelledby="situation-title">
        <h2 id="situation-title">«{question.title}»</h2>
        <p>{question.situation}</p>
      </section>
      <fieldset className="final-test-choices">
        <legend>{question.question}</legend>
        {Object.entries(question.options).map(([key,text]) => <label key={key} className={answers[question.id] === key ? "is-selected" : ""}>
          <input type="radio" name={`final-${question.id}`} value={key} checked={answers[question.id] === key}
            onChange={() => dispatch({type:"FINAL_ANSWER",id:question.id,value:key})}/>
          <span className="final-answer-letter" aria-hidden="true">{key}</span><span>{text}</span>
        </label>)}
      </fieldset>
      <nav className="final-test-navigation" aria-label="Навигация по итоговому тесту">
        <button onClick={() => nav(page === 1 ? "/statistics/3" : `/final-test/${page-1}`)}>{page === 1 ? "Вернуться к статистике" : "Назад"}</button>
        <button className="primary" disabled={!answers[question.id]} onClick={() => {dispatch({type:"FINAL_NEXT",page});nav(page === 5 ? "/final-test/review" : `/final-test/${page+1}`);}}>{page === 5 ? "Перейти к разбору" : "Далее"}</button>
      </nav>
    </>}
  </article>;
}
