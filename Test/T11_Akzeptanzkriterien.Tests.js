// T11_Akzeptanzkriterien.Tests.js
// Tests fuer Task T11: startGame reagiert auf Statuscodes 200 / 202 / Fehler,
// zeigt Statusnachrichten und steuert die Sichtbarkeit von Buttons.
//
// Bezug zu spec.md Akzeptanzkriterien (T11-relevant):
//   - "Sobald der Benutzer auf den Button klickt, wird die Nachricht 'Gegnersuche laeuft...' angezeigt."
//   - "Der Button 'Spiel vs Mensch' ist auf der Index.html Seite sichtbar und klickbar,
//      solange die Gegnersuche nicht laeuft." (-> waehrend Suche: ausgeblendet)
//
// T11 ergaenzt in menu.js:
//   zeigeGegnersuche()     : Statusnachricht einblenden, Start-Buttons aus-, Cancel-Button einblenden.
//   zeigeStatusNachricht() : textContent von #search_status setzen.
//   startGame (aktualisiert): 200 -> redirect, 202 -> Nachricht + retry, anderes -> log + retry.
//
// Gemaess tests.md / constitution.md: positiv + negativ + Negativ-Kontrolle.
// Verhaltensbasierte Pruefungen ueber menuTestHarness (vm-Sandbox, domElements-Tracking).

const harness = require('./lib/menuTestHarness');
const h = require('./lib/serverTestHelpers');

// Responder-Hilfsfunktionen
function always202(callNum, state, mkResp) {
    return mkResp(202, { message: 'Gegnersuche laeuft...' });
}
function always200(callNum, state, mkResp) {
    return mkResp(200, { message: 'Gegner gefunden.' });
}
function firstThen200(callNum, state, mkResp) {
    // Erst 202, danach 200.
    return state.spielraumCalls.length <= 1
        ? mkResp(202, { message: 'Gegnersuche laeuft...' })
        : mkResp(200, { message: 'Gegner gefunden.' });
}
function always500(callNum, state, mkResp) {
    return mkResp(500, { message: 'Interner Serverfehler' });
}

(async function () {
    const checker = harness.createChecker('T11 Akzeptanzkriterien: startGame UI-Reaktion (200 / 202 / Fehler)');

    // =========================================================================
    // Teil 1: Statusnachricht + Button-Sichtbarkeit (synchron, vor erstem await)
    // =========================================================================

    // --- POSITIV: "Gegnersuche laeuft..." erscheint synchron in #search_status ---
    {
        const env = harness.createHarness(always202);
        harness.loadMenuInto(env.sandbox);
        harness.callStartGame(env.sandbox, 'human');
        // zeigeGegnersuche() wird synchron (vor dem ersten await in startGame) ausgefuehrt.
        const el = env.domElements['search_status'];
        checker.check("[positiv] startGame setzt textContent 'Gegnersuche laeuft...' in #search_status",
            !!(el && el.textContent === 'Gegnersuche läuft...'),
            "textContent war: '" + (el ? el.textContent : 'kein Element') + "'.");
    }

    // --- POSITIV: #cancel_search_btn wird eingeblendet ---
    {
        const env = harness.createHarness(always202);
        harness.loadMenuInto(env.sandbox);
        harness.callStartGame(env.sandbox, 'human');
        const el = env.domElements['cancel_search_btn'];
        checker.check('[positiv] startGame blendet #cancel_search_btn ein (display != "none")',
            !!(el && el.style.display !== 'none'),
            'cancel_search_btn.style.display war: ' + (el ? JSON.stringify(el.style.display) : 'kein Element'));
    }

    // --- POSITIV: #start_human_btn wird ausgeblendet ---
    {
        const env = harness.createHarness(always202);
        harness.loadMenuInto(env.sandbox);
        harness.callStartGame(env.sandbox, 'human');
        const el = env.domElements['start_human_btn'];
        checker.check('[positiv] startGame blendet #start_human_btn aus (display = "none")',
            !!(el && el.style.display === 'none'),
            'start_human_btn.style.display war: ' + (el ? JSON.stringify(el.style.display) : 'kein Element'));
    }

    // --- POSITIV: #start_ai_btn wird ebenfalls ausgeblendet ---
    {
        const env = harness.createHarness(always202);
        harness.loadMenuInto(env.sandbox);
        harness.callStartGame(env.sandbox, 'human');
        const el = env.domElements['start_ai_btn'];
        checker.check('[positiv] startGame blendet #start_ai_btn aus (display = "none")',
            !!(el && el.style.display === 'none'),
            'start_ai_btn.style.display war: ' + (el ? JSON.stringify(el.style.display) : 'kein Element'));
    }

    // =========================================================================
    // Teil 2: Statuscode-Reaktion
    // =========================================================================

    // --- POSITIV: Status 200 -> Weiterleitung nach /ingame ---
    {
        const env = harness.createHarness(always200);
        harness.loadMenuInto(env.sandbox);
        harness.callStartGame(env.sandbox, 'human');
        let href = null;
        try { href = await harness.withTimeout(env.redirected, 1000, 'timeout'); } catch (e) { /* kein redirect */ }
        checker.check("[positiv] Status 200 -> Weiterleitung nach '/ingame'",
            href === '/ingame',
            "href war: '" + href + "' (erwartet '/ingame').");
    }

    // --- POSITIV: Status 202 -> keine sofortige Weiterleitung (Suche laeuft, Retry) ---
    {
        const env = harness.createHarness(always202);
        harness.loadMenuInto(env.sandbox);
        harness.callStartGame(env.sandbox, 'human');
        let href = null;
        try { href = await harness.withTimeout(env.redirected, 200, 'kein redirect erwartet'); } catch (e) { /* erwartet */ }
        checker.check('[positiv] Status 202 -> keine sofortige Weiterleitung (Gegnersuche laeuft)',
            href === null,
            "Weiterleitung erfolgte trotzdem nach 202: '" + href + "'.");
    }

    // --- POSITIV: Erst 202, dann 200 -> Weiterleitung nach /ingame ---
    {
        const env = harness.createHarness(firstThen200);
        harness.loadMenuInto(env.sandbox);
        harness.callStartGame(env.sandbox, 'human');
        let href = null;
        try { href = await harness.withTimeout(env.redirected, 2000, 'timeout'); } catch (e) { /* kein redirect */ }
        checker.check('[positiv] Erst 202 (Suche laeuft), dann 200 (Gegner gefunden) -> /ingame',
            href === '/ingame',
            "href war: '" + href + "' (erwartet '/ingame' nach 202->200-Sequenz).");
    }

    // --- NEGATIV: Status 500 -> keine Weiterleitung (Retry nach Fehler) ---
    {
        const env = harness.createHarness(always500);
        harness.loadMenuInto(env.sandbox);
        harness.callStartGame(env.sandbox, 'human');
        let href = null;
        try { href = await harness.withTimeout(env.redirected, 200, 'kein redirect erwartet'); } catch (e) { /* erwartet */ }
        checker.check('[negativ] Status 500 loest keine Weiterleitung aus (Retry nach unerwartetem Status)',
            href === null,
            "Weiterleitung nach 500 erfolgte: '" + href + "'.");
    }

    // --- NEGATIV-KONTROLLE: Implementierung ohne Statusnachricht wird erkannt ---
    {
        const vm = require('vm');
        // Stub: startGame ohne zeigeGegnersuche -> kein textContent in #search_status.
        const stubCode = [
            'async function startGame(mode) {',
            '    var r = await fetch("/api/spielraum", { method: "POST", body: JSON.stringify({mode:mode}) });',
            '    var d = await r.json();',
            '    if (r.status === 200) { window.location.href = "/ingame"; return; }',
            '    setTimeout(function(){ startGame(mode); }, 10);',
            '}'
        ].join('\n');
        const env = harness.createHarness(always200);
        vm.createContext(env.sandbox);
        vm.runInContext(stubCode, env.sandbox);
        vm.runInContext('startGame("human");', env.sandbox);
        await harness.withTimeout(env.redirected, 1000, '').catch(function () {});
        const el = env.domElements['search_status'];
        checker.check('[Negativ-Kontrolle] Implementierung ohne Statusnachricht wird erkannt (kein textContent)',
            !el || el.textContent === '',
            'Ein Stub ohne zeigeStatusNachricht hat unerwartet textContent gesetzt: ' + (el ? el.textContent : ''));
    }

    h.finishProcess(checker.finish());
})();
