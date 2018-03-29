

	$(function() {
    	$("#submit").click(function() {
      		$("#form1").submit();
    	});	
  	});


  	$("#form1").submit(function(e) {
      e.preventDefault(); // avoid to execute the actual submit of the form.
    var url = "/chapterDidPostAnEvent"; // the script where you handle the form input.

    $.ajax({
           type: "POST",
           url: url,
           data: $("#form1").serialize(),
           success: function(data)
           {
               if(data != "OK")
               {
                $("#form1").bind("submit");
                $("#form1").on("submit");
               	document.getElementById('errMessage').innerHTML = ""+data;
               }
               else
               {
                $("#form1").off("submit");
                $("#form1").unbind("submit");
                setTimeout(submitForm2(), 1);
               }
           },
           error: function(jqXHR, textStatus, errorThrown)
           {
            $("#form1").bind("submit");
            $("#form1").on("submit");
            console.log('ERRORS in form 1: ' + textStatus);
           }
         });

});

function submitForm2()
{
  console.log("letsSubmitform2");
  $("#form2").submit();
}

$("#form2").submit(function(e) {

     event.stopPropagation(); // Stop stuff happening
     event.preventDefault();
    
    var url = "/chapterDidPostEventImage"; // the script where you handle the form input.
    var formData = new FormData($("#form2"));

    $.ajax({
           type: "POST",
           url: url,
           data: formData,
           async: false,
           processData: false, 
           contentType: false,
           success: function(data)
           {
               console.log(data);
           },
           error: function(jqXHR, textStatus, errorThrown)
           {
            console.log('ERRORS: ' + textStatus);
            // STOP LOADING SPINNER
           }
         });

});
