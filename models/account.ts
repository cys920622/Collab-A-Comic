/**
 * Created by danielchoi on 2016-02-08.
 */
// Passport tutorial: http://bit.ly/1TNXvgG
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Comic = require('./comic.ts');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    firstName: String,
    lastName: String,
    profilephotopath: String,
    email: String,
    emailSetting: Boolean,
    username: String,
    //password: String,
    isContributor: Boolean,
    contributions: [{
        cid: String,
        title: String,
        link: String
    }],
    subs: [{
        subCid: String,
        subComicName: String
    }],
    followers: [{
        followerUserName: String,
        followerEmail: String
    }],
    following: [{
        followedUserName: String
    }],
    notifications: [{
        notificationText: String,
        actor: String,
        comicName: String,
        notiCid: String,
        maxItems: Number,
    }],
    description: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

// Mongoose middleware for reset password
Account.pre('save', function(next) {
    console.log('Mongoose reset middleware called!');
    var user = this;
    var SALT_FACTOR = 5;

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, null, function(err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);