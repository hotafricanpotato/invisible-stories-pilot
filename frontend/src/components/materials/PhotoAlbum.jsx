export default function PhotoAlbum({ material, artwork = {} }) {
  return <section className="photo-album" aria-label={material.albumTitle}>
    <h3>{material.albumTitle}</h3>
    <div className="album-photos">{material.photos.map(photo => {
      const art = artwork[photo.id];
      const src = art?.src ?? photo.src;
      return <figure key={photo.id}>
        {src ? <img src={src} alt={photo.description} width={art?.width} height={art?.height} /> : <div className="album-placeholder" role="img" aria-label={`Временная иллюстрация: ${photo.description}`}>
          <span className="eyebrow">Временная иллюстрация</span><p>{photo.description}</p>
        </div>}
        <figcaption>
          {src && <p className="album-description">{photo.description}</p>}
          <p>{photo.caption}</p>
        </figcaption>
      </figure>;
    })}</div>
    <p className="album-publication">{material.publication}</p>
  </section>;
}
