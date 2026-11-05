import { fmtHours, formatDate, MONTH_NAMES, seasonMonths, toISO } from '../utils.js';
import { colorFor } from '../utils.js';

export default function TimelineScreen({ users, entries, holidays, seasonStart }) {
  const months = seasonMonths(seasonStart).map(({ year, month }) => ({
    year,
    month,
    days: Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => {
      const day = index + 1;
      const date = toISO(year, month, day);
      const weekday = new Date(year, month - 1, day).getDay();
      return { date, day, weekend: weekday === 0 || weekday === 6 };
    }),
  }));
  const days = months.flatMap((month) => month.days);
  const entriesByKey = new Map(entries.map((entry) => [`${entry.userId}:${entry.date}`, entry]));
  const holidaysByDate = new Map(holidays.map((holiday) => [holiday.date, holiday]));

  return (
    <section className="timeline-screen">
      <div className="timeline-toolbar">
        <h2>Línia temporal · {seasonStart}/{seasonStart + 1}</h2>
        <div className="timeline-legend" aria-label="Llegenda de festius">
          <span><i className="timeline-swatch public-holiday" /> Festiu</span>
          <span><i className="timeline-swatch company-holiday" /> Festiu d'empresa</span>
          <span><i className="timeline-swatch other-holiday" /> Altres</span>
        </div>
      </div>
      <div className="timeline-scroll" role="region" aria-label="Línia temporal de dies de festa per usuari" tabIndex="0">
        <table className="timeline-table">
          <thead>
            <tr>
              <th className="timeline-user-column timeline-month-spacer" rowSpan="2" scope="col">Usuari</th>
              {months.map((month) => (
                <th key={`${month.year}-${month.month}`} colSpan={month.days.length} scope="colgroup">
                  {MONTH_NAMES[month.month - 1]} {month.year}
                </th>
              ))}
            </tr>
            <tr>
              {days.map((day) => {
                const holiday = holidaysByDate.get(day.date);
                const holidayType = holiday?.type || 'company';
                const holidayClass = holiday ? ` holiday-${holidayType}` : '';
                return (
                  <th
                    key={day.date}
                    className={`timeline-day${day.weekend ? ' weekend' : ''}${holidayClass}`}
                    title={holiday ? `${formatDate(day.date)} · ${holiday.name || holidayType}` : formatDate(day.date)}
                    scope="col"
                  >
                    {day.day}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td className="timeline-empty" colSpan={days.length + 1}>Encara no hi ha usuaris.</td></tr>
            ) : users.map((user) => (
              <tr key={user.id}>
                <th className="timeline-user-column" scope="row">
                  <span className="timeline-user-name">
                    <i className="timeline-user-swatch" style={{ background: colorFor(user.id, users) }} />
                    {user.name}
                  </span>
                  <small>{fmtHours(user.usedHours)} / {fmtHours(user.totalHours)}</small>
                </th>
                {days.map((day) => {
                  const entry = entriesByKey.get(`${user.id}:${day.date}`);
                  const holiday = holidaysByDate.get(day.date);
                  const holidayClass = holiday ? ` holiday-${holiday.type || 'company'}` : '';
                  const title = entry
                    ? `${formatDate(day.date)} · ${fmtHours(entry.hours)}`
                    : holiday
                      ? `${formatDate(day.date)} · ${holiday.name || (holiday.type === 'company' ? "Festiu d'empresa" : holiday.type === 'other' ? 'Altres' : 'Festiu')}`
                      : formatDate(day.date);
                  return (
                    <td key={day.date} className={`timeline-cell${day.weekend ? ' weekend' : ''}${holidayClass}`} title={title}>
                      {entry && (
                        <span className="timeline-entry" style={{ background: colorFor(user.id, users) }}>
                          {Number(entry.hours).toLocaleString('ca-ES', { maximumFractionDigits: 1 })}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}