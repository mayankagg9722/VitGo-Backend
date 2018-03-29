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
    var link = "https://vtop.vit.ac.in/student/coursepage_plan_view.asp?sem="+constants.sem;
    getResponseFromLink("GET", {}, link, regno, password, function (response) {
        if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
            res.end(message);
            return;
        }
       
        var $ = cheerio.load(response.body);
        var options = $('option');

        var mainArray = [];

        for (var i=0 ; i<options.length ; i++)
        {
            var option = options.eq(i);
            var text = $(option).text();
            var course = $(option)[0].attribs.value;
            if(!course)
                continue;

                var tempJsonObj = {
                    "courseName" : text,
                    "courseCode" : course
                };
                mainArray.push(tempJsonObj);
        
        }

        var jsonObj = {
            "code" : "200",
            "data" : mainArray
        }

        res.send(jsonObj);
        
    });

});

module.exports = router;
