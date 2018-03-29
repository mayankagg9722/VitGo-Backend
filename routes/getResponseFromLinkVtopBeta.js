var unirest = require('unirest');
var cheerio = require('cheerio');
var getCaptcha = require('./getCaptchaVtopBeta');

var captchaLink = 'https://vtopbeta.vit.ac.in/vtop/';
var loginLink = 'https://vtopbeta.vit.ac.in/vtop/processLogin';

var request;
var headers = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-IN,en-GB;q=0.8,en-US;q=0.6,en;q=0.4',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'DNT': '1',
      'Cookie': '',
      'Host': 'vtopbeta.vit.ac.in',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36'
    };

function getResponseFromLink(method, data, link, regNo, password, callback)
{
	var cookiejar = new unirest.jar();
	var cookies = [];

	var handleCaptcha = function(response)
	{
        
		// console.log(1)
		if(response.error)
		{
			callback(("Error - " + response.error), cookiejar);
			return;
		}


        
    	getCaptcha(response.body, function(captcha){

    		// console.log(2)
            
            if(captcha.length != 6 || captcha == "")
            {
                cookiejar = new unirest.jar();
                cookies = [];
                
                new unirest.get(captchaLink)
                .header(headers)
                .followAllRedirects(true)
                .strictSSL(false)
                .jar(cookiejar)
                .end(handleCaptcha);
            }
            else
            {
                loginToFFCS(captcha)
            }

            
        });
	}

	var loginToFFCS = function(captcha)
	{
        
        // console.log(3)
		new unirest.post(loginLink)
    	.form({
      		uname: regNo,
      		passwd: password,
      		captchaCheck: captcha
    	})
    	.header(headers)
        .followAllRedirects(true)
    	.strictSSL(false)
    	.jar(cookiejar)
    	.end(getMainLink);
	}

	var getMainLink = function(response)
	{
        
        // console.log(4)
		if (response.body == null) 
		{
            callback("VIT Server Down", cookiejar);
        }
    	else 
    	{
    		var $ = cheerio.load(response.body);
    		var allP = $('p');
    		for(var i=0 ; i<allP.length ; i++)
    		{
    			var p = allP[i];
    			if(p.attribs)
    			{
    				if (p.attribs.class)
    				{
    					if(p.attribs.class == "box-title text-danger")
    					{
    						if($(p).text())
    						{
    							if($(p).text() == "Invalid Username/Password, Please try again")
    							{
    								callback("Invalid Credentials", cookiejar);
    								return;
    							}
                                if($(p).text() == "User does not exist")
                                {
                                    callback("User does not exist", cookiejar);
                                    return;
                                }
                                if($(p).text() == "Invalid Captcha")
                                {
                                    
                                    new unirest.get(captchaLink)
                                    .header(headers)
                                    .followAllRedirects(true)
                                    .strictSSL(false)
                                    .jar(cookiejar)
                                    .end(handleCaptcha);
                                    return;
                                }
    						}
    					}

    					if(p.attribs.class == "box-title text-success")
    					{
    						if($(p).text())
    						{
    							if($(p).text().match("OTP has been sent to your registered") ||
    								$(p).text().match("Last successful OTP triggered"))
    							{
    								var callbackMessage = "Your account is locked and OTP has been sent to registered mobile number, please unlock your account."
    								callback(callbackMessage, cookiejar);
    								return;
    							}
    						}
    					}
    				}
    			}
    		}

    		new unirest.get("https://vtopbeta.vit.ac.in/vtop/vtop/mandatory/data/off")
				.header(headers)
				.jar(cookiejar)
                .followAllRedirects(true)
				.strictSSL(false)
				.end(function(resDontUSe){



		            if(link == "/")
		            {
		                returnCallback(resDontUSe)
		            }
		    		else if(method == "POST")
		    		{
						new unirest.post(link)
						.header(headers)
						.jar(cookiejar)
						.form(data)
		                .followAllRedirects(true)
						.strictSSL(false)
						.end(returnCallback);
		    		}
		            else if(method == "POSTTwice")
		            {
		                new unirest.post(link)
		                .header(headers)
		                .jar(cookiejar)
		                .form(data)
		                .followAllRedirects(true)
		                .strictSSL(false)
		                .end(function(response){
		                    new unirest.post(link)
		                    .header(headers)
		                    .jar(cookiejar)
		                    .form(data)
		                    .followAllRedirects(true)
		                    .strictSSL(false)
		                    .end(returnCallback);
		                });
		            }
		    		else
		    		{
						new unirest.get(link)
		                .followAllRedirects(true)
						.header(headers)
						.jar(cookiejar)
						.strictSSL(false)
						.end(returnCallback);
		    		}

    		});



		}

        
	}

	var returnCallback = function(response)
	{
        // console.log(5)
        var newCookieJar = new unirest.jar();

        cookiesArray = Object.keys(cookiejar);

        for(var i=0 ; i<cookiesArray.length ; i++)
        {
            newCookieJar[cookiesArray[i]] = cookiejar[cookiesArray[i]];
        }
        
        
		callback(response, newCookieJar);
	}

    cookiejar = new unirest.jar();
    cookies = [];
    
	new unirest.get(captchaLink)
	.header(headers)
	.followAllRedirects(true)
	.strictSSL(false)
	.jar(cookiejar)
	.end(handleCaptcha);
}

module.exports = getResponseFromLink;