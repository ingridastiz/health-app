# INGRID Daily Index - instrucciones para Claude

El código de este repo es la única fuente de verdad. Si una descripción (este archivo incluido) contradice el código, vale el código: avisar y corregir la descripción.

## Qué es
App personal de check-in diario. Un solo archivo: `index.html`. Sin build, sin dependencias más allá de Chart.js por CDN. Se despliega en Netlify (https://health-ingrid.netlify.app) conectado a este repo: un push a `main` redeploya solo. Por eso, nunca hacer push sin confirmación explícita.

## Cómo funciona
- 9 sliders (1-10) y tres números:
  - Happiness Index (HI): promedio de los 4 primeros (Sleep, Body, Inner Weather, Presence).
  - Development Index (DI): promedio de los 5 restantes (Clarity, Self-acceptance, Structure, Growth, Connection).
  - Overall: promedio de HI y DI.
- Persistencia doble: `localStorage` (clave `ingrid_daily_index_v1`) y una Google Sheet vía Apps Script.
- El array `LBS` debe mantenerse alineado con el orden de los inputs `t1..t4` y `d1..d5`. Si cambia el nombre de una variable hay que tocarlo en tres lugares: el check-in, `LBS` y el `<select>` del tab Journey. El texto de la tarjeta "indices, not one score" del tab Why this también los nombra.

## Backend
Código en `apps-script/Code.gs`. Vive además en el editor de Apps Script de la planilla: la copia del repo tiene que ser idéntica a la desplegada. Si se cambia el script en el repo, avisar a Ingrid que lo pegue en el editor y publique una versión nueva (Implementar > Gestionar implementaciones > editar > Versión: nueva). Los cambios en Script Properties no necesitan redespliegue.

URL publicada en la constante `API` de `index.html`. Contrato: POST con body JSON `{key, action, entry?}`.
- `action: 'list'` devuelve `{ok:true, data:[...]}`.
- `action: 'save'` hace upsert por fecha. No hace falta deduplicar del lado del cliente.
- La passphrase se guarda en la Script Property `PASS` (exactamente así, en mayúsculas) y en `localStorage` del navegador (`ingrid_daily_index_key`) hasta que se toca "Lock app".
- Errores: `{error:'auth'}` (passphrase incorrecta o ausente), `{error:'setup', message}` (falta `PASS`), `{error:'bad request', message}`, `{error:'unknown action'}`. El frontend muestra el `message` (o el `error`) como "Server error: ...".
- Fechas: el script guarda la columna `date` como texto `yyyy-MM-dd`. Verificado el 13/09/2026 que el cliente las lee sin desfase de zona horaria. No tocar `normDate()` por esto.

## Decisiones tomadas (no marcarlas como errores)
- "Real connection yesterday" pregunta por ayer a propósito, aunque las otras ocho preguntas son sobre hoy.
- Las flechas tipográficas en botones ("Next →", "← Back", "See journey →") no cuentan como iconos.
- El encabezado de la columna 7 de la planilla y de `HEADERS` en el script sigue siendo `mood`, aunque la variable ahora se llama Inner Weather. Solo afecta el nombre de la columna; los datos van por posición.

## Reglas sobre los datos
- Si un cambio toca el esquema de datos (`date, ihi, idi, overall, values[9]`), subir la versión de la clave de `localStorage` (`_v2`) con migración, adaptar `apps-script/Code.gs`, y decirle a Ingrid qué pasa con su historial antes de aplicarlo.
- Antes de probar cambios que toquen `localStorage` o la sincronización, recordarle usar "Export data" en el tab Journey.
- Los índices son promedios simples, sin respaldo psicométrico. Si se les da un uso que dependa de la validez de la medición, decirlo.

## Deuda técnica conocida
- `mergeRemote()` le da prioridad al dato remoto sobre el local para la misma fecha, sin comparar cuál es más reciente. Si un guardado falla, el check-in nuevo queda solo en el dispositivo y la siguiente sincronización lo pisa. Decisión consciente: no hay cola de reintentos. No agregar una sin pedirlo.
- `saveEntry_()` no usa `LockService`: dos guardados simultáneos de la misma fecha podrían duplicar la fila. Improbable con un solo usuario.
- Sin conexión no se puede desbloquear la app si antes se bloqueó.
- La seguridad es una sola passphrase contra un endpoint público. Sin cuentas ni rate limiting.

## Licencia
MIT No Attribution (`LICENSE`): cualquiera puede copiar y hacer derivados sin mencionar el original. El `README.md` explica cómo armar una versión propia; si cambia el setup, actualizarlo.

## Cómo trabajar
- Cambios chicos y quirúrgicos sobre `index.html`. No refactorizar ni migrar a un framework.
- Verificar la sintaxis del script inline antes de commitear.
- La app se usa mayormente desde un Samsung Galaxy S20 Ultra: revisar que no se rompa el layout en pantalla angosta.
- Nunca usar iconos ni emojis, ni en la UI ni en los mensajes (salvo las flechas de arriba).
- Nunca poner en el repo datos sensibles: passphrase, ID del proyecto de Apps Script, ID de la planilla, datos personales. El repo es público.
- Estilo de respuesta: directo, crítico, sin adulación. Señalar errores y puntos ciegos aunque no se pregunten.
