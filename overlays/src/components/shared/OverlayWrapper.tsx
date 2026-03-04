import React, { useEffect, useRef, useState } from 'react';
import './OverlayWrapper.css';

type OverlayStatus = 'empty' | 'active' | 'delayed';

interface OverlayWrapperProps {
  /** True once meaningful data is present for this overlay */
  hasData: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wraps every overlay component and manages three display states:
 *   empty   — waiting for first data (component mounted, no data yet)
 *   active  — data is live, renders normally
 *   delayed — no data received within 5 s; adds caution icon to widget heading
 */
export function OverlayWrapper({
  hasData,
  children,
  className = '',
  style,
}: OverlayWrapperProps) {
  const [status, setStatus] = useState<OverlayStatus>('empty');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (hasData) {
      setStatus('active');
    } else {
      timerRef.current = setTimeout(() => setStatus('delayed'), 5_000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hasData]);

  return (
    <div
      className={`overlay-wrapper overlay-wrapper--${status} ${className}`}
      style={style}
    >
      <div className="overlay-wrapper__inner">{children}</div>
    </div>
  );
}
