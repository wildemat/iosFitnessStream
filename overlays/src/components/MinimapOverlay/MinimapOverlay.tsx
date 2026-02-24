import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import './MinimapOverlay.css';

// ─── Pulsing custom marker ─────────────────────────────────────────────────
const PULSING_ICON = L.divIcon({
  className: '',   // suppress Leaflet's default white box
  html: `<div class="minimap-marker">
           <div class="minimap-marker__ring"></div>
           <div class="minimap-marker__dot"></div>
         </div>`,
  iconSize:   [24, 24],
  iconAnchor: [12, 12],
});

// CartoDB Dark Matter — free, no API key, matches lofi palette
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// ─── Inner component: must live inside <MapContainer> to use useMap() ──────
interface MapContentProps {
  center: [number, number];
  trail: [number, number][];
}

function MapContent({ center, trail }: MapContentProps) {
  const map = useMap();

  // Smooth pan to the latest GPS fix
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true, duration: 0.8 });
  }, [map, center]);

  return (
    <>
      <TileLayer url={TILE_URL} />

      {/* Route trail — accumulated positions drawn as a polyline */}
      {trail.length > 1 && (
        <Polyline
          positions={trail}
          pathOptions={{ color: '#88c0a8', weight: 2.5, opacity: 0.65, lineJoin: 'round' }}
        />
      )}

      {/* Live position marker */}
      <Marker position={center} icon={PULSING_ICON} />
    </>
  );
}

// ─── Public component ──────────────────────────────────────────────────────
export interface MinimapOverlayProps {
  metrics: WorkoutMetrics | null;
  /** Initial zoom level (default 15 — street level) */
  zoom?: number;
  transparent?: boolean;
}

const DEFAULT_CENTER: [number, number] = [0, 0];

export function MinimapOverlay({ metrics, zoom = 15, transparent = false }: MinimapOverlayProps) {
  const lat    = metrics?.latitude;
  const lon    = metrics?.longitude;
  const hasGPS = lat != null && lon != null;

  const center: [number, number] = hasGPS ? [lat!, lon!] : DEFAULT_CENTER;

  // Accumulate route trail (capped at 500 points to bound memory)
  const trailRef = useRef<[number, number][]>([]);
  const [trail, setTrail] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!hasGPS) return;
    const pos: [number, number] = [lat!, lon!];
    const arr = trailRef.current;
    const last = arr.length > 0 ? arr[arr.length - 1] : undefined;
    // Deduplicate: only push if position changed
    if (!last || last[0] !== pos[0] || last[1] !== pos[1]) {
      trailRef.current = [...trailRef.current.slice(-499), pos];
      setTrail([...trailRef.current]);
    }
  }, [lat, lon, hasGPS]);

  return (
    <OverlayWrapper hasData={hasGPS}>
      <div className={`minimap-overlay${transparent ? ' minimap-overlay--transparent' : ''}`}>
        {hasGPS ? (
          <MapContainer
            center={center}
            zoom={zoom}
            className="minimap-overlay__map"
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            touchZoom={false}
            doubleClickZoom={false}
            keyboard={false}
            attributionControl={false}
          >
            <MapContent center={center} trail={trail} />
          </MapContainer>
        ) : (
          <div className="minimap-overlay__empty" aria-label="Waiting for GPS">
            <span className="minimap-overlay__empty-icon">◉</span>
            <span className="minimap-overlay__empty-text">No GPS signal</span>
          </div>
        )}

        <div className="minimap-overlay__footer">
          <div className="minimap-overlay__coords">
            <span>{lat != null ? lat.toFixed(5) : '——.—————'}</span>
            <span className="minimap-overlay__coords-sep">·</span>
            <span>{lon != null ? lon.toFixed(5) : '——.—————'}</span>
          </div>
          <span className="minimap-overlay__attribution">© OSM / CARTO</span>
        </div>
      </div>
    </OverlayWrapper>
  );
}
