// T5_Usermodel.Tests.js
// Tests fuer die in Task T5 geforderten Abfragefunktionen im Usermodel (kampfderheere/model/user.js):
//  - findRoomForPlayer(userId): Raum des Spielers ermitteln
//  - findOpenRoom(userId): offenen (noch nicht vollstaendigen) menschlichen Raum finden
//
// Da kein echter MariaDB-Server verfuegbar ist, wird der DB-Pool gemockt (connection.execute).
// Geprueft werden korrektes SQL/Parameter und die Rueckgabe (positiv = Treffer, negativ = kein Treffer).
//
// Reines Node.js (kein Test-Framework) gemaess constitution.md.

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

// DB-Pool laden und execute mocken, BEVOR das UserModel die Abfragen ausfuehrt.
const db = t5.loadDbPool();
let lastCall = null;
let nextRows = [];
db.execute = async function (sql, params) {
    lastCall = { sql: sql, params: params || [] };
    return [nextRows, []]; // mysql2/promise: [rows, fields]
};

const UserModel = t5.loadUserModel();

(async function () {
    const checker = h.createChecker('T5 Usermodel-Abfragefunktionen (model/user.js)');

    // --- Existenz ---
    checker.check('UserModel.findRoomForPlayer ist eine Funktion',
        typeof UserModel.findRoomForPlayer === 'function', 'findRoomForPlayer fehlt.');
    checker.check('UserModel.findOpenRoom ist eine Funktion',
        typeof UserModel.findOpenRoom === 'function', 'findOpenRoom fehlt.');

    if (typeof UserModel.findRoomForPlayer !== 'function' || typeof UserModel.findOpenRoom !== 'function') {
        h.finishProcess(checker.finish());
        return;
    }

    // --- findRoomForPlayer: POSITIV (Spieler hat einen Raum) ---
    lastCall = null;
    nextRows = [{ Room_ID: 5, User_ID_1: 42, User_ID_2: null }];
    const room = await UserModel.findRoomForPlayer(42);
    checker.check('[positiv] findRoomForPlayer fragt die Tabelle playerroom ab',
        !!lastCall && /playerroom/i.test(lastCall.sql), 'SQL fragt nicht playerroom ab.');
    checker.check('[positiv] findRoomForPlayer prueft User_ID_1 und User_ID_2',
        !!lastCall && /User_ID_1/i.test(lastCall.sql) && /User_ID_2/i.test(lastCall.sql),
        'SQL prueft nicht beide Spieler-Spalten.');
    checker.check('[positiv] findRoomForPlayer uebergibt die userId als Parameter',
        !!lastCall && lastCall.params.indexOf(42) >= 0, 'userId wird nicht als Parameter uebergeben.');
    checker.check('[positiv] findRoomForPlayer liefert den gefundenen Raum (rows[0])',
        !!room && room.Room_ID === 5, 'Der gefundene Raum wird nicht zurueckgegeben.');

    // --- findRoomForPlayer: NEGATIV (kein Raum -> null) ---
    nextRows = [];
    const noRoom = await UserModel.findRoomForPlayer(99);
    checker.check('[negativ] findRoomForPlayer liefert null, wenn kein Raum existiert',
        noRoom === null, 'Erwartet null, erhalten: ' + JSON.stringify(noRoom) + '.');

    // --- findOpenRoom: POSITIV (offener Raum vorhanden) ---
    lastCall = null;
    nextRows = [{ Room_ID: 9, User_ID_1: 7, User_ID_2: null }];
    const open = await UserModel.findOpenRoom(42);
    checker.check('[positiv] findOpenRoom fragt die Tabelle playerroom ab',
        !!lastCall && /playerroom/i.test(lastCall.sql), 'SQL fragt nicht playerroom ab.');
    checker.check('[positiv] findOpenRoom sucht nach freiem zweiten Platz (User_ID_2 IS NULL)',
        !!lastCall && /User_ID_2/i.test(lastCall.sql) && /NULL/i.test(lastCall.sql),
        'SQL sucht nicht nach freiem zweiten Platz.');
    checker.check('[positiv] findOpenRoom beschraenkt auf menschliche Raeume (HUMAN)',
        !!lastCall && /HUMAN/i.test(lastCall.sql), 'SQL beschraenkt nicht auf type HUMAN.');
    checker.check('[positiv] findOpenRoom liefert den offenen Raum (rows[0])',
        !!open && open.Room_ID === 9, 'Der offene Raum wird nicht zurueckgegeben.');

    // --- findOpenRoom: NEGATIV (kein offener Raum -> null) ---
    nextRows = [];
    const noOpen = await UserModel.findOpenRoom(42);
    checker.check('[negativ] findOpenRoom liefert null, wenn kein offener Raum existiert',
        noOpen === null, 'Erwartet null, erhalten: ' + JSON.stringify(noOpen) + '.');

    h.finishProcess(checker.finish());
})();
