// CartoDB Dark Matter tile URLs
const TILE_URL_LABELS   = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_URL_NOLABELS = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';

/**
 * Returns the appropriate CartoDB Dark Matter tile URL.
 * @param hideLabels - when true, returns the no-labels variant
 */
export function getTileUrl(hideLabels: boolean): string {
  return hideLabels ? TILE_URL_NOLABELS : TILE_URL_LABELS;
}
