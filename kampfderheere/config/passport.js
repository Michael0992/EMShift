const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const UserModel = require('../model/user');

passport.serializeUser((user, done) => {
    // console.log('serializeUser aufgerufen mit:', user);
    done(null, user.User_ID);
});


passport.use(new LocalStrategy(
    {usernameField: 'username', passwordField: 'password'},
    async (username, password, done) => {
        try {
            const user = await UserModel.findByUsername(username);
            if (!user) {
                return done(null, false, {message: 'Incorrect username.'});
            }
            const ok = await UserModel.validatePassword(username, password);
            if (!ok) {
                return done(null, false, {message: 'Incorrect password.'});
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

passport.deserializeUser(async (id, done) => {
    try {
        const user = await UserModel.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

module.exports = passport;
