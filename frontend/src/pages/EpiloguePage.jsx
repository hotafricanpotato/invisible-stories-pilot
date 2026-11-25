import { useNavigate } from "react-router-dom";
import content from "../content/epilogue.json";
export default function EpiloguePage({ onRestart }) {
  const nav = useNavigate();
  const divider = content.blocks.findIndex(block => block.type === "divider");
  const paragraph = (block,index) => block.type === "divider" ? <hr key={index}/> :
    <p key={index} className={block.type === "note" ? "epilogue-note" : undefined}>
      {block.type === "strong" ? <strong>{block.text}</strong> : block.type === "note" ? <><em>{block.text}</em><span className="epilogue-sources">
        {content.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>)}
      </span></> : block.text}
    </p>;
  return <article className="epilogue" aria-labelledby="epilogue-title">
    <header><h1 id="epilogue-title">{content.title}</h1></header>
    <div className="epilogue-text">
      <div className="epilogue-introduction">{content.blocks.slice(0,2).map(paragraph)}</div>
      <div className="epilogue-notice">{paragraph(content.blocks[2],2)}</div>
      <div className="epilogue-research">{content.blocks.slice(3,5).map(paragraph)}</div>
      <div className="epilogue-listening">{paragraph(content.blocks[5],5)}</div>
      <div className="epilogue-parenthood">{content.blocks.slice(6,divider).map(paragraph)}</div>
    </div>
    <div className="epilogue-closing">{content.blocks.slice(divider).map(paragraph)}</div>
    <nav className="epilogue-navigation" aria-label="Завершение выставки">
      <button onClick={() => nav("/stories")}>Вернуться к историям</button>
      <button className="primary" onClick={event => onRestart(event.currentTarget)}>Пройти выставку заново</button>
    </nav>
  </article>;
}
