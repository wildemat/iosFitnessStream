import './ControlBar.css';

const OVERLAYS = [
  { value: 'heartrate', label: 'Heart Rate' },
  { value: 'elapsed',   label: 'Time' },
  { value: 'pace',      label: 'Pace' },
  { value: 'distance',  label: 'Distance' },
  { value: 'calories',  label: 'Calories' },
  { value: 'steps',     label: 'Steps' },
  { value: 'elevation', label: 'Elevation' },
  { value: 'workout',   label: 'Workout' },
  { value: 'minimap',   label: 'Minimap' },
] as const;

export interface ControlBarProps {
  overlay: string | null;
  transparent: boolean;
  zoom: number | undefined;
  serverUrl: string;
  onOverlayChange: (value: string | null) => void;
  onTransparentChange: (value: boolean) => void;
  onZoomChange: (value: number) => void;
  onServerUrlChange: (value: string) => void;
}

export function ControlBar({
  overlay,
  transparent,
  zoom,
  serverUrl,
  onOverlayChange,
  onTransparentChange,
  onZoomChange,
  onServerUrlChange,
}: ControlBarProps) {
  return (
    <div className="control-bar">
      <div className="control-bar__section">
        <span className="control-bar__label">View</span>
        <div className="control-bar__group">
          <button
            className={`control-bar__btn ${overlay === null ? 'control-bar__btn--active' : ''}`}
            onClick={() => onOverlayChange(null)}
          >
            Dashboard
          </button>
          {OVERLAYS.map(({ value, label }) => (
            <button
              key={value}
              className={`control-bar__btn ${overlay === value ? 'control-bar__btn--active' : ''}`}
              onClick={() => onOverlayChange(overlay === value ? null : value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-bar__divider" />

      <div className="control-bar__section">
        <span className="control-bar__label">Options</span>
        <div className="control-bar__group">
          <button
            className={`control-bar__btn ${transparent ? 'control-bar__btn--active' : ''}`}
            onClick={() => onTransparentChange(!transparent)}
          >
            Transparent
          </button>

          {overlay === 'minimap' && (
            <div className="control-bar__zoom">
              <button
                className="control-bar__btn control-bar__btn--small"
                onClick={() => onZoomChange((zoom ?? 15) - 1)}
              >
                &minus;
              </button>
              <span className="control-bar__zoom-value">
                Zoom {zoom ?? 15}
              </span>
              <button
                className="control-bar__btn control-bar__btn--small"
                onClick={() => onZoomChange((zoom ?? 15) + 1)}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="control-bar__divider" />

      <div className="control-bar__section">
        <span className="control-bar__label">Server</span>
        <input
          className="control-bar__input"
          type="text"
          value={serverUrl}
          onChange={(e) => onServerUrlChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
