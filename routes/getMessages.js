var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var getResponseFromLink = require('./getResponseFromLink');

router.post('/', function(req, res, next) {
  
  	var regno = req.body.regno;
  	var password = req.body.password;
  	var link = "https://vtop.vit.ac.in/student/stud_home.asp";
  	getResponseFromLink("GET", {}, link, regno, password, function(response){

  		if(typeof response == 'string')
  		{
  			var message = '{"code" : "5001", "message" : "'+response+'"}';
			res.end(message);
  			return;
  		}
      
      var $ = cheerio.load(response.body);
      var tables = $('table');
      var table = $(tables)['4'];
      var json = {
          "messages" : [],
          "code" : "200"
        };
      var mainArray = [];
      var message = [];

      for (k=0 ; k<tables.length ; k++)
      {
        var trs = $(tables).eq(k).children();
        message = [];
        for (i=0; i<trs.length ; i++)
        {
          var text = $(trs).eq(i).text();
          text = text.split('\r\n').join(' ');
          text = text.split('\t').join('');
          text = text.trim();
          //console.log(text);
          var label = text.split(':')[0].trim();
          var labelArray = ['Faculty', 'Message', 'Coordinator', 'Course Title', 'Course', 'Sent On', 'Advisor'];
          if(labelArray.indexOf(label) != -1)
            message.push(text);
          if(text=="" && message.length != 0)
          {
            mainArray.push(message);
            message = [];
          }
        }
      }

      mainArray = processMainArray(mainArray);

      json.messages = mainArray;
      res.send(json);
  		


  	});
	
});

function removeLabel(component)
{
  var components = component.split(":");
  components[0] = "";
  component = components.join(":");
  component = component.substr(1).trim();

  return component;
}

function processMainArray(mainArray)
{
  for (var i=0 ; i<mainArray.length ; i++)
  {
    var messageArray = mainArray[i];
    var jsonObj = {};
    for (var j=0 ; j<messageArray.length ; j++)
    {
      var component = messageArray[j];
      component = removeLabel(component);
      jsonObj[j] = component;
    }
    mainArray[i] = jsonObj;
  }

  var newArray = [];

  for (var i=0 ; i<mainArray.length ; i++)
  {

    if(Object.keys(mainArray[i]).length > 1)
    {
      newArray.push(mainArray[i]);
    }
  }

  return newArray;
}

module.exports = router;



