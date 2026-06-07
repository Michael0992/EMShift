// Test-006_PruefeSpielerRaum.Tests.js
// tests.md / Test-006: Ueberpruefen, ob das System prueft, ob der Spieler bereits zu einem Raum gehoert.
//
// T5: Die Route ruft dafuer UserModel.findRoomForPlayer(userId) auf. Hat der Spieler bereits einen
// Raum, wird mit Statuscode 202 ("Gegnersuche laeuft...") geantwortet.
//
// Gemaess tests.md: positive UND negative Faelle + Negativ-Kontrolle.
// Reines Node.js (kein Test-Framework); UserModel + Authentifizierung werden gemockt.

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

const UserModel = t5.loadUserModel();
let roomForPlayerCalls = 0;
let openRoomCalls = 0;

function setScenario(existingRoom, openRoom) {
    roomForPlayerCalls = 0;
    openRoomCalls = 0;
    UserModel.findRoomForPlayer = async function () { roomForPlayerCalls++; return existingRoom; };
    UserModel.findOpenRoom = async function () { openRoomCalls++; return openRoom; };
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
    const checker = h.createChecker('Test-006: System prueft, ob der Spieler bereits einen Raum hat');

    if (typeof UserModel.findRoomForPlayer !== 'function') {
        checker.check('UserModel.findRoomForPlayer existiert', false, 'Funktion fehlt im Usermodel.');
        h.finishProcess(checker.finish());
        return;
    }

    const app = await t5.startApp({ user: { User_ID: 42 } });
    try {
        // --- POSITIV: Spieler hat bereits einen Raum -> Pruefung erfolgt, Status 202 ---
        setScenario({ Room_ID: 1, User_ID_1: 42 }, null);
        const has = await postHuman(app);
        checker.check('[positiv] Das System fragt den Raum des Spielers ab (findRoomForPlayer aufgerufen)',
            roomForPlayerCalls === 1, 'findRoomForPlayer wurde nicht aufgerufen.');
        checker.check('[positiv] Spieler hat bereits einen Raum -> Status 202',
            has.status === 202, 'Status war ' + has.status + ' (erwartet 202).');

        // --- NEGATIV: Spieler hat KEINEN Raum -> Pruefung erfolgt trotzdem, kein 202-aus-Fall-a ---
        setScenario(null, { Room_ID: 9, User_ID_1: 7 });
        const hasNot = await postHuman(app);
        checker.check('[negativ] Auch ohne bestehenden Raum wird die Pruefung ausgefuehrt (findRoomForPlayer aufgerufen)',
            roomForPlayerCalls === 1, 'findRoomForPlayer wurde nicht aufgerufen.');
        checker.check('[negativ] Ohne bestehenden Raum wird NICHT der Fall-a-Status (Spieler-hat-Raum) genommen',
            hasNot.status !== 202 || openRoomCalls === 1,
            'Es wurde faelschlich der Fall "Spieler hat bereits Raum" angenommen.');
    } finally {
        await app.close();
    }

    // --- NEGATIV-KONTROLLE: Eine Implementierung, die den Raum des Spielers NICHT prueft
    //     (immer 200), wird erkannt: findRoomForPlayer wird nie aufgerufen. ---
    {
        const express = h.requireFromKampf('express');
        const stub = express.Router();
        stub.post('/spielraum', (req, res) => res.json({ ok: true }));
        const stubApp = await t5.startApp({ user: { User_ID: 42 }, router: stub });
        try {
            setScenario({ Room_ID: 1, User_ID_1: 42 }, null);
            await postHuman(stubApp);
            checker.check('[Negativ-Kontrolle] Implementierung ohne Raum-Pruefung wird erkannt (findRoomForPlayer NICHT aufgerufen)',
                roomForPlayerCalls === 0, 'Der Test wuerde eine Implementierung ohne Raum-Pruefung faelschlich akzeptieren.');
        } finally {
            await stubApp.close();
        }
    }

    h.finishProcess(checker.finish());
})();
