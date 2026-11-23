import { statisticsRecords as records, statisticsMethodology } from "../../content/statisticsExhibition.js";
const percent = value => `${String(value).replace(".", ",")}%`;
function SourceLink({ source }) {
  return <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<svg className="statistics-link-icon" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M3 11 11 3M4 3h7v7" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg></a>;
}
function Heading({ id, children }) {
  return <header className="statistics-section-heading"><h2 id={id}>{children}</h2></header>;
}

export function RecognitionSection() { return <>
    <section className="statistics-section" aria-labelledby="recognition-title">
      <Heading id="recognition-title">Что мы считаем насилием?</Heading>
      <div className="statistics-recognition">
        <div className="statistics-recognition-note"><p>{records.recognition.limitation}</p></div>
        <div>
          <ul className="recognition-bars" aria-label="Доли респондентов, распознающих формы домашнего насилия">
            {records.recognition.values.map(([name,value])=><li className="recognition-bar" key={name}>
              <span>{name} насилие</span><span className="recognition-track" aria-hidden="true"><span style={{width:`${value}%`}}/></span><strong>{percent(value)}</strong>
            </li>)}
          </ul>
          <div className="statistics-source-strip"><div><p>Источник: опрос 1600 взрослых жителей России. <SourceLink source={records.recognition.source}/></p><p>2024 — год, к которому относятся опубликованные результаты; доли ответов не показывают распространённость насилия.</p></div></div>
        </div>
      </div>
    </section></>; }

export function ScaleSection() { return <>

    <section className="statistics-section" aria-labelledby="scale-title">
      <Heading id="scale-title">За пределами одной истории</Heading>
      <div className="statistics-scale-grid">
        <div className="statistics-global" data-statistic="global">
          <h3 className="statistics-big"><small>Около</small> {records.global.countLabel.replace(/^Около /, "")}</h3>
          <p>{records.global.description}</p><p className="statistics-limit">Весь мир · дети младше пяти лет.</p>
          <div className="statistics-ratio"><span className="statistics-dots" aria-hidden="true">{Array.from({length:records.global.denominator},(_,i)=><i key={i} className={i<records.global.numerator?"is-highlighted":""}/>)}</span><p><strong>{records.global.ratioLabel}</strong><br/>детей</p></div>
          <p className="statistics-limit">{records.global.limitation}</p>
          <p className="statistics-source"><SourceLink source={records.global.source}/><br/>2024 — год публикации оценки.</p>
        </div>
        <div className="statistics-regional" data-statistic="regional">
          <h3 className="statistics-big">{records.regional.min}–{percent(records.regional.max)}</h3>
          <p>{records.regional.description}</p><p className="statistics-limit">Европа и Центральная Азия.</p>
          <div className="statistics-range" role="img" aria-label={`Диапазон от ${records.regional.min} до ${records.regional.max} процентов, шкала от 0 до 100 процентов`}>
            <div className="statistics-range-track"><span style={{left:`${records.regional.min}%`,width:`${records.regional.max-records.regional.min}%`}}/></div>
            <div className="statistics-range-labels" aria-hidden="true">{[0,records.regional.min,records.regional.max,100].map(value=><span key={value} style={{left:`${value}%`}}>{value}%</span>)}</div>
          </div>
          <p className="statistics-limit">{records.regional.limitation}</p>
          <p className="statistics-source"><SourceLink source={records.regional.source}/><br/>2025 — год публикации; годы исходных обследований различаются.</p>
        </div>
      </div>
    </section></>; }

export function CircumstancesSection() { return <>

    <section className="statistics-section statistics-circumstances" aria-labelledby="circumstances-title">
      <Heading id="circumstances-title">То, что остаётся за закрытыми дверями</Heading>
      <div className="statistics-circumstance-row" data-statistic="neglect">
        <div><h3 className="statistics-big">{percent(records.neglect.value)}</h3><p>{records.neglect.description}</p></div>
        <aside className="statistics-editorial-note"><span aria-hidden="true">ⓘ</span><p>{records.neglect.limitation}</p></aside>
        <p className="statistics-source"><SourceLink source={records.neglect.source}/><br/>2016 — год публикации. Выборка: 227 детей, возраст 11–18 лет, Нижегородская область.</p>
      </div>
      <div className="statistics-circumstance-row" data-statistic="alcohol">
        <div><h3 className="statistics-big">{records.alcohol.countLabel}</h3><p>{records.alcohol.description}</p></div>
        <aside className="statistics-editorial-note"><span aria-hidden="true">ⓘ</span><p>{records.alcohol.limitation}</p></aside>
        <p className="statistics-source"><SourceLink source={records.alcohol.source}/> · <SourceLink source={records.alcohol.explanationSource}/><br/>Данные: NSDUH, 2023 год. Публикация: 2025 год.</p>
      </div>
      <p className="statistics-methodology">{statisticsMethodology}</p>
    </section></>; }
