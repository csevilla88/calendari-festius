import { fmtHours } from '../utils.js';

export default function HoursBar({ total, used }) {
  const remaining = Math.round((total - used) * 100) / 100;
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : used > 0 ? 100 : 0;
  const level = pct >= 100 ? 'full' : pct >= 75 ? 'high' : 'ok';

  return (
    <div className="hours-bar">
      <div className="bar">
        <div className={`fill ${level}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="bar-legend">
        <span>Agafades: <strong>{fmtHours(used)}</strong></span>
        <span>Total: <strong>{fmtHours(total)}</strong></span>
        <span className={remaining <= 0 ? 'danger' : ''}>
          Restants: <strong>{fmtHours(remaining)}</strong>
        </span>
      </div>
    </div>
  );
}
