// T6_Akzeptanzkriterien.Tests.js
// Tests fuer Task T6: Verfeinerung von Fall 1 (Spieler ist bereits einem Raum zugewiesen) in der
// POST-Route /spielraum:
//   - Raum voll besetzt (2 Spieler)      -> 200 (Gegner gefunden, Weiterleitung in den Spielraum)
//   - Raum noch nicht voll (1 Spieler)   -> 202 ("Gegnersuche läuft...")
//
// Bezug zu spec.md: "Sobald ein Gegner gefunden wurde ... wird der Benutzer automatisch in den
// Spielraum weitergeleitet." (voller Raum -> 200, Frontend leitet weiter).
//
// Gemaess tests.md: positive UND negative Faelle + Negativ-Kontrolle.
// Reines Node.js (kein Framework); UserModel-Abfrage + Authentifizierung werden gemockt,
// die zu pruefende Funktion isRoomFull bleibt ECHT (Integrationstest der Voll-Logik).

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

const UserModel = t5.loadUserModel();

// Nur die Abfragefunktionen mocken; isRoomFull bleibt die echte Implementierung.
function mockExistingRoom(room) {
    UserModel.findRoomForPlayer = async function () { return room; };
    UserModel.findOpenRoom = async function () { return null; };
}

async function postHuman(app) {
    const resp = await h.httpJson(app.baseUrl + '/api/spielraum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'human' })
    });
    let data = null;
    try { data = JSON.parse(resp.text); } catch (e) { /* kein JSON */ }
    return { status: resp.status, data: data };
}

(async function () {
    const checker = h.createChecker('T6 Akzeptanzkriterien: bestehender Raum voll -> 200, sonst 202');

    const app = await t5.startApp({ user: { User_ID: 42 } });
    try {
        // --- POSITIV: Raum voll besetzt (2 Spieler) -> 200 ---
        mockExistingRoom({ Room_ID: 1, User_ID_1: 42, User_ID_2: 7 });
        const full = await postHuman(app);
        checker.check('[positiv] Bestehender Raum voll besetzt -> Status 200 (Gegner gefunden)',
            full.status === 200, 'Status war ' + full.status + ' (erwartet 200).');

        // --- POSITIV: Raum noch nicht voll (1 Spieler) -> 202 + Nachricht ---
        mockExistingRoom({ Room_ID: 1, User_ID_1: 42, User_ID_2: null });
        const notFull = await postHuman(app);
        checker.check('[positiv] Bestehender Raum nicht voll (1 Spieler) -> Status 202 (Suche laeuft)',
            notFull.status === 202, 'Status war ' + notFull.status + ' (erwartet 202).');
        checker.check("[positiv] Nicht voller Raum -> Nachricht 'Gegnersuche läuft...'",
            !!notFull.data && notFull.data.message === 'Gegnersuche läuft...',
            'Nachricht war: ' + (notFull.data ? JSON.stringify(notFull.data.message) : '(keine)') + '.');

        // --- NEGATIV: volle und nicht-volle Raeume werden unterschiedlich behandelt ---
        checker.check('[negativ] Voller Raum (200) und nicht voller Raum (202) liefern unterschiedliche Status',
            full.status !== notFull.status, 'Beide Faelle liefern denselben Status.');
        checker.check('[negativ] Nicht voller Raum liefert NICHT 200 (kein vorzeitiges "Gegner gefunden")',
            notFull.status !== 200, 'Nicht voller Raum lieferte faelschlich 200.');
    } finally {
        await app.close();
    }

    // --- NEGATIV-KONTROLLE: Eine Implementierung, die (wie der T5-Platzhalter) bei bestehendem Raum
    //     immer 202 liefert, erfuellt die Anforderung "voll -> 200" NICHT. ---
    {
        const express = h.requireFromKampf('express');
        const stub = express.Router();
        stub.post('/spielraum', (req, res) => res.status(202).json({ message: 'Gegnersuche läuft...' }));
        const stubApp = await t5.startApp({ user: { User_ID: 42 }, router: stub });
        try {
            const r = await postHuman(stubApp);
            checker.check('[Negativ-Kontrolle] "immer 202"-Implementierung liefert bei vollem Raum NICHT 200',
                r.status !== 200, 'Der Test wuerde eine Implementierung ohne Voll-Pruefung faelschlich akzeptieren.');
        } finally {
            await stubApp.close();
        }
    }

    h.finishProcess(checker.finish());
})();
