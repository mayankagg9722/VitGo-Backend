var unirest = require('unirest');
var cheerio = require('cheerio');
var captchaDecoder = require('./captchaDecoder')

const captchaLink = 'https://vtop.vit.ac.in/student/captcha.asp';
const loginLink = 'https://vtop.vit.ac.in/student/stud_login_submit.asp';

var request;

var emptyJson = {};

function getResponseFromLinkWithCookies(method, data, link, regNo, password, callback)
{

	var cookiejar = unirest.jar();
	var cookies = [];

	const handleCaptcha = function(response)
	{
		if(response.error)
		{
			callback("Error - " + response.error, emptyJson);
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
            callback("VIT Server Down", emptyJson);
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
	                callback("Invalid Credentials", emptyJson);
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
					.end(returnMainLinkPost);
	        	}
	        	else
	        	{
	        		unirest.get(link)
					.jar(cookiejar)
					.strictSSL(false)
					.end(returnMainLinkGet);
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
		.end(callCallbackFinally);
	}

	const returnMainLinkGet = function(response)
	{
		unirest.get(link)
		.jar(cookiejar)
		.strictSSL(false)
		.end(callCallbackFinally);
	}

	const callCallbackFinally = function(response)
	{
		var resJson = {};
    	for (var i=0 ; i<cookies.length ; i++)
		{
			var cookieString = cookies[i];
			var cookieName = cookieString.split('=')[0];
			var cookieValue = cookieString.split('=')[1];
			resJson[cookieName] = cookieValue;
		}
		
		callback(response, resJson);
	}

	unirest.get(captchaLink)
	.encoding(null)
	.strictSSL(false)
	.end(handleCaptcha);
}

module.exports = getResponseFromLinkWithCookies;
