const express = require('express');
const session = require('express-session');
const app = express();
app.listen(3000);

app.use(session({ secret: 'stocksRcool' }))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routers
const userRouter = require("./user-router");
const stocksRouter = require("./stocks-router");

app.use("/User", checkLogin, userRouter);
app.use("/Stocks", stocksRouter);

// """Database"""
const db = require('./database');

// For unique Ids
const { v4: uuidv4 } = require('uuid');

// This is a an empty user account, use it when creating a new user
const blankUser = require("./json/defaultUser.json");

// pug
app.set("view engine", "pug");
app.set("views", "./Pug");

// static servers
app.use("/Resources", express.static("Resources"));
app.use(express.static("Pages"));

// GET page requests
app.get("/", (req, res) => {
    res.render("views/Main.pug", { status: req.session });
});

app.get("/Admin", checkLogin, authenticateAdminPrivilige, (req, res) => {
    res.render("views/Admin.pug", { status: req.session });
});

// login and logout stuff
app.post("/Signup", signup);

app.post("/Login", login);

app.get("/Logout", logout);

app.get("/Signup", (req, res) => {
    // can't signup if already logged in, go to account overview
    if (req.session.loggedin) {
        res.redirect('/User/Overview');
        return;
    }
    let prompt = { text: "Please enter your account details:" }
    res.render("views/Signup.pug", { prompt });
});

app.get("/Login", (req, res) => {
    // If already logged in go to account overview
    if (req.session.loggedin) {
        res.redirect('/User/Overview');
        return;
    }
    let prompt = { text: "Please enter your username and password:" }
    res.render("views/Login.pug", { prompt });
});

function signup(req, res, next) {
    // check if the user is already logged in
    // if they are send them to to account overview
    if (req.session.loggedin) {
        res.redirect('/User/Overview');
        return;
    }

    let name = req.body.name;
    let username = req.body.username;
    let password = req.body.password;
    let confirmedPassword = req.body.confirmedPassword;

    //Check if the username is already in use
    const getUser = db.users.find((user) => user.username === username);
    if (getUser) {
        let prompt = { text: "The chosen username is already in use, please enter a different one:" }
        res.render("views/Signup.pug", { name, prompt });
    } else {
        // Validate password. Move to client?
        if (password !== confirmedPassword) {
            let prompt = { text: "The passwords don't match, please re-enter them:" }
            res.render("views/Signup.pug", { name, username, prompt });
        } else {
            // Create new user and assign it the default values
            let newUser = {};
            Object.assign(newUser, blankUser);

            // Assign the user's core properties
            newUser.userId = uuidv4();
            newUser.name = name;
            newUser.username = username;
            newUser.password = password;

            // Add to database
            db.users.push(newUser);

            // Set the session data and send them to the overview page
            req.session.loggedin = true;
            req.session.userId = newUser.userId;
            res.redirect('/User/Overview');
        }
    }
}

function login(req, res, next) {
    // check if the user is already logged in
    // if they are send them to to account overview
    if (req.session.loggedin) {
        res.redirect('/User/Overview');
        return;
    }

    let username = req.body.username;
    let password = req.body.password;

    const getUser = db.users.find((user) => user.username === username);

    if (getUser) {
        if (getUser.password === password) {
            req.session.loggedin = true;
            req.session.userId = getUser.userId;
            res.redirect('/User/Overview');
        } else {
            let prompt = { text: "Not authorized. Invalid password. Please try again:" }
            res.render("views/Login.pug", { status: req.session, prompt });
        }
    } else {
        let prompt = { text: "Not authorized. Invalid username. Please try again:" }
        res.render("views/Login.pug", { status: req.session, prompt });
        return;
    }
}

function logout(req, res, next) {
    if (req.session.loggedin) {
        req.session.loggedin = false;
        res.redirect('/');
    } else {
        res.redirect('/');
    }
}

function checkLogin(req, res, next) {
    if (req.session.loggedin) {
        next();
    } else {
        res.redirect('/Login');
    }
}

// Assumes session is logged in
function authenticateAdminPrivilige(req, res, next) {
    // For simplicity admin is predetermined with this id
    // Could be more secure
    if (req.session.userId === "123456") {
        next();
    } else {
        res.status(403).send("You don't belong here. Go Back.");
    }
}