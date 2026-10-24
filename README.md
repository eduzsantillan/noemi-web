# Cumpleaños de Noemi

Página web local en React + Vite para el cumpleaños de Noemi. La experiencia abre principalmente en inglés e incluye un switch EN/ES para cambiar a español.

Incluye:

- Idioma principal en inglés con opción para español.
- Contador hasta el **20 de noviembre de 2026**.
- El 20 de noviembre muestra confetti y lluvia de globos.
- Galería animada con fotos de Noemi.
- Lista de destinos para escoger exactamente 3 finalistas.
- Confirmación con clave de broma antes de guardar.
- Terna irreversible persistida en PostgreSQL/Neon.
- Ruta `/mural` para que amigas, amigos y familia dejen mensajes de cumpleaños persistidos como notas tipo post-it.
- El mural abre directamente como un lienzo tipo Miro: arrastra cualquier nota con dedo o mouse y desplaza el fondo para recorrerlo. Una sola acción abre el formulario de nueva nota.
- Cada post-it puede incluir una imagen opcional, persistida junto al mensaje.
- Al crear una nota puedes elegir entre seis colores y diseños de confeti, globos, pastel o lisa, con vista previa. El estilo se guarda con cada nota y se conserva al moverla o recargar el mural.
- Fotos HEIC/HEIF y fotos grandes se recortan/comprimen automáticamente antes de guardarse en una nota.

## Requisitos

- Node.js 20.9+
- PostgreSQL local o Neon
- En macOS, el servidor también puede usar `sips` como respaldo para convertir fotos HEIC de iPhone.

## Configurar PostgreSQL / Neon

Para desarrollo local puedes crear una base local:

```bash
createdb noemi_birthday
```

Copia el archivo de entorno:

```bash
cp .env.example .env
```

En `.env`, pon tu connection string real en `DATABASE_URL`. La clave de confirmación es una broma sembrada en la base de datos por la app, no una credencial sensible. Ejemplo de formato para Neon:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&channel_binding=require
PG_POOL_MAX=3
PORT=4311
```

> `.env` está ignorado por Git. No subas credenciales reales al repositorio.

El servidor/API crea y actualiza las tablas automáticamente al iniciar. También puedes correr manualmente:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

## Ejecutar en desarrollo

```bash
npm install
npm run dev
```

- Web: `http://localhost:5174`
- API: `http://localhost:4311`

## Deploy en Vercel

Este proyecto incluye funciones serverless en `/api`, así que Vercel puede servir el sitio estático y la API sin exponer credenciales al navegador.

En Vercel, agrega estas Environment Variables en **Project Settings → Environment Variables**:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&channel_binding=require
PG_POOL_MAX=3
```

Después deploya normalmente. `vercel.json` usa:

- `npm run build` como build command.
- `dist` como output estático.
- `/api/*` para la API serverless.
- fallback a `index.html` para rutas como `/mural`.

## Build local

```bash
npm run build
```

Los archivos estáticos quedan en `dist/`. Para correr localmente con la misma API Node:

```bash
npm start
```

## Rutas

- `/` — countdown, fotos y selección de 3 destinos finalistas.
- `/mural` — mural de mensajes de cumpleaños para Noemi, con notas movibles e imagen opcional; se abre desde el 20 de noviembre.

## Resetear datos durante pruebas

Si necesitas borrar la terna de destinos mientras pruebas:

```bash
psql "$DATABASE_URL" -c "DELETE FROM birthday_destination_choice;"
```

Si necesitas borrar mensajes o imágenes de prueba del mural:

```bash
psql "$DATABASE_URL" -c "DELETE FROM birthday_mural_messages;"
```

## Estructura

- `src/App.tsx` — UI, rutas locales, contador, modal de clave, selección de destinos y mural.
- `src/styles.css` — diseño visual, animaciones, confetti y globos.
- `server/api.mjs` — API compartida para PostgreSQL/Neon (`/api/choice`, `/api/messages`, preparación de imágenes y guardado de posición de notas).
- `server/index.mjs` — servidor local/Node que reutiliza la API y sirve `dist`.
- `api/[...path].mjs` — función serverless de Vercel que reutiliza la misma API.
- `db/schema.sql` — tablas para la terna irreversible, la clave de broma y mensajes del mural, incluyendo posición e imagen opcional.
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

## Home editorial y fotografías

La portada está aislada en `src/BirthdayHome.tsx` y `src/birthday-home.css`. Comparte con el mural una dirección editorial oscura, crema y cálida. El home tiene parallax moderado en móvil; las notas del lienzo solo se mueven al arrastrarlas. Las 17 fotos nuevas aparecen en un álbum accesible con flechas, Escape y deslizamiento táctil. El home tiene textos EN/ES, movimiento reducido, acceso con clave al mural hasta el 20 de noviembre y lectura/confirmación de los 3 destinos usando la misma API.

Los originales de `public/birthday/` no se modifican. El home sirve únicamente copias WebP responsivas de 640 y 1280 px desde `public/birthday/editorial/`. Para regenerarlas después de cambiar las imágenes:

```bash
npm run images:birthday
```

El orden, los textos alternativos y los pies de foto se editan en la colección `memories` de `src/BirthdayHome.tsx`. Agregar un archivo no lo publica automáticamente en el álbum: hay que incluirlo en esa colección.

## Mural mobile-first y pruebas

- `src/mural.css` define un lienzo a pantalla completa sin modos ni portada intermedia. Las notas se arrastran directamente; el fondo permite desplazamiento nativo en dos ejes (o arrastre de mouse). “Dejar una nota” abre un diálogo nativo con foco y Escape; cerrar no descarta el borrador.
- `src/mural-layout.ts` usa un lienzo lógico compartido de 1600 px y notas de 260 px con alturas medidas, evita colisiones y conserva las notas dentro del tablero. El ancho del dispositivo no reordena notas. Cargar o redimensionar nunca envía posiciones al servidor. El arrastre incluye desplazamiento automático cerca de los bordes y las flechas de teclado funcionan desde la cabecera.
- Los fallos de publicación conservan el borrador y la foto; los fallos de posición restauran la ubicación anterior. No se puede publicar mientras se prepara una imagen.
- La ruta exige una clave antes del 20 de noviembre de 2026, medianoche de Toronto. Desde ese instante queda pública automáticamente según el reloj del servidor, sin depender del reloj del visitante.

Pruebas de layout (Node 22; verificadas con 22.12):

```bash
npm test
npm run build
```

Las comprobaciones de navegador deben interceptar `/api/messages`, `/api/messages/:id/position` y `/api/choice` para no alterar datos reales. Cubrir publicación/foto, errores/reintento, borradores, teclado, arrastre táctil, `pointercancel`, movimiento reducido, idiomas y tamaños 320–1920 px. La emulación no reemplaza una prueba final en iPhone/Safari real.

## Clave temporal del mural

Configurar `MURAL_PASSPHRASE` en el archivo `.env` local y en las variables de servidor del proyecto Vercel. No usar prefijo `VITE_`, no poner la clave en el código ni comitearla. Sin esta variable, el acceso anticipado permanece cerrado.

`GET /api/mural-access` comprueba el acceso; `POST /api/mural-access` recibe la clave y crea una cookie HttpOnly firmada, SameSite=Strict y Secure sobre HTTPS. El servidor protege notas, subidas de imagen y cambios de posición; cambiar la fecha del navegador no evita el control. El endpoint de acceso no depende de la base de datos. Hay un límite básico de intentos por instancia (no sustituye rate limiting distribuido).

El **20 de noviembre de 2026 a las 00:00 de America/Toronto (05:00 UTC)** se deja de exigir clave, incluso si sigue configurada la variable. Las páginas de acceso abiertas comprueban automáticamente el cambio. No hace falta una automatización ni volver a desplegar ese día. Las notas siguen almacenadas; no se borra ningún dato ni se modifica la clave de destinos.
