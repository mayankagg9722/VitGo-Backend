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
      'Cookie': '',
      'Host': 'vtopbeta.vit.ac.in',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36'
    };



router.post('/', function (req, res, next) {

    var regno = req.body.regno;
    var password = req.body.password;
    var link = "https://vtopbeta.vit.ac.in/vtop/hostels/student/leave";
    var link1 = "https://vtopbeta.vit.ac.in/vtop/hostels/student/leave/status";
    var link2 = "https://vtopbeta.vit.ac.in/vtop/hostels/student/leave/history";
    var postData1 = {"method": "", "_method": "", "form": "LeaveMenuForm", "control": "second", "x": (new Date().toUTCString())}
    var postData2 = {"method": "", "_method": "", "form": "LeaveMenuForm", "control": "third", "x": (new Date().toUTCString())}
    var postData4 = {"method": "", "_method": "", "form": "LeaveMenuForm", "control": "third", "x": (new Date().toUTCString())}


    var allLeaveIds = [];
    var allLeaves = [];
    var approvingAuthorityName = [];
    var approvingAuthorityPostValue = [];
    var resJson = {
        "code": "200",
        "leaves": [],
        "approvingAuthorities": ["PROCTOR / BLOCK SUPERVISOR / CHIEF WARDEN"],
        "approvingAuthoritiesPostValues": ["PROCTOR / BLOCK SUPERVISOR / CHIEF WARDEN"]
    }
    var taskCounter = 2
    var taskCallbackCounter = 0

    function doneTheTask(funcName)
    {
        taskCallbackCounter ++;
        if(taskCallbackCounter == taskCounter)
            res.send(resJson)
    }


    function parseHistoryAndStatusResponse(htmlResponse, typeOfResponse)
    {
    	var $ = cheerio.load(htmlResponse)
    	var table = $('table[class="table table-striped table-bordered small"]')
    	var tChilds = table.children()
    	var tbody = $('tbody').children() // tChilds.eq(tChilds.length - 1).children()
    	for(var x=0 ; x<tbody.length ; x++)
    	{
    		var tr = tbody.eq(x)
    		var tds = tr.children()
    		var textArray = [];
    		for(var y=0 ; y<tds.length ; y++)
    		{
    			var td = tds.eq(y)
    			textArray.push(tds.eq(y).text().trim());
    		}
            // console.log(textArray, textArray.length)
            if(textArray.length == 9 && textArray[0] == "")
                textArray.shift()
    		if(textArray.length == 8)
    		{
                // leaves and outings
    			var leaveId = textArray[0]
    			var status = textArray[6]
    			var type = textArray[3]
    			var startDate = textArray[4]
    			var endDate = textArray[5]
                var from = startDate.split(" ")[0]
                var to = endDate.split(" ")[0]
    			console.log("status = ", status)
                console.log("type = ", type)
    			if(status.toLowerCase().indexOf("approve") !== -1)
    			{
    				status = "APPROVED"
    			}
                else if(status.toLowerCase().indexOf("cancel") !== -1)
                {
                    status = "CANCELLED"
                }
                else if(status.toLowerCase().indexOf("close") !== -1)
                {
                    status = "CLOSED"
                }
    			else
    			{
    				status = "NOT APPROVED"
    			}
                if(type != "OUTING")
                {
                    type = "HOME TOWN / LOCAL GUARDIANS PLACE"
                }
                if(typeOfResponse == "status")
        			resJson.leaves.unshift({
                        leaveId: leaveId,
        				type: type,
                        status: status,
                        from: from,
                        to: to
        			})
                else
                    resJson.leaves.push({
                        leaveId: leaveId,
                        type: type,
                        status: status,
                        from: from,
                        to: to
                    })
    		}
    	}
        doneTheTask("parseHistoryAndStatusResponse")
    }





    getResponseFromLink("POST", {"verifyMenu" : "true"}, link, regno, password, function (response, LoggedInCookieJar) {
        if (typeof response == 'string') {
            var message = '{"code" : "5001", "message" : "' + response + '"}';
            res.end(message);
            return;
        }
       
       unirest.post(link1)
        .header(headers)
        .jar(LoggedInCookieJar)
        .form(postData1)
        .followAllRedirects(true)
        .strictSSL(false)
        .end(function(response1){ parseHistoryAndStatusResponse(response1.body, "status"); });

       unirest.post(link2)
        .header(headers)
        .jar(LoggedInCookieJar)
        .form(postData2)
        .followAllRedirects(true)
        .strictSSL(false)
        .end(function(response2){ parseHistoryAndStatusResponse(response2.body, "history") });
        
    });

});

module.exports = router;
