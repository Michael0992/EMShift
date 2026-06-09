// Test-007_SucheOffeneRaeumeUndErstelle.Tests.js
// tests.md / Test-007: Ueberpruefen, ob das System nach offenen Raeumen in der Datenbank sucht und
// einen neuen Raum erstellt, wenn kein offener Raum gefunden wird.
//
// T5/T7/T8: Die Route ruft (sofern der Spieler noch keinen Raum hat) UserModel.findOpenRoom(userId) auf.
//  - Offener Raum vorhanden -> joinRoom (T7) -> 200 (Gegner gefunden).
//  - Kein offener Raum       -> createRoom (T8) -> 202 (neuer Raum erstellt, Suche laeuft).
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
    // Seit T7 ruft Fall 2 (offener Raum) joinRoom auf -> mocken, damit der Test nicht die echte DB trifft.
    UserModel.joinRoom = async function () { return 1; };
    // Seit T8 ruft Fall 3 (kein offener Raum) createRoom auf -> ebenfalls mocken.
    UserModel.createRoom = async function () { return 99; };
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
    const checker = h.createChecker('Test-007: System sucht offene Raeume und verzweigt zum Erstellen');

    if (typeof UserModel.findOpenRoom !== 'function') {
        checker.check('UserModel.findOpenRoom existiert', false, 'Funktion fehlt im Usermodel.');
        h.finishProcess(checker.finish());
        return;
    }

    const app = await t5.startApp({ user: { User_ID: 42 } });
    try {
        // --- POSITIV: offener Raum vorhanden -> Suche erfolgt, Status 200 ---
        setScenario(null, { Room_ID: 9, User_ID_1: 7 });
        const open = await postHuman(app);
        checker.check('[positiv] Das System sucht nach offenen Raeumen (findOpenRoom aufgerufen)',
            openRoomCalls === 1, 'findOpenRoom wurde nicht aufgerufen.');
        checker.check('[positiv] Offener Raum gefunden -> Status 200 (Gegner gefunden)',
            open.status === 200, 'Status war ' + open.status + ' (erwartet 200).');

        // --- POSITIV: kein offener Raum -> Verzweigung "neuen Raum erstellen", Status 202 ---
        setScenario(null, null);
        const none = await postHuman(app);
        checker.check('[positiv] Auch ohne offenen Raum wird gesucht (findOpenRoom aufgerufen)',
            openRoomCalls === 1, 'findOpenRoom wurde nicht aufgerufen.');
        checker.check('[positiv] Kein offener Raum -> Verzweigung zum Erstellen, Status 202 (Suche laeuft)',
            none.status === 202, 'Status war ' + none.status + ' (erwartet 202).');

        // --- NEGATIV: Spieler hat bereits einen Raum -> es wird NICHT nach offenen Raeumen gesucht ---
        setScenario({ Room_ID: 1, User_ID_1: 42 }, { Room_ID: 9, User_ID_1: 7 });
        const existing = await postHuman(app);
        checker.check('[negativ] Bei bestehendem eigenen Raum wird NICHT nach offenen Raeumen gesucht',
            openRoomCalls === 0, 'findOpenRoom wurde trotz bestehenden eigenen Raums aufgerufen.');
        checker.check('[negativ] Bei bestehendem eigenen Raum -> Status 202 (kein 200 aus offener-Raum-Suche)',
            existing.status === 202, 'Status war ' + existing.status + '.');
    } finally {
        await app.close();
    }

    // --- NEGATIV-KONTROLLE: Eine Implementierung, die NICHT nach offenen Raeumen sucht (immer 200),
    //     wird erkannt: findOpenRoom wird nie aufgerufen. ---
    {
        const express = h.requireFromKampf('express');
        const stub = express.Router();
        stub.post('/spielraum', (req, res) => res.json({ ok: true }));
        const stubApp = await t5.startApp({ user: { User_ID: 42 }, router: stub });
        try {
            setScenario(null, null);
            await postHuman(stubApp);
            checker.check('[Negativ-Kontrolle] Implementierung ohne Offener-Raum-Suche wird erkannt (findOpenRoom NICHT aufgerufen)',
                openRoomCalls === 0, 'Der Test wuerde eine Implementierung ohne Offener-Raum-Suche faelschlich akzeptieren.');
        } finally {
            await stubApp.close();
        }
    }

    h.finishProcess(checker.finish());
})();
