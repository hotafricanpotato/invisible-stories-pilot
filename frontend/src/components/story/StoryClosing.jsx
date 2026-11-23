// Presentation only: the supplied scenario paragraphs retain their text and order.
export default function StoryClosing({ text, label = "Послесловие", endLabel }) {
  const [lead, ...paragraphs] = text.split("\n\n");
  return <section className="closing-card" aria-labelledby="story-closing-label">
    <h1 id="story-closing-label" className="closing-kicker">{label}</h1>
    <p className="closing-lead">{lead}</p>
    <div className="closing-body">{paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
    {endLabel && <p className="closing-end-label">{endLabel}</p>}
  </section>;
}
