//jshint esversion:6
require("dotenv").config()

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
const port = '3000';

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'myLittleSecret.', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


//mongoose
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });
}

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser((user, done) => {
    done(null, user);
});
  
passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  (accessToken, refreshToken, profile, cb) => {
    User.findOrCreate({ googleId: profile.id }, (err, user) => {
      return cb(err, user);
    });
  }
));


//get requests
app.get('/', (req, res) => {
    res.render('home');

});

app.get('/login', (req, res) => {
    res.render('login');
    
});

app.get('/register', (req, res) => {
    res.render('register');

});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // successful authentication, redirect to secrets
        res.redirect('/secrets');
    }
);

app.get('/secrets', async(req, res) => {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    }
    
    const usersWithSecret = await User.find({ secret: {$ne: null} })   
    res.render('secrets', {users: usersWithSecret});

});

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });

});

app.get('/submit', (req, res) => {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    }
    res.render('submit');

});


//post requests
app.post('/register', (req, res) =>{
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect('/register')
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
        }
    });

});

app.post('/login', async (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, err => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
        }
    });

});

app.post('/submit', async(req, res) => {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    }
    const userSecret = req.body.secret;
    const userId = req.user;
    const updateUser = await User.findOneAndUpdate(
        { _id: userId },
        { secret: userSecret },
        { new: true }
    );
    res.redirect('/secrets');

});


app.listen(port, () => {
    console.log(`Server started on port ${port}...`);
});