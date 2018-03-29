var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var cheerio = require('cheerio');
var unirest = require('unirest');
var constants = require('../constants');

function trimArray(arr)
{
    for (var i=0 ; i<arr.length ; i++)
        arr[i] = arr[i].trim();
}

var dateNotInHoliday = function(dateStr)
{
    return true
}

router.post('/', handleRequest);
function handleRequest (req, res, next, LoggedInCookiejar=undefined)
{
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

    function handleHTMLResponse(response)
    {
        if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
            res.send(message);
            return;
        }

        var $ = cheerio.load(response.body);
        var table = $('table');
        var trs = $(table['2']).children();
        var mainArray = [];
        for(var i=1 ; i<trs.length ; i++)
        {
            var tds = $(trs).eq(i).children();
            var textArray = [];
            for(var j=0 ; j<tds.length ; j++)
            {
                var tdText = $(tds[j]).text().trim();
                textArray.push(tdText);
            }
            function dateAlreadyPresent(date)
            {
                for(var x=0 ; x<mainArray.length ; x++)
                {
                    if(mainArray[x].date == date)
                    {
                        return true
                    }
                }
                return false
            }

            // console.log(textArray, " -> ", textArray.length);
            if(textArray.length == 5 && 
                textArray[1] != "" && 
                textArray[2] != "" &&
                dateNotInHoliday(textArray[1].toUpperCase())
                )
            {
                var date = textArray[1].toUpperCase();
                var day = textArray[2];
                var title = textArray[3];
                var materialUploaded = textArray[4];
                
                if(dateAlreadyPresent(date))
                {
                    date += " "
                }

                var innerJson = {
                    "date": date,
                    "day": day,
                    "title": title,
                    "materialUploaded": materialUploaded
                };
                mainArray.push(innerJson);
            }
        }
       
        var jsonObj = {
            "code" : "200",
            data : mainArray
        };  

        res.send(jsonObj);
        
    };

    var regno = req.body.regno;
    var password = req.body.password;
    var sem = constants.semesterSubId;
    var classnbr = req.body.classnbr;
    var crscd = req.body.crscd;
    var crstp = req.body.crstp;
    var slotName = req.body.to_date;


    var data = {
        "semSubId" : sem,
        "classId" : classnbr,
        "courseCode" : crscd,
        "courseType" : crstp,
        "slotName" : slotName,
        "allottedProgram" : "ALL",
        "classNum" : classnbr
    };

    var link = "https://vtopbeta.vit.ac.in/vtop/processViewStudentCourseDetail";
    if(LoggedInCookiejar)
    {
        new unirest.post(link)
        .header(headers)
        .jar(LoggedInCookiejar)
        .form(data)
        .followAllRedirects(true)
        .strictSSL(false)
        .end(handleHTMLResponse);
    }
    else
    {
        getResponseFromLink("POST", data, link, regno, password, handleHTMLResponse);
    }
}

module.exports = router;
module.exports.handleRequest = handleRequest;
