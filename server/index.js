import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { connectDB } from './db.js';
import User from './models/User.js';
import Entry from './models/Entry.js';
import Holiday from './models/Holiday.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const MAX_HOURS_PER_DAY = 24;

const app = express();
app.use(express.json());

const round2 = (n) => Math.round(n * 100) / 100;
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function isValidDecJanDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const real = dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  return real && (m === 12 || m === 1);
}

async function usedHours(userId, excludeEntryId) {
  const query = { userId };
  if (excludeEntryId) query.id = { $ne: excludeEntryId };
  const entries = await Entry.find(query).select('hours').lean();
  return round2(entries.reduce((sum, entry) => sum + entry.hours, 0));
}

function withSummary(user, used) {
  return { ...user.toObject(), usedHours: used, remainingHours: round2(user.totalHours - used) };
}

function parseHours(value, { allowZero }) {
  const n = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isFinite(n)) return null;
  if (n < 0 || (!allowZero && n === 0)) return null;
  return round2(n);
}

// ---------- Usuaris ----------
app.get('/api/users', asyncRoute(async (_req, res) => {
  const [users, entries] = await Promise.all([
    User.find(),
    Entry.find().select('userId hours').lean(),
  ]);
  const totals = new Map();
  for (const entry of entries) totals.set(entry.userId, (totals.get(entry.userId) || 0) + entry.hours);
  res.json(users.map((user) => withSummary(user, round2(totals.get(user.id) || 0))));
}));

app.post('/api/users', asyncRoute(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const totalHours = parseHours(req.body.totalHours, { allowZero: true });
  if (!name) return res.status(400).json({ error: 'El nom és obligatori.' });
  if (totalHours === null) return res.status(400).json({ error: 'Les hores totals han de ser un nombre ≥ 0.' });

  const normalizedName = name.toLowerCase();
  if (await User.exists({ normalizedName })) {
    return res.status(409).json({ error: 'Ja existeix un usuari amb aquest nom.' });
  }
  const user = await User.create({ name, normalizedName, totalHours });
  res.status(201).json(withSummary(user, 0));
}));

app.put('/api/users/:id', asyncRoute(async (req, res) => {
  const user = await User.findOne({ id: req.params.id });
  if (!user) return res.status(404).json({ error: 'Usuari no trobat.' });

  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) return res.status(400).json({ error: 'El nom és obligatori.' });
    const normalizedName = name.toLowerCase();
    if (await User.exists({ id: { $ne: user.id }, normalizedName })) {
      return res.status(409).json({ error: 'Ja existeix un usuari amb aquest nom.' });
    }
    user.name = name;
    user.normalizedName = normalizedName;
  }
  if (req.body.totalHours !== undefined) {
    const totalHours = parseHours(req.body.totalHours, { allowZero: true });
    if (totalHours === null) return res.status(400).json({ error: 'Les hores totals han de ser un nombre ≥ 0.' });
    const used = await usedHours(user.id);
    if (totalHours < used) {
      return res.status(400).json({
        error: `L'usuari ja ha agafat ${used} h; el total no pot ser inferior.`,
      });
    }
    user.totalHours = totalHours;
  }
  await user.save();
  res.json(withSummary(user, await usedHours(user.id)));
}));

app.delete('/api/users/:id', asyncRoute(async (req, res) => {
  const user = await User.findOne({ id: req.params.id });
  if (!user) {
    return res.status(404).json({ error: 'Usuari no trobat.' });
  }
  await Promise.all([user.deleteOne(), Entry.deleteMany({ userId: req.params.id })]);
  res.status(204).end();
}));

// ---------- Dies de festa ----------
app.get('/api/entries', asyncRoute(async (req, res) => {
  const { userId } = req.query;
  const query = userId ? { userId } : {};
  res.json(await Entry.find(query).sort({ date: 1 }));
}));

// Creates the entry, or replaces the hours if the user already has that day.
app.post('/api/entries', asyncRoute(async (req, res) => {
  const { userId, date } = req.body;
  const hours = parseHours(req.body.hours, { allowZero: false });

  const user = await User.findOne({ id: userId });
  if (!user) return res.status(404).json({ error: 'Usuari no trobat.' });
  if (!isValidDecJanDate(date)) {
    return res.status(400).json({ error: 'La data ha de ser un dia de desembre o gener.' });
  }
  if (hours === null || hours > MAX_HOURS_PER_DAY) {
    return res.status(400).json({ error: `Les hores han de ser més grans que 0 i com a màxim ${MAX_HOURS_PER_DAY}.` });
  }
  const holiday = await Holiday.findOne({ date });
  if (holiday) {
    return res.status(400).json({
      error: `El ${date} és festiu d'empresa${holiday.name ? ` (${holiday.name})` : ''}; no s'hi poden agafar hores.`,
    });
  }

  const existing = await Entry.findOne({ userId, date });
  const available = round2(user.totalHours - await usedHours(userId, existing?.id));
  if (hours > available) {
    return res.status(400).json({
      error: `No té prou hores. Disponibles: ${available} h, sol·licitades: ${hours} h.`,
    });
  }

  if (existing) {
    existing.hours = hours;
    await existing.save();
    return res.json(existing);
  }
  const entry = await Entry.create({ userId, date, hours });
  res.status(201).json(entry);
}));

app.delete('/api/entries/:id', asyncRoute(async (req, res) => {
  const entry = await Entry.findOne({ id: req.params.id });
  if (!entry) {
    return res.status(404).json({ error: 'Registre no trobat.' });
  }
  await entry.deleteOne();
  res.status(204).end();
}));

// ---------- Festius d'empresa (configuració) ----------
app.get('/api/holidays', asyncRoute(async (_req, res) => {
  res.json(await Holiday.find().sort({ date: 1 }));
}));

// If users already took hours that day, responds 409 with the conflicts
// unless `force: true` is sent, in which case those entries are removed.
app.post('/api/holidays', asyncRoute(async (req, res) => {
  const { date, force } = req.body;
  const name = String(req.body.name || '').trim();
  if (!isValidDecJanDate(date)) {
    return res.status(400).json({ error: 'La data ha de ser un dia de desembre o gener.' });
  }

  if (await Holiday.exists({ date })) {
    return res.status(409).json({ error: "Aquest dia ja està marcat com a festiu d'empresa." });
  }

  const conflicts = await Entry.find({ date });
  if (conflicts.length && !force) {
    const userIds = [...new Set(conflicts.map((entry) => entry.userId))];
    const users = await User.find({ id: { $in: userIds } }).select('id name');
    const names = new Map(users.map((user) => [user.id, user.name]));
    const detail = conflicts.map((e) => ({
      userName: names.get(e.userId) ?? '?',
      hours: e.hours,
    }));
    return res.status(409).json({
      error: 'Hi ha usuaris que ja han agafat hores aquest dia.',
      conflicts: detail,
    });
  }

  if (conflicts.length) await Entry.deleteMany({ date });
  const holiday = await Holiday.create({ date, name });
  res.status(201).json({ ...holiday.toObject(), removedEntries: conflicts.length });
}));

app.delete('/api/holidays/:id', asyncRoute(async (req, res) => {
  const holiday = await Holiday.findOne({ id: req.params.id });
  if (!holiday) {
    return res.status(404).json({ error: 'Festiu no trobat.' });
  }
  await holiday.deleteOne();
  res.status(204).end();
}));

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta API no trobada.' });
});

// ---------- Frontend compilat (producció) ----------
const distDir = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Aquest registre ja existeix.' });
  }
  const status = Number(err.status || err.statusCode);
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: status === 400 ? 'El JSON de la petició no és vàlid.' : 'No s’ha pogut processar la petició.' });
  }
  res.status(500).json({ error: 'Error intern del servidor.' });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`Servidor escoltant a http://localhost:${PORT}`));
}

start().catch((error) => {
  console.error('No s’ha pogut iniciar el servidor:', error.message);
  process.exitCode = 1;
});
