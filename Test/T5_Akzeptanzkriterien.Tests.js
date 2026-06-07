// T5_Akzeptanzkriterien.Tests.js
// Tests fuer Task T5: Verzweigung der menschlichen Gegnersuche in der POST-Route /spielraum.
//
// Bezug zu spec.md (Akzeptanzkriterien):
//  - "Das System prueft, ob der Spieler bereits zu einem Raum gehoert."
//  - "Das System sucht nach offenen Raeumen ... und wenn es keinen offenen Raum gibt, wird einer erstellt."
// T5 implementiert NUR die Verzweigung der drei Faelle (kein Beitreten/Erstellen) und liefert je Fall
// einen passenden Statuscode (202 = Suche laeuft, 200 = Gegner gefunden).
//
// Gemaess tests.md: positive UND negative Faelle + Negativ-Kontrolle (Tests selbst pruefen).
// Reines Node.js (kein Framework); UserModel und Authentifizierung (req.user) werden gemockt.

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

const UserModel = t5.loadUserModel();

let roomForPlayerCalls = 0;
let openRoomCalls = 0;

// Setzt das Szenario: Rueckgabewerte der gemockten Abfragefunktionen + Zaehler zuruecksetzen.
function setScenario(existingRoom, openRoom) {
    roomForPlayerCalls = 0;
    openRoomCalls = 0;
    UserModel.findRoomForPlayer = async function () { roomForPlayerCalls++; return existingRoom; };
    UserModel.findOpenRoom = async function () { openRoomCalls++; return openRoom; };
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
    const checker = h.createChecker('T5 Akzeptanzkriterien (spec.md) + Verzweigung der 3 Faelle');

    if (typeof UserModel.findRoomForPlayer !== 'function' || typeof UserModel.findOpenRoom !== 'function') {
        checker.check('UserModel besitzt findRoomForPlayer und findOpenRoom', false,
            'Die erforderlichen Abfragefunktionen fehlen im Usermodel.');
        h.finishProcess(checker.finish());
        return;
    }

    const app = await t5.startApp({ user: { User_ID: 42 } });
    try {
        // --- Fall a: Spieler ist bereits einem Raum zugewiesen ---
        setScenario({ Room_ID: 1, User_ID_1: 42, User_ID_2: null }, null);
        const a = await postHuman(app);
        checker.check('[Fall a] System prueft, ob der Spieler bereits einen Raum hat (findRoomForPlayer aufgerufen)',
            roomForPlayerCalls === 1, 'findRoomForPlayer wurde nicht aufgerufen.');
        checker.check('[Fall a] Spieler hat bereits Raum -> Statuscode 202 (Suche laeuft)',
            a.status === 202, 'Status war ' + a.status + ' (erwartet 202).');
        checker.check('[Fall a/negativ] findOpenRoom wird NICHT aufgerufen (Kurzschluss bei bestehendem Raum)',
            openRoomCalls === 0, 'findOpenRoom wurde trotz bestehenden Raums aufgerufen.');

        // --- Fall b: kein eigener Raum, aber ein offener Raum vorhanden ---
        setScenario(null, { Room_ID: 2, User_ID_1: 7, User_ID_2: null });
        const b = await postHuman(app);
        checker.check('[Fall b] System sucht nach offenen Raeumen (findOpenRoom aufgerufen)',
            openRoomCalls === 1, 'findOpenRoom wurde nicht aufgerufen.');
        checker.check('[Fall b] Offener Raum gefunden -> Statuscode 200 (Gegner gefunden)',
            b.status === 200, 'Status war ' + b.status + ' (erwartet 200).');

        // --- Fall c: kein eigener Raum und kein offener Raum -> neuer Raum noetig ---
        setScenario(null, null);
        const c = await postHuman(app);
        checker.check('[Fall c] Beide Abfragen werden ausgefuehrt (findRoomForPlayer + findOpenRoom)',
            roomForPlayerCalls === 1 && openRoomCalls === 1, 'Nicht beide Abfragen wurden ausgefuehrt.');
        checker.check('[Fall c] Kein Raum vorhanden -> Statuscode 202 (neuer Raum, Suche laeuft)',
            c.status === 202, 'Status war ' + c.status + ' (erwartet 202).');

        // --- Negativer Fall: differenziertes Verhalten (Fall b unterscheidet sich von a/c) ---
        checker.check("[negativ] 'offener Raum gefunden' (200) unterscheidet sich von 'kein Raum' (202)",
            b.status !== c.status, 'Fall b und Fall c liefern denselben Status.');
    } finally {
        await app.close();
    }

    // --- Negativer Fall: ohne Authentifizierung kann der Spieler nicht identifiziert werden -> kein 200/202 ---
    {
        const appNoUser = await t5.startApp({}); // kein req.user
        try {
            setScenario(null, null);
            const r = await postHuman(appNoUser);
            checker.check('[negativ] Ohne angemeldeten Spieler keine erfolgreiche Suche (Status nicht 200/202)',
                r.status !== 200 && r.status !== 202, 'Status war ' + r.status + ' (unerwartet erfolgreich).');
        } finally {
            await appNoUser.close();
        }
    }

    // --- NEGATIV-KONTROLLE: Eine Implementierung ohne Verzweigung (immer 200) darf die
    //     Fall-a-Erwartung (202) NICHT erfuellen -> beweist die Aussagekraft des Tests. ---
    {
        const express = h.requireFromKampf('express');
        const stub = express.Router();
        stub.post('/spielraum', (req, res) => res.json({ ok: true })); // falsch: keine Verzweigung
        const stubApp = await t5.startApp({ user: { User_ID: 42 }, router: stub });
        try {
            const r = await postHuman(stubApp);
            checker.check('[Negativ-Kontrolle] Implementierung ohne Verzweigung liefert in Fall a NICHT 202',
                r.status !== 202, 'Der Test wuerde eine Implementierung ohne Verzweigung faelschlich akzeptieren.');
        } finally {
            await stubApp.close();
        }
    }

    h.finishProcess(checker.finish());
})();
