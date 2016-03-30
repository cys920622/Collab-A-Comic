var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;

var Comment = new Schema({
        commenter : String,
        content  : String,
        created  : Date,
        comicid : String
});

module.exports = mongoose.model( 'Comment', Comment );