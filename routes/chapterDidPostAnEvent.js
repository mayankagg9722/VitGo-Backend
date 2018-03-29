var express = require('express');
var router = express.Router();
var db = require('../config_db');
var fs = require('fs');
var multer = require('multer');
var upload = multer({dest : './public/posters/'});
var im = require('imagemagick');

function isNumeric(value) {
    return /^\d+$/.test(value);
}

function removeSpaces(str)
{
  str = str.split(" ").join("");
  return str;
}

function isFutureDate(idate){
    var today = new Date(),
        idate = idate.split("-");

    if(idate.length != 3)
    {
      return false;
    }

    if(!isNumeric(idate[0]) || !isNumeric(idate[1] || !isNumeric[2]))
    {
      return false;
    }



    idate = new Date(idate[2], idate[1] - 1, idate[0]);
    today.setHours(0,0,0,0);
    idate.setHours(0,0,0,0);
    return (today - idate) <= 0 ? true : false;
}

function validateTime(timeStr)
{
  var timeRegex = /^([0]\d|\d|[1][0-2]):([0-5]\d)\s?(?:AM|PM)$/i;

  return timeRegex.test(timeStr);
}


router.post('/', upload.any(), function(req, res, next) {

  if(!req.files)
  {
    res.render("chapterDidPostAnEvent", {message:"Image upload is a must."});
    return;
  }

  if(req.files.length != 1)
  {
    res.render("chapterDidPostAnEvent", {message:"One image need to be uploaded. Please try again."});
    return;
  }

  var fieldArray = [];

  if(req.body.fields)
  {
    fieldArray = req.body.fields;
  }
  
  var eventName = req.body.eventName;
  var venue = req.body.venue;
  var description = req.body.description;
  var date = req.body.date;
  var time = req.body.timepicker;
  var fees = req.body.fees || "0";
  var tempPath = req.files[0].path;
  var mimetype = req.files[0].mimetype;

  var size = req.files[0].size;

  if(size > "1000000")
  {
    res.render("chapterDidPostAnEvent", {message:"Image size should not be more than 2mb."});
    return;
  }



  if(fees == "")
  {
    feed = "0";
  }

  if( eventName == "" || eventName == undefined ||
  	 venue == "" || venue == undefined ||
  	 description == "" || description == undefined ||
     time == "" || time == undefined ||
     fees == "" || fees == undefined ||
  	 date == "" || date == undefined ||
     mimetype == "" || mimetype == undefined ||
     tempPath == "" || tempPath == undefined || !isNumeric(fees))
  {
  	//res.send("Please fill all the fields! ERR_CODE 1");
    res.render("chapterDidPostAnEvent", {message:"Please fill all the fields!\nOnly registration fee field can be left empty.\n ERR_CODE 1"});
  	return;
  }

  description = description.split("\r\n").join("\n");


  if(!req.session.id)
  {
    //res.send("Session Timed out. Please Login again.");
    res.render("chapterDidPostAnEvent", {message:"Session Timed out. Please Login again."});
    return;
  }

  var chapterId = req.session.id;

  if(!isFutureDate(date))
  {
    //res.send("Please specify the today or the future date.");
    res.render("chapterDidPostAnEvent", {message:"Please specify the today or the future date."});
    return;
  }

  time = removeSpaces(time);

  if(!validateTime(time))
  {
    //res.send("Please give the correct time.");
    res.render("chapterDidPostAnEvent", {message:"Please give the correct time."});
    return;
  }

  if(mimetype != 'image/jpeg' && mimetype != 'image/png')
  {
    //res.send("Please uplaod png/jpg images only");
    res.render("chapterDidPostAnEvent", {message:"Please uplaod png/jpg images only."});
    return;
  }

  db.chaptersTable.findById(chapterId, function(err, foundObject)
  {
    if(err)
    {
      //res.send("Database Error, please try again.");
      res.render("chapterDidPostAnEvent", {message:"Database Error, please try again."});
      return;
    }
    
      var event = new db.eventsTable();
      event.chapterId = chapterId;
      event.chapterName = foundObject.chapterName;
      event.eventName = eventName;
      event.venue = venue;
      event.description = description;
      event.date = date;
      event.time = time;
      event.fees = fees;
      event.going = "0";
      event.fields = fieldArray;

      event.save(function(err, savedObject)
      {
      	if(err)
      	{
      		//res.send("Please try Again! ERR_CODE 2");
          res.render("chapterDidPostAnEvent", {message:"Please try Again! ERR_CODE 2"});
      		return;
      	}

        var imageName = savedObject._id;//+"."+(mimetype.split("/")[1]);
      	fs.rename(tempPath, "./public/posters/"+imageName, function(err){
          if(err)
          {
            //res.send("Image upload failed :(");
            res.render("chapterDidPostAnEvent", {message:"Image upload failed :("});
            return;
          }


          //res.send("Okay");
          res.render("chapterDidPostAnEvent", {message:"Done"});

        });

      });
  });


  

});

module.exports = router;
