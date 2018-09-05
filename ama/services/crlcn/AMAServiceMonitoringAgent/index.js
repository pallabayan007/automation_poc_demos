var http = require("http");
var URL = require("url");
var uuid = require("node-uuid");
var async = require("async");
var moment = require("moment");

var logger = getLogger("AMAServiceMonitoringAgent");

var config = require("../../../../config");
var app_config = require("../../../../config/app_config.json");
var mapper = require("../../../../config/mapper_config.json");

var models = require("../../../../models");
var AlertAuditLog = models.AlertAuditLog;
var TicketAuditLog = models.TicketAuditLog;

var notificationType = app_config["general-properties"]["notificationType"];

var SolManAdapter = require("./adapters/SolManAdapter.js");

// var MQServer = require("../../../common/mqlight_server");
var RabbitMQClient = require("../../../common/rabbitmq_client");

var MQTopics = require("../../../common/MQTopics.js");

var SOPConfig = require("../../../../config/SOPConfig.json");

var adapters_status = {};

var COMPONENT_NAME = "Service Monitoring Agent";

var callBackSubscribeAlertTopics = function(message) {

	var newMsg = new Buffer(message.data).toString("ascii");
	logger.info("new alert: " + newMsg);

	var alerts = JSON.parse(newMsg);
	var alerts_count = alerts.length;
	logger.info("----------------- Receive %s Alerts ----------------",
			alerts_count);
	var success = 0;
	var failed = 0;
	if (alerts.length > 0) {
		// if (!adapters_status[alerts[0].alertPublishName])
		// adapters_status[alerts[0].alertPublishName] = false;
		// adapters_status[alerts[0].alertPublishName] = true;
		//		
		// if (!adapters_status[alerts[0].client_name])
		// adapters_status[alerts[0].client_name] = {};
		// if (!adapters_status[alerts[0].client_name][alerts[0].accountName])
		// adapters_status[alerts[0].client_name][alerts[0].accountName] = {};
		// if
		// (!adapters_status[alerts[0].client_name][alerts[0].accountName][alerts[0].alertPublishName])
		// adapters_status[alerts[0].client_name][alerts[0].accountName][alerts[0].alertPublishName]
		// = false;
		// adapters_status[alerts[0].client_name][alerts[0].accountName][alerts[0].alertPublishName]
		// = true;
		//		
		if (!adapters_status[alerts[0].accountName])
			adapters_status[alerts[0].accountName] = {};
		if (!adapters_status[alerts[0].accountName][alerts[0].alertPublishName])
			adapters_status[alerts[0].accountName][alerts[0].alertPublishName] = false;
		adapters_status[alerts[0].accountName][alerts[0].alertPublishName] = true;
	}
	for (var i = 0; i < alerts.length; i++) {
		var alert = alerts[i];
		alert.alert_timestamp = moment(alert.alertRaisedTime,
				[ "YYYYMMDDHHmmss" ]).toDate().toString();
		exports
				.processRequest(
						alert,
						function(err, log_id) {
							logger.info("processed " + alert.alertName + " ("
									+ alert.applicationName + ")");
							if (err) {
								failed++
							} else {
								success++
							}
							if ((failed + success) == alerts_count) {
								logger
										.info(
												"----------------- Total %s Alerts ----------------",
												alerts_count);
								logger
										.info(
												"Success processed : %s, Failed processed : %s",
												success, failed);
								logger
										.info("----------------------------------------------------");
							}
						});
	}
};

var callBackSubscribeTicketTopics = function(message) {

	var newMsg = new Buffer(message.data).toString("UTF-8");
	logger.info("new ticket: " + newMsg);

	var tickets = JSON.parse(newMsg);
	var tickets_count = tickets.length;
	logger.info("----------------- Receive %s tickets ----------------",
			tickets_count);
	var success = 0;
	var failed = 0;
	if (tickets.length > 0) {
		if (!adapters_status[tickets[0].accountName])
			adapters_status[tickets[0].accountName] = {};
		if (!adapters_status[tickets[0].accountName][tickets[0].alertPublishName])
			adapters_status[tickets[0].accountName][tickets[0].alertPublishName] = false;
		adapters_status[tickets[0].accountName][tickets[0].alertPublishName] = true;
	}
	for (var i = 0; i < tickets.length; i++) {
		var ticket = tickets[i];

		ticket.ticket_timestamp = moment(ticket.openedAt, [ "YYYYMMDDHHmmss" ])
				.toDate().toString();

		exports
				.processTicketRequest(
						ticket,
						function(err, log_id) {
							logger.info("processed " + ticket.cause + " ("
									+ ticket.application + ")");
							if (err) {
								failed++
							} else {
								success++
							}
							if ((failed + success) == tickets_count) {
								logger
										.info(
												"----------------- Total %s Tickets ----------------",
												tickets_count);
								logger
										.info(
												"Success processed : %s, Failed processed : %s",
												success, failed);
								logger
										.info("----------------------------------------------------");
							}
						});
	}
};

var callBackSubscribeAdapterStatus = function(message) {
	var newMsg = new Buffer(message.data).toString("ascii");
	logger.info("new adapter status" + newMsg);
	var adapter_status = JSON.parse(newMsg);
	// if (!adapters_status[adapter_status.adapter])
	// adapters_status[adapter_status.adapter] = false;
	// if (adapter_status.status != "Error")
	// adapters_status[adapter_status.adapter] = true;
	//	
	// if (!adapters_status[adapter_status.client])
	// adapters_status[adapter_status.client] = {};
	// if (!adapters_status[adapter_status.client][adapter_status.account])
	// adapters_status[adapter_status.client][adapter_status.account] = {};
	// if
	// (!adapters_status[adapter_status.client][adapter_status.account][adapter_status.adapter])
	// adapters_status[adapter_status.client][adapter_status.account][adapter_status.adapter]
	// = false;
	// if (adapter_status.status != "Error")
	// adapters_status[adapter_status.client][adapter_status.account][adapter_status.adapter]
	// = true;
	//
	if (!adapters_status[adapter_status.account])
		adapters_status[adapter_status.account] = {};
	if (!adapters_status[adapter_status.account][adapter_status.adapter])
		adapters_status[adapter_status.account][adapter_status.adapter] = false;
	if (adapter_status.status != "Error")
		adapters_status[adapter_status.account][adapter_status.adapter] = true;

};

var subscribeMQs = function() {
	var mqserver = new RabbitMQClient();
	mqserver.subscribeAll(MQTopics.alert_topic, callBackSubscribeAlertTopics);
	mqserver.subscribeAll(MQTopics.ticket_topic, callBackSubscribeTicketTopics);
	// var mqserver_adapterStatus = new RabbitMQClient();
	mqserver.subscribeAll(MQTopics.monitoring_adapter_topic,
			callBackSubscribeAdapterStatus);

};

exports.periodicallySubscribeMQs = function() {
	subscribeMQs();

	var CronJob = require('cron').CronJob;
	var job = new CronJob({
		cronTime : '30 * * * * *',
		onTick : function() {
			/*
			 * Runs every weekday (Monday through Friday) at 11:30:00 AM. It
			 * does not run on Saturday or Sunday.
			 */
			logger.info("To subscribe rabbitmqs: "
					+ new Date().toLocaleString());
			subscribeMQs();
		},
		start : false,
		timeZone : 'America/Los_Angeles'
	});
	job.start();
};

exports.CheckAdapterStatus = function(req, res) {
	res.json(adapters_status);
}

exports.ListenMonSys = function(req, res) {
	logger.info("ListenMonSys");
	var callback = requestedUrl = req.protocol + '://' + req.get('Host')
			+ "/rest/ListenMonSys";
	res.json({
		callback : callback
	});
}

exports.ListenMonSysCallback = function(req, res) {
	logger.info("ListenMonSysCallback");

	var alert = req.body;
	if (!alert || !alert.alertName) {
		logger.error("Event is required");
		res.status(400).send("Event is required");
		return;
	}

	logger.info("event: " + JSON.stringify(alert));

	processRequest(alert, function(err, log_id) {
		res.json({
			log_id : log_id
		});
	});
}

var processTicketRequest = exports.processTicketRequest = function(ex_ticket,
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
											if (err || !ticket) {

												var criteria = {};
												criteria["ticketNumber"] = ex_ticket.ticketNumber;
												var query = TicketAuditLog.find(criteria);
												// query =
												// query.where('applicationName').in(alert.applicationName);
												query.sort("-createTime").lean().exec(function(err, data) {
													if (err || data == null || data.length == 0) {
														CreateAuditLogWithoutMatchedTicket(
																ex_ticket,
																function(err,
																		ticket_audit_log) {
																	if (err) {
																		logger
																				.error(err);
																		return sub_callback(err);
																	} else {
																		if (notificationType == "Automatic" && ticket_audit_log.urgency == 1) {
																			notify(
																					ticket_audit_log,
																					function(
																							err,
																							result) {
																						if (err) {
																							logger
																									.error(err);
																						} else {
																							logger
																									.info("notification has been sent out");
																						}
																					});
																		}
																		return sub_callback(new Error(
																				"Cannot find matched ticket -"
																						+ ex_ticket.number));
																	}
																});
														}
													
												});										
																							
												

											} else {
												var sopInformation = ticket.SOPs;
												//Check whether retrieved SOP is active or not - block processing of tickets with inactive sops
												if(sopInformation!=null && sopInformation.activeMode=='n'){
													logger.info("Inside inactive sop check");
													var criteria = {};
													criteria["ticketNumber"] = ex_ticket.ticketNumber;
													var query = TicketAuditLog.find(criteria);
													//WARNING - Duplicate Code.
													//ACTION - Needs to be amended later.
													// query =
													// query.where('applicationName').in(alert.applicationName);
													query.sort("-createTime").lean().exec(function(err, data) {
														if (err || data == null || data.length == 0) {
															//Mark the Audit Log Accordingly
															CreateAuditLogWithoutActiveSOPForTicket (
																	ex_ticket,
																	function(err,
																			ticket_audit_log) {
																		if (err) {
																			logger
																					.error(err);
																			return sub_callback(err);
																		} else {
																			if (notificationType == "Automatic" && ticket_audit_log.urgency == 1) {
																				notify(
																						ticket_audit_log,
																						function(
																								err,
																								result) {
																							if (err) {
																								logger
																										.error(err);
																							} else {
																								logger
																										.info("notification has been sent out");
																							}
																						});
																			}
																			return sub_callback(new Error(
																					"Cannot find matching active sop for the ticket -"
																							+ ex_ticket.number));
																		}
																	});
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
								FetchOrCreateTicketAuditLog (
										ex_ticket,
										ticket,
										function(err, ticket_audit_log) {
											if (err) {
												logger.error(err);
												return sub_callback(err);
											}
											if (notificationType == "Automatic" && ticket_audit_log.urgency == 1) {
												notify(
														ticket_audit_log,
														function(err, result) {
															if (err) {
																logger
																		.error(err);
															} else {
																logger
																		.info("notification has been sent out");
															}
														});
											}
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
						callback(err, log_id);
					});
}

//Checks whether associated SOP are active
var isActiveSOPAvailableForAlert =  exports.isActiveSOPAvailableForAlert = function (alert) {
	
	var isActive = false;
	if(alert && alert.SOPs.length >=0) {
		for (var index=0; index < alert.SOPs.length ; index++) {
			var tempSOP = alert.SOPs[index];
			isActive = (tempSOP.activeMode === 'y');
		}
	}
	
	logger.info("=> isActiveSOPAvailableForAlert ::"+isActive);
	return isActive;
}

var processRequest = exports.processRequest = function(ex_alert, callback) {

	var log_id = uuid.v4();

	var ret = JSON.parse(JSON.stringify(ex_alert));
	ret["log_id"] = log_id;

	async
			.waterfall(
					[
							function(sub_callback) {
								SearchAlert(
										ex_alert.alertName,
										ex_alert.accountName,
										ex_alert.applicationName,
										function(err, alert) {
											if (err || !alert) {
												CreateAuditLogWithoutMatchedAlert(
														ex_alert,
														function(err,
																alert_audit_log) {
															if (err) {
																logger
																		.error(err);
																return sub_callback(err);
															} else {
																return sub_callback(new Error(
																		"Cannot find matched alert -"
																				+ ex_alert.alertName));
															}
														});
											} else {
												//Code For Active SOP Check
												//Check whether retrieved SOP is active or not - process the request only when associated SOP is active 
												if (!isActiveSOPAvailableForAlert(alert)){
													CreateAuditLogWithoutActiveSOPForAlert(ex_alert,
															function(err,
																	alert_audit_log) {
																if (err) {
																	logger
																			.error(err);
																	return sub_callback(err);
																} else {
																	return sub_callback(new Error(
																			"Cannot find matching active sop for alert  -"
																					+ ex_alert.alertName));
																}
															});
												} else {
												logger.info("Find a Alert: %s",
														alert.alertShortDesc);
												return sub_callback(err,
														log_id, ex_alert, alert);
												}
											}
										});
							},
							function(log_id, ex_alert, alert, sub_callback) {
								logger.info("Start to getApplication");
								getApplication(alert.accountID,
										ex_alert.applicationName, function(err,
												application) {
											logger.info(err);
											sub_callback(err, log_id, ex_alert,
													alert, application);
										});
							},
							function(log_id, ex_alert, alert, application,
									sub_callback) {
								logger.info("Start to CreateAlertAuditLog");
								FetchOrCreateAlertAuditLog (
										ex_alert,
										alert,application, function(err, alert_audit_log) {
											if (err) {
												logger.error(err);
												return sub_callback(err);
											}
											alert_audit_log.logDetails
													.push({
														subject : COMPONENT_NAME,
														type : "INFO",
														message : "The Alert has been mapped to Alert: (Alert ID:"
																+ alert._id
																+ ").",
														timestamp : new Date()
													});
											alert_audit_log.logDetails
													.push({
														subject : COMPONENT_NAME,
														type : "INFO",
														message : "Alert audit log has been persisted (Audit Log ID:"
																+ alert_audit_log._id
																+ ").",
														timestamp : new Date()
													});
											UpdateAlertAuditLog(
													alert_audit_log, function(
															err, updated) {
														sub_callback(err,
																log_id, alert,
																updated);
													});
										});
							},
							function(log_id, alert, alert_audit_log,
									sub_callback) {
								var alert_audit_log_id = alert_audit_log._id;
								logger.info("Create Audit Log : "
										+ alert_audit_log_id);
								alert_audit_log.logDetails
										.push({
											subject : COMPONENT_NAME,
											type : "INFO",
											message : "Alert audit log has been passed to EventMapNSOPService.",
											timestamp : new Date()
										});
								UpdateAlertAuditLog(alert_audit_log, function(
										err, alert_audit_log) {
									StartSOPTranslation(ex_alert, alert,
											alert_audit_log,
											function(err, data) {
												sub_callback(err, log_id,
														alert, alert_audit_log,
														data);
											});
								});
							} ], function(err, log_id, alert, alert_audit_log,
							sop) {
						if (err) {
							logger.error("ERROR: " + err);
							if (alert_audit_log) {
								alert_audit_log.logDetails.push({
									subject : COMPONENT_NAME,
									type : "ERROR",
									message : "ERROR: " + err,
									timestamp : new Date()
								});
								UpdateAlertAuditLog(alert_audit_log, function(
										err, alert_audit_log) {
								});
							}
						}
						callback(err, log_id);
					});
}

var SearchTicket = function(ticket, callback) {

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

var notify = function(auditLog, callback) {
	logger.info("sending notification...");
	var path = "/rest/notify";
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
				callback(null, data);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});

	req.write(JSON.stringify(auditLog));
	req.end();
}

var FetchOrCreateTicketAuditLog = function(ticket, internal_ticket, callback) {
	if(ticket._id != null) {
		logger.info("Fetching Log as the ticket is already existing");
		ticket["ticketID"] = internal_ticket.Tickets._id; // Linking to SOP
		ticket["errorMessage"] = null;
		ticket["errorType"] = null;
		ticket["remediationState"] = "In Progress";
		callback(null, ticket);
	} else {
		CreateTicketAuditLog(ticket, internal_ticket, callback);
	}
}

var FetchOrCreateAlertAuditLog = function(alert, internal_alert, application, callback) {
	if(alert._id != null) {
		logger.info("Fetching Log as the alert is already existing");
		alert["alertID"] = internal_alert._id; // Linking to SOP
		alert["accountID"] = internal_alert.accountID;
		alert["applicationID"] = application.applicationID;
		alert["alertDesc"] = internal_alert.alertShortDesc;
		alert["alertShortDesc"] = internal_alert.alertShortDesc;
		alert["errorMessage"] = null;
		alert["errorType"] = null;
		callback(null, alert);
	} else {
		var newAlert = {
				"alertID" : internal_alert._id,
				"applicationID" : application.applicationID,
				"applicationName" : application.applicationName,
				"accountID" : internal_alert.accountID,
				"alertName" : alert.alertName,
				"alertDesc" : internal_alert.alertShortDesc,
				"alertState" : alert.alertState,
				"alertShortDesc" : internal_alert.alertShortDesc,
				"alertSource" : alert.alertSource,
				"alertResource" : alert.alertResource,
				"alertSeverity" : alert.alertSeverity,
				"relatedAlerts" : alert.relatedAlerts,
				"alertRaisedTime" : alert.alertRaisedTime,
				"alertType" : alert.alertType,
				"incident" : alert.incident,
				"events" : alert.events,
				"monitoringToolName" : alert.monitoringToolName,
				"logDetails" : [],
				"isSchedueld" : alert.isSchedueld,
				"inputParameters" : alert.inputParameters
		};
		CreateAlertAuditLog(newAlert, callback);
	}
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
		"customizedInputParams" : ticket.customizedInputParams
	}));
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
		"errorMessage" : "Related SOP is not defined for this ticket.",
		"errorType" : "SOPNotDefined",
		"logDetails" : [], 
		"customizedInputParams" : ticket.customizedInputParams
	}));
	req.end();
}


var CreateAuditLogWithoutActiveSOPForTicket = function(ticket, callback) {
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
		"remediationState" : "NoActiveSOP",
		"createTime" : ticket.createTime || new Date(),
		"completedTime" : ticket.completedTime,
		"errorMessage" : "No Active SOP is available for this ticket.",
		"errorType" : "SOPNotDefined",
		"logDetails" : [], 
		"customizedInputParams" : ticket.customizedInputParams
	}));
	req.end();
}


var CreateAuditLogWithoutMatchedAlert = function(alert, callback) {
	logger.info("monitoring agent alert %s", JSON.stringify(alert));
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

	req.write(JSON.stringify({
		"applicationName" : alert.applicationName,
		"accountName" : alert.accountName,
		"alertName" : alert.alertName,
		"status" : "SOPNotDefinedError",
		"alertState" : alert.alertState || "",
		"alertShortDesc" : alert.alertShortDesc || "",
		"alertSource" : alert.alertSource || "",
		"alertResource" : alert.alertResource || "",
		"alertSeverity" : alert.alertSeverity || "Medium",
		"relatedAlerts" : alert.relatedAlerts || [],
		"alertRaisedTime" : alert.alertRaisedTime || new Date(),
		"alertType" : alert.alertType || "",
		"incident" : "",
		"events" : alert.events || [],
		"monitoringToolName" : alert.monitoringToolName || "",
		"automationProvider" : "",
		"errorMessage" : "Related SOP is not defined for this alert.",
		"errorType" : "SOPNotDefined",
		"logDetails" : [],
		"customizedInputParams" : alert.inputParameters
	}));

	req.end();
}

var CreateAuditLogWithoutActiveSOPForAlert = function(alert, callback) {
	logger.info("monitoring agent alert %s", JSON.stringify(alert));
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

	req.write(JSON.stringify({
		"applicationName" : alert.applicationName,
		"accountName" : alert.accountName,
		"alertName" : alert.alertName,
		"status" : "NoActiveSOP",
		"alertState" : alert.alertState || "",
		"alertShortDesc" : alert.alertShortDesc || "",
		"alertSource" : alert.alertSource || "",
		"alertResource" : alert.alertResource || "",
		"alertSeverity" : alert.alertSeverity || "Medium",
		"relatedAlerts" : alert.relatedAlerts || [],
		"alertRaisedTime" : alert.alertRaisedTime || new Date(),
		"alertType" : alert.alertType || "",
		"incident" : "",
		"events" : alert.events || [],
		"monitoringToolName" : alert.monitoringToolName || "",
		"automationProvider" : "",
		"errorMessage" : "No Active SOP is available for this alert.",
		"errorType" : "SOPNotDefined",
		"logDetails" : [],
		"customizedInputParams" : alert.inputParameters
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
		"logDetails" : [],
		"customizedInputParams" : alert.inputParameters
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

var UpdateAlertAuditLog = function(alert_audit_log, callback) {
	var path = "/rest/AlertAuditLog/" + alert_audit_log._id;
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
	logger.info('Performance-Start the sop translation===========>');
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
				logger.info('Performance-Start the sop translation Parsing the json===========>');
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