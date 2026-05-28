const express = require('express');
const router = express.Router();
const GameRoomModel = require('../model/gameroom');
const fs = require('fs');
const path = require('path');


const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({message: 'Nicht Eingeloggt.'});
};



//Hifsfunktion um zu prüfen ob der User zum Raum gehört und den Raum zu laden, ansonsten Fehler zurückgeben
async function getRoomOrFail(userId, roomId, res) {
    const room = await GameRoomModel.findRoomForUser(userId, roomId);
    if (!room) {
        res.status(404).json({message: 'Spielraum nicht gefunden oder Zugriff verweigert.'});
        return null;
    }
    return room;
}


//Laden des Gegners Profilbilds und Namens, abhängig davon ob es ein AI oder Menschlicher Gegner ist
router.get('/opponent', requireAuth, async (req, res) => {
    const {roomId} = req.query;
    const userId = req.user.User_ID;

    if (!roomId) return res.status(400).json({message: 'roomId fehlt.'});

    try{
        const room = await getRoomOrFail(userId, parseInt(roomId), res);
        if (!room) return;
        const opponent = await GameRoomModel.getOpponentProfile(room.Type, userId, room);
        if (!opponent) {
            res.status(404).json({message: 'Gegnerprofil nicht gefunden.'});
            return;
        }
        res.json({
            username: opponent.username  || opponent.Username,
            imageURL: `/api/gameroom/opponent-image/${roomId}`
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({message: 'Fehler beim Laden des Gegnerprofils.'});
    }
});


router.get('/opponent-image/:roomId', requireAuth, async (req, res) => {
    const {roomId} = req.params;
    const userId = req.user.User_ID;
    try {
        const room = await getRoomOrFail(userId, parseInt(roomId), res);
        if (!room) return;
        const opponent = await GameRoomModel.getOpponentProfile(room.Type, userId, room);
        if (!opponent || !opponent.profile_img) {
            res.status(404).json({message: 'Gegnerbild nicht gefunden.'});
            return;
        }
        if(room.Type !== 'AI') {
            const imagePath = path.join(__dirname, '../uploads', opponent.profile_img);
            if (fs.existsSync(imagePath)) {
                res.sendFile(imagePath);
            } else {
                res.status(404).json({message: 'Gegnerbild nicht gefunden.'});
            }
        } else {
            res.status(404).json({message: 'Gegnerbild nicht gefunden.'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Fehler beim Laden des Gegnerbilds.'});
    }
});

module.exports = router;