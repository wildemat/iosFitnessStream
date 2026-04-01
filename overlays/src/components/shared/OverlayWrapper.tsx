import React, { useEffect, useState } from 'react';
import './OverlayWrapper.css';
import { useIsStale } from '../../hooks/useMetricsStream';

type OverlayStatus = 'empty' | 'active' | 'stale' | 'disabled';

interface OverlayWrapperProps {
  /** True once meaningful data is present for this overlay */
  hasData: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wraps every overlay component and manages four display states:
 *   empty    — waiting for first data (component mounted, no data yet)
 *   active   — data is live and fresh
 *   stale    — data is stale (5–10 s window), shows last value with subtle indicator
 *   disabled — no data for 10+ seconds, shows empty state
 */
export function OverlayWrapper({
  hasData,
  children,
  className = '',
  style,
}: OverlayWrapperProps) {
  const isStale = useIsStale();
  const [everHadData, setEverHadData] = useState(false);

  useEffect(() => {
    if (hasData) setEverHadData(true);
  }, [hasData]);

  let status: OverlayStatus;
  if (!everHadData) {
    status = 'empty';
  } else if (!hasData) {
    status = 'disabled';
  } else if (isStale) {
    status = 'stale';
  } else {
    status = 'active';
  }

  return (
    <div
      className={`overlay-wrapper overlay-wrapper--${status} ${className}`}
      style={style}
    >
      <div className="overlay-wrapper__inner">{children}</div>
    </div>
  );
}
