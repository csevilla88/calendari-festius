import { useState } from 'react';
import Calendar from './Calendar.jsx';
import HoursBar from './HoursBar.jsx';
import { colorFor } from '../utils.js';

export default function CalendarScreen({ users, entries, holidays, seasonStart }) {
  const [filter, setFilter] = useState('');
  const visible = filter ? entries.filter((e) => e.userId === filter) : entries;

  return (
    <div className="calendar-screen">
      <aside className="panel">
        <h3>Usuaris</h3>
        {users.length === 0 && <p className="muted">Encara no hi ha usuaris. Crea'ls a «Els meus dies de festa».</p>}
        <ul className="user-list">
          <li>
            <button className={filter === '' ? 'active' : ''} onClick={() => setFilter('')}>
              Tots
            </button>
          </li>
          {users.map((u) => (
            <li key={u.id}>
              <button className={filter === u.id ? 'active' : ''} onClick={() => setFilter(u.id)}>
                <span className="dot" style={{ background: colorFor(u.id, users) }} />
                {u.name}
              </button>
              <HoursBar total={u.totalHours} used={u.usedHours} />
            </li>
          ))}
        </ul>
        <p className="legend"><span className="legend-box public-holiday" /> Festiu</p>
        <p className="legend"><span className="legend-box company-holiday" /> Festiu d'empresa</p>
        <p className="legend"><span className="legend-box other-holiday" /> Altres</p>
      </aside>
      <Calendar users={users} entries={visible} holidays={holidays} seasonStart={seasonStart} />
    </div>
  );
}
