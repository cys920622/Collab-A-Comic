/**
 * Created by danielchoi on 2016-02-08.
 */
// Passport tutorial: http://bit.ly/1TNXvgG
var mongoose = require('mongoose');
var Comic = require('../models/comic');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    username: String,
    password: String,
    isContributor: Boolean,
    contributions: [{
        title: String,
        link: String
    }]
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);