var express = require('express');
var cheerio = require('cheerio');
var unirest = require('unirest');
var constants = require('../constants');
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var getCoursePage = require('./getCoursePage');
var router = express.Router();

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


router.post('/', function (req, res, next) {

	var callbackCounter = 0;
	var finalSendJson = {
		code : "200", 
		data : [],
		coursePageResponse : {}
	};
	function FinallySendResponse(responseJson, type=undefined)
	{
		callbackCounter ++;
		if(type == "detailAttendance")
		{
			finalSendJson.data = responseJson.data;
		}
		else
		{
			finalSendJson.coursePageResponse = responseJson;
		}
		if(callbackCounter >= 2)
		{
			res.send(finalSendJson);
		}
	}

    var regno = req.body.regno;
    var password = req.body.password;
    var classnbr = req.body.classnbr;
    var postParamSlot = req.body.to_date; // its coming in this parameter only sadly

    var link = "https://vtopbeta.vit.ac.in/vtop/processViewStudentAttendance";
    var data = {semesterSubId : constants.semesterSubId};
    getResponseFromLink("POST", data, link, regno, password, function (response, cookiejar) {

    	var fakeResponseObject = {
    		send : FinallySendResponse
    	}
    	getCoursePage.handleRequest(req, fakeResponseObject, undefined, cookiejar);
    		var detailAttendanceData = {classId : classnbr, slotName : postParamSlot};
    		var linkToDetailAttendance = "https://vtopbeta.vit.ac.in/vtop/processViewAttendanceDetail";
			var mainJson = {
			    	code : "200", 
			    	data : []
			    };

            unirest.post(linkToDetailAttendance)
            .header(headers)
            .jar(cookiejar)
            .form(detailAttendanceData)
            .followAllRedirects(true)
            .strictSSL(false)
            .end(function(response)
			{
				try{
					var $ = cheerio.load(response.body);
				}
				catch(e){
					console.log("catched");
					FinallySendResponse(mainJson, "detailAttendance");
					return;
				}
                var table = $('table');
			    var trs = $(table['0']).children();//.children();
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
			        
			        
			        if(textArray.length == 5 &&
			        	textArray[1] != "" &&
			        	textArray[4] != "" )
			        {
			        	var date = textArray[1];
			        	var status = textArray[4];
			        	var slot = textArray[2];
			        	
			        	if(dateAlreadyPresent(date))
		                {
		                    date += " "
		                }

			        	var tempJson =  {
				            "date": date,
				            "status": status
				        };

			        	mainArray.push(tempJson);
			        }
			    }

			    mainJson.data  = mainArray;

			    FinallySendResponse(mainJson, "detailAttendance");

  
			});


    });


 



});

module.exports = router;
