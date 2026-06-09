const express = require('express');
const router = express.Router();
const UserModel = require('../model/user');

// Startet die Gegnersuche gegen einen menschlichen Gegner.
// Alle drei Faelle sind vollstaendig implementiert (T5-T8):
//   Fall 1: Spieler ist bereits einem Raum zugewiesen -> voll besetzt: 200 (Gegner gefunden),
//           sonst (1 Spieler): 202 (Suche laeuft)
//   Fall 2: es gibt einen offenen Raum  -> Spieler tritt bei (joinRoom)   -> 200 (Gegner gefunden)
//   Fall 3: weder noch                  -> neuer Raum erstellt (createRoom) -> 202 (Suche laeuft)
// Der Statuscode signalisiert startGame im Frontend, ob die Suche laeuft (202) oder ein Gegner
// gefunden wurde (200).
async function sucheMenschlichenGegner(req, res) {
    // Der Spieler muss angemeldet sein, um identifiziert werden zu koennen.
    const userId = req.user ? req.user.User_ID : null;
    if (!userId) {
        return res.status(401).json({ message: 'Nicht eingeloggt.' });
    }

    try {
        // Fall 1: Spieler ist bereits einem Raum zugewiesen.
        const existingRoom = await UserModel.findRoomForPlayer(userId);
        if (existingRoom) {
            if (UserModel.isRoomFull(existingRoom)) {
                // Raum voll besetzt (2 Spieler) -> Gegner gefunden; das Frontend leitet in den Spielraum weiter.
                return res.status(200).json({ message: 'Gegner gefunden.' });
            }
            // Raum noch nicht voll (1 Spieler) -> Suche laeuft.
            return res.status(202).json({ message: 'Gegnersuche läuft...' });
        }

        // Fall 2: Es gibt einen offenen Raum -> der Spieler tritt ihm bei (Task T7).
        const openRoom = await UserModel.findOpenRoom(userId);
        if (openRoom) {
            await UserModel.joinRoom(openRoom.Room_ID, userId);
            // Der Raum ist nun voll besetzt -> Gegner gefunden; das Frontend leitet in den Spielraum weiter.
            return res.status(200).json({ message: 'Gegner gefunden.' });
        }

        // Fall 3: Kein eigener und kein offener Raum -> neuen Raum erstellen (Task T8).
        // Der Spieler wird als erster Spieler (User_ID_1) eingetragen; er wartet auf einen Gegner.
        await UserModel.createRoom(userId, 'HUMAN');
        return res.status(202).json({ message: 'Gegnersuche läuft...' });
    } catch (err) {
        console.error('Fehler bei der menschlichen Gegnersuche:', err);
        return res.status(500).json({ message: 'Fehler bei der Gegnersuche.' });
    }
}

// Bricht die Gegnersuche ab (Task T9): loescht den offenen Raum des Spielers.
// Bedingungen fuer das Loeschen:
//   - der Spieler muss angemeldet sein
//   - der Spieler muss der Ersteller des Raums sein (User_ID_1)
//   - der Raum muss noch offen sein (nicht voll besetzt)
// Nach erfolgreichem Abbrechen laedt das Frontend index.html neu (Statuscode 200).
async function brecheGegnersucheAb(req, res) {
    const userId = req.user ? req.user.User_ID : null;
    if (!userId) {
        return res.status(401).json({ message: 'Nicht eingeloggt.' });
    }
    try {
        const room = await UserModel.findRoomForPlayer(userId);
        if (!room) {
            // Kein Raum vorhanden -> nichts zu loeschen.
            return res.status(404).json({ message: 'Kein offener Raum gefunden.' });
        }
        // Nur der Ersteller darf seinen eigenen offenen Raum abbrechen.
        if (room.User_ID_1 !== userId || UserModel.isRoomFull(room)) {
            return res.status(403).json({ message: 'Abbrechen nicht erlaubt.' });
        }
        await UserModel.deleteRoom(room.Room_ID, userId);
        return res.status(200).json({ message: 'Gegnersuche abgebrochen.' });
    } catch (err) {
        console.error('Fehler beim Abbrechen der Gegnersuche:', err);
        return res.status(500).json({ message: 'Fehler beim Abbrechen.' });
    }
}

// Startet die Gegnersuche gegen einen KI-Gegner.
// Noch nicht implementiert (T4): Statuscode 501 (Not Implemented) und JSON-Nachricht,
// damit das Frontend erkennt, dass die KI-Gegnersuche noch nicht verfuegbar ist.
function sucheKiGegner(req, res) {
    res.status(501).json({ message: 'ki gegnersuche noch nicht implementiert' });
}

// POST /spielraum -- startet die Gegnersuche.
// Verzweigung nach Modus (Task T4): "ai" -> KI-Gegnersuche, sonst (z.B. "human") menschlicher Gegner.
router.post('/spielraum', (req, res) => {
    const mode = req.body ? req.body.mode : undefined;

    if (mode === 'ai') {
        return sucheKiGegner(req, res);
    }
    return sucheMenschlichenGegner(req, res);
});

// DELETE /spielraum -- bricht die Gegnersuche ab (Task T9).
// Loescht den offenen Raum des Spielers, sofern er der Ersteller ist und der Raum noch nicht voll ist.
router.delete('/spielraum', (req, res) => {
    return brecheGegnersucheAb(req, res);
});

module.exports = router;
