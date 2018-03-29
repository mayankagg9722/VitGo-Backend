var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
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
    var sem = constants.semesterSubId;
    var classId = req.body.classId;
    var slotId = req.body.slotId;
    var faculty = req.body.faculty;

    var data = {
        "semSubId" : sem,
        "classId" : classId,
        "slotId" : slotId,
        "faculty" : faculty,
        "praType" : "source",
        "paramReturnId" : "getCourseDetailsForCoursePage"
    };

    var link = "https://vtopbeta.vit.ac.in/vtop/getCourseDetailsForCoursePage";

    if(classId && !slotId && !faculty)
    {
        link = "https://vtopbeta.vit.ac.in/vtop/getSlotIdForCoursePage";
        data.paramReturnId = "getSlotIdForCoursePage";
    }
    else if(classId && slotId && !faculty)
    {
        link = "https://vtopbeta.vit.ac.in/vtop/getFacultyForCoursePage";
        data.paramReturnId = "getFacultyForCoursePage";
    }
    else if(classId && slotId && faculty)
    {
        link = "https://vtopbeta.vit.ac.in/vtop/getCourseDetailsForCoursePage";
        data.paramReturnId = "getCourseDetailsForCoursePage";
    }

    getResponseFromLink("POST", data, link, regno, password, function(response, cookiejar){

        if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
            res.end(message);
            return;
        }


        var $ = cheerio.load(response.body);
        var slotsJson = getSlotJson($);
        var facultiesJson = getFacultiesJson($);
        var coursesJson = getCoursesJson($);

        

        var responseJson = {
            "slots" : slotsJson,
            "faculties" : facultiesJson,
            "courses" : coursesJson
        };
        res.send(responseJson);

    });



});

var getSlotJson = function($)
{

    var allSelects = $('select');
    var slotSelect = $(allSelects['2']);
    var allOptions = $(slotSelect.children());
    var mainArray = [];
    for(var i=1 ; i<allOptions.length ; i++)
    {
        var option = $(allOptions).get(i);
        mainArray.push({name: $(option).text(), value: option.attribs.value});
    }

    return mainArray;
}

var getFacultiesJson = function($)
{
    var allSelects = $('select');
    var faculySelect = $(allSelects['3']);
    var allOptions = $(faculySelect['0']).children();
    var mainArray = [];
    for(var i=1 ; i<allOptions.length ; i++)
    {
        var option = $(allOptions).get(i);
        mainArray.push({name: $(option).text(), value: option.attribs.value});
    }

    return mainArray;
}

var getCoursesJson = function($)
{
    var trs = $($('table').children());
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
        if(textArray.length == 9)
        {
            var courseCode = textArray[1];
            var subjectName = textArray[2];
            var courseTypeShort = textArray[3];
            var courseTypeFull = getFullCourseTypeName(courseTypeShort);
            var classId = textArray[4];
            var slot = textArray[5];
            var facultyName = textArray[6];
            mainArray.push({
                "courseCode" : courseCode,
                "subjectName" : subjectName,
                "courseTypeShort" : courseTypeShort,
                "courseTypeFull" : courseTypeFull,
                "classId" : classId,
                "slot" : slot.split("/").join("+"),
                "facultyName" : facultyName.split(" - ")[1]
            });

        }
    }

    return mainArray;
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
