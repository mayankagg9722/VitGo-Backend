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
    var pvPermitID = req.body.pvPermitID;

    var data = {
        "pvPermitID" : pvPermitID,
        "pvActionIndicator" : "CNCL"
    };


    var link = "https://vtop.vit.ac.in/student/Hostel_LAB_DBH.asp";
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
            var pvPermitID = "";
            var text = trs.eq(i).text();
            var textArray = text.split('\r\n');
            trimArray(textArray);
            
            if(textArray.length == 14 || textArray.length == 15)
            {
                if(
                    textArray[2] == "" ||
                    textArray[3] == "" ||
                    textArray[6] == "" ||
                    textArray[7] == "" ||
                    textArray[8] == "" ||
                    textArray[9] == ""
                    )
                    continue;
                /*
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                FROM = 2
                TO = 3
                VENUE = 6
                REASON = 7
                FACULTY = 8
                STATUS = 9
                */

                if($(trs[i]).find('input')['0'])
                {
                    if($(trs[i]).find('input')['0'].attribs)
                    {
                        if($(trs[i]).find('input')['0'].attribs.onclick)
                        {
                            if($(trs[i]).find('input')['0'].attribs.onclick.split("'")[1])
                            {
                                pvPermitID = $(trs[i]).find('input')['0'].attribs.onclick.split("'")[1];
                                mainArray.push[pvPermitID];
                            }
                        }
                    }
                }
            }
        }

        var jsonObj = {
            "code" : "5004"
        }

        if(mainArray.indexOf(pvPermitID) == -1)
        {
            jsonObj.code = "200";
        }
        
        res.send(jsonObj);
        
    });

});

module.exports = router;
