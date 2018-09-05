var uuid = require("node-uuid");
var URL = require("url");
var http = require("http");
var logger = getLogger("AMAEventMapSopService");

var EventSOPMapEngine = require("./EventSOPMapEngine.js");
var TaskExecutionEngine = require("./TaskExecutionEngine.js");
var TicketTaskExecutionEngine = require("./TicketTaskExecutionEngine.js");

var SOPConfig = require("../../../../config/SOPConfig.json");


var COMPONENT_NAME = "Event SOP Map Engine";

exports.ProcessSOPTranslation = function(req, res){
	logger.info("ProcessSOPTranslation");
	
	var data = req.body;
	var alert = data.alert;
	var ex_alert = data.ex_alert;
	var alert_audit_log = data.alert_audit_log;
	var alert_audit_log_id = alert_audit_log._id;
	var alert_id = alert._id;
	var account_id = alert.accountID;
	var application_id = alert.applicationID;
	
	var eventSOPMapEngine = new EventSOPMapEngine();
	logger.info('Performance-Event sop map object created===================>');
	eventSOPMapEngine.identifySOPToExecute(alert_id, account_id, application_id , alert_audit_log, function(err, data){
		if (err) {
			alert_audit_log.status = "Error";
			alert_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "ERROR", message: "SOP has not been identified for this alert.", timestamp: new Date()});
		    UpdateAlertAuditLog(alert_audit_log, function(err, alert_audit_log){
//		    	res.status(500);
		    });
		}
		
		logger.info('Performance-back from eventmap engine with success===================>');
		var sop = data.sop;
		
		alert_audit_log.sopID = sop.SOPID;
		logger.info("SOP : %s", JSON.stringify(data));
		alert_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "INFO", message: "SOP has been identified for this alert.", timestamp: new Date()});
	    UpdateAlertAuditLog(alert_audit_log, function(err, alert_audit_log){
	    	translateSOPtoIOD(sop, function(err, IOD){
				alert_audit_log.iodID = IOD.type + "(" + IOD.WorkflowAutomationID + ")";
				alert_audit_log.automationProvider = IOD.type;
				logger.info('IOD ID: %s', alert_audit_log.iodID);
				alert_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "INFO", message: "SOP has been translated to IOD (WorkflowAutomationID:"+IOD.WorkflowAutomationID +", AutomationProvider:" + IOD.type + ").", timestamp: new Date()});
			    UpdateAlertAuditLog(alert_audit_log, function(err, alert_audit_log){
			    	TaskExecutionEngine.executeTask({
						SOP: sop, IOD: IOD, alert_audit_log : alert_audit_log}, function(err, IOD){
							
							alert_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "INFO", message: "IOD (WorkflowAutomationID:"+IOD.WorkflowAutomationID +") has been issued in Service Management Agent.", timestamp: new Date()});
						    UpdateAlertAuditLog(alert_audit_log, function(err, alert_audit_log){
						    	IssueIODEvent(IOD, function(err, data){});
								res.status(200).json(IOD); 
						    });
					});
			    });
	    	});
	    });
	});
}

exports.ProcessTicketSOPTranslation = function(req, res){
	logger.info("ProcessTicketSOPTranslation");
	
	var data = req.body;
	var ticket = data.ticket;
	var ex_ticket = data.ex_ticket;
	var ticket_audit_log = data.ticket_audit_log;
	var ticket_audit_log_id = ticket_audit_log._id;
	var ticket_id = ticket.Tickets._id;
	var account_id = ticket.Tickets.account;
	var application_id = ticket.Tickets.application;
	
	var eventSOPMapEngine = new EventSOPMapEngine();
	
	eventSOPMapEngine.identifyTicketSOPToExecute(ticket_audit_log, function(err, data){
		if (err) {
			ticket_audit_log.status = "Error";
			ticket_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "ERROR", message: "SOP has not been identified for this ticket.", timestamp: new Date()});
		    UpdateTicketAuditLog(ticket_audit_log, function(err, alert_audit_log){
//		    	res.status(500);
		    });
		}
		var sop = data.sop;
		
		ticket_audit_log.sopID = sop._id;
		logger.info("SOP : %s", JSON.stringify(data));
		ticket_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "INFO", message: "SOP has been identified for this ticket.", timestamp: new Date()});
	    UpdateTicketAuditLog(ticket_audit_log, function(err, ticket_audit_log){
	    	translateSOPtoIOD(sop, function(err, IOD){
	    		ticket_audit_log.iodID = IOD.type + "(" + IOD.WorkflowAutomationID + ")";
	    		ticket_audit_log.automationProvider = IOD.type;
				logger.info('IOD ID: %s', ticket_audit_log.iodID);
				ticket_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "INFO", message: "SOP has been translated to IOD (WorkflowAutomationID:"+IOD.WorkflowAutomationID +", AutomationProvider:" + IOD.type + ")", timestamp: new Date()});
			    UpdateTicketAuditLog(ticket_audit_log, function(err, ticket_audit_log){
			    	TicketTaskExecutionEngine.executeTask({
						SOP: sop, IOD: IOD, ticket_audit_log : ticket_audit_log}, function(err, IOD){
							
							ticket_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "INFO", message: "IOD (WorkflowAutomationID:"+IOD.WorkflowAutomationID +") has been issued in Service Management Agent", timestamp: new Date()});
						    UpdateTicketAuditLog(ticket_audit_log, function(err, ticket_audit_log){
						    	IssueTicketIODEvent(IOD, function(err, data){});
								res.status(200).json(IOD); 
						    });
					});
			    });
	    	});
	    });
	});
}

exports.ProcessTicketSOPTranslation_CognitiveRemediation = function(req, res){
	logger.info("ProcessTicketSOPTranslation_CognitiveRemediation");
	
	var data = req.body;
	var ticket = data.ticket;
	var ex_ticket = data.ex_ticket;
	var ticket_audit_log = data.ticket_audit_log;
	var ticket_audit_log_id = ticket_audit_log._id;
//	var ticket_id = ticket.Tickets._id;
//	var account_id = ticket.Tickets.account;
//	var application_id = ticket.Tickets.application;

	var eventSOPMapEngine = new EventSOPMapEngine();
	
	eventSOPMapEngine.identifyTicketSOPToExecute(ticket_audit_log, function(err, data){
		if (err) {
			ticket_audit_log.status = "Error";
			ticket_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "ERROR", message: "SOP has not been identified for this ticket.", timestamp: new Date()});
		    UpdateTicketAuditLog(ticket_audit_log, function(err, alert_audit_log){
		    	res.status(500);
		    });
		}
		
		var sop = data.sop;
		
		ticket_audit_log.sopID = sop._id;
		logger.info("SOP : %s", JSON.stringify(data));
		ticket_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "INFO", message: "SOP has been identified for this ticket.", timestamp: new Date()});
	    UpdateTicketAuditLog(ticket_audit_log, function(err, ticket_audit_log){
	    	translateSOPtoIOD(sop, function(err, IOD){
	    		//ticket_audit_log.iodID = IOD.type + "(" + IOD.WorkflowAutomationID + ")";
				ticket_audit_log.iodID = "WorkFlow";
	    		
	    		// set the customized input params into the IOD
	    		if (IOD.AutomationInput) {
	    			IOD.AutomationInput[IOD.AutomationInput.length] = ticket_audit_log.customizedInputParams; 
	    		} else {
	    			IOD.AutomationInput = []; 
	    			IOD.AutomationInput[0] = ticket_audit_log.customizedInputParams;
	    		}
	    		IOD.ticketID = ticket_audit_log._id;
	    		IOD.client = ex_ticket.clientName;
	    		IOD.account = ex_ticket.accountName;
	    		
	    		ticket_audit_log.automationProvider = IOD.type;
				logger.info('IOD ID: %s', ticket_audit_log.iodID);
				ticket_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "INFO", message: "SOP has been translated to IOD (WorkflowAutomationID:"+IOD.WorkflowAutomationID +", AutomationProvider:" + IOD.type + ")", timestamp: new Date()});
			    UpdateTicketAuditLog(ticket_audit_log, function(err, ticket_audit_log){
			    	TicketTaskExecutionEngine.executeTask({
						SOP: sop, IOD: IOD, ticket_audit_log : ticket_audit_log}, function(err, IOD){
							
							ticket_audit_log.logDetails.push({subject: COMPONENT_NAME, type: "INFO", message: "IOD (WorkflowAutomationID:"+IOD.WorkflowAutomationID +") has been issued in Service Management Agent", timestamp: new Date()});
						    UpdateTicketAuditLog(ticket_audit_log, function(err, ticket_audit_log){
						    	IssueTicketIODEvent(IOD, function(err, data){});
								res.status(200).json(IOD); 
						    });
					});
			    });
	    	});
	    });
	});
}


var translateSOPtoIOD = function(SOP, callback){
	logger.info("translateSOPtoIOD %s, %s, %s", SOP.WorkflowAutomationID, SOP.AutomationProcess, JSON.stringify(SOP));

	logger.info("AutomationInput IOD: %s", JSON.stringify(SOP));

	var WorkflowAutomationID =  SOP.AutomationInput &&  SOP.AutomationInput.length > 0 ?  SOP.AutomationInput[0].WorkflowAutomationID : null;

	callback(null, {
		id : uuid.v4(),
		type : (SOP.AutomationProvider == "blueprism") ? "Blue Prism" : SOP.AutomationProvider,
		WorkflowAutomationID : WorkflowAutomationID || SOP.AutomationProcess || "N/A",
		AutomationInput : SOP.AutomationInput,
		bpmnProcessName: SOP.BPMNWorkFlowName
	});
}


var IssueTicketIODEvent = exports.IssueTicketIODEvent = function(IOD, callback){
	
	logger.info("GET IOD : " + JSON.stringify(IOD));
	
	var path =  "/rest/ListenTicketEventMapSOPService";
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
			if(res.statusCode != 200){
				return callback(new Error(data));
			}
			callback(null, data);
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});
	
	req.write(JSON.stringify(IOD));
	req.end();
}

var IssueIODEvent = exports.IssueIODEvent = function(IOD, callback){
	
	logger.info("GET IOD : " + JSON.stringify(IOD));
	
	var path =  "/rest/ListenEventMapSOPService";
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
			if(res.statusCode != 200){
				return callback(new Error(data));
			}
			callback(null, data);
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});
	
	req.write(JSON.stringify(IOD));
	req.end();
	
	
}

var UpdateTicketAuditLog = function(ticket_audit_log, callback){
	var path =  "/rest/TicketAuditLog/" + ticket_audit_log._id;
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
				if(res.statusCode != 200 && res.statusCode != 201){
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

var UpdateAlertAuditLog = function(alert_audit_log, callback){
	var path =  "/rest/AlertAuditLog/" + alert_audit_log._id;
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
				if(res.statusCode != 200 && res.statusCode != 201){
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






