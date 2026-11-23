export default function SceneArtwork({ art }) {
  if (!art) return null;
  if (art.placeholder) return <figure className="scene-artwork artwork-placeholder" role="img" aria-label={`Временная иллюстрация: ${art.label}`}>
    <span className="eyebrow">Временная иллюстрация</span>
    <p>{art.label}</p>
  </figure>;
  return <figure className={`scene-artwork${art.layout === "portrait" ? " scene-artwork--portrait" : ""}`}>
    <picture>
      {art.mobileSrc && <source media="(max-width: 640px)" srcSet={art.mobileSrc} />}
      <img src={art.src} width={art.width} height={art.height}
        alt={art.alt ?? `Художественная реконструкция: ${art.label}`} />
    </picture>
    <figcaption>{art.label} · Художественная реконструкция</figcaption>
  </figure>;
}
