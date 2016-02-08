/**
 * Created by danielchoi on 2016-02-08.
 */

// Passport tutorial: http://bit.ly/1TNXvgG
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: String,
    password: String
    // TODO: add additional fields to user
    //,
    //firstName: String,
    //lastName: String,
    //email: String,
    //isContributor: Boolean
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);