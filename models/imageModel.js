//write image model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
	

var imageSchema = Schema({
	title: {type: String, required: true},
	contributor: {type: String, required: true},
	image: {
		creationDate: {type: Date},
		name: {type: String},
		filename: {type: String}
	}
})

var modelName = "Image";
var collectionName = "Images"
mongoose.model(modelName, imageSchema, collectionName);