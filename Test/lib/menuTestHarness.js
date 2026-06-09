// menuTestHarness.js
// Hilfsmodul fuer die verhaltensbasierten Tests der Funktion "startGame" aus menu.js (Task T2).
//
// Gemaess constitution.md wird KEIN Test-Framework verwendet. Getestet wird "serverseitig" mit
// reinem Node.js (nur eingebaute Module: fs, path, vm). menu.js ist Browser-Code und wird in einem
// vm-Kontext mit gemockten Browser-Globals (fetch, window, document, setTimeout) ausgefuehrt.
//
// T11-Erweiterung: document.getElementById gibt nun verfolgbare Element-Objekte zurueck
// (mit textContent, style.display, classList). createHarness() gibt zusaetzlich domElements
// zurueck, damit Tests den DOM-Zustand nach Funktionsaufrufen pruefen koennen.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Ermittelt den Pfad zu menu.js. Standard: relativ zu diesem Modul
// (Test/lib -> ../../kampfderheere/public/menu.js). Override via EMSHIFT_MENU_JS moeglich (z.B. fuer Negativtests).
function getMenuPath() {
    if (process.env.EMSHIFT_MENU_JS && fs.existsSync(process.env.EMSHIFT_MENU_JS)) {
        return process.env.EMSHIFT_MENU_JS;
    }
    return path.resolve(__dirname, '..', '..', 'kampfderheere', 'public', 'menu.js');
}

// Erstellt eine Sandbox mit gemockten Browser-Globals.
// spielraumResponder(callNumber, state, makeJsonResponse) liefert die gemockte Antwort auf /spielraum.
function createHarness(spielraumResponder) {
    const state = {
        spielraumCalls: [],   // jede Anfrage an /spielraum bzw. /api/spielraum: { url, options }
        meCalls: 0,           // Anzahl Aufrufe von /api/me (Top-Level-Code in menu.js)
        redirectedTo: null,   // Wert, der window.location.href zugewiesen wurde
        jsonParsedCount: 0    // wie oft response.json() aufgerufen wurde
    };

    let resolveRedirect;
    const redirected = new Promise(function (resolve) { resolveRedirect = resolve; });

    // Verfolgte DOM-Elemente (T11): wird von document.getElementById benutzt und
    // im Rueckgabewert von createHarness() veroeffentlicht, damit Tests den Zustand pruefen koennen.
    const domElements = {};

    // window.location.href als Getter/Setter, damit eine Weiterleitung erkannt werden kann.
    const location = {};
    Object.defineProperty(location, 'href', {
        get: function () { return state.redirectedTo; },
        set: function (value) { state.redirectedTo = value; resolveRedirect(value); }
    });

    // Registrierte window-Event-Listener (z.B. 'beforeunload').
    // Ermoeglicht Tests, die pruefen ob menu.js Event-Handler anmeldet und wie sie reagieren.
    const windowListeners = {};

    // Baut eine gemockte fetch-Response, die ihren Body als JSON liefert.
    function makeJsonResponse(status, payload) {
        return {
            status: status,
            ok: status >= 200 && status < 300,
            json: async function () { state.jsonParsedCount++; return payload; }
        };
    }

    const sandbox = {
        console: { log: function () {}, error: function () {} },
        // Retries im Test beschleunigen (kurze Verzoegerung statt echter Wartezeit).
        setTimeout: function (fn) { return setTimeout(fn, 5); },
        clearTimeout: function (id) { return clearTimeout(id); },
        // DOM-Element-Mock (T11): jedes per getElementById angeforderte Element wird
        // lazy erzeugt und in domElements gespeichert, damit Tests den Zustand pruefen koennen.
        // style.display und textContent werden verfolgt; classList ist ein No-Op-Stub.
        document: {
            getElementById: function (id) {
                if (!domElements[id]) {
                    domElements[id] = {
                        textContent: '',
                        style: { display: '' },
                        classList: {
                            toggle: function () {},
                            add: function () {},
                            remove: function () {}
                        }
                    };
                }
                return domElements[id];
            },
            body: { innerHTML: '' }
        },
        window: {
            location: location,
            // addEventListener/removeEventListener: ermoeglicht Tests fuer Event-Handler
            // die menu.js beim Laden anmeldet (z.B. 'beforeunload' fuer das Abbrechen der Suche).
            addEventListener: function (event, fn) {
                if (!windowListeners[event]) { windowListeners[event] = []; }
                windowListeners[event].push(fn);
            },
            removeEventListener: function (event, fn) {
                if (windowListeners[event]) {
                    windowListeners[event] = windowListeners[event].filter(function (f) { return f !== fn; });
                }
            }
        },
        fetch: async function (url, options) {
            if (url === '/api/me') {
                state.meCalls++;
                return makeJsonResponse(200, { user: { username: 'tester' } });
            }
            if (url === '/spielraum' || url === '/api/spielraum') {
                state.spielraumCalls.push({ url: url, options: options || {} });
                return spielraumResponder(state.spielraumCalls.length, state, makeJsonResponse);
            }
            throw new Error('Unerwartete URL im Test: ' + url);
        }
    };

    // windowListeners: registrierte window-Event-Handler (T9, z.B. beforeunload).
    // domElements: verfolgte DOM-Elemente (T11, z.B. search_status, cancel_search_btn).
    return { sandbox: sandbox, state: state, redirected: redirected, windowListeners: windowListeners, domElements: domElements };
}

// Laedt menu.js in die gegebene Sandbox (fuehrt den Datei-Inhalt im vm-Kontext aus).
function loadMenuInto(sandbox) {
    const code = fs.readFileSync(getMenuPath(), 'utf8');
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename: 'menu.js' });
}

// Ruft startGame(mode) innerhalb des Sandbox-Kontextes auf.
function callStartGame(sandbox, mode) {
    vm.runInContext('startGame(' + JSON.stringify(mode) + ');', sandbox, { filename: 'startGame-call' });
}

// Ruft cancelSearch() innerhalb des Sandbox-Kontextes auf (T9: Gegnersuche abbrechen).
function callCancelSearch(sandbox) {
    vm.runInContext('cancelSearch();', sandbox, { filename: 'cancelSearch-call' });
}

// Liest den uebermittelten Modus aus einer aufgezeichneten Anfrage (unterstuetzt JSON- und urlencoded-Body).
function parseMode(call) {
    if (!call || !call.options) { return null; }
    const body = call.options.body;
    if (typeof body !== 'string') { return null; }
    try {
        const obj = JSON.parse(body);
        if (obj && typeof obj.mode !== 'undefined') { return obj.mode; }
    } catch (e) { /* kein JSON -> weiter pruefen */ }
    const match = /(?:^|[?&])mode=([^&]+)/.exec(body);
    if (match) { return decodeURIComponent(match[1]); }
    return null;
}

// Promise mit Timeout, damit eine fehlerhafte Implementierung den Test nicht haengen laesst.
function withTimeout(promise, ms, message) {
    return Promise.race([
        promise,
        new Promise(function (_, reject) {
            setTimeout(function () { reject(new Error(message || ('Timeout nach ' + ms + ' ms'))); }, ms);
        })
    ]);
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
                if (r.passed) {
                    console.log('  [PASS] ' + r.name);
                } else {
                    failed++;
                    console.log('  [FAIL] ' + r.name + ' -> ' + r.detail);
                }
            });
            console.log('');
            console.log('==== ' + title + ' ====');
            console.log('  Gesamt: ' + results.length + ' | Bestanden: ' + (results.length - failed) + ' | Fehlgeschlagen: ' + failed);
            return failed === 0;
        }
    };
}

module.exports = {
    getMenuPath: getMenuPath,
    createHarness: createHarness,
    loadMenuInto: loadMenuInto,
    callStartGame: callStartGame,
    callCancelSearch: callCancelSearch,
    parseMode: parseMode,
    withTimeout: withTimeout,
    createChecker: createChecker
};
