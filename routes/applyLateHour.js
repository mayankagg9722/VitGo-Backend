var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLink');
var cheerio = require('cheerio');
var constants = require('../constants');

function trimArray(arr)
{
    for (var i=0 ; i<arr.length ; i++)
        arr[i] = arr[i].trim();
}

router.post('/', function (req, res, next) {

    var regno = req.body.regno;
    var password = req.body.password;
    var cvFaculty = req.body.cvFaculty;
    var frmdate = req.body.frmdate;
    var frmtm = req.body.frmtm;
    var todate = req.body.todate;
    var totm = req.body.totm;
    var txtVenue = req.body.txtVenue;
    var txtRsn = req.body.txtRsn;

    var data = {
        "pvActionIndicator" : "SBM",
        "cvLeaveType" : "LB",
        "cvFaculty" : cvFaculty,
        "frmdate" : frmdate,
        "frmtm" : frmtm,
        "todate" : todate,
        "totm" : totm,
        "txtVenue" : txtVenue,
        "txtRsn" : txtRsn
    };

    
    

    var link = "https://vtop.vit.ac.in/student/Hostel_LAB_DBH.asp";
    getResponseFromLink("POST", data, link, regno, password, function (response) {
        if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
            res.end(message);
            return;
        }

        var jsonObj = {
            "code" : "200"
        }


        res.send(jsonObj);
    
    });

});

module.exports = router;
