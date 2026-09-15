# Cumpleaños de Noemi

Página web local en React + Vite para el cumpleaños de Noemi. La experiencia abre principalmente en inglés e incluye un switch EN/ES para cambiar a español.

Incluye:

- Idioma principal en inglés con opción para español.
- Contador hasta el **20 de noviembre de 2026**.
- El 20 de noviembre muestra confetti y lluvia de globos.
- Galería animada con fotos de Noemi.
- Lista de destinos para escoger.
- Confirmación con clave antes de guardar.
- Elección irreversible persistida en PostgreSQL local.
- Ruta `/mural` para que amigas, amigos y familia dejen mensajes de cumpleaños persistidos como notas tipo post-it.

## Requisitos

- Node.js
- PostgreSQL local

## Configurar PostgreSQL

Crea la base de datos local:

```bash
createdb noemi_birthday
```

Copia el archivo de entorno:

```bash
cp .env.example .env
```

Por defecto usa:

```env
DATABASE_URL=postgres://localhost:5432/noemi_birthday
DESTINATION_SECRET=eduardomirey
PORT=4311
```

El servidor crea las tablas automáticamente al iniciar. También puedes correr manualmente:

```bash
psql postgres://localhost:5432/noemi_birthday -f db/schema.sql
```

## Ejecutar en desarrollo

```bash
npm install
npm run dev
```

- Web: `http://localhost:5174`
- API: `http://localhost:4311`

## Build para subir

```bash
npm run build
```

Los archivos estáticos quedan en `dist/`.

> Importante: como la elección se guarda en PostgreSQL, además del build estático necesitas correr el servidor Node (`npm start`) en donde tengas la base de datos. Una app React en el navegador no puede conectarse de forma segura directamente a PostgreSQL.

## Rutas

- `/` — countdown, fotos y selección de destino.
- `/mural` — mural de mensajes de cumpleaños para Noemi.

## Resetear datos durante pruebas

Si necesitas borrar la elección local mientras pruebas:

```bash
psql postgres://localhost:5432/noemi_birthday -c "DELETE FROM birthday_destination_choice;"
```

Si necesitas borrar mensajes de prueba del mural:

```bash
psql postgres://localhost:5432/noemi_birthday -c "DELETE FROM birthday_mural_messages;"
```

## Estructura

- `src/App.tsx` — UI, rutas locales, contador, modal de clave, selección de destinos y mural.
- `src/styles.css` — diseño visual, animaciones, confetti y globos.
- `server/index.mjs` — API mínima para PostgreSQL (`/api/choice` y `/api/messages`).
- `db/schema.sql` — tablas para la elección irreversible y mensajes del mural.
- `public/birthday/` — fotos optimizadas de Noemi.

## Si la página no carga

Verifica que no haya procesos viejos usando los puertos locales:

```bash
lsof -nP -iTCP:4311 -sTCP:LISTEN
lsof -nP -iTCP:5174 -sTCP:LISTEN
```

Si ves un proceso viejo de esta misma app, ciérralo y vuelve a correr:

```bash
npm run dev
```

También puedes limpiar procesos viejos de esta app con:

```bash
npm run stop:dev
```

La página puede verse en modo visual sin API, pero para guardar el destino o mensajes del mural necesita la API local y PostgreSQL activos.
