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
    var course = req.body.course;

    var data = {
        "sem" : constants.sem,
        "course" : course
    };

    var link = "https://vtop.vit.ac.in/student/coursepage_plan_view.asp";
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
            var text = $(trs).eq(i).text();
            var textArray = text.split('\r\n');
            trimArray(textArray);

            if(textArray.length == 21)
            {
                if(
                    textArray[2] == "" ||
                    textArray[3] == "" ||
                    textArray[4] == "" ||
                    textArray[6] == "" ||
                    textArray[7] == ""
                    )
                    continue;
                
                /*
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                COURSE CODE = 2
                COURSE NAME = 3
                COURSE TYPE = 4
                SLOT = 6
                TEACHER = 7

                INPUT SEM = 0
                INPUT classnbr = 1
                INPUT crscd = 2
                INPUT crstp = 3
                */

                var coursecode = textArray[2];
                var coursename = textArray[3];
                var coursetype = textArray[4];
                var slot = textArray[6];
                var teacher = textArray[7];


                var inputs = $(trs).eq(i).find('input');
                if(inputs.length != 5)
                    continue;
                var sem = $(inputs.eq(0))[0].attribs.value;
                var classnbr = $(inputs.eq(1))[0].attribs.value;
                var crscd = $(inputs.eq(2))[0].attribs.value;
                var crstp = $(inputs.eq(3))[0].attribs.value;

                var postString = "sem="+sem+"&classnbr="+classnbr+"&crscd="+crscd+"&crstp="+crstp;

                var tempJson = {
                    "coursecode" : coursecode,
                    "coursename" : coursename,
                    "coursetype" : coursetype,
                    "slot" : slot,
                    "teacher" : teacher,
                    "postString" : postString
                };

                mainArray.push(tempJson);
            }
        }

        var jsonObj = {
            "code" : "200",
            "data" : mainArray
        }

        res.send(jsonObj);
        
    });

});

module.exports = router;
