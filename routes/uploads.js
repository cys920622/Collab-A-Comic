// created by ford atwater

//var express = require('express');
//var router = express.Router();
//var multer = require('multer');
//var uploads = multer({
//    dest: 'uploads/',
//    rename: function (fieldname, filename) {
//        console.log("Rename...");
//        return filename + Date.now();
//    },
//    onFileUploadStart: function () {
//        console.log("Upload is starting...");
//    },
//    onFileUploadComplete: function () {
//        console.log("File uploaded");
//    }
//});
//
//var storage = multer.diskStorage({
//    destination: function (req, file, cb) {
//        cb(null, '/tmp/my-uploads')
//    },
//    filename: function (req, file, cb) {
//        cb(null, file.fieldname + '-' + Date.now())
//    }
//});
//
//var upload = multer({ storage: storage });