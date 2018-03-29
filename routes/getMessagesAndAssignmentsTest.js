var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var constants = require('../constants');
var getResponseFromLink = require('./getResponseFromLink');

function trimArray(arr)
{
    for (var i=0 ; i<arr.length ; i++)
        arr[i] = arr[i].trim();
}

function getUploadStatus(trs, i, crstp)
{
  var returningString = "Blocked";

  var inputs = trs.eq(i).find('input');

  if(crstp == "EPJ")
  {
    //find pjtprocmd

    var pjtprocmds = [];

    for (var i=0 ; i< inputs.length ; i++)
    {
      if(inputs.eq(i)['0'])
      {
        if(inputs.eq(i)['0'].attribs)
        {
          if(inputs.eq(i)['0'].attribs.name)
          {
            if(inputs.eq(i)['0'].attribs.name.trim() == 'pjtprocmd' && inputs.eq(i)['0'].attribs.value)
            {
              pjtprocmds.push(inputs.eq(i)['0'].attribs.value);
            }
          }
        }
      }
    }

    if(pjtprocmds.length > 0)
    {
      for (var i=0 ; i<pjtprocmds.length ; i++)
      {
        var cmd = pjtprocmds[i];
        if(cmd.toLowerCase().trim() == "view")
        {
          returningString = "Uploaded";
          break;
        }

        if(cmd.toLowerCase().trim() == "upload")
        {
          returningString = "Yet To Upload";
          break;
        }

        returningString = "Uploaded";

      }
    }

    // console.log(pjtprocmds);
    // console.log('\n\n\n\n\n\n\n\n\n\n\n\n');
  }
  else
  {
    //find daprocmd

    var daprocmds = [];

    for (var i=0 ; i< inputs.length ; i++)
    {
      if(inputs.eq(i)['0'])
      {
        if(inputs.eq(i)['0'].attribs)
        {
          if(inputs.eq(i)['0'].attribs.name)
          {
            if(inputs.eq(i)['0'].attribs.name.trim() == 'daprocmd' && inputs.eq(i)['0'].attribs.value)
            {
              daprocmds.push(inputs.eq(i)['0'].attribs.value);
            }
          }
        }
      }
    }

    if(daprocmds.length > 2)
    {
      for (var i=0 ; i<daprocmds.length ; i++)
      {
        var cmd = daprocmds[i];
        if(cmd.toLowerCase().trim() == "delete")
        {
          returningString = "Uploaded";
          break;
        }

        if(cmd.toLowerCase().trim() == "upload")
        {
          returningString = "Yet To Upload";
          break;
        }

        returningString = "Uploaded";

      }
    }


    // console.log(daprocmds);
    // console.log('\n\n\n\n\n\n\n\n\n\n\n\n');
  }

  return returningString;
}

function getDigitalAssignmentMarks(post_parameters, regno, password, index, callback)
{

  var sem = post_parameters[0];
  var classnbr = post_parameters[1];
  var crscd = post_parameters[2];
  var crstp = post_parameters[3];

  var link = "https://vtop.vit.ac.in/student/marks_da_process.asp";

  if(crstp == "EPJ")
  {
    link = "https://vtop.vit.ac.in/student/marks_pjt_process.asp";
  }

  var data = {
    "sem" : ""+sem,
    "classnbr" : ""+classnbr,
    "crscd" : ""+crscd,
    "crstp" : ""+crstp
  };

  getResponseFromLink("POST", data, link, regno, password, function(response){

    if(typeof response == 'string')
    {
      var message = '{"code" : "5001", "message" : "' + response + '"}';
      res.end(message);
      return;
    }

    var jsonObj = {
      "code" : "200",
      "data"  : []
    }

    var $ = cheerio.load(response.body);
    var trs = $('tr');
    var mainArray = [];

    for (var i=0 ; i<trs.length ; i++)
        {
            var text = trs.eq(i).text();
            var textArray = text.split('\r\n');
            trimArray(textArray);
            // console.log(textArray + " -> " + textArray.length);
            // console.log('\n\n\n\n\n\n\n\n\n\n\n\n');

            
            if(textArray.length == 52)
            {   
                /*
                ACCEPTED Digital Assignment
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                TITLE = 3
                DUE DATE = 6
                MAX MARKS = 9
                Status = 37
                Marks = 38
                */
                //console.log(textArray);
                var maxMarks = textArray[9];
                if(maxMarks.indexOf('.') == -1)
                {
                  maxMarks = maxMarks + ".00";
                }
                var score = textArray[38];
                if(score == "")
                {
                  score = "Not Given / "+maxMarks
                }
                else if(score.indexOf('.') == -1)
                {
                  score = score+".00";
                  score = score+ " / "+maxMarks;
                }
                else
                {
          score = score+ " / "+maxMarks;
                }
                var status = textArray[37];
                if(status == "")
                {
                    status = "-";
                }

                var uploadStatus = getUploadStatus(trs, i, crstp, crstp);

                var tempJsonObj = {
                    "title" : textArray[3],
                    "dueDate" : textArray[6],
                    "score" : score,
                    "status" : status,
                    "uploadStatus" : uploadStatus
                };
                mainArray.push(tempJsonObj);
            }
            else if(textArray.length == 28)
            {   
                /*
                Uploaded by faculty Digital Assignment
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                TITLE = 3
                DUE DATE = 6
                MAX MARKS = 9
                Status = nil
                Marks = nil
                */
                //console.log(textArray);
                var maxMarks = textArray[9];
                if(maxMarks.indexOf('.') == -1)
                {
                  maxMarks = maxMarks + ".00";
                }
                var score = "";
                if(score == "")
                {
                    score = "Not Given / "+maxMarks
                }
                else if(score.indexOf('.') == -1)
                {
                    score = score+".00";
                    score = score+ " / "+maxMarks;
                }
                else
                {
                    score = score+ " / "+maxMarks;
                }

                var uploadStatus = getUploadStatus(trs, i, crstp);
              
                var tempJsonObj = {
                    "title" : textArray[3],
                    "dueDate" : textArray[6],
                    "score" : score,
                    "status" : "-",
                    "uploadStatus" : uploadStatus
                };
               
                mainArray.push(tempJsonObj);
            }
            else if(textArray.length == 11)
            {   
                /*
                Uploaded by faculty Project
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                TITLE = 3
                DUE DATE = "Not Applicable"
                MAX MARKS = 4
                Status = 6
                Marks = 7
                */
                //console.log(textArray);
                var maxMarks = textArray[4];
                if(maxMarks.indexOf('.') == -1)
                {
                  maxMarks = maxMarks + ".00";
                }

                var score = textArray[7];
                if(score == "")
                {
                  score = "Not Given / "+maxMarks
                }
                else if(score.indexOf('.') == -1)
                {
                  score = score+".00";
                  score = score+ " / "+maxMarks;
                }
                else
                {
          score = score+ " / "+maxMarks;
                }

                var status = textArray[6];
                if(status == "")
                {
                  status = "-";
                }

                var uploadStatus = getUploadStatus(trs, i, crstp);

                var tempJsonObj = {
                    "title" : textArray[3],
                    "dueDate" : "Not Applicable",
                    "score" : score,
                    "status" : status,
                    "uploadStatus" : uploadStatus
                };
                mainArray.push(tempJsonObj);
            }
            else if(textArray.length == 23)
            {   
                /*
                ACCEPTED Digital Project
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                TITLE = 3
                DUE DATE = "Not Applicable"
                MAX MARKS = 4
                Status = 18
                Marks = 19
                */
                // console.log(textArray);
                var maxMarks = textArray[4];
                if(maxMarks.indexOf('.') == -1)
                {
                  maxMarks = maxMarks + ".00";
                }

                var score = textArray[19];
                if(score == "")
                {
                  score = "Not Given / "+maxMarks
                }
                else if(score.indexOf('.') == -1)
                {
                  score = score+".00";
                  score = score+ " / "+maxMarks;
                }
                else
                {
          score = score+ " / "+maxMarks;
                }

                var status = textArray[18];
                if(status == "")
                {
                  status = "-";
                }

                var uploadStatus = getUploadStatus(trs, i, crstp);

                var tempJsonObj = {
                    "title" : textArray[3],
                    "dueDate" : "Not Applicable",
                    "score" : score,
                    "status" : status,
                    "uploadStatus" : uploadStatus
                };
                mainArray.push(tempJsonObj);
            }
            else if(textArray.length == 39)
            {   
                /*
                ACCEPTED Digital Project
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                TITLE = 3
                DUE DATE = 6
                MAX MARKS = 9
                Status = 24
                Marks = 25
                */
                //console.log(textArray);
                var maxMarks = textArray[9];
                if(maxMarks.indexOf('.') == -1)
                {
                    maxMarks = maxMarks + ".00";
                }

                var score = textArray[25];
                if(score == "")
                {
                    score = "Not Given / "+maxMarks
                }
                else if(score.indexOf('.') == -1)
                {
                    score = score+".00";
                    score = score+ " / "+maxMarks;
                }
                else
                {
                    score = score+ " / "+maxMarks;
                }

                var status = textArray[24];
                if(status == "")
                {
                    status = "-";
                }

                var uploadStatus = getUploadStatus(trs, i, crstp);

                var tempJsonObj = {
                    "title" : textArray[3],
                    "dueDate" : textArray[6],
                    "score" : score,
                    "status" : status,
                    "uploadStatus" : uploadStatus
                };
                mainArray.push(tempJsonObj);
            }
            else if(textArray.length == 37)
            {   
                /*
                ACCEPTED Digital Project
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                TITLE = 3
                DUE DATE = 6
                MAX MARKS = 7
                Status = 22
                Marks = 23
                */
                // console.log(textArray);
                var maxMarks = textArray[7];
                if(maxMarks.indexOf('.') == -1)
                {
                    maxMarks = maxMarks + ".00";
                }

                var score = textArray[23];
                if(score == "")
                {
                    score = "Not Given / "+maxMarks
                }
                else if(score.indexOf('.') == -1)
                {
                    score = score+".00";
                    score = score+ " / "+maxMarks;
                }
                else
                {
                    score = score+ " / "+maxMarks;
                }

                var status = textArray[22];
                if(status == "")
                {
                    status = "-";
                }

                var uploadStatus = getUploadStatus(trs, i, crstp);

                var tempJsonObj = {
                    "title" : textArray[3],
                    "dueDate" : textArray[6],
                    "score" : score,
                    "status" : status,
                    "uploadStatus" : uploadStatus
                };
                mainArray.push(tempJsonObj);
            }
            else if(textArray.length == 50)
            {   
                /*
                ACCEPTED Digital Project
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                TITLE = 3
                DUE DATE = Not Applicable
                MAX MARKS = 7
                Status = 35
                Marks = 36
                */
                // console.log(textArray);
                var maxMarks = textArray[7];
                if(maxMarks.indexOf('.') == -1)
                {
                    maxMarks = maxMarks + ".00";
                }

                var score = textArray[36];
                if(score == "")
                {
                    score = "Not Given / "+maxMarks
                }
                else if(score.indexOf('.') == -1)
                {
                    score = score+".00";
                    score = score+ " / "+maxMarks;
                }
                else
                {
                    score = score+ " / "+maxMarks;
                }

                var status = textArray[35];
                if(status == "")
                {
                    status = "-";
                }

                var uploadStatus = getUploadStatus(trs, i, crstp);

                var tempJsonObj = {
                    "title" : textArray[3],
                    "dueDate" : "Not Applicable",
                    "score" : score,
                    "status" : status,
                    "uploadStatus" : uploadStatus
                };
                mainArray.push(tempJsonObj);
            }
            else if(textArray.length == 53)
            {   
                /*
                ACCEPTED Digital Project
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                TITLE = 3
                DUE DATE = Not Applicable
                MAX MARKS = 7
                Status = -
                Marks = 38
                */
                // console.log(textArray);
                var maxMarks = textArray[7];
                if(maxMarks.indexOf('.') == -1)
                {
                    maxMarks = maxMarks + ".00";
                }

                var score = textArray[38];
                if(score == "")
                {
                    score = "Not Given / "+maxMarks
                }
                else if(score.indexOf('.') == -1)
                {
                    score = score+".00";
                    score = score+ " / "+maxMarks;
                }
                else
                {
                    score = score+ " / "+maxMarks;
                }

                var status = textArray[37];
                if(status == "")
                {
                    status = "-";
                }

                var uploadStatus = getUploadStatus(trs, i, crstp);

                var tempJsonObj = {
                    "title" : textArray[3],
                    "dueDate" : "Not Applicable",
                    "score" : score,
                    "status" : status,
                    "uploadStatus" : uploadStatus
                };
                mainArray.push(tempJsonObj);
            }
            else if(textArray.length == 26)
            {   
                /*
                ACCEPTED Digital Project
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                TITLE = 3
                DUE DATE = 6
                MAX MARKS = 7
                Status = 18 -
                Marks = 23
                */
                // console.log(textArray);
                var maxMarks = textArray[7];
                if(maxMarks.indexOf('.') == -1)
                {
                    maxMarks = maxMarks + ".00";
                }

                var score = textArray[23];
                if(score == "")
                {
                    score = "Not Given / "+maxMarks
                }
                else if(score.indexOf('.') == -1)
                {
                    score = score+".00";
                    score = score+ " / "+maxMarks;
                }
                else
                {
                    score = score+ " / "+maxMarks;
                }

                var status = textArray[18];
                if(status == "")
                {
                    status = "-";
                }

                var uploadStatus = getUploadStatus(trs, i, crstp);

                var tempJsonObj = {
                    "title" : textArray[3],
                    "dueDate" : "Not Applicable",
                    "score" : score,
                    "status" : status,
                    "uploadStatus" : uploadStatus
                };
                mainArray.push(tempJsonObj);
            }
            else if(textArray.length == 55)
            {   
                /*
                ACCEPTED Digital Project
                HARDCODING INTEGERS HERE

                IF IN FUTURE, EVER UI CHANGES,
                SEE console.log(textArray);
                AND AGAIN HARDCODE VALUES
                TITLE = 3
                DUE DATE = 6
                MAX MARKS = 9
                Status = 18 -
                Marks = 23
                */
                // console.log(textArray);
                var maxMarks = textArray[9];
                if(maxMarks.indexOf('.') == -1)
                {
                    maxMarks = maxMarks + ".00";
                }

                var score = textArray[23];
                if(score == "")
                {
                    score = "Not Given / "+maxMarks
                }
                else if(score.indexOf('.') == -1)
                {
                    score = score+".00";
                    score = score+ " / "+maxMarks;
                }
                else
                {
                    score = score+ " / "+maxMarks;
                }

                var status = textArray[18];
                if(status == "")
                {
                    status = "-";
                }

                var uploadStatus = getUploadStatus(trs, i, crstp);

                var tempJsonObj = {
                    "title" : textArray[3],
                    "dueDate" : textArray[6],
                    "score" : score,
                    "status" : status,
                    "uploadStatus" : uploadStatus
                };
                mainArray.push(tempJsonObj);
            }
        }

    jsonObj.data = mainArray;
    callback(jsonObj, index);



  });
}

function sampleJson()
{
var obj = {
  "messages": [
    {
      "0": "NISHA P.V - Assistant Professor - SSL",
      "1": "Hi, Good Evening Students, Wish You all A Very Happy New Year!!!!! As the new semester has started i would like to intimate that all of you should check the mail or messages send to you both in students login and whatsup. Any change in the whatsup number should be informed to me.  All are supposed to meet me when called. With prior mail from the parents the leave will not be approved. Meet you all in person very soon. P V NISHA",
      "2": "04/01/2017 16:04:28"
    },
    {
      "0": "ETHNUS (APT) - ACAD",
      "1": "STS2002 - Soft Skills - SS",
      "2": "Dear students,   Assessment-3 (marks-20) will be conduct on 25th April 2017 ( Tueday ). Message from ETHNUS.",
      "3": "16/04/2017 00:25:13"
    },
    {
      "0": "GOVINDA K - SCOPE",
      "1": "CSE3009 - Internet  of Things - ETH",
      "2": "Dear Student,  The project demo starts fro 17/04/2017, come with working model.  by govinda.k",
      "3": "15/04/2017 15:40:28"
    },
{
"0":"NavdeeshAhuja",
"1":"SubjectGoesHere",
"2":"MessageHerenewyesssss xyz abc def ghi jkl",
"3":"17/04/2017 15:40:38"
},
{
"0":"mejhb hjb jssageshjdbchdjsfbewhjbw is herhbhjbnhjkbnjkne and kjnbjkbjkbkjhb want to show this message",
"1":"187/04/2017 87:45:92"
}
  ],
  "assignments": [
    {
      "ClassNbr": "2207",
      "Course Code": "CSE1004",
      "Course Title": "Network and Communication",
      "Course Type": "Embedded Theory",
      "Faculty": "SRIMATHI C - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2207",
        "CSE1004",
        "ETH"
      ],
      "marksOb": {
        "code": "200",
        "data": [
{
"title":"xyz"
},
{
"title":"abc"
},
          {
            "title": "Networking  Standards",
            "dueDate": "16-FEB-2017",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Packet tracer",
            "dueDate": "19-APR-2017",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          },
          {
            "title": "Case studies",
            "dueDate": "19-APR-2017",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          }
        ]
      }
    },
    {
      "ClassNbr": "2244",
      "Course Code": "CSE1004",
      "Course Title": "Network and Communication",
      "Course Type": "Embedded Lab",
      "Faculty": "SRIMATHI C - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2244",
        "CSE1004",
        "ELA"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Networking Hardware Devices and Networking Commands",
            "dueDate": "Not Applicable",
            "score": "Not Given / 5.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Hamming Code",
            "dueDate": "Not Applicable",
            "score": "Not Given / 5.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Cyclic Redundancy Check",
            "dueDate": "Not Applicable",
            "score": "Not Given / 5.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Go back N  ARQ or Selective Repeat ARQ",
            "dueDate": "Not Applicable",
            "score": "Not Given / 5.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "In Lab Practice -1",
            "dueDate": "Not Applicable",
            "score": "Not Given / 30.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Socket Programming",
            "dueDate": "Not Applicable",
            "score": "Not Given / 5.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          },
          {
            "title": "Classless addressing",
            "dueDate": "Not Applicable",
            "score": "Not Given / 5.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          }
        ]
      }
    },
    {
      "ClassNbr": "2298",
      "Course Code": "CSE1004",
      "Course Title": "Network and Communication",
      "Course Type": "Embedded Project",
      "Faculty": "SRIMATHI C - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2298",
        "CSE1004",
        "EPJ"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Review I",
            "dueDate": "Not Applicable",
            "score": "Not Given / 20.00",
            "status": "-",
            "uploadStatus": "Blocked"
          },
          {
            "title": "Review II",
            "dueDate": "Not Applicable",
            "score": "Not Given / 30.00",
            "status": "-",
            "uploadStatus": "Blocked"
          },
          {
            "title": "Review III",
            "dueDate": "Not Applicable",
            "score": "Not Given / 50.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          }
        ]
      }
    },
    {
      "ClassNbr": "2151",
      "Course Code": "CSE2006",
      "Course Title": "Microprocessor and Interfacing",
      "Course Type": "Embedded Theory",
      "Faculty": "NARAYANAMOORTHI M - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2151",
        "CSE2006",
        "ETH"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Introduction to Microprocessor-1",
            "dueDate": "31-MAR-2017",
            "score": "10.00 / 10.00",
            "status": "Accept",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Real Time Clock",
            "dueDate": "19-APR-2017",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          }
        ]
      }
    },
    {
      "ClassNbr": "2243",
      "Course Code": "CSE2006",
      "Course Title": "Microprocessor and Interfacing",
      "Course Type": "Embedded Lab",
      "Faculty": "NARAYANAMOORTHI M - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2243",
        "CSE2006",
        "ELA"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Study of 8086 Processor Architecture,Addressing Modes and Instruction sets",
            "dueDate": "Not Applicable",
            "score": "10.00 / 10.00",
            "status": "Accept",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Program to perform 8 bit and 16 bit arithmetic operations",
            "dueDate": "Not Applicable",
            "score": "10.00 / 10.00",
            "status": "Accept",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Program to find the factorial of an 8bit number and generation of fibonacc",
            "dueDate": "Not Applicable",
            "score": "10.00 / 10.00",
            "status": "Accept",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Program to perform block transfer of data and multibyte addition and subtra",
            "dueDate": "Not Applicable",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          },
          {
            "title": "program to find the largest and smallest element in an array",
            "dueDate": "Not Applicable",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          },
          {
            "title": "Program to perform sorting of n elements in an array and string manipulatio",
            "dueDate": "Not Applicable",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          },
          {
            "title": "Program to search an element in an array",
            "dueDate": "Not Applicable",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          },
          {
            "title": "Program to simulate 7-Segment LED Display",
            "dueDate": "Not Applicable",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          },
          {
            "title": "Program to simulate traffic light control system",
            "dueDate": "Not Applicable",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          },
          {
            "title": "Program to simulate stepper motor control system",
            "dueDate": "Not Applicable",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Blocked"
          }
        ]
      }
    },
    {
      "ClassNbr": "2366",
      "Course Code": "CSE2006",
      "Course Title": "Microprocessor and Interfacing",
      "Course Type": "Embedded Project",
      "Faculty": "NARAYANAMOORTHI M - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2366",
        "CSE2006",
        "EPJ"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Review I",
            "dueDate": "Not Applicable",
            "score": "15.00 / 20.00",
            "status": "Attended",
            "uploadStatus": "Blocked"
          },
          {
            "title": "Review II",
            "dueDate": "Not Applicable",
            "score": "Not Given / 30.00",
            "status": "-",
            "uploadStatus": "Blocked"
          },
          {
            "title": "Review III",
            "dueDate": "Not Applicable",
            "score": "Not Given / 50.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          }
        ]
      }
    },
    {
      "ClassNbr": "2314",
      "Course Code": "CSE3001",
      "Course Title": "Software Engineering",
      "Course Type": "Embedded Theory",
      "Faculty": "MYTHILI T - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2314",
        "CSE3001",
        "ETH"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Digital Assessment-I",
            "dueDate": "11-MAR-2017",
            "score": "5.00 / 5.00",
            "status": "Accept",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "DA-II",
            "dueDate": "23-APR-2017",
            "score": "Not Given / 15.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Digital Assessment-III",
            "dueDate": "29-APR-2017",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          }
        ]
      }
    },
    {
      "ClassNbr": "2385",
      "Course Code": "CSE3001",
      "Course Title": "Software Engineering",
      "Course Type": "Embedded Lab",
      "Faculty": "MYTHILI T - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2385",
        "CSE3001",
        "ELA"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Assessment-I",
            "dueDate": "Not Applicable",
            "score": "5.00 / 5.00",
            "status": "Accept",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Assessment-II",
            "dueDate": "Not Applicable",
            "score": "8.00 / 10.00",
            "status": "Accept",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Assessment-III",
            "dueDate": "Not Applicable",
            "score": "Not Given / 5.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Assessment-IV",
            "dueDate": "Not Applicable",
            "score": "3.00 / 5.00",
            "status": "Accept",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Assessment - V",
            "dueDate": "Not Applicable",
            "score": "8.00 / 10.00",
            "status": "Accept",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Assessment - VI",
            "dueDate": "Not Applicable",
            "score": "Not Given / 15.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Assessment - VII",
            "dueDate": "Not Applicable",
            "score": "Not Given / 15.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          }
        ]
      }
    },
    {
      "ClassNbr": "2349",
      "Course Code": "CSE3001",
      "Course Title": "Software Engineering",
      "Course Type": "Embedded Project",
      "Faculty": "MYTHILI T - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2349",
        "CSE3001",
        "EPJ"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Review I",
            "dueDate": "Not Applicable",
            "score": "19.00 / 20.00",
            "status": "Attended",
            "uploadStatus": "Blocked"
          },
          {
            "title": "Review II",
            "dueDate": "Not Applicable",
            "score": "Not Given / 30.00",
            "status": "-",
            "uploadStatus": "Blocked"
          },
          {
            "title": "Review III",
            "dueDate": "Not Applicable",
            "score": "Not Given / 50.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          }
        ]
      }
    },
    {
      "ClassNbr": "2256",
      "Course Code": "CSE3009",
      "Course Title": "Internet  of Things",
      "Course Type": "Embedded Theory",
      "Faculty": "GOVINDA K - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2256",
        "CSE3009",
        "ETH"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "IOT Applications",
            "dueDate": "18-FEB-2017",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Modifications in Digital Assignment1",
            "dueDate": "01-APR-2017",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          }
        ]
      }
    },
    {
      "ClassNbr": "2378",
      "Course Code": "CSE3009",
      "Course Title": "Internet  of Things",
      "Course Type": "Embedded Project",
      "Faculty": "GOVINDA K - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2378",
        "CSE3009",
        "EPJ"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Review I",
            "dueDate": "Not Applicable",
            "score": "Not Given / 20.00",
            "status": "-",
            "uploadStatus": "Blocked"
          },
          {
            "title": "Review II",
            "dueDate": "Not Applicable",
            "score": "Not Given / 30.00",
            "status": "-",
            "uploadStatus": "Blocked"
          },
          {
            "title": "Review III",
            "dueDate": "Not Applicable",
            "score": "Not Given / 50.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          }
        ]
      }
    },
    {
      "ClassNbr": "2274",
      "Course Code": "CSE4019",
      "Course Title": "Image  Processing",
      "Course Type": "Embedded Theory",
      "Faculty": "AJU D - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2274",
        "CSE4019",
        "ETH"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Digital Image Enhancement",
            "dueDate": "17-FEB-2017",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          }
        ]
      }
    },
    {
      "ClassNbr": "2312",
      "Course Code": "CSE4019",
      "Course Title": "Image  Processing",
      "Course Type": "Embedded Project",
      "Faculty": "AJU D - SCOPE",
      " ": "",
      "post_parameters": [
        "WS",
        "2312",
        "CSE4019",
        "EPJ"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Review I",
            "dueDate": "Not Applicable",
            "score": "Not Given / 20.00",
            "status": "-",
            "uploadStatus": "Blocked"
          },
          {
            "title": "Review II",
            "dueDate": "Not Applicable",
            "score": "Not Given / 30.00",
            "status": "-",
            "uploadStatus": "Blocked"
          },
          {
            "title": "Review III",
            "dueDate": "Not Applicable",
            "score": "Not Given / 50.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          }
        ]
      }
    },
    {
      "ClassNbr": "4571",
      "Course Code": "GER1001",
      "Course Title": "Grundstufe Deutsch",
      "Course Type": "Theory Only",
      "Faculty": "SREEKUMAR K N - SSL",
      " ": "",
      "post_parameters": [
        "WS",
        "4571",
        "GER1001",
        "TH"
      ],
      "marksOb": {
        "code": "200",
        "data": [
          {
            "title": "Verb list",
            "dueDate": "18-FEB-2017",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Uploaded"
          },
          {
            "title": "Nomen",
            "dueDate": "18-APR-2017",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          },
          {
            "title": "Aufsatz",
            "dueDate": "27-APR-2017",
            "score": "Not Given / 10.00",
            "status": "-",
            "uploadStatus": "Yet To Upload"
          }
        ]
      }
    }
  ],
  "code": "200"
};


return obj;

}

router.post('/', function(req, res, next) {


console.log("requested");
res.send(sampleJson());
return;
  
  	var regno = req.body.regno;
  	var password = req.body.password;
    var sendingJson = {};
    var counterOfInnerObjects = 0;
  	var link = "https://vtop.vit.ac.in/student/stud_home.asp";
  	getResponseFromLink("GET", {}, link, regno, password, function(response){

  		if(typeof response == 'string')
  		{
  			var message = '{"code" : "5001", "message" : "'+response+'"}';
			res.end(message);
  			return;
  		}
      
      var $ = cheerio.load(response.body);
      var tables = $('table');
      var table = $(tables)['4'];
      var json = {
          "messages" : [],
          "code" : "200"
        };
      var mainArray = [];
      var message = [];

      for (k=0 ; k<tables.length ; k++)
      {
        var trs = $(tables).eq(k).children();
        message = [];
        for (i=0; i<trs.length ; i++)
        {
          var text = $(trs).eq(i).text();
          text = text.split('\r\n').join(' ');
          text = text.split('\t').join('');
          text = text.trim();
          
          var label = text.split(':')[0].trim();
          var labelArray = ['Faculty', 'Message', 'Coordinator', 'Course Title', 'Course', 'Sent On', 'Advisor'];
          if(labelArray.indexOf(label) != -1)
            message.push(text);
          if(text=="" && message.length != 0)
          {
            mainArray.push(message);
            message = [];
          }
        }
      }

      mainArray = processMainArray(mainArray);

      //console.log(mainArray);

      json.messages = mainArray;
      initiateResponse(json, "messages");
    })

    link = "https://vtop.vit.ac.in/student/marks_da.asp?sem="+constants.sem;

    getResponseFromLink("GET", {}, link, regno, password, function (response) {
        if (typeof response == 'string') {
          var message = '{"code" : "5001", "message" : "' + response + '"}';
          res.end(message);
          return;
        }
    
        var $ = cheerio.load(response.body);
        var tables = $('table');
        var table = $(tables[1]);
        var json = {
          "messages" : [],
          "code" : "200"
        };

    
        var finalOb={
          data:[],
          "code" : "200"
        };
        for (var i = 1; i < table.find("tr").length; i++) {
          var ob={};
          for (var j = 1; j < table.find("tr").eq(i).find("td").length; j++) {
            
            var str=table.find("tr").eq(0).find("td").eq(j).text();
            ob[str]=table.find("tr").eq(i).find("td").eq(j).text().trim().split(',')[0];
          }
          
          var ar=new Array;
          for (var k = 0; k < table.find("tr").eq(i).find("input").length; k++) {
            if(table.find("tr").eq(i).find("input").eq(k)['0'].attribs.value!="Process"){
              
              ar.push(table.find("tr").eq(i).find("input").eq(k)['0'].attribs.value);
            }
          }
          ob.post_parameters=ar;
          finalOb.data.push(ob);
      }

      var count = 0;

      const handleMarks = function(response, putIndex)
      { 
        finalOb.data[putIndex].marksOb = response;
        count++;
        //console.log(count);
        if(count == finalOb.data.length)
        {
          json.digitalAssignments = finalOb.data;
          initiateResponse(json, "assignments");
          return;
        }
      }

      for(var index=0 ; index<finalOb.data.length ; index++)
      {
        getDigitalAssignmentMarks(finalOb.data[index].post_parameters, regno, password, index, handleMarks);
      }

      if(finalOb.data.length == 0)
      {
        json.digitalAssignments = finalOb.data;
        initiateResponse(json, "assignments");
        //res.send(json);
      }
      

    
      
    
     });

    const initiateResponse = function(obj, message)
    {
        if(message == "assignments")
        {
            sendingJson[message] = obj.digitalAssignments;
        }
        else
        {
            sendingJson[message] = obj.messages;
        }
        counterOfInnerObjects++;
        if(counterOfInnerObjects == 2)
        {
            sendingJson.code = "200";
            res.send(sendingJson);
        }
    }


	
});

function removeLabel(component)
{
  var components = component.split(":");
  components[0] = "";
  component = components.join(":");
  component = component.substr(1).trim();

  return component;
}

function processMainArray(mainArray)
{
  for (var i=0 ; i<mainArray.length ; i++)
  {
    var messageArray = mainArray[i];
    var jsonObj = {};
    for (var j=0 ; j<messageArray.length ; j++)
    {
      var component = messageArray[j];
      component = removeLabel(component);
      jsonObj[j] = component;
    }
    mainArray[i] = jsonObj;
  }

  return mainArray;
}

module.exports = router;



