//by mayank aggarwal
var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLink');
var cheerio = require('cheerio');
var constants = require('../constants');

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
                ob["marks"]=ar;

            }
            if(finalOb.data.indexOf(ob) == -1)
                finalOb.data.push(ob);
            
        }
        res.send(finalOb);
       
    });

});

module.exports = router;
