// T8_Akzeptanzkriterien.Tests.js
// Tests fuer Task T8: Fall 3 der menschlichen Gegnersuche - neuen Raum erstellen.
//
// Bezug zu spec.md (Akzeptanzkriterium):
//   "Das System sucht nach offenen Raeumen in der Datenbank und wenn es keinen offenen Raum gibt
//   wird einer erstellt."
//
// T8 implementiert den Aufruf von UserModel.createRoom(userId, 'HUMAN') in Fall 3
// (weder ein eigener Raum noch ein offener Raum vorhanden) und gibt 202 + "Gegnersuche laeuft..."
// zurueck, damit das Frontend weiss, dass die Suche laeuft.
//
// Gemaess tests.md: positive UND negative Faelle + Negativ-Kontrolle.
// Reines Node.js (kein Framework); UserModel + Authentifizierung werden gemockt.

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

const UserModel = t5.loadUserModel();

// Verfolgung der createRoom-Aufrufe fuer Assertions.
let createRoomCalls = 0;
let createRoomArgs = null;

// Setzt das Szenario fuer alle drei Faelle; alle DB-Funktionen werden gemockt.
function setScenario(existingRoom, openRoom) {
    createRoomCalls = 0;
    createRoomArgs = null;
    UserModel.findRoomForPlayer = async function () { return existingRoom; };
    UserModel.findOpenRoom = async function () { return openRoom; };
    UserModel.joinRoom = async function () { return 1; };
    UserModel.createRoom = async function (userId, type) {
        createRoomCalls++;
        createRoomArgs = { userId: userId, type: type };
        return 99; // Simulierte neue Room-ID
    };
}

// Sendet POST /api/spielraum mit Modus "human" an die App und liefert { status, data }.
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
    const checker = h.createChecker('T8 Akzeptanzkriterien: neuen Raum erstellen wenn kein offener Raum vorhanden');

    if (typeof UserModel.createRoom !== 'function') {
        checker.check('UserModel.createRoom existiert', false, 'Funktion fehlt im Usermodel.');
        h.finishProcess(checker.finish());
        return;
    }

    const app = await t5.startApp({ user: { User_ID: 42 } });
    try {
        // --- POSITIV: kein eigener Raum, kein offener Raum -> createRoom wird aufgerufen -> 202 ---
        setScenario(null, null);
        const created = await postHuman(app);
        checker.check('[positiv] Fall 3: createRoom wird aufgerufen wenn kein Raum vorhanden',
            createRoomCalls === 1,
            'createRoom wurde nicht aufgerufen (Aufrufe: ' + createRoomCalls + ').');
        checker.check('[positiv] Fall 3: createRoom wird mit der userId des Spielers aufgerufen',
            createRoomArgs !== null && createRoomArgs.userId === 42,
            'createRoom wurde mit falscher userId aufgerufen: ' + JSON.stringify(createRoomArgs) + '.');
        checker.check("[positiv] Fall 3: createRoom wird mit Typ 'HUMAN' aufgerufen",
            createRoomArgs !== null && createRoomArgs.type === 'HUMAN',
            'createRoom wurde mit falschem Typ aufgerufen: ' + JSON.stringify(createRoomArgs) + '.');
        checker.check('[positiv] Fall 3: Status 202 (Gegnersuche laeuft, Spieler wartet auf Gegner)',
            created.status === 202,
            'Status war ' + created.status + ' (erwartet 202).');
        checker.check("[positiv] Fall 3: Antwort enthaelt Nachricht 'Gegnersuche laeuft...'",
            !!created.data && created.data.message === 'Gegnersuche läuft...',
            'Nachricht war: ' + (created.data ? JSON.stringify(created.data.message) : '(keine)') + '.');

        // --- NEGATIV: offener Raum vorhanden -> createRoom wird NICHT aufgerufen (Fall 2 zustaendig) ---
        setScenario(null, { Room_ID: 9, User_ID_1: 7, User_ID_2: null });
        const joined = await postHuman(app);
        checker.check('[negativ] Offener Raum vorhanden -> createRoom wird NICHT aufgerufen (Fall 2 ist zustaendig)',
            createRoomCalls === 0,
            'createRoom wurde aufgerufen, obwohl ein offener Raum vorhanden war.');
        checker.check('[negativ] Offener Raum vorhanden -> Status 200 (joinRoom hat den Raum gefunden)',
            joined.status === 200,
            'Status war ' + joined.status + ' (erwartet 200).');

        // --- NEGATIV: Spieler hat bereits einen Raum -> createRoom wird NICHT aufgerufen (Fall 1) ---
        setScenario({ Room_ID: 1, User_ID_1: 42, User_ID_2: null }, null);
        const existing = await postHuman(app);
        checker.check('[negativ] Spieler hat bereits einen Raum -> createRoom wird NICHT aufgerufen (Fall 1 zustaendig)',
            createRoomCalls === 0,
            'createRoom wurde aufgerufen, obwohl der Spieler bereits einen Raum hat.');
        checker.check('[negativ] Spieler hat bestehenden (nicht vollen) Raum -> Status 202',
            existing.status === 202,
            'Status war ' + existing.status + ' (erwartet 202).');
    } finally {
        await app.close();
    }

    // --- NEGATIV-KONTROLLE: Implementierung ohne createRoom-Aufruf (alter Platzhalter aus T5/T7)
    //     wird erkannt: Status 202 zwar gleich, aber createRoom nie aufgerufen.
    {
        const express = h.requireFromKampf('express');
        const stub = express.Router();
        // Alter Platzhalter: gibt 202 zurueck, ruft aber createRoom NICHT auf.
        stub.post('/spielraum', (req, res) => res.status(202).json({ message: 'Gegnersuche läuft...' }));
        const stubApp = await t5.startApp({ user: { User_ID: 42 }, router: stub });
        try {
            setScenario(null, null);
            await postHuman(stubApp);
            checker.check('[Negativ-Kontrolle] "Platzhalter 202 ohne createRoom"-Implementierung wird erkannt (createRoom nicht aufgerufen)',
                createRoomCalls === 0,
                'Der Test wuerde eine Implementierung ohne createRoom-Aufruf faelschlich akzeptieren.');
        } finally {
            await stubApp.close();
        }
    }

    h.finishProcess(checker.finish());
})();
