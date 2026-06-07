// t5Helpers.js
// Zusaetzliche Hilfen fuer die Tests von Task T5 (Verzweigung der menschlichen Gegnersuche +
// Abfragefunktionen im Usermodel). Baut auf serverTestHelpers.js auf, ohne dieses zu veraendern.
//
// Gemaess constitution.md ohne Test-Framework. Da kein echter MariaDB-Server verfuegbar ist, wird
// fuer Route-Tests das UserModel gemockt und fuer Usermodel-Tests der DB-Pool (connection.execute)
// gemockt (require-Cache: Test und Anwendungscode teilen sich dieselbe Modul-Instanz).

const path = require('path');
const http = require('http');
const h = require('./serverTestHelpers');

// Laedt das UserModel (kampfderheere/model/user.js) per absolutem Pfad (gleiche Instanz wie im Router).
function loadUserModel() {
    return require(path.join(h.getKampfPath(), 'model', 'user.js'));
}

// Laedt den DB-Pool (kampfderheere/config/db.js). createPool verbindet sich nicht sofort,
// daher ist das auch ohne laufende Datenbank moeglich; .execute kann fuer Tests ersetzt werden.
function loadDbPool() {
    return require(path.join(h.getKampfPath(), 'config', 'db.js'));
}

// Startet eine Express-Test-App.
// options.user: wird (falls gesetzt) als req.user injiziert (simulierte Authentifizierung).
// options.router: zu mountender Router (Standard: der echte Router aus Router/gameroom.js).
async function startApp(options) {
    options = options || {};
    const express = h.requireFromKampf('express');
    const app = express();
    app.use(express.json());
    if (Object.prototype.hasOwnProperty.call(options, 'user') && options.user !== undefined) {
        app.use(function (req, res, next) { req.user = options.user; next(); });
    }
    const router = options.router || h.loadGameroomRouter();
    app.use('/api', router);
    const server = http.createServer(app);
    await new Promise(function (resolve) { server.listen(0, '127.0.0.1', resolve); });
    const port = server.address().port;
    return {
        baseUrl: 'http://127.0.0.1:' + port,
        close: function () { return new Promise(function (r) { server.close(function () { r(); }); }); }
    };
}

module.exports = {
    loadUserModel: loadUserModel,
    loadDbPool: loadDbPool,
    startApp: startApp
};
