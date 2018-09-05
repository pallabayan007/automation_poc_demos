var URL = require("url");
var http = require("http");
var request = require("request");
var async = require("async");
var fileIO = require('fs');
var logger = getLogger("AMAServiceManagementAgent");

var AutomationSimulatorAdapter = require("./client/AutomationSimulatorAdapter.js");
var WorkloadSchedulerProcessAdapter = require("./client/WorkloadSchedulerProcessAdapter.js");
var WorkflowManager = require("./client/WorkflowManager.js");
var AAFTPAdapter = require("./client/AAFTPAdapter.js");
var AARESTAdapter = require("./client/AARESTAdapter.js");
var BluePrismAutomataAdapter = require("./client/BluePrismAutomataAdapter.js");
var config_info = require("../../../../config/workflow_manager_config.json");

var SOPConfig = require("../../../../config/SOPConfig.json");
var systemProperty = require("../../../../config/system_properties.json");

var COMPONENT_NAME = "Service Management Agent";
var AADepType = "ON_PREM";

logger.info("Inside AMAServiceManagementAgent");

var ListenEventMapSOPService = exports.ListenEventMapSOPService = function() {
	var path = "/rest/IssueIODEvent";
	var option = {
		method: "POST",
		port: global_server_port,
		hostname: global_server_host,
		path: path,
		headers: {
			"Content-Type": "application/json",
			"Authorization": SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				callback(null, JSON.parse(data));
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.error("error message: " + e.message);
		callback(e);
	});

	var callback = requestedUrl = req.protocol + '://' + req.get('Host') + "/rest/ListenEventMapSOPService";

	req.write(JSON.stringify({
		callback: callback
	}));
	req.end();
}

exports.ListenEventMapSOPServiceCallback_Ticket = function(req, res) {
	var IOD = req.body;
	logger.info("ListenEventMapSOPServiceCallback_Ticket IOD "+JSON.stringify(IOD));
	logger.debug("IOD "+JSON.stringify(IOD));
	logger.debug("Process IOD : " + IOD.WorkflowAutomationID);

	var ticket_audit_log_id = IOD.ticket_audit_log._id;
	var ticket_audit_log = IOD.ticket_audit_log;

	ProcessIOD_Ticket(IOD, function(err, data) {
		if (err) {
			ticket_audit_log.remediationState = "Error";
			ticket_audit_log.errorMessage = err.message;
			if (err.message == 'Management system not working') {
				ticket_audit_log.errorType = 'ManagementSystemNotWorking';
			} else {
				ticket_audit_log.errorType = 'RemediationProcessAbnormal';
			}

			ticket_audit_log.logDetails.push({
				subject: COMPONENT_NAME,
				type: "ERROR",
				message: "IOD(" + IOD.type + " Automaton " + IOD.WorkflowAutomationID + ") get an error in " + IOD.type,
				timestamp: new Date()
			});
			UpdateTicketAuditLog(ticket_audit_log, function(err,
				ticket_audit_log) {

			});
			return;
		}
		ticket_audit_log.remediationState = "Completed";
		ticket_audit_log.completedTime = new Date();
		ticket_audit_log.logDetails.push({
			subject: COMPONENT_NAME,
			type: "INFO",
			message: "IOD (" + IOD.type + " Automaton " + IOD.WorkflowAutomationID + ":" + data.name + ") has been processed",
			timestamp: new Date()
		});
		UpdateTicketAuditLog(ticket_audit_log, function(err, ticket_audit_log) {

		});

	});
	res.send("OK");
}

/**
 * {"IPSoftWorkflowID" : "abc"}
 */
exports.ListenEventMapSOPServiceCallback = function(req, res) {
	var IOD = req.body;
	logger.info("ListenEventMapSOPServiceCallback IOD "+JSON.stringify(IOD));
	logger.debug("IOD "+JSON.stringify(IOD));
	logger.debug("Process IOD : " + IOD.WorkflowAutomationID);

	var alert_audit_log_id = IOD.alert_audit_log._id;
	var alert_audit_log = IOD.alert_audit_log;
	ProcessIOD_Alert(alert_audit_log_id, alert_audit_log, IOD, function(err,
		data) {
		if (err) {
			alert_audit_log.status = "Error";
			alert_audit_log.errorMessage = err.message;
			if (err.message == 'Management system not working') {
				alert_audit_log.errorType = 'ManagementSystemNotWorking';
			} else {
				alert_audit_log.errorType = 'RemediationProcessAbnormal';
			}

			alert_audit_log.logDetails.push({
				subject: COMPONENT_NAME,
				type: "ERROR",
				message: "IOD (" + IOD.type + "'s automaton - " + IOD.WorkflowAutomationID + ") gets an error.",
				timestamp: new Date()
			});
			UpdateAlertAuditLog(alert_audit_log,
				function(err, alert_audit_log) {

				});
			return;
		}
		alert_audit_log.status = "Completed";
		alert_audit_log.completedTime = new Date();
		alert_audit_log.logDetails.push({
			subject: COMPONENT_NAME,
			type: "INFO",
			message: "IOD (" + IOD.type + "'s automaton - " + IOD.WorkflowAutomationID + ") has been processed successfully.",
			timestamp: new Date()
		});
		UpdateAlertAuditLog(alert_audit_log, function(err, alert_audit_log) {

		});

	});
	res.send("OK");
}


exports.TaskComplete_Ticket = function(req,res){
	logger.info("Inside TaskComplete_Ticket");
	var data = req.body;
	logger.info("REQ BODY :" + JSON.stringify(req.body));
	var pid = req.body.pid;
	logger.info("Process Instance ID :" + pid);
	var connectionProperties = config_info.adapters.WorkflowManagerAdapter.connection.connectionProperties;
	logger.info("connectionProperties: " + JSON.stringify(connectionProperties));
		
	var options_get_task = {
			  uri: connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/task/?processInstanceId=' + pid,
			  method: 'GET',
			  auth: {
							'user': connectionProperties.authetication.userId,
							'pass': connectionProperties.authetication.password,
							'sendImmediately': true
						},
			  header: {
				 "Content-Type": "application/json"
			  },
			};
	logger.info("uri for : " + JSON.stringify(options_get_task));
	request(options_get_task, function (error_get_task, response_get_task, body_get_task) {
		  logger.info("Status :" + response_get_task.statusCode);
		  logger.info("response_get_task: " + JSON.stringify(response_get_task));
		  
	});
	
	try {
		logger.info('Data for ticket ---> '+data);
		
		res.status(200).send({"msg":"passed"});
	
	} catch (e) {
		logger.error(e);
		res.status(500).json(e);
	}

}

logger.info("Before ExecuteIOD_Ticket");
exports.ExecuteIOD_Ticket = function(req, res) {
	logger.info("Inside ExecuteIOD_Ticket");
	var data = req.body;
	logger.info("REQ BODY :" + JSON.stringify(req.body));
	
	var IOD = req.body;
	logger.info("AUTOMATION TYPE OF BOT :" + req.query.bottype);
//	logger.info("IOD ::" + IOD);
	
	var botconn = req.query.botconn;
	logger.info("==AUTOMATION Connection Name OF BOT :" + botconn);
	logger.info("IOD ::" + IOD);
	
	IOD["type"] = req.query.bottype;
	
	
	logger
		.info("To execute IOD in Service Management System(" + IOD.type + ")");

	var client = null;

	switch (IOD.type) {
		case "Automation Simulator":
			logger.info("=====Inside Automation Simulator=========");
			client = new AutomationSimulatorAdapter();
			break;
		case "Automation Anywhere":
			logger.info("=====Inside Automation Anywhere=========");
			client = findAAAdapterClient();
			break;
		case "Blue Prism":
			logger.info("Inside BluePrism Call");
			client = new BluePrismAutomataAdapter(botconn);
			break;
	}
	try {
		logger.info('Data for ticket ---> '+IOD);
		
		client.execute(IOD, function(err, data) {
			if (err) {
				logger.error("Get Error in " + IOD.type + ":" + err.message);
				res.status(500).json(err);
			} else {
				res.status(200).json(data);
			}
		});
	} catch (e) {
		logger.error(e);
		res.status(500).json(e);
	}	
}

exports.GetStatus_Ticket = function(req, res) {

	var data = req.body;
	var IOD = data.IOD;
	logger
		.info("To get the status of a IOD execution instance in Service Management System(" + IOD.type + ")");

	var client = null;
	switch (IOD.type) {
		case "Automation Simulator":
			client = new AutomationSimulatorAdapter();
			break;
		case "Automation Anywhere":
			logger.info("=====Inside Automation Anywhere=========");
			client = findAAAdapterClient();
			break;
			
	}

	client.getStatus(
		IOD,
		function(
			err,
			status,
			output) {
			if (err) {
				logger
					.info("Request failed in Service Management System(" + IOD.type + ")");
				logger
					.info(err.message);

				res.status(500).json(err);
				return;
			} else {
				var returnMessage = {
					"status": status,
					"output": (!output)?null:JSON.parse(output)
				};
				res.status(200).json(returnMessage);
				return;
			}
		});
}

var ProcessIOD_Ticket = exports.ProcessIOD_Ticket = function(IOD, callback) {
	logger.info("To Process IOD in Service Management System(" + IOD.type + ")");

	// alert_audit_log_id, alert_audit_log,
	/**
	 * IOD Sample { "id" : UUID, "type" : "IPSoft" }
	 */

	var client = null;

	switch (IOD.type) {
		case "IPSoft":
			// client = new IPSoftAutomataAdapter();
			client = new IPSoftAPIEconomyAdapter();
			break;
		case "IBMWorkloadAutomation":
			client = new WorkloadSchedulerProcessAdapter();
			break;
		case "Blue Prism":
			logger.info("=====Inside Blue Prism=========");
			client = new BluePrismAutomataAdapter();
			break;
		case "Workflow":
			client = new WorkflowManager();
//			logger.info("=====Inside Blue Prism=========");
//			client = new BluePrismAutomataAdapter();
			break;
		case "Automation Simulator":
			//client = new AutomationSimulatorAdapter();
			client = new WorkflowManager();
			break;
		case "Automation Anywhere":
			logger.info("=====Inside Automation Anywhere=========");
			//======Added for client selection for AA==============
			client = findAAAdapterClient();
			//====================================================
			break;
	}

	try {
		var lock = false;
		SocketManager.emit("IODExecution", IOD);
		logger.info("Request is raised in Service Management System(" + IOD.type + ")");
		client.execute(
			IOD,
			function(err, data) {
				if (err) {
					logger.error("Get Error in " + IOD.type + ":" + err.message);
					return callback(err);
				}

				var ticket_audit_log_id = IOD.ticket_audit_log._id;
				var ticket_audit_log = IOD.ticket_audit_log;

				ticket_audit_log.executionID = data.execution_id;
				//add new generated ticket number ...
				logger.info("the ticket no is : "+data.ticketnumber+" sys_id==== > "+data.sys_id);
				ticket_audit_log.returnedOutputMessages=data.ticketnumber+","+data.sys_id;
				ticket_audit_log.logDetails.push({
					subject: COMPONENT_NAME,
					type: "INFO",
					message: "IOD(" + IOD.type + " Automaton " + IOD.WorkflowAutomationID + ":" + data.name + ") has been started to process",
					timestamp: new Date()
				});
				logger.info("Before insert to ticket audit collection :== "+JSON.stringify(ticket_audit_log));
				UpdateTicketAuditLog(
					ticket_audit_log,
					function(err, ticket_audit_log) {
						IOD.status = data.status;
						SocketManager.emit("IODExecution", IOD);
						var interval = setInterval(
							function() {
								if (!lock) {
									lock = true;
									client
										.getStatus(
											IOD,
											function(
												err,
												status,
												execution) {
												logger
													.info("Automation Status: " + status);
												if (err) {
													logger
														.info("Request failed in Service Management System(" + IOD.type + ")");
													logger
														.info(err.message);
													return;
												}
												if (status
													.toLowerCase() == "complete") {
													logger
														.info("Request is completed in Service Management System(" + IOD.type + ")");
													clearInterval(interval);
													data.status = status;
													IOD.execution_id = data.execution_id;
													IOD.status = data.status;

													if (execution && execution.returnedOutputMessages) {
														ticket_audit_log.returnedOutputMessages = JSON
															.stringify(execution.returnedOutputMessages);
														UpdateTicketAuditLog(
															ticket_audit_log,
															function(
																err,
																ticket_audit_log2) {
																SocketManager
																	.emit(
																		"IODExecution",
																		IOD);
																callback(
																	null,
																	data);
															});
													} else {
														SocketManager
															.emit(
																"IODExecution",
																IOD);
														callback(
															null,
															data);
													}
												} else if (status
													.toLowerCase() == "error" || status
													.toLowerCase() == "failed") {
													logger
														.info("Request failed in Service Management System(" + IOD.type + ") due to errors");
													clearInterval(interval);
													data.status = status;
													IOD.execution_id = data.execution_id;
													IOD.status = data.status;
													SocketManager
														.emit(
															"IODExecution",
															IOD);
													callback(new Error(
														"The service management system terminated abnormally."));
												}
												lock = false;
											});
								}
							}, 1000);
					});
			});
	} catch (e) {
		logger.error(e);
	}
}

var ProcessIOD_Alert = exports.ProcessIOD_Alert = function(alert_audit_log_id,
	alert_audit_log, IOD, callback) {
}

var initialize = exports.initialize = function() {
	//client.initialize();
}

var UpdateTicketAuditLog = function(ticket_audit_log, callback) {
	var path = "/rest/TicketAuditLog/" + ticket_audit_log._id;
	var option = {
		method: "PUT",
		port: global_server_port,
		hostname: global_server_host,
		path: path,
		headers: {
			"Content-Type": "application/json",
			"Authorization": SOPConfig.basicAuthHeader,
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
		method: "PUT",
		port: global_server_port,
		hostname: global_server_host,
		path: path,
		headers: {
			"Content-Type": "application/json",
			"Authorization": SOPConfig.basicAuthHeader,
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

exports.CloudIntegrationAPITest = function(req, res) {
	logger
		.info("!!!!!!!!!!!!!!!!!!!!!!!!!! Cloud Integration API Test !!!!!!!!!!!!!!!!!!!!!!!!!!");

	var id = req.params.id;
	var client = new IPSoftAutomataClient();
	client.test(id, function(err, status) {
		if (err) {
			res.status(err).send(status);
		} else {
			res.send(status);
		}
	});
}


exports.getWorkflowGraph = function(req, res) {
	var auditlogID = req.params.tal_id;
	var client = new WorkflowManager();
	client.getWorkflowGraph(auditlogID, function(err, result) {
		logger.info(err);
		if (err) {
			logger.error(err);
			res.status(500).json(err);
		} else {
			res.status(200).json(result);
		}
	})
}

exports.retrieveActiveHumanActivity = function(req, res) {
	var human_activity_id = req.params.ha_id;
	logger.info("getting human activity details (id = " + human_activity_id + ")");
	var client = new WorkflowManager();
	client.getActiveHumanActivity(human_activity_id, function(err, result) {
		if (err) {
			logger.error(err);
			res.status(500).send(err.message);
		} else {
			res.status(200).json(result);
		}
	})
	
}

exports.completeHumanActivity = function(req, res) {
	var human_activity_id = req.params.ha_id;
	var human_activity = req.body;
	logger.info("completing human activity (id = " + human_activity_id + ")");
	logger.info("human activity: " + JSON.stringify(human_activity));
	var client = new WorkflowManager();
	client.completeHumanActivity(human_activity, function(err, result) {
		logger.info(err);
		if (err) {
			logger.error(err);
			res.status(500).json(err);
		} else {
			res.status(200).json(result);
		}
	})
	
}

exports.CreateWorkflowTest = function(req, res) {
	logger.info("receiving create workflow test request");
	var client = new WorkflowManager();
	var choreograph = {
			"start_sop_id" : "577979fc6d0746d42f98fa27",
			"start_sop_name" : "Create_Ticket",
			"SOPID" : "58e91e223437741b785e3cc9",
			"SOPName" : "Local_Test_2_SOP",
			"human_activities" : [
			    {
				    "ha_id" : "HA001",
				    "ha_name" : "Review_and_Approve",
				    "ha_description" : "Could you review and approve the ticket fix?",
				    "actors" : ["dangyb@cn.ibm.com"],
				    "input_type" : "Enum",
				    "input_set" : ["Yes","No"]
			    }
            ],
			"paths" : [
				{
					"fromSOPId" : "577979fc6d0746d42f98fa27",
					"fromSOPName" : "Create_Ticket",
					"toSOPId" : "577d858d98f3e057f0cc202e",
					"toSOPName" : "Send_Email",
					"ioMaps" : [
						{
							"input" : "ProcessName",
							"type" : "Customized",
							"source_sop_id" : "",
							"output" : "",
						},
						{
							"input" : "LibraryName",
							"type" : "Customized",
							"source_sop_id" : "",
							"output" : "",
						}
					]
				},
				{
					"fromSOPId" : "577d858d98f3e057f0cc202e",
					"fromSOPName" : "Send_Email",
					"toHAId" : "HA001",
					"toHAName" : "Review_and_Approve",
					"ioMaps" : [
					]
				},
				{
					"fromHAId" : "HA001",
					"fromHAName" : "Review_and_Approve",
					"toSOPId" : "57797a696d0746d42f98fa2a",
					"toSOPName" : "Close_Ticket",
					"ioMaps" : [
			            {
					       	"input" : "ProcessName",
					        "type" : "Customized",
					        "source_sop_id" : "",
					        "output" : "",
					    },
					    {
					       	"input" : "LibraryName",
					       	"type" : "Customized",
					       	"source_sop_id" : "",
					       	"output" : "",
					    },
					    {
					       	"input" : "sys_id",
					       	"type" : "PassThrough",
					       	"source_sop_id" : "577979fc6d0746d42f98fa27",
					       	"output" : "sys_id",
					    }
					]
				}
			]
		};
	client.createWorkflow(choreograph, function(err, result) {
		logger.info(err);
		if (err) {
			logger.error(err);
			res.status(500).json(err);
		} else {
			res.status(200).json(result);
		}
	})
}

// Added for AA client selection REST/FTP based on deployment type
function findAAAdapterClient(){
	var client = null;
	if (systemProperty.deployment_type == AADepType){
		client = new AARESTAdapter();
	}else {
		client = new AARESTAdapter(); //AAFTPAdapter();				
	}
	
	return client;
}

// File write function for BluePrism automation to write ticket for Consecutive Camunda calls
var fileWrite = exports.FileWrite = function(filepath, content){
	logger.info("===Inside file write==: " + filepath);
	logger.info("===Inside file write content==: " + content);
	fileIO.writeFile(filepath, content, function(err) {
	    if(err) {
	    	logger.error(err);
	        return console.log(err);
	    }

	    console.log("The file is saved!");
	    logger.info("The file is saved!");
	}); 	
}

/*
//File read function for BluePrism automation to read ticket for Consecutive Camunda calls
var fileRead = exports.FileRead = function(filepath){
	logger.info("===Inside file read==");
	logger.info("filepath to read: " + filepath);
	fileIO.readFileSync(filepath, function(err, content) {
	    if(err) {
	    	logger.error(err);
	        return console.log(err);
	    }

//	    console.log("The file is Read! = " + content);
//	    logger.info("The file is Read! = " + content);
	    return content;
	}); 	
}*/


