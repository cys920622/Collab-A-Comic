var express = require('express');
var router = express.Router();
var PUserSchema = require('mongoose').model('PowerUsers');

/* GET home page. */
router.get('/', function(req, res, next) {
  PUserSchema.create({
    name: 'Jason Doe',
    age: 3
  });

  res.render('index', { title: 'Homepage' });
  console.log('GET home page');

});

module.exports = router;
