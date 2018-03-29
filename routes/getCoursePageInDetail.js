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

router.post('/', function (req, res, next) {
	
	


    var regno = req.body.regno;
    var password = req.body.password;
    var sem = constants.semesterSubId;
    var classId = req.body.classId;
    var courseCode = req.body.courseCode;
    var courseTypeShort = req.body.courseTypeShort;
    var slot = req.body.slot.split("+").join("/");


    var data = {
        "semSubId" : sem,
        "classId" : classId,
        "courseCode" : courseCode,
        "courseType" : courseTypeShort,
        "slotName" : slot,
        "allottedProgram" : "ALL",
        "classNum" : classId
    };

    var link = "https://vtopbeta.vit.ac.in/vtop/processViewStudentCourseDetail";
    getResponseFromLink("POST", data, link, regno, password, function (response, cookiejar) {
        if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
            res.end(message);
            return;
        }

        var mainArray = [];

        var $ = cheerio.load(response.body);
        var tables = $('table');
        var trs = $(tables.eq(1)).children();
        for(var i=0 ; i<trs.length ; i++)
        {
            var tds = $(trs.eq(i)).children();
            if(tds.length == 2)
            {
                var aTag = $(tds.eq(1)).children().children();
                if(aTag['0'])
                {
                    if(aTag['0'].name == 'a')
                    {
                        var link = "https://vtopbeta.vit.ac.in"+aTag['0'].attribs.href;
                        var tempJson = {
                            "topic" : tds.eq(0).text(),
                            "link" : link,
                            "date" : "-",
                            "nameOfFile" : tds.eq(1).text().trim()
                        };
                        mainArray.push(tempJson);
                    }
                }
            }

        }

        var trs = $(tables.eq(2)).children();
        for(var i=0 ; i<trs.length ; i++)
        {
            var tds = $(trs.eq(i)).children();
            var textArray = [];
            for(var j=0 ; j<tds.length ; j++)
            {
                var tdText = $(tds[j]).text().trim();
                textArray.push(tdText);
            }
            if(textArray.length == 5)
            {
                if(textArray[4] != "")
                {
                    var date = textArray[1];
                    var topic = textArray[3];
                    var pTags = $(tds.eq(4)).children();
                    for(var m=0 ; m<pTags.length ; m++)
                    {
                    	var aTag = $(pTags.eq(m)).children();
	                    if(aTag['0'])
	                    {
	                        if(aTag['0'])
	                            if(aTag['0'].name == 'a')
	                        {
	                        	var nameOfFile = aTag.text().trim();
	                            var link = "https://vtopbeta.vit.ac.in"+aTag['0'].attribs.href;
	                            var tempJson = {
	                                "topic" : topic,
	                                "link" : link,
	                                "date" : date,
	                                "nameOfFile" : nameOfFile
	                            };
	                            mainArray.push(tempJson);
	                        }
	                    }
	                }

                }
            }
        }

        var cookieJson = getCookieString(cookiejar);

        var additionalHeaders = {
            "Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Encoding" : "gzip, deflate, sdch, br",
            "Accept-Language" : "en-US,en;q=0.8",
            "Connection" : "keep-alive",
            "Cookie" : (cookieJson.key+"="+cookieJson.value),
            "Host" : "vtopbeta.vit.ac.in",
            "Upgrade-Insecure-Requests" : "1",
            "User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
        };

        var resJson = {
        	cookie: cookieJson,
            headers: additionalHeaders,
            data: mainArray
        };
        res.send(resJson);
        
    });

});

var getCookieString = function(cookiejar)
{
	var cookie = cookiejar['_jar'].store.idx['vtopbeta.vit.ac.in']['/vtop'].JSESSIONID;
	return cookie;
}

module.exports = router;
