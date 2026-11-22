export default function PhotoAlbum({ material }) {
  return <section className="photo-album" aria-label={material.albumTitle}>
    <h3>{material.albumTitle}</h3>
    <div className="album-photos">{material.photos.map(photo => <figure key={photo.id}>
      {photo.src ? <img src={photo.src} alt={photo.description} /> : <div className="album-placeholder" role="img" aria-label={`Временная иллюстрация: ${photo.description}`}>
        <span className="eyebrow">Временная иллюстрация</span><p>{photo.description}</p>
      </div>}
      <figcaption>{photo.caption}</figcaption>
    </figure>)}</div>
    <p className="album-publication">{material.publication}</p>
  </section>;
}
