//jshint esversion:6
require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();
const port = 3000;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));


//mongoose
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });
}

const userSchema = new mongoose.Schema({
    email: String,
    pw: String
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['pw'] });

const User = new mongoose.model('User', userSchema);


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


//post requests
app.post('/register', (req, res) =>{
    const newUser = new User({
        email: req.body.username,
        pw: req.body.password
    });
    newUser.save((err) => {
        if (!err) {
            console.log('New user added.');
            res.render('secrets');
        }
    });

});

app.post('/login', async (req, res) => {
    const email = req.body.username;
    const pw = req.body.password;

    const userMatches = await User.find({email: email});
    if (userMatches) {
        if (userMatches[0].pw=== pw) res.render('secrets');
        res.send('Password is incorrect..!');

    } else {
        res.send('User not found..!');
    }

});


app.listen(port, () => {
    console.log(`Server started on port ${port}...`);
});