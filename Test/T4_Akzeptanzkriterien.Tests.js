// T4_Akzeptanzkriterien.Tests.js
// Tests fuer Task T4: "Implementiere fuer die POST-Route 'Spielraum' eine Verzweigung, um human und
// ai Gegner zu unterscheiden. Schicke bei ai einen passenden Statuscode (kein 200) und eine
// JSON-Nachricht 'ki gegnersuche noch nicht implementiert'."
//
// Bezug zu spec.md: Die Akzeptanzkriterien beschreiben die menschliche Gegnersuche
// ("Die Funktion schickt eine Anfrage an den Server, um einen Gegner zu suchen"). Der human-Pfad
// muss daher weiterhin eine erfolgreiche Antwort liefern. Die KI-Verzweigung ist eine
// T4-spezifische Vorbereitungsanforderung (formal in tests.md Test-010 geprueft).
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
    const checker = h.createChecker('T4 Akzeptanzkriterien (spec.md) + Verzweigung human/ai');

    let router = null;
    try { router = h.loadGameroomRouter(); } catch (e) { /* unten behandelt */ }
    if (!router || typeof router !== 'function') {
        checker.check('Router/gameroom.js ist ladbar', false, 'Router konnte nicht geladen werden.');
        h.finishProcess(checker.finish());
        return;
    }

    const app = await h.startAppWithRouter(router, '/api');
    try {
        const human = await postMode(app, 'human');
        const ai = await postMode(app, 'ai');

        // --- POSITIVE Faelle ---
        // Verzweigungstest: der human-Zweig wird verarbeitet (Antwort, kein 404). Der konkrete
        // human-Statuscode (seit T5 auth-abhaengig: 401/202/200) ist Sache der T5-T7-Tests.
        checker.check("[positiv] Modus 'human' wird vom Router verarbeitet (Antwort, kein 404)",
            human.status !== 404 && human.status !== 405, 'Status war ' + human.status + ' (nicht verarbeitet?).');
        checker.check("[positiv] Antwort auf 'human' ist JSON",
            human.ct.indexOf('application/json') >= 0 && !!human.data, 'Antwort ist kein JSON.');
        checker.check("[positiv] Modus 'ai' nutzt einen eigenen Zweig (NICHT 200)",
            ai.status !== 200, "Modus 'ai' lieferte 200 (keine Verzweigung).");
        checker.check("[positiv] Antwort auf 'ai' ist JSON",
            ai.ct.indexOf('application/json') >= 0 && !!ai.data, 'Antwort ist kein JSON.');

        // --- NEGATIVE Faelle (Gegenprobe am echten Router) ---
        checker.check("[negativ] 'human' wird NICHT als KI behandelt (kein 501)",
            human.status !== 501, "Modus 'human' lieferte 501.");
        checker.check("[negativ] 'human' erhaelt NICHT die KI-Nachricht",
            !(human.data && human.data.message === KI_MESSAGE), "Modus 'human' erhielt die KI-Nachricht.");
        checker.check("[negativ] 'human' und 'ai' liefern UNTERSCHIEDLICHE Statuscodes",
            human.status !== ai.status, 'Beide Modi liefern denselben Status (' + human.status + ').');
    } finally {
        await app.close();
    }

    // --- NEGATIV-KONTROLLE ---
    // Eine fehlerhafte Implementierung OHNE Verzweigung (immer 200) darf das Verzweigungskriterium
    // NICHT erfuellen. Bestaetigt, dass der Test fehlerhafte Implementierungen tatsaechlich erkennt.
    {
        const express = h.requireFromKampf('express');
        const stub = express.Router();
        stub.post('/spielraum', (req, res) => res.json({ ok: true })); // falsch: keine human/ai-Verzweigung
        const stubApp = await h.startAppWithRouter(stub, '/api');
        try {
            const sHuman = await postMode(stubApp, 'human');
            const sAi = await postMode(stubApp, 'ai');
            checker.check('[Negativ-Kontrolle] Implementierung ohne Verzweigung besteht das Verzweigungskriterium NICHT',
                sHuman.status === sAi.status, // beide 200 -> keine Unterscheidung -> Kriterium nicht erfuellt
                'Der Test wuerde eine Implementierung ohne Verzweigung faelschlich akzeptieren.');
        } finally {
            await stubApp.close();
        }
    }

    h.finishProcess(checker.finish());
})();
