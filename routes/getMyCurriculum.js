var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var constants = require('../constants');
var unirest = require('unirest');
var getResponseFromLink = require('./getResponseFromLink');
var sendMyCurriculum = require('./sendMyCurriculum');
var getResponseFromLinkVtopBeta = require('./getResponseFromLinkVtopBeta');

function seeIf17StudentThenSendTheResponse(regno, password, res)
{
	if(regno.substr(0, 2) == "17")
	{
		sendMyCurriculumNewVtopBeta(regno, password, function(mainJsonSending){
			res.send(mainJsonSending);
		});
		return true;
	}

	return false;
}


router.post('/', function(req, res, next) {
  	
  	
  	var regno = req.body.regno;
  	var password = req.body.password;

  	if(seeIf17StudentThenSendTheResponse(regno, password, res))
  	{
  		return;
  	}

  	var link = "https://vtop.vit.ac.in/student/clm_details_studview.asp";

  	

	getResponseFromLink("GET", {}, link, regno, password, function(response){



		if(typeof response == 'string')
		{
			var message = '{"code" : "5001", "message" : "'+response+'"}';
			sendMyCurriculum("WrongLogin");
			return;
		}

		function getArrayData(table, type=undefined)
		{
			var trs = table.children();
			var textArray = []
			var mainArray = [];
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
					textArray[0] != "" &&
					textArray[1] != "" &&
					textArray[2] != "" &&
					textArray[3] != "" &&
					textArray[4] != "" &&
					textArray[5] != "" &&
					textArray[6] != "" &&
					textArray[0] != "Course Code"
					)
				{
					var courseCode = textArray[0];
					var courseName = textArray[1];
					var L = textArray[2];
					var T = textArray[3];
					var P = textArray[4];
					var J = textArray[5];
					var C = textArray[6];
					var preRequisite = (textArray[7]=="")?"NONE":textArray[7];
					var gradeEarned = (textArray[8] == "")?"...":textArray[8];
					try{
						if(type && ((trs.eq(i+1).children().length) == 1))
						{
							var newSubjects = getInnerArray(trs.eq(i+1).children().eq(0).children().eq(0));
							for(var y=0 ; y<newSubjects.length ; y++)
							{
								if(newSubjects[y].gradeEarned == "...")
									mainArray.push(newSubjects[y]);
								else
									mainArray.splice(0, 0, newSubjects[y]);
							}
							continue
						}

					}
					catch(e){}

					if(gradeEarned == "...")
						mainArray.push({
							courseCode : courseCode,
							courseName : courseName,
							components : "L-"+L+", T-"+T+", P-"+P+", J-"+J,
							totalCredits: C,
							preRequisite : preRequisite,
							gradeEarned : gradeEarned
						});
					else
						mainArray.splice(0, 0, {
							courseCode : courseCode,
							courseName : courseName,
							components : "L-"+L+", T-"+T+", P-"+P+", J-"+J,
							totalCredits: C,
							preRequisite : preRequisite,
							gradeEarned : gradeEarned
						});

				}
				
			}

			return mainArray;
		}

		var $ = cheerio.load(response.body)
		var tables = $('table');

		var mainJson = {
			UC: [],
			PC: [],
			PE: [],
			UE: [],
			UCCredits: "-",
			PCCredits: "-",
			UECredits: "-",
			PECredits: "-"
		};

		
		for(var i=0 ; i<tables.length ; i++)
		{
			var heading = tables.eq(i).children().eq(0).children().eq(0).text().trim();
			if(heading.toLowerCase().indexOf("university core") !== -1)
			{
				
				mainJson.UC = getArrayData(tables.eq(i), "university core")
			}

			else if(heading.toLowerCase().indexOf("programme core") !== -1)
			{
				
				mainJson.PC = getArrayData(tables.eq(i))
			}

			else if(heading.toLowerCase().indexOf("programme elective") !== -1)
			{
				
				mainJson.PE = getArrayData(tables.eq(i))
			}

			else if(heading.toLowerCase().indexOf("university elective") !== -1)
			{
				
				mainJson.UE = getArrayData(tables.eq(i))
			}

			else if(heading.toLowerCase().indexOf("breakup of courses") !== -1)
			{
				
				var trs = tables.eq(i).children();
				var textArray = []
				var mainArray = [];
				for(var i=1 ; i<trs.length ; i++)
				{
					var tds = trs.eq(i).children();
					textArray = [];
					for(var j=0 ; j<tds.length ; j++)
					{
						textArray.push(tds.eq(j).text().trim())
					}
					if(textArray.length == 4)
					{
						if(textArray[1].toLowerCase().indexOf("university core") !== -1)
						{
							mainJson.UCCredits = textArray[3]+" / "+textArray[2];
						}
						else if(textArray[1].toLowerCase().indexOf("university elective") !== -1)
						{
							mainJson.UECredits = textArray[3]+" / "+textArray[2];
						}
						else if(textArray[1].toLowerCase().indexOf("programme core") !== -1)
						{
							mainJson.PCCredits = textArray[3]+" / "+textArray[2];
						}
						else if(textArray[1].toLowerCase().indexOf("programme elective") !== -1)
						{
							mainJson.PECredits = textArray[3]+" / "+textArray[2];
						}
					}
				}
			}
		}

		res.send(mainJson)

		

		
		
	});


});

function getInnerArray(table)
{
	var trs = table.children();
	var textArray = []
	var allSubjectsArray = [];
	var gradesEarnedArray = [];
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
			textArray[0] != "" &&
			textArray[1] != "" &&
			textArray[2] != "" &&
			textArray[3] != "" &&
			textArray[4] != "" &&
			textArray[5] != "" &&
			textArray[6] != "" &&
			textArray[0] != "Course Code"
			)
		{
			var courseCode = textArray[0];
			var courseName = textArray[1];
			var L = textArray[2];
			var T = textArray[3];
			var P = textArray[4];
			var J = textArray[5];
			var C = textArray[6];
			var preRequisite = (textArray[7]=="")?"NONE":textArray[7];
			var gradeEarned = (textArray[8] == "")?"...":textArray[8];
			if(gradeEarned == "...")
			{
				allSubjectsArray.push({
					courseCode : courseCode,
					courseName : courseName,
					components : "L-"+L+", T-"+T+", P-"+P+", J-"+J,
					totalCredits: C,
					preRequisite : preRequisite,
					gradeEarned : gradeEarned
				})
			}
			else
			{
				allSubjectsArray.splice(0, 0, {
					courseCode : courseCode,
					courseName : courseName,
					components : "L-"+L+", T-"+T+", P-"+P+", J-"+J,
					totalCredits: C,
					preRequisite : preRequisite,
					gradeEarned : gradeEarned
				})

				gradesEarnedArray.splice(0, 0, {
					courseCode : courseCode,
					courseName : courseName,
					components : "L-"+L+", T-"+T+", P-"+P+", J-"+J,
					totalCredits: C,
					preRequisite : preRequisite,
					gradeEarned : gradeEarned
				})
			}

		}
	}

	if(gradesEarnedArray.length > 0)
	{
		return gradesEarnedArray
	}
	else
	{
		return allSubjectsArray
	}
}

function sendMyCurriculumNewVtopBeta(regno, password, callback)
{
	var link = "https://vtopbeta.vit.ac.in/vtop/academics/common/Curriculum";
	var mainJson = {
			UC: [],
			PC: [],
			PE: [],
			UE: [],
			UCCredits: "-",
			PCCredits: "-",
			UECredits: "-",
			PECredits: "-"
		};

	getResponseFromLinkVtopBeta("POSTTwice", {verifyMenu: "true"}, link, regno, password, function(response, cookieJar){

		if(typeof response == 'string')
		{
			var message = '{"code" : "5001", "message" : "'+response+'"}';
			callback(mainJson);
			return;
		}



		function getArrayData(table, type=undefined)
		{
			var trs = table.children().children();
			var textArray = []
			var mainArray = [];
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
					textArray[0] != "" &&
					textArray[1] != "" &&
					textArray[2] != "" &&
					textArray[3] != "" &&
					textArray[4] != "" &&
					textArray[5] != "" &&
					textArray[6] != "" &&
					textArray[1] != "Course Code"
					)
				{
					var courseCode = textArray[1];
					var courseName = textArray[2];
					var L = textArray[4];
					var T = textArray[5];
					var P = textArray[6];
					var J = textArray[7];
					var C = textArray[8];
					var preRequisite = "NONE";
					var gradeEarned = "...";

					if(gradeEarned == "...")
						mainArray.push({
							courseCode : courseCode,
							courseName : courseName,
							components : "L-"+L+", T-"+T+", P-"+P+", J-"+J,
							totalCredits: C,
							preRequisite : preRequisite,
							gradeEarned : gradeEarned
						});
					else
						mainArray.splice(0, 0, {
							courseCode : courseCode,
							courseName : courseName,
							components : "L-"+L+", T-"+T+", P-"+P+", J-"+J,
							totalCredits: C,
							preRequisite : preRequisite,
							gradeEarned : gradeEarned
						});

				}
				
			}

			return mainArray;
		}

		var $ = cheerio.load(response.body);

		var PCTable = $('table[id="example1"]');
		var PETable = $('table[id="example2"]');
		var UCTable = $('table[id="example3"]');
		var UETable = $('table[id="example4"]');

		

		mainJson.PC =  getArrayData(PCTable)
		mainJson.PE =  getArrayData(PETable)
		mainJson.UC =  getArrayData(UCTable)
		mainJson.UE =  getArrayData(UETable)

		callback(mainJson)







	});
}



module.exports = router;
