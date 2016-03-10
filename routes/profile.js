/**
 * Created by chuchutrainn on 2016-03-09.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Profile = new Schema({
    originalname: String,
    filename: String,
    imgarray: [{
        picloc: String
    }],
    path: String
});
module.exports = mongoose.model('Profile', Profile);
//# sourceMappingURL=comic.js.map