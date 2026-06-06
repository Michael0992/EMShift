// Test-004_AnfrageAnServer.Tests.js
// tests.md / Test-004: Ueberpruefen, ob die Funktion eine Anfrage an den Server schickt,
// um einen Gegner zu suchen.
//
// Reines Node.js (kein Test-Framework) gemaess constitution.md.

const h = require('./lib/menuTestHarness');

(async function () {
    const checker = h.createChecker('Test-004: Anfrage an den Server');

    const env = h.createHarness(function (n, st, makeJson) { return makeJson(200, { status: 'matched' }); });
    h.loadMenuInto(env.sandbox);
    h.callStartGame(env.sandbox, 'human');
    try { await h.withTimeout(env.redirected, 2000, 'timeout'); } catch (e) { /* fuer diese Checks egal */ }

    const first = env.state.spielraumCalls[0];
    checker.check('Es wird eine Anfrage an die Server-Route /spielraum gesendet',
        env.state.spielraumCalls.length >= 1,
        'Es wurde keine Anfrage an /spielraum gesendet.');
    checker.check('Die Anfrage erfolgt per POST (Gegnersuche wird gestartet)',
        !!(first && first.options && /^post$/i.test(String(first.options.method))),
        'Die Anfrage wird nicht per POST gesendet.');
    checker.check('Es wird ein Modus (human/ai) an den Server uebermittelt',
        !!(first && (h.parseMode(first) === 'human' || h.parseMode(first) === 'ai')),
        'Es wird kein gueltiger Modus uebermittelt.');

    process.exit(checker.finish() ? 0 : 1);
})();
