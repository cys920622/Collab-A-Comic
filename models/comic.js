/**
 * Created by danielchoi on 2016-02-08.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Comic = new Schema({
    title: String,
    originalname: String,
    filename: String,
    link: String,
    path: String
});
module.exports = mongoose.model('Comic', Comic);