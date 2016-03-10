/**
 * Created by danielchoi on 2016-02-08.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Comic = new Schema({
    title: String,
    originalname: String,
    filename: String,
    imgarray: [{
        author: String,
        panelloc: String
    }],
    path: String,
    subs: [{
        subscriber: String,
        subscriberEmail: String
    }]
});
module.exports = mongoose.model('Comic', Comic);