import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Calendar from './Calendar.jsx';
import { fmtHours, formatDate, toISO } from '../utils.js';

function dateRange(startDate, endDate) {
  if (!startDate || !endDate || startDate > endDate) return [];
  const dates = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (current <= end && dates.length < 62) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return current <= end ? [] : dates;
}

const holidayTypeName = (type) => type === 'public' ? 'Festiu' : type === 'company' ? "Festiu d'empresa" : 'Altres';

export default function SettingsScreen({ users, holidays, seasonStart, onChange }) {
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('company');
  const [name, setName] = useState('');
  const [message, setMessage] = useState(null);

  const minDate = toISO(seasonStart, 12, 1);
  const maxDate = toISO(seasonStart + 1, 1, 31);
  const seasonHolidays = holidays.filter((h) => h.date >= minDate && h.date <= maxDate);

  useEffect(() => {
    setDate('');
    setEndDate('');
  }, [seasonStart]);

  async function addHolidays(dates, holidayName, holidayType, force = false) {
    try {
      const created = await api.createHolidays({ dates, name: holidayName, type: holidayType, force });
      const removed = created.removedEntries
        ? ` S'han anul·lat ${created.removedEntries} reserva(es) d'usuaris i se'ls han retornat les hores.`
        : '';
      const count = created.holidays.length;
      setMessage({ type: 'ok', text: `${count === 1 ? 'Festiu afegit' : `${count} festius afegits`}: ${holidayTypeName(holidayType)}.${removed}` });
      setDate('');
      setEndDate('');
      setName('');
      await onChange();
    } catch (err) {
      const conflicts = err.data?.conflicts;
      if (err.status === 409 && conflicts?.length) {
        const list = conflicts.map((c) => `${formatDate(c.date)} · ${c.userName}: ${fmtHours(c.hours)}`).join('\n');
        const ok = confirm(
          `Hi ha reserves en aquestes dates:\n\n${list}\n\n` +
            'Vols afegir els festius igualment? Les reserves afectades s’eliminaran i es retornaran les hores.'
        );
        if (ok) await addHolidays(dates, holidayName, holidayType, true);
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
            const dates = type === 'public' ? [date] : dateRange(date, endDate || date);
            if (!dates.length) {
              setMessage({ type: 'error', text: 'El rang de dates no és vàlid.' });
              return;
            }
            addHolidays(dates, name, type);
          }}
        >
          <h3>Afegir festiu</h3>
          <label>
            Tipus
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="public">Festiu</option>
              <option value="company">Festiu d'empresa</option>
              <option value="other">Altres</option>
            </select>
          </label>
          <label>
            {type === 'company' || type === 'other' ? 'Primer dia' : 'Dia'}
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setEndDate('');
              }}
              required
            />
          </label>
          {(type === 'company' || type === 'other') && (
            <label>
              Darrer dia (inclòs)
              <input
                type="date"
                min={date || minDate}
                max={maxDate}
                value={endDate || date}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </label>
          )}
          <label>
            Descripció (opcional)
            <input value={name} placeholder="P. ex.: Nadal" onChange={(e) => setName(e.target.value)} maxLength={40} />
          </label>
          <button type="submit">{type === 'company' ? 'Marcar festius d’empresa' : type === 'other' ? 'Marcar altres' : 'Marcar festiu'}</button>
          <p className="muted small">
            Els festius generals es mostren en vermell i els d’empresa en taronja. Tots dos bloquegen reserves.
            Al calendari pots seleccionar una data o treure un festiu existent.
          </p>
        </form>

        <div className="panel">
          <h3>Festius {seasonStart}/{seasonStart + 1}</h3>
          {seasonHolidays.length === 0 ? (
            <p className="muted">No hi ha festius configurats.</p>
          ) : (
            <div className="holiday-list-scroll">
              <table className="entries">
                <tbody>
                  {seasonHolidays.map((h) => (
                    <tr key={h.id}>
                      <td><span className={`holiday-kind ${h.type === 'public' ? 'public-holiday' : h.type === 'company' ? 'company-holiday' : 'other-holiday'}`}>{holidayTypeName(h.type)}</span></td>
                      <td>{formatDate(h.date)}</td>
                      <td>{h.name}</td>
                      <td>
                        <button className="link danger" onClick={() => removeHoliday(h)} title="Treure festiu">❌</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
