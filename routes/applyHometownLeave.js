var express = require('express');
var router = express.Router();
var getResponseFromLinkOnlyOnce = require('./getResponseFromLinkOnlyOnce');
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
    var apply = req.body.apply;
    var lvtype = req.body.lvtype;
    var exitdate = req.body.exitdate;
    var sttime_hh = req.body.sttime_hh;
    var sttime_mm = req.body.sttime_mm;
    var frm_timetype = req.body.frm_timetype;
    var reentry_date = req.body.reentry_date;
    var endtime_hh = req.body.endtime_hh;
    var endtime_mm = req.body.endtime_mm;
    var to_timetype = req.body.to_timetype;
    var place = req.body.place;
    var reason = req.body.reason;

    var data = {
        "apply" : apply,
        "lvtype" : lvtype,
        "exitdate" : exitdate,
        "sttime_hh" : sttime_hh,
        "sttime_mm" : sttime_mm,
        "frm_timetype" : frm_timetype,
        "reentry_date" : reentry_date,
        "endtime_hh" : endtime_hh,
        "endtime_mm" : endtime_mm,
        "to_timetype" : to_timetype,
        "place" : place,
        "reason" : reason,
        "requestcmd" : "Apply"
    };
    

    var link = "https://vtop.vit.ac.in/student/leave_request_submit.asp";
    getResponseFromLinkOnlyOnce("POST", data, link, regno, password, function (response) {
        if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
            res.end(message);
            return;
        }

         if(!response.body)
        {
            var jsonObj = {
            "code" : "6008",
            "message" : "Error"
            }
            res.send(jsonObj); 
            return
        }

        var $ = cheerio.load(response.body);
        var fonts = $('font');
        var message = "success";
        var code = "200";

        for(var i=0 ; i<fonts.length ; i++)
        {
            var attribs = fonts[i].attribs;
            if(attribs.size)
            {
                if(attribs.size == 2 && attribs.color == 'red')
                {
                    message = fonts.eq(i).text();
                    code = "6001";
                    break;
                }
            }
        }


        var jsonObj = {
            "code" : code,
            "message" : message
        }


        res.send(jsonObj);
    
    });

});

module.exports = router;
