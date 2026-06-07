// Test-008_WeiterleitungBeiGegnerGefunden.Tests.js
// tests.md / Test-008: Ueberpruefen, ob der Benutzer automatisch in den Spielraum weitergeleitet wird,
// sobald ein Gegner gefunden wurde (bzw. der Spieler einem bestehenden Raum beitritt).
//
// Serverseitiger T6-Anteil: Ist der Raum des Spielers voll besetzt (Gegner gefunden), antwortet der
// Server mit Status 200 - das ist das Signal, auf das startGame im Frontend mit der Weiterleitung
// nach /ingame reagiert (siehe T2). Ist der Raum noch nicht voll, wird mit 202 geantwortet (keine
// Weiterleitung, Suche laeuft weiter). Der Beitritts-Fall (fremder Raum) ist Aufgabe von T7.
//
// Gemaess tests.md: positive UND negative Faelle + Negativ-Kontrolle.

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

const UserModel = t5.loadUserModel();

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
    const checker = h.createChecker('Test-008: Weiterleitungs-Signal (200), sobald ein Gegner gefunden wurde');

    const app = await t5.startApp({ user: { User_ID: 42 } });
    try {
        // --- POSITIV: Gegner gefunden (Raum voll) -> Status 200 = Weiterleitungs-Signal ---
        mockExistingRoom({ Room_ID: 1, User_ID_1: 42, User_ID_2: 7 });
        const found = await postHuman(app);
        checker.check('[positiv] Gegner gefunden (Raum voll) -> Status 200 (Frontend leitet nach /ingame weiter)',
            found.status === 200, 'Status war ' + found.status + ' (erwartet 200).');

        // --- NEGATIV: noch kein Gegner (Raum nicht voll) -> KEINE Weiterleitung (kein 200) ---
        mockExistingRoom({ Room_ID: 1, User_ID_1: 42, User_ID_2: null });
        const waiting = await postHuman(app);
        checker.check('[negativ] Noch kein Gegner (Raum nicht voll) -> Status 202 (keine Weiterleitung)',
            waiting.status === 202, 'Status war ' + waiting.status + ' (erwartet 202).');
        checker.check('[negativ] Ohne gefundenen Gegner kein Weiterleitungs-Signal (Status nicht 200)',
            waiting.status !== 200, 'Es wurde faelschlich 200 (Weiterleitung) gesendet.');
    } finally {
        await app.close();
    }

    // --- NEGATIV-KONTROLLE: "immer 202"-Implementierung liefert bei gefundenem Gegner NICHT 200 ---
    {
        const express = h.requireFromKampf('express');
        const stub = express.Router();
        stub.post('/spielraum', (req, res) => res.status(202).json({ message: 'Gegnersuche läuft...' }));
        const stubApp = await t5.startApp({ user: { User_ID: 42 }, router: stub });
        try {
            const r = await postHuman(stubApp);
            checker.check('[Negativ-Kontrolle] "immer 202"-Implementierung gibt bei gefundenem Gegner KEIN 200',
                r.status !== 200, 'Der Test wuerde eine Implementierung ohne Weiterleitungs-Signal akzeptieren.');
        } finally {
            await stubApp.close();
        }
    }

    h.finishProcess(checker.finish());
})();
