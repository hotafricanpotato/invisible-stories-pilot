import { useNavigate, useParams } from "react-router-dom";
import { useExhibition } from "../state/Provider";
import {
  Navigation,
  Note,
  Progress,
} from "../components/UI";
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
            onClick={() => nav("/stories")}
          >
            {state.cursor === "/"
              ? "Начать выставку →"
              : "Продолжить выставку →"}
          </button>
          <p className="caption">
            Две истории. Несколько точек зрения.
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
              "Истории Лизы и Никиты",
              "Познакомьтесь с героями и взгляните на их повседневную жизнь.",
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
          Пилотная версия: сейчас доступны истории Лизы и Никиты и общий
          раздел статистики. История Ильи и итоговое тестирование ещё
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
        onBack={() =>
          nav(i ? `/statistics/${i}` : "/stories")
        }
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
        доступны истории Лизы и Никиты и общий
        раздел статистики.
      </p>
      <p>
        История Ильи, итоговое тестирование и эпилог появятся позже. Эта версия
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
