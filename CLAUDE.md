# INGRID Daily Index - instrucciones para Claude

El código de este repo es la única fuente de verdad. Si una descripción (este archivo incluido) contradice el código, vale el código: avisar y corregir la descripción.

## Qué es
App personal de check-in diario, que Ingrid hace a la mañana. Un solo archivo: `index.html`. Sin build, sin dependencias más allá de Chart.js por CDN. Se despliega en Netlify (https://health-ingrid.netlify.app) conectado a este repo: un push a `main` redeploya solo. Nunca hacer push sin confirmación explícita. Si un deploy falla con "Host key verification failed", es un problema de Netlify: reintentar con Trigger deploy > Deploy project.

## Cómo funciona
- 8 sliders (1-10), en dos pantallas, sin textos de extremos de escala (decisión de Ingrid):
  - Balance Index (BI), "How was yesterday?": Real connection, Sustainable effort, Joy, Movement (`y1..y4`).
  - Rise Index (RI), "How do I feel about today?": Body energy, Self-acceptance, Health routine, Enthusiasm (`r1..r4`).
  - Overall: promedio de BI y RI.
- En todas las preguntas, más es mejor. Las preguntas van en primera persona ("I").
- Fase de cada día, calculada en `phaseAt()` con Sustainable effort (ayer), Body energy y Enthusiasm (hoy). Bajo = 4 o menos, bien = 6 o más:
  - Drained: energía baja y effort bajo (hoy o en la entrada anterior, hasta 2 días antes).
  - Overdrive: effort bajo.
  - Stopped: energía y entusiasmo bajos.
  - Bored: entusiasmo bajo.
  - Steady: los tres en 6 o más.
  - Mixed: el resto.
  Objetivo: que Ingrid vea su ciclo aburrimiento > sobreexigencia > cansancio > parar todo. La fase se muestra en cada tarjeta de Journey, no en Result (a pedido de Ingrid); el coach avisa cuando la fase es Bored. Tocar una tarjeta de Journey abre el detalle de ese día (BI/RI, coach y barras), generado por `detailHtml()`, la misma función que arma Result.
- Persistencia doble: `localStorage` (clave `ingrid_daily_index_v2`) y una Google Sheet vía Apps Script.
- `IDS`, `LBS`, `values`, el `<select>` de Journey y las columnas del Apps Script comparten el mismo orden. Si cambia una pregunta hay que tocar: el HTML del check-in, `LBS`, el `<select>`, el mapa `wt` de mensajes del coach, el texto de "Why this", `HEADERS` en `apps-script/Code.gs` y `README.md`.

## Backend
Código en `apps-script/Code.gs`. Vive además en el editor de Apps Script de la planilla: la copia del repo tiene que ser idéntica a la desplegada. Si se cambia el script en el repo, avisar a Ingrid que lo pegue en el editor y publique una versión nueva (Implementar > Gestionar implementaciones > editar > Versión: nueva). Los cambios en Script Properties no necesitan redespliegue.

URL publicada en la constante `API` de `index.html`. Contrato: POST con body JSON `{key, action, entry?}`.
- `action: 'list'` devuelve `{ok:true, data:[{date, bi, ri, overall, values[8]}]}`.
- `action: 'save'` hace upsert por fecha. No hace falta deduplicar del lado del cliente.
- Hoja `data`, columnas: `date, bi, ri, overall, connection, effort, joy, movement, energy, selfAcceptance, healthRoutine, enthusiasm`. El script reescribe la fila 1 con esos encabezados en cada llamada.
- La passphrase se guarda en la Script Property `PASS` (exactamente así, en mayúsculas) y en `localStorage` del navegador (`ingrid_daily_index_key`). No hay botón para bloquear la app (se quitó a pedido de Ingrid): la passphrase solo se olvida si el servidor responde `auth` o si se borran los datos del sitio en el navegador.
- Errores: `{error:'auth'}` (passphrase incorrecta o ausente), `{error:'setup', message}` (falta `PASS`), `{error:'bad request', message}`, `{error:'unknown action'}`. El frontend muestra el `message` (o el `error`) como "Server error: ...".
- Fechas: el script guarda la columna `date` como texto `yyyy-MM-dd`. Verificado el 13/09/2026 que el cliente las lee sin desfase de zona horaria. No tocar `normDate()` por esto.

## Decisiones tomadas (no marcarlas como errores)
- Las flechas tipográficas en botones ("Next →", "← Back", "See journey →") no cuentan como iconos.
- Se sacaron a propósito Clarity, Growth y Sleep (siempre daban alto) y la versión anterior de 9 preguntas con HI/DI. El historial viejo se descartó el 13/09/2026.
- No hay exportación ni botón de bloqueo en la app. No volver a agregarlos sin pedirlo.
- Colores: BI en rosa (`#B04A77`), RI en verde (`#24705F`). Nada de marrón ni ámbar.
- Sin subtítulo bajo el título de cada pantalla del check-in, sin franja ni leyenda de fases en Journey, y sin las tarjetas numeradas en "Why this". Se sacaron a pedido de Ingrid.

## Reglas sobre los datos
- Si un cambio toca el esquema de datos, subir la versión de la clave de `localStorage` (`_v3`), adaptar `apps-script/Code.gs`, y decirle a Ingrid qué pasa con su historial antes de aplicarlo.
- El backup es la planilla: antes de probar cambios que toquen `localStorage` o la sincronización, sugerir hacer una copia de la hoja (Archivo > Hacer una copia).
- Los índices y las fases son reglas simples, sin respaldo psicométrico. Si se les da un uso que dependa de la validez de la medición, decirlo.

## Deuda técnica conocida
- `mergeRemote()` le da prioridad al dato remoto sobre el local para la misma fecha, sin comparar cuál es más reciente. Si un guardado falla, el check-in nuevo queda solo en el dispositivo y la siguiente sincronización lo pisa. Decisión consciente: no hay cola de reintentos. No agregar una sin pedirlo.
- `saveEntry_()` no usa `LockService`: dos guardados simultáneos de la misma fecha podrían duplicar la fila. Improbable con un solo usuario.
- Sin botón de bloqueo: cualquiera con acceso al dispositivo desbloqueado entra a la app y ve el historial.
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
