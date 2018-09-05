$(document).ready(function() {
	var lastDomainNm ="";
	$('.chgDomNm').hide();
	$('#example').dataTable( {
		"scrollY":        230,
		"scrollCollapse": true,
		"jQueryUI":       true
	});
	$('#airline_FEP_admin_table').dataTable( {
		"scrollY":        235,
		"scrollCollapse": true,
		"jQueryUI":       true
	});
		$("#airline_FEP_admin_table td").removeClass("sorting_1");
		$('#opt2').css('display','none');
		$('#opt3').css('display','none');
		$('.crtDomain').hide();
	$('.dataTable th').click(function(){
		$("#airline_FEP_admin_table td").removeClass("sorting_1");
	});

	$("#dominnGRP tr").click(function() {
		var selected = $(this).hasClass("highlight");
		if(!selected) {
		   $("#dominnGRP tr").removeClass("highlight");
		   $(this).addClass("highlight");
		}
		else {
			//$("#dominnGRP tr").addClass("highlight");
		}
	});
	$("#airline_FEP_admin_table tr").click(function() {
		var selected = $(this).hasClass("highlight");
		$("#airline_FEP_admin_table tr").removeClass("highlight");
		if(!selected)
		   $(this).addClass("highlight");
	});
	$("#addNewDomainTbutt").click(function() {
		$('.crtDomain').show();
		$('#saveDomain').css('display','inline-block');
		$('#cancleDomain').css('display','inline-block');
		$('#addNewDomain').css('display','none');
		$("#updateDomain").css('display','none');
		$('#deleteData').css('display','none');
		$("#modifyData").css('display','none');
		$('#yesDelete').css('display','none');
		$('#notDelete').css('display','none');
		$('#createDomain').focus();
	});
	$("#addNewDomain").click(function() {
		$('.crtDomain').show();
		$('#saveDomain').css('display','inline-block');
		$('#cancleDomain').css('display','inline-block');
		$('#addNewDomain').css('display','none');
		$("#updateDomain").css('display','none');
		$('#deleteData').css('display','none');
		$("#modifyData").css('display','none');
		$('#yesDelete').css('display','none');
		$('#notDelete').css('display','none');
		$('#createDomain').focus();
	});
	$("#cancleDomain").click(function(e) {
		//document.location.reload();
		setTimeout(function() {
                lastDomainNm = $('.highlight').find('input').val();
				cancleModifyData(lastDomainNm);
                }, 250);
	});
	$("#cnlDomain").click(function() {
		$('.crtDomain').hide();
	});
	
	$("#updateDomain").click(function() {
		/*var getButtonVal = confirm("Press 'OK' to update the Domain.");
		if (getButtonVal == true) {*/
			$('#crtDomain').css('display','none');
			$('#saveDomain').css('display','none');
			$('#cancleDomain').css('display','none');
			$('#yesDelete').css('display','none');
			$('#notDelete').css('display','none');
			$("#modifyData").css('display','inline-block');
			$('#addNewDomain').css('display','inline-block');
			$('#deleteData').css('display','inline-block');
			$("#updateDomain").css('display','none');
		/*} else {
			return false;
		}*/
	});


    $("#createDomain, .chgDomNm").keyup(function () {
    	var charReg = /^\s*[a-zA-Z0-9,\s]+\s*$/;
        $('span.error-keyup-1').hide();
        var inputVal = $(this).val();

        if (!charReg.test(inputVal)) {
            $(this).parent().find(".warning").show();
            $('#saveDomain').prop('disabled', true);
            $('#updateDomain').prop('disabled', true);
        } else if (inputVal.length == 0) {
            //$(this).parent().find(".warning").css('display','none');
            //$('#saveDomain').prop('disabled', false);
            //$('#updateDomain').prop('disabled', false);
        } else {
            $(this).parent().find(".warning").hide();
            $('#saveDomain').prop('disabled', false);
            $('#updateDomain').prop('disabled', false);
        }

    });
	
	$('#saveDomain').click(function(event) {
	    // check input ($(this).val()) for validity here
	    var valueOfCreateNewDomain = $("#createDomain").val();
	    $("#frmDomainData input[type='text']").each(function () {
	        //Inside each() check the 'valueOfCreateNewDomain' with all other existing input
	        if ($(this).val() == valueOfCreateNewDomain ) {
	        	$( "#dailog-duplicateDomain" ).show();
	        	event.preventDefault(); // stop page refresh	            
	        } else {

	        }
	    });
	});
	$('.sevDmn').click(function(event) {
	    // check input ($(this).val()) for validity here
	    var valueOfCreateNewDomain = $(this).closest('tr').find('td:first-child').find('input').val();
	    $("#frmDomainData input[type='hidden']").each(function () {
	        //Inside each() check the 'valueOfCreateNewDomain' with all other existing input
			//alert($(this).val());
	        if ($(this).val() == valueOfCreateNewDomain ) {
	        	$( "#dailog-duplicateDomain" ).show();
	        	event.preventDefault(); // stop page refresh	            
	        } else {
	        }
	    });
	});
	$("#dailog-duplicateDomainBtn").click(function(event) {
		$( "#dailog-duplicateDomain" ).hide();
		event.preventDefault(); // stop page refresh
	 });
	 $('#updateDomain').click(function(event) {
	    // check input ($(this).val()) for validity here
	    var valueOfModifyDomain = $(".highlight input").val();
	    $("input[type='hidden']").each(function () {
	        //Inside each() check the 'valueOfCreateNewDomain' with all other existing input
	        if ($(this).val() == valueOfModifyDomain ) {
	        	$( "#dailog-duplicateDomain" ).show();
	        	event.preventDefault(); // stop page refresh	            
	        } else {

	        }
	    });
	});

	//EditData();
	UpdateTableRow();
    DomainList();
	DeleteDomain();
	ReActivateDomain();
});

function cancleModifyData(datatxt) {
	$('.highlight').find('td:first-child').find('span').text(datatxt);
}

function DeleteDomain() {
	$('.DeleteDomain').click(function(e){
		$('#frmDomainData tr').removeClass("highlight");
		$(this).closest('tr').addClass("highlight");
		var DelDomainNM = $('.highlight').find('td:first-child').find('span').text();
		if($("#frmDomainData tr").hasClass('highlight')){
				var delMsg = 'Do you really want to delete Domain '+'"'+DelDomainNM+'"';
				$('#dailog-delete-domain  .msgTxtPosi').empty();
				$('#dailog-delete-domain  .msgTxtPosi').append(delMsg);
				$( "#dailog-delete-domain" ).show();
				$("#notDelete").click(function() {
					//document.location.reload();
					$( "#dailog-delete-domain" ).hide();
				});
				$("#deleteData").click(function() {
					$( "#dailog-delete-domain" ).show();
				});
				$("#dailogDeleteBtn").click(function() {
					$( "#dailog-delete-domain" ).hide();
				});
		}
		else {
			//alert('please select one row');
				
			return false;
		}
	});
	/*$("input[name^='chgDomNm_']").click(function(){
		$('#modifyData').attr('type','submit');
	});*/
}

function UpdateTableRow() {
	var default_value;
	$('.actionDrop select').change(function(event){
		var selOptVal = $(this).find('option:selected').text();
		//alert(selOptVal);
		if(selOptVal == 'Edit'){
		var tr = $(this).closest('tr')
		$(tr).find('td').eq(1).find('label').css('display','none');
		var default_value = $(tr).find('td').eq(0).find('span').text();
		//alert(default_value);
		$(tr).find('td').eq(0).find('span').text('');
		$(tr).find('td').eq(0).find('.chgDomNm').css('display','block');
		$(tr).find('td').eq(0).find('.chgDomNm').attr('type','text');
		$(tr).find('td').eq(1).find('label').hide();
		$(tr).find('td').eq(1).find('#saveDmn').css({'display':'block','margin-left': '22px'});
		$(tr).find('td').eq(2).find('input[type="checkbox"]').css('display','none');
		$(tr).find('td').eq(2).find('#cnlDmn').css('display','block');
		} else if(selOptVal == 'Delete') {
			//alert(selOptVal);
			var DelDomainNM = $('.highlight').find('td:first-child').find('span').text();
				var delMsg = 'Do you really want to delete Domain '+'"'+DelDomainNM+'"';
				$('#dailog-delete-domain  .msgTxtPosi').empty();
				$('#dailog-delete-domain  .msgTxtPosi').append(delMsg);
				$( "#dailog-delete-domain" ).show();
				$('.actionDrop select').val('Action').attr('selected', true);
		}
		else {
		}
	});
	$("#notDelete").click(function() {
		//document.location.reload();
		$( "#dailog-delete-domain" ).hide();
	});
	$("#dailogOKBtn").click(function() {
		$( "#dailog-blank-data" ).hide();
	});
	$('.cnlDmn').click(function(){
		$('#frmDomainData')[0].reset();
		var tr = $(this).closest('tr')
		$(tr).find('td').eq(1).find('label').show();
		//var tdInpTxt = $(tr).find('td').eq(0).find('input').val();
		//$(tr).find('td').eq(0).find('span').text(tdInpTxt);
		setTimeout(function() {
                lastDomainNm = $(tr).find('td').eq(0).find('input').val();
				cancleModifyData(lastDomainNm);
                }, 250);

		$(tr).find('td').eq(0).find('.chgDomNm').css('display','none');
		$(tr).find('td').eq(0).find('.chgDomNm').attr('type','hidden');
		$(tr).find('td').eq(1).find('label').show();
		$(tr).find('td').eq(1).find('#saveDmn').css({'display':'none','margin-left': '22px'});
		$(tr).find('td').eq(2).find('input[type="checkbox"]').show();
		$(tr).find('td').eq(2).find('#cnlDmn').css('display','none');
	});
	

}
function ReActivateDomain(){
		$('#reActvDomain').click(function(e){
			if($('#airline_FEP_admin_table tr').hasClass('highlight')){
				$("#ActvDomain").css('display','block');
				$('#cancleDomain').css('display','block');
				$("#reActvDomain").css('display','none');
			}
			else {
				//alert('Please select one row');
				$('#dailog-blank-data').show();
				return false;
			}
		});
}

function DomainList() {
	$(document).delegate('#selectDomainNm_1', 'change', function (e) {
	if($("#selectDomainNm_1").get(0).selectedIndex == 1){
		var backendUrlEdit = "loadDomain1.html"; 
		var responseTypeEdit = "html";
		$.ajax({
			url : backendUrlEdit,
			data : '',
			cache : false,
			dataType: responseTypeEdit,
			success : function(data) {
				$("#dominnGRP").html(data);
			},error: function (data) {
			}
		});
	}
	else if($("#selectDomainNm_1").get(0).selectedIndex == 2){
		var backendUrlEdit = "loadDomain2.html"; 
		var responseTypeEdit = "html";
		$.ajax({
			url : backendUrlEdit,
			data : '',
			cache : false,
			dataType: responseTypeEdit,
			success : function(data) {
				/*if (data.indexOf('Session Timeout Error-401') != -1) {
					if($("#modalHolder").length >= 1){
						Uconnect.modal.elem.closeModal();
					}
					data = data.split('-');
					data = data[2];
					$("#frmDomainData").html(getErrorDivMessage(data));
				}else {
					aHaActivate();
				}*/
				$("#dominnGRP").html(data);
			},error: function (data) {
			}

		});
	}
	else {
	}
});
}
function EditData() {
	var selectedObj;
	var currentValue;
	$('td').click(function(e){
      // Handle the click
	     
	 if ($('#currentInput').length == 0)
     {
            selectedObj = $(this);
        var currentValue = $(this).text();
        var newValue = currentValue;

        $(this).html("<input id='currentInput' type='text' value='"+currentValue+"'/>");
		//selectedObj.html('');
		if($('#currentInput').val().length == 0){
			//alert("Domain name should not be empty.");
			return false;
		}
     }
  });
}

$(function() {
	//$( "#currentDate" ).datepicker();
	//$( "#lstModDate" ).datepicker();
	/*$( "#creationDate" ).datepicker({
	defaultDate: "+1w",
	changeMonth: true,
	numberOfMonths: 1,
	onClose: function( selectedDate ) {
	$( "#lstModDate" ).datepicker( "option", "minDate", selectedDate );
	}
	});
	$( "#lstModDate" ).datepicker({
	defaultDate: "+1w",
	changeMonth: true,
	numberOfMonths: 1,
	onClose: function( selectedDate ) {
	$( "#creationDate" ).datepicker( "option", "maxDate", selectedDate );
	}
	});
	$( "#tabs" ).tabs();*/
	$('#feedbkLink').on('click', function(){
		/*$( "#dialog" ).dialog({
			 autoOpen: false,
			 height: 300,
			 width: 450,
			 modal: true
		});*/
		 dialog = $( "#dialog" ).dialog({
			autoOpen: false,
			height: 500,
			width: 550,
			modal: true,
			buttons: {
			/*"Create an account": addUser,*/
			Cancel: function() {
			dialog.dialog( "close" );
			}
			},
			close: function() {
			form[ 0 ].reset();
			allFields.removeClass( "ui-state-error" );
			}
		});
			dialog.dialog( "open" );
	});
});

function moveAll(from, to) {
        $('#'+from+' option').remove().appendTo('#'+to); 
    }
    
function moveSelected(from, to) {
        $('#'+from+' option:selected').remove().appendTo('#'+to); 
    }
function selectAll() {
        $("select option").attr("selected","selected");
    }


