// T9_Usermodel.Tests.js
// Tests fuer die in Task T9 ergaenzte Usermodel-Funktion (kampfderheere/model/user.js):
//   - deleteRoom(roomId, userId): loescht einen offenen Raum des Spielers (DELETE; Verwendung ab T9).
//     Nur wenn der Spieler der Ersteller ist (User_ID_1) und der Raum noch nicht voll besetzt ist
//     (User_ID_2 IS NULL) wird die Zeile entfernt, um das Loeschen fremder oder laufender Raeume
//     zu verhindern.
//
// Da kein echter MariaDB-Server verfuegbar ist, wird der DB-Pool gemockt (connection.execute) und
// das ausgefuehrte SQL geprueft. Gemaess tests.md: positive UND negative Faelle.

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

const db = t5.loadDbPool();
let lastCall = null;
let nextResult = { affectedRows: 1 };
db.execute = async function (sql, params) {
    lastCall = { sql: sql, params: params || [] };
    return [nextResult, []];
};

const UserModel = t5.loadUserModel();

(async function () {
    const checker = h.createChecker('T9 Usermodel: deleteRoom');

    checker.check('UserModel.deleteRoom ist eine Funktion',
        typeof UserModel.deleteRoom === 'function', 'deleteRoom fehlt im Usermodel.');

    if (typeof UserModel.deleteRoom !== 'function') {
        h.finishProcess(checker.finish());
        return;
    }

    // --- POSITIV: deleteRoom loescht den Raum per DELETE-Statement ---
    lastCall = null;
    nextResult = { affectedRows: 1 };
    const affected = await UserModel.deleteRoom(5, 42);

    checker.check('[positiv] deleteRoom fuehrt ein DELETE-Statement auf playerroom aus',
        !!lastCall && /DELETE/i.test(lastCall.sql) && /playerroom/i.test(lastCall.sql),
        'deleteRoom fuehrt kein DELETE auf playerroom aus (SQL: ' + (lastCall ? lastCall.sql : '—') + ').');
    checker.check('[positiv] SQL filtert nach der richtigen Room_ID',
        !!lastCall && /Room_ID/i.test(lastCall.sql) && lastCall.params.indexOf(5) >= 0,
        'SQL enthaelt keinen Room_ID-Filter oder uebergibt falsche Room_ID.');
    checker.check('[positiv] SQL filtert nach User_ID_1 (nur Ersteller darf loeschen)',
        !!lastCall && /User_ID_1/i.test(lastCall.sql) && lastCall.params.indexOf(42) >= 0,
        'SQL enthaelt keinen User_ID_1-Filter.');
    checker.check('[positiv] SQL filtert auf offene Raeume (User_ID_2 IS NULL)',
        !!lastCall && /User_ID_2\s+IS\s+NULL/i.test(lastCall.sql),
        'SQL enthaelt kein "User_ID_2 IS NULL"-Kriterium (wuerde auch volle Raeume loeschen).');
    checker.check('[positiv] deleteRoom liefert die Anzahl geloeschter Zeilen (affectedRows) zurueck',
        affected === 1, 'deleteRoom liefert affectedRows nicht zurueck (war: ' + affected + ').');

    // --- NEGATIV: deleteRoom fuehrt kein UPDATE und kein INSERT aus ---
    checker.check('[negativ] deleteRoom fuehrt kein UPDATE aus (kein UPDATE-Statement)',
        !!lastCall && !/UPDATE/i.test(lastCall.sql), 'deleteRoom fuehrt faelschlich ein UPDATE aus.');
    checker.check('[negativ] deleteRoom fuehrt kein INSERT aus (kein INSERT-Statement)',
        !!lastCall && !/INSERT/i.test(lastCall.sql), 'deleteRoom fuehrt faelschlich ein INSERT aus.');

    // --- NEGATIV: affectedRows = 0 wenn kein passender Raum gefunden ---
    lastCall = null;
    nextResult = { affectedRows: 0 };
    const none = await UserModel.deleteRoom(99, 42);
    checker.check('[negativ] deleteRoom liefert 0 wenn kein passender Raum gefunden (affectedRows = 0)',
        none === 0, 'deleteRoom liefert ' + none + ' statt 0 fuer fehlgeschlagenes Loeschen.');

    h.finishProcess(checker.finish());
})();
