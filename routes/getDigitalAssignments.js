var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var cheerio = require('cheerio');
var constants = require('../constants');

router.post('/', handleRequest);
function handleRequest(req, res, next) {

	var regno = req.body.regno;
	var password = req.body.password;
	var link = "https://vtopbeta.vit.ac.in/vtop/examinations/doDigitalAssignment";
	var postData = {semesterSubId : constants.semesterSubId};

	getResponseFromLink("POST", postData, link, regno, password, function (response, cookiejar) {
		if (typeof response == 'string') {
			var message = '{"code" : "5001", "message" : "' + response + '"}';
			if(res.exportFunction)
			{
				res.exportFunction({code : "200", data : []}, cookiejar)
			}
			else
			{
				res.send(message);
			}
			return;
		}

		var mainArray = [];
		var $ = cheerio.load(response.body);

		var trs = $('table').children();
		for(var i=1 ; i<trs.length ; i++)
		{
			var tds = trs.eq(i).children();
			var textArray = [];
			for(var j=0 ; j<tds.length ; j++)
			{
				textArray.push(tds.eq(j).text().trim());
				if(textArray.length == 14
					&& textArray[1] != ""
					&& textArray[2] != ""
					&& textArray[3] != ""
					&& textArray[4] != ""
					&& textArray[12] != "")
				{
					var tempJson = {
			            "ClassNbr": textArray[1],
			            "Course Code": textArray[2],
			            "Course Title": textArray[3],
			            "Course Type": getFullCourseTypeName(textArray[4]),
			            "Faculty": trimArray(textArray[12].split("\n\t")).join(" - "),
			            "post_parameters": [
			                constants.semesterSubId,
			                textArray[1],
			                textArray[2],
			                textArray[4]
			            ]
			        };
			        mainArray.push(tempJson);

				}
			}
			
		}


		var resJson = {
			code : "200",
			data : mainArray
		};

		if(res.exportFunction)
		{
			res.exportFunction(resJson, cookiejar)
		}
		else
		{
			res.send(resJson);
		}
		
	});



};

var trimArray = function(arr)
{
	for(var i=0 ; i<arr.length ; i++)
	{
		arr[i] = arr[i].trim();
	}
	return arr;
}

var getFullCourseTypeName = function(shortForm)
{
    shortForm = shortForm.toUpperCase();
    var mappingDict = {
        'ETH' : "Embedded Theory",
        'ELA' : "Embedded Lab",
        "TH" : "Theory Only",
        "EPJ" : "Embedded Project",
        "TO" : "Theory Only",
        "SS" : "Soft Skill",
        "LO" : "Lab"
    };

    return (mappingDict[shortForm] || shortForm);
}

module.exports = router;
module.exports.handleRequest = handleRequest;
