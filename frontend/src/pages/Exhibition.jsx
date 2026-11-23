import { useNavigate } from "react-router-dom";
import { useExhibition } from "../state/Provider";
import {
  Navigation,
  Note,
  Progress,
} from "../components/UI";
import StatisticsExhibition from "./StatisticsExhibition";
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
            Три истории. Несколько точек зрения.
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
              "Истории Лизы, Никиты и Ильи",
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
          Истории открываются последовательно: Лиза, Никита, Илья. После
          завершения всех трёх откроется «Невидимая статистика». Тема может
          быть эмоционально непростой — прохождение можно прекратить в любой момент.
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
  return <StatisticsExhibition />;
}
export function Completion() {
  const nav = useNavigate();
  return (
    <>
      <div className="eyebrow">ЗАВЕРШЕНИЕ ПРОСМОТРА</div>
      <div className="completion-mark" aria-hidden="true">
        ◌
      </div>
      <h1>Спасибо за участие</h1>
      <p className="lead">
        Вы прошли истории Лизы, Никиты и Ильи и раздел «Невидимая статистика».
      </p>
      <p>
        Итоговый тест и эпилог пока не подключены.
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
        onBack={() => nav("/statistics/3")}
        onNext={() => nav("/")}
        nextLabel="Вернуться на главную →"
      />
    </>
  );
}
