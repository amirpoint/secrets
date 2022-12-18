//jshint esversion:6
require("dotenv").config()

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
const port = 3000;

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
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


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

app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/login');
    }

});

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });

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


app.listen(port, () => {
    console.log(`Server started on port ${port}...`);
});