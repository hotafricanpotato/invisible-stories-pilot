import { useNavigate, useParams } from "react-router-dom";
import questions from "../content/initialQuiz.json";
import nikita from "../content/nikita.json";
import { useExhibition } from "../state/Provider";
import { quizPath, storyPath, steps } from "../state/model";
import {
  Choices,
  Navigation,
  Note,
  Paragraphs,
  Progress,
} from "../components/UI";
import { Scene, MaterialContent } from "../components/Story";
import Statistics from "./Statistics";
export function Home() {
  const { state } = useExhibition();
  const nav = useNavigate();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">ИНТЕРАКТИВНАЯ ВЫСТАВКА / 2026</p>
          <div className="hero-index">
            ДЕЛО № 01 <span>◌</span>
          </div>
          <h1>
            НЕВИДИМЫЕ
            <br />
            <span>ИСТОРИИ.</span>
          </h1>
          <p className="hero-lead">
            Не всё, что происходит в семье, видно со стороны.
          </p>
          <p className="hero-detail">
            За привычными словами и обычными семейными фотографиями могут
            скрываться переживания, о которых никто не спрашивает.
          </p>
          <button
            className="primary"
            onClick={() => nav(state.cursor === "/" ? "/quiz/1" : state.cursor)}
          >
            {state.cursor === "/"
              ? "Начать выставку →"
              : "Продолжить выставку →"}
          </button>
          <p className="caption">
            Одна история. Несколько точек зрения.
            <br />
            То, что легко не заметить.
          </p>
        </div>
        <figure className="hero-image">
          <img
            src="/assets/nikita/cover.jpg"
            alt="Архивный художественный коллаж о повседневной жизни подростка"
            width="1122"
            height="1402"
          />
          <figcaption>ЛИЧНЫЙ АРХИВ / ХУДОЖЕСТВЕННАЯ РЕКОНСТРУКЦИЯ</figcaption>
        </figure>
      </section>
      <section className="intro">
        <div className="eyebrow">КАК УСТРОЕНА ВЫСТАВКА</div>
        <h2>
          Сначала — история.
          <br />
          Затем — то, что скрыто.
        </h2>
        <div className="intro-grid">
          {[
            [
              "01 / УСЛЫШАТЬ",
              "История Никиты",
              "Познакомьтесь с героем и взгляните на его повседневную жизнь.",
            ],
            [
              "02 / ЗАМЕТИТЬ",
              "Скрытые детали",
              "Откройте обстоятельства, которые не видны при первом знакомстве.",
            ],
            [
              "03 / ОСМЫСЛИТЬ",
              "Данные и контекст",
              "Сопоставьте личную историю с проверенными социальными данными.",
            ],
          ].map(([n, t, p]) => (
            <article key={n}>
              <div className="eyebrow">{n}</div>
              <h3>{t}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
      <Note>
        <p>
          Пилотная версия: сейчас доступна одна законченная история и общий
          раздел статистики. Остальные истории и итоговое тестирование ещё
          разрабатываются. Тема может быть эмоционально непростой — прохождение
          можно прекратить в любой момент.
        </p>
      </Note>
      <p className="caption">
        Ответы сохраняются только в текущей вкладке браузера и не отправляются
        на сервер. После закрытия вкладки прогресс может быть потерян.
      </p>
    </>
  );
}
export function Quiz() {
  const { questionId } = useParams();
  const i = Number(questionId) - 1;
  const q = questions[i];
  const { state, dispatch } = useExhibition();
  const nav = useNavigate();
  if (!q) return null;
  const answer = state.quiz.answers[i];
  return (
    <>
      <div className="eyebrow">ПЕРВОНАЧАЛЬНАЯ ПРОВЕРКА ВОСПРИЯТИЯ</div>
      <h1>Как вы воспринимаете эти ситуации?</h1>
      <p>
        Здесь нет необходимости спешить. Выберите вариант, который кажется вам
        наиболее обоснованным.
      </p>
      <Progress current={i + 1} total={5} label="Вопрос" />
      <section className="situation">
        <div className="eyebrow">СИТУАЦИЯ {String(i + 1).padStart(2, "0")}</div>
        <h2>«{q.title}»</h2>
        <Paragraphs text={q.situation} />
      </section>
      <div className="question-callout">
        <div className="eyebrow">ВОПРОС</div>
        <h2>{q.question}</h2>
      </div>
      <Choices
        name={`quiz-${i}`}
        legend="Выберите один вариант ответа:"
        options={q.options}
        value={answer}
        onChange={(v) => dispatch({ type: "QUIZ_ANSWER", id: i, value: v })}
      />
      <Navigation
        back
        next
        disabled={!answer}
        onBack={() => nav(i ? quizPath(i - 1) : "/")}
        nextLabel={i === 4 ? "Завершить проверку →" : "Далее →"}
        onNext={() => {
          if (i === 4) {
            dispatch({ type: "QUIZ_COMPLETE" });
            nav("/quiz/complete");
          } else nav(quizPath(i + 1));
        }}
      />
    </>
  );
}
export function Transition() {
  const nav = useNavigate();
  return (
    <>
      <div className="eyebrow">ПЕРВЫЙ ЭТАП ЗАВЕРШЁН</div>
      <h1>Первое впечатление обманчиво.</h1>
      <p className="lead">
        Вы познакомились с пятью ситуациями, в которых не всё так однозначно,
        как может показаться на первый взгляд.
      </p>
      <Note>
        <p>
          Ваши ответы сохранены в текущей вкладке. В пилотной версии сравнение
          ответов до и после выставки пока недоступно.
        </p>
      </Note>
      <p className="success">5 из 5 вопросов пройдено</p>
      <p className="caption">
        Это количество пройденных вопросов, а не правильных ответов.
      </p>
      <p>
        Следующий этап — история Никиты о том, что часто остаётся незамеченным.
      </p>
      <Navigation
        back
        next
        onBack={() => nav("/quiz/5")}
        onNext={() => nav("/stories")}
        nextLabel="Перейти к истории →"
      />
    </>
  );
}
export function Selection() {
  const nav = useNavigate();
  const { state } = useExhibition();
  return (
    <>
      <div className="eyebrow">ЛИЧНЫЙ АРХИВ / ДОСТУПНОЕ ДЕЛО</div>
      <h1>Истории · тестовая версия</h1>
      <p>
        Для первого пользовательского тестирования доступна история Никиты. Две
        другие истории находятся в разработке.
      </p>
      <article className="story-card">
        <img
          src="/assets/nikita/cover.jpg"
          alt="Архивный коллаж истории Никиты"
        />
        <div>
          <div className="eyebrow">ДЕЛО 01 / НИКИТА, 14 ЛЕТ</div>
          <h2>Когда всё спокойно</h2>
          <p>
            Один подросток, четыре повседневные сцены и то, что остаётся за
            кадром.
          </p>
          <button
            className="primary"
            onClick={() => nav(storyPath(state.nikita.unlocked))}
          >
            {state.nikita.unlocked
              ? "Продолжить историю Никиты →"
              : "Начать историю Никиты →"}
          </button>
        </div>
      </article>
      <p className="caption">
        Истории 02 и 03 будут добавлены в полной версии выставки.
      </p>
      <button onClick={() => nav("/quiz/complete")}>← Назад</button>
    </>
  );
}
export function StoryPage() {
  const { stepId } = useParams();
  const index = steps.indexOf(stepId);
  const { state, dispatch } = useExhibition();
  const s = state.nikita;
  const nav = useNavigate();
  const scenes = [...nikita.stages[0].scenes, ...nikita.stages[1].scenes];
  const materials = nikita.stages[2].materials;
  const qs = nikita.stages[3].questions;
  const end = nikita.stages[4];
  const allOpened = materials.every((m) => s.opened.includes(m.id));
  const allAnswered = qs.every((q) => s.answers[q.id]);
  if (index < 0) return null;
  return (
    <>
      <div className="eyebrow">ИСТОРИЯ 01 / КОГДА ВСЁ СПОКОЙНО</div>
      <Progress current={index + 1} total={7} label="Этап" />
      {index < 4 && <Scene scene={scenes[index]} />}
      {index === 4 && (
        <>
          <h1>То, что осталось за кадром</h1>
          <p>
            Перед вами три материала из жизни Никиты. Откройте каждый из них.
            Порядок не имеет значения.
          </p>
          <Progress
            current={s.opened.length}
            total={3}
            label="Изучено материалов"
          />
          {materials.map((m) => (
            <section className="material" key={m.id}>
              <div className="material-heading">
                <div>
                  <h2>{m.title}</h2>
                  <p className="caption">{m.description}</p>
                </div>
                {s.opened.includes(m.id) && (
                  <span className="studied">✓ МАТЕРИАЛ ИЗУЧЕН</span>
                )}
              </div>
              <button
                className="disclosure"
                aria-expanded={s.active === m.id}
                aria-controls={`material-${m.id}`}
                onClick={() => dispatch({ type: "MATERIAL", id: m.id })}
              >
                {s.active === m.id ? "Скрыть материал ↑" : "Открыть материал ↓"}
              </button>
              {s.active === m.id && (
                <div id={`material-${m.id}`}>
                  <MaterialContent material={m} />
                </div>
              )}
            </section>
          ))}
          <Note>
            {allOpened
              ? "Все три материала изучены."
              : "Чтобы продолжить, откройте все три материала."}
          </Note>
        </>
      )}
      {index === 5 && (
        <>
          <h1>Карта невидимого</h1>
          <p>
            Вернитесь к трём эпизодам истории Никиты. Выберите наиболее
            обоснованную интерпретацию каждого из них.
          </p>
          <p className="caption">
            Здесь нет оценки вашей личности. Важно разобраться в ситуации.
          </p>
          {qs.map((q) => (
            <section className="map-question" key={q.id}>
              <h2>{q.title}</h2>
              <blockquote>«{q.fragment}»</blockquote>
              <p>Как можно интерпретировать этот эпизод?</p>
              {s.revealed ? (
                <>
                  <div className="answer-box">
                    <div className="eyebrow">ВАШ ВЫБОР</div>
                    <p>
                      {s.answers[q.id]}. {q.options[s.answers[q.id]]}
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
                  name={`map-${q.id}`}
                  legend="Выберите один ответ"
                  options={q.options}
                  value={s.answers[q.id]}
                  onChange={(v) =>
                    dispatch({ type: "MAP_ANSWER", id: q.id, value: v })
                  }
                />
              )}
            </section>
          ))}
          {!s.revealed ? (
            <>
              <p className="caption">
                {!allAnswered && "Выберите ответы во всех трёх эпизодах."}
              </p>
              <button
                className="primary"
                disabled={!allAnswered}
                onClick={() => dispatch({ type: "MAP_REVEAL" })}
              >
                Раскрыть связи
              </button>
            </>
          ) : (
            <p className="success">
              Вы рассмотрели три эпизода и раскрыли связанные с ними формы
              семейного неблагополучия.
            </p>
          )}
        </>
      )}
      {index === 6 && (
        <>
          <div className="eyebrow">ИСТОРИЯ 01 / ЗАКЛЮЧЕНИЕ</div>
          <h1>{end.title}</h1>
          <p className="lead">{end.introduction}</p>
          <div className="factor-grid">
            {end.factors.map((f, i) => (
              <article key={f.title}>
                <div className="eyebrow">
                  ФАКТОР {String(i + 1).padStart(2, "0")}
                </div>
                <h2>{f.title}</h2>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
          <div className="ending">
            <Paragraphs text={end.final_text} />
            <p className="emphasis">{end.final_emphasis}</p>
          </div>
        </>
      )}
      <Navigation
        back
        next
        disabled={(index === 4 && !allOpened) || (index === 5 && !s.revealed)}
        onBack={() => nav(index ? storyPath(index - 1) : "/stories")}
        nextLabel={
          index === 4
            ? "К карте невидимого →"
            : index === 5
              ? "К заключению →"
              : index === 6
                ? "К невидимой статистике →"
                : "Далее →"
        }
        onNext={() => {
          if (index === 6) {
            dispatch({ type: "STORY_COMPLETE" });
            nav("/statistics/1");
          } else {
            dispatch({ type: "STORY_ADVANCE", index });
            nav(storyPath(index + 1));
          }
        }}
      />
    </>
  );
}
export function StatisticsPage() {
  const { screenId } = useParams();
  const i = Number(screenId) - 1;
  const nav = useNavigate();
  const { dispatch } = useExhibition();
  return (
    <>
      <Progress
        current={i + 1}
        total={4}
        label="Невидимая статистика · экран"
      />
      <Statistics index={i} />
      <Navigation
        back
        next
        onBack={() => nav(i ? `/statistics/${i}` : storyPath(6))}
        nextLabel={i === 3 ? "Завершить пилот →" : "Далее →"}
        onNext={() => {
          if (i === 3) {
            dispatch({ type: "STATS_COMPLETE" });
            nav("/complete");
          } else {
            dispatch({ type: "STATS_ADVANCE", index: i });
            nav(`/statistics/${i + 2}`);
          }
        }}
      />
    </>
  );
}
export function Completion() {
  const nav = useNavigate();
  return (
    <>
      <div className="eyebrow">ИНФОРМАЦИЯ О ПИЛОТЕ</div>
      <div className="completion-mark" aria-hidden="true">
        ◌
      </div>
      <h1>Спасибо за участие</h1>
      <p className="lead">
        Это тестовая версия цифровой выставки «Невидимые истории». Сейчас
        доступны первоначальная проверка восприятия, история Никиты и общий
        раздел статистики.
      </p>
      <p>
        Итоговое тестирование и две другие истории появятся позже. Эта версия
        предназначена для проверки понятности, восприятия и удобства, а не для
        измерения изменения знаний.
      </p>
      <Note>
        <p>
          Если организатор прислал вам отдельную анкету обратной связи,
          заполните её после прохождения. Здесь отзывы не собираются и не
          сохраняются.
        </p>
      </Note>
      <Navigation
        back
        next
        onBack={() => nav("/statistics/4")}
        onNext={() => nav("/")}
        nextLabel="Вернуться на главную →"
      />
    </>
  );
}
