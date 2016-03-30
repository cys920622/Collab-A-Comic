var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;

var Comment = new Schema({
        commenter : String,
        content  : String,
        created  : Date,
        comicid : String
});

///* GET comments listing. */
//router.get('/', function(req, res, next) {
//        res.send('respond with a resource');
//});

module.exports = mongoose.model( 'Comment', Comment );