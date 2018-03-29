var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');

var getResponseFromLink = require('./getResponseFromLink');


router.post('/', function(req, res, next) {
  	
  	
  	var regno = req.body.regno;
  	var password = req.body.password;

  	var resObject = regno+" "+password;

  	res.send(resObject);
  });

module.exports = router;
