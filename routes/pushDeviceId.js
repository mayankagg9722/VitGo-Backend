var express = require('express');
var router = express.Router();
var db = require('../config_db');


router.post('/', function (req, res, next) {

    var platform = req.body.platform;
    var deviceId = req.body.deviceId;

    if(platform == "" || platform == undefined ||
        deviceId == "" || deviceId == undefined)
    {
        res.send('{"code":"5005", "message":"Error"}');
        return;
    }


    db.deviceIdsTable.find({platform:platform}, function(err, foundData){

        if(err)
        {
            res.send('{"code":"5006", "message":"Error"}');
        }
        else if(foundData.length != 0)
        {
            db.deviceIdsTable.update({platform:platform}, {$set:{deviceId:deviceId}}, function(err, result) {

              if(err)
              {
                res.send('{"code":"5007", "message":"Error"}');
              }
              else
              {
                res.send('{"code":"200", "message":"OK"}');
              }

            });
        }
        else
        {
            var newDeviceId = new db.deviceIdsTable();
            newDeviceId.platform = platform;
            newDeviceId.deviceId = deviceId;
            newDeviceId.save(function(err, savedObject){

                if(err)
                {
                    res.send('{"code":"5006", "message":"Error"}');
                }
                else
                {
                    res.send('{"code":"200", "message":"OK"}');
                }
            });
        }

    });


    


   
});

module.exports = router;
