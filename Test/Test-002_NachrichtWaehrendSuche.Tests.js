// Test-002_NachrichtWaehrendSuche.Tests.js
// tests.md / Test-002: Ueberpruefen, ob die Nachricht "Gegnersuche laeuft..."
// angezeigt wird, sobald der Benutzer auf den Button klickt.
//
// T11 implementiert: zeigeGegnersuche() wird synchron am Anfang von startGame aufgerufen,
// bevor der erste await die Ausfuehrung unterbricht. Die Nachricht ist daher sofort nach
// dem Klick sichtbar (kein Warten auf eine Serverantwort noetig).
//
// Gemaess tests.md / constitution.md: positiv + negativ + Negativ-Kontrolle.

const harness = require('./lib/menuTestHarness');
const h = require('./lib/serverTestHelpers');

// Responder: gibt 202 zurueck (Suche laeuft) – wird nur benoetigt,
// damit fetch() nicht wirft; der Test selbst prueft nur den synchronen Teil.
function always202(callNum, state, mkResp) {
    return mkResp(202, { message: 'Gegnersuche laeuft...' });
}

(async function () {
    const checker = harness.createChecker('Test-002: Nachricht "Gegnersuche laeuft..." wird beim Klick angezeigt');

    // --- POSITIV: Nachricht ist nach dem Aufruf von startGame gesetzt ---
    {
        const env = harness.createHarness(always202);
        harness.loadMenuInto(env.sandbox);
        harness.callStartGame(env.sandbox, 'human');
        // zeigeGegnersuche() laeuft synchron (vor dem ersten await in startGame).
        // Das Ergebnis ist also sofort nach callStartGame sichtbar.
        const el = env.domElements['search_status'];
        checker.check('[positiv] #search_status hat nach startGame-Aufruf einen textContent',
            !!(el && el.textContent),
            '#search_status hat nach dem Klick keinen Inhalt (textContent leer oder Element fehlt).');
    }

    // --- POSITIV: Nachrichtentext ist exakt "Gegnersuche laeuft..." ---
    {
        const env = harness.createHarness(always202);
        harness.loadMenuInto(env.sandbox);
        harness.callStartGame(env.sandbox, 'human');
        const el = env.domElements['search_status'];
        checker.check("[positiv] textContent von #search_status ist 'Gegnersuche läuft...'",
            !!(el && el.textContent === 'Gegnersuche läuft...'),
            "textContent war: '" + (el ? el.textContent : 'kein Element') + "' (erwartet 'Gegnersuche läuft...').");
    }

    // --- NEGATIV: Vor dem Klick (vor startGame) ist #search_status leer ---
    {
        const env = harness.createHarness(always202);
        harness.loadMenuInto(env.sandbox);
        // KEIN callStartGame – der Benutzer hat noch nicht geklickt.
        const el = env.domElements['search_status'];
        checker.check('[negativ] Vor dem Klick auf den Button hat #search_status keinen Inhalt',
            !el || el.textContent === '',
            "textContent war bereits gesetzt: '" + (el ? el.textContent : '') + "'.");
    }

    // --- NEGATIV-KONTROLLE: Implementierung ohne Nachricht wird erkannt ---
    {
        const vm = require('vm');
        // Stub: startGame ohne zeigeGegnersuche (kein Nachrichten-Update).
        const stubCode = [
            'async function startGame(mode) {',
            '    var r = await fetch("/api/spielraum", { method: "POST", body: JSON.stringify({mode:mode}) });',
            '    var d = await r.json();',
            '    if (r.status === 200) { window.location.href = "/ingame"; return; }',
            '    setTimeout(function(){ startGame(mode); }, 10);',
            '}'
        ].join('\n');
        const env = harness.createHarness(always202);
        vm.createContext(env.sandbox);
        vm.runInContext(stubCode, env.sandbox);
        vm.runInContext('startGame("human");', env.sandbox);
        // Kurz warten, damit der erste fetch-Callback abgearbeitet wird.
        await new Promise(function (resolve) { setTimeout(resolve, 50); });
        const el = env.domElements['search_status'];
        checker.check('[Negativ-Kontrolle] Implementierung ohne Statusnachricht wird erkannt (textContent bleibt leer)',
            !el || el.textContent === '',
            'Ein Stub ohne Statusnachricht hat unerwartet textContent gesetzt: ' + (el ? el.textContent : ''));
    }

    h.finishProcess(checker.finish());
})();
