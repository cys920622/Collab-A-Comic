//TODO: is this file being used?
//write image model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var imageSchema = new Schema({
	title: String,
	//contributor: String,
	image: {
		creationDate: Date,
		name: String,
		filename: String
	}
})

//var modelName = "imageSchema";
var collectionName;
collectionName = "imageSchema";

//mongoose.model('images', imageSchema, collectionName);

module.exports = mongoose.model('images', imageSchema);