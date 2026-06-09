user_id = null;

function toggleNav() {
    document.getElementById('nav-links').classList.toggle('open');
}


// Setzt den Anzeigetext im Statusnachrichten-Element (#search_status) und blendet es ein (T11).
// Zeigt dem Benutzer den aktuellen Stand der Gegnersuche.
function zeigeStatusNachricht(text) {
    var el = document.getElementById('search_status');
    if (el) {
        el.textContent = text;
        el.style.display = '';
    }
}

// Wechselt die UI in den "Suche laeuft"-Zustand (T11):
//   - Statusnachricht "Gegnersuche laeuft..." einblenden.
//   - Abbrechen-Button (#cancel_search_btn) sichtbar machen.
//   - Start-Buttons (#start_human_btn, #start_ai_btn) ausblenden.
function zeigeGegnersuche() {
    zeigeStatusNachricht('Gegnersuche läuft...');
    var cancelBtn = document.getElementById('cancel_search_btn');
    if (cancelBtn) cancelBtn.style.display = '';
    var humanBtn = document.getElementById('start_human_btn');
    if (humanBtn) humanBtn.style.display = 'none';
    var aiBtn = document.getElementById('start_ai_btn');
    if (aiBtn) aiBtn.style.display = 'none';
}

// Startet die Gegnersuche fuer den gewaehlten Modus ("human" oder "ai").
// Sendet eine POST-Anfrage an den Server (das Ergebnis wird als JSON erwartet) und uebermittelt
// den Modus als Parameter, damit der Server einen menschlichen oder einen KI-Gegner sucht.
// Reagiert auf Statuscodes gemaess T11:
//  - Status 200: Gegner gefunden -> automatische Weiterleitung in den Spielraum (/ingame).
//  - Status 202: Suche laeuft -> UI-Zustand "Gegnersuche laeuft..." beibehalten, nach kurzer Pause erneut anfragen.
//  - Anderer Status / Netzwerkfehler: Fehler loggen, nach kurzer Pause erneut anfragen.
async function startGame(mode) {
    // UI-Zustand "Suche laeuft" setzen (T11): Nachricht anzeigen, Buttons umschalten.
    // Laeuft synchron (vor dem ersten await), damit die Anzeige sofort nach dem Klick erscheint.
    zeigeGegnersuche();

    try {
        const response = await fetch("/api/spielraum", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: mode })
        });

        // Das Ergebnis der Gegnersuche wird im JSON-Format erwartet.
        const data = await response.json();

        if (response.status === 200) {
            // Gegner gefunden -> automatische Weiterleitung in den Spielraum.
            window.location.href = "/ingame";
            return;
        }

        if (response.status === 202) {
            // Suche laeuft weiter -> nach kurzer Pause erneut anfragen.
            setTimeout(function () { startGame(mode); }, 1500);
            return;
        }

        // Unerwarteter Status -> Fehler loggen und nach kurzer Pause erneut versuchen.
        console.error("Gegnersuche nicht erfolgreich (Status " + response.status + "). Neuer Versuch.", data);
        setTimeout(function () { startGame(mode); }, 1500);
    } catch (error) {
        // Netzwerk- oder Verarbeitungsfehler -> Fehler loggen und erneut versuchen.
        console.error("Fehler bei der Gegnersuche. Neuer Versuch.", error);
        setTimeout(function () { startGame(mode); }, 1500);
    }
}

// Bricht die Gegnersuche ab: sendet DELETE /spielraum an den Server, um den offenen Raum des
// Spielers zu loeschen, und laedt anschliessend index.html neu.
// Wird aufgerufen wenn der Benutzer auf "Suche abbrechen" klickt.
// Eine Weiterleitung zu index.html erfolgt unabhaengig vom Serverergebnis (Fehler werden geloggt).
async function cancelSearch() {
    try {
        await fetch("/api/spielraum", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Fehler beim Abbrechen der Gegnersuche.", error);
    }
    window.location.href = "/index.html";
}

// Wenn der Benutzer die Seite verlaesst, wird der offene Raum auf dem Server geloescht (T9).
// fetch mit keepalive: true ermoeglicht den Request auch beim Entladen der Seite.
// Die Pruefung auf window.addEventListener stellt Kompatibilitaet mit der Test-Sandbox sicher.
if (typeof window.addEventListener === "function") {
    window.addEventListener("beforeunload", function () {
        fetch("/api/spielraum", { method: "DELETE", keepalive: true });
    });
}

function showScoreboard() {
    window.location.href = `./scoreboard`;
}

function nav_to_menu(){
    window.location.href = `./`;
}


function getUsername() {
    return fetch('/api/me')
        .then(response => response.json())
        .then(data => data.user.username)
        .catch(error => {
            console.error('Fehler beim Abrufen des Benutzernamens:', error);
            return null;
        });     
}

getUsername().then(username => {
    if (username) {
        document.getElementById('username_display').textContent = username;
    }
});