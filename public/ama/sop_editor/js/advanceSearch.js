$(document).on('change', 'input:radio[name=searchType]', function(event) {
    if ($("input[name='searchType']:checked").val() == 'byText') {
   	 	$('#savedSearchList').hide();
   		$('#findByQuery').hide();
    	$('#findBySaved').hide();
    	$("#findByText").show();
    	$('#searchResultContainer').hide();
    	$('#saveSearchDelete').hide();
    }else
    if ($("input[name='searchType']:checked").val() == 'savedSearch') {
    	$('#savedSearchList').show();
   		$('#findByQuery').hide();
    	$('#findBySaved').show();
    	$("#findByText").hide();
    	$('#searchResultContainer').hide();
    	$('#saveSearchDelete').hide();
    }else
    if ($("input[name='searchType']:checked").val() == 'query') {
    	$('#savedSearchList').hide();
   		$('#findByQuery').show();
    	$('#findBySaved').hide();
    	$("#findByText").hide();
    	$('#searchResultContainer').hide();
    	$('#saveSearchDelete').hide();
    }
});

$("#serachbyTextValTicket").keypress(function( event ) {
	  if ( event.which == 13 ) {
		  callDataTableTicket();
	  }
});
$("#serachbyTextVal").keypress(function( event ) {
	  if ( event.which == 13 ) {
		  callDataTable();
	  }
});
$("#searchSOPName").keypress(function( event ) {
	  if ( event.which == 13 ) {
		  callDataTable();
	  }
});
$("#searchAlertName").keypress(function( event ) {
	  if ( event.which == 13 ) {
		  callDataTable();
	  }
});
$("#searchTaskName").keypress(function( event ) {
	  if ( event.which == 13 ) {
		  callDataTable();
	  }
});
$(document).on('keypress', '#serachbyTextValResult', function(event) {
//$("#serachbyTextValResult").keypress(function( event ) {
	  if ( event.which == 13 ) {
		  callDataTable();
	  }
});
$(document).on('keypress', '#serachbyQuerySOPResult', function(event) {
//$("#serachbyQuerySOPResult").keypress(function( event ) {
	  if ( event.which == 13 ) {
		  callDataTable();
	  }
});
$(document).on('keypress', '#serachbyQueryAlertResult', function(event) {
//$("#serachbyQueryAlertResult").keypress(function( event ) {
	  if ( event.which == 13 ) {
		  callDataTable();
	  }
});
$(document).on('keypress', '#serachbyQueryTaskResult', function(event) {
//$("#serachbyQueryTaskResult").keypress(function( event ) {
	  if ( event.which == 13 ) {
		  callDataTable();
	  }
});
$(document).on('keypress', '#serachbyQuerySeverityResult', function(event) {
//$("#serachbyQuerySeverityResult").keypress(function( event ) {
	  if ( event.which == 13 ) {
		  callDataTable();
	  }
});

function clearDataTable(){
	if($("input[name='searchType']:checked").val() == 'byText'){
		$('#serachbyTextVal').val('');
		$('#serachbyTextValForTicket').val('');
	}else if($("input[name='searchType']:checked").val() == 'query'){
		$('#searchSOPName').val('');
		$('#searchAlertName').val('');
		$('#searchTaskName').val('');
		$("#searchSeverity option[value='']").attr("selected","selected");
	}else if($("input[name='searchType']:checked").val() == 'savedSearch'){
		$('#findBySaved').hide();
		$('#serachbyTextIdResult').val('');
		$('#serachbyTextValResult').val('');
		$('#saveSearchDelete').hide();
		$("#savedSearchList option[value='-1']").attr("selected","selected");		
	}
	$('#searchResultContainer').hide();
	$('#serachbyTextValTicket').val('');
}

function getSOPTicketData(ticketkey){
	window.location.href="#amendSOP";
	setTimeout(function(){
		$("#richTextEditorContainer").show();
		$("#WaitAlertMsg").show();
		//$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		
		 $.ajax({
			 beforeSend: function(xhrObj){
	             xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
			 },
			 contentType: 'application/json',
			 url: getSOPforTicketKey + '?EventKey='+ticketkey,
			 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},		
			 type: "GET",
			 success: function(dataObj) {
				    var data = dataObj.response;
					var pdfTicketRow = '';
					pdfTicketRow = '<p style="font-size:120%; text-align:left;"><span>Assignee - </span><span id="PDFassigneeTicketUp"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Assignment Group - </span><span id="PDFassigneeGroupUp"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Priority - </span><span id="PDFticketPriorityDrpUp"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Status - </span><span id="PDFticketStatusDrpUp"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Raised On - </span><span id="PDFticketRaisedOnUp"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Requester - </span><span id="PDFTicketRequestor"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Cause - </span><span id="PDFTicketCause"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Category - </span><span id="PDFTicketCategory"></span><br /></p>';
					$('#pdfTicketRow').html(pdfTicketRow);
					$('#scheduledCheckUp').hide();
					$('#ticketDetailsUp').show();
					$('#alertDetailsUp').hide();
					$('#tabAlertText').html(uiconfig.SOPEditortab4);
					$('#uitab1headingUp').html('Enter Ticket Details');
					var c = data.Tickets;
					$('#selectapplication').html('<option selected>'+c.applicationName+'</option>').attr("disabled","disabled") ;
					$('#createTicketNameUp').val(c.ticketKey);
					$('#requesterTicketUp').val(c.requester);
					$('#assigneeTicketUp').val(c.assignee);
					$('#assigneeGroupUp').val(c.asignmentGroup);
					$('#ticketTypeDrpUp').val(c.type);
					$('#ticketPriorityDrpUp').val(c.priority);
					$('#ticketDescTxtAreaUp').val(c.subject);				
					$('#ticketStatusDrpUp').val(c.status);
					$('#ticketRaisedOnUp').val(c.openedAt);
					$('#ticketCauseUp').val(c.cause);
					$('#ticketCategoryUp').val(c.category);
					$("#sopname").val(data.SOPs.SOPName).attr("disabled","disabled");
					$('#sopdescription').val(data.SOPs.SOPShortDesc).attr("disabled","disabled");
					$('#soppurpose').val(data.SOPs.SOPPurpose).attr("disabled","disabled");
					$('#sopclassification').val(data.SOPs.Classification).attr("disabled","disabled");	
					$('#sopexpectedinput').val(data.SOPs.ExpectedInput).attr("disabled","disabled");	
					$('#sopexpectedoutput').val(data.SOPs.ExpectedOutput).attr("disabled","disabled");
					$('#amendData').removeClass('disableamend');
					$('#deletedata').removeClass('disableamend');
					$('#PDFApplication_Name').html(c.applicationName);
					$('#altickNm').html('Ticket ID - '); 
					$('#PDFAlert_Name').html(c.ticketKey);
					$('#PDFalertName').html(c.ticketKey);
					$('#PDFAlertDescription').html(c.subject);
					$('#PDFAlertType').html(c.type);
					$('#PDFSopName').html(data.SOPs.SOPName);
					$('#PDFAlertSev').html(c.type);
					$('#PDFassigneeTicketUp').html(c.assignee);
					$('#PDFassigneeGroupUp').html(c.asignmentGroup);
					$('#PDFticketPriorityDrpUp').html(c.priority);
					$('#PDFticketStatusDrpUp').html(c.status);
					$('#PDFticketRaisedOnUp').html(c.openedAt);
					$('#PDFTicketCause').html(c.cause);
					$('#PDFTicketCategory').html(c.category);				
			
					ticketId = c._id;
					SOPID = data.SOPs._id;
					autoProvd = data.SOPs.AutomationProvider;
					automationProcessUp = data.SOPs.AutomationProcess;
					operationShortDesc = data.SOPs.operationShortDesc;
					ExecuteAutomation = data.SOPs.ExecuteAutomation;
					createdByUserIdSOP = data.SOPs.createdByUserId;
					createTimestampSOP = data.SOPs.createTimestamp;
					if (typeof(data.SOPs.AutomationInput) != 'undefined' || data.SOPs.AutomationInput != null){
						AutomationInput = data.SOPs.AutomationInput;
						ipsoftAutomationInput = AutomationInput;
						var htmlAutoParam = '';
						if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){							
								var i = 0;
								for(var j = 0 ; j <AutomationInput.length; j++){
									htmlAutoParam += '<tr><td>'+(j+1)+'</td><td>';
									$.each(AutomationInput[j], function(key, value){							
										if(key != 'timeOut' && key != 'targetHost' && key != 'assignedGroup' && key != 'automationDesc' && key !='automationName' && key !='automationPath' && key != 'osType' && key !='severity' && key !='UserId'){
											htmlAutoParam += '<span style="float:left; width:200px;">"' + key + '</span>';
											htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
										}
										//sopAutomationParam = i + 1;
										//i = i + 1;
									});
									htmlAutoParam += '</td><td><a class="deleteParam disableamend" title="Delete Parameter" onclick="removeParamUpdate('+(j+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a><a class="editParam disableamend" title="Edit Parameter" onclick="editParamUpdate('+(j+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-edit"></span></a></td></tr>';
								}
						}else{
							htmlAutoParam = '';
						}
					}
					$('#autoParamContent').html(htmlAutoParam);
					$('#PDFipSoftParamInfo').html(htmlAutoParam);
					var taskExec = data.SOPs;
					var amtaskOwner = new Array();
					var amtaskName = new Array();
					var amtaskDesc = new Array();
					var amtaskExecution = new Array();
					var amtaskExeOrder = new Array();
					var amtaskDuration = new Array();
					var amtaskFileNm = new Array();				
					taskMaster = taskExec.TaskMasters;
					for(var k = 0; k<taskMaster.length; k++){
						amtaskOwner[k] = taskMaster[k].TaskOwner;
						amtaskName[k] = taskMaster[k].TaskName;
						amtaskDesc[k] = taskMaster[k].TaskShortDesc;
						amtaskExecution[k] = taskMaster[k].TaskExecutionType;
						amtaskExeOrder[k] = taskMaster[k].TaskExecutionOrder;
						amtaskFileNm[k] = taskMaster[k].TaskFileName;
						//amtaskDuration[k] = taskMaster[k].TaskDuration;
					}

	
		
					for(var l=0; l<amtaskName.length; l++){
						if (typeof(amtaskExecution[l]) == 'undefined' || amtaskExecution[l] == null){
							amtaskExecution[l] = '';
						}
						if (amtaskDesc[l] == 'Short description'){
							amtaskDesc[l] = 'Not Available';
						}
						
						var fileURL = '';
						if (typeof(amtaskFileNm[l]) == 'undefined' || amtaskFileNm[l] == null){
							fileURL = 'NO FILE AVAILABLE'
						}else{
							fileURL = '<a href="https://swarnasetu.mybluemix.net/rest/v1/sopmeta/download?fileName='+amtaskFileNm[l]+'" alt="Download File">Download</a>';
						}
						
						$('#taskAmendRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td>'+amtaskName[l]+'</td><td id="taskDesc'+l+'">'+amtaskDesc[l]+'</td><td><input type="button" class="form-control editDesc disableamend"  value="Edit Description" disabled="disabled"/><td>'+amtaskOwner[l]+'</td><td>'+amtaskExecution[l]+'</td><td style="text-align:center;" align="center"><a href="javascript:void(0)" ng-click="editTask();" class="editTask disableamend" title="Edit Task"><span class="glyphicon glyphicon-edit" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="saveTask" ng-click="saveTask();" style="display:none;" title="Save Task"><span class="glyphicon glyphicon-floppy-disk" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="deleteTask disableamend" title="Delete Task"><span class="glyphicon glyphicon-remove-sign" style="font-size:20px;"></span></a></td></tr>');
						$('#taskPdfRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td style="word-wrap:break-word;">'+amtaskName[l]+'</td><td>'+amtaskDesc[l]+'</td></tr>');
						taskExeArray.push(amtaskExeOrder[l]);
					}
			
			
			
					$("#selectProviderValueUp").html("<option>"+autoProvd+"</option>").attr("disabled","disabled");
					if(autoProvd == 'blueprism'){
						$("#selectProcessValueUp").html('<option value="'+operationShortDesc+'">'+automationProcessUp+'</option>').attr("disabled","disabled");
						$('#autoReqInfo').show();
						$('#autoProvideRow').show();
						$('#autoProcessContainer').show();
					}else{
						$("#autoProcessContainer").hide();
					}
					
					if (typeof(AutomationInput) != 'undefined' || AutomationInput != null){
						var pdfHtml = '';
						if(autoProvd == 'blueprism'){							
							var html = '';
							
							if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
								$.each(AutomationInput[0], function(key, value){
									html += '<div style="width:150px; margin:10px 20px; font: bold 13px verdana; float:left;">' + key + '</div>';
									html += '<input class="autoDOMvalue disableClass" style="float:left;" type="text" value="' + value + '" />';
									pdfHtml += '<p><span style="font-size:120%;">' + key + ' - </span><span>' + value + '</span></p>';
								});
							}
							$("#blueAutoGenUp").html(html);
							$('#PDFAutoReqInfo').html(pdfHtml);
						}else if(autoProvd == 'IPSoft'){
							if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
								$("#ipsoftAutomationNameu").val(AutomationInput[0].automationName).attr("disabled","disabled");
								$("#ipsoftAutomationPathu").val(AutomationInput[0].automationPath).attr("disabled","disabled");
								$("#ipsoftautomationDescriptionu").val(AutomationInput[0].automationDesc).attr("disabled","disabled");
								$("#ipsoftOSTypeu").val(AutomationInput[0].osType).attr("disabled","disabled");
								$('#ipsoftSeverityu').val(AutomationInput[0].severity).attr("disabled","disabled");
								$('#ipsoftAssGroupu').val(AutomationInput[0].assignedGroup).attr("disabled","disabled");
								$('#ipsoftTargetHostu').val(AutomationInput[0].targetHost).attr("disabled","disabled");
								$('#ipsoftTimeOutu').val(AutomationInput[0].timeOut).attr("disabled","disabled");
								pdfHtml += '<p><span style="font-size:120%;">Automation Name - </span><span>' + AutomationInput[0].automationName + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Automation Path - </span><span>' + AutomationInput[0].automationPath + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Automation Description - </span><span>' + AutomationInput[0].automationDesc + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">OS Type - </span><span>' + AutomationInput[0].osType + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Automation Severity - </span><span>' + AutomationInput[0].severity + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Assigned Group - </span><span>' + AutomationInput[0].assignedGroup + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Target Host - </span><span>' + AutomationInput[0].targetHost + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Time Out - </span><span>' + AutomationInput[0].timeOut + '</span></p>';
							}
						}else if(autoProvd == 'IBMWorkloadAutomation'){
							if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
								$("#workLoadProcess").val(AutomationInput[0].ProcessName).attr("disabled","disabled");
								$("#workLoadLib").val(AutomationInput[0].LibraryName).attr("disabled","disabled");
								pdfHtml += '<p><span style="font-size:120%;">Process Name - </span><span>' + AutomationInput[0].ProcessName + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Library Name - </span><span>' + AutomationInput[0].LibraryName + '</span></p>';
							}
						}
							
					}
			
					var sopCratedOn;
			    	var updatedByUserId = c.updatedByUserId;
			    	var updateTimestamp = convertDate(c.updateTimestamp);
			    	 if (typeof(createdByUserIdSOP) == 'undefined' || createdByUserIdSOP == null){
			    		 createdByUserIdSOP = 'NOT Available';
			    	 }			    	
			    	 if (typeof(updatedByUserId) == 'undefined' || updatedByUserId == null){
			    		 updatedByUserId = 'NOT Available';
			    	 }
			    	 if (typeof(createTimestampSOP) == 'undefined' || createTimestampSOP == null){
			    		 createTimestampSOP = 'NOT Available';
			    	 }else{
			    		 sopCratedOn = convertDate(createTimestampSOP);
			    	 }
			    	 if (typeof(updateTimestamp) == 'undefined' || updateTimestamp == null){
			    		 updateTimestamp = 'NOT Available';
			    	 }
			    
			    	$('#PDFSOPCreatedBy').html('Created By:- '+createdByUserIdSOP); 
			    	$('#PDFSOPCrO').html('Created On:- '+sopCratedOn);
			    	$('#PDFSOPUpdtby').html('Last Updated By:- '+updatedByUserId);
			    	$('#PDFLstUpdOn').html('Last Updated On:-'+ updateTimestamp);
			    	$('#PDFSopDesc').html(data.SOPs.SOPShortDesc);
			    	$('#PDFSopPurpose').html(data.SOPs.SOPPurpose);
			    	$('#PDFSopClassification').html(data.SOPs.SOPClassification);
			    	$('#PDFSopExInput').html(data.SOPs.SOPExpectedInput);
			    	$('#PDFSopExOutput').html(data.SOPs.SOPExpectedOutput);
			    	$('#PDFClientname').html(c.clientName);
					$('#PDFalertName').html(c.ticketKey);
					$('#PDFapplicationName').html(c.applicationName);					
					$('#PDFaccountName').html(c.accountName);
					$('#PDFTicketRequestor').html(c.requester);
					$('#PDFSopAutoId').html(data.SOPs.AutomationProcess);
					$('#PDFSopAutoProvider').html(data.SOPs.AutomationProvider);
			
			    	var PDFAccUserId = localStorage.getItem("userID");
			    	$('#PDFAccUserId').html(PDFAccUserId);
			    	PDFSOPReportName = 'SOP for ' + c.ticketKey + ' for '+ c.applicationName + ' of '+ c.account;
			    	var d = new Date();
			 	    var month = d.getMonth()+1;
			 	    var mVal ="";
			 	    if(month == 1){mVal='JAN';}else if(month == 2){mVal = 'FEB';}else if(month == 3){mVal = 'MAR';}else if(month == 4){mVal = 'APR';}
			 	    else if(month == 5){mVal = 'MAY'}else if(month == 6){mVal = 'JUN'}else if(month == 7){mVal = 'JUL'}else if(month == 8){mVal = 'AUG'}
			 	    else if(month == 9){mVal = 'SEP'}else if(month == 10){mVal = 'OCT'}else if(month == 11){mVal = 'NOV'}else if(month == 12){mVal = 'DEC'}
			 	    var day = d.getDate();
			 	    var timeInMs = 	          
			 	    	((''+day).length<2 ? '0' : '') + day+ '-' + mVal + '-' +d.getFullYear() ;
			 	    $('#todayDate').html(timeInMs);
					$("#richTextEditorContainer").hide();
					$("#WaitAlertMsg").hide();
			 }
		});
	}, 1000);
}

function getSOPAlertData(accountID,applicationID,alertId){
	window.location.href="#amendSOP";
	setTimeout(function(){
		$("#richTextEditorContainer").show();
		$("#WaitAlertMsg").show();
		//$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		
		 $.ajax({
			 beforeSend: function(xhrObj){
	             xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
			 },
			 contentType: 'application/json',
			 url: getSOPList + '?accountId='+accountID+'&applicationId='+applicationID+'&alertId='+alertId,
			 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},		
			 type: "GET",
			 success: function(dataObj) {
			var data = dataObj.response;
			var c = data.SOPs; 
			for (var k = 0; k < c.length; c++){
				SOPID = c[0].SOPID;
				autoId = c[0].WorkflowAutomationID;
				SOPPurpose = c[0].SOPPurpose;
				SOPClassification = c[0].Classification;
				SOPExpectedInput = c[0].ExpectedInput;
				SOPExpectedOutput = c[0].ExpectedOutput;
				SOPDesc = c[0].SOPShortDesc;
				SOPName = c[0].SOPName;
				userID = c[0].WorkflowAutomationUserId;
				passD = c[0].WorkflowAutomationPassword;
				autoProvd = c[0].AutomationProvider;
				automationProcessUp = c[0].AutomationProcess;
				operationShortDesc = c[0].operationShortDesc;
				ExecuteAutomation = c[0].ExecuteAutomation;
				createdByUserIdSOP = c[0].createdByUserId;
				createTimestampSOP = c[0].createTimestamp;
				AutomationInput = c[0].AutomationInput;
				console.log("createTimestampSOP: "+AutomationInput);
				var taskExec = c[0].TaskExecutionFlows;
				TaskExecutionFlowID = taskExec.TaskExecutionFlowID;
				//var SopJobEvents = c[0].SopJobEvents;
				if (ExecuteAutomation != 'RT'){
					var sopJobName = data.SopJobEvents.jobName;
					var sopJobDetails = data.SopJobEvents.jobDetails;
					var sopCronExpr = data.SopJobEvents.cronExpression;
					var sopTimeZone = data.SopJobEvents.timeZone;
					var sopactive = data.SopJobEvents.active;
					sopalertId = data.SopJobEvents.alertId;
					sop_id = data.SopJobEvents._id;
				}else{
					var sopCronExpr = null; 
				}
				var amtaskOwner = new Array();
				var amtaskName = new Array();
				var amtaskDesc = new Array();
				var amtaskExecution = new Array();
				var amtaskExeOrder = new Array();
				var amtaskDuration = new Array();
				var amtaskFileNm = new Array();
				for(var j = 0; j<taskExec.length; j++){					
					taskMaster = taskExec[0].TaskMasters;
					for(var k = 0; k<taskMaster.length; k++){
						amtaskOwner[k] = taskMaster[k].TaskOwner;
						amtaskName[k] = taskMaster[k].TaskName;
						amtaskDesc[k] = taskMaster[k].TaskShortDesc;
						amtaskExecution[k] = taskMaster[k].TaskExecutionType;
						amtaskExeOrder[k] = taskMaster[k].TaskExecutionOrder;
						amtaskFileNm[k] = taskMaster[k].TaskFileName;
						//amtaskDuration[k] = taskMaster[k].TaskDuration;
					}
				}
			}
			//var taskRTE = '<div name="taskdesc" style="display:none;" ng-model="createsop.taskdesc" text-angular="" class="ng-pristine ng-valid ng-isolate-scope ta-root ng-touched txtAngDiv"><div class="ta-toolbar btn-toolbar"><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H1</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H2</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H3</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">P</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">pre</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-quote-right"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-bold"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-italic"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-underline"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-list-ul"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-list-ol"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-repeat"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-undo"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-ban"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-left"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-center"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-right"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">Toggle HTML</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-picture-o"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-link"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-unlink"></i></button></div></div><div contenteditable="true" ng-model="text" ta-bind="text" ng-hide="showHtml" class="ng-pristine ng-untouched ng-valid ng-scope ng-isolate-scope ta-text ta-editor form-control"></div><textarea ng-model="html" ta-bind="html" ng-show="showHtml" class="ng-pristine ng-untouched ng-valid ng-scope ng-isolate-scope ta-html ta-editor form-control ng-hide"></textarea><input type="hidden" style="display: none;" name="taskdesc" value=""><br />Task Update Coments : <input type="text" ng-model="createsop.taskcomments" id="createsoptaskcomments" placeholder="Enter task update comment" required /></div>';
			
			
			for(var l=0; l<amtaskName.length; l++){
				if (typeof(amtaskExecution[l]) == 'undefined' || amtaskExecution[l] == null){
					amtaskExecution[l] = '';
				}
				var fileURL = '';
				if (typeof(amtaskFileNm[l]) == 'undefined' || amtaskFileNm[l] == null){
					fileURL = 'NO FILE AVAILABLE'
				}else{
					fileURL = '<a href="https://swarnasetu.mybluemix.net/rest/v1/sopmeta/download?fileName='+amtaskFileNm[l]+'" alt="Download File">Download</a>';
				}
				
				$('#taskAmendRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td>'+amtaskName[l]+'</td><td id="taskDesc'+l+'">'+amtaskDesc[l]+'</td><td><input type="button" class="editDesc disableamend"  value="Edit Description" disabled="disabled"/><td>'+amtaskOwner[l]+'</td><td>'+amtaskExecution[l]+'</td><td style="text-align:center;" align="center"><a href="javascript:void(0)" ng-click="editTask();" class="editTask disableamend" title="Edit Task"><span class="glyphicon glyphicon-edit" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="saveTask" ng-click="saveTask();" style="display:none;" title="Save Task"><span class="glyphicon glyphicon-floppy-disk" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="deleteTask disableamend" title="Delete Task"><span class="glyphicon glyphicon-remove-sign" style="font-size:20px;"></span></a></td></tr>');
				$('#taskPdfRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td>'+amtaskName[l]+'</td><td>'+amtaskDesc[l]+'</td></tr>');
				taskExeArray.push(amtaskExeOrder[l]);
			}
							
			$('#accountSelOps').attr("disabled","disabled") ;
			$('#alertname').val(data.alertName).attr("disabled","disabled") ;
			$('#alertdescription').val(data.alertShortDesc).attr("disabled","disabled") ;
			$('#automationid').val(autoId).attr("disabled","disabled") ;
			$('#alerttype').val(data.alertType).attr("disabled","disabled");
			$('#alertseverity').val(data.alertSeverity).attr("disabled","disabled");
			$('#sopdescription').val(SOPDesc).attr("disabled","disabled");
			$('#soppurpose').val(SOPPurpose).attr("disabled","disabled");
			$('#sopclassification').val(SOPClassification).attr("disabled","disabled");	
			$('#sopexpectedinput').val(SOPExpectedInput).attr("disabled","disabled");	
			$('#sopexpectedoutput').val(SOPExpectedOutput).attr("disabled","disabled");		
			$('#sopname').val(SOPName).attr("disabled","disabled");	
			$("#selectProviderValueUp").html("<option>"+autoProvd+"</option>").attr("disabled","disabled");
			
			if(autoProvd == 'blueprism'){
				$("#selectProcessValueUp").html('<option value="'+operationShortDesc+'">'+automationProcessUp+'</option>').attr("disabled","disabled");
				$('#autoReqInfo').show();
				$('#autoProvideRow').show();
				$('#autoProcessContainer').show();
			}else{
				$("#autoProcessContainer").hide();
			}
			
			$('#automationuserIdup').val(userID).attr("disabled","disabled");	
			$('#automationpassword').val(passD).attr("disabled","disabled");
			
			if(sopCronExpr != null){
				$("#scheduleAutoContainerUp").show();
				$('#sopjobnmu').val(sopJobName).attr("disabled","disabled");
				$('#scheduledetailsu').val(sopJobDetails).attr("disabled","disabled");						
				$('#triggerOnValu').val(sopCronExpr).attr("disabled","disabled");
				 for(var i = 0; i<timezone.length; i++){
	            	 $('#createTimeZoneu').append('<option value="'+timezone[i]+'">'+timezone[i]+'</option>');
	             }
				$("#createTimeZoneu option[value='"+sopTimeZone+"']").attr("selected","selected");	
				$('#createTimeZoneu').attr("disabled","disabled");	
				if(sopactive != 'NOT Available'){
					$("input[name=timeZoneu][value=" + sopactive + "]").attr('checked', 'checked');
				}
				$("input[name=executeAutomationu][value=scheduled]").attr('checked', 'checked');
				$("#cronExpTool").hide();
			}else{
				$("#scheduleAutoContainerUp").hide();
				$("input[name=executeAutomationu][value=realTime]").attr('checked', 'checked');
			}
			$('#selectapplication').attr("disabled","disabled");
			$('#selectapplication').html('<option selected>'+data.applicationName+'</option>').attr("disabled","disabled") ;
			$('#amendData').removeClass('disableamend');
			$('#deletedata').removeClass('disableamend');
			$('#sopNameHeader').html(SOPName);
			$('#PDFClientname').html(data.clientName);
			$('#PDFalertName').html(data.alertName);
			$('#PDFapplicationName').html(data.applicationName);
			$('#PDFaccountName').html(data.accountName);
			$('#PDFApplication_Name').html(data.applicationName);
			$('#PDFAlert_Name').html(data.alertName);
			$('#PDFAlertDescription').html(data.alertShortDesc);
			$('#PDFAlertType').html(data.alertType);
			$('#PDFSopName').html(SOPName);
			$('#PDFAlertSev').html(data.alertSeverity);
			
			var sopCratedOn;
	    	var updatedByUserId = data.updatedByUserId;
	    	var updateTimestamp = convertDate(data.updateTimestamp);
	    	 if (typeof(createdByUserIdSOP) == 'undefined' || createdByUserIdSOP == null){
	    		 createdByUserIdSOP = 'NOT Available';
	    	 }			    	
	    	 if (typeof(updatedByUserId) == 'undefined' || updatedByUserId == null){
	    		 updatedByUserId = 'NOT Available';
	    	 }
	    	 if (typeof(createTimestampSOP) == 'undefined' || createTimestampSOP == null){
	    		 createTimestampSOP = 'NOT Available';
	    	 }else{
	    		 sopCratedOn = convertDate(createTimestampSOP);
	    	 }
	    	 if (typeof(updateTimestamp) == 'undefined' || updateTimestamp == null){
	    		 updateTimestamp = 'NOT Available';
	    	 }
	    	 
	    	 
	    	 
	    	 if (typeof(AutomationInput) != 'undefined' || AutomationInput != null){
					if(autoProvd == 'blueprism'){							
						var html = '';
						if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
							$.each(AutomationInput[0], function(key, value){
								html += '<div style="width:150px; margin:10px 20px; font: bold 13px verdana; float:left;">' + key + '</div>';
								html += '<input class="autoDOMvalue disableClass" style="float:left;" type="text" value="' + value + '" />';
							});
						}
						$("#blueAutoGenUp").html(html);
					}else if(autoProvd == 'IPSoft'){
						if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
							$("#automationidsUp").val(AutomationInput[0].WorkflowAutomationID).attr("disabled","disabled");
							$("#automationuserIdUp").val(AutomationInput[0].WorkflowAutomationUserId).attr("disabled","disabled");
							$("#automationuserpassUp").val(AutomationInput[0].WorkflowAutomationPassword).attr("disabled","disabled");
						}
					}else if(autoProvd == 'IBMWorkloadAutomation'){
						if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
							$("#workLoadProcess").val(AutomationInput[0].ProcessName).attr("disabled","disabled");
							$("#workLoadLib").val(AutomationInput[0].LibraryName).attr("disabled","disabled");
						}
					}
					
				}
	    	 
	    	 
	    	$('#PDFSOPCreatedBy').html('Created By:- '+createdByUserIdSOP); 
	    	$('#PDFSOPCrO').html('Created On:- '+sopCratedOn);
	    	$('#PDFSOPUpdtby').html('Last Updated By:- '+updatedByUserId);
	    	$('#PDFLstUpdOn').html('Last Updated On:-'+ updateTimestamp);
	    	$('#PDFSopDesc').html(SOPDesc);
	    	$('#PDFSopPurpose').html(SOPPurpose);
	    	$('#PDFSopClassification').html(SOPClassification);
	    	$('#PDFSopExInput').html(SOPExpectedInput);
	    	$('#PDFSopExOutput').html(SOPExpectedOutput);
	    	$('#PDFSopAutoId').html(autoId);
	    	$('#PDFSopAutoProvider').html(autoProvd);
	    	var PDFAccUserId = localStorage.getItem("userID");
	    	$('#PDFAccUserId').html(PDFAccUserId);
	    	PDFSOPReportName = 'SOP for ' + data.alertName + ' for '+ data.applicationName + ' of '+ data.accountName;
	    	var d = new Date();
	 	    var month = d.getMonth()+1;
	 	    var mVal ="";
	 	    if(month == 1){mVal='JAN';}else if(month == 2){mVal = 'FEB';}else if(month == 3){mVal = 'MAR';}else if(month == 4){mVal = 'APR';}
	 	    else if(month == 5){mVal = 'MAY'}else if(month == 6){mVal = 'JUN'}else if(month == 7){mVal = 'JUL'}else if(month == 8){mVal = 'AUG'}
	 	    else if(month == 9){mVal = 'SEP'}else if(month == 10){mVal = 'OCT'}else if(month == 11){mVal = 'NOV'}else if(month == 12){mVal = 'DEC'}
	 	    var day = d.getDate();
	 	    var timeInMs = 	          
	 	    	((''+day).length<2 ? '0' : '') + day+ '-' + mVal + '-' +d.getFullYear() ;
	 	    $('#todayDate').html(timeInMs);
			$("#richTextEditorContainer").hide();
			$("#WaitAlertMsg").hide();
			alertRaiseTimeVal = data.alertRaisedTimeStamp;
		}
		});
		

	}, 1000);
}

function callDataTableTicket(){
	var serachbyTextValForTicket = '';
	var datatableRowData = '';
	var oTable = $('#searchResultTicketTable').dataTable();
	oTable.fnDestroy();
	serachbyTextValForTicket = $('#serachbyTextValTicket').val();	
	if(serachbyTextValForTicket != ''){
		$('#searchWaitContainer').show();
		$('#WaitAlertMsg').show();
		
		 $.ajax({
			 beforeSend: function(xhrObj){
	             xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
			 },
			 contentType: 'application/json',
			 url: searchText +'?searchCriteria='+serachbyTextValForTicket,
			 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},		
			 type: "GET",
			 success: function(data) {
				 	var dataCurrent = data.response.ticket;
				 	for(var i = 0; i< dataCurrent.length; i++){
					  datatableRowData = datatableRowData + '<tr><td align="center"><a href="javascript:void(0);" onclick="getSOPTicketData(\''+dataCurrent[i].ticketKey+'\');">'+dataCurrent[i].ticketKey+'</a></td><td align="center">'+dataCurrent[i].subject+'</td></tr>';
				 	}	
					$('#searchResultContainer').show();
					$('#searchResultTicketData').html(datatableRowData);
					$('#searchResultTicketTable').dataTable( {
						"scrollY":        300,
						"scrollCollapse": true,
						"jQueryUI":       true,
						"order": [[ 1, "desc" ]],
						 "aLengthMenu": [[5, 10, 20, 100, -1], [5, 10, 20, 100, "All"]],
					     "iDisplayLength": 5,
					});
			
					$('#searchWaitContainer').hide();
					$('#WaitAlertMsg').hide();
			 },
			 error: function() { 
				 alert('No Data Avaliable');
				 $('#searchWaitContainer').hide();
				 $('#WaitAlertMsg').hide();
			 }
		});
		
	}else{
		alert('Please enter Alert Name.');
	}	
}

function callDataTable(){
	var serachbyTextVal = '';
	var datatableRowData = '';
	var oTable = $('#searchResultTable').dataTable();
	oTable.fnDestroy();
	if($("input[name='searchType']:checked").val() == 'byText'){
		serachbyTextVal = $('#serachbyTextVal').val();	
		if(serachbyTextVal != ''){
			$('#searchWaitContainer').show();
			$('#WaitAlertMsg').show();
			
			
			 $.ajax({
				 beforeSend: function(xhrObj){
		             xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
				 },
				 contentType: 'application/json',
				 url: searchByText +'?searchCriteria='+serachbyTextVal,
				 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},		
				 type: "GET",
				 success: function(data) {						 
					 var dataCurrent = data.response;
					  for(var i = 0; i< dataCurrent.length; i++){
						  datatableRowData = datatableRowData + '<tr><td align="center"><a href="javascript:void(0);" onclick="getSOPAlertData(\''+dataCurrent[i].accountID+'\',\''+dataCurrent[i].applicationID+'\',\''+dataCurrent[i].id+'\');">'+dataCurrent[i].alertName+'</a></td><td align="center">'+dataCurrent[i].SOPName+'</td><td align="center">'+truncate(dataCurrent[i].alertShortDesc)+'</td></tr>';
					  }	
					  $('#searchResultContainer').show();
					  $('#searchResultData').html(datatableRowData);
					  $('#searchResultTable').dataTable( {
						"scrollY":        300,
						"scrollCollapse": true,
						"jQueryUI":       true,
						"order": [[ 1, "desc" ]],
						 "aLengthMenu": [[5, 10, 20, 100, -1], [5, 10, 20, 100, "All"]],
					     "iDisplayLength": 5,
					  });
		
					  $('#searchWaitContainer').hide();
					  $('#WaitAlertMsg').hide();
			 	}
			});
		}else{
			alert('Please enter Alert Name.');
		}
	}else if($("input[name='searchType']:checked").val() == 'query'){
		var SOPName= $('#searchSOPName').val();
		var alertName= $('#searchAlertName').val();
		var alertSeverity= $("#searchSeverity option:selected").attr('value');
		var taskName= $('#searchTaskName').val();

		if(SOPName !='' || alertName!= '' || alertSeverity!= '' || taskName!=''){
				$('#searchWaitContainer').show();
				$('#WaitAlertMsg').show();
				var searchQueryString='';
			    if(SOPName!=''){
			    	searchQueryString+='sopname='+SOPName;
			    }
			    if(alertName!='')
			    {
			      	if(searchQueryString!=""){		      
			      		searchQueryString+='&';			      		
			    	}
			      	searchQueryString+='alertname='+alertName;
			    }
			    if(taskName!='')
			    {
			      if(searchQueryString!=""){
			    	  searchQueryString+='&';
			      }			    	 
			      searchQueryString+='taskname='+taskName;
			    }
			    
			    if(alertSeverity!='')
			    {
			      if(searchQueryString!=""){
			    	  searchQueryString+='&';
			      }
			      searchQueryString+='alertSeverity='+alertSeverity;
			    }
			    $('#searchResultContainer').show();   
				$.get(searchByQuery +'?'+searchQueryString, function( data ) {							 
				  var dataCurrent = data.response;
				  for(var i = 0; i< dataCurrent.length; i++){
					  datatableRowData = datatableRowData + '<tr><td align="center"><a href="javascript:void(0);" onclick="getSOPAlertData(\''+dataCurrent[i].accountID+'\',\''+dataCurrent[i].applicationID+'\',\''+dataCurrent[i].id+'\');">'+dataCurrent[i].alertName+'</a></td><td align="center">'+dataCurrent[i].SOPName+'</td><td align="center">'+truncate(dataCurrent[i].alertShortDesc)+'</td></tr>';
				  }	
				$('#searchResultContainer').show();
				$('#searchResultData').html(datatableRowData);
				$('#searchResultTable').dataTable( {
					"scrollY":        300,
					"scrollCollapse": true,
					"jQueryUI":       true,
					"order": [[ 1, "desc" ]],
					 "aLengthMenu": [[5, 10, 20, 100, -1], [5, 10, 20, 100, "All"]],
				     "iDisplayLength": 5,
				});
		
				$('#searchWaitContainer').hide();
				$('#WaitAlertMsg').hide();
			});
			
		}else{
			alert('Please enter atleast one search criteria.');
			$('#searchResultContainer').hide();
		}

	}else if($("input[name='searchType']:checked").val() == 'savedSearch'){
		if(currSavedSearchType == 'text'){
			serachbyTextVal = $('#serachbyTextValResult').val();			
			$('#searchWaitContainer').show();
			$('#WaitAlertMsg').show();
			$.get(searchByText +'?searchCriteria='+serachbyTextVal, function( data ) {							 
				  var dataCurrent = data.response;
				  for(var i = 0; i< dataCurrent.length; i++){
					  datatableRowData = datatableRowData + '<tr><td align="center"><a href="javascript:void(0);" onclick="getSOPAlertData(\''+dataCurrent[i].accountID+'\',\''+dataCurrent[i].applicationID+'\',\''+dataCurrent[i].id+'\');">'+dataCurrent[i].alertName+'</a></td><td align="center">'+dataCurrent[i].SOPName+'</td><td align="center">'+truncate(dataCurrent[i].alertShortDesc)+'</td></tr>';
				  }	
				$('#searchResultContainer').show();
				$('#searchResultData').html(datatableRowData);
				$('#searchResultTable').dataTable( {
					"scrollY":        300,
					"scrollCollapse": true,
					"jQueryUI":       true,
					"order": [[ 1, "desc" ]],
					 "aLengthMenu": [[5, 10, 20, 100, -1], [5, 10, 20, 100, "All"]],
				     "iDisplayLength": 5,
				});
		
				$('#searchWaitContainer').hide();
				$('#WaitAlertMsg').hide();
			});
		}else{
			var SOPName= $('#serachbyQuerySOPResult').val();
			var alertName= $('#serachbyQueryAlertResult').val();
			var alertSeverity= $('#serachbyQuerySeverityResult').val();
			var taskName= $('#serachbyQueryTaskResult').val();
			$('#searchWaitContainer').show();
			$('#WaitAlertMsg').show();
			var searchQueryString='';
		    if(SOPName!=''){
		    	searchQueryString+='sopname='+SOPName;
		    }
		    if(alertName!='')
		    {
		      	if(searchQueryString!=""){		      
		      		searchQueryString+='&';			      		
		    	}
		      	searchQueryString+='alertname='+alertName;
		    }
		    if(taskName!='')
		    {
		      if(searchQueryString!=""){
		    	  searchQueryString+='&';
		      }			    	 
		      searchQueryString+='taskname='+taskName;
		    }
		    
		    if(alertSeverity!='')
		    {
		      if(searchQueryString!=""){
		    	  searchQueryString+='&';
		      }
		      searchQueryString+='alertSeverity='+alertSeverity;
		    }
		    $('#searchResultContainer').show(); 
		    if(typeof(alertSeverity) != 'undefined' && alertSeverity != null ) {
				$.get(searchByQuery +'?'+searchQueryString, function( data ) {							 
					  var dataCurrent = data.response;
					  for(var i = 0; i< dataCurrent.length; i++){
						  datatableRowData = datatableRowData + '<tr><td align="center"><a href="javascript:void(0);" onclick="getSOPAlertData(\''+dataCurrent[i].accountID+'\',\''+dataCurrent[i].applicationID+'\',\''+dataCurrent[i].id+'\');">'+dataCurrent[i].alertName+'</a></td><td align="center">'+dataCurrent[i].SOPName+'</td><td align="center">'+truncate(dataCurrent[i].alertShortDesc)+'</td></tr>';
					  }	
					$('#searchResultContainer').show();
					$('#searchResultData').html(datatableRowData);
					$('#searchResultTable').dataTable( {
						"scrollY":        300,
						"scrollCollapse": true,
						"jQueryUI":       true,
						"order": [[ 1, "desc" ]],
						 "aLengthMenu": [[5, 10, 20, 100, -1], [5, 10, 20, 100, "All"]],
					     "iDisplayLength": 5,
					});
			
					$('#searchWaitContainer').hide();
					$('#WaitAlertMsg').hide();
				});
		    }else{
				$('#searchWaitContainer').hide();
				$('#WaitAlertMsg').hide();
				$('#searchResultContainer').hide();				
		    	alert("Please select a Saved Search");
		    }
		}
	}
	
}
function backToSearch(){
	$("#byTextRadio").prop( "checked", true );
	$('#savedSearchList').hide();
	$('#findByQuery').hide();
	$('#findBySaved').hide();
	$("#findByText").show();
	$('#searchResultContainer').hide();
	$('#saveSearchDelete').hide();
	$('#serachbyTextVal').val('');
	$('#serachbyTextValForTicket').val('');
}
function truncate(string){
	if(typeof(string) != 'undefined' && string != null){
	   if (string.length > 27)
	      return string.substring(0,27)+'...';
	   else
	      return string;
	}else{
		return "NO Description"
	}
}

$(function() { 
	checkSystemLogOut();
});

