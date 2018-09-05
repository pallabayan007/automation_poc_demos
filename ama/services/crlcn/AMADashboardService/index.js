

var http = require("http");
var URL = require("url");
var path = require("path");
var uuid = require("node-uuid");

var SOPConfig = require("../../../../config/SOPConfig.json");

var excelOperator = require("../../../common/ExcelOperator");

var logger = getLogger("AMADashboardService");


exports.monitoring = function(req, res){
	var event = req.body;
	
	var url = req.protocol + '://' + req.get('Host') + "/rest/ListenMonSys";
	var urlObj = URL.parse(url);
	var option = {
		method : "POST",
		port : urlObj.port,
		hostname : urlObj.hostname,
		path : urlObj.path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var request = http.request(option, function(response) {
		var data = '';
		response.on("data", function(chunk) {
			data += chunk;
		});
		response.on("end", function() {
			res.status(200).send(data);
		});
	});
	request.on("error", function(e) {
		logger.info("error message: " + e.message);
		res.status(400);
	});
	request.write(JSON.stringify(event));
	request.end();
}

exports.reqDownloadTicketAuditLog = function(req, res){
	var query = req.body;
	var url = req.protocol + '://' + req.get('Host') + "/rest/TicketAuditLog/query";
	var urlObj = URL.parse(url);
	var option = {
			method : "POST",				
		    port : urlObj.port,
		    hostname : urlObj.hostname,
		    path : urlObj.path,
		    headers : {
				"Content-Type" : "application/json",
				"Authorization" : SOPConfig.basicAuthHeader,
			}
	}
		
	var request = http.request(option, function(response) {
		var data = '';
		response.on("data", function(chunk) {			
			data += chunk;
		});
		response.on("end", function() {
			
			//var write_data = [["Log", "Account_ID", "Account_Name", "Application_ID", "Application_Name",  "Alert_ID", "Alert_Name", "Alert_Description", "Raised_Time", "Completed_Time", "Status", "IOD #"]];
			var write_data = [["Log #","Account Name","Application Name","Ticket Key","Subject","Raised By","Assigned To","Assignment Group","Type","Priority","Urgency","Status","SLA Due Date","Impact","Cause","Category","Raised Time","Complete Time","Remediation State","Error Message","Error Type","Log Details","Ticketing Tool Name","Automation Provider","SOP ID","IOD #","Execution ID","Customized Input Parameter","Returned Output Message"]];
			var result = JSON.parse(data);
			for(var i = 0 ; i < result.length; i++){
				var item = result[i];
				
					if(item.createTime) {
						item.createTime = getLocalTime(item.createTime, query.timezoneOffset);
					}
				
					if(item.completedTime) {
						item.completedTime = getLocalTime(item.completedTime, query.timezoneOffset);
					}
					
					
					//Concatenate the logDetails as per requirement/BA suggestion
					var logDetails = null;
					
					if(item.logDetails.length > 0){
						logDetails = JSON.stringify(item.logDetails);						
					} else {
						logDetails = "NA";
					}
					
					
				var row = [(i+1),item.account, item.application, item.ticketKey, item.subject, item.requester, item.assignee, item.asignmentGroup, item.type, item.priority, item.urgency, item.status, item.SLADueDate, item.impact, item.cause, item.category, item.createTime, item.completedTime, item.remediationState, item.errorMessage, item.errorType, logDetails, item.ticketingToolName, item.automationProvider, item.sopID, item.iodID, item.executionID, item.customizedInputParams, item.returnedOutputMessages];
				write_data.push(row);
			}
			
			var timestamp = uuid.v1();
			var excelFileName = "TicketAuditLogs_" + timestamp + ".xlsx"; 
			var sheetName = "Audit Logs"; 
			
			var sheets = {
			};
			
			sheets[sheetName] = write_data;
			
			//logdetails - commented for now as log details already coming in the main worksheet
			/*for(var i = 0 ; i < result.length; i++){
				var item = result[i];
//				var name = item.alertID + "_" + item._id;
				var name = "Log_" + (i + 1);
				var logDetails = item.logDetails;
				var logs =[["Message", "Timestamp"]];
				for(var j= 0 ; j< logDetails.length; j++){
					var log = logDetails[j];
					if(log.timestamp) {
						log.timestamp = getLocalTime(log.timestamp, query.timezoneOffset);
					}
					logs.push([log.message, log.timestamp]);
				}
				sheets[name] = logs;
			}*/
			
			excelOperator.writeExcel2 (sheets, excelFileName);
//			excelOperator.writeExcel (sheetName, write_data, excelFileName);
			var file = req.protocol + '://' + req.get('Host') + "/file/AlertAuditLog/download/" + excelFileName;
			res.json({
				file : file
			});
		});
	});
	request.on("error", function(e) {
		logger.info("error message: " + e.message);
		res.status(400);
	});
	request.write(JSON.stringify(query));
	request.end();
}


exports.reqDownloadAlertAuditLog = function(req, res){
	var query = req.body;
	var url = req.protocol + '://' + req.get('Host') + "/rest/AlertAuditLog/query";
	var urlObj = URL.parse(url);
	var option = {
		method : "POST",
		port : urlObj.port,
		hostname : urlObj.hostname,
		path : urlObj.path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var request = http.request(option, function(response) {
		var data = '';
		response.on("data", function(chunk) {
			data += chunk;
		});
		response.on("end", function() {
			
			//var write_data = [["Log", "Account_ID", "Account_Name", "Application_ID", "Application_Name",  "Alert_ID", "Alert_Name", "Alert_Description", "Raised_Time", "Completed_Time", "Status", "IOD #"]];
			var write_data = [["Log#", "Account Name", "Application Name", "Alert ID", "Alert Name","Alert Description","Alert State","Alert Source","Alert Resource","Alert Severity", "Alert Type","Alert Raised Time", " Alert Created Time", "Completed Time","Status", "Error Message", "Error Type", "Log Details","Monitoring Tool Name","Automation Provider","SOP ID","IOD#","Execution ID","Customized Input Parameter","Returned Output Message"]];
			var result = JSON.parse(data);
			for(var i = 0 ; i < result.length; i++){
				var item = result[i];
				
					if(item.createTime) {
						item.createTime = getLocalTime(item.createTime, query.timezoneOffset);
					}
				
					if(item.completedTime) {
						item.completedTime = getLocalTime(item.completedTime, query.timezoneOffset);
					}
					
					if(item.alertRaisedTime) {
						item.alertRaisedTime = getLocalTime(item.alertRaisedTime, query.timezoneOffset);
					}
					
					//Concatenate the logDetails as per requirement/BA suggestion
					var logDetails = null;
					
					if(item.logDetails.length > 0){
						logDetails = JSON.stringify(item.logDetails);						
					} else {
						logDetails = "NA";
					}
					
					
				var row = [(i+1),item.accountName, item.applicationName, item.alertID, item.alertName, item.alertDesc, item.alertState, item.alertSource, item.alertResource, item.alertSeverity, item.alertType, item.alertRaisedTime, item.createTime, item.completedTime, item.status, item.errorMessage, item.errorType, logDetails, item.monitoringToolName, item.automationProvider, item.sopID, item.iodID, item.executionID, item.customizedInputParams, item.returnedOutputMessages];
				write_data.push(row);
			}
			
			var timestamp = uuid.v1();
			var excelFileName = "AuditLogs_" + timestamp + ".xlsx"; 
			var sheetName = "Audit Logs"; 
			
			var sheets = {
			};
			
			sheets[sheetName] = write_data;
			
			//logdetails - commented for now as log details already coming in the main worksheet
			/*for(var i = 0 ; i < result.length; i++){
				var item = result[i];
//				var name = item.alertID + "_" + item._id;
				var name = "Log_" + (i + 1);
				var logDetails = item.logDetails;
				var logs =[["Message", "Timestamp"]];
				for(var j= 0 ; j< logDetails.length; j++){
					var log = logDetails[j];
					if(log.timestamp) {
						log.timestamp = getLocalTime(log.timestamp, query.timezoneOffset);
					}
					logs.push([log.message, log.timestamp]);
				}
				sheets[name] = logs;
			}*/
			
			excelOperator.writeExcel2 (sheets, excelFileName);
//			excelOperator.writeExcel (sheetName, write_data, excelFileName);
			var file = req.protocol + '://' + req.get('Host') + "/file/AlertAuditLog/download/" + excelFileName;
			res.json({
				file : file
			});
		});
	});
	request.on("error", function(e) {
		logger.info("error message: " + e.message);
		res.status(400);
	});
	request.write(JSON.stringify(query));
	request.end();
}

exports.downloadAlertAuditLog = function(req, res){
	var filename = req.params.filename;
	if(!filename){
		res.send(400, "No filename specified");
		return;
	}
	var filepath = path.resolve(__dirname, "../../../../temp/" + filename);
	res.attachment(filepath);
	res.sendFile(filepath);
}

var getLocalTime = function(time, offset) {
	
	if (!time) return "";
	
	var localTime = time;
	var timezoneOffset = -(offset * 60 * 1000);
	var hour = Math.floor(Math.abs(offset) / 60);
	var minute = Math.abs(offset) - hour * 60;
	
	try {
		localTime = new Date(new Date(time).getTime() + timezoneOffset).toISOString().replace("T", " ").substring(0, 19); //.toLocaleFormat("%Y-%m-%d %H:%M:%S");
		localTime += " UTC " + (timezoneOffset >= 0 ? "+" : "-") + (hour < 10 ? "0" : "") + hour + (minute < 10 ? "0" : "") + minute;
	} catch(e) {
		logger.info(e);
	} finally {
		return localTime;
	}
}
