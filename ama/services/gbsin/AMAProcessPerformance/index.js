/**
 * ./ama/services/gbsin/AMAProcessPerformance/index.js
 * 
 * Generates performance report of the processed tickets/alerts.
 * Provides a clear picture about the time taken to carry our multiple steps of
 * the process - starting from the recording of incidents to completion of the automation process
 * as notified by the Automation System.
 * 
 * Date - July 26th, 2016.
 * Author - IBM.
 */

var models = require("../../../../models");
var moment = require("moment");
var AlertAuditLog = models.AlertAuditLog;
var TicketAuditLog = models.TicketAuditLog;
var json2csv = require("json2csv");

/*
 * Process List of Incident Records, calculate the time difference to complete each step for an individual incidents
 * Generate a list for each individual incidents collating the time taken to complete each individual steps one by one.
 * 
 */
function generateProcessTimeReport(listOfTickets) {
	var sizeIncidents=listOfTickets.length;
	var records = [];
	for(var index=0; index<sizeIncidents ; index++){
		var incident= listOfTickets[index];
		var incidentLogs = incident.logDetails;
		var startTime= incident.createTime; 
		for (var indexSecond=0; logLength = incidentLogs.length, indexSecond < logLength; indexSecond++) {
			var currentLog = incidentLogs[indexSecond];
			var unitRecord={};
			unitRecord["Incident"] = incident.ticketKey + " ("+incident.ticketID+")";
			unitRecord["Step"] = "Step-"+ (indexSecond+1) ;
			unitRecord["Activity"] = currentLog.subject;
			unitRecord["Sub-Activity"] = currentLog.message;
			var stepFinishTime = currentLog.timestamp;
			var stepDuration = (stepFinishTime - startTime)/1000; // converting milliseconds to second
			//console.log("[incidentCreateTime, stepTimeStamp]:["+incident.createTime+","+currentLog.timestamp+"] Start Time :"+startTime+ " Finish Time :"+stepFinishTime+ " Duration:"+stepDuration);
			if(stepDuration<0){
				stepDuration = Math.abs(stepDuration);
			}
			unitRecord["Duration(Sec)"] = stepDuration;
			records.push(unitRecord);
			startTime = stepFinishTime; //Finish Time of the current step will start time for the next step			
		}
	}
	
	return records;
}

/*
 * Creates a csv content from the given list of records
 */
function createCSVContent(ticketProcessingDtlRecords) {
	var fields = ['Incident', 'Step', 'Activity', 'Sub-Activity', 'Duration(Sec)'];
	var csv = json2csv({ data: ticketProcessingDtlRecords, fields: fields })
	return csv;
}

/*
 * Service URL    : /rest/external/v1/PerformanceReport 
 * HTTP METHOD    : GET
 * Content Type   : application/json
 * 
 * Responsibility : Gathers the Performance Information From The Db
 * and provides a comprehensible report containing all the data points
 * related to sub-process execution time.
 * 
 *  
 */
exports.performanceReport = function (req, res) {
	
	console.log( "===Inside Performance Report===");
	//TODO : Fetch Ticket Audit Log Information with valid logDetails Record
	//TODO : Calculate the time difference for each steps
	//TODO : Populate the Response structure with the calculated values.
	TicketAuditLog.find ({"logDetails.0" : {"$exists" : true}},'ticketKey ticketID createTime logDetails', function(err,tickets){
		if(err){
			res.status(500).send({ result : "error", errorDetails : err});
		} else {
			var ticketProcessingDtlRecords = generateProcessTimeReport(tickets);
//			res.status(200).send({ result : "success", records : ticketProcessingDtlRecords});
			var csvContent = createCSVContent(ticketProcessingDtlRecords);
			res.writeHead(200,{'content-type':'text/csv'});
		    res.write(csvContent);
		    res.end();
		}
	});
	
	
	
	
}
