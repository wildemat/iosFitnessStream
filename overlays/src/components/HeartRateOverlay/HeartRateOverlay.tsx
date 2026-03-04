import React from 'react';
import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import './HeartRateOverlay.css';

const ZONE_CONFIG = [
  null,                                              // index 0 — unused
  { label: 'Recovery',  color: 'var(--zone-1)' },
  { label: 'Aerobic',   color: 'var(--zone-2)' },
  { label: 'Tempo',     color: 'var(--zone-3)' },
  { label: 'Threshold', color: 'var(--zone-4)' },
  { label: 'Max',       color: 'var(--zone-5)' },
] as const;

export interface HeartRateOverlayProps {
  metrics: WorkoutMetrics | null;
  transparent?: boolean;
}

export function HeartRateOverlay({ metrics, transparent = false }: HeartRateOverlayProps) {
  const hr   = metrics?.heart_rate;
  const zone = metrics?.heart_rate_zone;
  const hasData = hr != null;

  const zoneConfig = zone != null && zone >= 1 && zone <= 5 ? ZONE_CONFIG[zone] : null;

  const pulseDuration = hr ? `${(60 / hr).toFixed(2)}s` : '1s';

  return (
    <OverlayWrapper hasData={hasData}>
      <div className={`widget hr-overlay${transparent ? ' widget--transparent' : ''}`}>
        <div className="widget__header">
          <span
            className={`hr-overlay__heart${hasData ? ' hr-overlay__heart--beating' : ''}`}
            style={{ '--pulse-duration': pulseDuration } as React.CSSProperties}
            aria-hidden="true"
          >
            ♥
          </span>
          <span className="widget__label">Heart Rate</span>
        </div>

        <div className="widget__value hr-overlay__value">
          <span className="widget__number hr-overlay__number" key={hr != null ? Math.round(hr) : 'empty'}>
            {hr != null ? Math.round(hr) : '—'}
          </span>
          <span className="widget__unit">bpm</span>
        </div>

        {zoneConfig ? (
          <span
            key={zone}
            className="hr-overlay__zone-badge"
            style={{
              color: zoneConfig.color,
              background: `color-mix(in srgb, ${zoneConfig.color} 14%, transparent)`,
            }}
          >
            Zone {zone} · {zoneConfig.label}
          </span>
        ) : (
          <span className="hr-overlay__zone-empty">—</span>
        )}
      </div>
    </OverlayWrapper>
  );
}
