user_id = null;

function toggleNav() {
    document.getElementById('nav-links').classList.toggle('open');
}


// Startet die Gegnersuche fuer den gewaehlten Modus ("human" oder "ai").
// Sendet eine POST-Anfrage an den Server (das Ergebnis wird als JSON erwartet) und uebermittelt
// den Modus als Parameter, damit der Server einen menschlichen oder einen KI-Gegner sucht.
//  - Status 200: Gegner gefunden -> automatische Weiterleitung in den Spielraum (/ingame).
//  - andernfalls (Fehlerstatus oder Netzwerkfehler): die Anfrage wird erneut gesendet.
async function startGame(mode) {
    try {
        const response = await fetch("/spielraum", {
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

        // Noch kein Gegner gefunden bzw. Fehler -> Anfrage erneut senden (Fehler wird geloggt).
        console.error("Gegnersuche nicht erfolgreich (Status " + response.status + "). Neuer Versuch.", data);
        setTimeout(function () { startGame(mode); }, 1500);
    } catch (error) {
        // Netzwerk- oder Verarbeitungsfehler -> Anfrage erneut senden (Fehler wird geloggt).
        console.error("Fehler bei der Gegnersuche. Neuer Versuch.", error);
        setTimeout(function () { startGame(mode); }, 1500);
    }
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