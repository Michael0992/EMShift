// T2_Akzeptanzkriterien.Tests.js
// Verhaltensbasierte Tests, abgeleitet aus den Akzeptanzkriterien der spec.md, die zu Task T2 gehoeren:
// Die Funktion "startGame" (menu.js) startet die Gegnersuche und muss
//  - eine Anfrage an den Server schicken (FR-003 / AK),
//  - dabei eine POST-Anfrage verwenden,
//  - den Modus ("human" bzw. "ai") als Parameter uebermitteln,
//  - das Ergebnis als JSON verarbeiten,
//  - bei Status 200 automatisch in den Spielraum weiterleiten (/ingame),
//  - bei einem Fehler die Anfrage erneut senden.
//
// Reines Node.js (kein Test-Framework) gemaess constitution.md.

const h = require('./lib/menuTestHarness');

(async function () {
    const checker = h.createChecker('T2 Akzeptanzkriterien (spec.md)');

    // --- Fall 1: Erfolgreiche Suche (Status 200) fuer Modus "human" ---
    {
        const env = h.createHarness(function (n, st, makeJson) { return makeJson(200, { status: 'matched' }); });
        h.loadMenuInto(env.sandbox);
        h.callStartGame(env.sandbox, 'human');
        let redirectErr = null;
        try { await h.withTimeout(env.redirected, 2000, 'keine Weiterleitung erfolgt'); }
        catch (e) { redirectErr = e; }

        const first = env.state.spielraumCalls[0];
        checker.check('startGame schickt eine Anfrage an den Server (FR-003)',
            env.state.spielraumCalls.length >= 1,
            'Es wurde keine Anfrage an /spielraum gesendet.');
        checker.check('Die Anfrage ist eine POST-Anfrage',
            !!(first && first.options && /^post$/i.test(String(first.options.method))),
            'Die Anfrage verwendet nicht die Methode POST.');
        checker.check("Der Modus 'human' wird als Parameter uebermittelt",
            !!(first && h.parseMode(first) === 'human'),
            'Der Modus wird nicht korrekt im Anfrage-Body uebermittelt.');
        checker.check('Das Ergebnis wird als JSON verarbeitet (response.json wird aufgerufen)',
            env.state.jsonParsedCount >= 1,
            'Die Antwort wird nicht als JSON ausgewertet.');
        checker.check('Bei Status 200 erfolgt die Weiterleitung nach /ingame',
            !redirectErr && env.state.redirectedTo === '/ingame',
            'Es erfolgt keine Weiterleitung nach /ingame (war: ' + env.state.redirectedTo + ').');
    }

    // --- Fall 2: Der Modus "ai" wird ebenfalls uebermittelt ---
    // (Hier wird serverseitig 200 gemockt, um isoliert das Senden des Parameters "ai" zu pruefen.
    //  Die serverseitige KI-Sonderbehandlung ist Aufgabe von T4.)
    {
        const env = h.createHarness(function (n, st, makeJson) { return makeJson(200, { status: 'matched' }); });
        h.loadMenuInto(env.sandbox);
        h.callStartGame(env.sandbox, 'ai');
        try { await h.withTimeout(env.redirected, 2000, 'timeout'); } catch (e) { /* fuer diesen Check egal */ }
        const first = env.state.spielraumCalls[0];
        checker.check("Der Modus 'ai' wird als Parameter uebermittelt",
            !!(first && h.parseMode(first) === 'ai'),
            "Der Modus 'ai' wird nicht korrekt uebermittelt.");
    }

    // --- Fall 3: Bei einem Fehler wird die Anfrage erneut gesendet (Retry) ---
    {
        const env = h.createHarness(function (n, st, makeJson) {
            if (n === 1) { return makeJson(503, { error: 'kurzzeitig nicht verfuegbar' }); }
            return makeJson(200, { status: 'matched' });
        });
        h.loadMenuInto(env.sandbox);
        h.callStartGame(env.sandbox, 'human');
        let err = null;
        try { await h.withTimeout(env.redirected, 3000, 'keine Weiterleitung nach Retry'); }
        catch (e) { err = e; }
        checker.check('Bei einem Fehler wird die Anfrage erneut gesendet (Retry)',
            env.state.spielraumCalls.length >= 2,
            'Nach einem Fehler wurde keine erneute Anfrage gesendet.');
        checker.check('Nach erfolgreichem erneuten Versuch (200) erfolgt die Weiterleitung nach /ingame',
            !err && env.state.redirectedTo === '/ingame',
            'Nach dem erneuten Versuch erfolgt keine Weiterleitung nach /ingame.');
    }

    process.exit(checker.finish() ? 0 : 1);
})();
