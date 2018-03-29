var express = require('express');
var router = express.Router();
var db = require('../config_db');
var fs = require('fs');
var fileUpload = require('express-fileupload');


router.post('/', function(req, res, next) {
  
  if(!req.session.imageName)
  {
    res.send("Session Time out. Please login again.");
    return;
  }



  
  res.send("fakeDone");
  

  // fs.readFile(req.files.poster.path, function(err, data){

  //   if(err)
  //   {
  //     res.send("Some Error Occurred");
  //     return;
  //   }

  //   var newPath = __dirname +"/posters/"+req.session.imageName+".png";
  //   fs.writeFile(newPath, data, function(err){
  //     res.send("Uploaded");
  //     //res.redirect('/project?projectPosted=1');
  //   });

              
  // });



});

module.exports = router;
