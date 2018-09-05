	    function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) { 
	    	var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;   
	    	var authorName = localStorage.getItem("userID");
	    	var CSV = ''; 
	    	CSV += ReportTitle + '\r\n\n';	
	    	
	    	CSV += 'Client Name - '+ JSONData[0].clientName + '\r\n';
	    	CSV += 'Account Name - '+ JSONData[0].accountName + '\r\n';	    	
	    	CSV += 'Author Name - '+ authorName + '\r\n';

	    	 if(typeof (JSONData[0].alertRaisedTimeStamp) == 'undefined'){ JSONData[0].alertRaisedTimeStamp = 'Not Available'}
	    	CSV += 'SOP Created On - '+ JSONData[0].alertRaisedTimeStamp + '\r\n';
	    	 if(typeof (JSONData[0].updatedByUserId) == 'undefined'){ JSONData[0].updatedByUserId = 'Not Available'}
	    	 if(typeof (JSONData[0].updateTimestamp) == 'undefined'){ JSONData[0].updateTimestamp = 'Not Available'}
	    	CSV += 'Last Updated By - '+ JSONData[0].updatedByUserId + '\r\n';
	    	CSV += 'Last Updated On - '+ JSONData[0].updateTimestamp + '\r\n\n';
	    	
	    	CSV += 'Alert Details' + '\r\n';
	    	CSV += '1. Application - ' + JSONData[0].applicationName + '\r\n';
	    	CSV += '2. Alert - ' + JSONData[0].alertName + '\r\n';
	    	 if(typeof (JSONData[0].alertShortDesc) == 'undefined'){JSONData[0].alertShortDesc = 'Not Available'}
	    	 if(typeof (JSONData[0].alertType) == 'undefined'){JSONData[0].alertType = 'Not Available'}
	    	 if(typeof (JSONData[0].alertSeverity) == 'undefined'){JSONData[0].alertSeverity = 'Not Available'}
	    	CSV += '3. Description - ' + JSONData[0].alertShortDesc + '\r\n';
	    	CSV += '4. Type - ' + JSONData[0].alertType + '\r\n';
	    	CSV += '5. Severity - ' + JSONData[0].alertSeverity + '\r\n\n';
	    	       
	        
	        
	        var SOPData = JSONData[0].SOPs;
	        CSV += 'SOP Details' + '\r\n';
	        CSV += '1. Name:- '+ SOPData[0].SOPName + '\r\n';
	        CSV += '2. Automation ID:- '+ SOPData[0].WorkflowAutomationID + '\r\n';
	        if(typeof (SOPData[0].WorkflowAutomationUserId) == 'undefined'){SOPData[0].WorkflowAutomationUserId = 'Not Available'}
	        CSV += '3. User ID:- '+ SOPData[0].WorkflowAutomationUserId + '\r\n';
	        if(typeof (SOPData[0].SOPShortDesc) == 'undefined'){SOPData[0].SOPShortDesc = 'Not Available'}	        
	        CSV += '4. Description:- '+ SOPData[0].SOPShortDesc + '\r\n';
	        CSV += '5. Purpose:- '+ SOPData[0].SOPPurpose + '\r\n';
	        if(typeof (SOPData[0].Classification) == 'undefined'){SOPData[0].Classification = 'Not Available'}	   
	        CSV += '6. Classification:- '+ SOPData[0].Classification + '\r\n';
	        if(typeof (SOPData[0].ExpectedInput) == 'undefined'){SOPData[0].ExpectedInput = 'Not Available'}	 
	        CSV += '7. Expected Input:- '+ SOPData[0].ExpectedInput + '\r\n';
	        if(typeof (SOPData[0].ExpectedOutput) == 'undefined'){SOPData[0].ExpectedOutput = 'Not Available'}	
	        CSV += '8. Expected Output:- '+ SOPData[0].ExpectedOutput + '\r\n\n';
	     
	        CSV += 'Procedures' + '\r\n';
	        var TaskExecutionFlows = SOPData[0].TaskExecutionFlows;
	        var TaskMasters = TaskExecutionFlows[0].TaskMasters;
	        if (ShowLabel) {
	            var row = "";	            
	            //This loop will extract the label from 1st index of on array
	            for (var index in TaskMasters[0]) {	                
	                //Now convert each value to string and comma-seprated
	            	if(index=='TaskName'){
	            		index='Name';
	            	}
	            	if(index=='TaskShortDesc'){
	            		index='Description';
	            	}
	            	if(index=='TaskExecutionOrder'){
	            		index='Order';
	            	}	            	


	            /*	if(index == 'TaskExecutionType'){
	            		index='-';
	            	}
	            	if(index == 'TaskOwner'){
	            		index='-';
	            	}
	            	if(index=='Action'){
	            		index='-';
	            	}
	            	*/
	            	if(index != 'TaskExecutionType' && index != 'TaskOwner' && index != 'Action' && index !='_id' && index !='TaskMasterID' && index !='TaskExecutionFlowID' && index !='TaskExecutionPwd' && index != '' && index !='TaskFileName'){
	            		row += index + ',';
	            	}
	            }
	            row = row.slice(0, -1);	            
	            //append Label row with line break
	            CSV += row + '\r\n';
	        }	
	        for (var i = 0; i < TaskMasters.length; i++) {
	            var row = "";	            
	            //2nd loop will extract each column and convert it in string comma-seprated
	            for (var index in TaskMasters[i]) {
	            	if(index == 'TaskShortDesc'){
	            		TaskMasters[i][index] = TaskMasters[i][index].replace(/<[^>]+>/gm, '');
	            	}
	            	if(index != 'TaskExecutionType' && index != 'TaskOwner' && index != 'Action' && index !='_id' && index !='TaskMasterID' && index !='TaskExecutionFlowID' && index !='TaskExecutionPwd' && index != '' &&  index !='TaskFileName'){
	            		row += '"' + TaskMasters[i][index] + '",';
	            	}
	            }
	            row.slice(0, row.length - 1);	            
	            //add a line break after each row
	            CSV += row + '\r\n';
	        }
	        var row = "";
	        var d = new Date();
	        var month = d.getMonth()+1;
	        var day = d.getDate();
	        var output = 	            
	            ((''+day).length<2 ? '0' : '') + day+ '/' + ((''+month).length<2 ? '0' : '') + month + '/' +d.getFullYear() ;
	        row += '' + ',';row += '' + ',';row += '' + ',';row += '' + ',';row += output + ',';
	        row.slice(0, row.length - 1);	            
            //add a line break after each row
	        CSV += '\n\n';
            CSV += row + '\r\n\n\n\n\n\n';
		        
	        //Generate a file name
	        var fileName = SOPData[0].SOPName;
	        //this will remove the blank-spaces from the title and replace it with an underscore
	        //fileName += ReportTitle.replace(/ /g,"_");   
	        
	        //Initialize file format you want csv or xls
	        var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

	        var link = document.createElement("a");    
	        link.href = uri;
	        
	        //set the visibility hidden so it will not effect on your web-layout
	        link.style = "visibility:hidden";
	        link.download = fileName + ".csv";
	        
	        //this part will append the anchor tag and remove it after automatic click
	        document.body.appendChild(link);
	        link.click();
	        document.body.removeChild(link);
	    }
	    function msieversion() {
	    	var ua = window.navigator.userAgent; 
	    	var msie = ua.indexOf("MSIE "); 
	    	if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))
	    	{
	    		return true;
	    	} else { // If another browser, 
	    		return false;
	    	}
	    		return false; 
	    }
	    
	    
	    function JSONToPDFConvertor(SOPName,name){   
			    var pdf = new jsPDF('p', 'pt', 'letter')
		
			 // source can be HTML-formatted string, or a reference
			 // to an actual DOM element from which the text will be scraped.
			 , source = $('#taskPdfRecordTable')[0]
		
			 // we support special element handlers. Register them with jQuery-style
			 // ID selector for either ID or node name. ("#iAmID", "div", "span" etc.)
			 // There is no support for any other type of selectors
			 // (class, of compound) at this time.
			 , specialElementHandlers = {
			 	// element with id of "bypass" - jQuery style selector
			 	'#bypassme': function(element, renderer){
			 		// true = "handled elsewhere, bypass text extraction"
			 		return true
			 	}
			 }
		
			 margins = {
			     top: 40,
			     bottom: 40,
			     left: 35,
			     width: 522
			   };
			   // all coords and widths are in jsPDF instance's declared units
			   // 'inches' in this case
			 pdf.fromHTML(
			   	source // HTML string or DOM elem ref.
			   	, margins.left // x coord
			   	, margins.top // y coord
			   	, {
			   		'width': margins.width // max width of content on PDF
			   		, 'elementHandlers': specialElementHandlers
			   	},
			   	function (dispose) {
			   	  // dispose: object with X, Y of the last line add to the PDF
			   	  //          this allow the insertion of new lines after html
			         pdf.save(SOPName+'.pdf');
			       },
			   	margins
			   )
	    
	    }	    
	    function JSONToPDFConvertor1(JSONData,name){
	    	var doc = new jsPDF();
	    	doc.setFontSize(16);
	    	doc.text(20, 20, 'SOP Report');
	    	doc.line(20, 22, 60, 22); // horizontal line			
	    	doc.setLineWidth(2);
	    	doc.setFontSize(12);
	    	var clientName = JSONData[0].clientName;
	    	var accountName = JSONData[0].accountName;
	    	var authorName = localStorage.getItem("userID");
	    	if(typeof (JSONData[0].alertRaisedTimeStamp) == 'undefined'){ JSONData[0].alertRaisedTimeStamp = 'Not Available'}
	    	 if(typeof (JSONData[0].updatedByUserId) == 'undefined'){ JSONData[0].updatedByUserId = 'Not Available'}
	    	 if(typeof (JSONData[0].updateTimestamp) == 'undefined'){ JSONData[0].updateTimestamp = 'Not Available'}
	    	var sopCratedOn = convertDate(JSONData[0].alertRaisedTimeStamp);
	    	var applicationName = JSONData[0].applicationName;
	    	var updatedByUserId = JSONData[0].updatedByUserId;
	    	var updateTimestamp = convertDate(JSONData[0].updateTimestamp);
	    	
	    	var alertName = JSONData[0].alertName;
	    	 if(typeof (JSONData[0].alertShortDesc) == 'undefined'){JSONData[0].alertShortDesc = 'Not Available'}
	    	 if(typeof (JSONData[0].alertType) == 'undefined'){JSONData[0].alertType = 'Not Available'}
	    	 if(typeof (JSONData[0].alertSeverity) == 'undefined'){JSONData[0].alertSeverity = 'Not Available'}
	    	var alertShortDesc = JSONData[0].alertShortDesc;
	    	var alertType = JSONData[0].alertType;
	    	var alertSeverity = JSONData[0].alertSeverity;
	    	var SOPData = JSONData[0].SOPs;
	    	var fileName = SOPData[0].SOPName;
	    	var WorkflowAutomationID = SOPData[0].WorkflowAutomationID;
	    	if(typeof (SOPData[0].WorkflowAutomationUserId) == 'undefined' || SOPData[0].WorkflowAutomationUserId ==''){SOPData[0].WorkflowAutomationUserId = 'Not Available'}
	    	var WorkflowAutomationUserId = SOPData[0].WorkflowAutomationUserId;
	    	if(typeof (SOPData[0].SOPShortDesc) == 'undefined'){SOPData[0].SOPShortDesc = 'Not Available'}
	    	var SOPShortDesc = SOPData[0].SOPShortDesc;
	    	var SOPPurpose = SOPData[0].SOPPurpose;
	    	if(typeof (SOPData[0].Classification) == 'undefined'){SOPData[0].Classification = 'Not Available'}	
	    	var Classification = SOPData[0].Classification;
	    	var AutomationProvider = SOPData[0].AutomationProvider;
	    	if(typeof (SOPData[0].ExpectedInput) == 'undefined'){SOPData[0].ExpectedInput = 'Not Available'}
	    	var ExpectedInput = SOPData[0].ExpectedInput;
	    	if(typeof (SOPData[0].ExpectedOutput) == 'undefined'){SOPData[0].ExpectedOutput = 'Not Available'}	
	    	var ExpectedOutput = SOPData[0].ExpectedOutput;
	    	var TaskExecutionFlows = SOPData[0].TaskExecutionFlows;
	        var TaskMasters = TaskExecutionFlows[0].TaskMasters;
	    	
	    	doc.text(20, 30, 'Client Name - '+clientName);
	    	doc.text(90, 30, 'Account Name - '+accountName);
	    	doc.text(20, 35, 'Author Name - '+authorName);
	    	doc.text(20, 40, 'SOP Created On - '+sopCratedOn);
	    	doc.text(20, 45, 'Last Update By - '+updatedByUserId);
	    	doc.text(20, 50, 'Last Update On - '+updateTimestamp);
	    	
	    	doc.setFontSize(14);
	    	doc.text(20, 62, 'Alert Details');
	    	doc.setFontSize(12);
	    	doc.text(20, 70, '1. Application - '+applicationName);
	    	doc.text(20, 75, '2. Alert Name - '+alertName);
	    	doc.text(20, 80, '3. Description - '+alertShortDesc);
	    	doc.text(20, 90, '4. Type - '+alertType);
	    	doc.text(20, 95, '5. Severity - '+alertSeverity);
	    	
	    	doc.setFontSize(14);
	    	doc.text(20, 102, 'SOP Details');
	    	doc.setFontSize(12);
	    	
	    	
	    	doc.text(20, 110, '1. Name -'+fileName);
	    	doc.text(20, 115, '2. Automation ID -'+WorkflowAutomationID);
	    	doc.text(20, 120, '3. User ID - '+WorkflowAutomationUserId);
	    	doc.text(20, 125, '4. Description - '+SOPShortDesc);
	    	doc.text(20, 135, '5. Purpose - '+SOPPurpose);
	    	doc.text(20, 140, '6. Automation Provider - '+AutomationProvider);
	    	doc.text(20, 145, '7. Classification - '+Classification);
	    	doc.text(20, 150, '8. Expected Input - '+ExpectedInput);
	    	doc.text(20, 155, '9. Expected Output - '+ExpectedOutput);
	    	
	    	doc.setFontSize(14);
	    	doc.text(20, 162, 'Task Details');
	    	
	    	doc.setFontSize(1);
	    	doc.setLineWidth(0.5);
	    	/*
	    	doc.text(20, 170, 'Order');
	    	doc.text(40, 170, 'Name');
	    	doc.text(90, 170, 'Description');
	    	doc.setFontSize(12);
	    	for(var i = 0; i < TaskMasters.length; i++){
	    		console.log(TaskMasters[i].TaskExecutionOrder);
	    		var rowPos = 175 + 8*i;
	    		doc.text(20, rowPos, TaskMasters[i].TaskExecutionOrder);
	    		doc.text(40, rowPos, TaskMasters[i].TaskName);
	    		var taskDescription = TaskMasters[i].TaskShortDesc.replace(/<[^>]+>/gm, '');
	    		doc.text(80, rowPos, taskDescription);	    		
	    	}
	    	*/
	    	 source = $('#taskPdfRecordTable')[0];
	    	 specialElementHandlers = { 	            
	 	            '#bypassme': function (element, renderer) {
	 	                return true
	 	            }
	 	        };
	 	        margins = {
	 	            top: 160,
	 	            bottom: 60,
	 	            left: 20,
	 	            width: 700
	 	        };
	 	        
	 	       doc.fromHTML(
	 	  	        source, // HTML string or DOM elem ref.
	 	  	        margins.left, // x coord
	 	  	        margins.top, { // y coord
	 	  	            'width': margins.width, // max width of content on PDF
	 	  	            'elementHandlers': specialElementHandlers
	 	  	        });
	 	        
	    	doc.save(fileName+'.pdf');
	    	
	    }     	 
	    
	    function convertDate(t) {
    		var d = new Date(t);
	    	  var month = d.getMonth()+1;
		        var mVal ="";
		        if(month == 1){mVal='JAN';}else if(month == 2){mVal = 'FEB';}else if(month == 3){mVal = 'MAR';}else if(month == 4){mVal = 'APR';}
		        else if(month == 5){mVal = 'MAY'}else if(month == 6){mVal = 'JUN'}else if(month == 7){mVal = 'JUL'}else if(month == 8){mVal = 'AUG'}
		        else if(month == 9){mVal = 'SEP'}else if(month == 10){mVal = 'OCT'}else if(month == 11){mVal = 'NOV'}else if(month == 12){mVal = 'DEC'}
		        var day = d.getDate();
		        var hours = d.getHours();
		        var minutes = d.getMinutes();
		        var ampm = hours >= 12 ? 'PM' : 'AM';
		        hours = hours % 12;
		        hours = hours ? hours : 12; // the hour '0' should be '12'
		        minutes = minutes < 10 ? '0'+minutes : minutes;
		        var strTime = hours + ':' + minutes + ' ' + ampm;
		      
		        
		        
		        var timeInMs =        
		        	((''+day).length<2 ? '0' : '') + day+ '-' + mVal + '-' +d.getFullYear()+' '+strTime ;
		        return timeInMs;
	    }
	    
