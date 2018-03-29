var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var getResponseFromLink = require('./getResponseFromLink');

router.post('/', function(req, res, next) {
  
  	var regno = req.body.regno;
  	var password = req.body.password;
  	var link = "https://vtop.vit.ac.in/student/stud_dftpswd.asp";
  	getResponseFromLink("GET", {}, link, regno, password, function(response){

  		if(typeof response == 'string')
  		{
        var message = '{"code" : "5001", "message" : "'+response+'"}';
			  res.end(message);
        return;
  		}
      
      var $ = cheerio.load(response.body);
      var tds = $('td');

      var jsonObj = {
        "code" : "5003",
        "email" : "",
        "password" : ""
      }


      for (var i=0 ; i<tds.length ; i++)
      {
        var text = $(tds).eq(i).text().trim();

        var emailReg = /^([A-Za-z0-9.]{1,})(@{1})([A-Za-z.]{1,})$/;

        if(jsonObj.email == "" && text.match(emailReg))
        {
          jsonObj.email = text;
        }

        var passwordReg = /^\d{1,}$/;

        if(jsonObj.email != "" && text.match(passwordReg))
        {
          jsonObj.password = text;
          jsonObj.code = "200";
          break;
        }

      }

      res.send(jsonObj);
      


  	});
	
});

module.exports = router;
