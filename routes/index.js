var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var Comic = require('../models/comic');
var router = express.Router();
var postmark = require("postmark");
var multer = require('multer');

// Postmark config
var client = new postmark.Client("4ab236e2-b3e9-450c-bcdb-1ebed058ff7d");

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
    } else {
      sendConfEmail(req, res);
    }
    passport.authenticate('local-login')(req, res, function () {
      res.redirect('/homepage');
    });
  });
});

/* GET login page. */

// new stuff, load page
router.post('/loadimage', function(req, res) {

  Image.image(new Image({
    //name : req.body.name;
    title: req.body.title,
    image: {
      creationDate: req.body.creationDate,
      name: req.body.name,
      filename: req.body.filename
    }
  }))
});

router.get('/loadImage', function(req, res) {
  res.render('loadImage')
});

router.get('/toolbar', function(req, res) {
  res.render('toolbar')
});

router.get('/login', function (req, res) {
  res.render('login', {user: req.user});
});

//Tried to use to display error message
//passport.use('login', new LocalStrategy(
//    function(username, password, done) {
//      modeloUsuario.findOne({ username: username, password: password }, function(err, user) {
//        if (err) { return done(err); }
//        if (!user) {
//          return done(null, false, {message: 'Incorrect username.'}); //Error to show
//        }
//        return done(null, user);
//      });
//    }
//));

/* POST login form */
router.post('/login', passport.authenticate('local-login', {
      successRedirect: '/homepage',
      failureRedirect: '/login',
      //failureFlash: 'login fail'
    }


));

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
  console.log("LOGGING OUT");
  req.logout();
  res.render('index', {
    title: "Collab-a-Comic!",
    message: "You've been logged out!" });
});

// Testing postmark
function sendConfEmail(req, res) {
  var textbody;
  if (req.body.isContributor == 1) {
    console.log(req.body.isContributor);
    textbody = "Hi " + req.body.firstName + ", \nThanks for registering with us! You can now start viewing " +
    "and contributing to comics at http://collab-a-comic.herokuapp.com. \n\nCheers, \nTeam Friendship";
  } else {
    console.log(req.body.isContributor);
    textbody = "Hi " + req.body.firstName + ", \nThanks for registering with us! You can now start viewing " +
        "comics at http://collab-a-comic.herokuapp.com. \n\nCheers, \nTeam Friendship";
  }
  client.sendEmail({
    "From": "daniel.choi@alumni.ubc.ca",
    "To": req.body.email,
    "Subject": "Collab-A-Comic registration",
    "TextBody": textbody
  }, function(error, success) {
    if(error) {
      console.error("Unable to send via postmark: " + error.message);
      return;
    }
    console.info("Postmark sent email to: " + req.body.email);
  });
}

// Multer file upload
router.get('/uploadtest', function(req, res){
  res.render('uploadtest', {
    image: 'images/calvinandhobbes.jpg'
  });
});

// https://www.codementor.io/tips/9172397814/setup-file-uploading-in-an-express-js-application-using-multer-js
router.post('/uploadimg', multer({ dest: './public/uploads/'}).single('upl'), function(req,res){
  console.log(req.body); //form fields
  /* example output:
   { title: 'abc' }
   */
  console.log(req.file); //form files
  /* example output:
   { fieldname: 'upl',
   originalname: 'grumpy.png',
   encoding: '7bit',
   mimetype: 'image/png',
   destination: './uploads/',
   filename: '436ec561793aa4dc475a88e84776b1b9',
   path: 'public/uploads/436ec561793aa4dc475a88e84776b1b9',
   size: 277056 }
   */
  var comic = new Comic({
    title: req.body.title,
    originalname: req.file.originalname,
    filename: req.file.filename,
    link: 'uploads/'+req.file.filename,
    path: req.file.path
  });
  comic.save(getcomic(comic));
  function getcomic(c) {
    res.render('comic', {
      title: c.title,
      image: c.link
    });
  }
});

router.get('/comic', function(req, res){
  res.render('comic', {
  })
});


module.exports = router;
