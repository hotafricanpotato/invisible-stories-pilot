export default function SceneArtwork({ art }) {
  if (!art) return null;
  return <figure className="scene-artwork">
    <picture>
      {art.mobileSrc && <source media="(max-width: 640px)" srcSet={art.mobileSrc} />}
      <img src={art.src} width={art.width} height={art.height}
        alt={art.alt ?? `Художественная реконструкция: ${art.label}`} />
    </picture>
    <figcaption>{art.label} · Художественная реконструкция</figcaption>
  </figure>;
}
