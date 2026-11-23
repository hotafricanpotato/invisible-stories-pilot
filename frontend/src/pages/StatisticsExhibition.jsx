import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useExhibition } from "../state/Provider";
import { RecognitionSection, ScaleSection, CircumstancesSection } from "../components/statistics/StatisticsSections";
const sections = [RecognitionSection, ScaleSection, CircumstancesSection];
export default function StatisticsExhibition() {
  const nav = useNavigate();
  const { screenId } = useParams();
  const page = Number(screenId);
  const { dispatch } = useExhibition();
  const heading = useRef(null);
  const Section = sections[page - 1];
  useEffect(() => {
    dispatch({type:"STATS_VISIT", page});
    window.scrollTo({top:0, left:0, behavior:"instant"});
    heading.current?.focus({preventScroll:true});
  }, [page, dispatch]);
  if (!Section) return null;
  return <article className={`statistics-exhibition statistics-page-${page}`} aria-labelledby="statistics-title">
    <header className="statistics-introduction">
      <p className="statistics-page-index" aria-label={`Страница ${page} из 3`}>{String(page).padStart(2,"0")} / 03</p>
      <h1 id="statistics-title" ref={heading} tabIndex={-1}>Невидимая статистика</h1>
      <p>За отдельными историями стоят реальные исследования и миллионы человеческих судеб.</p>
    </header>
    <Section/>
    <nav className="statistics-completion" aria-label="Навигация по статистике">
      <button onClick={()=>nav(page === 1 ? "/stories" : `/statistics/${page-1}`)}>{page === 1 ? "Вернуться к историям" : "Назад"}</button>
      {page < 3 ? <button className="primary" onClick={()=>nav(`/statistics/${page+1}`)}>Далее</button> :
      <button className="primary" onClick={()=>{dispatch({type:"STATS_COMPLETE"});nav("/final-test/1");}}>Завершить просмотр</button>}
    </nav>
  </article>;
}
