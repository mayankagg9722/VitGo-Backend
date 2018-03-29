$(document).ready(function(){
    
    $.support.placeholder = (function () {
        var i = document.createElement('input');
        return 'placeholder' in i;
    })();

    if ($.support.placeholder) {
        $('.form li').each(function () {
            $(this).addClass('js-hide-label');
        }); 

        $('.form li').find('input, textarea').on('keyup blur focus', function (e) {

            var $this = $(this),
                $parent = $this.parent();

            if (e.type == 'keyup') {
                if ($this.val() == '') {
                    $parent.addClass('js-hide-label');
                } else {
                    $parent.removeClass('js-hide-label');
                }                    
            }
            else if (e.type == 'blur') {

                if ($this.val() == '') {
                    $parent.addClass('js-hide-label');
                }
                else {
                    $parent.removeClass('js-hide-label').addClass('js-unhighlight-label');
                }
            }
            else if (e.type == 'focus') {
                if ($this.val() !== '') {
                    $parent.removeClass('js-unhighlight-label');
                }
            }
        });
    }

    if ($('[type="date"]').prop('type') != 'date') {
        $(function() {
            $( "#date" ).datepicker({
                dateFormat: 'dd-mm-yy',
               beforeShowDay : function (date) {
                  var dayOfWeek = date.getDay ();
                  // 0 : Sunday, 1 : Monday, ...
                  return [true];
               }
            });
         });
    }

});