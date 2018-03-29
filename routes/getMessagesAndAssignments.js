var express = require('express');
var router = express.Router();
var getDigitalAssignments = require('./getDigitalAssignments');
var getDigitalAssignmentMarks = require('./getDigitalAssignmentMarks');

router.post('/', function(req, res, next) {
  
  	var regno = req.body.regno;
  	var password = req.body.password;
    
    var resJson = {
        "code" : "200",
        "assignments" : [],
        "messages" : []
    };

    var assignmentsDataArray = [];
    var assignmentCallbackCounter = 0;

    function handleMarksObj(marksObjectResponse, index)
    {
    	
        assignmentCallbackCounter++;
        assignmentsDataArray[index].marksOb = marksObjectResponse;
        if(assignmentCallbackCounter == assignmentsDataArray.length)
        {
            resJson.assignments = assignmentsDataArray;
            res.send(resJson);
        }
    }

    var getAssignments = function(assignmentsResponse, cookiejar)
    {
        assignmentsDataArray = assignmentsResponse.data;
        
        if(assignmentsDataArray.length == 0)
        {
            res.send(resJson);
            return;
        }
        for(var i=0 ; i<assignmentsDataArray.length ; i++)
        {
            var assignment = assignmentsDataArray[i];
            var fakeRequestObject = {
                body : {
                    regno : req.body.regno,
                    password : req.body.password,
                    classnbr : assignment["ClassNbr"],
                    crscd : assignment["Course Code"],
                    crstp : assignment.post_parameters[3],
                }
            };

            var fakeResponseObject = {
                exportFunction : handleMarksObj
            };

            getDigitalAssignmentMarks.handleRequest(fakeRequestObject, fakeResponseObject, undefined, cookiejar, i);

        }
    }

    var fakeResponseObjectForDigitalAssignments = {
        exportFunction : getAssignments
    }
    getDigitalAssignments.handleRequest(req, fakeResponseObjectForDigitalAssignments);
    
  	
});

module.exports = router;



