var express = require('express');
var router = express.Router();
var db = require('../config_db');

/* GET home page. */
router.get('/', function(req, res, next) {

  if(!req.session.id)
  {
    res.redirect("/login?timedOut=1");
    return;
  }

  var chapterId = req.session.id;
  db.chaptersTable.findById(chapterId, function(err, foundObject){
    if(err)
    {
      res.send("Error Code 5004");
      return;
    }
    var chapterName = foundObject.chapterName;
    res.render("home", {"chapterName" : chapterName});

  });
  
  
});

module.exports = router;
