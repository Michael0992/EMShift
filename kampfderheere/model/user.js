const connection = require('../config/db');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config();
const passwordSalt = process.env.PASSWORD_SALT;


const UserModel = {
    async findByUsername(username) {
        const [rows] = await connection.execute('SELECT * FROM `user` WHERE Username = ?', [username]);
        return rows[0];
    },
    async createUser(username, password, avatar) {
        const hashedPassword = await bcrypt.hash(password + passwordSalt, 10);
        const [result] = await connection.execute('INSERT INTO `user` (Username, Password, profile_img) VALUES (?, ?, ?)', [username, hashedPassword, avatar]);
        return result.insertId;
    },
    async validatePassword(username, password) {
        const user = await this.findByUsername(username);
        if (!user) {
            return false;
        }
        return await bcrypt.compare(password + passwordSalt, user.Password);
    },
    async findById(id) {
        const [rows] = await connection.execute('SELECT * FROM `user` WHERE User_ID = ?', [id]);
        return rows[0];
    },
    async updateProfilePicture(userId, filename) {
        await connection.execute('UPDATE `user` SET profile_img = ? WHERE User_ID = ?', [filename, userId]);
    },
    async getProfilePicture(userId) {
        const [rows] = await connection.execute('SELECT profile_img FROM `user` WHERE User_ID = ?', [userId]);
        return rows[0]?.profile_img || null;
    },
    // Liefert den Spielraum, dem der Spieler aktuell zugewiesen ist (als Spieler 1 oder Spieler 2),
    // andernfalls null. Wird fuer die Pruefung "Spieler ist bereits in einem Raum" (T5) benoetigt.
    async findRoomForPlayer(userId) {
        const [rows] = await connection.execute(
            'SELECT * FROM playerroom WHERE User_ID_1 = ? OR User_ID_2 = ?',
            [userId, userId]
        );
        return rows[0] || null;
    },
    // Liefert einen offenen (noch nicht vollstaendigen) menschlichen Raum, dem der Spieler beitreten
    // koennte: zweiter Platz frei (User_ID_2 IS NULL), Typ HUMAN und nicht vom Spieler selbst erstellt.
    // Aeltester offener Raum zuerst (FIFO). Wird fuer die Pruefung "offener Raum vorhanden" (T5) benoetigt.
    async findOpenRoom(userId) {
        const [rows] = await connection.execute(
            "SELECT * FROM playerroom WHERE type = 'HUMAN' AND User_ID_2 IS NULL AND User_ID_1 <> ? ORDER BY Created_at ASC LIMIT 1",
            [userId]
        );
        return rows[0] || null;
    },
    // Prueft, ob ein Spielraum vollstaendig besetzt ist (beide Spielerplaetze belegt -> 2 Spieler).
    isRoomFull(room) {
        return !!(room && room.User_ID_2 !== null && room.User_ID_2 !== undefined);
    },
    // Traegt den Spieler als zweiten Spieler (User_ID_2) in einen bestehenden Raum ein (Beitreten).
    // Liefert die Anzahl der aktualisierten Zeilen zurueck. (Wird ab T7 von der Route genutzt.)
    async joinRoom(roomId, userId) {
        const [result] = await connection.execute(
            'UPDATE playerroom SET User_ID_2 = ? WHERE Room_ID = ?',
            [userId, roomId]
        );
        return result.affectedRows;
    },
    // Erstellt einen neuen Raum mit dem Spieler als erstem Spieler (User_ID_1) und liefert die neue
    // Room-ID zurueck. (Wird ab T8 von der Route genutzt.)
    async createRoom(userId, type = 'HUMAN') {
        const [result] = await connection.execute(
            'INSERT INTO playerroom (User_ID_1, type, Created_at) VALUES (?, ?, NOW())',
            [userId, type]
        );
        return result.insertId;
    }
};

module.exports = UserModel;