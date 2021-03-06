var express = require('express');
var passport = require('passport');
var app = require('../app.ts');
var Account = require('../models/account.ts');
var Comic = require('../models/comic.ts');
var router = express.Router();
var postmark = require("postmark");
var multer = require('multer');
var mongoose = require('mongoose');
// Postmark config
var client = new postmark.Client("4ab236e2-b3e9-450c-bcdb-1ebed058ff7d");
/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {
        user: req.user,
        title: "Collab-a-Comic!" });
});
/* GET registration page. */
router.get('/register', function (req, res) {
    res.render('register', {});
});
/* POST registration fields. */
router.post('/register', function (req, res) {
    Account.register(new Account({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        email: req.body.email,
        isContributor: req.body.isContributor
    }), req.body.password, function (err, account) {
        if (err) {
            return res.render('register', { account: account });
        }
        else {
            sendConfEmail(req, res);
        }
        passport.authenticate('local-login')(req, res, function () {
            res.redirect('/homepage');
        });
    });
});
//router.post('/loadimage', function(req, res) {
//
//  Image.image(new Image({
//    //name : req.body.name;
//    title: req.body.title,
//    image: {
//      creationDate: req.body.creationDate,
//      name: req.body.name,
//      filename: req.body.filename
//    }
//  }))
//});
//
///* GET login page. */
//router.get('/loadImage', function(req, res) {
//  res.render('loadImage')
//});
/* GET toolbar. */
// TODO: do we need this?
router.get('/toolbar', function (req, res) {
    res.render('toolbar');
});
/* GET login page. */
router.get('/login', function (req, res) {
    res.render('login', { user: req.user });
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
}));
/* GET homepage. */
router.get('/homepage', isLoggedIn, function (req, res) {
    res.render('homepage', { user: req.user });
});
// Middleware for checking login state
function isLoggedIn(req, res, next) {
    if (req.user) {
        console.log("User is logged in");
        next();
    }
    else {
        console.log("User is NOT logged in");
        res.redirect('/login');
    }
}
/* Middleware for checking login and contributor status.
 Behavior: if false, do nothing.
 */
function isContributor(req, res, next) {
    if (req.user.isContributor == true) {
        console.log("User is contributor");
        next();
    }
    else {
        console.log("User is NOT contributor");
        res.redirect('/#');
    }
}
router.get('/logout', function (req, res) {
    console.log("LOGGING OUT");
    req.logout();
    res.render('index', {
        title: "Collab-a-Comic!",
        message: "You've been logged out!" });
});
// Middleware to send confirmation email
function sendConfEmail(req, res) {
    var textbody;
    if (req.body.isContributor == 1) {
        console.log(req.body.isContributor);
        textbody = "Hi " + req.body.firstName + ", \nThanks for registering with us! You can now start viewing " +
            "and contributing to comics at http://collab-a-comic.herokuapp.com. \n\nCheers, \nTeam Friendship";
    }
    else {
        console.log(req.body.isContributor);
        textbody = "Hi " + req.body.firstName + ", \nThanks for registering with us! You can now start viewing " +
            "comics at http://collab-a-comic.herokuapp.com. \n\nCheers, \nTeam Friendship";
    }
    client.sendEmail({
        "From": "daniel.choi@alumni.ubc.ca",
        "To": req.body.email,
        "Subject": "Collab-A-Comic registration",
        "TextBody": textbody
    }, function (error, success) {
        if (error) {
            console.error("Unable to send via postmark: " + error.message);
            return;
        }
        console.info("Postmark sent email to: " + req.body.email);
    });
}
// Multer file upload
/* GET new comic page */
router.get('/uploadtest', isContributor, function (req, res) {
    res.render('uploadtest', {
        image: 'images/calvinandhobbes.jpg'
    });
    console.log('Current db: ' + req.mongoose.connection);
});
/* POST new comic */
// https://www.codementor.io/tips/9172397814/setup-file-uploading-in-an-express-js-application-using-multer-js
router.post('/newcomic', multer({ dest: './public/uploads/panels/' }).single('upl'), function (req, res) {
    //console.log(req.body); //form fields
    /* example output:
     { title: 'abc' }
     */
    //console.log(req.file); //form files
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
    var c = new Comic({
        title: req.body.title,
        originalname: req.file.originalname,
        filename: req.file.filename,
        imgarray: [{
                author: req.user.username,
                panelloc: '/uploads/panels/' + req.file.filename
            }],
        path: req.file.path
    });
    c.save();
    Account.update({ _id: req.user._id }, { $push: { contributions: {
                cid: c.id,
                title: c.title,
                link: c.link
            } } }, function (err) {
        if (err)
            console.log("Error pushing comic to contributions!");
    });
    res.redirect('/comic/' + c.id);
});
router.get('/comic', function (req, res) {
    res.render('comic', {});
});
/* GET profile page. */
// https://scotch.io/tutorials/easy-node-authentication-setup-and-local
router.get('/profile', function (req, res) {
    //console.log('USER: ' +req.user);
    res.redirect('/user/' + req.user.username);
});
/* GET profile page by dynamic routing */
// http://stackoverflow.com/questions/33347395/how-to-create-a-profile-url-in-nodejs-like-facebook
router.get('/user/:username', function (req, res) {
    Account.findOne({ username: req.params.username }, function (err, doc) {
        if (err) {
            console.log('User not found.');
        }
        else {
            var account = doc;
            console.log(doc);
            res.render('profile', {
                user: doc,
                comics: doc.contributions
            });
        }
    });
});
router.get('/comic/:comicid', function (req, res) {
    console.log("Looking for comic...");
    Comic.findById(req.params.comicid, function (err, doc) {
        if (err) {
            console.log('Comic not found.');
        }
        else {
            var comic = doc;
            //console.log('Comic: '+doc);
            //console.log('Searching for :' + req.params.comicid);
            res.render('comic', {
                cid: req.params.comicid,
                title: doc.title,
                panelarray: doc.imgarray
            });
        }
    });
});
/* POST new panel to comic */
router.post('/newpanel/:comicid', multer({ dest: './public/uploads/panels/' }).single('upl'), function (req, res) {
    var cid = req.params.comicid;
    //console.log("CID: "+cid);
    var imgloc = '/uploads/panels/' + req.file.filename;
    //console.log("imgloc: " + imgloc);
    Comic.update({ _id: cid }, { $push: { imgarray: {
                author: req.user.username,
                panelloc: imgloc
            } } }, function (err) {
        if (err)
            console.log('Error adding panel!');
    });
    // TODO: check if comic is in contributor's list of contributions and add if false.
    //Account.find({username: req.user.username}).where(cid).in(req.user.contributions).
    //    exec(function(err) {
    //      if (err) {
    //        console.log('This cid is not yet in array');
    //      } else {
    //        console.log("CID already in array");
    //      }
    //    });
    res.redirect(req.get('referer'));
});



module.exports = router;
