// T10_Akzeptanzkriterien.Tests.js
// Tests fuer Task T10: Router/gameroom.js in index.js einbinden und Frontendpfad anpassen.
//
// Bezug zu spec.md (Akzeptanzkriterium):
//   "Die Funktion schickt eine Anfrage an den Server, um einen Gegner zu suchen."
//   Voraussetzung: der Router ist unter /api erreichbar und menu.js sendet an /api/spielraum.
//
// T10 umfasst:
//   1. index.js: Router/gameroom.js wird unter /api eingebunden (mount).
//   2. menu.js: startGame sendet POST an /api/spielraum (statt /spielraum).
//   3. menu.js: cancelSearch sendet DELETE an /api/spielraum (statt /spielraum).
//   4. menu.js: beforeunload-Handler sendet DELETE an /api/spielraum (statt /spielraum).
//
// Gemaess tests.md: positive UND negative Faelle + Negativ-Kontrolle.
// Quelltext-Pruefungen (index.js, menu.js) + verhaltensbasierte Pruefungen ueber menuTestHarness.

const fs = require('fs');
const path = require('path');
const h = require('./lib/serverTestHelpers');
const harness = require('./lib/menuTestHarness');

// Quelltext von index.js lesen (servertestHelpers bietet getIndexJsSource).
const indexSrc = h.getIndexJsSource();

// Quelltext von menu.js direkt lesen (menuTestHarness gibt den Pfad zurueck).
const menuSrc = fs.readFileSync(
    path.resolve(h.getKampfPath(), 'public', 'menu.js'), 'utf8'
);

// Responder: gibt immer 200 zurueck (URL-Pruefung, kein echter Server noetig).
function alwaysOkResponder(callNum, state, mkResp) {
    return mkResp(200, { message: 'ok' });
}

(async function () {
    const checker = h.createChecker('T10 Akzeptanzkriterien: Router-Mount + Pfadanpassung /api/spielraum');

    // =========================================================================
    // Teil 1: Quelltext-Pruefung index.js
    // =========================================================================

    // --- POSITIV: index.js importiert Router/gameroom.js ---
    checker.check('[positiv] index.js importiert Router/gameroom.js (require)',
        /require\s*\(\s*['"][^'"]*Router[/\\]gameroom['"]/.test(indexSrc),
        'Kein require fuer Router/gameroom.js in index.js gefunden.');

    // --- POSITIV: index.js bindet den Router unter /api ein ---
    // Prueft ob app.use('/api', <variable>) vorkommt, wobei die Variable den gameroom-Router haelt.
    // Akzeptiert sowohl einfache als auch doppelte Anführungszeichen.
    checker.check("[positiv] index.js bindet den Router mit app.use('/api', ...) ein",
        /app\.use\s*\(\s*['"]\/api['"]/.test(indexSrc),
        "Kein app.use('/api', ...) fuer den neuen Router in index.js gefunden.");

    // --- POSITIV: Der T3-Platzhalterkommentar ist entfernt / die Route ist jetzt gemountet ---
    checker.check('[positiv] T3-Platzhalterkommentar (Mount erfolgt in T10) ist nicht mehr vorhanden',
        !/erfolgt in Task T10/.test(indexSrc),
        'Der Platzhalterkommentar aus T3 ist noch in index.js vorhanden (Route noch nicht gemountet).');

    // =========================================================================
    // Teil 2: Quelltext-Pruefung menu.js
    // =========================================================================

    // --- POSITIV: menu.js verwendet /api/spielraum fuer POST (startGame) ---
    checker.check("[positiv] menu.js verwendet '/api/spielraum' fuer die POST-Anfrage (startGame)",
        /['"]\/api\/spielraum['"]/.test(menuSrc),
        "menu.js enthaelt '/api/spielraum' nicht.");

    // --- NEGATIV: menu.js verwendet /spielraum NICHT mehr ohne /api-Praefix ---
    // Prueft: kein fetch("/spielraum", ...) mehr (ohne /api davor).
    // Das Muster ["']\/spielraum["'] trifft "/spielraum" aber NICHT "/api/spielraum".
    checker.check("[negativ] menu.js verwendet '/spielraum' (ohne /api-Praefix) NICHT mehr",
        !/['"]\/spielraum['"]/.test(menuSrc),
        "menu.js enthaelt noch '/spielraum' ohne /api-Praefix (Pfad noch nicht angepasst).");

    // =========================================================================
    // Teil 3: Verhaltensbasierte Pruefungen (menuTestHarness)
    // =========================================================================

    // --- POSITIV: startGame sendet POST an /api/spielraum ---
    {
        const env = harness.createHarness(alwaysOkResponder);
        harness.loadMenuInto(env.sandbox);
        harness.callStartGame(env.sandbox, 'human');
        try { await harness.withTimeout(env.redirected, 2000, 'timeout'); } catch (e) { /* egal */ }
        const first = env.state.spielraumCalls[0];
        checker.check("[positiv] startGame sendet POST-Request an '/api/spielraum'",
            !!(first && first.url === '/api/spielraum'),
            "startGame hat nicht an '/api/spielraum' gesendet (war: " + (first ? first.url : '—') + ').');
    }

    // --- POSITIV: cancelSearch sendet DELETE an /api/spielraum ---
    {
        const env = harness.createHarness(alwaysOkResponder);
        harness.loadMenuInto(env.sandbox);
        harness.callCancelSearch(env.sandbox);
        await harness.withTimeout(env.redirected, 1000, '').catch(function () {});
        const deleteCall = env.state.spielraumCalls.find(function (c) {
            return c.options && c.options.method === 'DELETE';
        });
        checker.check("[positiv] cancelSearch sendet DELETE-Request an '/api/spielraum'",
            !!(deleteCall && deleteCall.url === '/api/spielraum'),
            "cancelSearch hat nicht an '/api/spielraum' gesendet (war: " +
            (deleteCall ? deleteCall.url : '—') + ').');
    }

    // --- POSITIV: beforeunload-Handler sendet DELETE an /api/spielraum ---
    {
        const env = harness.createHarness(alwaysOkResponder);
        harness.loadMenuInto(env.sandbox);
        if (env.windowListeners.beforeunload && env.windowListeners.beforeunload.length > 0) {
            env.windowListeners.beforeunload[0](); // Seitenverlassen simulieren
            const unloadDelete = env.state.spielraumCalls.find(function (c) {
                return c.options && c.options.method === 'DELETE';
            });
            checker.check("[positiv] beforeunload-Handler sendet DELETE an '/api/spielraum'",
                !!(unloadDelete && unloadDelete.url === '/api/spielraum'),
                "beforeunload-Handler hat nicht an '/api/spielraum' gesendet (war: " +
                (unloadDelete ? unloadDelete.url : '—') + ').');
        } else {
            checker.check('[positiv] beforeunload-Handler ist registriert und pruefbar',
                false, 'Kein beforeunload-Handler in window registriert.');
        }
    }

    // --- NEGATIV-KONTROLLE: Eine menu.js-Version mit altem Pfad /spielraum wird erkannt ---
    {
        const vm = require('vm');
        // Stub-Version: verwendet den alten Pfad /spielraum (ohne /api).
        const stubCode = [
            'async function startGame(mode) {',
            '    const r = await fetch("/spielraum", { method:"POST", body: JSON.stringify({mode:mode}) });',
            '    const d = await r.json();',
            '    if (r.status === 200) { window.location.href = "/ingame"; return; }',
            '    setTimeout(function(){ startGame(mode); }, 10);',
            '}'
        ].join('\n');
        const env = harness.createHarness(alwaysOkResponder);
        const vm_ctx = Object.assign({}, env.sandbox);
        vm.createContext(vm_ctx);
        vm.runInContext(stubCode, vm_ctx);
        vm.runInContext('startGame("human");', vm_ctx);
        await harness.withTimeout(env.redirected, 1000, '').catch(function () {});
        const stubCall = env.state.spielraumCalls[0];
        checker.check("[Negativ-Kontrolle] Implementierung mit altem '/spielraum'-Pfad wird erkannt",
            !!(stubCall && stubCall.url === '/spielraum'),
            'Der Test wuerde eine Implementierung mit falschem Pfad faelschlich akzeptieren.');
    }

    h.finishProcess(checker.finish());
})();
