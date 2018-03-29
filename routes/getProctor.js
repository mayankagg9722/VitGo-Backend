var express = require('express');
var router = express.Router();
var getResponseFromLink = require('./getResponseFromLinkVtopBeta');
var cheerio = require('cheerio');
var unirest = require('unirest');
var db = require('../config_db');
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


router.post('/', function (req, res, next) {

	var regno = req.body.regno;
    var password = req.body.password;

    var link = "https://vtopbeta.vit.ac.in/vtop/proctor/viewProctorDetails";
    getResponseFromLink("POST", {verifyMenu:true}, link, regno, password, function (response, cookiejar) {

        if (typeof response == 'string') {

            var message = '{"code" : "5001", "message" : "' + response + '"}';
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

			        var resJson = {
			            "name" : "",
			            "designation" : "",
			            "school" : "",
			            "venue" : "",
			            "email" : "",
			            "intercom" : "",
			            "mobile" : "",
			            "photo" : ""
			        };

			        var $ = cheerio.load(response.body);

			        var tables = $('table');

			        var trs = $($(tables.eq(0)).children());

			        var imgTag = $($($(trs.eq(0)).children()).eq(2)).children();
			        if(imgTag && imgTag['0'] && imgTag['0'].attribs && imgTag['0'].attribs.src)
			        {
			            resJson.photo = imgTag['0'].attribs.src.split('base64,')[1];
			        }

			        var empid = $(trs.eq(0)).children().eq(1).text();

			        resJson.name = $(trs.eq(1)).children().eq(1).text();

			        resJson.designation = $(trs.eq(2)).children().eq(1).text();

			        resJson.school = $(trs.eq(3)).children().eq(1).text();

			        resJson.venue = $(trs.eq(4)).children().eq(1).text();

			        resJson.email = $(trs.eq(6)).children().eq(1).text();

			        resJson.intercom = $(trs.eq(7)).children().eq(1).text();

			        resJson.mobile = $(trs.eq(8)).children().eq(1).text();

			        var mobile = resJson.mobile;

			        resJson.empid = empid;
			        
			        db.facultyInformationTable.findOne({empid: empid}, function(err, foundObject){
			            if(!err)
			            {
			                if(foundObject == null)
			                {
			                    var newFaculty = new db.facultyInformationTable();
			                    newFaculty.empid = empid;
			                    newFaculty.phoneNumber = mobile;
			                    newFaculty.name = resJson.name;
			                    newFaculty.designation = resJson.designation;
			                    newFaculty.school = resJson.school;
			                    newFaculty.venue = resJson.venue;
			                    newFaculty.email = resJson.email;
			                    newFaculty.intercom = resJson.intercom;
			                    newFaculty.photo = resJson.photo;
			                    newFaculty.save();
			                }
			                else if(foundObject.phoneNumber != mobile || foundObject.venue != resJson.venue || foundObject.email != resJson.email || foundObject.intercom != resJson.intercom || foundObject.school != resJson.school || foundObject.designation != resJson.designation)
			                {
			                	var newData = {
                                	phoneNumber : mobile,
                                	venue : resJson.venue,
                                	email : resJson.email,
                                	intercom : resJson.intercom,
                                	school : resJson.school,
                                	designation : resJson.designation
                            	}
			                	db.facultyInformationTable.update({_id: foundObject._id}, newData, {upsert: true}, function(err){});
			                }
			            }
			        });
			        
			        res.send(resJson);


			});        
    });

});

module.exports = router;
