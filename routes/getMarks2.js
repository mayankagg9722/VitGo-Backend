var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var cheerio = require('cheerio');
var constants = require('../constants');
var db = require('../config_db');


router.post('/', function (req, res, next) {

    var regno = req.body.regno;
    var password = req.body.password;
    var link = "https://vtopbeta.vit.ac.in/vtop/examinations/doStudentMarkView";
    var data = {semesterSubId : constants.semesterSubId};

    getResponseFromLink("POST", data, link, regno, password, function(response, cookiejar){
        if(typeof response == 'string')
        {
            var message = '{"code" : "5001", "message" : "'+response+'"}';
            res.end(message);
            return;
        }

        var resJson = {
            code : "200",
            data : []
        };

        var mainArray = [];
        var tempJson = {};

        var mainCallCounter = 0;
        var mainCallbackCounter = 0;

        function calculateTotal()
        {
            for(var i=0 ; i<resJson.data.length ; i++)
            {
                var totalScoredMarks = 0;
                var totalMaxMarks = 0;
                for(var j=0 ; j<resJson.data[i].mainMarksKeys.length ; j++)
                {
                    var key = resJson.data[i].mainMarksKeys[j].trim()
                    var keyString = "Average of "+key
                    var weightageKey = "Weightage of "+key
                    var totalMaxMarksKey = "Total Max of "+key
                    var scoredMarks = resJson.data[i].marks[keyString]
                    var weightage = resJson.data[i][weightageKey]
                    var totalMarks = resJson.data[i][totalMaxMarksKey]
                    scoredMarks = scoredMarks.substr(0, scoredMarks.indexOf("(of ") - 1)
                    
                    if(key == "Additional Learning" && ((resJson.data[i]["Course Type"].toLowerCase() == "embedded theory") || (resJson.data[i]["Course Type"].toLowerCase() == "eth") || (resJson.data[i]["Course Type"].toLowerCase() == "theory only" || (resJson.data[i]["Course Type"].toLowerCase() == "th"))))
                    {
                        totalScoredMarks += (((parseFloat(scoredMarks) / parseFloat(totalMarks)))*parseFloat(weightage))
                    }
                    else
                    {
                        totalScoredMarks += (((parseFloat(scoredMarks) / parseFloat(totalMarks)))*parseFloat(weightage))
                        totalMaxMarks += parseFloat(weightage)
                    }

                }
                
                if(parseFloat(totalScoredMarks) > parseFloat(totalMaxMarks))
                    totalScoredMarks = totalMaxMarks
                resJson.data[i].keys.push("Average of Total Weightage")
                resJson.data[i].marks["Average of Total Weightage"] = parseFloat(totalScoredMarks).toFixed(2) + " / " + parseFloat(totalMaxMarks).toFixed(2)

            }

            for(var i=0 ; i<resJson.data.length ; i++)
                for(var j=0 ; j<resJson.data.length-1 ; j++)
                {
                    if(resJson.data[j]["Course Code"] > resJson.data[j+1]["Course Code"])
                    {
                        var temp = resJson.data[j];
                        resJson.data[j] = resJson.data[j+1]
                        resJson.data[j+1] = temp
                    }
                }
        }

        function doneAverage()
        {
            mainCallbackCounter++;
            if(mainCallbackCounter == mainCallCounter)
            {
                resJson.data = mainArray;
                calculateTotal()
                res.send(resJson);
            }
        }


        function getAverageOfClass(index, classId, marksTitlesArray, scoreArray)
        {
            mainCallCounter++;
            var innerCallCounter = 0;
            var innerCallbackCounter = 0;
            for(var i=0 ; i<marksTitlesArray.length ; i++)
            {
                var marksTitle = marksTitlesArray[i];
                var currentScore = scoreArray[i];
                innerCallCounter ++;
                makeQuery(index, classId, marksTitle, currentScore, function(){
                    innerCallbackCounter++;
                    if(innerCallbackCounter == innerCallCounter)
                    {
                        doneAverage();
                    }
                })
            }
        }

        function makeQuery(index, classId, marksTitle, currentScore, callback)
        {
            var averageKey = "Average of "+marksTitle.trim();
        	if(marksTitle.trim() == "CAT - I")
				marksTitle = "Continous Assessment Test - I"
			else if(marksTitle.trim() == "CAT - II")
				marksTitle = "Continous Assessment Test - II"

            
            var calculatedResult = "0";
            db.totalMarksTable.findOne({classId: classId, marksTitle: marksTitle.trim()}, function(err, foundObject){
                
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    if(foundObject == null)
                    {
                        var newTotalMarksObject = new db.totalMarksTable();
                        newTotalMarksObject.classId = classId;
                        newTotalMarksObject.marksTitle = marksTitle.trim();
                        newTotalMarksObject.totalStudentsWhoContributed = [regno];
                        newTotalMarksObject.totalMarks = ""+parseFloat(currentScore);
                        mainArray[index].marks[averageKey] = ""+parseFloat(currentScore).toFixed(2)+" (of 1 student)";
                        newTotalMarksObject.save();
                    }
                    else
                    {
                        var students = foundObject.totalStudentsWhoContributed;
                        if(students.indexOf(regno) != -1)
                        {
                            mainArray[index].marks[averageKey] = ""+parseFloat(parseFloat(foundObject.totalMarks)/students.length).toFixed(2)+(" (of "+students.length+" students)");
                        }
                        else
                        {
                            var newStudentsArray = students;
                            newStudentsArray.push(regno);
                            var newTotalMarks = ""+(parseFloat(foundObject.totalMarks)+parseFloat(currentScore))
                            mainArray[index].marks[averageKey] = ""+parseFloat(parseFloat(newTotalMarks)/newStudentsArray.length).toFixed(2)+(" (of "+newStudentsArray.length+" students)")
                            var newData = {
                                totalStudentsWhoContributed : newStudentsArray,
                                totalMarks : newTotalMarks
                            }
                            db.totalMarksTable.update({_id: foundObject._id}, newData, {upsert: true}, function(err){});
                        }
                    }
                }
                callback();
            });
        }






        var $ = cheerio.load(response.body);

        var trs = $('table').eq(0).children();
        for(var i=1 ; i<trs.length ; i+=2)
        {
            var tds = trs.eq(i).children();
            var textArray = [];
            for(var m=0; m<tds.length ; m++)
            {
                textArray.push(tds.eq(m).text().trim());
            }

            if(textArray.length == 10)
            {
                tempJson = {
                    "Class Id": textArray[1],
                    "Course Code": textArray[2],
                    "Course Title": textArray[3],
                    "Course Type": textArray[4],
                    "Faculty": textArray[7],
                    "slot": textArray[8],
                    "keys": [],
                    "marks": {},
                    "mainMarksKeys": [],
                    "scoredMarksArray": []
                };
                var innerTds = trs.eq(i+1).children();
                for(var p=0 ; p<innerTds.length ; p++)
                {
                    var innerTable = innerTds.eq(p).children().eq(0);
                    if(innerTable && innerTable['0'] && innerTable['0'].name == "table")
                    {
                        var innerTrs = innerTable.children();
                        var totalScoredMarks = 0;
                        var totalMaxMarks = 0;
                        for(q=1 ; q<innerTrs.length ; q++)
                        {
                            textArray = [];
                            tds = innerTrs.eq(q).children();
                            for(var n=0; n<tds.length ; n++)
                            {
                                textArray.push(tds.eq(n).text().trim());
                            }
                            if(textArray.length == 7 || textArray.length == 8)
                            {
                                var totalMarks = textArray[2];
                                var scoredMarks = textArray[5];
                                var weightage = textArray[3];
                                if(scoredMarks.length == 1){scoredMarks = "0"+scoredMarks;}
                                if(totalMarks.length == 1){totalMarks = "0"+totalMarks;}
                                totalMarks = addDotIfNotExist(totalMarks)
                                scoredMarks = addDotIfNotExist(scoredMarks)
                                var key = textArray[1];
                                if(key == "Continous Assessment Test - I")
                                	key = "CAT - I"
                                else if(key == "Continous Assessment Test - II")
                                	key = "CAT - II"
                                var averageKey = "Average of "+key;
                                var weightageKey = "Weightage of "+key;
                                var totalMaxMarksKey = "Total Max of "+key;
                                tempJson.keys.push("\n"+key);
                                tempJson[weightageKey] = weightage
                                tempJson[totalMaxMarksKey] = totalMarks
                                tempJson.mainMarksKeys.push("\n"+key);
                                tempJson.keys.push(averageKey);
                                tempJson.marks["\n"+key] = scoredMarks + " / " + totalMarks;
                                tempJson.scoredMarksArray.push(scoredMarks);
                                tempJson.marks[averageKey] = "0";
                                if(key == "Additional Learning" && ((tempJson["Course Type"].toLowerCase() == "embedded theory") || (tempJson["Course Type"].toLowerCase() == "eth") || (tempJson["Course Type"].toLowerCase() == "theory only" || (tempJson["Course Type"].toLowerCase() == "th"))))
                                {
                                    totalScoredMarks += (((parseFloat(scoredMarks) / parseFloat(totalMarks)))*parseFloat(weightage))
                                }
                                else
                                {
                                    totalScoredMarks += (((parseFloat(scoredMarks) / parseFloat(totalMarks)))*parseFloat(weightage))
                                    totalMaxMarks += parseFloat(weightage)
                                }
                            }
                        }
                    }
                }

                if(parseFloat(totalScoredMarks) > parseFloat(totalMaxMarks))
                    totalScoredMarks = totalMaxMarks

                tempJson.marks["\nTotal Weightage"] = parseFloat(totalScoredMarks).toFixed(2) + " / " + parseFloat(totalMaxMarks).toFixed(2)
                tempJson.keys.push("\nTotal Weightage")
                mainArray.push(tempJson);
                getAverageOfClass(mainArray.length - 1, tempJson["Class Id"], tempJson.mainMarksKeys, tempJson.scoredMarksArray)

                
            }
        }

    });
 

});

function addDotIfNotExist(marks)
{
    if(marks.indexOf(".") == -1)
    {
        marks = marks+".00";
    }
    return marks;
}

module.exports = router;
