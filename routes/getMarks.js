//by mayank aggarwal
var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLink');
var cheerio = require('cheerio');
var constants = require('../constants');

function processArray(array, crstp)
{
    var obj = {};
    if(crstp == "Soft Skill")
    {
        if(array.length == 3)
        {
            obj = {
                "Assignment-1" : array[0],
                "Assignment-2" : array[1],
                "Assignment-3" : array[2]
            };
        
        }

        return obj;

    }

    if(array.length == 3)
    {
        obj = {
            "CAT-1" : array[0],
            "CAT-2" : array[1],
            "Digital Assignment" : array[2]
        };
        
    }
    else if(array.length == 6)
    {
        obj = {
            "CAT-1" : array[0],
            "CAT-2" : array[1],
            "Quiz-1" : array[2],
            "Quiz-2" : array[3],
            "Quiz-3" : array[4],
            "Assignment" : array[5]
        };
    }


    return obj;
}

router.post('/', function (req, res, next) {

    var regno = req.body.regno;
    var password = req.body.password;
    var link = "https://vtop.vit.ac.in/student/marks.asp?sem="+constants.sem;
//"15BCE0751", "Mayank9722@"
    getResponseFromLink("GET", {}, link, regno, password, function (response) {
        if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
            res.end(message);
            return;
        }
       
        var $ = cheerio.load(response.body);
        var tables = $('table');
        var table = $(tables[1]);
        

        var finalOb = {
            data: []
        };
        for (var i = 1; i < table.find("tr").length; i++) {
            var constraint = table.find("tr").eq(i).find("td").eq(4).text().trim();
            if (constraint == "Theory Only" || constraint == "Embedded Theory"
                || constraint == "Soft Skill") {
                    var ob = {};
                for (var j = 1; j < table.find("tr").eq(i).find("td").length; j++) {
                     
                    var str = table.find("tr").eq(0).find("td").eq(j).text();
                    ob[str] = table.find("tr").eq(i).find("td").eq(j).text().trim().split(',')[0];
                    
                }
                var ar = new Array;
                for (var k = 1; k < table.find("tr").eq(i).next().find("table").find("tr").length; k++) {
                        ar.push(table.find("tr").eq(i).next().find("table").find("tr").eq(k).find("td").eq(5).text());   
                }

                var objectOfMarks = processArray(ar, constraint);
                ob["marks"]=objectOfMarks;

                if(finalOb.data.indexOf(ob) == -1)
                    finalOb.data.push(ob);

            }
            // if(finalOb.data.indexOf(ob) == -1)
            //     finalOb.data.push(ob);
            
        }
        res.send(finalOb);
       
    });

});

module.exports = router;
