// serverTestHelpers.js
// Hilfsmodul fuer die "serverseitigen" Tests des Routers Router/gameroom.js (Task T3).
//
// Gemaess constitution.md ohne Test-Framework: reines Node.js + das echte Express aus kampfderheere
// + echte HTTP-Anfragen ueber das eingebaute http-Modul. Damit werden die in der constitution
// genannten Testmethoden "Fetch" (HTTP-Anfragen) und "Serverseitig" abgedeckt.
//
// Hinweis: Es wird bewusst http.request mit "agent: false" verwendet (statt global fetch/undici),
// damit keine Keep-Alive-Sockets offen bleiben und der Test-Prozess sauber beenden kann.

const path = require('path');
const http = require('http');
const fs = require('fs');

// Pfad zum Projektordner kampfderheere (relativ zu Test/lib). Override via EMSHIFT_KAMPF_DIR moeglich.
function getKampfPath() {
    if (process.env.EMSHIFT_KAMPF_DIR && fs.existsSync(process.env.EMSHIFT_KAMPF_DIR)) {
        return process.env.EMSHIFT_KAMPF_DIR;
    }
    return path.resolve(__dirname, '..', '..', 'kampfderheere');
}

// Laedt ein npm-Modul aus den node_modules von kampfderheere (z.B. express),
// damit Test und Router dieselbe Express-Instanz verwenden.
function requireFromKampf(moduleName) {
    return require(path.join(getKampfPath(), 'node_modules', moduleName));
}

// Laedt den in T3 erstellten Router (Router/gameroom.js) per absolutem Pfad.
function loadGameroomRouter() {
    return require(path.join(getKampfPath(), 'Router', 'gameroom.js'));
}

// Liest den Quelltext von index.js ein (fuer die Migrationspruefung).
function getIndexJsSource() {
    return fs.readFileSync(path.join(getKampfPath(), 'index.js'), 'utf8');
}

// Startet eine minimale Express-App mit dem uebergebenen Router auf einem zufaelligen Port (127.0.0.1).
// Rueckgabe: { baseUrl, close() }.
async function startAppWithRouter(router, mountPath) {
    const express = requireFromKampf('express');
    const app = express();
    app.use(express.json());
    app.use(mountPath, router);
    const server = http.createServer(app);
    await new Promise(function (resolve) { server.listen(0, '127.0.0.1', resolve); });
    const port = server.address().port;
    return {
        baseUrl: 'http://127.0.0.1:' + port,
        close: function () {
            return new Promise(function (resolve) {
                if (typeof server.closeAllConnections === 'function') { server.closeAllConnections(); }
                server.close(function () { resolve(); });
            });
        }
    };
}

// Fuehrt eine einzelne HTTP-Anfrage aus (ohne Keep-Alive) und liefert { status, headers, text }.
function httpJson(urlString, options) {
    options = options || {};
    return new Promise(function (resolve, reject) {
        const u = new URL(urlString);
        const body = options.body || null;
        const headers = Object.assign({}, options.headers || {});
        if (body && headers['Content-Length'] == null) {
            headers['Content-Length'] = Buffer.byteLength(body);
        }
        const req = http.request({
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + (u.search || ''),
            method: options.method || 'GET',
            headers: headers,
            agent: false
        }, function (res) {
            let text = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) { text += chunk; });
            res.on('end', function () { resolve({ status: res.statusCode, headers: res.headers, text: text }); });
        });
        req.on('error', reject);
        if (body) { req.write(body); }
        req.end();
    });
}

// Einfache, framework-freie Ergebnis-Sammlung mit PASS/FAIL-Ausgabe und Zusammenfassung.
function createChecker(title) {
    const results = [];
    return {
        check: function (name, passed, detail) {
            results.push({ name: name, passed: !!passed, detail: detail || '' });
        },
        finish: function () {
            let failed = 0;
            results.forEach(function (r) {
                if (r.passed) { console.log('  [PASS] ' + r.name); }
                else { failed++; console.log('  [FAIL] ' + r.name + ' -> ' + r.detail); }
            });
            console.log('');
            console.log('==== ' + title + ' ====');
            console.log('  Gesamt: ' + results.length + ' | Bestanden: ' + (results.length - failed) + ' | Fehlgeschlagen: ' + failed);
            return failed === 0;
        }
    };
}

// Beendet den Test-Prozess sauber: Exit-Code setzen und Event-Loop natuerlich auslaufen lassen.
// Ein ent-referenziertes Sicherheitsnetz beendet hart, falls doch ein Handle offen bleibt.
function finishProcess(allPassed) {
    process.exitCode = allPassed ? 0 : 1;
    setTimeout(function () { process.exit(process.exitCode); }, 2000).unref();
}

module.exports = {
    getKampfPath: getKampfPath,
    requireFromKampf: requireFromKampf,
    loadGameroomRouter: loadGameroomRouter,
    getIndexJsSource: getIndexJsSource,
    startAppWithRouter: startAppWithRouter,
    httpJson: httpJson,
    createChecker: createChecker,
    finishProcess: finishProcess
};
