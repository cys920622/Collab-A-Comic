var express = require('express');
var passport = require('passport');
var app = require('../app.ts');
var Account = require('../models/account.ts');
var Comic = require('../models/comic.ts');
var Profile = require ('../models/profile.ts');
var router = express.Router();
var postmark = require("postmark");
var multer = require('multer');
var mongoose = require('mongoose');
//var db = app.mongoose.connection;
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
    failureRedirect: '/login'
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
router.post('/newcomic', isLoggedIn, multer({ dest: './public/uploads/panels/' }).single('upl'), function (req, res) {
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
        path: req.file.path,
        subs: [{
                subscriber: req.user.username
            }]
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
router.get('/comic', isLoggedIn, function (req, res) {
    res.render('comic', {});
});
/* GET profile page. */
// https://scotch.io/tutorials/easy-node-authentication-setup-and-local
router.get('/profile', isLoggedIn, function (req, res) {
    //console.log('USER: ' +req.user);
    res.redirect('/user/' + req.user.username);
    //console.log('Current db: ' + req.mongoose.connection);
    //res.render('/profile');
});

/* GET profile page by dynamic routing */
// http://stackoverflow.com/questions/33347395/how-to-create-a-profile-url-in-nodejs-like-facebook
router.get('/user/:username', isLoggedIn, function (req, res) {
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
router.get('/comic/:comicid', isLoggedIn, function (req, res) {
    console.log("Looking for comic...");
    function checkSub(username, subs) {
        for (var i = 0; subs.length > i; i++) {
            if (subs[i].subscriber === username) {
                return true;
            }
        }
        return false;
    }
    Comic.findById(req.params.comicid, function (err, doc) {
        if (err) {
            console.log('Comic not found.');
        }
        else {
            var comic = doc;
            var viewerIsSubbed = checkSub(req.user.username, doc.subs);
            console.log(viewerIsSubbed);
            //console.log('Comic: '+doc);
            //console.log('Searching for :' + req.params.comicid);
            res.render('comic', {
                viewerName: req.user.username,
                cid: req.params.comicid,
                title: doc.title,
                panelarray: doc.imgarray,
                subscribers: doc.subs,
                isSubbed: viewerIsSubbed
            });
        }
    });
});

//router.get('/profile', function(req, res) {
//    res.render('/'/user/' + req.user.username');
//    //console.log('Current db: ' + req.mongoose.connection);
//});

/* POST new profile picture to profile */
router.post('/profile', multer({ dest: './uploads/' }).single('upl'), function (req, res) {
    //var pid = req.params.profileid;
    //var picloc = '/uploads/profile/' + req.file.filename;
    //Profile.update({ _id: pid}, { $push: { imgarray: {
    //    picloc:  imgloc
    //} } }, function (err) {
    //    if (err)
    //        console.log('Error loading profile picture!');
    //});
    //res.redirect(req.get('referer'));
    console.log(req.body);
    /* example output:
     { title: 'abc' }
     */
    console.log(req.file);

    //var profile = new Profile({
    //    originalname: req.file.originalname,
    //    filename: req.file.filename,
    //    imgarray: [{
    //        picloc: './uploads/' + req.file.filename
    //    }],
    //    path: req.file.path,
    //});
    //profile.save();

    //    getprofile(req, profile));
    //function getprofile(req, p) {
    //    console.log('Profile_id: ' + p.id);
    //
    //    res.render('profile', {
    //        image: p.link
    //    });

    //res.render('/profile');
    res.status(204).end();
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
// Add new subscriber to comic
router.post('/:comicid/subscribers/subscribe', function (req, res) {
    var cid = req.params.comicid;
    var cTitle = "";
    console.log("Trying to subscribe " + req.user.username + " to " + cid);
    Comic.findById(cid, function (err, doc) {
        if (err) {
            console.log('Comic not found.');
        }
        else {
            cTitle = doc.title;
            console.log("Subscribing " + req.user.username + " to " + cTitle);
            // moved this here to make update synchronous
            Account.update({ _id: req.user._id }, { $addToSet: { subs: {
                        subCid: cid,
                        subComicName: cTitle
                    } } }, function (err) {
                if (err)
                    console.log('Error adding subscription!');
            });
        }
    });
    Comic.update({ _id: cid }, { $addToSet: { subs: { subscriber: req.user.username
            } } }, function (err) {
        if (err)
            console.log('Error adding subscriber!');
    });
    res.redirect(req.get('referer'));
});
// Remove an existing subscriber from comic
router.post('/:comicid/subscribers/unsubscribe', function (req, res) {
    var cid = req.params.comicid;
    console.log("Trying to unsub " + req.user.username + " from " + cid);
    Comic.update({ _id: cid }, { $pull: { subs: { subscriber: req.user.username
            } } }, function (err) {
        if (err)
            console.log('Error removing subscriber!');
    });
    Account.update({ _id: req.user._id }, { $pull: { subs: { subCid: cid
            } } }, function (err) {
        if (err)
            console.log('Error removing subscription!');
    });
    res.redirect(req.get('referer'));
});
module.exports = router;
//# sourceMappingURL=index.js.map