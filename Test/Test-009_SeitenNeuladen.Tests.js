// Test-009_SeitenNeuladen.Tests.js
// tests.md / Test-009: Ueberpruefen, ob die index.html Seite neu geladen wird, wenn der Benutzer
// die Seite verlaesst oder die Gegnersuche abbricht.
//
// T9 ergaenzt in menu.js:
//   - cancelSearch(): sendet DELETE /spielraum an den Server, danach window.location.href = '/index.html'
//   - beforeunload-Handler: sendet DELETE /spielraum ohne await (keepalive) beim Seitenverlassen
//
// Getestet wird mit dem menuTestHarness (vm-Sandbox mit gemockten Browser-Globals).
// Gemaess tests.md: positive UND negative Faelle + Negativ-Kontrolle.

const harness = require('./lib/menuTestHarness');
const h = require('./lib/serverTestHelpers');

// Responder: gibt immer 200 zurueck (fuer DELETE-Anfragen des cancelSearch-Tests).
function alwaysOkResponder(callNum, state, mkResp) {
    return mkResp(200, { message: 'Gegnersuche abgebrochen.' });
}

// Responder: wirft einen Fehler (simuliert Netzwerkausfall).
function networkErrorResponder() {
    throw new Error('Simulierter Netzwerkfehler');
}

(async function () {
    const checker = harness.createChecker('Test-009: index.html wird neu geladen bei Abbruch / Seitenverlassen');

    // --- POSITIV: cancelSearch ist vorhanden und sendet DELETE ---
    {
        const { sandbox, state, redirected } = harness.createHarness(alwaysOkResponder);
        harness.loadMenuInto(sandbox);

        checker.check('[positiv] cancelSearch ist in menu.js als Funktion definiert',
            typeof sandbox.cancelSearch === 'function',
            'cancelSearch ist nicht in menu.js definiert.');

        if (typeof sandbox.cancelSearch !== 'function') {
            checker.check('[positiv] (weitere Tests uebersprungen – cancelSearch fehlt)', false, '');
            h.finishProcess(checker.finish());
            return;
        }

        harness.callCancelSearch(sandbox);
        const href = await harness.withTimeout(redirected, 800,
            'cancelSearch: window.location.href wurde nicht gesetzt (Timeout).');

        const deleteCall = state.spielraumCalls.find(function (c) {
            return c.options && c.options.method === 'DELETE';
        });
        checker.check('[positiv] cancelSearch sendet DELETE an /spielraum oder /api/spielraum',
            !!deleteCall,
            'Kein DELETE-Request gefunden (Calls: ' + JSON.stringify(state.spielraumCalls) + ').');
        checker.check("[positiv] cancelSearch setzt window.location.href auf '/index.html'",
            href === '/index.html',
            "href war: '" + href + "' (erwartet '/index.html').");
    }

    // --- NEGATIV: cancelSearch sendet keine POST-Anfrage fuer den Abbruch ---
    {
        const { sandbox, state } = harness.createHarness(alwaysOkResponder);
        harness.loadMenuInto(sandbox);
        harness.callCancelSearch(sandbox);
        await new Promise(function (r) { setTimeout(r, 50); }); // kurz warten
        const postCall = state.spielraumCalls.find(function (c) {
            return !c.options || !c.options.method || c.options.method === 'POST';
        });
        checker.check('[negativ] cancelSearch sendet KEINE POST-Anfrage (DELETE ist der richtige Modus)',
            !postCall,
            'cancelSearch hat eine POST-Anfrage gesendet statt DELETE.');
    }

    // --- POSITIV: cancelSearch leitet auch bei Netzwerkfehler nach /index.html weiter ---
    {
        const { sandbox, state, redirected } = harness.createHarness(networkErrorResponder);
        harness.loadMenuInto(sandbox);
        harness.callCancelSearch(sandbox);
        let hrefOnError = null;
        try {
            hrefOnError = await harness.withTimeout(redirected, 800,
                'cancelSearch: kein Redirect trotz Netzwerkfehler.');
        } catch (e) { /* Timeout bedeutet: kein Redirect -> Test wird unten scheitern */ }
        checker.check("[positiv] cancelSearch leitet nach /index.html weiter, auch wenn der Server nicht erreichbar ist",
            hrefOnError === '/index.html',
            "href war: '" + hrefOnError + "' (erwartet '/index.html').");
    }

    // --- POSITIV: beforeunload-Handler ist registriert und sendet DELETE beim Seitenverlassen ---
    {
        const { sandbox, state, windowListeners } = harness.createHarness(alwaysOkResponder);
        harness.loadMenuInto(sandbox);

        checker.check('[positiv] beforeunload-Handler ist in window registriert',
            Array.isArray(windowListeners.beforeunload) && windowListeners.beforeunload.length > 0,
            'Kein beforeunload-Handler gefunden (window.addEventListener wurde nicht mit "beforeunload" aufgerufen).');

        if (Array.isArray(windowListeners.beforeunload) && windowListeners.beforeunload.length > 0) {
            // Handler ausfuehren (simuliert Seitenverlassen); fetch laeuft ohne await (synchroner Push).
            windowListeners.beforeunload[0]();
            // State.spielraumCalls.push laeuft synchron (vor dem ersten await in der harness-fetch-Funktion).
            const unloadDelete = state.spielraumCalls.find(function (c) {
                return c.options && c.options.method === 'DELETE';
            });
            checker.check('[positiv] beforeunload-Handler sendet DELETE an /spielraum beim Seitenverlassen',
                !!unloadDelete,
                'Der beforeunload-Handler hat keine DELETE-Anfrage gesendet (Calls: ' + JSON.stringify(state.spielraumCalls) + ').');
        }
    }

    // --- NEGATIV-KONTROLLE: Eine Implementierung, die nur weiterleitet ohne DELETE zu senden,
    //     wird als unvollstaendig erkannt. ---
    {
        const vm = require('vm');
        // Stub-Implementierung: nur Redirect, kein DELETE.
        const stubCode = 'async function cancelSearch() { window.location.href = "/index.html"; }';
        const { sandbox, state, redirected } = harness.createHarness(alwaysOkResponder);
        vm.createContext(sandbox);
        vm.runInContext(stubCode, sandbox, { filename: 'stub-cancelSearch' });
        vm.runInContext('cancelSearch();', sandbox);
        await harness.withTimeout(redirected, 400, 'stub redirect timeout').catch(function () {});
        checker.check('[Negativ-Kontrolle] "Nur-Redirect"-Implementierung wird erkannt (kein DELETE-Request)',
            state.spielraumCalls.length === 0,
            'Der Test wuerde eine Implementierung ohne DELETE-Request faelschlich akzeptieren.');
    }

    h.finishProcess(checker.finish());
})();
