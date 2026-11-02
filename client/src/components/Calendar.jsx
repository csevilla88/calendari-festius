import { MONTH_NAMES, WEEKDAYS, colorFor, fmtHours, seasonMonths, toISO } from '../utils.js';

function MonthGrid({ year, month, entriesByDate, holidaysByDate, users, selectedDate, onDayClick, allowHolidayClick }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Monday-first
  const todayISO = (() => {
    const t = new Date();
    return toISO(t.getFullYear(), t.getMonth() + 1, t.getDate());
  })();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} className="day empty" />);

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(year, month, d);
    const weekday = (offset + d - 1) % 7;
    const dayEntries = entriesByDate[iso] || [];
    const holiday = holidaysByDate[iso];
    const holidayType = holiday?.type || 'company';
    const clickable = onDayClick && (!holiday || allowHolidayClick);
    const classes = ['day'];
    if (weekday >= 5) classes.push('weekend');
    if (holiday) classes.push('holiday', holidayType === 'company' ? 'company-holiday' : 'public-holiday');
    if (iso === todayISO) classes.push('today');
    if (iso === selectedDate) classes.push('selected');
    if (clickable) classes.push('clickable');

    cells.push(
      <div
        key={iso}
        className={classes.join(' ')}
        onClick={clickable ? () => onDayClick(iso) : undefined}
        title={holiday ? `${holidayType === 'company' ? "Festiu d'empresa" : 'Festiu'}${holiday.name ? `: ${holiday.name}` : ''}` : undefined}
      >
        <span className="day-number">{d}</span>
        {holiday && <span className="holiday-name">{holiday.name || (holidayType === 'company' ? "Festiu d'empresa" : 'Festiu')}</span>}
        <div className="chips">
          {dayEntries.map((e) => {
            const user = users.find((u) => u.id === e.userId);
            return (
              <span
                key={e.id}
                className="chip"
                style={{ background: colorFor(e.userId, users) }}
                title={`${user?.name ?? '?'}: ${fmtHours(e.hours)}`}
              >
                {user?.name ?? '?'} · {fmtHours(e.hours)}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section className="month">
      <h2>{MONTH_NAMES[month - 1]} {year}</h2>
      <div className="grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="weekday">{w}</div>
        ))}
        {cells}
      </div>
    </section>
  );
}

export default function Calendar({
  users, entries, holidays = [], seasonStart, selectedDate, onDayClick, allowHolidayClick = false,
}) {
  const entriesByDate = {};
  for (const e of entries) (entriesByDate[e.date] ||= []).push(e);
  const holidaysByDate = Object.fromEntries(holidays.map((h) => [h.date, h]));

  return (
    <div className="calendar">
      {seasonMonths(seasonStart).map(({ year, month }) => (
        <MonthGrid
          key={`${year}-${month}`}
          year={year}
          month={month}
          users={users}
          entriesByDate={entriesByDate}
          holidaysByDate={holidaysByDate}
          selectedDate={selectedDate}
          onDayClick={onDayClick}
          allowHolidayClick={allowHolidayClick}
        />
      ))}
    </div>
  );
}
