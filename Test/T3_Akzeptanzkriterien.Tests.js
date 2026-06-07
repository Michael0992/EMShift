// T3_Akzeptanzkriterien.Tests.js
// Tests fuer Task T3: "Migriere die Route 'Spielraum' von index.js zu einem neuen Router unter
// Router/gameroom.js. Aendere die Route zu einer POST-Route."
//
// Bezug zu spec.md: Akzeptanzkriterium "Die Funktion schickt eine Anfrage an den Server, um einen
// Gegner zu suchen" setzt voraus, dass der Server eine entsprechende Route bereitstellt. T3 erstellt
// diese als POST-Route im neuen Router.
//
// Reines Node.js (kein Test-Framework) gemaess constitution.md; echtes Express + echte HTTP-Anfragen.

const h = require('./lib/serverTestHelpers');

(async function () {
    const checker = h.createChecker('T3 Akzeptanzkriterien (spec.md) + Migration');

    // --- Router laden ---
    let router = null;
    let loadErr = null;
    try { router = h.loadGameroomRouter(); }
    catch (e) { loadErr = e; }

    checker.check('Router/gameroom.js laedt und exportiert einen Express-Router',
        !!(router && typeof router === 'function' && Array.isArray(router.stack)),
        'Router/gameroom.js exportiert keinen gueltigen Express-Router' + (loadErr ? (' (' + loadErr.message + ')') : '') + '.');

    // --- Struktur: Route '/spielraum' ist POST (und nicht GET) ---
    let routeLayer = null;
    if (router && Array.isArray(router.stack)) {
        routeLayer = router.stack.find(function (l) { return l.route && l.route.path === '/spielraum'; });
    }
    const methods = (routeLayer && routeLayer.route) ? routeLayer.route.methods : null;

    checker.check("Der Router besitzt eine Route '/spielraum'",
        !!(routeLayer && routeLayer.route),
        "Keine Route '/spielraum' im Router gefunden.");
    checker.check("Die Route '/spielraum' ist als POST registriert",
        !!(methods && methods.post),
        "Route '/spielraum' ist nicht als POST registriert.");
    checker.check("Die Route '/spielraum' ist NICHT als GET registriert (von GET auf POST umgestellt)",
        !!(methods && !methods.get),
        "Route '/spielraum' ist (noch) als GET registriert.");

    // --- Verhalten: echtes Express + fetch ---
    if (router && typeof router === 'function') {
        let app = null;
        try {
            app = await h.startAppWithRouter(router, '/api'); // Mount wie spaeter in T10 -> /api/spielraum
            const resp = await h.httpJson(app.baseUrl + '/api/spielraum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'human' })
            });
            const ct = resp.headers['content-type'] || '';
            let data = null;
            try { data = JSON.parse(resp.text); } catch (e) { /* kein JSON */ }

            checker.check('POST /api/spielraum liefert HTTP 200',
                resp.status === 200, 'Status war ' + resp.status + '.');
            checker.check('POST /api/spielraum liefert eine JSON-Antwort',
                ct.indexOf('application/json') >= 0 && !!data && typeof data === 'object',
                'Antwort ist kein JSON (Content-Type: ' + ct + ').');

            const respGet = await h.httpJson(app.baseUrl + '/api/spielraum', { method: 'GET' });
            checker.check('GET /api/spielraum wird nicht als Matchmaking-Route behandelt (404)',
                respGet.status === 404, 'GET lieferte Status ' + respGet.status + ' (erwartet 404).');
        } catch (e) {
            checker.check('Server-Verhaltenstest ist ausfuehrbar', false, 'Fehler: ' + e.message);
        } finally {
            if (app) { await app.close(); }
        }
    }

    // --- Migration: index.js definiert die Route nicht mehr ---
    let indexSrc = '';
    try { indexSrc = h.getIndexJsSource(); } catch (e) { /* ignorieren */ }
    checker.check('index.js definiert keine /spielraum-Route mehr (Migration aus index.js)',
        !!indexSrc && !/app\.(get|post|put|delete)\s*\(\s*['"]\/spielraum['"]/.test(indexSrc),
        'index.js definiert weiterhin eine /spielraum-Route.');

    h.finishProcess(checker.finish());
})();
