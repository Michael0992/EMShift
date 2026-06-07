// T6_Usermodel.Tests.js
// Tests fuer die in Task T6 ergaenzten Usermodel-Funktionen (kampfderheere/model/user.js):
//   - isRoomFull(room): prueft, ob ein Raum vollstaendig besetzt ist (2 Spieler)
//   - joinRoom(roomId, userId): traegt den Spieler als zweiten Spieler ein (DB-Update; Verwendung ab T7)
//   - createRoom(userId, type): erstellt einen neuen Raum (DB-Insert; Verwendung ab T8)
//
// joinRoom/createRoom werden gemaess T6 ("Vervollstaendige das Usermodel mit den noetigen Funktionen
// um die DB zu aktualisieren") bereits hier angelegt und getestet; die Route nutzt sie noch nicht.
//
// Da kein echter MariaDB-Server verfuegbar ist, wird der DB-Pool gemockt (connection.execute) und das
// ausgefuehrte SQL geprueft. Gemaess tests.md: positive UND negative Faelle.

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

const db = t5.loadDbPool();
let lastCall = null;
let nextResult = { affectedRows: 1, insertId: 99 };
db.execute = async function (sql, params) {
    lastCall = { sql: sql, params: params || [] };
    return [nextResult, []];
};

const UserModel = t5.loadUserModel();

(async function () {
    const checker = h.createChecker('T6 Usermodel: isRoomFull, joinRoom, createRoom');

    // --- Existenz ---
    checker.check('UserModel.isRoomFull ist eine Funktion', typeof UserModel.isRoomFull === 'function', 'isRoomFull fehlt.');
    checker.check('UserModel.joinRoom ist eine Funktion', typeof UserModel.joinRoom === 'function', 'joinRoom fehlt.');
    checker.check('UserModel.createRoom ist eine Funktion', typeof UserModel.createRoom === 'function', 'createRoom fehlt.');

    if (typeof UserModel.isRoomFull !== 'function' || typeof UserModel.joinRoom !== 'function' || typeof UserModel.createRoom !== 'function') {
        h.finishProcess(checker.finish());
        return;
    }

    // --- isRoomFull: POSITIV (2 Spieler -> voll) ---
    checker.check('[positiv] isRoomFull liefert true bei zwei Spielern',
        UserModel.isRoomFull({ Room_ID: 1, User_ID_1: 42, User_ID_2: 7 }) === true,
        'Voll besetzter Raum wird nicht als voll erkannt.');

    // --- isRoomFull: NEGATIV (1 Spieler / kein zweiter -> nicht voll) ---
    checker.check('[negativ] isRoomFull liefert false bei nur einem Spieler (User_ID_2 = null)',
        UserModel.isRoomFull({ Room_ID: 1, User_ID_1: 42, User_ID_2: null }) === false,
        'Nicht voller Raum wird faelschlich als voll erkannt.');
    checker.check('[negativ] isRoomFull liefert false, wenn kein zweiter Spieler-Wert vorhanden ist',
        UserModel.isRoomFull({ Room_ID: 1, User_ID_1: 42 }) === false,
        'Raum ohne zweiten Spieler wird faelschlich als voll erkannt.');

    // --- joinRoom: korrektes UPDATE ---
    lastCall = null;
    nextResult = { affectedRows: 1 };
    const affected = await UserModel.joinRoom(5, 42);
    checker.check('[positiv] joinRoom fuehrt ein UPDATE auf playerroom aus',
        !!lastCall && /UPDATE/i.test(lastCall.sql) && /playerroom/i.test(lastCall.sql),
        'joinRoom fuehrt kein UPDATE auf playerroom aus.');
    checker.check('[positiv] joinRoom setzt den zweiten Spieler (User_ID_2) fuer den richtigen Raum (Room_ID)',
        !!lastCall && /User_ID_2/i.test(lastCall.sql) && /Room_ID/i.test(lastCall.sql)
            && lastCall.params.indexOf(42) >= 0 && lastCall.params.indexOf(5) >= 0,
        'joinRoom setzt nicht User_ID_2 fuer die richtige Room_ID.');
    checker.check('[positiv] joinRoom liefert die Anzahl betroffener Zeilen zurueck',
        affected === 1, 'joinRoom liefert affectedRows nicht zurueck.');

    // --- createRoom: korrektes INSERT ---
    lastCall = null;
    nextResult = { insertId: 99 };
    const newId = await UserModel.createRoom(42, 'HUMAN');
    checker.check('[positiv] createRoom fuehrt ein INSERT auf playerroom aus',
        !!lastCall && /INSERT\s+INTO\s+playerroom/i.test(lastCall.sql),
        'createRoom fuehrt kein INSERT auf playerroom aus.');
    checker.check('[positiv] createRoom traegt den Ersteller als ersten Spieler (User_ID_1) ein',
        !!lastCall && /User_ID_1/i.test(lastCall.sql) && lastCall.params.indexOf(42) >= 0,
        'createRoom traegt den Ersteller nicht als User_ID_1 ein.');
    checker.check("[positiv] createRoom setzt den Typ (z.B. 'HUMAN')",
        !!lastCall && /type/i.test(lastCall.sql) && lastCall.params.indexOf('HUMAN') >= 0,
        'createRoom setzt den Typ nicht.');
    checker.check('[positiv] createRoom liefert die neue Room-ID (insertId) zurueck',
        newId === 99, 'createRoom liefert insertId nicht zurueck.');

    h.finishProcess(checker.finish());
})();
