/**
 * Created by chuchutrainn on 2016-03-09.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Profile = new Schema({
    originalname: String,
    filename: String,
    picloc: String,
    path: String
});
module.exports = mongoose.model('Profile', Profile);
//# sourceMappingURL=profile.js.map