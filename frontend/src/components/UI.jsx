export function Paragraphs({ text, className = "" }) {
  return (
    <div className={className}>
      {text.split("\n\n").map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
export function Progress({ current, total, label }) {
  return (
    <div className="progress">
      <div className="progress-label">
        <span>{label}</span>
        <span>
          {current} / {total}
        </span>
      </div>
      <progress value={current} max={total} aria-label={label} />
    </div>
  );
}
export function Choices({
  name,
  legend,
  options,
  value,
  onChange,
  showLetters = true,
}) {
  return (
    <fieldset className="choices">
      <legend>{legend}</legend>
      {Object.entries(options).map(([id, text]) => (
        <label
          key={id}
          className={`choice ${value === id ? "selected" : ""} ${showLetters ? "" : "without-letter"}`}
        >
          <input
            type="radio"
            name={name}
            value={id}
            checked={value === id}
            onChange={() => onChange(id)}
          />
          {showLetters && <span className="choice-letter">{id}.</span>}
          <span>{text}</span>
        </label>
      ))}
    </fieldset>
  );
}
export function Navigation({
  back,
  next,
  onBack,
  onNext,
  disabled = false,
  nextLabel = "Далее →",
  backLabel = "← Назад",
}) {
  return (
    <nav className="step-nav" aria-label="Переходы между этапами">
      <button disabled={!back} onClick={onBack}>
        {backLabel}
      </button>
      <button className="primary" disabled={!next || disabled} onClick={onNext}>
        {nextLabel}
      </button>
    </nav>
  );
}
export function Note({ children }) {
  return <div className="note">{children}</div>;
}
export function Source({ name, url, detail }) {
  return (
    <p className="source">
      <strong>Источник: </strong>
      <a href={url} target="_blank" rel="noopener noreferrer">
        {name}
      </a>
      {detail && ` — ${detail}`}
    </p>
  );
}
