var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var getResponseFromLinkWithCookies = require('./getResponseFromLinkVtopBeta');


router.post('/', function(req, res, next) {

        var regno = req.body.regno;
        var password = req.body.password;
        var link = "/";
        getResponseFromLinkWithCookies("POST", {}, link, regno, password, function(response, cookiesJson){

                if(typeof response == 'string')
                {
                        var message = '{"code" : "5001", "message" : "'+response+'"}';
                          res.end(message);
                        return;
                }

      var body = response.body;

      var json = {
        "body" : body,
        "cookiesJson" : cookiesJson
      };

      res.send(json);



        });

});


module.exports = router;

