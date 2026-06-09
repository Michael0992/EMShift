// T7_Akzeptanzkriterien.Tests.js
// Tests fuer Task T7: Fall 2 der menschlichen Gegnersuche - der Spieler findet einen offenen Raum
// (noch nicht vollstaendig) und TRITT IHM BEI. An den Client wird Status 200 zurueckgegeben (der
// Spieler wird vom Frontend automatisch in den Spielraum weitergeleitet).
//
// Bezug zu spec.md: "Sobald ein Gegner gefunden wurde ODER der Spieler einem bestehenden Raum
// beitritt, wird der Benutzer automatisch in den Spielraum weitergeleitet."
//
// T7 nutzt dafuer die bereits in T6 angelegte Usermodel-Funktion joinRoom. Erstellen (Fall 3) bleibt
// Platzhalter (T8). Gemaess tests.md: positive UND negative Faelle + Negativ-Kontrolle.
// Reines Node.js (kein Framework); UserModel + Authentifizierung werden gemockt.

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

const UserModel = t5.loadUserModel();
let joinCalls = [];

function setScenario(existingRoom, openRoom) {
    joinCalls = [];
    UserModel.findRoomForPlayer = async function () { return existingRoom; };
    UserModel.findOpenRoom = async function () { return openRoom; };
    UserModel.joinRoom = async function (roomId, userId) { joinCalls.push({ roomId: roomId, userId: userId }); return 1; };
    // Seit T8 ruft Fall 3 (kein offener Raum) createRoom auf -> mocken, damit der Test nicht die echte DB trifft.
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
    const checker = h.createChecker('T7 Akzeptanzkriterien: offenem Raum beitreten -> 200');

    const app = await t5.startApp({ user: { User_ID: 42 } });
    try {
        // --- POSITIV: offener Raum vorhanden -> Beitreten (joinRoom) + 200 ---
        setScenario(null, { Room_ID: 2, User_ID_1: 7, User_ID_2: null });
        const joined = await postHuman(app);
        checker.check('[positiv] Offener Raum gefunden -> joinRoom wird aufgerufen (Beitreten)',
            joinCalls.length === 1, 'joinRoom wurde nicht aufgerufen.');
        checker.check('[positiv] joinRoom wird mit der Room_ID des offenen Raums und der userId aufgerufen',
            joinCalls.length === 1 && joinCalls[0].roomId === 2 && joinCalls[0].userId === 42,
            'joinRoom wurde mit falschen Argumenten aufgerufen: ' + JSON.stringify(joinCalls) + '.');
        checker.check('[positiv] Nach dem Beitreten -> Status 200 (Gegner gefunden)',
            joined.status === 200, 'Status war ' + joined.status + ' (erwartet 200).');

        // --- NEGATIV: kein offener Raum (Fall 3) -> NICHT beitreten, Status 202 ---
        setScenario(null, null);
        const create = await postHuman(app);
        checker.check('[negativ] Kein offener Raum -> joinRoom wird NICHT aufgerufen',
            joinCalls.length === 0, 'joinRoom wurde ohne offenen Raum aufgerufen.');
        checker.check('[negativ] Kein offener Raum -> Status 202 (kein Beitreten; neuer Raum wird in T8 erstellt)',
            create.status === 202, 'Status war ' + create.status + ' (erwartet 202).');
    } finally {
        await app.close();
    }

    // --- NEGATIV-KONTROLLE: Eine Implementierung, die bei offenem Raum 200 liefert, OHNE beizutreten,
    //     wird erkannt: joinRoom wird nicht aufgerufen. ---
    {
        joinCalls = [];
        UserModel.joinRoom = async function (roomId, userId) { joinCalls.push({ roomId: roomId, userId: userId }); return 1; };
        const express = h.requireFromKampf('express');
        const stub = express.Router();
        stub.post('/spielraum', (req, res) => res.status(200).json({ message: 'Gegner gefunden.' })); // 200 ohne Beitreten
        const stubApp = await t5.startApp({ user: { User_ID: 42 }, router: stub });
        try {
            await postHuman(stubApp);
            checker.check('[Negativ-Kontrolle] "200 ohne Beitreten"-Implementierung ruft joinRoom NICHT auf (wird erkannt)',
                joinCalls.length === 0, 'Der Test wuerde eine Implementierung ohne tatsaechliches Beitreten akzeptieren.');
        } finally {
            await stubApp.close();
        }
    }

    h.finishProcess(checker.finish());
})();
