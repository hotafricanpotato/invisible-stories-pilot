// Resolve public assets without changing approved presentation/scenario data.
export function assetUrl(src, base = import.meta.env.BASE_URL) {
  if (!src || !src.startsWith("/assets/")) return src;
  return `${base}${src.slice(1)}`;
}
