# INGRID Daily Index

A personal daily check-in. Nine sliders from 1 to 10 turn into three numbers:

- **Happiness Index (HI):** average of Sleep, Body, Inner Weather, Presence.
- **Development Index (DI):** average of Clarity, Self-acceptance, Structure, Growth, Connection.
- **Overall:** average of HI and DI.

The Journey tab charts the history, per index or per question.

Everything is one file, `index.html`, with no build step. The only external dependency is Chart.js from cdnjs. Check-ins are kept in the browser's `localStorage` and synced to a Google Sheet through a small Google Apps Script backend (`apps-script/Code.gs`), protected by a passphrase.

## Make your own

You need a Google account and somewhere to host a static file (Netlify, GitHub Pages, or similar).

1. **Create the sheet.** New Google Sheet. The script creates the `data` tab and its headers on first use.
2. **Add the backend.** In the sheet: Extensions > Apps Script. Replace the default code with `apps-script/Code.gs`.
3. **Set your passphrase.** Project Settings > Script Properties > add a property named exactly `PASS` with a long, random passphrase. It never goes in the code.
4. **Deploy.** Deploy > New deployment > type Web app. Execute as: Me. Who has access: Anyone. Copy the Web app URL (ends in `/exec`).
5. **Point the app to your backend.** In `index.html`, replace the value of `const API=` with your URL. If you skip this, your copy will talk to the original backend and every call will fail.
6. **Publish** `index.html` on your host and open it. Enter the passphrase from step 3.

Changing the Apps Script code later requires Deploy > Manage deployments > edit > Version: New. Changing Script Properties does not.

## Backend contract

`POST` to the Web app URL with a JSON body (sent as `text/plain` to avoid a CORS preflight):

| Request | Response |
|---|---|
| `{key, action:'list'}` | `{ok:true, data:[{date, ihi, idi, overall, values:[9 numbers]}]}` |
| `{key, action:'save', entry}` | Upsert by `date` (`yyyy-MM-dd`), then `{ok:true, data:[...]}` |
| wrong or missing `key` | `{error:'auth'}` |
| `PASS` not set | `{error:'setup', message:'Falta la propiedad PASS'}` |

## Known limitations

- One shared passphrase against a public endpoint. No accounts, no rate limiting.
- When syncing, the sheet wins over the device for the same date. If a save fails and the app syncs before you save again, that day's local check-in is replaced by the older version from the sheet.

## License

MIT No Attribution. Copy, modify and publish derived versions freely; no credit required. See `LICENSE`.
