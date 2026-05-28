const connection = require('../config/db');

const GameRoom = {
    //Prüfung gehört der User zum Raum
    async findRoomForUser(userId, roomId) {
        const [rows] = await connection.execute(
            'SELECT * FROM playerroom WHERE Room_ID = ? AND (User_ID_1 = ? OR User_ID_2 = ?)',
            [roomId, userId, userId]
        );
        return rows[0] || null;
    },
    //Gegner Profil - Laden
    async getOpponentProfile(type, requesetingUserId, room) {
        if (type === 'AI') {
            const response = await fetch("https://randomuser.me/api/");
            const data = await response.json();
            const image = data.results[0].picture.large;
            const name = data.results[0].login.username;
            return {
                name: name,
                image: image            
            };
        }
        const oppenentUserId = room.User_ID_1 === requesetingUserId 
            ? room.User_ID_2 
            : room.User_ID_1;
        const [rows] = await connection.execute(
            'SELECT Username, profile_img FROM `user` WHERE User_ID = ?',
            [oppenentUserId]
        );
        return rows[0] || null;
    }
};

module.exports = GameRoom;