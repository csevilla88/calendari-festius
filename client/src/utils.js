export const MONTH_NAMES = [
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre',
];
export const WEEKDAYS = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];

const PALETTE = [
  '#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c',
  '#0891b2', '#c026d3', '#65a30d', '#b45309', '#4f46e5',
];

export function colorFor(userId, users) {
  const idx = users.findIndex((u) => u.id === userId);
  return PALETTE[(idx < 0 ? 0 : idx) % PALETTE.length];
}

export const pad = (n) => String(n).padStart(2, '0');
export const toISO = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

// Dec/Jan "season": December of startYear and January of startYear + 1.
export function defaultSeasonStart(today = new Date()) {
  return today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
}

export function seasonMonths(startYear) {
  return [
    { year: startYear, month: 12 },
    { year: startYear + 1, month: 1 },
  ];
}

export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  const month = MONTH_NAMES[m - 1].toLowerCase();
  const prep = /^[aeiou]/.test(month) ? "d'" : 'de ';
  return `${WEEKDAYS[(wd + 6) % 7]} ${d} ${prep}${month} de ${y}`;
}

export const fmtHours = (h) => `${Number(h).toLocaleString('ca-ES', { maximumFractionDigits: 2 })} h`;
