var cheerio = require('cheerio');
var atob = require('atob');
var fs = require('fs');
var path = require('path');
var Jimp = require('jimp');
var keys = require('./keys');



var getSourceAttributeString = function(htmlResponse)
{
    var $ = cheerio.load(htmlResponse);
    var imgTags = $('img');
    for(var i=0 ; i<imgTags.length ; i++)
    {
        var img = imgTags[i];
        if(img)
        {
            if(img.attribs)
            {
                if(img.attribs.alt)
                {
                    if(img.attribs.alt == "vtopCaptcha")
                    {
                        return img.attribs.src;
                    }
                }
            }
        }
    }
}


var getCaptcha = function(htmlResponse, callback)
{
    var dataURI = getSourceAttributeString(htmlResponse);
    var imageName = makeRandomString();
    imgSave(dataURI, 'public/captchas', imageName, function(err){

        if(err)
        {
            // console.log(err);
            callback("")
            return;
        }

        var newImage = new Jimp(180, 45, 0xFFFFFFFF, function (err, newImage) {
            Jimp.read(('public/captchas/'+imageName+".png"), function (err, image){
            
                image.greyscale(function(err, image){
                    if(err)
                    {
                        console.log(err);
                        callback("")
                    }

                    var charPositionsOfX = [];
                    var characters = []

                    var needToSkip = function(x)
                    {
                        for(var i=0 ; i<charPositionsOfX.length ; i++)
                        {
                            if(x >= charPositionsOfX[i][0] &&  x<=charPositionsOfX[i][1])
                            {
                                return true
                            }
                        }
                        return false
                    }

                    

                    for(var x=0 ; x<180 ; x++)
                    {
                        for(var y=11 ; y<25 ; y++)
                        {
                            if(needToSkip(x))
                            {
                                continue
                            }



                            var maskArray = keys.keysArray;
                            for(var d=0 ; d<maskArray.length ; d++)
                            {
                                var maskName = maskArray[d];
                                var mask = keys[maskName];
                                var maskXLength = mask[0].length;
                                var maskYLength = mask.length;
                                var endingXIndex = x+maskXLength;
                                var endingYIndex = y+maskYLength;
                                if(endingXIndex >= 180 || endingYIndex >= 45)
                                {
                                    continue
                                }

                                var maskMatched=true;
                                

                                for(var innerX = x ; innerX<endingXIndex ; innerX++)
                                {
                                    for(var innerY = y ; innerY<endingYIndex ; innerY++)
                                    {
                                        var valueOfPixel = image.getPixelColor(innerX, innerY);

                                        var maskX = innerX - x;
                                        var maskY = innerY - y;
                                        

                                        if(mask[maskY][maskX] == 1)
                                        {
                                            if(valueOfPixel == 4278124287) // check if the pixel is white pixel
                                            {
                                                maskMatched = false;
                                                break
                                            }
                                        }
                                        
                                    }
                                    if(!maskMatched)
                                    {
                                        break
                                    }
                                }

                                if(maskMatched)
                                {
                                    charPositionsOfX.push([x, endingXIndex])
                                    characters.push(maskName)
                                    if(characters.length == 6)
                                    {
                                        var returningCaptcha = getReturningCaptcha(charPositionsOfX, characters);
                                        callback(returningCaptcha)
                                        // newImage.write("public/see.jpg");
                                        fs.unlink('public/captchas/'+imageName+".png");
                                        return;
                                    }
                                    break
                                }
                            }
                        }
                    }

                    var returningCaptcha = getReturningCaptcha(charPositionsOfX, characters);
                    callback(returningCaptcha)
                    // newImage.write("public/see.jpg");
                    fs.unlink('public/captchas/'+imageName+".png");

                });


            });
        });

    });
}




var imgSave = function(data, destpath, name, callback) {
  var result = img(data);
  if(result == null)
  {
    callback("MultipleTabsAccessError");
    return;
  }
  var filepath = path.join(destpath, name + result.extname);

  fs.writeFile(filepath, result.base64, { encoding: 'base64' }, function(err) {
    callback(err, filepath);
  });
};





function img(data) {

    if(data)
    {
      return {
        extname: '.png',
        base64: data.substr(23)
      };
    }
    else
    {
        return null;
    }
}

function makeRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 17; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


function getReturningCaptcha(positionsArray, characters)
{
    var xPos = []
    for(var i=0 ; i<positionsArray.length ; i++)
    {
        for(var j=i ; j<positionsArray.length-1 ; j++)
        {
            if(positionsArray[j][0] > positionsArray[j+1][0])
            {
                var temp = positionsArray[j]
                positionsArray[j] = positionsArray[j+1]
                positionsArray[j+1] = temp

                temp = characters[j]
                characters[j] = characters[j+1]
                characters[j+1] = temp
            }
        }
    }

    return characters.join('');
}

module.exports = getCaptcha;







