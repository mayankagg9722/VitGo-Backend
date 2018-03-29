var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var cheerio = require('cheerio');
var constants = require('../constants');

router.post('/', function (req, res, next) {

	var returningJson = {
            "code" : "200",
            "CAT1" : [],
            "CAT2" : [],
            "fat" : []
        }

    var regno = req.body.regno;
    var password = req.body.password;
    var link = "https://vtopbeta.vit.ac.in/vtop/examinations/doSearchExamScheduleForStudent";
    var data = {semesterSubId : constants.semesterSubId};
    getResponseFromLink("POST", data, link, regno, password, function (response) {
        if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
            res.end(message);
            return;
        }

        var $ = cheerio.load(response.body);

        var table = $('table');
        var trs = $(table['0']).children().children();
        var mainArray = [];
        var nameOfExam = "CAT1";

        for(var i=1 ; i<trs.length ; i++)
        { 
            var tds = $(trs).eq(i).children();
            var textArray = [];
            for(var j=0 ; j<tds.length ; j++)
            {
                var tdText = $(tds[j]).text().trim();
                textArray.push(tdText);
            }

            if(textArray.length == 1)
            {
                nameOfExam = textArray[0];
                if(nameOfExam == "FAT")
                    nameOfExam = "fat"
            }
            
            
            if(textArray.length == 12 && 
                textArray[1] != "" &&
                textArray[2] != "" &&
                textArray[3] != "" &&
                textArray[5] != "" &&
                textArray[6] != "" &&
                textArray[7] != "" &&
                textArray[8] != "" &&
                textArray[9] != "" &&
                textArray[10] != "" )
            {

                var courseCode = textArray[1];
                var courseName = textArray[2];
                var courseTypeShortForm = textArray[3];
                var courseType = getFullCourseTypeName(courseTypeShortForm);
                var slot = textArray[5];
                var date = textArray[6];
                if(date == "") date=" - "
                var session = textArray[7];
                if(session == "") session=" - "
                var time = textArray[8];
                if(time == "") time=" - "
                var roomNumber = textArray[9];
                var tableNumber = textArray[10];
                var day = getDayFromDate(date);


                    var subjectAttendanceJson = {
                        "courseCode" : courseCode,
                        "subjectName" : courseName,
                        "courseType" : courseType,
                        "slot" : slot,
                        "date" : date,
                        "day" : day,
                        "session" : session,
                        "time" : time,
                        "venue" : roomNumber,
                        "tableNumber" : tableNumber
                    };
                    
                    returningJson[nameOfExam].push(subjectAttendanceJson);

            }
        }

        res.send(returningJson);
        
        
    });

});

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

function getDayFromDate(dateString)
{
    var date = new Date(dateString);
    var dayNumber = date.getDay();
    var daysArray = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return daysArray[dayNumber];
}


module.exports = router;
