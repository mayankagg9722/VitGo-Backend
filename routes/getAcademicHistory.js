var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var constants = require('../constants');
var unirest = require('unirest');
var getGrades = require('./getGrades');
var getResponseFromLink = require('./getResponseFromLink');
var getResponseFromLinkVtopBeta = require('./getResponseFromLinkVtopBeta');
var allowedGrades = ["S", "A", "B", "C", "D", "E", "P"]
var notAllowedGrades = ["W"]


router.post('/', function(req, res, next) {
  	
  	
  	var regno = req.body.regno;
  	var password = req.body.password;
  	req.body.sem = "fs"
  	var link = "https://vtop.vit.ac.in/student/student_history.asp";
  	var callbackCounter = 0;
  	var academicsHistoryArray = {}
  	var currentSubjectsArray = {}
  	var addGradesCallbackCounter = 0;
  	var fakeResponseForGetGrades = {
  		send: function(json){addGradesToAcademicHistory("grades", json)}
  	}


	function isEmpty(obj) {
            for(var key in obj) {
            if(obj.hasOwnProperty(key))
                    return false;
            }
            return true;
    }

    function makeSureEverythingExists()
    {
            if(isEmpty(academicsHistoryArray))
            {
                    academicsHistoryArray = {code:"200",data:[{"courseName": "No Academic History","courseCode": "Please logout and login","credits": "0","grade": "W"}], creditsEarned:"0", creditsRegistered:"0"}
            }
            
            if(isEmpty(currentSubjectsArray))
            {
                    currentSubjectsArray = {code:"200",data:[{"courseName": "Unable to fetch currentSubjects","courseCode": "Please logout and login","credits": "0","grade": "W"}], creditsEarned:"0", creditsRegistered:"0"}
            }

            function checkForNullValues(obj)
            {
                for (var key in obj)
                {
                        if(!obj[key])
                                obj[key] = ""
                        if(key == "data" && !obj[key])
                                obj[key] = []
                }
            }

            checkForNullValues(currentSubjectsArray)
            for(var i=0 ; i<currentSubjectsArray.data.length ; i++)
                    checkForNullValues(currentSubjectsArray.data[i])
            if(currentSubjectsArray.data.length == 0)
                    currentSubjectsArray.data.push({"courseName": "Unable to fetch currentSubjects","courseCode": "Please logout and login","credits": "0","grade": "W"})
            checkForNullValues(academicsHistoryArray)
            for(var i=0 ; i<academicsHistoryArray.data.length ; i++)
                    checkForNullValues(academicsHistoryArray.data[i])
            if(currentSubjectsArray.data.length == 0)
                    academicsHistoryArray.data.push({"courseName": "No Academic History","courseCode": "Please logout and login","credits": "0","grade": "W"})


    }

    var academicsHistoryFinalJson, gradesJson;

    function getCreditsEarned(array)
    {
    	var totalCredits = 0
    	for(var i=0 ; i<array.length ; i++)
    	{
    		if(allowedGrades.indexOf(array[i].grade) != -1)
    			totalCredits += Number(array[i].credits)
    	}
    	return ""+totalCredits
    }
    function getCreditsTotal(array)
    {
    	var totalCredits = 0
    	for(var i=0 ; i<array.length ; i++)
    	{
    		if(notAllowedGrades.indexOf(array[i].grade) == -1)
    			totalCredits += Number(array[i].credits)
    	}
    	return ""+totalCredits
    }

    function sortArray(array)
    {
    	for(var i=0 ; i<array.length ; i++)
    	{
    		for(var j=1 ; j<array.length ; j++)
    		{
    			if(array[j].courseCode.localeCompare(array[j-1].courseCode) < 0)
    			{
    				var temp = array[j]
    				array[j] = array[j-1]
    				array[j-1] = temp
    			}
    		}
    	}
    	return array
    }

    function mixGradesAndAcademicHistoryJson()
    {
    	if(regno.substr(0, 2) == "17")
    	{
    		academicsHistoryFinalJson.academicsHistory = {
    			"code" : "200",
    			"data": sortArray(gradesJson.data),
    			"creditsEarned" : getCreditsEarned(gradesJson.data),
    			"creditsRegistered" : getCreditsTotal(gradesJson.data)
    		}
    		return academicsHistoryFinalJson
    	}


    	if(
    		gradesJson.code != "200" ||
    		academicsHistoryFinalJson.academicsHistory.code != "200" ||
    		academicsHistoryFinalJson.currentSubjects.code != "200" ||
    		academicsHistoryFinalJson.academicsHistory.data.length < 2 ||
    		academicsHistoryFinalJson.currentSubjects.data.length < 2 ||
    		gradesJson.data.length < 2
    		)
    	{
    		return academicsHistoryFinalJson
    	}
    	else
    	{
    		var academicsHistoryArray = academicsHistoryFinalJson.academicsHistory.data
    		var gradesArray = gradesJson.data
    		
    		for(var i=0 ; i<gradesArray.length ; i++)
    		{
    			var courseCode = gradesArray[i].courseCode
    			var courseName = gradesArray[i].courseName
    			for(var j=0 ; j<academicsHistoryArray.length ; j++)
    			{
    				if(academicsHistoryArray[j].courseName == courseName && academicsHistoryArray[j].courseCode == courseCode)
    				{
    					academicsHistoryArray.splice(j, 1)
    				}
    			}
    		}
    		var academicsHistoryArrayFinal = gradesArray.concat(academicsHistoryArray)
    		academicsHistoryArrayFinal = sortArray(academicsHistoryArrayFinal)

    		return {
    			code:"200",
    			academicsHistory: {
    				"code" : "200",
    				"data" : academicsHistoryArrayFinal,
    				"creditsEarned" : getCreditsEarned(academicsHistoryArrayFinal),
    				"creditsRegistered" : getCreditsTotal(academicsHistoryArrayFinal)
    			},
    			currentSubjects: academicsHistoryFinalJson.currentSubjects
    		}
    	}
    }


    function addGradesToAcademicHistory(type, sendJsonOrGradesJson)
    {
    	addGradesCallbackCounter ++;
    	
    	if(type == "sendJson")
    		academicsHistoryFinalJson = sendJsonOrGradesJson
    	else
    		gradesJson = sendJsonOrGradesJson

    	if(addGradesCallbackCounter > 1)
    	{
    		res.send(mixGradesAndAcademicHistoryJson())
    	}
    }

  	function sendResponse(type, mainJson)
  	{
  		if(type == "academicsHistory")
  			academicsHistoryArray = mainJson
  		else
  			currentSubjectsArray = mainJson

  		callbackCounter++;
  		if(callbackCounter > 1)
  		{
			makeSureEverythingExists()
			addGradesToAcademicHistory("sendJson", {
				code: "200",
				academicsHistory: academicsHistoryArray,
				currentSubjects: currentSubjectsArray
			})
  		}
  	}

	getResponseFromLink("GET", {}, link, regno, password, function(response){


		if(regno.substr(0, 2) == "17")
		{
			sendResponse("academicsHistory", {code:"200",data:[{"courseName": "No Academic History","courseCode": "N / A","credits": "0","grade": "W"}], creditsEarned:"0", creditsRegistered:"0"})
			return;
		}

		if(typeof response == 'string')
		{
			var message = '{"code" : "5001", "message" : "'+response+'"}';
			sendResponse("academicsHistory", {code:"200",data:[{"courseName": "Invalid Login","courseCode": "Cant fetch information from old vtop.vit.ac.in","credits": "0","grade": "W"}], creditsEarned:"0", creditsRegistered:"0"})
			return;
		}

		var mainArray = [];
		var insertedSubjects = [];

		var $ = cheerio.load(response.body)
		var mainTable = $('table[id="hist"]');
		var trs = mainTable.children();
		var textArray = []
		for(var i=1 ; i<trs.length ; i++)
		{
			var tds = trs.eq(i).children();
			textArray = [];
			for(var j=0 ; j<tds.length ; j++)
			{
				textArray.push(tds.eq(j).text().trim())
			}
			
			if(
				textArray.length == 9 && 
				textArray[1] != "" &&
				textArray[2] != "" &&
				textArray[4] != "" &&
				textArray[5] != "" &&
				textArray[5] != "-"
				)
			{
				var courseCode = textArray[1]
				var courseName = textArray[2]
				var credits = textArray[4]
				var grade = textArray[5]

				if(insertedSubjects.indexOf(courseCode) != -1)
					continue
				

				insertedSubjects.push(courseCode)
				mainArray.push({
					courseName : courseName,
					courseCode : courseCode,
					credits : credits,
					grade : grade
				})

			}
			
		}

		var creditsTableTrs = $('table').eq(3).children();
		var creditsRegistered = creditsTableTrs.eq(1).children().eq(0).text().trim();
		var creditsEarned = creditsTableTrs.eq(1).children().eq(1).text().trim();
		

		sendResponse("academicsHistory", {code:"200",data:mainArray, creditsEarned:creditsEarned, creditsRegistered:creditsRegistered})
		
	});

	var timeTablelink = "https://vtopbeta.vit.ac.in/vtop/processViewTimeTable";
	getResponseFromLinkVtopBeta("POST", {semesterSubId : constants.semesterSubId}, timeTablelink, regno, password, function(response, cookieJar){

		if(typeof response == 'string')
		{
			var message = '{"code" : "5001", "message" : "'+response+'"}';
			sendResponse("currentSubjects", {})
			addGradesToAcademicHistory("grades", {"code" : "5001", "data":[]})
			return;
		}
		getGrades.requestHandler(req, fakeResponseForGetGrades, function(){}, cookieJar)

		var mainArray = [];


		var $ = cheerio.load(response.body)

		var tables = $('table');

		var table = $(tables).eq(0);
		var facultyHtmlTable = $(table['0']).children();
		var trs = $(facultyHtmlTable);
		var oldCourseCode = null;
		var oldCredits = 0;
		var oldCourseName = null;
		var firstInserted = false;
		var totalCredits = 0;

		for (var i = 1 ; i<trs.length ; i++)
		{
			var text = makeText(trs[i], $);
			var textArray = text.split("\n\t");
			trimArray(textArray);
			if(textArray[0] == "Sl.No")
				continue
			
			if(!firstInserted)
			{	
				var oldCourseName = textArray[10]
				var oldCourseCode = textArray[7]
				var creditsComponents = textArray[16].split(" ")
				var oldCredits = parseFloat(creditsComponents[creditsComponents.length-1])
				firstInserted = true
			}

			else if(
						(
		                	textArray.length == 28 &&
		              		textArray[0] != "Sl.No" &&
		                	textArray[1] != "" && 
		                	textArray[3] != "" && 
		                	textArray[6] != "" && 
		                	textArray[8] != "" && 
		                	textArray[17] != ""
				        ) || 
						(
							textArray.length == 43 &&
							textArray[0] != "Sl.No" &&
							textArray[23] != "" &&
							textArray[7] != "" &&
							textArray[10] != "" &&
							textArray[13] != "" &&
							textArray[26] != ""
						) ||
						(
				                        textArray.length == 45 &&
				                        textArray[0] != "Sl.No" &&
				                        textArray[25] != "" &&
				                        textArray[7] != "" &&
				                        textArray[10] != "" &&
				                        textArray[13] != "" &&
				                        textArray[28] != ""

						) ||
		                (
		                        textArray.length == 54 &&
		                        textArray[0] != "Sl.No" &&
		                        textArray[34] != "" &&
		                        textArray[7] != "" &&
		                        textArray[10] != "" &&
		                        textArray[13] != "" &&
		                        textArray[37] != ""

		                ) ||
		                (
		                        textArray.length == 60 &&
		                        textArray[0] != "Sl.No" &&
		                        textArray[40] != "" &&
		                        textArray[7] != "" &&
		                        textArray[10] != "" &&
		                        textArray[13] != "" &&
		                        textArray[43] != ""

		                ) ||
		                (
		                        textArray.length == 48 &&
		                        textArray[0] != "Sl.No" &&
		                        textArray[28] != "" &&
		                        textArray[7] != "" &&
		                        textArray[10] != "" &&
		                        textArray[13] != "" &&
		                        textArray[31] != ""

		                )
					  )
			{

				var newCourseName = textArray[10]
				var newCourseCode = textArray[7]
				var creditsComponents = textArray[16].split(" ")
				var newCredits = parseFloat(creditsComponents[creditsComponents.length-1])

				if(oldCourseCode == newCourseCode)
				{
					oldCredits += newCredits;
				}
				else
				{
					mainArray.push({
						courseCode: oldCourseCode,
						courseName: oldCourseName,
						credits: ""+oldCredits,
						grade: "S"
					})
					oldCredits = newCredits
				}
					

				oldCourseName = newCourseName
				oldCourseCode = newCourseCode

			}
			else if(textArray.length == 1 && textArray[0].match(/^Total/i))
			{
				totalCredits = textArray[0].substr(-2);
			}

		}
		mainArray.push({
			courseCode: oldCourseCode,
			courseName: oldCourseName,
			credits: ""+oldCredits,
			grade: "S"
		})


		sendResponse("currentSubjects", {code:"200",data:mainArray,totalCreditsRegistered:totalCredits})


	})

});

var makeText = function(tableRow, $)
{
	var array = [];
	var tds = $(tableRow).children();
	for(var i=0 ; i<tds.length ; i++)
	{
		var tdText = $(tds[i]).text();
		array.push(tdText);
	}
	return array.join("\n\t");
}


function trimArray(arr)
{
    for (var i=0 ; i<arr.length ; i++)
        arr[i] = arr[i].trim();
}



module.exports = router;