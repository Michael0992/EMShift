// require('dotenv').config();
// dotenv ist hier nicht mehr notwendig, da die Umgebungsvariablen bereits in der docker-compose.prod.yml definiert sind 
// und von Docker automatisch in den Container injiziert werden.

const config = {
    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },
    port: process.env.PORT || 3306
};

module.exports = db = require('mysql2/promise').createPool(config.db);
