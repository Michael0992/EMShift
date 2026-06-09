// Test-004_ServerEmpfaengtAnfrage.Tests.js
// tests.md / Test-004 (serverseitige Sicht fuer Task T3): Ueberpruefen, ob der Server die Route
// bereitstellt, an die die Funktion startGame ihre Anfrage zur Gegnersuche schickt.
//
// Waehrend der gleichnamige Test in T2 die FRONTEND-Seite prueft (startGame sendet eine POST-Anfrage),
// prueft dieser Test die SERVER-Seite: Der migrierte POST-Router /spielraum nimmt die Anfrage
// entgegen und antwortet im JSON-Format. Die Unterscheidung human/ai (T4) ist hier noch nicht relevant
// - der Server muss die Anfrage lediglich annehmen.
//
// Reines Node.js (kein Test-Framework) gemaess constitution.md; echtes Express + echte HTTP-Anfragen.

const h = require('./lib/serverTestHelpers');

(async function () {
    const checker = h.createChecker('Test-004: Server empfaengt die Anfrage zur Gegnersuche');

    let router = null;
    try { router = h.loadGameroomRouter(); } catch (e) { /* unten behandelt */ }

    if (!router || typeof router !== 'function') {
        checker.check('Router/gameroom.js ist ladbar', false, 'Router konnte nicht geladen werden.');
        h.finishProcess(checker.finish());
        return;
    }

    const app = await h.startAppWithRouter(router, '/api');
    try {
        // Anfrage wie sie das Frontend (startGame) sendet: POST mit Modus im JSON-Body.
        for (const mode of ['human', 'ai']) {
            const resp = await h.httpJson(app.baseUrl + '/api/spielraum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: mode })
            });
            const ct = resp.headers['content-type'] || '';
            let data = null;
            try { data = JSON.parse(resp.text); } catch (e) { /* kein JSON */ }

            // Geprueft wird, dass der Server die Anfrage ENTGEGENNIMMT und beantwortet (kein 404/405).
            // Die mode-/auth-abhaengigen Statuscodes (human: 202/401, ai: 501) pruefen T4/T5.
            checker.check("Server nimmt die POST-Anfrage zur Gegnersuche an (Modus '" + mode + "', Antwort, kein 404/405)",
                resp.status !== 404 && resp.status !== 405,
                "Server behandelt die Anfrage nicht (Status " + resp.status + ").");
            checker.check("Antwort auf Modus '" + mode + "' ist JSON",
                ct.indexOf('application/json') >= 0 && !!data && typeof data === 'object',
                "Antwort ist kein JSON (Content-Type: " + ct + ").");
        }
    } catch (e) {
        checker.check('Server-Anfrage ist ausfuehrbar', false, 'Fehler: ' + e.message);
    } finally {
        await app.close();
    }

    h.finishProcess(checker.finish());
})();
