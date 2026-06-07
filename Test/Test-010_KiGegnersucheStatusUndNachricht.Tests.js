// Test-010_KiGegnersucheStatusUndNachricht.Tests.js
// tests.md / Test-010: Ueberpruefen, ob die KI-Gegnersuche korrekt mit einem passenden Statuscode
// und einer JSON-Nachricht reagiert, wenn sie angefragt wird.
//
// Erwartung (Task T4): Statuscode 501 (Not Implemented, also "kein 200") und die JSON-Nachricht
// "ki gegnersuche noch nicht implementiert".
//
// Gemaess tests.md werden POSITIVE und NEGATIVE Faelle geprueft sowie eine NEGATIV-KONTROLLE
// (fehlerhafte Stub-Implementierung), damit sichergestellt ist, dass auch die Tests selbst funktionieren.
//
// Reines Node.js (kein Test-Framework) gemaess constitution.md; echtes Express + echte HTTP-Anfragen.

const h = require('./lib/serverTestHelpers');

// Sendet POST /api/spielraum mit gegebenem Modus und liefert { status, ct, data }.
async function postMode(app, mode) {
    const resp = await h.httpJson(app.baseUrl + '/api/spielraum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: mode })
    });
    let data = null;
    try { data = JSON.parse(resp.text); } catch (e) { /* kein JSON */ }
    return { status: resp.status, ct: resp.headers['content-type'] || '', data: data };
}

const KI_MESSAGE = 'ki gegnersuche noch nicht implementiert';

(async function () {
    const checker = h.createChecker('Test-010: KI-Gegnersuche reagiert mit Statuscode + JSON-Nachricht');

    let router = null;
    try { router = h.loadGameroomRouter(); } catch (e) { /* unten behandelt */ }
    if (!router || typeof router !== 'function') {
        checker.check('Router/gameroom.js ist ladbar', false, 'Router konnte nicht geladen werden.');
        h.finishProcess(checker.finish());
        return;
    }

    const app = await h.startAppWithRouter(router, '/api');
    try {
        const ai = await postMode(app, 'ai');
        const human = await postMode(app, 'human');

        // --- POSITIVE Faelle: KI-Antwort korrekt ---
        checker.check('[positiv] KI-Gegnersuche antwortet mit passendem Statuscode (kein 200)',
            ai.status !== 200, 'Status war 200.');
        checker.check('[positiv] Statuscode ist 501 (Not Implemented)',
            ai.status === 501, 'Status war ' + ai.status + ' (erwartet 501).');
        checker.check('[positiv] Antwort ist im JSON-Format',
            ai.ct.indexOf('application/json') >= 0 && !!ai.data && typeof ai.data === 'object',
            'Antwort ist kein JSON (Content-Type: ' + ai.ct + ').');
        checker.check("[positiv] JSON enthaelt die Nachricht '" + KI_MESSAGE + "'",
            !!ai.data && ai.data.message === KI_MESSAGE,
            'message war: ' + (ai.data ? JSON.stringify(ai.data.message) : '(keine)') + '.');

        // --- NEGATIVE Faelle: human loest die KI-Antwort NICHT aus ---
        checker.check("[negativ] Modus 'human' liefert NICHT 501",
            human.status !== 501, "Modus 'human' lieferte 501.");
        checker.check("[negativ] Modus 'human' erhaelt NICHT die KI-Nachricht",
            !(human.data && human.data.message === KI_MESSAGE), "Modus 'human' erhielt die KI-Nachricht.");
    } finally {
        await app.close();
    }

    // --- NEGATIV-KONTROLLE ---
    // Eine fehlerhafte Implementierung (immer 200, keine KI-Sonderbehandlung) darf die KI-Kriterien
    // NICHT erfuellen. Bestaetigt, dass der Test eine falsche Implementierung tatsaechlich erkennt.
    {
        const express = h.requireFromKampf('express');
        const stub = express.Router();
        stub.post('/spielraum', (req, res) => res.json({ ok: true })); // falsch: keine 501-KI-Antwort
        const stubApp = await h.startAppWithRouter(stub, '/api');
        try {
            const sAi = await postMode(stubApp, 'ai');
            const meetsKi = (sAi.status === 501) && !!sAi.data && sAi.data.message === KI_MESSAGE;
            checker.check('[Negativ-Kontrolle] fehlerhafte Implementierung (immer 200) erfuellt die KI-Kriterien NICHT',
                meetsKi === false,
                'Der Test wuerde eine falsche Implementierung faelschlich akzeptieren.');
        } finally {
            await stubApp.close();
        }
    }

    h.finishProcess(checker.finish());
})();
