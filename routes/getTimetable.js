var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var constants = require('../constants');
var unirest = require('unirest');
var getAttendance = require('./getAttendance');


var timetableHtmlTableId = "timeTableStyle";
var slotRegex = /^[A-z]{1,3}[0-9]{1,2}$/i;
var slotRegex2 = /^Z$/; //  because there exist a slot Z sadly
var timeRegex = /^\d{2}\:\d{2}$/;


router.post('/', function(req, res, next) {
  
  	var regno = req.body.regno;
  	var password = req.body.password;
  	var link = "https://vtopbeta.vit.ac.in/vtop/processViewTimeTable";
  	var isFaculty = false;
  	if(regno.length == 4 || regno.length == 5 || regno.length == 6)
  	{
  		isFaculty = true;
  		link = "https://vtopbeta.vit.ac.in/vtop/academics/common/viewFacultyWorkLoad";
  	}
  	var data = {semesterSubId : constants.semesterSubId};
  	var facultyArray = [];
  	var mainArray = [];

  	var mainSendingJsonBody = {};

  	var fakeResponseObject = {
  		send: function(responseObject){ handleResponses("attendance", responseObject) }
  	}

  	var callback = 0;

  	function handleResponses(type, jsonBody)
  	{
  		callback++;
  		if(type == "timetable")
  		{
  			if(mainSendingJsonBody == {})
  			{
  				mainSendingJsonBody = jsonBody;
  			}
  			else
  			{
  				var tempAttendanceObject = mainSendingJsonBody.attendance;
  				mainSendingJsonBody = jsonBody;
  				mainSendingJsonBody.attendance = tempAttendanceObject;
  			}
  		}
  		else
  		{
  			mainSendingJsonBody.attendance = jsonBody
  		}
  		if(callback == 2)
  		{
  			res.send(mainSendingJsonBody);
  		}
  	}

	getResponseFromLink("POST", data, link, regno, password, function(response, cookiejar){

		getAttendance.handlePostRequest(req, fakeResponseObject, undefined, cookiejar, isFaculty, response);

		if(typeof response == 'string')
		{
			var message = '{"code" : "5001", "message" : "'+response+'"}';
			res.end(message);
			return;
		}

		

		var $ = cheerio.load(response.body);
		var tables = $('table');
		var jsonData = {
				code : "5002",
				timetable : [],
				faculties : []
			};
		var facultiesArray = [];

		

		
				var table = $(tables).eq(0);
				var facultyHtmlTable = $(table['0']).children();
				var trs = $(facultyHtmlTable);
				for (var i = 0 ; i<trs.length ; i++)
				{
					var text = makeText(trs[i], $);
					var textArray = text.split("\n\t");
					trimArray(textArray);
						
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
			            var facultyName = textArray[33]
			            
			    		if(textArray.length == 43)
			    		{
			    			courseName = textArray[10]
			    			courseType = textArray[13]
			    			facultyName = textArray[33]
			    		}
			            if(textArray.length == 45)
			            {
		                    courseName = textArray[10]
		                    courseType = textArray[13]
		                    facultyName = textArray[35]
			            }
			            if(textArray.length == 48)
			            {
		                    courseName = textArray[10]
		                    courseType = textArray[13]
		                    facultyName = textArray[38]
			            }

			            if(textArray.length == 54)
			            {
		                    courseName = textArray[10]
		                    courseType = textArray[13]
		                    facultyName = textArray[44]
			            }
			            if(textArray.length == 60)
			            {
		                    courseName = textArray[10]
		                    courseType = textArray[13]
		                    facultyName = textArray[50]
			            }
			            if(textArray.length == 51)
			            {
		                    courseName = textArray[10]
		                    courseType = textArray[13]
		                    facultyName = textArray[41]
			            }
			            if(textArray.length == 57)
			            {
		                    courseName = textArray[10]
		                    courseType = textArray[13]
		                    facultyName = textArray[47]
			            }
						if(isFaculty)
						{
							courseName = textArray[3];
							courseType = getFullCourseType(textArray[4]);
							facultyName = "Class Scheduled";
						}

						var subJson = {
            				courseName: courseName,
            				courseType: courseType,
            				facultyName: facultyName
        				};
        				facultyArray.push(subJson);
					}

				}	

		for (var l=1 ; l<tables.length ; l++)
		{
			var table = $(tables).eq(l);

			if(table['0'])
			{
				if(table['0'].attribs)
				{
					if(table['0'].attribs.id)
					{
						if(table['0'].attribs.id == timetableHtmlTableId)
						{
							jsonData.code = "200";
							
							var timetableHtmlTable = $(table['0']).children();
							var trs = $(timetableHtmlTable);
							var subArray = [];
							for (i = 0 ; i<trs.length ; i++)
							{
								var tds = $(trs[i]).children();
								if(i>0 && i%2==0)
								{
									mainArray.push(subArray);
									subArray = [];
								}

								var lunchDidCome = false;
								var labEndTimingLunchCame = false;

								for (j = 0 ; j<tds.length ; j++)
								{
									var td = $(tds).eq(j);
									var text = $(td).text().trim();

									if(i == 0 && j == 0)
									{
										text = "THEORY HOURS";
									}
									if(i == 2 && j == 0)
									{
										text = "LAB HOURS";
									}
									if(text == "-")
									{
										text = "";
									}
									if(text.toLowerCase() == "start" || text.toLowerCase() == "end" ||
										text.toLowerCase() == "theory" || text.toLowerCase() == "lab" ||
										text.toLowerCase() == "lunch" )
									{
										if(i>=3 && text.toLowerCase() == "lunch")
										{
											labEndTimingLunchCame = true;
											lunchDidCome = true;
										}

										continue;
									}

									if(text.match(slotRegex) || text.match(slotRegex2))
									{
										text = "";
									}
									if(i<4)
									{
										if(text.match(timeRegex))
										{
											text = tConv24(text);
										}

										if(i!=0 && i%2!=0)
										{
											if(i==1 && text == "" && subArray[j] == "")
											{
												lunchDidCome = true;
												continue;
											}

											if(i == 3 && labEndTimingLunchCame)
											{
												lunchDidCome = true;
											}
											var movingIndex = j;
											if(lunchDidCome)
												movingIndex--;
											if(!(text == "" && subArray[movingIndex] == ""))
												subArray[movingIndex] = subArray[movingIndex] + "to" + text;
										}
										else
										{
											subArray.push(text);
										}
									}
									else if(i%2 != 0)
									{
										if(text != "")
										{
											text = replace3And4(text);
											var movingIndex = j;
											if(lunchDidCome)
												movingIndex--;
											subArray[movingIndex] = text;
										}
									}
									else
									{
										text = replace3And4(text);
										subArray.push(text);
									}
								}
								
							}
							mainArray.push(subArray);
						}
					}
				}
			}
		}

		jsonData.timetable = mainArray;
		jsonData.faculties = facultyArray;

		handleResponses("timetable", jsonData);
		return;
		
	});
	
});

function trimArray(arr)
{
    for (var i=0 ; i<arr.length ; i++)
        arr[i] = arr[i].trim();
}

function tConv24(time24) {
  var ts = time24;
  var H = +ts.substr(0, 2);
  var h = (H % 12) || 12;
  h = (h < 10)?("0"+h):h;  // leading 0 at the left for 1 digit hours
  var ampm = H < 12 ? " AM" : " PM";
  ts = h + ts.substr(2, 3) + ampm;
  return ts;
};

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

var replace3And4 = function(text)
{
	var textArray = text.split("-")
	if(textArray.length == 4)
	{
		var temp = textArray[2];
		textArray[2] = textArray[3];
		textArray[3] = temp;
	}
	text = textArray.join(" - ");
	return text;
}

module.exports = router;
