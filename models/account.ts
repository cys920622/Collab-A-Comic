/**
 * Created by danielchoi on 2016-02-08.
 */
// Passport tutorial: http://bit.ly/1TNXvgG
var mongoose = require('mongoose');
var Comic = require('./comic.ts');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    firstName: String,
    lastName: String,
    profileid: String,
    email: String,
    username: String,
    password: String,
    isContributor: Boolean,
    contributions: [{
        cid: String,
        title: String,
        link: String
    }],
    subs: [{
        subCid: String,
        subComicName: String
    }]
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);