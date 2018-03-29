var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var cheerio = require('cheerio');
var constants = require('../constants');
var unirest = require("unirest");

var headers = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-IN,en-GB;q=0.8,en-US;q=0.6,en;q=0.4',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'DNT': '1',
      'Host': 'vtopbeta.vit.ac.in',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36'
    };

function trimArray(arr)
{
    for (var i=0 ; i<arr.length ; i++)
        arr[i] = arr[i].trim();
}

router.post('/', requestHandler)
function requestHandler(req, res, next, LoggedInCookieJarPredefined=undefined) {

    var regno = req.body.regno;
    var password = req.body.password;
    var sem = req.body.sem;

    var link = "https://vtopbeta.vit.ac.in/vtop/examinations/examGradeView/doStudentGradeView";
    var link2 = "https://vtopbeta.vit.ac.in/vtop/examinations/examGradeView/StudentGradeView";
    var semester = (sem.toLowerCase() == "fs") ? "VL2017181":"VL2017185"

    if(LoggedInCookieJarPredefined)
    {
        new unirest.post(link)
        .header(headers)
        .jar(LoggedInCookieJarPredefined)
        .form({semesterSubId: semester})
        .followAllRedirects(true)
        .strictSSL(false)
        .end(function(HTMLResponse){ parseResponse(HTMLResponse) });
    }
    else
    {
        getResponseFromLink("POST", {verifyMenu:true}, link2, regno, password, function (responseee, LoggedInCookieJar) {

            new unirest.post(link)
            .header(headers)
            .jar(LoggedInCookieJar)
            .form({semesterSubId: semester})
            .followAllRedirects(true)
            .strictSSL(false)
            .end(function(HTMLResponse){ parseResponse(HTMLResponse) });
        })
    }

    function parseResponse(response)
    {
        if (typeof response == 'string') {
            var message = {
                code: "5001",
                message: response
            }
            res.send(message);
            return;
        }

        
       
        var $ = cheerio.load(response.body);

        

        var trs = $('tr');

        var mainArray = [];

        for (var i=0 ; i<trs.length ; i++)
        {
            var tds = trs.eq(i).children()
            var textArray = []
            for(var x=0 ; x<tds.length ; x++)
            {
                textArray.push(tds.eq(x).text())
            }
            
            trimArray(textArray);
            
            
            if(textArray.length == 14)
            {   
                if(
                    textArray[1] == "" ||
                    textArray[2] == "" ||
                    textArray[3] == "" ||
                    textArray[11] == "" ||
                    textArray[7] == "" ||
                    textArray[12] == ""
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
                    "courseCode" : textArray[1],
                    "courseName" : textArray[2],
                    "courseType" : textArray[3],
                    "grandTotal" : textArray[11],
                    "credits" : textArray[7],
                    "grade" : textArray[12]
                };
                mainArray.push(tempJsonObj);
            }
        }

        var jsonObj = {
            "code" : "200",
            "data" : mainArray
        }
        
        res.send(jsonObj);
        
    }

}

module.exports = router;
module.exports.requestHandler = requestHandler;
