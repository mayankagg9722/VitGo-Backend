var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var cheerio = require('cheerio');
var unirest = require('unirest');
var getMarksPerClassId = require('./getMarksPerClassId');
var constants = require('../constants');
var skipTitlesArray = ["Continous Assessment Test - I", "Continous Assessment Test - II", "Final Assessment Test"]

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

function getUploadStatusAndDaType(td, $)
{
	if(td.text().trim().toLowerCase() == "")
		return ["No link to upload", ""];

	try{
		var inputTag = $(td).children().children().children().eq(0);
		return ["Link Available", inputTag['0'].attribs.value]
	}
	catch(err)
	{
		return [td.text().trim().split("\t").join("").split("\n").join(""), ""];
	}
}


router.post('/', handleRequest);

function handleRequest(req, res, next, cookieJarPredefined=undefined, indexForExport = undefined) {
	var regno = req.body.regno;
	var password = req.body.password;
	var sem = req.body.sem || constants.semesterSubId;
	var classnbr = req.body.classnbr;
	var crscd = req.body.crscd;
	var crstp = req.body.crstp;

	var link = "https://vtopbeta.vit.ac.in/vtop/examinations/processDigitalAssignment";
	var linkToMainPage = "https://vtopbeta.vit.ac.in/vtop/examinations/doDigitalAssignment";

	var postData = {
		classId : classnbr,
		courseCode : crscd,
		type : crstp,
		semesterSubId : sem,
		mCode : "DA"
	};

	var marksJson = {};

	var activeCookieJar = undefined;
	var mainArray = [];
	var sendResCounter = 0;

	function sendResponse()
	{
		sendResCounter++;
		if(sendResCounter == 2 || res.exportFunction)
		{
			for(var i=0 ; i<mainArray.length ; i++)
			{
				try{
					if(marksJson.data[0].marks[mainArray[i].title])
					{
						mainArray[i].score = marksJson.data[0].marks[mainArray[i].title]
						mainArray[i].status = "Completed"
					}
				}
				catch(err)
				{

				}
			}

			var resJson = {
				code: "200",
				data : mainArray
			}


			if(res.exportFunction)
			{
				for(var i=0 ; i<mainArray.length ; i++)
				{
					
					if(mainArray[i].uploadStatus.toLowerCase().indexOf("uploaded") !== -1)
					{
						
						mainArray[i].uploadStatus = "Uploaded"
					}
				}
				res.exportFunction(resJson, indexForExport);
			}
			else
			{
				res.send(resJson);
			}
		}
	}

	function parseResponse(response)
	{
		var $ = cheerio.load(response.body);

		var trs = $('table').eq(1).children();
		for(var i=1 ; i<trs.length ; i++)
		{
			var tds = trs.eq(i).children();
			var textArray = [];

			for(var j=0 ; j<tds.length ; j++)
			{
				textArray.push(tds.eq(j).text().trim())
			}
			
			if(textArray.length == 6)
			{
				var title = textArray[1];
				if(skipTitlesArray.indexOf(title) != -1 && !(res.exportFunction))
					continue;
				var maxMarks = textArray[2];
				maxMarks = addDotIfNotExist(maxMarks);
				var dueDate = textArray[4].toUpperCase();
				var score = " - / "+maxMarks;
				var uploadStatusAndDaType = getUploadStatusAndDaType(tds.eq(5), $)

				var tempJson = {
        			"title": title,
        			"dueDate": dueDate,
        			"score": score,
        			"status": ((res.exportFunction)?"-":"Marks not awarded"),
        			"uploadStatus": uploadStatusAndDaType[0],
        			"daType": uploadStatusAndDaType[1]
    			};
    			mainArray.push(tempJson);

			}

		}

		var callbackCounter = 0;
		var callbackCounterExpectedValue = 0;

		function updateTheUploadStatus(index, daType)
		{
			var uploadCheckLink = "https://vtopbeta.vit.ac.in/vtop/examinations/doUploadSeparateDAssignment"

			postData.mCode = daType;

			unirest.post(uploadCheckLink)
			.header(headers)
			.jar(activeCookieJar)
			.form(postData)
        	.followAllRedirects(true)
			.strictSSL(false)
			.end(function(response){

				
				var $ = cheerio.load(response.body);
				var trs = $('table').eq(1).children();
				var tr = $(trs.eq(1));
				var uploadStatusText = $(tr.children().eq(6)).text().trim().split("\n").join("").split("\t").join("")
				
				mainArray[index].uploadStatus = uploadStatusText

				if(uploadStatusText.toLowerCase() == "notuploaded")
				{
					mainArray[index].uploadStatus = "Yet to Upload";
				}
		
				
				callbackCounter++;
				if(callbackCounter == callbackCounterExpectedValue)
				{
					sendResponse();
				}

			});

		}

		if(mainArray.length == 0)
		{
			sendResponse();
		}
		else
		{
			for(var x=0 ; x<mainArray.length ; x++)
			{
				if(mainArray[x].uploadStatus == "Link Available")
				{
					callbackCounterExpectedValue++;
					updateTheUploadStatus(x, mainArray[x].daType);
				}
			}
			if(callbackCounterExpectedValue == 0)
			{
				sendResponse();
			}
		}

	}

	if(cookieJarPredefined)
	{
		activeCookieJar = cookieJarPredefined;

		unirest.post(link)
		.header(headers)
		.jar(cookieJarPredefined)
		.form(postData)
        .followAllRedirects(true)
		.strictSSL(false)
		.end(parseResponse);

		if(!res.exportFunction)
			getMarksPerClassId.doTheJob(cookieJarPredefined, classnbr, {send:function(JsonData){marksJson = JsonData;sendResponse();}});
	}
	else
	{
		getResponseFromLink("POST", postData, linkToMainPage, regno, password, function (response, cookiejar) {

			if (typeof response == 'string') {
				var message = '{"code" : "5001", "message" : "' + response + '"}';
				res.end(message);

				return;
			}

			activeCookieJar = cookiejar;

			unirest.post(link)
			.header(headers)
			.jar(cookiejar)
			.form(postData)
        	.followAllRedirects(true)
			.strictSSL(false)
			.end(parseResponse);
			
			if(!res.exportFunction)
				getMarksPerClassId.doTheJob(cookiejar, classnbr, {send:function(JsonData){marksJson = JsonData;sendResponse();}});


		});
	}




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
module.exports.handleRequest = handleRequest;
