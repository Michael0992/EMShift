// Test-012_NurEinemRaumBeitreten.Tests.js
// tests.md / Test-012: Ueberpruefen, ob ein Spieler nur einem Raum beitreten kann, wenn er nicht
// bereits einem Raum beigetreten ist oder einen Raum erstellt hat.
// (Deckt zugleich den gleichen Edge-Case aus Test-011/Test-014 ab: keine Mehrfach-Raeume.)
//
// T7-Verhalten: Hat der Spieler bereits einen Raum (Fall 1), wird NICHT zusaetzlich einem offenen
// Raum beigetreten (kein joinRoom). Nur wenn der Spieler keinen Raum hat und ein offener existiert,
// tritt er bei (Fall 2). Diese Reihenfolge (Fall 1 vor Fall 2) verhindert Mehrfach-Beitritte.
//
// Gemaess tests.md: positive UND negative Faelle + Negativ-Kontrolle.

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

const UserModel = t5.loadUserModel();
let joinCalls = [];

function setScenario(existingRoom, openRoom) {
    joinCalls = [];
    UserModel.findRoomForPlayer = async function () { return existingRoom; };
    UserModel.findOpenRoom = async function () { return openRoom; };
    UserModel.joinRoom = async function (roomId, userId) { joinCalls.push({ roomId: roomId, userId: userId }); return 1; };
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
    const checker = h.createChecker('Test-012: Spieler tritt nur einem Raum bei (kein Mehrfach-Beitritt)');

    const app = await t5.startApp({ user: { User_ID: 42 } });
    try {
        // --- POSITIV: Spieler ohne Raum + offener Raum -> tritt (genau einem) Raum bei ---
        setScenario(null, { Room_ID: 2, User_ID_1: 7, User_ID_2: null });
        const join = await postHuman(app);
        checker.check('[positiv] Spieler ohne Raum tritt einem offenen Raum bei (joinRoom genau einmal)',
            joinCalls.length === 1, 'joinRoom wurde nicht genau einmal aufgerufen (war: ' + joinCalls.length + ').');
        checker.check('[positiv] Beitreten erfolgreich -> Status 200', join.status === 200,
            'Status war ' + join.status + '.');

        // --- NEGATIV: Spieler hat bereits einen (nicht vollen) Raum -> tritt KEINEM weiteren Raum bei ---
        setScenario({ Room_ID: 1, User_ID_1: 42, User_ID_2: null }, { Room_ID: 2, User_ID_1: 7, User_ID_2: null });
        const noJoin = await postHuman(app);
        checker.check('[negativ] Spieler mit bestehendem Raum tritt KEINEM weiteren Raum bei (joinRoom nicht aufgerufen)',
            joinCalls.length === 0, 'joinRoom wurde trotz bestehenden Raums aufgerufen.');
        checker.check('[negativ] Spieler mit bestehendem (nicht vollem) Raum -> Status 202 (kein zweiter Beitritt)',
            noJoin.status === 202, 'Status war ' + noJoin.status + ' (erwartet 202).');
    } finally {
        await app.close();
    }

    // --- NEGATIV-KONTROLLE: Eine fehlerhafte Implementierung, die immer beitritt (auch wenn der
    //     Spieler bereits einen Raum hat), wird erkannt: joinRoom wird trotz bestehenden Raums aufgerufen. ---
    {
        joinCalls = [];
        UserModel.findRoomForPlayer = async function () { return { Room_ID: 1, User_ID_1: 42, User_ID_2: null }; };
        UserModel.joinRoom = async function (roomId, userId) { joinCalls.push({ roomId: roomId, userId: userId }); return 1; };
        const express = h.requireFromKampf('express');
        const stub = express.Router();
        stub.post('/spielraum', async (req, res) => {
            // Fehlerhaft: tritt immer bei, ohne zu pruefen, ob der Spieler bereits einen Raum hat.
            await UserModel.joinRoom(999, req.user.User_ID);
            res.status(200).json({ message: 'Gegner gefunden.' });
        });
        const stubApp = await t5.startApp({ user: { User_ID: 42 }, router: stub });
        try {
            await postHuman(stubApp);
            checker.check('[Negativ-Kontrolle] "immer beitreten"-Implementierung wird erkannt (joinRoom trotz bestehenden Raums aufgerufen)',
                joinCalls.length > 0, 'Der Test wuerde eine Implementierung mit Mehrfach-Beitritt faelschlich akzeptieren.');
        } finally {
            await stubApp.close();
        }
    }

    h.finishProcess(checker.finish());
})();
