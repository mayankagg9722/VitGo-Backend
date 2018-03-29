var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('client-sessions');
var compression = require('compression');
var facultyAllowedUrls = ['/getCookieTimetable', '/checkCookieLogin'];


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));


//app.use(logger('dev'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



app.all('*', function (req, res, next) {
  var date = new Date();
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  res.header("Access-Control-Max-Age", "36000");
  res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With,auth-token");
  if(req && req.body && req.body.regno)
  {
    
  }
  if(req && req.body && req.body.regno && req.body.regno.length != 9 && req.body.regno.length != 4 && req.body.regno.length != 5 && req.body.regno.length != 6)
  {
    res.send({"code" : "5001", "message" : "User does not exist. Please check for spaces in register number."});
  }
  else
  {
    if((req && req.body && req.body.regno) && (req.body.regno.length == 4 || req.body.regno.length == 5 || req.body.regno.length == 6))
    {
      if(facultyAllowedUrls.indexOf(req.originalUrl) == -1)
      {
        res.send({"code" : "5009", "message" : "This service is not for you. Sorry :("});
        return;
      }
    }
    next();
  }
});


app.use(session(
{
  cookieName : 'session',
  secret : '6789kjhv567b2uvh34',
  duration : (10 * 60 * 1000),
  activeDuration : (10 * 60 * 1000)
}
));










var index = require('./routes/index')
var checkLogin = require('./routes/checkLogin');
var getTimetable = require('./routes/getTimetable');
var getMessages = require('./routes/getMessages');
var getMarks = require('./routes/getMarks');
var getMarks2 = require('./routes/getMarks2');
var getDigitalAssignments = require('./routes/getDigitalAssignments');
var getDigitalAssignmentMarks = require('./routes/getDigitalAssignmentMarks');
var getDefaultEmailAndPassword = require('./routes/getDefaultEmailAndPassword');
var searchFaculty = require('./routes/searchFaculty');
var getFaculty = require('./routes/getFaculty');
var getExamSchedule = require('./routes/getExamSchedule');
var getAttendance = require('./routes/getAttendance');
var detailAttendance = require('./routes/detailAttendance');
var getGrades = require('./routes/getGrades');
var getLeaves = require('./routes/getLeaves');
var cancelLeave = require('./routes/cancelLeave');
var cancelLateHour = require('./routes/cancelLateHour');
var applyOuting = require('./routes/applyOuting');
var applyHometownLeave = require('./routes/applyHometownLeave');
var getLateHourPermission = require('./routes/getLateHourPermission');
var applyLateHour = require('./routes/applyLateHour');
var getCourses = require('./routes/getCourses');
var getClasses = require('./routes/getClasses');
var getCoursePage = require('./routes/getCoursePage');
var checkParams = require('./routes/checkParams');
var loaderio = require('./routes/loaderio');
var makeFacultyJson = require('./routes/makeFacultyJson');
var login = require('./routes/login');
var oauth = require('./routes/oauth');
var playawmicks = require('./routes/playawmicks');
var pushChaptersFromAwMicks = require('./routes/pushChaptersFromAwMicks');
var home = require('./routes/home');
var postEventForm = require('./routes/postEventForm');
var chapterDidPostAnEvent = require('./routes/chapterDidPostAnEvent');
var chapterDidPostEventImage = require('./routes/chapterDidPostEventImage');
var getEvents = require('./routes/getEvents');
var getEventsAndroid = require('./routes/getEventsAndroid');
var registerEvent = require('./routes/registerEvent');
//var changePassword = require('./routes/changePassword');
//var changePasswordAuth = require('./routes/changePasswordAuth');
//var seeAllEventsPosted = require('./routes/seeAllEventsPosted');
//var seeEventRegistrations = require('./routes/seeEventRegistrations');
//var logout = require('./routes/logout');
var pushDeviceId = require('./routes/pushDeviceId');
var getMessagesAndAssignments = require('./routes/getMessagesAndAssignments');
var getMessagesAndAssignmentsTest = require('./routes/getMessagesAndAssignmentsTest');
var getSpotlight = require('./routes/getSpotlight');
var getCoursePageFaculties = require('./routes/getCoursePageFaculties');
var getCoursePageInDetail = require('./routes/getCoursePageInDetail');
var getProctor = require('./routes/getProctor');
var getAcademicHistory = require('./routes/getAcademicHistory');
var getMyCurriculum = require('./routes/getMyCurriculum');
var checkResultStatus = require('./routes/checkResultStatus');



app.use('/getCookieMyCurriculum', getMyCurriculum);
app.use('/getCookieAcademicHistory', getAcademicHistory);
app.use('/aeplaynavi', index);
app.use('/checkCookieLogin', checkLogin);
app.use('/getCookieTimetable', getTimetable);
app.use('/getCookieMessages', getMessages);
app.use('/getCookieMarks', getMarks);
app.use('/getCookieMarks2', getMarks2);
app.use('/getCookieDigitalAssignments', getDigitalAssignments);
app.use('/getCookieDigitalAssignmentMarks', getDigitalAssignmentMarks);
app.use('/getCookieDefaultEmailAndPassword', getDefaultEmailAndPassword);
app.use('/searchCookieFaculty', searchFaculty);
app.use('/getCookieFaculty', getFaculty);
app.use('/getCookieExamSchedule', getExamSchedule);
app.use('/getCookieAttendance', getAttendance);
app.use('/detailCookieAttendance', detailAttendance);
app.use('/getCookieGrades', getGrades);
app.use('/getCookieLeaves', getLeaves);
app.use('/cancelCookieLeave', cancelLeave);
app.use('/cancelCookieLateHour', cancelLateHour);
app.use('/applyCookieOuting', applyOuting);
app.use('/applyCookieHometownLeave', applyHometownLeave);
app.use('/getCookieLateHourPermission', getLateHourPermission);
app.use('/applyCookieLateHour', applyLateHour);
app.use('/getCookieCourses', getCourses);
app.use('/getCookieClasses', getClasses);
app.use('/getCookieCoursePage', getCoursePage);
app.use('/checkCookieParams', checkParams);
app.use('/loaderio-440e28f4c094b06a7a23a5d79c02e6af', loaderio);
app.use('/makeCookieFacultyJson', makeFacultyJson);
app.use('/login', login);
app.use('/oauth', oauth);
app.use('/playawmicks', playawmicks);
app.use('/pushChaptersFromAwMicks', pushChaptersFromAwMicks);
app.use('/home', home);
app.use('/postEventForm', postEventForm);
app.use('/chapterDidPostAnEvent', chapterDidPostAnEvent);
app.use('/chapterDidPostEventImage', chapterDidPostEventImage);
app.use('/getCookieEvents', getEvents);
app.use('/getCookieEventsAndroid', getEventsAndroid);
app.use('/registerCookieEvent', registerEvent);
// app.use('/changePassword', changePassword);
// app.use('/changePasswordAuth', changePasswordAuth);
// app.use('/seeAllEventsPosted', seeAllEventsPosted);
// app.use('/seeEventRegistrations', seeEventRegistrations);
// app.use('/logout', logout);
app.use('/pushDeviceId', pushDeviceId);
app.use('/getMessagesAndAssignments', getMessagesAndAssignments);
app.use('/getMessagesAndAssignmentsTest', getMessagesAndAssignmentsTest);
app.use('/getCookieSpotlight', getSpotlight);
app.use('/getCoursePageFaculties', getCoursePageFaculties);
app.use('/getCoursePageInDetail', getCoursePageInDetail);
app.use('/getCookieProctor', getProctor);
app.use('/checkResultStatus', checkResultStatus);



















// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);

    res.render('error', {
      message: "Not Authorized",
    error: "Not Authorized"
    });
    // res.render('error', {
    //   message: err.message,
    //   error: err
    // });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
   res.render('error', {
    message: "Not Authorized",
    error: "Not Authorized"
  }); 
                      // res.render('error', {
                      //     message: err.message,
                      //     error: {}
                      //   });
});


module.exports = app;
