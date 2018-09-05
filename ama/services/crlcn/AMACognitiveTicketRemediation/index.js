var http = require("http");
var URL = require("url");
var uuid = require("node-uuid");
var async = require("async");
var moment = require("moment");
var request = require("request");

var logger = getLogger("AMACognitiveTicketRemediation");

var config = require("../../../../config");
var mapper = require("../../../../config/mapper_config.json");
var SOPConfig = require("../../../../config/SOPConfig.json");
var config_info = require("../../../../config/workflow_manager_config.json");
var CognitiveRemediationConfig = require("../../../../config/CognitiveRemediationConfig.json");
var WorkflowManager = require("../../../../ama/services/crlcn/AMAServiceManagementAgent/client/WorkflowManager.js");
var AMAServiceManagementAgent = require("../../../../ama/services/crlcn/AMAServiceManagementAgent")

var models = require("../../../../models");
var AlertAuditLog = models.AlertAuditLog;
var TicketAuditLog = models.TicketAuditLog;


var COMPONENT_NAME = "Cognitive Ticket Remediator";



var runAutomation = exports.RunAutomation = function(req, res) {

	// generate a new ticket based on input message;
	var inputData = req.body;
	logger.info(JSON.stringify(inputData));
	var ticket = generateTicket(inputData);

	processTicketRequest(ticket, function(err, ticket_audit_log_id) {
		logger.info("processed " + ticket.cause + " (" + ticket.application
				+ ")");

		// set the response value.
		var statusCode = 0; 
		var message = ""; 
		if (err) {
			statusCode = 1;
			message = err.message; 
		}
		var responseData = {
	        statusCode : statusCode, 
	        automationExecutionID : ticket_audit_log_id, 
	        message : message
		}; 

		res.status(200).send(responseData);
	});
};

var generateTicket = function(inputData) {

	var ticket = {
		requester : "",
		assignee : "",
		asignmentGroup : "",
		type : CognitiveRemediationConfig.type,
		priority : "",
		subject : inputData.automationName,
		status : CognitiveRemediationConfig.status,
		SLADueDate : new Date(),
		openedAt : new Date(),
		closedAt : new Date(),
		account : inputData.accountId,
		impact : "",
		cause : "",
		application : CognitiveRemediationConfig.application,
		urgency : CognitiveRemediationConfig.urgency,
		category : "",
		relatedTicket : "null",
		ticketKey : inputData.automationName,
		ticketingToolName : CognitiveRemediationConfig.ticketToolName,
		updateTimestamp : new Date(),
		updatedByUserId : "",
		updateComment : "",
		templateBased : "",
		ticketNumber : inputData.automationName,
		monitoringToolName : CognitiveRemediationConfig.monitorToolName,
		createTime : new Date(), 
		accountName : inputData.accountId,
		clientName : inputData.clientId,
		alertPublishName : "",
		inputParams : JSON.stringify(inputData.automationInputParameters)
	};
	//"Upgrade to Oracle 11ichange_request[][][]"
	return ticket;
}

var getAutomationExeResult = exports.GetAutomationExeResult = function (req, res) {
	
	// {  automationExecutionID : “” // automation execution identifier for status retrieval }
	var automationExecutionID = req.body.automationExecutionID; 	
	
	// extract the ticket_audit_log to check the status
	// if err, construct result based on error message
	// if complete, further extract return message from the iod execution
	getTicketAuditLog(automationExecutionID, function(err, ticketAuditLog){
		
		var returnObject = {}; 
		returnObject.statusCode = "0"; 
		if (ticketAuditLog.remediationState == "Completed") {
			returnObject.automationStatus = "Complete"; 
			returnObject.automationResponseMsg = ticketAuditLog.returnedOutputMessages; 
		} else if (ticketAuditLog.remediationState == "Error" || ticketAuditLog.remediationState == "SOPNotDefinedError") {
			returnObject.automationStatus = "Error"; 
			returnObject.message = ticketAuditLog.errorMessage; 
		} else {
			returnObject.automationStatus = "In Progress"; 
		}

		res.status(200).send(returnObject);
	}); 
}

var processTicketRequest = function(ex_ticket,
		callback) {

	var log_id = uuid.v4();

	var ret = JSON.parse(JSON.stringify(ex_ticket));
	ret["log_id"] = log_id;

	async
			.waterfall(
					[
							function(sub_callback) {
								SearchTicket(
										ex_ticket,
										function(err, ticket) {
											logger.info("Search Ticket Result - err::"+err+" ticket::"+ticket);
											if (err || !ticket) {
												//Unlike IMT based Tickets here ticket numbers may not be unique - so ticket number based searching not required here
												CreateAuditLogWithoutMatchedTicket(
														ex_ticket,
														function(err,
																ticket_audit_log) {
															if (err) {
																logger
																.error(err);
																callback(err); 
																return sub_callback(err);
															} else {
																var newErr = new Error(
																		"Cannot find matched ticket -"
																		+ ex_ticket.number);
																callback(newErr, ticket_audit_log._id);
																return sub_callback(newErr, ticket_audit_log._id);
															}
														});
												
												
											} else {
												logger
														.info(
																"Find a Alert: %s",
																ticket.Tickets.ticketKey);
												return sub_callback(err,
														log_id, ex_ticket,
														ticket);
											}
										});
							},
							function(log_id, ex_ticket, ticket, sub_callback) {
								logger.info("Start to getApplication");
								getApplication(ticket.Tickets.account,
										ticket.Tickets.applicationName,
										function(err, application) {
											logger.info(err);
											sub_callback(err, log_id,
													ex_ticket, ticket,
													application);
										});
							},
							function(log_id, ex_ticket, ticket, application,
									sub_callback) {
								logger.info("Start to CreateTicketAuditLog");
								CreateTicketAuditLog(
										ex_ticket,
										ticket,
										function(err, ticket_audit_log) {
											if (err) {
												logger.error(err);
												callback(err);
												return sub_callback(err);
											}
											
											callback(null, ticket_audit_log._id);
											
											ticket_audit_log.logDetails
													.push({
														subject : COMPONENT_NAME,
														type : "INFO",
														message : "The ticket has been mapped to Ticket: (Ticket ID:"
																+ ticket.Tickets._id
																+ ")",
														timestamp : new Date()
													});
											ticket_audit_log.logDetails
													.push({
														subject : COMPONENT_NAME,
														type : "INFO",
														message : "Ticket audit log has been persisted. (Ticket Log ID:"
																+ ticket.Tickets._id
																+ ")",
														timestamp : new Date()
													});
											UpdateTicketAuditLog(
													ticket_audit_log, function(
															err, updated) {
														sub_callback(err,
																log_id, ticket,
																updated);
													});
										});
							},
							function(log_id, ticket, ticket_audit_log,
									sub_callback) {
								var ticket_audit_log_id = ticket_audit_log._id;
								logger.info("Create Audit Log : "
										+ ticket_audit_log_id);
								ticket_audit_log.logDetails
										.push({
											subject : COMPONENT_NAME,
											type : "INFO",
											message : "Ticket audit log has been passed to EventMapNSOPService.",
											timestamp : new Date()
										});
								UpdateTicketAuditLog(
										ticket_audit_log,
										function(err, ticket_audit_log) {
											StartTicketSOPTranslation(
													ex_ticket,
													ticket,
													ticket_audit_log,
													function(err, data) {
														sub_callback(
																err,
																log_id,
																ticket,
																ticket_audit_log,
																data);
													});
										});
							} ], function(err, log_id, ticket,
							ticket_audit_log, sop) {
						if (err) {
							logger.error("ERROR: " + err);
							if (ticket_audit_log) {
								ticket_audit_log.logDetails.push({
									subject : COMPONENT_NAME,
									type : "ERROR",
									message : "ERROR: " + err,
									timestamp : new Date()
								});
								UpdateTicketAuditLog(ticket_audit_log,
										function(err, ticket_audit_log) {
										});
							}
						}
//						callback(err, log_id);
					});
}

var CreateTicketAuditLog = function(ticket, internal_ticket, callback) {
	logger.info("monitoring agent ticket %s", JSON.stringify(ticket));
	var path = "/rest/TicketAuditLog";
	var option = {
		method : "POST",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200 && res.statusCode != 201) {
					return callback(new Error(data));
				}
				var result = JSON.parse(data);
				callback(null, result);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});

	req.write(JSON.stringify({
		"ticketID" : internal_ticket.Tickets._id,
		"requester" : ticket.requester,
		"assignee" : ticket.assignee,
		"asignmentGroup" : ticket.asignmentGroup,
		"type" : ticket.type,
		"priority" : ticket.priority,
		"subject" : ticket.subject,
		"status" : ticket.status,
		"SLADueDate" : ticket.SLADueDate,
		"openedAt" : ticket.openedAt,
		"closedAt" : ticket.closedAt,
		"account" : ticket.account,
		"impact" : ticket.impact,
		"cause" : ticket.cause,
		"application" : ticket.application,
		"urgency" : ticket.urgency,
		"subject" : ticket.subject,
		"priority" : ticket.priority,
		"category" : ticket.category,
		"relatedTicket" : ticket.relatedTicket,
		"ticketKey" : ticket.ticketKey,
		"ticketingToolName" : ticket.ticketingToolName,
		"updateTimestamp" : new Date(),
		"updatedByUserId" : ticket.updatedByUserId,
		"updateComment" : ticket.updateComment,
		"templateBased" : ticket.templateBased,
		"ticketNumber" : ticket.ticketNumber,
		"remediationState" : "In Progress",
		"createTime" : ticket.createTime || new Date(),
		"completedTime" : ticket.completedTime,
		"logDetails" : [], 
		"customizedInputParams" : ticket.inputParams
	}));
	req.end();
}

var SearchTicket = function(ticket, callback) {

	logger.info("Retrieving SOP for ticket...");
	var path = "/rest/v1/sopmeta/GetSOPForEvent/ticket?EventKey="
			+ encodeURIComponent(ticket.ticketKey);
	var option = {
		method : "GET",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200) {
					return callback(new Error(data + "(" + url + ")"));
				}
				var result = JSON.parse(data);
				logger.info("Result of GetSOPForEvent call::"+data);
				callback(null, result.response);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});
	req.end();
}

var SearchAlert = function(alertName, accountName, applicationName, callback) {
	var path = "/rest/v1/sopmeta/GetSOPListForAlertSR?accountName="
			+ encodeURIComponent(accountName) + "&applicationName="
			+ encodeURIComponent(applicationName) + "&alertName="
			+ encodeURIComponent(alertName);
	var option = {
		method : "GET",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200) {
					return callback(new Error(data + "(" + url + ")"));
				}
				var result = JSON.parse(data)[0];
				callback(null, result);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});
	req.end();
}

var getApplication = function(accountID, applicationName, callback) {
	var path = "/rest/v1/sopmeta/GetApplicationListForAccount?accountId="
			+ accountID;
	var option = {
		method : "GET",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200 && res.statusCode != 201) {
					return callback(new Error(data));
				}
				logger.info(data);
				var result = JSON.parse(data);
				result = result.response;
				if (result.length == 0) {
					return callback(new Error("cannot find application:"
							+ applicationName))
				}
				for (var i = 0; i < result.length; i++) {
					if (result[i].applicationName == applicationName) {
						callback(null, {
							applicationID : result[i]._id,
							applicationName : result[i].applicationName
						});
						break;
					}
				}
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});
	req.end();
}

var CreateAuditLogWithoutMatchedTicket = function(ticket, callback) {
	logger.info("monitoring agent ticket %s", JSON.stringify(ticket));
	var path = "/rest/TicketAuditLog";
	var option = {
		method : "POST",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200 && res.statusCode != 201) {
					return callback(new Error(data));
				}
				var result = JSON.parse(data);
				callback(null, result);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});

	req.write(JSON.stringify({
		"requester" : ticket.requester,
		"assignee" : ticket.assignee,
		"asignmentGroup" : ticket.asignmentGroup,
		"type" : ticket.type,
		"priority" : ticket.priority,
		"subject" : ticket.subject,
		"status" : ticket.status,
		"SLADueDate" : ticket.SLADueDate,
		"openedAt" : ticket.openedAt,
		"closedAt" : ticket.closedAt,
		"account" : ticket.account,
		"impact" : ticket.impact,
		"cause" : ticket.cause,
		"application" : ticket.application,
		"urgency" : ticket.urgency,
		"subject" : ticket.subject,
		"priority" : ticket.priority,
		"category" : ticket.category,
		"relatedTicket" : ticket.relatedTicket,
		"ticketKey" : ticket.ticketKey,
		"ticketingToolName" : ticket.ticketingToolName,
		"updateTimestamp" : new Date(),
		"updatedByUserId" : ticket.updatedByUserId,
		"updateComment" : ticket.updateComment,
		"templateBased" : ticket.templateBased,
		"ticketNumber" : ticket.ticketNumber,
		"remediationState" : "SOPNotDefinedError",
		"createTime" : ticket.createTime || new Date(),
		"completedTime" : ticket.completedTime,
		"errorMessage" : "SOP for automation is not available in the system.",
		"errorType" : "SOPNotDefined",
		"logDetails" : [], 
		"customizedInputParams" : ticket.inputParams
	}));
	req.end();
}

var CreateAlertAuditLog = function(alert, callback) {

	var path = "/rest/AlertAuditLog";
	var option = {
		method : "POST",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200 && res.statusCode != 201) {
					return callback(new Error(data));
				}
				var result = JSON.parse(data);
				callback(null, result);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});

	var status = alert.isScheduled ? "In Progress" : "In Progress";

	req.write(JSON.stringify({
		"alertID" : alert.alertID,
		"applicationID" : alert.applicationID,
		"applicationName" : alert.applicationName || "",
		"accountID" : alert.accountID,
		"alertName" : alert.alertName || "",
		"alertDesc" : alert.alertDesc || "",
		"status" : status,
		"alertState" : alert.alertState || "",
		"alertShortDesc" : alert.alertShortDesc || "",
		"alertSource" : alert.alertSource || "",
		"alertResource" : alert.alertResource || "",
		"alertSeverity" : alert.alertSeverity || "Medium",
		"relatedAlerts" : alert.relatedAlerts || [],
		"alertRaisedTime" : alert.alertRaisedTime || new Date(),
		"alertType" : alert.alertType || "",
		"incident" : alert.incident || "",
		"events" : alert.events || [],
		"monitoringToolName" : alert.monitoringToolName || "",
		"automationProvider" : alert.automationProvider || "",
		"logDetails" : []
	}));

	req.end();
}

var UpdateTicketAuditLog = function(ticket_audit_log, callback) {
	var path = "/rest/TicketAuditLog/" + ticket_audit_log._id;
	var option = {
		method : "PUT",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200 && res.statusCode != 201) {
					return callback(new Error(data));
				}
				var result = JSON.parse(data);
				callback(null, result);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});

	req.write(JSON.stringify(ticket_audit_log));

	req.end();
}

var getTicketAuditLog = function(id, callback) {
	var path = "/rest/TicketAuditLog/" + id;
	var option = {
		method : "GET",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200 && res.statusCode != 201) {
					return callback(new Error(data));
				}
				var result = JSON.parse(data);
				callback(null, result);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});
	req.end();
}


var UpdateAlertAuditLog = function(alert_audit_log, callback) {
	var path = "/rest/AlertAuditLog/" + alert_audit_log._id;
	logger.info("inside alert audit log")
	var option = {
		method : "PUT",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200 && res.statusCode != 201) {
					return callback(new Error(data));
				}
				var result = JSON.parse(data);
				callback(null, result);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});

	req.write(JSON.stringify(alert_audit_log));

	req.end();
}

var StartTicketSOPTranslation = function(ex_ticket, ticket, ticket_audit_log,
		callback) {
	var path = "/rest/ProcessTicketSOPTranslation_CognitiveRemediation";
	var option = {
		method : "POST",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200) {
					return callback(new Error(data));
				}
				callback(null, JSON.parse(data));
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});

	req.write(JSON.stringify({
		ticket : ticket,
		ex_ticket : ex_ticket,
		ticket_audit_log : ticket_audit_log
	}));
	req.end();
}

var StartSOPTranslation = function(ex_alert, alert, alert_audit_log, callback) {
	var path = "/rest/ProcessSOPTranslation";
	var option = {
		method : "POST",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200) {
					return callback(new Error(data));
				}
				callback(null, JSON.parse(data));
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});

	req.write(JSON.stringify({
		alert : alert,
		ex_alert : ex_alert,
		alert_audit_log : alert_audit_log
	}));
	req.end();

}

exports.UpdateAutomationExeResult = function(req, res) {

	// update alert/ticket logs based on input message;
	var inputData = req.body;
	//Updating the ticket.json
	AMAServiceManagementAgent.FileWrite("\config\\ticket.json", JSON.stringify(inputData));
	logger.info("data by post "+ req.body.eventType);	
	var eventType = req.body.eventType;
	var id = req.body.gbEventId;
	var statusReturned = req.body.status;
	var updateTime = req.body.updateTime;
	var errorMessage = req.body.statusMsg;
	var automationResponseMsg = req.body.automationResponseMsg;
	var alert_audit_log = null;
	var ticket_audit_log =null;
	var newDate =  moment(updateTime, "YYYY-MM-DD HH:mm:ss");
	var instanceID = req.body.pid;
	/*if(inputData.hasOwnProperty("pname")){
		logger.info("got pname from robot");
//		IOD["pname"] = req.body.pname;
	}*/
	
//	var connectionProperties = config_info.adapters.WorkflowManagerAdapter.connection.connectionProperties;
//	logger.info("connectionProperties from UpdateAutomationExeResult: " + JSON.stringify(connectionProperties));
	logger.info("Instance ID :" + instanceID);
//	logger.info("Instance Name :" + pName);
	logger.info("req received from BP ------------------ "+ JSON.stringify(inputData) );
	
	
	/*var options_proc_start1 = {
			  uri: connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/process-definition/key/' + pName + '/start',
			  method: 'POST',
			  auth: {
				'user': connectionProperties.authetication.userId,
				'pass': connectionProperties.authetication.password,
				'sendImmediately': true
			  },
			  header: {
				 "Content-Type": "application/json"
			  },
			  json: {}
		};

	logger.info("options_proc_start1 : " + JSON.stringify(options_proc_start1));
	request(options_proc_start1, function (error_get_task1, response_get_task1, body_get_task1) {
		  logger.info("Status1 :" + response_get_task1.statusCode);
		  logger.info("response_get_task1: " + JSON.stringify(response_get_task1));
	});*/
	
	if(eventType!=null && eventType.toLowerCase() =="alert"){
		logger.info("updateTime"+ newDate );
		getAlertAuditLog(id, function(err, data){
			if(err || !data){
				statusCode = 0;
				message = err.message;
				logger.info("no alert for "+ id );
				var responseData = {
				        statusCode : statusCode,	       
				        message : message
					}; 

				res.status(200).send(responseData);
			}
			else {
				alert_audit_log= data;
				if(statusReturned.toLowerCase() == "complete"||statusReturned.toLowerCase() == "completed"){
					alert_audit_log.status = "Completed";
				}else if(statusReturned.toLowerCase() == "error"){
					ticket_audit_log.status = "Error";
				}
			
				alert_audit_log.status = statusReturned;
				alert_audit_log.completedTime = newDate;
				alert_audit_log.errorMessage = errorMessage;
				alert_audit_log.logDetails.push({
					subject: "UPDATE AUTOMATION EXE RESULT",
					type: "INFO",
					message: automationResponseMsg,
					timestamp: new Date()
				});
				logger.info("alert_audit_log"+JSON.stringify(alert_audit_log));
				UpdateAlertAuditLog(alert_audit_log, function(err, data){
					if(err || ! data){
						logger.info("error"+err);
						statusCode = 0;
						message = err.message;
						logger.info("no alert for "+ id );
						var responseData = {
						        statusCode : statusCode,	       
						        message : message
							}; 

						res.status(200).send(responseData);
					}
					else{
						statusCode = 1;
						message = "success";						
						var responseData = {
					        statusCode : statusCode,	       
					        message : message
						}; 

						res.status(200).send(responseData);}
				});
			}
		});
	}
	else if(eventType!=null && eventType.toLowerCase() =="ticket"){
		logger.info("errorMessage in ticket: "+ errorMessage );	
		getTicketAuditLog(id, function(err, data){
			if(err || ! data){
				statusCode = 1;
				message = err.message;
				logger.info("no ticket for "+ id );
				var responseData = {
				        statusCode : statusCode,	       
				        message : statusReturned
					}; 

				res.status(400).send(responseData);
			}
			else{

				ticket_audit_log= data;
				if(statusReturned.toLowerCase() == "complete"||statusReturned.toLowerCase() == "completed"){
					ticket_audit_log.remediationState = "Completed";
				}else if(statusReturned.toLowerCase() == "error"){
					ticket_audit_log.remediationState = "Error";
				}
				//ticket_audit_log.remediationState= statusReturned;
				ticket_audit_log.completedTime = new Date();
				ticket_audit_log.returnedOutputMessages =automationResponseMsg;
				ticket_audit_log.errorMessage = errorMessage;
				ticket_audit_log.logDetails.push({
					subject: "UPDATE AUTOMATION EXE RESULT",
					type: "INFO",
					message: automationResponseMsg,
					timestamp: new Date()
				});
				
				UpdateTicketAuditLog(ticket_audit_log, function(err, data){
					if(err || ! data){
						logger.info("error"+err);
						statusCode = 0;
						message = err.message;
						logger.info("no ticket for "+ id );
						var responseData = {
						        statusCode : statusCode,	       
						        message : statusReturned
							}; 

						res.status(400).send(responseData);
					} else {
						statusCode = 1;
						message = "success";						
						var responseData = {
					        statusCode : statusCode,	       
					        message : statusReturned,
							automationResponseMsg: automationResponseMsg
						}; 
						logger.info("Before calling task completed from UpdateTicketAuditLog within UpdateAutomationExeResult");
//						var client = null;
//						client = new WorkflowManager();
						taskComplete(instanceID, responseData, res);
//						res.status(200).send(responseData);
					}
					
				});
			
			}
		
		});
		
	} 
	
};


var getAlertAuditLog = function(id, callback) {
	var path = "/rest/AlertAuditLog/" + id;
	var option = {
		method : "GET",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200 && res.statusCode != 201) {
					return callback(new Error(data));
				}
				var result = JSON.parse(data);
				callback(null, result);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});
	req.end();
}


var taskComplete = function(pid,responseMsg, res, callback){
//	var pid = req.pid;
	logger.info("===Inside Task Complete===");
	logger.info("Process Instance ID :" + pid);
//	logger.info("Process Instance Name :" + pName);
	logger.info("Response Message From Bot :" + JSON.stringify(responseMsg));
	var connectionProperties = config_info.adapters.WorkflowManagerAdapter.connection.connectionProperties;
	logger.info("connectionProperties: " + JSON.stringify(connectionProperties));
//	var url = connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/task/?processInstanceId=' + pid;
	var options_get_task = {
	  uri: connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/task/?processInstanceId=' + pid,
//	  uri: connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/task/?processInstanceId=c9e09890-9af3-11e8-96b0-448500fa0b09',
//	  uri: url,
	  method: 'GET',
	  auth: {
					'user': connectionProperties.authetication.userId,
					'pass': connectionProperties.authetication.password,
					'sendImmediately': true
				},
	  header: {
		 "Content-Type": "application/json",
		 "Authorization": "Basic ZGVtbzpkZW1v",
		 "connection":"keep-alive"
	  },
	};
	/*var options_get_task1 = {
			  uri: connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/process-definition/key/' + pName + '/start',
			  method: 'POST',
			  auth: {
				'user': connectionProperties.authetication.userId,
				'pass': connectionProperties.authetication.password,
				'sendImmediately': true
			  },
			  header: {
				 "Content-Type": "application/json"
			  },
			  json: {}
			};*/
	/*var options = {
			  host: connectionProperties.host,
			  port: connectionProperties.port,
			  path: connectionProperties.basePath + '/process-definition/key/' + pName + '/start',
			  method: 'GET'			  
			};*/
//	logger.info("uri for process start: " + JSON.stringify(options_get_task1));
	logger.info("uri for : " + JSON.stringify(options_get_task));
//	logger.info("before response_get_task: " + response_get_task);
	
	/*http.request(options, function(res) {
		logger.info('STATUS: ' + res.statusCode);
		  logger.info('HEADERS: ' + JSON.stringify(res.headers));
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
			  logger.info('BODY: ' + chunk);
		  });
		}).end();*/
	
	/*request(options_get_task1, function (error_get_task1, response_get_task1, body_get_task1) {
		  logger.info("Status1 :" + response_get_task1.statusCode);
		  logger.info("response_get_task1: " + JSON.stringify(response_get_task1));
	});*/
//	for(var j=0; j<5; j++){
		request(options_get_task, function (error_get_task, response_get_task, body_get_task) {
		  logger.info("Status :" + response_get_task.statusCode);
		  logger.info("response_get_task: " + JSON.stringify(response_get_task));
		  
				  if (!error_get_task && response_get_task.statusCode == 200) {
					console.log("Currently Running Task Details :" + body_get_task);
					logger.info("Currently Running Task Details :" + JSON.stringify(body_get_task));
					
					if(JSON.parse(body_get_task).length > 0) {
						var taskID = JSON.parse(body_get_task)[0].id;
						logger.info("TASK ID :" + taskID);
						//Completing User Task
			
						var options_task_completion = {
						  uri: connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/task/' + taskID + '/complete',
						  method: 'POST',
						  auth: {
									'user': connectionProperties.authetication.userId,
									'pass': connectionProperties.authetication.password,
									'sendImmediately': true
								},
						  header: {
							 "Content-Type": "application/json"
						  },
						  json: {
							"variables": 
								{"responseMsg":{
									"value": JSON.stringify(responseMsg), 
									"type": "json", 
									"valueInfo":{"serializationDataFormat":"application/json"}
									}
								}
						  }
			
						};
			
						logger.info("OPTION :" + JSON.stringify(options_task_completion));
			
						request(options_task_completion, function (error_task_completion, response_task_completion, body_task_completion) {
						  logger.info("Currently Running Task Completion Status Code " + response_task_completion.statusCode);
						  if (!error_task_completion && response_task_completion.statusCode == 204) {
							res.status(200).send(responseMsg);
						  } else {
							  request(options_get_task, function (error_get_task1, response_get_task1, body_get_task1) {
//								  logger.info("Status :" + response_get_task.statusCode);
//								  logger.info("response_get_task: " + JSON.stringify(response_get_task));
								  res.status(response_get_task1.statusCode).send({"msg" : "Currently Running Task - " + taskID + " - Not Completed"});
							  
							  /*request(options_task_completion, function (error_task_completion1, response_task_completion1, body_task_completion1){
								  if(!error_task_completion1 && response_task_completion1.statusCode = 204){
									  res.status(200).send(responseMsg);
								  }
								  else{
									  res.status(response_task_completion.statusCode).send({"msg" : "Currently Running Task - " + taskID + " - Not Completed"});
								  }*/
//								  callback (null, response_get_task.statusCode);								  
							  });							
						  }
						});
			
						//Completing User Task
					} else {
						console.log("Radha: Task ID Not Found!");
						res.status(200).send({"msg":"Task Not Found"});
					}
			
				  } else {
					console.log("Error in Getting Task ID :" + error_get_task);
				  }	  
		});
		/*if(err || ! data){
			logger.info("error"+err);
			statusCode = 0;
			message = err.message;
			logger.info("no alert for "+ id );
			var responseData = {
			        statusCode : statusCode,	       
			        message : message
				}; 

			res.status(400).send(responseData);
		}
		else{
			statusCode = 1;
			message = "success";						
			var responseData = {
		        statusCode : statusCode,	       
		        message : message
			}; 

			res.status(200).send(responseData);
		}*/
//	}
	
}


