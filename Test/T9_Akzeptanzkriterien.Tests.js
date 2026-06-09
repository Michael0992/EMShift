// T9_Akzeptanzkriterien.Tests.js
// Tests fuer Task T9: DELETE-Route zum Abbrechen der Gegnersuche in Router/gameroom.js.
//
// Bezug zu spec.md (Akzeptanzkriterium):
//   "Wenn der Benutzer die Seite verlaesst oder die Gegnersuche abbricht, wird die index.html
//   Seite neu geladen." (Serverseite: der offene Raum des Spielers wird geloescht.)
//
// T9 ergaenzt DELETE /spielraum:
//   - Spieler ist Ersteller (User_ID_1) + Raum noch offen -> deleteRoom -> 200
//   - Spieler hat keinen Raum                             -> 404
//   - Raum voll (Spiel laeuft) oder Spieler nicht Ersteller -> 403
//   - Nicht eingeloggt                                   -> 401
//
// Gemaess tests.md: positive UND negative Faelle + Negativ-Kontrolle.
// Reines Node.js (kein Framework); UserModel + Authentifizierung werden gemockt.

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

const UserModel = t5.loadUserModel();
let deleteCalls = [];

// Setzt das Szenario fuer alle Lookup-Funktionen + den deleteRoom-Spy zurueck.
function setScenario(room) {
    deleteCalls = [];
    UserModel.findRoomForPlayer = async function () { return room; };
    UserModel.isRoomFull = function (r) { return !!(r && r.User_ID_2 !== null && r.User_ID_2 !== undefined); };
    UserModel.deleteRoom = async function (roomId, userId) {
        deleteCalls.push({ roomId: roomId, userId: userId });
        return 1;
    };
}

// Sendet DELETE /api/spielraum an die App und liefert { status, data }.
async function deleteSpielraum(app) {
    const resp = await h.httpJson(app.baseUrl + '/api/spielraum', { method: 'DELETE' });
    let data = null;
    try { data = JSON.parse(resp.text); } catch (e) { /* kein JSON */ }
    return { status: resp.status, data: data };
}

(async function () {
    const checker = h.createChecker('T9 Akzeptanzkriterien: Gegnersuche abbrechen (DELETE /spielraum)');

    // --- Pruefe Existenz der deleteRoom-Funktion im Usermodel ---
    if (typeof UserModel.deleteRoom !== 'function') {
        checker.check('UserModel.deleteRoom existiert', false, 'Funktion fehlt im Usermodel.');
        h.finishProcess(checker.finish());
        return;
    }

    const app = await t5.startApp({ user: { User_ID: 42 } });
    try {
        // --- POSITIV: Spieler hat offenen Raum und ist Ersteller -> Raum wird geloescht -> 200 ---
        setScenario({ Room_ID: 5, User_ID_1: 42, User_ID_2: null });
        const ok = await deleteSpielraum(app);
        checker.check('[positiv] Offener eigener Raum -> deleteRoom wird aufgerufen',
            deleteCalls.length === 1, 'deleteRoom wurde nicht aufgerufen.');
        checker.check('[positiv] deleteRoom wird mit der richtigen Room_ID und userId aufgerufen',
            deleteCalls.length === 1 && deleteCalls[0].roomId === 5 && deleteCalls[0].userId === 42,
            'deleteRoom wurde mit falschen Argumenten aufgerufen: ' + JSON.stringify(deleteCalls) + '.');
        checker.check('[positiv] Abbrechen erfolgreich -> Status 200',
            ok.status === 200, 'Status war ' + ok.status + ' (erwartet 200).');
        checker.check("[positiv] Antwort enthaelt Nachricht 'Gegnersuche abgebrochen.'",
            !!ok.data && ok.data.message === 'Gegnersuche abgebrochen.',
            'Nachricht war: ' + (ok.data ? JSON.stringify(ok.data.message) : '(keine)') + '.');

        // --- NEGATIV: kein Raum vorhanden -> 404 (nichts zu loeschen) ---
        setScenario(null);
        const noRoom = await deleteSpielraum(app);
        checker.check('[negativ] Kein Raum vorhanden -> Status 404',
            noRoom.status === 404, 'Status war ' + noRoom.status + ' (erwartet 404).');
        checker.check('[negativ] Kein Raum -> deleteRoom wird NICHT aufgerufen',
            deleteCalls.length === 0, 'deleteRoom wurde trotz fehlendem Raum aufgerufen.');

        // --- NEGATIV: Raum ist voll besetzt (Spiel laeuft) -> kein Abbrechen mehr moeglich -> 403 ---
        setScenario({ Room_ID: 5, User_ID_1: 42, User_ID_2: 7 }); // voll
        const fullRoom = await deleteSpielraum(app);
        checker.check('[negativ] Voller Raum (Spiel laeuft) -> Status 403 (kein Abbrechen)',
            fullRoom.status === 403, 'Status war ' + fullRoom.status + ' (erwartet 403).');
        checker.check('[negativ] Voller Raum -> deleteRoom wird NICHT aufgerufen',
            deleteCalls.length === 0, 'deleteRoom wurde aufgerufen, obwohl der Raum voll besetzt war.');

        // --- NEGATIV: Spieler ist User_ID_2 (beigetreten, nicht Ersteller) -> kein Abbrechen -> 403 ---
        setScenario({ Room_ID: 9, User_ID_1: 7, User_ID_2: null }); // anderer Ersteller
        const notOwner = await deleteSpielraum(app);
        checker.check('[negativ] Spieler ist nicht Ersteller (User_ID_1) -> Status 403',
            notOwner.status === 403, 'Status war ' + notOwner.status + ' (erwartet 403).');
        checker.check('[negativ] Nicht-Ersteller -> deleteRoom wird NICHT aufgerufen',
            deleteCalls.length === 0, 'deleteRoom wurde aufgerufen, obwohl der Spieler nicht Ersteller ist.');
    } finally {
        await app.close();
    }

    // --- NEGATIV: Keine Authentifizierung -> 401 ---
    {
        const appNoAuth = await t5.startApp({}); // kein req.user
        try {
            setScenario({ Room_ID: 5, User_ID_1: 42, User_ID_2: null });
            const noAuth = await deleteSpielraum(appNoAuth);
            checker.check('[negativ] Ohne Authentifizierung -> Status 401',
                noAuth.status === 401, 'Status war ' + noAuth.status + ' (erwartet 401).');
        } finally {
            await appNoAuth.close();
        }
    }

    // --- NEGATIV-KONTROLLE: Ein Stub der immer 200 zurueckgibt ohne deleteRoom aufzurufen wird erkannt. ---
    {
        const express = h.requireFromKampf('express');
        const stub = express.Router();
        stub.delete('/spielraum', (req, res) => res.status(200).json({ message: 'ok' }));
        const stubApp = await t5.startApp({ user: { User_ID: 42 }, router: stub });
        try {
            setScenario({ Room_ID: 5, User_ID_1: 42, User_ID_2: null });
            await deleteSpielraum(stubApp);
            checker.check('[Negativ-Kontrolle] "200 ohne deleteRoom"-Stub wird erkannt (deleteRoom nicht aufgerufen)',
                deleteCalls.length === 0,
                'Der Test wuerde eine Implementierung ohne deleteRoom-Aufruf faelschlich akzeptieren.');
        } finally {
            await stubApp.close();
        }
    }

    h.finishProcess(checker.finish());
})();
