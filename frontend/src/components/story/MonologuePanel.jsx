import { Paragraphs } from "../UI";
export default function MonologuePanel({ text }) {
  return <aside className="monologue monologue-panel">
    <div className="eyebrow">ВНУТРЕННИЙ МОНОЛОГ</div>
    <Paragraphs text={text} />
  </aside>;
}
