var express = require('express');
var passport = require('passport');
var app = require('../app.ts');
var Account = require('../models/account.ts');
var Comic = require('../models/comic.ts');
var router = express.Router();
var postmark = require("postmark");
var multer = require('multer');
var mongoose = require('mongoose');
var Profile = require('../models/profile.ts');
var async = require('async');
var crypto = require('crypto');



var Comment = require('../models/comment.ts');
//var db = app.mongoose.connection;

// Postmark config
var client = new postmark.Client("4ab236e2-b3e9-450c-bcdb-1ebed058ff7d");

/* GET home page. */
router.get('/', function (req, res) {
  if (req.user) {
    res.redirect('/homepage');
  }
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
    isContributor: req.body.isContributor,
    description : req.body.description
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

///* GET toolbar. */
//// TODO: do we need this?
//router.get('/toolbar', function(req, res) {
//  res.render('toolbar')
//});


/* GET login page. */
router.get('/login', function (req, res) {
  res.render('login', {user: req.user});
});

/* POST login form */
router.post('/login', passport.authenticate('local-login', {
      successRedirect: '/homepage',
      failureRedirect: '/login',
      //failureFlash: 'login fail'
    }
));

// http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/
// GET forgot password page
router.get('/forgot', function(req, res) {
  res.render('forgot', {
    user: req.user
  });
});


// POST forgot password
router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      Account.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      client.sendEmail({
        "From": "daniel.choi@alumni.ubc.ca",
        "To": user.email,
        "Subject": "Collab-A-Comic password reset",
        "TextBody": 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        'http://' + req.headers.host + '/reset/' + token + '\n\n' +
        'If you did not request this, please ignore this email and your password will remain unchanged. \n\nCheers, \nTeam Friendship"'
      }, function(error, success) {
        if(error) {
          console.error("Unable to send via postmark: " + error.message);
          return;
        }
        res.render('index', {
          title: "Collab-a-Comic!",
          message: "A password reset link has been sent to "+user.email
        });
        console.info("Postmark sent email to: " + req.body.email);
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});


/* GET homepage. */
router.get('/homepage', isLoggedIn, function (req, res) {
  res.render('homepage', {user: req.user});
});

// Middleware for checking login state
function isLoggedIn(req, res, next) {
  if (req.user) {
    console.log("User is logged in");
    next();
  } else {
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
  } else {
    console.log("User is NOT contributor");
    res.redirect('/#');
  }
}

// GET logout
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
    textbody = "Hi " + req.body.firstName + ", \nThanks for registering with us! You can now start viewing " +
        "and contributing to comics at http://collab-a-comic.herokuapp.com. \n\nCheers, \nTeam Friendship";
  } else {
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

// GET password reset
router.get('/reset/:token', function(req, res) {
  Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      res.render('index', {
        title: "Collab-a-Comic!",
        message: 'Password reset token is invalid or has expired.'
      });
    }
    console.log('Loading reset for user: ' + user.username);
    res.render('reset', {
      user: req.user
    });
  });
});


// POST password reset
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        console.log('Resetting for user: ' + user.username);
        if (!user) {
          console.log('Error resetting password - invalid or expired token');
          return res.redirect('back');
        }

        user.hash = req.body.password;

        var iterations = 25000;
        var keylen = 512;
        var saltlen = 32;

        crypto.randomBytes(saltlen, function (err, salt) {
          if (err) { throw err; }
          salt = new Buffer(salt).toString('hex');
          user.salt = salt;

          // https://masteringmean.com/lessons/46-Encryption-and-password-hashing-with-Nodejs
          crypto.pbkdf2(req.body.password, salt, iterations, keylen, 'sha256',
              function (err, hash) {
                if (err) { throw err; }
                user.hash = new Buffer(hash).toString('hex');
                console.log("SALT: " + user.salt);
                console.log("HASH: "+user.hash);
                user.save(function(err) {
                  req.logIn(user, function(err) {
                    done(err, user);
                  });
                });
              });
        });

        console.log("NEW hash: " + user.hash);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

      });
    },
    function(user, done) {
      client.sendEmail({
        "From": "daniel.choi@alumni.ubc.ca",
        "To": user.email,
        "Subject": "Your Collab-A-Comic password was reset",
        "TextBody": 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.' +
        ' \n\nCheers, \nTeam Friendship"'
      }, function(error, success) {
        if(error) {
          console.error("Unable to send via postmark: " + error.message);
          return;
        }
        res.render('index', {
          title: "Collab-a-Comic!",
          message: 'Your password was reset.'
        });
        console.info("Postmark sent email to: " + user.email);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

// Multer file upload
/* GET new comic page */
router.get('/uploadtest', isLoggedIn, isContributor, function(req, res){
  res.render('uploadtest', {
    user: req.user,
    image: 'images/calvinandhobbes.jpg'
  });
  console.log('Current db: '+req.mongoose.connection);
});

/* POST new comic */
// https://www.codementor.io/tips/9172397814/setup-file-uploading-in-an-express-js-application-using-multer-js
router.post('/newcomic', isLoggedIn, multer({ dest: './public/uploads/panels/'}).single('upl'), function(req,res){
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
      panelloc: '/uploads/panels/'+req.file.filename
    }],
    path: req.file.path,
    subs: [{
      subscriber: req.user.username,
      subscriberEmail: req.user.email
    }]

    //commentarray: [{
    //  commenter: req.user.username,
    //  newComment: req.body.newComment
    //}]
  });

  c.save();

  Account.update({_id: req.user._id}, {$push: { contributions: {
    cid: c.id,
    title: c.title,
    link: c.link
  }}}, function (err) {
    if (err) console.log("Error pushing comic to contributions!");
  });

  Account.findOne({username: req.user.username}, function(err, doc) {
    if (err) {
      console.log('User not found.');
    } else {
      var account = doc;
      //console.log(doc);
      for (var i = 0; i < doc.followers.length; i++) {
        sendSubscriptionEmail(doc.followers[i].followerEmail, doc.followers[i].followerUserName,
            req.user.username, c.title, c.id, "newComic");
        createNotification(doc.followers[i].followerUserName, req.user.username, c.title, c.id, "newComic");
      }
    }
  });

  res.redirect('/comic/' + c.id);

});

router.get('/comic', isLoggedIn, function(req, res){
  res.render('comic', {
  })
});

/* GET profile page. */
// https://scotch.io/tutorials/easy-node-authentication-setup-and-local
router.get('/profile', isLoggedIn, function (req, res) {
  res.redirect('/user/'+req.user.username);
});

/* GET profile page by dynamic routing */
// http://stackoverflow.com/questions/33347395/how-to-create-a-profile-url-in-nodejs-like-facebook
router.get('/user/:username', isLoggedIn, function (req, res) {
  function checkSub(profileUsername, viewerSubs) {
    for (var i = 0; viewerSubs.length > i; i++) {
      if (viewerSubs[i].followedUserName === profileUsername) {
        return true;
      }
    }
    return false;
  }

  var viewerIsSubbed = checkSub(req.params.username, req.user.following);

  Account.findOne({username: req.params.username}, function(err, doc) {
        if (err) {
          console.log('User not found.');
        } else {
          //var account = doc;
          //console.log(doc);
          res.render('profile', {
            isSubbed: viewerIsSubbed,
            viewed: doc,
            comics: doc.contributions,
            user: req.user,
            profilephoto: doc.profilephotopath,
          });
        }
      }
  )});

router.get('/newcomment/:comicid', isLoggedIn, function(req, res) {
  console.log("FOUND COMMENTS");
  Comment.find({}, function ( err, comments, count ){
    console.log(comments);
    res.render( '/comic/:comicid', {
      title : 'Comment for Comic',
      comment : comments
    });
    console.log('found comment');
    //res.render('/newcomment/:comicid/:username', {
    //  user: req.user,
    //  title: 'Comment for comic',
    //  comments: comments
    //})
  });
});


router.post('/newcomment/:comicid', isLoggedIn, function(req, res) {
  console.log("entered comments");
  console.log("comment comicid: " + req.params.comicid);
  new Comment({
    commenter : req.body.commenter,
    content : req.body.comment,
    created : Date.now(),
    comicid : req.params.comicid
  }).save( function( err, comment, count ){
    res.redirect( req.get('referer') );
  });
});


// GET profile editing page
router.get('/user/:username/edit', isLoggedIn, function (req, res) {
  // Redirect user if requesting to change another person's profile
  if (req.user.username != req.params.username) {
    res.redirect('/');
  }
  res.render('editprofile', {
    user: req.user
  })
});

// POST profile edits
router.post('/user/:username/edit', isLoggedIn, function (req, res) {
  var newFirstName = req.user.firstName;
  var newLastName = req.user.lastName;
  var newEmail = req.user.email;
  var newDescrip = req.user.description;
  // Take on new values if form was filled
  if (req.body.firstName) {
    newFirstName = req.body.firstName;
  }
  if (req.body.lastName) {
    newLastName = req.body.lastName;
  }
  if (req.body.email) {
    newEmail = req.body.email;
  }
  if (req.body.description) {
    newDescrip = req.body.description;
  }
  Account.update(
      {_id: req.user._id},

      {$set:
      {
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        description: newDescrip
      }},
      function(err) {
        if (err) console.log("Error editing profile!");
        res.redirect('/user/'+req.user.username);
      }
  )
});


/* POST new profile picture to profile */
router.post('/profile', isLoggedIn, multer({ dest: './public/uploads/profilepictures/' }).single('upl'), function (req, res) {

  //var p = new Profile({
  //  originalname: req.file.originalname,
  //  filename: req.file.filename,
  //  picloc: './uploads/'+req.file.filename,
  //  path: req.file.path,
  //});

  //p.save();

  //Account.update({_id: req.user._id}, {$set:
  //{ profileid: p.id
  //}}, function (err) {
  //  if (err) console.log("Error adding profile photo!");
  //});

  Account.update(
      {_id: req.user._id},
      {$set:
      {
        profilephotopath: '/uploads/profilepictures/'+req.file.filename
      }},
      function(err) {
        if (err) console.log("Error adding profile picture!");
        console.log('PP path: /uploads/profilepictures/'+req.file.filename);
        res.redirect('/user/'+req.user.username);
      }
  )
});

// GET comic page
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
    console.log("req.params.comicid: " + req.params.comicid);
    Comment.find({
      'comicid':req.params.comicid
    }, function (err, comments, count) {
      console.log(comments);
      //res.render('/comic/:comicid', {
      //  title: 'Comment for Comic',
      //});
      console.log('found comment');

      console.log("I have passed the comments and now looking for comic");
      if (err) {
        console.log('Comic not found.');
      } else {
        var comic = doc;
        var viewerIsSubbed = checkSub(req.user.username, doc.subs);
        console.log("Is viewer subbed: " + viewerIsSubbed);
        //console.log('Comic: '+doc);
        //console.log('Searching for :' + req.params.comicid);
        res.render('comic', {
          user: req.user,
          viewerName: req.user.username,
          cid: req.params.comicid,
          title: doc.title,
          panelarray: doc.imgarray,
          subscribers: doc.subs,
          isSubbed: viewerIsSubbed,
          comments: comments
        });
      }
    });
  });
});

// Function to send notification emails
function sendSubscriptionEmail(recipEmail, recipUsername, actorUsername, comic, cid, notificationType) {
  var textbody;
  var subject;
  if (notificationType === "newPanel") {
    textbody = "Hi "+recipUsername+", \n"+actorUsername+" contributed a new panel to "+comic+"!\n" +
        "You can check it out here: https://collab-a-comic.herokuapp.com/comic/"+cid+
        "\n\nCheers, \nTeam Friendship";
    subject = "Collab-A-Comic: "+actorUsername+" contributed a new panel to "+comic+"!";
  }
  if (notificationType === "newComment") {
    textbody = "Hi "+recipUsername+", \n"+actorUsername+" posted a new comment on "+comic+"!\n" +
        "You can check it out here: https://collab-a-comic.herokuapp.com/comic/"+cid+
        "\n\nCheers, \nTeam Friendship";
    subject = "Collab-A-Comic: "+actorUsername+" posted a new comment on "+comic+"!";
  }
  if (notificationType === "newComic") {
    textbody = "Hi "+recipUsername+", \n"+actorUsername+" made a new comic called "+comic+"!\n" +
        "You can check it out here: https://collab-a-comic.herokuapp.com/comic/"+cid+
        "\n\nCheers, \nTeam Friendship";
    subject = "Collab-A-Comic: "+actorUsername+" started a new comic!";
  }
  client.sendEmail({
    "From": "daniel.choi@alumni.ubc.ca",
    "To": recipEmail,
    "Subject": subject,
    "TextBody": textbody
  }, function(error, success) {
    if(error) {
      console.error("Unable to send via postmark: " + error.message);
      return;
    }
    console.info("POSTMARK: recipEmail: "+recipEmail+", recipName: "+recipUsername+", actorUsername: "+
        actorUsername+", comic: "+comic+", cid: "+cid+", notificationType: "+notificationType);
  });
}

// Function to create homepage notification
function createNotification(recipUsername, actorUsername, comic, cid, notificationType) {
  var textBody;
  if (actorUsername == recipUsername) {
    return;
  }
  if (notificationType === "newPanel") {
    textBody = actorUsername+" contributed a new panel to "+comic
  }
  if (notificationType === "newComment") {
    textBody = actorUsername+" posted a new comment on "+comic
  }
  if (notificationType === "newComic") {
    textBody = actorUsername+" made a new comic called "+comic
  }
  Account.update(
      {username: recipUsername},
      {$push: { notifications: {
        notificationText: textBody,
        actor: actorUsername,
        comicName: comic,
        notiCid: cid
      }}},
      function (err) {
        if (err) console.log("Error adding follower!");
      });
}

/* POST new panel to comic */
router.post('/newpanel/:comicid', multer({ dest: './public/uploads/panels/'}).single('upl'), function(req,res) {
  var cid = req.params.comicid;
  //console.log("CID: "+cid);

  var imgloc = '/uploads/panels/' + req.file.filename;
  Comic.update({_id: cid}, {
    $push: {
      imgarray: {
        author: req.user.username,
        panelloc: imgloc
      }
    }
  }, function (err) {
    if (err) console.log('Error adding panel!');
  });

  function checkContributor(contribs, comicId) {
    for (var i = 0; contribs.length > i; i++) {
      if (contribs[i].cid === comicId) {
        return true;
      }
    }
    return false;
  }

  Comic.findById(cid, function (err, doc) {
    if (err) {
      console.log('Comic not found.');
    } else {
      // Add comic to contributor's contributions
      if (!checkContributor(req.user.contributions, cid)) {
        Account.update({_id: req.user._id}, {
          $push: {
            contributions: {
              cid: doc.id,
              title: doc.title,
              link: doc.link
            }
          }
        }, function (err) {
          if (err) console.log("Error pushing comic to contributions!");
        });
      }
      // Send notifications to subscribers
      for (var i = 0; i < doc.subs.length; i++) {
        sendSubscriptionEmail(doc.subs[i].subscriberEmail, doc.subs[i].subscriber,
            req.user.username, doc.title, doc.id, "newPanel");
        createNotification(doc.subs[i].subscriber, req.user.username, doc.title, doc.id, "newPanel");
      }
    }
    res.redirect(req.get('referer'));
  });
});


// Add new subscriber to comic
router.post('/comic/:comicid/subscribers/subscribe',function(req,res){
  var cid = req.params.comicid;
  var cTitle = "";
  console.log("Trying to subscribe "+ req.user.username + " to "+ cid);

  Comic.findById(cid, function(err, doc) {
    if (err) {
      console.log('Comic not found.');
    } else {
      cTitle = doc.title;
      console.log("Subscribing "+req.user.username+" to "+cTitle);
      // moved this here to make update synchronous
      Account.update({_id: req.user._id}, {$addToSet:
      { subs: {
        subCid: cid,
        subComicName: cTitle
      }}}, function (err) {
        if (err) console.log('Error adding subscription!');
      });
    }});

  Comic.update({_id: cid}, {$addToSet:
  { subs: {
    subscriber: req.user.username,
    subscriberEmail: req.user.email
  }}}, function (err) {
    if (err) console.log('Error adding subscriber!');
  });

  res.redirect(req.get('referer'));
});

// Remove an existing subscriber from comic
router.post('/comic/:comicid/subscribers/unsubscribe',function(req,res){
  var cid = req.params.comicid;
  console.log("Trying to unsub "+ req.user.username + " from "+ cid);
  Comic.update({_id: cid}, {$pull:
  { subs: { subscriber: req.user.username
  }}}, function (err) {
    if (err) console.log('Error removing subscriber!');
  });
  Account.update({_id: req.user._id}, {$pull:
  { subs: { subCid: cid
  }}}, function (err) {
    if (err) console.log('Error removing subscription!');
  });
  res.redirect(req.get('referer'));
});

// POST new subscriber to user
router.post('/user/:profileUsername/subscribers/subscribe', isLoggedIn, function(req, res){
  var subscriberUsername = req.user.username;
  var subscriberEmail = req.user.email;
  var profileUsername = req.params.profileUsername;
  console.log(subscriberUsername);
  console.log(profileUsername);

  Account.update(
      {_id: req.user._id},
      {$push: { following: { followedUserName: profileUsername}}},
      function (err) {
        console.log("FOLLOWING: "+req.user.following);
        if (err) console.log("Error adding following!");
      });

  Account.update(
      {username: profileUsername},
      {$push: { followers: {
        followerUserName: subscriberUsername,
        followerEmail: subscriberEmail
      }}},
      function (err) {
        if (err) console.log("Error adding follower!");
      });

  res.redirect(req.get('referer'));
});

// DELETE existing subscriber from user
router.post('/user/:profileUsername/subscribers/unsubscribe', isLoggedIn, function(req, res){
  var subscriberUsername = req.user.username;
  var profileUsername = req.params.profileUsername;

  Account.update(
      {_id: req.user._id},
      {$pull: { following: { followedUserName: profileUsername}}},
      function (err) {
        console.log("FOLLOWING: "+req.user.following);
        if (err) console.log("Error removing following!");
      });

  Account.update(
      {username: profileUsername},
      {$pull: { followers: { followerUserName: subscriberUsername }}},
      function (err) {
        if (err) console.log("Error removing follower!");
      });

  res.redirect(req.get('referer'));
});


// GET search results
router.get('/search', isLoggedIn, function (req, res) {
  console.log('searching...');
  var qq = req.query.search;
  //var PopSchema = new mongoose.Schema({
  //  comics: [Comic],
  //  profiles: [Profile]
  //});
  var json = {
    comics: [Comic],
    accounts: [Account]
  };

  //var pop = mongoose.model('pop', PopSchema);

  var allcomics = Comic.find({}, function(err, docs) {
    if (err) {
      console.log('oops1')
    } else {
      console.log(docs);
    }
  });
  var allaccts = Account.find({}, function(err2, docs) {
    if (err2) {
      console.log('oops2')
    } else {
      console.log(docs);
    }
  });

  allcomics.find({title: {$regex: [qq], $options: 'i'}}, (function(err, docs) {
    if (err) {
      console.log('no results.');
    }
    else {
      json.comics = [];
      console.log(docs);
      //pop.comics = docs;
      //console.log(pop.comics);
      json.comics = docs;

      allaccts.find({username: {$regex: [qq], $options: 'i'}}, function(err, docs2) {
        if (err) {
          console.log('no profs');
        } else {
          json.accounts = [];
          json.accounts = docs2;
          console.log(json.accounts);

          res.render('search', {
            user: req.user,
            comics: json.comics,
            accounts: json.accounts});}
      });
    }
  }));

});


//Get remove page
router.post('/comic/:comicid/remove/',function(req,res){

  var cid = req.params.comicid;
  console.log('cid: '+cid);
  var panelloc = req.body.panelloc;
  console.log('panelloc: '+panelloc);
  console.log("Trying to delete "+ panelloc);
  Comic.update({_id: cid}, {$pull:
  { imgarray: { panelloc: panelloc
  }}}, function (err) {
    if (err) console.log('Error removing panel!');
  });
  Account.update({_id: req.user._id}, {$pull:
  { contributions: { cid: cid
  }}}, function (err) {
    if (err) console.log('Error removing contribution!');
  });
  res.redirect(req.get('referer'));
});

module.exports = router;