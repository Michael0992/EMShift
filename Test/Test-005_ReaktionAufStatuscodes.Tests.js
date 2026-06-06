// Test-005_ReaktionAufStatuscodes.Tests.js
// tests.md / Test-005: Ueberpruefen, ob das System korrekt auf die Antwort des Servers reagiert,
// insbesondere bei den Statuscodes 200 und 202.
//
// Verantwortung von T2 (diese Datei):
//  - Status 200: Gegner gefunden -> Weiterleitung nach /ingame.
//  - Status 202: noch kein Gegner -> KEINE (vorzeitige) Weiterleitung, die Suche laeuft weiter (erneuter Versuch).
// Hinweis: Die Anzeige der Nachricht "Gegnersuche laeuft..." zu Status 202 ist Aufgabe von T11.
//
// Reines Node.js (kein Test-Framework) gemaess constitution.md.

const h = require('./lib/menuTestHarness');

(async function () {
    const checker = h.createChecker('Test-005: Reaktion auf Statuscodes 200 und 202');

    // --- Status 200 -> Weiterleitung nach /ingame ---
    {
        const env = h.createHarness(function (n, st, makeJson) { return makeJson(200, { status: 'matched' }); });
        h.loadMenuInto(env.sandbox);
        h.callStartGame(env.sandbox, 'human');
        let err = null;
        try { await h.withTimeout(env.redirected, 2000, 'keine Weiterleitung bei 200'); }
        catch (e) { err = e; }
        checker.check('Status 200: Weiterleitung nach /ingame',
            !err && env.state.redirectedTo === '/ingame',
            'Bei Status 200 erfolgt keine Weiterleitung nach /ingame (war: ' + env.state.redirectedTo + ').');
    }

    // --- Status 202 (dann 200) -> bei 202 keine sofortige Weiterleitung, Suche laeuft weiter ---
    {
        const env = h.createHarness(function (n, st, makeJson) {
            if (n === 1) { return makeJson(202, { message: 'Gegnersuche laeuft...' }); }
            return makeJson(200, { status: 'matched' });
        });
        h.loadMenuInto(env.sandbox);
        h.callStartGame(env.sandbox, 'human');
        let err = null;
        try { await h.withTimeout(env.redirected, 3000, 'keine Weiterleitung nach 202->200'); }
        catch (e) { err = e; }
        checker.check('Status 202 fuehrt NICHT sofort zur Weiterleitung (Suche laeuft weiter)',
            env.state.spielraumCalls.length >= 2,
            'Nach Status 202 wurde die Suche nicht fortgesetzt (kein erneuter Versuch).');
        checker.check('Erst Status 200 (nach 202) leitet nach /ingame weiter',
            !err && env.state.redirectedTo === '/ingame',
            'Nach 202 -> 200 erfolgt keine Weiterleitung nach /ingame.');
    }

    process.exit(checker.finish() ? 0 : 1);
})();
