
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

mongoose.connect('mongodb://navdeeshtakeCarePlease:takeCare@ds035846.mlab.com:35846/navdeeshahuja', {useMongoClient: true});

var chaptersSchema = mongoose.Schema({

	chapterId : { type: String, index: true },
	password : String,
	chapterName : String

});

var eventsSchema = mongoose.Schema({

	chapterId : { type: String, index: true },
	chapterName : String,
	eventName : String,
	venue : String,
	description : String,
	date : String,
	time : String,
	fees : String,
	going : String,
	fields : Array
});

var registeredStudentsSchema = mongoose.Schema({

	eventId : { type: String, index: true },
	regno : String,
	name : String,
	fields : Array
});

var deviceIdsSchema = mongoose.Schema({

	platform: { type: String, index: true },
	deviceId: { type: String, index: true }

});

var facultyPhoneNumbersSchema = mongoose.Schema({

	empid: { type: String, index: true },
	phoneNumber: String

});


var facultyInformationSchema = mongoose.Schema({

	empid: { type: String, index: true },
	phoneNumber: String,
	name: String,
	designation: String,
	school: String,
	venue: String,
	email: String,
	intercom: String,
	photo: String
});

var totalMarksSchema = mongoose.Schema({

	classId: { type: String, index: true },
	totalStudentsWhoContributed: Array,
	totalMarks: String,
	marksTitle: { type: String, index: true }

});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'error connecting with mongodb database:'));

db.once('open', function() {
  console.log('connected to mongodb database');
});    

db.on('disconnected', function () {
   //Reconnect on timeout
   mongoose.connect(config.mongoUrl);
   db = mongoose.connection;
});


var chaptersTable = mongoose.model('chapters', chaptersSchema, 'chapters');
var eventsTable = mongoose.model('events', eventsSchema, 'events');
var registeredStudentsTable = mongoose.model('registrations', registeredStudentsSchema, 'registrations');
var deviceIdsTable = mongoose.model('deviceIds', deviceIdsSchema, 'deviceIds');
var facultyPhoneNumbersTable = mongoose.model('facultyPhoneNumbers', facultyPhoneNumbersSchema, 'facultyPhoneNumbers');
var facultyInformationTable = mongoose.model('facultyInformation', facultyInformationSchema, 'facultyInformation');
var totalMarksTable = mongoose.model('totalMarks', totalMarksSchema, 'totalMarks');


exports.chaptersTable = chaptersTable;
exports.eventsTable = eventsTable;
exports.registeredStudentsTable = registeredStudentsTable;
exports.deviceIdsTable = deviceIdsTable;
exports.facultyPhoneNumbersTable = facultyPhoneNumbersTable;
exports.facultyInformationTable = facultyInformationTable;
exports.totalMarksTable = totalMarksTable;


