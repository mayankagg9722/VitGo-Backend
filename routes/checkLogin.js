var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var unirest = require('unirest');
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
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

router.post('/', function(req, res, next) {
  	
  	
  	var regno = req.body.regno;
  	var password = req.body.password;
  	var link = "https://vtopbeta.vit.ac.in/vtop/studentsRecord/SearchRegnoStudent";
  	var isFaculty = false;
  	if(regno.length == 4 || regno.length == 5 || regno.length == 6)
  	{
  		isFaculty = true;
  		link = "/";
  	}
	getResponseFromLink("POST", {verifyMenu:true}, link, regno, password, function(response, cookiejar){



		if(typeof response == 'string')
		{
			var message = '{"code" : "5001", "message" : "'+response+'", "dob" : ""}';
			res.end(message);
			return;
		}
		else
		{
			if(response.body == undefined)
			{
				var message = '{"code" : "200", "message" : "'+regno+'", "dob" : ""}';
				res.end(message);
				return;
			}

			if(isFaculty)
			{
				var $ = cheerio.load(response.body);
				var name = $('p').eq(0).text();
				var message = '{"code" : "200", "message" : "'+name+'", "dob" : ""}';
				res.end(message);
				return;
			}

			unirest.post(link)
        	.header(headers)
        	.jar(cookiejar)
        	.form({verifyMenu:true})
        	.followAllRedirects(true)
        	.strictSSL(false)
        	.end(function(response){

        		

				var $ = cheerio.load(response.body);
				var nameAndDOB = getNameAndDOB($, regno, password);
				var name = nameAndDOB[0];
				var DOB = nameAndDOB[1];
				var message = '{"code" : "200", "message" : "'+name+'", "dob" : "'+DOB+'"}';
				res.end(message);
				return;
			});
		}
	});
});

var getNameAndDOB = function($, regno, password)
{
	var name = "";
	var dob = "";

	var trs = $($($('table').eq(0)).children());
	name = $(trs.eq(2)).children().eq(1).text();
	dob = $(trs.eq(3)).children().eq(1).text();
	
	try{
		return [name, modified(dob)];
	} catch(e)
	{
		
		return [name, dob];
	}
}

var modified = function(date)
{
	var arr = date.split("-")
	var monthNumberJson = {
		"jan" : "01",
		"feb" : "02",
		"mar" : "03",
		"apr" : "04",
		"may" : "05",
		"jun" : "06",
		"jul" : "07",
		"aug" : "08",
		"sep" : "09",
		"oct" : "10",
		"nov" : "11",
		"dec" : "12",
	}
	arr[1] = monthNumberJson[arr[1].toLowerCase()];
	return arr.join("-");
}


module.exports = router;
