import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Calendar from './Calendar.jsx';
import HoursBar from './HoursBar.jsx';
import { fmtHours, formatDate, toISO } from '../utils.js';

function NewUserForm({ onCreated }) {
  const [name, setName] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [error, setError] = useState('');

  async function submit(ev) {
    ev.preventDefault();
    try {
      const user = await api.createUser({ name, totalHours });
      setName('');
      setTotalHours('');
      setError('');
      onCreated(user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h3>Nou usuari</h3>
      <label>
        Nom
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Hores totals disponibles
        <input type="number" min="0" step="0.5" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} required />
      </label>
      <button type="submit">Crear usuari</button>
      {error && <div className="alert error">{error}</div>}
    </form>
  );
}

export default function UserScreen({ users, entries, holidays, seasonStart, selectedUserId, onSelectUser, onChange }) {
  const user = users.find((u) => u.id === selectedUserId);
  const userEntries = user ? entries.filter((e) => e.userId === user.id) : [];

  const minDate = toISO(seasonStart, 12, 1);
  const maxDate = toISO(seasonStart + 1, 1, 31);

  const [totalInput, setTotalInput] = useState('');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (selectedUserId && users.length && !user) onSelectUser('');
  }, [selectedUserId, users, user, onSelectUser]);

  useEffect(() => {
    setTotalInput(user ? String(user.totalHours) : '');
    setMessage(null);
  }, [user?.id, user?.totalHours]);

  useEffect(() => {
    setDate('');
  }, [seasonStart]);

  const existingForDate = userEntries.find((e) => e.date === date);
  const holidayForDate = holidays.find((h) => h.date === date);
  const previewRemaining = user
    ? user.remainingHours + (existingForDate?.hours || 0) - (Number(hours) || 0)
    : 0;

  function pickDay(iso) {
    setDate(iso);
    const existing = userEntries.find((e) => e.date === iso);
    setHours(existing ? String(existing.hours) : hours);
  }

  async function run(action, okText) {
    try {
      await action();
      setMessage({ type: 'ok', text: okText });
      await onChange();
      return true;
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      return false;
    }
  }

  async function saveTotal(ev) {
    ev.preventDefault();
    await run(() => api.updateUser(user.id, { totalHours: totalInput }), 'Hores totals actualitzades.');
  }

  async function saveEntry(ev) {
    ev.preventDefault();
    const ok = await run(
      () => api.saveEntry({ userId: user.id, date, hours }),
      existingForDate ? 'Dia actualitzat.' : 'Dia de festa afegit.'
    );
    if (ok) {
      setDate('');
      setHours('');
    }
  }

  async function removeEntry(entry) {
    if (!confirm(`Vols eliminar el dia ${formatDate(entry.date)}?`)) return;
    await run(() => api.deleteEntry(entry.id), 'Dia eliminat.');
  }

  async function removeUser() {
    if (!confirm(`Vols eliminar ${user.name} i tots els seus dies de festa?`)) return;
    const ok = await run(() => api.deleteUser(user.id), 'Usuari eliminat.');
    if (ok) onSelectUser('');
  }

  return (
    <div className="user-screen">
      <div className="side">
        <div className="panel form">
          <h3>Usuari</h3>
          <select value={selectedUserId} onChange={(e) => onSelectUser(e.target.value)}>
            <option value="">— Selecciona un usuari —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {!user && <NewUserForm onCreated={(u) => { onChange(); onSelectUser(u.id); }} />}

        {user && (
          <>
            <div className="panel">
              <h3>Resum d'hores de {user.name}</h3>
              <HoursBar total={user.totalHours} used={user.usedHours} />
              <form className="inline" onSubmit={saveTotal}>
                <label>
                  Hores totals
                  <input type="number" min="0" step="0.5" value={totalInput} onChange={(e) => setTotalInput(e.target.value)} required />
                </label>
                <button type="submit">Desar total</button>
              </form>
            </div>

            <form className="panel form" onSubmit={saveEntry}>
              <h3>{existingForDate ? 'Modificar dia de festa' : 'Afegir dia de festa'}</h3>
              <label>
                Dia (desembre o gener)
                <input type="date" min={minDate} max={maxDate} value={date} onChange={(e) => pickDay(e.target.value)} required />
              </label>
              <label>
                Hores de festa aquest dia
                <input type="number" min="0.5" max="24" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} required />
              </label>
              {holidayForDate && (
                <p className="danger">
                  ⛔ Aquest dia és festiu d'empresa{holidayForDate.name ? ` (${holidayForDate.name})` : ''}; no s'hi poden agafar hores.
                </p>
              )}
              {hours !== '' && !holidayForDate && (
                <p className={previewRemaining < 0 ? 'danger' : 'muted'}>
                  Després de desar et quedaran <strong>{fmtHours(previewRemaining)}</strong>
                  {previewRemaining < 0 && ' — superes les teves hores disponibles!'}
                </p>
              )}
              <button type="submit" disabled={previewRemaining < 0 || Boolean(holidayForDate)}>
                {existingForDate ? 'Actualitzar dia' : 'Afegir dia'}
              </button>
              <p className="muted small">Consell: també pots fer clic en un dia del calendari.</p>
            </form>

            <div className="panel">
              <h3>Dies agafats</h3>
              {userEntries.length === 0 ? (
                <p className="muted">Encara no has agafat cap dia.</p>
              ) : (
                <table className="entries">
                  <tbody>
                    {userEntries.map((e) => (
                      <tr key={e.id}>
                        <td>{formatDate(e.date)}</td>
                        <td className="num">{fmtHours(e.hours)}</td>
                        <td>
                          <button className="link" onClick={() => pickDay(e.date)}>Editar</button>
                          <button className="link danger" onClick={() => removeEntry(e)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <button className="danger-btn" onClick={removeUser}>Eliminar usuari</button>
          </>
        )}

        {message && <div className={`alert ${message.type}`}>{message.text}</div>}
      </div>

      {user ? (
        <Calendar
          users={users}
          entries={userEntries}
          holidays={holidays}
          seasonStart={seasonStart}
          selectedDate={date}
          onDayClick={pickDay}
        />
      ) : (
        <div className="panel placeholder">Selecciona o crea un usuari per gestionar els seus dies de festa.</div>
      )}
    </div>
  );
}
