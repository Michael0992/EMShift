const express = require('express');
const router = express.Router();

// In-Memory-Liste offener Spiele (Platzhalter aus der bisherigen Implementierung in index.js).
// Hinweis: Wird in spaeteren Tasks (T5+) durch echte Datenbankabfragen ersetzt.
let spielraum = [];

// POST /spielraum -- startet die Gegnersuche.
// Migriert aus index.js und von GET auf POST umgestellt (Task T3). Das Ergebnis wird als JSON
// zurueckgegeben. Die Unterscheidung zwischen menschlichem und KI-Gegner (human/ai) sowie die
// eigentliche Matchmaking-Logik werden in den folgenden Tasks (T4+) ergaenzt.
router.post('/spielraum', (req, res) => {
    // Wenn kein Spielraum gefunden wird, erstelle einen neuen (Platzhalter-Logik).
    const spielraumId = Math.floor(Math.random() * 1000000);
    const userId = Math.floor(Math.random() * 1000000);
    spielraum.push({ spielraum_id: spielraumId, user_id: userId });

    res.json({
        user_id: userId,
        html: `<div class='loading_game'><span>Lade Spiel...</span></div><script>setTimeout(() => {fetch('/opponent_for/${spielraumId}')}, 2000);</script>`
    });
});

module.exports = router;
