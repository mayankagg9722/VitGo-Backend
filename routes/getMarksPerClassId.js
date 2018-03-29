var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var cheerio = require('cheerio');
var unirest = require('unirest');
var constants = require('../constants');
var db = require('../config_db');

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


function doTheJob(cookiejar, classnbr, res) {

    var link = "https://vtopbeta.vit.ac.in/vtop/examinations/doStudentMarkView";
    var data = {semesterSubId : constants.semesterSubId};


    function parseResponse(response){
        if(typeof response == 'string')
        {
            var message = '{"code" : "5001", "message" : "'+response+'"}';
            res.send({ code : "200", data : [] } );
            return;
        }

        var resJson = {
            code : "200",
            data : []
        };

        var mainArray = [];
        var tempJson = {};







        var $ = cheerio.load(response.body);

        var trs = $('table').eq(0).children();
        for(var i=1 ; i<trs.length ; i+=2)
        {
            var tds = trs.eq(i).children();
            var textArray = [];
            for(var m=0; m<tds.length ; m++)
            {
                textArray.push(tds.eq(m).text().trim());
            }

            if(textArray.length == 10)
            {
                tempJson = {
                    "Class Id": textArray[1],
                    "Course Code": textArray[2],
                    "Course Title": textArray[3],
                    "Course Type": textArray[4],
                    "Faculty": textArray[7],
                    "slot": textArray[8],
                    "keys": [],
                    "marks": {},
                    "mainMarksKeys": [],
                    "scoredMarksArray": []
                };
                if(textArray[1] != classnbr)
                    continue;
                var innerTds = trs.eq(i+1).children();
                for(var p=0 ; p<innerTds.length ; p++)
                {
                    var innerTable = innerTds.eq(p).children().eq(0);
                    if(innerTable && innerTable['0'] && innerTable['0'].name == "table")
                    {
                        var innerTrs = innerTable.children();
                        for(q=1 ; q<innerTrs.length ; q++)
                        {
                            textArray = [];
                            tds = innerTrs.eq(q).children();
                            for(var n=0; n<tds.length ; n++)
                            {
                                textArray.push(tds.eq(n).text().trim());
                            }
                            if(textArray.length == 7)
                            {
                                var totalMarks = textArray[2];
                                var scoredMarks = textArray[5];
                                if(scoredMarks.length == 1){scoredMarks = "0"+scoredMarks;}
                                if(totalMarks.length == 1){totalMarks = "0"+totalMarks;}
                                totalMarks = addDotIfNotExist(totalMarks)
                                scoredMarks = addDotIfNotExist(scoredMarks)
                                var key = textArray[1];
                                if(key == "Continous Assessment Test - I")
                                	key = "CAT - I"
                                else if(key == "Continous Assessment Test - II")
                                	key = "CAT - II"
                                var averageKey = "Average of "+key;
                                tempJson.keys.push(key);
                                tempJson.mainMarksKeys.push(key);
                                tempJson.keys.push(averageKey);
                                tempJson.marks[key] = scoredMarks + " / " + totalMarks;
                                tempJson.scoredMarksArray.push(scoredMarks);
                                tempJson.marks[averageKey] = "0.0";
                            }
                        }
                    }
                }
                mainArray.push(tempJson);
            }
        }
        
        res.send({ code : "200", data : mainArray } );

    };

    unirest.post(link)
    .header(headers)
    .jar(cookiejar)
    .form(data)
    .followAllRedirects(true)
    .strictSSL(false)
    .end(parseResponse);


 

};

function addDotIfNotExist(marks)
{
    if(marks.indexOf(".") == -1)
    {
        marks = marks+".00";
    }
    return marks;
}

module.exports = router;
module.exports.doTheJob = doTheJob;
