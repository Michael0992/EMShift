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
// Gegnersuche-Router (T3-T9): bereitgestellt unter /api (Task T10).
const gameroomRouter = require('./Router/gameroom');
//const dotenv = require('dotenv').config();
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






// Gegnersuche-Routen (POST /api/spielraum, DELETE /api/spielraum) aus Router/gameroom.js (T3-T9).
app.use('/api', gameroomRouter);

app.get('/testdb', async (req, res) => {   
    const [rows] = await connection.execute('SHOW TABLES');
    res.json(rows);
});





app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})
