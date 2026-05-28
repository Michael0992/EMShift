const express = require('express');
const passport = require('../config/passport');
const UserModel = require('../model/user');
const router = express.Router();
const upload = require('../config/multer');
const fs = require('fs');
const path = require('path');

const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};


// Hilfsfunktion: hochgeladenes Bild löschen wenn Registrierung fehlschlägt
function deleteUploadedFile(req) {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Fehler beim Löschen der Datei:', err);
        });
    }
}

//REGISTRIERUNG
router.post('/register', upload.single('avatar'), async (req, res) => {
    const {username, password, confirm_password} = req.body;
    if(!req.file) {
        return res.status(400).json({message: 'Profilbild ist erforderlich.'});
    }
    if(!username?.trim() || !password || !confirm_password) {
        deleteUploadedFile(req);
        return res.status(400).json({message: 'Alle Felder müssen ausgefüllt werden.'});
    }
    if (password !== confirm_password) {
        deleteUploadedFile(req);
        return res.status(400).json({message: 'Passwörter stimmen nicht überein.'});
    }
    if (username.length < 3 || username.length > 20) {
        deleteUploadedFile(req);
        return res.status(400).json({message: 'Benutzername muss zwischen 3 und 20 Zeichen lang sein.'});
    }
    if (password.length < 6) {
        deleteUploadedFile(req);
        return res.status(400).json({message: 'Passwort muss mindestens 6 Zeichen lang sein.'});
    }
    if (password.length > 100) {
        deleteUploadedFile(req);
        return res.status(400).json({message: 'Passwort darf maximal 100 Zeichen lang sein.'});
    }
    if(!/^[a-zA-Z0-9_]+$/.test(username)) {
        deleteUploadedFile(req);
        return res.status(400).json({message: 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten.'});
    }
    try{
        const existingUser = await UserModel.findByUsername(username);
        if (existingUser) {
            deleteUploadedFile(req);
            return res.status(400).json({message: 'Benutzername ist bereits vergeben.'});
        }
        const user = await UserModel.createUser(username, password, req.file.filename);
        req.login({User_ID: user}, (err) => {
            if (err) {
                console.error('req.login Fehler:', err);
                return res.status(500).json({message: 'Fehler beim Einloggen nach Registrierung.'});
            }
            return res.json({message: 'Registrierung erfolgreich.', user: {username: username}});
        });
    } catch (err) {
        deleteUploadedFile(req);
        console.error(err);
        res.status(500).json({message: 'Interner Serverfehler.'});
    }
});

//LOGIN
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(400).json({message: 'Ungültiger Benutzername oder Passwort.'});
        }
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.json({message: 'Login erfolgreich.', user: {username: user.Username}});
        });
    })(req, res, next);
});


router.get('/me', requireAuth, (req, res) => {
    res.json({user: {username: req.user.Username}});
});
//UPLOAD PROFILBILD
router.post('/me/profile-picture', requireAuth, upload.single('profile_picture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({message: 'Kein Bild hochgeladen.'});
        }
        const userId = req.user.User_ID;
        const filename = req.file.filename;
        await UserModel.updateProfilePicture(userId, filename);
        res.json({message: 'Profilbild erfolgreich aktualisiert.', filename});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Fehler beim Hochladen des Profilbilds.'});
    }
});

//GET PROFILBILD
router.get('/me/profile-picture', requireAuth, async (req, res) => {
    try {
        const userId = req.user.User_ID;
        const filename = await UserModel.getProfilePicture(userId);
        if (!filename) {
            return res.status(404).json({message: 'Kein Profilbild gefunden.'});
        }
        const filePath = path.join(__dirname, '../uploads/', filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({message: 'Profilbild existiert nicht auf dem Server.'});
        }
        res.sendFile(filePath);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({message: 'Fehler beim Abrufen des Profilbilds.'});
    }
});


module.exports = router;
