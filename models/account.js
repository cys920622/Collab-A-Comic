/**
 * Created by danielchoi on 2016-02-08.
 */
// Passport tutorial: http://bit.ly/1TNXvgG
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var Comic = require('./comic.ts');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var Account = new Schema({
    salt: String,
    hash: String,
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
            maxItems: Number
        }],
    description: String,
    comments: [{
            commid: String,
            cid: String
        }],
    resetPasswordToken: String,
    resetPasswordExpires: Date
});
Account.plugin(passportLocalMongoose);
module.exports = mongoose.model('Account', Account);
//# sourceMappingURL=account.js.map