var unirest = require('unirest');
var cheerio = require('cheerio');
var captchaDecoder = require('./captchaDecoder')

const captchaLink = 'https://vtop.vit.ac.in/student/captcha.asp';
const loginLink = 'https://vtop.vit.ac.in/student/stud_login_submit.asp';

var request;

function getResponseFromLinkOnlyOnce(method, data, link, regNo, password, callback)
{

	var cookiejar = unirest.jar();
	var cookies = [];

	const handleCaptcha = function(response)
	{
		if(response.error)
		{
			callback("Error - " + response.error);
			return;
		}
		var pixelmap = captchaDecoder.getPixelMapFromBuffer(response.body);
		var cookieName = Object.keys(response.cookies)[0];
        var cookie = cookieName + "=" + response.cookies[cookieName];
        cookies = [cookie];
        var captcha = captchaDecoder.getCaptcha(pixelmap);
		loginToFFCS(captcha);
	}

	const loginToFFCS = function(captcha)
	{
		for (var i=0 ; i<cookies.length ; i++)
		{
			//console.log('loginTO: '+cookies[i]);
			cookiejar.add(cookies[i], loginLink);
		}
		unirest.post(loginLink)
		.jar(cookiejar)
		.strictSSL(false)
		.form({
			regno: regNo,
            passwd: password,
            vrfcd: captcha
		})
		.end(getMainLink);
	}

	const getMainLink = function(response)
	{
		if (response.body == null) 
		{
            callback("VIT Server Down");
        }
    	else 
    	{
    		var cookieName = Object.keys(response.cookies)[0];
        	var cookie = cookieName + "=" + response.cookies[cookieName];
        	cookies.push(cookie);
        	var $ = cheerio.load(response.body);
	        tables = $('table');
	        table = $(tables[2]);
	        tr = $(table).children()['0'];
	        tr_children = $(tr).children();

	        if ($($(tr_children['0']).children()['4'])['0'] && $($(tr_children['0']).children()['4'])['0'].attribs.name == "stud_login") 
	        {
            	if($('input')['0'].attribs.value=='Verification Code does not match.  Enter exactly as shown.')
            	{
                	//console.log('CaptchaFailed');
                	unirest.get(captchaLink)
					.encoding(null)
					.strictSSL(false)
					.end(handleCaptcha);
	            }
	            else
	            {
	                callback("Invalid Credentials");
	            }
	        }
	        else
	        {
	        	for (var i=0 ; i<cookies.length ; i++)
				{
					//console.log('linkTO: '+cookies[i]);
					cookiejar.add(cookies[i], link);
				}
				
	        	if(method == "POST")
	        	{
	        		unirest.post(link)
					.jar(cookiejar)
					.form(data)
					.strictSSL(false)
					.end(callback);
	        	}
	        	else
	        	{
	        		unirest.get(link)
					.jar(cookiejar)
					.strictSSL(false)
					.end(callbacks);
	        	}
	        }
		}
	}

	const returnMainLinkPost = function(response)
	{
		unirest.post(link)
		.jar(cookiejar)
		.form(data)
		.strictSSL(false)
		.end(callback);
	}

	const returnMainLinkGet = function(response)
	{
		unirest.get(link)
		.jar(cookiejar)
		.strictSSL(false)
		.end(callback);
	}

	unirest.get(captchaLink)
	.encoding(null)
	.strictSSL(false)
	.end(handleCaptcha);
}

module.exports = getResponseFromLinkOnlyOnce;