const express = require('express');
const router = express.Router();
const UserModel = require('../model/user');

// Startet die Gegnersuche gegen einen menschlichen Gegner.
// T5: Es wird NUR die Verzweigung der drei Faelle implementiert (kein Beitreten/Erstellen eines Raums,
// das folgt in T6-T8):
//   Fall 1: Spieler ist bereits einem Raum zugewiesen -> voll besetzt: 200 (Gegner gefunden),
//           sonst (1 Spieler): 202 (Suche laeuft)
//   Fall 2: es gibt einen offenen Raum zum Beitreten           -> 200 (Gegner gefunden)
//   Fall 3: weder noch -> ein neuer Raum muss erstellt werden  -> 202 (Suche laeuft)
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

        // Fall 2: Es gibt einen offenen Raum, dem der Spieler beitreten koennte.
        const openRoom = await UserModel.findOpenRoom(userId);
        if (openRoom) {
            // (Das eigentliche Beitreten folgt in T7.)
            return res.status(200).json({ message: 'Gegner gefunden.' });
        }

        // Fall 3: Kein eigener und kein offener Raum -> ein neuer Raum muss erstellt werden.
        // (Das eigentliche Erstellen folgt in T8.)
        return res.status(202).json({ message: 'Gegnersuche läuft...' });
    } catch (err) {
        console.error('Fehler bei der menschlichen Gegnersuche:', err);
        return res.status(500).json({ message: 'Fehler bei der Gegnersuche.' });
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

module.exports = router;
