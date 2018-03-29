var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var cheerio = require('cheerio');
var unirest = require('unirest');
var constants = require('../constants');
var workingLengths = [28, 43, 45, 54, 60, 48, 1, 7, 20, 21]
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

var showAds = false;

function trimArray(arr)
{
    for (var i=0 ; i<arr.length ; i++)
        arr[i] = arr[i].trim();
}

router.post('/', handlePostRequest)
function handlePostRequest(req, res, next, LoggedInCookieJar=undefined, isFaculty=false, responsePredefined=undefined) {

    var date = new Date();
    date = ""+date;
    date = date.split(' ');
    var today = date[2]+"-"+date[1]+"-"+date[3];
    var timeTablePageArray = [];
    var attendancePageArray = [];
    var callbackCounterForPages = 0;

    var mixThese2Json = function(page, dataArray)
    {
        callbackCounterForPages ++;
        if(page == "fromTimetablePage")
            timeTablePageArray = dataArray
        else
            attendancePageArray = dataArray

        if(callbackCounterForPages >= 2)
        {
            for(var i=0 ; i<attendancePageArray.length ; i++)
            {
                var courseCode = attendancePageArray[i].courseCode;
                var courseName = attendancePageArray[i].courseName;
                var crstp = attendancePageArray[i].postParams.crstp;
                var classnbr = attendancePageArray[i].postParams.classnbr;

                for(var j=0 ; j<timeTablePageArray.length ; j++)
                {
                    var courseCodeInTimetable = timeTablePageArray[j].courseCode;
                    var courseNameInTimetable = timeTablePageArray[j].courseName;
                    var crstpInTimetable = timeTablePageArray[j].postParams.crstp;
                    var classnbrInTimetable = timeTablePageArray[j].postParams.classnbr;
                    
                    if(courseCode == courseCodeInTimetable && courseName == courseNameInTimetable && crstp == crstpInTimetable && classnbr == classnbrInTimetable)
                    {
                        timeTablePageArray[j] = attendancePageArray[i]
                        break;
                    }
                }
            }
  // console.log(timeTablePageArray, "\n----------------", attendancePageArray)
            res.send({
                            "code" : "200",
                            "data" : timeTablePageArray,
                            "showAds" : showAds,
                            "customMessage" : "If you love using VIT Go, please take a minute and rate us 5 star on play store/app store. We need your support. Love, Team Go",
                            "showAdsFor5.0" : false,
                            "date" : getTodaysDate(),
                            "showInterstitial" : (regno != "15BCE0751")?true:((Math.random() >= 0.5)),
                            "keywords" : [ "Free Stock", "Stock Photo", "Online Rummy", "Stock Photos", "Tips For Successful", "submit site to alexa", "99 domain registration", "Insurance Plan", "Children Stories", "Kids Story", "Stories For Kids", "Daily Healthy Tips", "Healthy Eating Tips", "Children Stories", "Historical Museum", "best phone launcher", "wifi password checker", "Bal Majduri", "Bal Shram In Hindi", "Love Marriage Tips", "History", "History Articles", "Historical", "Kids Stories In English", "Peepal Tree Information", "My Health Care In Hindi", "Health Insurance", "History Of Web", "Peepal Information In Hindi" ]
                            , "logoutKey" : "986"
                        });
        }
    }
    

    var regno = req.body.regno;
    var password = req.body.password;
    var link = "https://vtopbeta.vit.ac.in/vtop/processViewStudentAttendance";
    if(isFaculty)
    {
        link = "https://vtopbeta.vit.ac.in/vtop/academics/common/viewFacultyWorkLoad";
    }
    var data = {semesterSubId : constants.semesterSubId};
    if(LoggedInCookieJar)
    {
        unirest.post(link)
        .header(headers)
        .jar(LoggedInCookieJar)
        .form(data)
        .followAllRedirects(true)
        .strictSSL(false)
        .end(function(HTMLResponse){ handleMainResponse(HTMLResponse, LoggedInCookieJar) });
    }
    else
    {
        getResponseFromLink("POST", data, link, regno, password, handleMainResponse);
    }
    function handleMainResponse(response, cookiejar)
    {
        if(isFaculty)
        {
            res.send(makeFacultyAttendanceJson(response));
            return;
        }

        if(responsePredefined)
        {
                mixThese2Json("fromTimetablePage", makeTempAttendanceJson(responsePredefined).data);
        }
        else
        {
            mixThese2Json("fromTimetablePage", [])
        }

        const getSubjectAttendance = function(subjectJson, classnbr, postParamSlot)
        {
            
            var indexToInsertAt = new Number(callCounter);
            mainArray[indexToInsertAt] = {};
            callCounter++;

            var data = {classId : classnbr, slotName : postParamSlot}
            var link = "https://vtopbeta.vit.ac.in/vtop/processViewAttendanceDetail";
            unirest.post(link)
            .header(headers)
            .jar(cookiejar)
            .form(data)
            .followAllRedirects(true)
            .strictSSL(false)
            .end(function(response)
                {
                    callbackCounter++;
                    var totalClassesAndAttended = parseDetailAttendance(response);
                    var totalClasses = totalClassesAndAttended[0];
                    var attended = totalClassesAndAttended[1];
                    var from_date = totalClassesAndAttended[2];
                    
                    subjectJson.attended = attended;
                    subjectJson.totalClasses = totalClasses;
                    subjectJson.postParams.from_date = from_date;
                    mainArray[indexToInsertAt] = subjectJson;
// console.log(subjectJson)
                    if(callbackCounter >= callCounter)
                    {
                        
                        var jsonObj = {
                            "code" : "200",
                            "data" : mainArray,
                            "showAds" : showAds,
                            "customMessage" : "If you love using VIT Go, please take a minute and rate us 5 star on play store/app store. We need your support. Love, Team Go",
                            "showAdsFor5.0" : false,
                            "date" : getTodaysDate(),
                            "showInterstitial" : (regno != "15BCE0751")?true:((Math.random() >= 0.5)),
                            "keywords" : [ "Free Stock", "Stock Photo", "Online Rummy", "Stock Photos", "Tips For Successful", "submit site to alexa", "99 domain registration", "Insurance Plan", "Children Stories", "Kids Story", "Stories For Kids", "Daily Healthy Tips", "Healthy Eating Tips", "Children Stories", "Historical Museum", "best phone launcher", "wifi password checker", "Bal Majduri", "Bal Shram In Hindi", "Love Marriage Tips", "History", "History Articles", "Historical", "Kids Stories In English", "Peepal Tree Information", "My Health Care In Hindi", "Health Insurance", "History Of Web", "Peepal Information In Hindi" ]
                            , "logoutKey" : "986"
                        };

                       mixThese2Json("fromAttendancePage", jsonObj.data);
                    }
                });
        }


        if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
            res.send(message);
            return;
        }

        var $ = cheerio.load(response.body);

        var table = $('table');
        var trs = $(table['0']).children();//.children();
        var mainArray = [];
        var callCounter = 0;
        var callbackCounter = 0;
        
        var noAttendancePresent = true;
        for(var i=1 ; i<trs.length ; i++)
        { 
            var tds = $(trs).eq(i).children();
            var textArray = [];
            for(var j=0 ; j<tds.length ; j++)
            {
                var tdText = $(tds[j]).text().trim();
                textArray.push(tdText);
            }
// console.log(textArray, textArray.length);
            if(
            (
                textArray.length == 11 && 
                textArray[1] != "" &&
                textArray[2] != "" &&
                textArray[3] != "" &&
                textArray[4] != "" 
            )
            ||
            (
                textArray.length == 12 && 
                textArray[1] != "" &&
                textArray[2] != "" &&
                textArray[3] != "" &&
                textArray[4] != "" 
            )
            )
            {
                noAttendancePresent = false;

                var courseCode = textArray[1];
                var courseName = textArray[2];
                var courseTypeShortForm = textArray[3];
                var courseType = getFullCourseTypeName(courseTypeShortForm);
                var slot = textArray[4];
                var classnbr = "";

                var ViewTd = $(tds).eq(10);
                if(textArray.length == 12)
                {
                    courseCode = textArray[1];
                    courseName = textArray[2];
                    courseType = textArray[3];
                    courseTypeShortForm = getShortCourseType(courseType);
                    slot = textArray[4];
                    classnbr = "";

                    ViewTd = $(tds).eq(11);
                }

                var aTag = $(ViewTd).children()['0'];

                var postParamSlot = "";

                

                if(aTag)
                {
                    if(aTag.attribs)
                    {
                        if(aTag.attribs.onclick)
                        {
                        	var postParamsss = aTag.attribs.onclick.split("'");
                            postParamSlot = postParamsss[3];
                            classnbr = postParamsss[1];
                        }
                    }
                }

                var subjectAttendanceJson = {
                    "courseCode": courseCode,
                    "courseName": courseName,
                    "courseType": courseType,
                    "slot": slot,
                    "attended": "",
                    "totalClasses": "",
                    "postParams": {
                        "semcode": constants.semesterSubId,
                        "classnbr": classnbr,
                        "from_date": "sampleString",
                        "to_date": postParamSlot,
                        "crscd": courseCode,
                        "crstp": courseTypeShortForm
                    }
                };
// console.log(subjectAttendanceJson)

                getSubjectAttendance(subjectAttendanceJson, classnbr, postParamSlot);


            }

        }

        if(noAttendancePresent)
        {
            mixThese2Json("fromAttendancePage", []);
        }
        
    };

};

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

var parseDetailAttendance = function(response)
{   
	
    var $ = cheerio.load(response.body);
    var table = $('table');
    var trs = $(table['0']).children();//.children();
    var firstDate = "sampleString";

    var totalClasses = 0;
    var absent = 0;

    for(var i=1 ; i<trs.length ; i++)
    {
        var tds = $(trs).eq(i).children();
        var textArray = [];
        for(var j=0 ; j<tds.length ; j++)
        {
            var tdText = $(tds[j]).text().trim();
            textArray.push(tdText);
        }
        // console.log(textArray, textArray.length)
        if(textArray.length == 5)
        {

        	if(firstDate == "sampleString")
        	{
        		firstDate = textArray[1];
        	}
            totalClasses++;
            if(textArray[4].toLowerCase() == "absent")
            {
                absent++;
            }
        }
    }
    
    if(totalClasses == 0)
    {
        return ["1", "0", firstDate];
    }

    return [(""+totalClasses), (""+(totalClasses-absent)), firstDate];
}

function getTodaysDate()
{
    var today = new Date();
    today.setHours(today.getHours() + 5);
    today.setMinutes(today.getMinutes() + 30);
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!

    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd;
    } 
    if(mm<10){
        mm='0'+mm;
    } 
    var today = dd+'-'+mm+'-'+yyyy;
    return today
}



function makeTempAttendanceJson(response)
{
    if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
            return message;
        }

    var responseJson = {
        "code": "200",
        "data": [],
        "showAds": false,
        "customMessage": "If you love using VIT Go, please take a minute and rate us 5 star on play store/app store. We need your support. Love, Team Go",
        "showAdsFor5.0": false,
        "date": getTodaysDate(),
        "showInterstitial": true,
        "keywords": [
            "Free Stock",
            "Stock Photo",
            "Online Rummy",
            "Stock Photos",
            "Tips For Successful",
            "submit site to alexa",
            "99 domain registration",
            "Insurance Plan",
            "Children Stories",
            "Kids Story",
            "Stories For Kids",
            "Daily Healthy Tips",
            "Healthy Eating Tips",
            "Children Stories",
            "Historical Museum",
            "best phone launcher",
            "wifi password checker",
            "Bal Majduri",
            "Bal Shram In Hindi",
            "Love Marriage Tips",
            "History",
            "History Articles",
            "Historical",
            "Kids Stories In English",
            "Peepal Tree Information",
            "My Health Care In Hindi",
            "Health Insurance",
            "History Of Web",
            "Peepal Information In Hindi"
        ],
        "logoutKey": "986"
    }

    function containsSameNameAndTypeAndCode(courseName, courseType, courseCode)
    {
        for(var i=0 ; i<responseJson.data.length ; i++)
        {
            var innerSubJson = responseJson.data[i];
            if(innerSubJson.courseName == courseName && innerSubJson.courseType == courseType && innerSubJson.courseCode == courseCode)
                return true;
        }
        return false;
    }

    var $ = cheerio.load(response.body);
    var tables = $('table');
    var table = $(tables).eq(0);
    var facultyHtmlTable = $(table['0']).children();
    var trs = $(facultyHtmlTable);
    for (var i = 0 ; i<trs.length ; i++)
    {
        var text = makeText(trs[i], $);
        var textArray = text.split("\n\t");
        trimArray(textArray);
        if(workingLengths.indexOf(textArray.length) === -1)
        {
        	// console.log(textArray, textArray.length)
        }
        
        if(
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

        ) ||
        (
            textArray.length == 51 &&
            textArray[0] != "Sl.No" &&
            textArray[13] != "" &&
            textArray[7] != "" &&
            textArray[10] != "" &&
            textArray[34] != "" &&
            textArray[31] != ""

        ) ||
        (
            textArray.length == 57 &&
            textArray[0] != "Sl.No" &&
            textArray[13] != "" &&
            textArray[7] != "" &&
            textArray[10] != "" &&
            textArray[37] != "" &&
            textArray[40] != ""

        )
        )
        {
            var courseName = textArray[6];
            var courseType = getFullCourseType(textArray[8]);
            var courseCode = textArray[3];
            var slot = textArray[17];
            var classnbr = textArray[1];
            var courseTypeShortForm = textArray[8];
		
		if(textArray.length == 43)
		{
			classnbr = textArray[23]
			slot = textArray[26]
			courseName = textArray[10]
			courseCode = textArray[7]
			courseType = textArray[13]
			courseTypeShortForm = getShortCourseType(courseType)
		}
                if(textArray.length == 45)
                {
                        classnbr = textArray[25]
                        slot = textArray[28]
                        courseName = textArray[10]
                        courseCode = textArray[7]
                        courseType = textArray[13]
                        courseTypeShortForm = getShortCourseType(courseType)
                }
                if(textArray.length == 48)
                {
                        classnbr = textArray[28]
                        slot = textArray[31]
                        courseName = textArray[10]
                        courseCode = textArray[7]
                        courseType = textArray[13]
                        courseTypeShortForm = getShortCourseType(courseType)
                }

                if(textArray.length == 54)
                {
                        classnbr = textArray[34]
                        slot = textArray[37]
                        courseName = textArray[10]
                        courseCode = textArray[7]
                        courseType = textArray[13]
                        courseTypeShortForm = getShortCourseType(courseType)
                }
                if(textArray.length == 60)
                {
                        classnbr = textArray[40]
                        slot = textArray[43]
                        courseName = textArray[10]
                        courseCode = textArray[7]
                        courseType = textArray[13]
                        courseTypeShortForm = getShortCourseType(courseType)
                }
                if(textArray.length == 51)
                {
                        classnbr = textArray[31]
                        slot = textArray[34]
                        courseName = textArray[10]
                        courseCode = textArray[7]
                        courseType = textArray[13]
                        courseTypeShortForm = getShortCourseType(courseType)
                }
                if(textArray.length == 57)
                {
                        classnbr = textArray[37]
                        slot = textArray[40]
                        courseName = textArray[10]
                        courseCode = textArray[7]
                        courseType = textArray[13]
                        courseTypeShortForm = getShortCourseType(courseType)
                }



            var subJson = {
                "courseCode": courseCode,
                "courseName": courseName,
                "courseType": courseType,
                "slot": slot,
                "attended": "0",
                "totalClasses": "1",
                "postParams": {
                    "semcode": constants.semesterSubId,
                    "classnbr": classnbr,
                    "from_date": "29-Nov-2017",
                    "to_date": slot,
                    "crscd": courseCode,
                    "crstp": courseTypeShortForm
                }
                
            };
            if(courseType != "Embedded Project" && !containsSameNameAndTypeAndCode(courseName, courseType, courseCode))
            {
                responseJson.data.push(subJson);
            }
            
        }

    }

    return responseJson;
}


function makeFacultyAttendanceJson(response)
{
    if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
            return message;
        }

    var responseJson = {
        "code": "200",
        "data": [],
        "showAds": false,
        "customMessage": "If you love using VIT Go, please take a minute and rate us 5 star on play store/app store. We need your support. Love, Team Go",
        "showAdsFor5.0": false,
        "date": "08-10-2045",
        "showInterstitial": false,
        "keywords": [
            "Free Stock",
            "Stock Photo",
            "Online Rummy",
            "Stock Photos",
            "Tips For Successful",
            "submit site to alexa",
            "99 domain registration",
            "Insurance Plan",
            "Children Stories",
            "Kids Story",
            "Stories For Kids",
            "Daily Healthy Tips",
            "Healthy Eating Tips",
            "Children Stories",
            "Historical Museum",
            "best phone launcher",
            "wifi password checker",
            "Bal Majduri",
            "Bal Shram In Hindi",
            "Love Marriage Tips",
            "History",
            "History Articles",
            "Historical",
            "Kids Stories In English",
            "Peepal Tree Information",
            "My Health Care In Hindi",
            "Health Insurance",
            "History Of Web",
            "Peepal Information In Hindi"
        ],
        "logoutKey": "986"
    }

    function containsSameNameAndTypeAndCode(courseName, courseType, courseCode)
    {
        for(var i=0 ; i<responseJson.data.length ; i++)
        {
            var innerSubJson = responseJson.data[i];
            if(innerSubJson.courseName == courseName && innerSubJson.courseType == courseType && innerSubJson.courseCode == courseCode)
                return true;
        }
        return false;
    }

    var $ = cheerio.load(response.body);
    var tables = $('table');
    var table = $(tables).eq(0);
    var facultyHtmlTable = $(table['0']).children();
    var trs = $(facultyHtmlTable);
    for (var i = 0 ; i<trs.length ; i++)
    {
        var text = makeText(trs[i], $);
        var textArray = text.split("\n\t");
        trimArray(textArray);
            
        if((
                textArray.length == 32 &&
                textArray[3] != "" && 
                textArray[4] != ""
            )
            ||
            (
                textArray.length == 33 &&
                textArray[2] != "" && 
                textArray[3] != "" && 
                textArray[14] != "" && 
                textArray[4] != ""
            )
          )
        {
            var courseName = textArray[3];
            var courseType = getFullCourseType(textArray[4]);
            var courseCode = textArray[2];
            var slot = textArray[12];
            if(textArray.length == 33)
            {
                slot = textArray[13]
            }
            var classnbr = textArray[1];
            var courseTypeShortForm = textArray[4];

            var subJson = {
                "courseCode": courseCode,
                "courseName": courseName,
                "courseType": courseType,
                "slot": slot,
                "attended": "1",
                "totalClasses": "1",
                "postParams": {
                    "semcode": constants.semesterSubId,
                    "classnbr": classnbr,
                    "from_date": "13-Jul-2017",
                    "to_date": slot,
                    "crscd": courseCode,
                    "crstp": courseTypeShortForm
                }
            };
            if(courseType != "Embedded Project" && !containsSameNameAndTypeAndCode(courseName, courseType, courseCode))
            {
                responseJson.data.push(subJson);
            }
        }

    }

    return responseJson;
}

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

var getFullCourseType = function(shortForm)
{
    shortForm = shortForm.toUpperCase();
    var mappingDict = {
        'ETH' : "Embedded Theory",
        'ELA' : "Embedded Lab",
        "TH" : "Theory",
        "EPJ" : "Embedded Project",
        "TO" : "Theory",
        "SS" : "Soft Skill",
        "LO" : "Lab"
    };

    return (mappingDict[shortForm] || shortForm);

}

var getShortCourseType = function(fullForm)
{
	fullForm = fullForm.toUpperCase();
	var mappingDict = {
		"EMBEDDED THEORY" : "ETH",
		"EMBEDDED LAB" : "ELA",
		"THEORY" : "TH",
		"THEORY ONLY" : "TH",
		"EMBEDDED PROJECT" : "EPJ",
		"SOFT SKILLS" : "SS",
		"SOFT SKILL" : "SS",
		"LAB" : "LO",
		"LAB ONLY" : "LO"
	}
	
	return (mappingDict[fullForm] || "TH")
}

module.exports = router;
module.exports.handlePostRequest = handlePostRequest;
