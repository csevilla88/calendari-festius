import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Calendar from './Calendar.jsx';
import { fmtHours, formatDate, toISO } from '../utils.js';

export default function SettingsScreen({ users, holidays, seasonStart, onChange }) {
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState(null);

  const minDate = toISO(seasonStart, 12, 1);
  const maxDate = toISO(seasonStart + 1, 1, 31);
  const seasonHolidays = holidays.filter((h) => h.date >= minDate && h.date <= maxDate);

  useEffect(() => {
    setDate('');
  }, [seasonStart]);

  async function addHoliday(holidayDate, holidayName, force = false) {
    try {
      const created = await api.createHoliday({ date: holidayDate, name: holidayName, force });
      const removed = created.removedEntries
        ? ` S'han anul·lat ${created.removedEntries} reserva(es) d'usuaris i se'ls han retornat les hores.`
        : '';
      setMessage({ type: 'ok', text: `Festiu afegit: ${formatDate(holidayDate)}.${removed}` });
      setDate('');
      setName('');
      await onChange();
    } catch (err) {
      const conflicts = err.data?.conflicts;
      if (err.status === 409 && conflicts?.length) {
        const list = conflicts.map((c) => `• ${c.userName}: ${fmtHours(c.hours)}`).join('\n');
        const ok = confirm(
          `Aquests usuaris ja han agafat hores el ${formatDate(holidayDate)}:\n\n${list}\n\n` +
            "Vols marcar-lo igualment com a festiu? Les seves reserves d'aquest dia s'eliminaran i recuperaran aquestes hores."
        );
        if (ok) await addHoliday(holidayDate, holidayName, true);
        return;
      }
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function removeHoliday(holiday) {
    if (!confirm(`Vols treure el festiu del ${formatDate(holiday.date)}?`)) return;
    try {
      await api.deleteHoliday(holiday.id);
      setMessage({ type: 'ok', text: 'Festiu eliminat.' });
      await onChange();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  function onDayClick(iso) {
    const existing = holidays.find((h) => h.date === iso);
    if (existing) removeHoliday(existing);
    else setDate(iso);
  }

  return (
    <div className="user-screen">
      <div className="side">
        <form
          className="panel form"
          onSubmit={(ev) => {
            ev.preventDefault();
            addHoliday(date, name);
          }}
        >
          <h3>Afegir festiu d'empresa</h3>
          <label>
            Dia (desembre o gener)
            <input type="date" min={minDate} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            Descripció (opcional)
            <input value={name} placeholder="P. ex.: Nadal" onChange={(e) => setName(e.target.value)} maxLength={40} />
          </label>
          <button type="submit">Marcar com a festiu</button>
          <p className="muted small">
            Fes clic en un dia del calendari per seleccionar-lo, o en un festiu (vermell) per treure'l.
            Ningú no podrà agafar hores als festius d'empresa.
          </p>
        </form>

        <div className="panel">
          <h3>Festius de la temporada {seasonStart}/{seasonStart + 1}</h3>
          {seasonHolidays.length === 0 ? (
            <p className="muted">No hi ha festius d'empresa configurats.</p>
          ) : (
            <table className="entries">
              <tbody>
                {seasonHolidays.map((h) => (
                  <tr key={h.id}>
                    <td>{formatDate(h.date)}</td>
                    <td>{h.name}</td>
                    <td>
                      <button className="link danger" onClick={() => removeHoliday(h)}>Treure</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {message && <div className={`alert ${message.type}`}>{message.text}</div>}
      </div>

      <Calendar
        users={users}
        entries={[]}
        holidays={holidays}
        seasonStart={seasonStart}
        selectedDate={date}
        onDayClick={onDayClick}
        allowHolidayClick
      />
    </div>
  );
}
