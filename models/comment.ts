var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;

var Comment = new Schema({
        commenter : String,
        content  : String,
        created  : Date
});

module.exports = mongoose.model( 'Comment', Comment );