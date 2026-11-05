import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { defaultSeasonStart } from './utils.js';
import CalendarScreen from './components/CalendarScreen.jsx';
import TimelineScreen from './components/TimelineScreen.jsx';
import UserScreen from './components/UserScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';

export default function App() {
  const [tab, setTab] = useState('calendar');
  const [users, setUsers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [seasonStart, setSeasonStart] = useState(defaultSeasonStart());
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadError, setLoadError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [u, e, h] = await Promise.all([api.getUsers(), api.getEntries(), api.getHolidays()]);
      setUsers(u);
      setEntries(e);
      setHolidays(h);
      setLoadError('');
    } catch (err) {
      setLoadError(`No s'ha pogut connectar amb el servidor: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="app">
      <header className="header">
        <h1>🎄 Organització dels Festius desembre – gener</h1>
        <div className="season">
          <button onClick={() => setSeasonStart((y) => y - 1)} aria-label="Temporada anterior">◀</button>
          <span>{seasonStart}/{seasonStart + 1}</span>
          <button onClick={() => setSeasonStart((y) => y + 1)} aria-label="Temporada següent">▶</button>
        </div>
        <nav className="tabs">
          <button className={tab === 'calendar' ? 'active' : ''} onClick={() => setTab('calendar')}>
            📅 Calendari
          </button>
          <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>
            📏 Línia temporal
          </button>
          <button className={tab === 'user' ? 'active' : ''} onClick={() => setTab('user')}>
            ✏️ Els meus dies de festa
          </button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
            ⚙️ Configuració
          </button>
        </nav>
      </header>

      {loadError && <div className="alert error">{loadError}</div>}

      <main>
        {tab === 'calendar' && (
          <CalendarScreen users={users} entries={entries} holidays={holidays} seasonStart={seasonStart} />
        )}
        {tab === 'timeline' && (
          <TimelineScreen users={users} entries={entries} holidays={holidays} seasonStart={seasonStart} />
        )}
        {tab === 'user' && (
          <UserScreen
            users={users}
            entries={entries}
            holidays={holidays}
            seasonStart={seasonStart}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
            onChange={refresh}
          />
        )}
        {tab === 'settings' && (
          <SettingsScreen users={users} holidays={holidays} seasonStart={seasonStart} onChange={refresh} />
        )}
      </main>
    </div>
  );
}
