var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var cheerio = require('cheerio');
var constants = require('../constants');

function trimArray(arr)
{
    for (var i=0 ; i<arr.length ; i++)
        arr[i] = arr[i].trim();
}

router.get('/', function (req, res, next) {

    var regno = "15BIT0099"
    var password = "Navdeesh@8"
    var sem = "FS"

    var link = "https://vtopbeta.vit.ac.in/vtop/examinations/examGradeView/doStudentGradeView";
    var semester = (sem.toLowerCase() == "fs") ? "VL2017181":"VL2017185"

    getResponseFromLink("POST", {semesterSubId: semester}, link, regno, password, function (response) {
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
            
            if(textArray.length == 15)
            {   
                if(
                    textArray[2] == "" ||
                    textArray[3] == "" ||
                    textArray[4] == "" ||
                    textArray[9] == "" ||
                    textArray[10] == ""
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
                GRAND TOTAL = 9
                GRADE = 10
                */
                var tempJsonObj = {
                    "courseCode" : textArray[2],
                    "courseName" : textArray[3],
                    "courseType" : textArray[4],
                    "grandTotal" : textArray[9],
                    "grade" : textArray[10]
                };
                mainArray.push(tempJsonObj);
            }
        }

        var jsonObj = {
            "code" : "200",
            "data" : mainArray
        }
        
        res.send(response.body);
        
    });

});

module.exports = router;
