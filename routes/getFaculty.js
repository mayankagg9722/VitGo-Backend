var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLink');
var cheerio = require('cheerio');
var db = require('../config_db');

router.post('/', function (req, res, next) {

    var empid = req.body.empid;

	var resJsonjsonObj = {
        "code" : "200",
        "email" : " ",
        "venue" : " ",
        "intercom" : " ",
        "designation" : " ",
        "openHours" : [],
        "mobile" : " ",
        "photo" : " ",
        "name" : " "
    };

    db.facultyInformationTable.findOne({empid : empid}, function(err, foundObject){

        if(!err && foundObject!=null)
        {
            resJsonjsonObj.email = foundObject.email;
            resJsonjsonObj.venue = foundObject.venue;
            resJsonjsonObj.intercom = foundObject.intercom;
            resJsonjsonObj.designation = foundObject.designation;
            resJsonjsonObj.mobile = foundObject.phoneNumber;
            resJsonjsonObj.photo = foundObject.photo;
            resJsonjsonObj.name = foundObject.name;
        }

        res.send(resJsonjsonObj);

    });

});

module.exports = router;
