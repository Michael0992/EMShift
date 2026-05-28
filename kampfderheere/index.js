//------------------- ZUGANGSDATEN FÜR DIE DATENBANK -------------------
const connection = require('./config/db');
//----------------------------------------------------------------------

const express = require('express')
const path = require('path')
const mysql = require('mysql2/promise');
const session = require('express-session');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
const gameroomRoutes = require('./routes/gameroom');
const dotenv = require('dotenv').config();
const app = express()
const port = 3001
app.use(express.static(path.join(__dirname, 'public'), {extensions: ['html']}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 2, // 2 Stunden
        httpOnly: true
    }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/gameroom', gameroomRoutes);
app.use('/api', authRoutes);






spielraum = []

app.get('/spielraum', (req, res) => {

  // Wenn kein Spielraum gefunden wird, erstelle einen neuen
    const spielraum_id = Math.floor(Math.random() * 1000000);
    const user_id = Math.floor(Math.random() * 1000000);
    const spiel = {
        spielraum_id: spielraum_id,
        user_id: user_id
    }
    spielraum.push(spiel);
    res.json({
       user_id: user_id,
       html: `<div class='loading_game'><span>Lade Spiel...</span></div><script>setTimeout(() => {fetch('/opponent_for/${spielraum_id}')}, 2000);</script>`
    });
});

app.get('/testdb', async (req, res) => {   
    const [rows] = await connection.execute('SHOW TABLES');
    res.json(rows);
});





app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})
