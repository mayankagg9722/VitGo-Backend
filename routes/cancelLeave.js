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
    var leave_id = req.body.leave_id;

    var data = {
        "leave_id" : leave_id
    };


    var link = "https://vtop.vit.ac.in/student/leave_cancel_submit.asp";
    getResponseFromLink("POST", data, link, regno, password, function (response) {
        if (typeof response == 'string') {
            var message = '{"code" : "5001", "message" : "' + response + '"}';
            res.end(message);
            return;
        }
       
        var $ = cheerio.load(response.body);
        var trs = $('tr');

        var mainArray = [];

        for (var i=0 ; i<trs.length ; i++)
        {
            var text = trs.eq(i).text();
            var textArray = text.split('\r\n');
            trimArray(textArray);
            
            if(textArray.length == 19)
            {
                if(textArray[3] == "")
                {
                    continue;
                }

                mainArray.push(textArray[3]);
            }
        }

        var jsonObj = {
            "code" : "5004"
        }

        if(mainArray.indexOf(leave_id) == -1)
        {
            jsonObj.code = "200";
        }
        
        res.send(jsonObj);
        
    });

});

module.exports = router;
