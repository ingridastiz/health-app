/**
 * INGRID Daily Index - backend en Google Apps Script.
 *
 * La passphrase NO va en este archivo. Se guarda en:
 *   Project Settings > Script Properties > propiedad "PASS"
 *
 * La hoja de calculo usa UNA sola pestana: "data".
 * Columnas: date | ihi | idi | overall | sleep | body | mood | presence |
 *           clarity | selfAcceptance | structure | growth | connection
 */

var SHEET_NAME = 'data';
var HEADERS = ['date','ihi','idi','overall','sleep','body','mood','presence','clarity','selfAcceptance','structure','growth','connection'];

function getPass_() {
  return PropertiesService.getScriptProperties().getProperty('PASS') || '';
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function tz_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
  }
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  // La columna de fechas siempre como texto plano, para que Sheets no la
  // convierta en Date y se desfase por zona horaria.
  sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  return sh;
}

/**
 * Acepta Date, numero de serie de Sheets o texto, y siempre devuelve
 * yyyy-MM-dd (o '' si no se puede interpretar).
 */
function toDateStr_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  }
  if (typeof v === 'number' && v > 20000) {
    var base = new Date(Date.UTC(1899, 11, 30));
    var d1 = new Date(base.getTime() + Math.round(v) * 86400000);
    return Utilities.formatDate(d1, 'UTC', 'yyyy-MM-dd');
  }
  var s = String(v == null ? '' : v).trim();
  var m = s.match(/^\d{4}-\d{2}-\d{2}/);
  if (m) return m[0];
  var d2 = new Date(s);
  if (!isNaN(d2.getTime())) return Utilities.formatDate(d2, tz_(), 'yyyy-MM-dd');
  return '';
}

function readAll_() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var rows = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var d = toDateStr_(r[0]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    out.push({
      date: d,
      ihi: Number(r[1]),
      idi: Number(r[2]),
      overall: Number(r[3]),
      values: r.slice(4, 13).map(Number)
    });
  }
  out.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  return out;
}

function saveEntry_(e) {
  var date = String(e.date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('bad date');
  var values = (e.values || []).slice(0, 9).map(Number);
  while (values.length < 9) values.push(0);
  var row = [date, Number(e.ihi), Number(e.idi), Number(e.overall)].concat(values);

  var sh = sheet_();
  var last = sh.getLastRow();
  if (last >= 2) {
    var dates = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < dates.length; i++) {
      if (toDateStr_(dates[i][0]) === date) {
        var target = sh.getRange(i + 2, 1, 1, HEADERS.length);
        target.setValues([row]);
        sh.getRange(i + 2, 1).setNumberFormat('@').setValue(date);
        return;
      }
    }
  }
  sh.appendRow(row);
  sh.getRange(sh.getLastRow(), 1).setNumberFormat('@').setValue(date);
}

/**
 * Normaliza de una sola vez todas las fechas ya cargadas a texto yyyy-MM-dd.
 * Se ejecuta a mano desde el editor (Ejecutar > fixDates). No hace falta
 * para el funcionamiento diario.
 */
function fixDates() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return;
  var rng = sh.getRange(2, 1, last - 1, 1);
  var vals = rng.getValues().map(function (r) { return [toDateStr_(r[0])]; });
  rng.setNumberFormat('@');
  rng.setValues(vals);
}

function handle_(payload) {
  var pass = getPass_();
  if (!pass) return json_({ error: 'setup', message: 'Falta la propiedad PASS' });
  if (!payload || String(payload.key || '') !== pass) return json_({ error: 'auth' });

  var action = String(payload.action || 'list');
  if (action === 'list') return json_({ ok: true, data: readAll_() });
  if (action === 'save') {
    saveEntry_(payload.entry || {});
    return json_({ ok: true, data: readAll_() });
  }
  return json_({ error: 'unknown action' });
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    return handle_(payload);
  } catch (err) {
    return json_({ error: 'bad request', message: String(err) });
  }
}

/**
 * Sin passphrase no devuelve datos. Existe solo para que abrir la URL
 * en el navegador no exponga nada.
 */
function doGet() {
  return json_({ error: 'auth' });
}
