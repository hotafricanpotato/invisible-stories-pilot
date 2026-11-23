// Decorative drawing only: every value, label and chart is real HTML/CSS.
export default function ArchiveDecor() {
  return <svg className="statistics-sprig" viewBox="0 0 120 240" aria-hidden="true" focusable="false">
    <path d="M18 232 C40 194 64 126 86 14" fill="none" stroke="currentColor" strokeWidth="1.6" />
    {[ [34,196,-42],[45,160,-35],[58,123,-30],[72,81,-22],[81,42,-15], [34,196,46],[48,154,49],[63,112,45],[76,69,40] ].map(([x,y,angle],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M0 0 C-16 -18 -10 -34 0 -47 C10 -28 13 -15 0 0Z" fill="currentColor" opacity={.38+i*.035}/>
      <path d="M0 0 L0 -43" fill="none" stroke="currentColor" strokeWidth=".6"/>
    </g>)}
  </svg>;
}
