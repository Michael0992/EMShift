// Test-015_DatenbankAktualisierung.Tests.js
// tests.md / Test-015: Ueberpruefen, ob die Datenbank korrekt aktualisiert wird, wenn ein Spieler
// einem Raum beitritt oder einen neuen Raum erstellt.
//
// T6 ergaenzt dafuer im Usermodel die Schreib-Funktionen joinRoom (UPDATE) und createRoom (INSERT).
// Da kein echter MariaDB-Server verfuegbar ist, wird der DB-Pool gemockt (connection.execute) und
// geprueft, dass die korrekten Schreiboperationen mit den richtigen Werten ausgefuehrt werden.
//
// Gemaess tests.md: positive UND negative Faelle.

const h = require('./lib/serverTestHelpers');
const t5 = require('./lib/t5Helpers');

const db = t5.loadDbPool();
let lastCall = null;
let nextResult = { affectedRows: 1, insertId: 77 };
db.execute = async function (sql, params) {
    lastCall = { sql: sql, params: params || [] };
    return [nextResult, []];
};

const UserModel = t5.loadUserModel();

(async function () {
    const checker = h.createChecker('Test-015: Datenbank-Aktualisierung bei Beitreten / Erstellen');

    if (typeof UserModel.joinRoom !== 'function' || typeof UserModel.createRoom !== 'function') {
        checker.check('UserModel.joinRoom und UserModel.createRoom existieren', false,
            'Die Schreib-Funktionen fehlen im Usermodel.');
        h.finishProcess(checker.finish());
        return;
    }

    // --- BEITRETEN: joinRoom aktualisiert den Raum (UPDATE) ---
    lastCall = null;
    nextResult = { affectedRows: 1 };
    const affected = await UserModel.joinRoom(5, 42);
    checker.check('[positiv] Beitreten: Es wird eine Schreiboperation ausgefuehrt (UPDATE)',
        !!lastCall && /UPDATE/i.test(lastCall.sql), 'joinRoom fuehrt kein UPDATE aus.');
    checker.check('[positiv] Beitreten: Der zweite Spieler wird fuer den richtigen Raum gesetzt',
        !!lastCall && /User_ID_2/i.test(lastCall.sql) && lastCall.params.indexOf(42) >= 0 && lastCall.params.indexOf(5) >= 0,
        'joinRoom setzt User_ID_2 nicht fuer die richtige Room_ID.');
    checker.check('[positiv] Beitreten: Datenbank wird tatsaechlich veraendert (affectedRows > 0)',
        affected === 1, 'joinRoom meldet keine veraenderte Zeile.');
    checker.check('[negativ] Beitreten: Es wird KEIN INSERT statt eines UPDATE ausgefuehrt',
        !!lastCall && !/INSERT/i.test(lastCall.sql), 'joinRoom fuehrt faelschlich ein INSERT aus.');

    // --- ERSTELLEN: createRoom legt einen neuen Raum an (INSERT) ---
    lastCall = null;
    nextResult = { insertId: 77 };
    const newId = await UserModel.createRoom(42, 'HUMAN');
    checker.check('[positiv] Erstellen: Es wird eine Schreiboperation ausgefuehrt (INSERT)',
        !!lastCall && /INSERT\s+INTO\s+playerroom/i.test(lastCall.sql), 'createRoom fuehrt kein INSERT aus.');
    checker.check('[positiv] Erstellen: Der Ersteller wird als erster Spieler eingetragen',
        !!lastCall && /User_ID_1/i.test(lastCall.sql) && lastCall.params.indexOf(42) >= 0,
        'createRoom traegt den Ersteller nicht als User_ID_1 ein.');
    checker.check('[positiv] Erstellen: Die neue Room-ID wird zurueckgegeben (insertId)',
        newId === 77, 'createRoom liefert die neue Room-ID nicht zurueck.');
    checker.check('[negativ] Erstellen: Es wird KEIN UPDATE statt eines INSERT ausgefuehrt',
        !!lastCall && !/UPDATE/i.test(lastCall.sql), 'createRoom fuehrt faelschlich ein UPDATE aus.');

    h.finishProcess(checker.finish());
})();
