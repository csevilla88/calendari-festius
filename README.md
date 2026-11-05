# Calendari de festius (desembre – gener)

Mini aplicació en **Node.js (Express)** + **React (Vite)** per gestionar els dies de festa
que agafa cada usuari al desembre i al gener.

## Funcionalitats

- **Calendari**: mostra el desembre i el gener de la temporada escollida (◀ ▶ per canviar d'any)
  amb els dies de festa de tots els usuaris (un color per usuari). Es pot filtrar per usuari
  i es veu el resum d'hores agafades / totals / restants de cadascun.
- **Els meus dies de festa**:
  - Crear usuaris amb el seu **total d'hores** disponibles (editable manualment en qualsevol moment).
  - Afegir dies (data + hores d'aquell dia) des del formulari o fent clic al calendari.
  - Editar o eliminar dies. Les hores restants es recalculen a l'instant.
  - No permet superar les hores totals ni posar un total inferior a les hores ja agafades.
- **Configuració – festius**:
  - Afegir festius generals i festius d'empresa, que es mostren en vermell i taronja, respectivament.
  - Afegir intervals de dies consecutius de festius d'empresa en una sola operació.
  - Ningú no pot agafar hores aquests dies. Si ja hi ha reserves, s'avisa i, si es confirma,
    s'anul·len les afectades i se'n retornen les hores.

## Requisits

Node.js 18 o superior i una instància de MongoDB.

## Instal·lació

```bash
npm run install:all
```

## Desenvolupament

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Producció

```bash
npm run build
npm start
```

L'aplicació completa queda a http://localhost:3001 (port configurable amb `PORT`).

## Dades

Les dades s'emmagatzemen a la base `calendario_festivos` de MongoDB (configurable amb
`MONGO_DB_NAME`). La connexió es configura amb `MONGO_URI` al fitxer `server/.env`; aquest
fitxer no s'ha de pujar al repositori. L'API usa el port `3001` per defecte.

## Desplegament

Al servei de Render, configura `MONGO_URI` i `CORS_ORIGIN` (el domini complet de Vercel,
per exemple `https://calendari.vercel.app`). A Vercel, defineix `VITE_API_URL` amb la URL
base del servei Render, sense una ruta com `/api`. Després de canviar `VITE_API_URL`, torna
a desplegar Vercel perquè la variable queda inclosa al build del frontend.

## API

| Mètode | Ruta | Descripció |
|--------|------|------------|
| GET | `/api/users` | Llista d'usuaris amb `usedHours` i `remainingHours` |
| POST | `/api/users` | `{ name, totalHours }` |
| PUT | `/api/users/:id` | `{ name?, totalHours? }` |
| DELETE | `/api/users/:id` | Elimina l'usuari i els seus dies |
| GET | `/api/entries?userId=` | Dies de festa |
| POST | `/api/entries` | `{ userId, date: "YYYY-MM-DD", hours }` (si el dia ja existeix, n'actualitza les hores) |
| DELETE | `/api/entries/:id` | Elimina un dia |
| GET | `/api/holidays` | Llista festius generals (`public`), d'empresa (`company`) i altres (`other`) |
| POST | `/api/holidays` | `{ date, name?, type?, force? }` — `type` pot ser `public`, `company` o `other` |
| POST | `/api/holidays/bulk` | `{ dates, name?, type?, force? }` — crea diverses dates del tipus indicat; 409 amb `conflicts` si hi ha reserves |
| DELETE | `/api/holidays/:id` | Treu un festiu |
