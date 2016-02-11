var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', {
    user : req.user,
    title : "Collab-a-Comic!"});
});

/* GET registration page. */
router.get('/register', function(req, res) {
  res.render('register', { });
});

/* POST registration fields. */
router.post('/register', function(req, res) {
  Account.register(new Account({
    firstName : req.body.firstName,
    lastName : req.body.lastName,
    username : req.body.username,
    email : req.body.email,
    isContributor: req.body.isContributor
  }), req.body.password, function(err, account) {
    if (err) {
      return res.render('register', { account : account });
    }
    passport.authenticate('local-login')(req, res, function () {
      res.redirect('/login');
    });
  });
});

/* GET login page. */

// new stuff, load page
router.get('/loadImage', function(req, res) {
  res.render('loadImage')
});

router.get('/toolbar', function(req, res) {
  res.render('toolbar')
});

router.get('/login', function (req, res) {
  res.render('login', {user: req.user});
});

/* POST login form */
router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/homepage',
  failureRedirect: '/login'
}));

/* GET homepage. */
router.get('/homepage', isLoggedIn, function (req, res) {
  res.render('homepage', {user: req.user});
});

/* GET profile page. */
// https://scotch.io/tutorials/easy-node-authentication-setup-and-local
router.get('/profile', isLoggedIn, function (req, res) {
  res.render('profile', {user: req.user});
});

// Middleware for checking login state
function isLoggedIn(req, res, next) {
  console.log("Checking if logged in");
  if (req.user) {
    console.log("User is logged in");
    next();
  } else {
    console.log("User is NOT logged in");
    res.redirect('/login');
  }
}

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});



module.exports = router;
