var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLink');
var cheerio = require('cheerio');

router.post('/', function (req, res, next) {

	var regno = req.body.regno;
	var password = req.body.password;
	var sem = req.body.sem;
	var classnbr = req.body.classnbr;
	var crscd = req.body.crscd;
	var crstp = req.body.crstp;


	var data = {
		"sem" : ""+sem,
		"classnbr" : ""+classnbr,
		"crscd" : ""+crscd,
		"crstp" : ""+crstp
	};

	var link = "https://vtop.vit.ac.in/student/marks_da_process.asp";

	if(crstp == "EPJ")
	{
		link = "https://vtop.vit.ac.in/student/marks_pjt_process.asp";
	}
	
	getResponseFromLink("POST", data, link, regno, password, function(response){

		if(typeof response == 'string')
		{
			var message = '{"code" : "5001", "message" : "' + response + '"}';
			res.end(message);
			return;
		}

		var jsonObj = {
			"code" : "5003",
			"data"  : []
		}

		var $ = cheerio.load(response.body);
		var trs = $('tr');
		var mainArray = [];
		for(var i=0 ; i<trs.length ; i++)
		{
			var text = $(trs).eq(i).text().trim();
			//res.write('tddd\n');
			

			var reg = /^\d{1,2}[^\d]/;

			if(text.match(reg))
			{
				var arr = text.split('\n');
				//var sno = arr[0].trim();
				var title = "";
				var score = "";
				var dueDate = "";
				var maximumMarks = "";
				var marksJsonObj = {};
				for (var j=1 ; j<arr.length ; j++)
				{
					var arrText = arr[j].trim();
					if(arrText.toLowerCase() == "blocked" || arrText.toLowerCase() == "accept" || arrText == "")
					{
						continue;
					}

					var titleReg = /[A-za-z]{1}/;
					if(title == "" && arrText.match(titleReg))
					{
						title = arrText;
					}

					var scoreReg = /^\d{1,}(.\d{1,})$/;
					if(score == "" && arrText.match(scoreReg))
					{
						score = arrText;
					}

					var dueDateReg = /^(\d{1,2})-([A-za-z]{1,4})-(\d{1,4})$/;
					if(dueDate == "" && arrText.match(dueDateReg) )
					{
						dueDate = arrText;
					}

				}

				marksJsonObj = {
					"title" : title,
					"dueDate" : dueDate,
					"score" : score
				}
				jsonObj.code = "200";
				mainArray.push(marksJsonObj);
			}

		}

		jsonObj.data = mainArray;
		res.send(jsonObj);



	});




});

module.exports = router;
