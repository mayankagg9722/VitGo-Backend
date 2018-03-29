var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	
	if(req.query.notMatched == "1")
	{
		res.render('login', {message : "Umm, was the chapter id and password correct?"});
	}
	else if(req.query.timedOut == "1")
	{
		res.render('login', {message : "Oops! Its a TimedOut, please login again"});
	}
	else
	{
		res.render('login', {message : ""});
	}
});

module.exports = router;
