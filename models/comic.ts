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
        panelloc: String,
        uploaded: Date
    }],
    path: String,
    subs: [{
        subscriber: String,
        subscriberEmail: String
    }],
    commentarray: [{
        commenter: String,
        newComment: String
    }],
});
module.exports = mongoose.model('Comic', Comic);