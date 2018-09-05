var http = require("http");
var https = require("https");
var URL = require("url");
var async = require("async");
var models = require("../../../../models");
var app_config = require("../../../../config/app_config.json");
var system_properties = require("../../../../config/system_properties.json");
var underscore = require("underscore");

var AlertAuditLog = models.AlertAuditLog;
var TicketAuditLog = models.TicketAuditLog;
var Application = models.Application;
var Alert = models.Alert;
var HumanActivity = models.HumanActivity;

var logger = getLogger("AMATempCRUDService");
var validate = function(json){
	// TODO:validate model here
	return true;
};

var notificationRecipients = app_config["general-properties"]["notificationRecipients"];

var validateTicketAuditLog = function(json){
	// TODO:validate model here
	return true;
};

exports.createTicketAuditLog = function(req, res){
	var content = req.body;

	if(!validateTicketAuditLog(content)){
		res.send(400, "Error creating audit logs: invalid content");
	}

	var ticketAuditLog = new TicketAuditLog(content);
	ticketAuditLog.save(function(err, data){
		if(err || !data)
			res.send(400, "Error creating audit logs: " + err.message);
		else {
			res.send(JSON.stringify(data));
		}
	});
}

exports.getTicketAuditLogs = function(req, res){
	TicketAuditLog.find({}).lean().exec(function(err, data){
		if(err){
			res.send(400, "Error getting audit logs: " + err.message);
		}
		else {
			res.json(data);
		}
	});
}

exports.deleteTicketAuditLogs = function(req, res){
	var id = req.params.aal_id;
	TicketAuditLog.find().remove().lean().exec(function(err, data){
		if(err || !data){
			res.send(400, "Error deleting audit logs: " + err.message);
		}
		else {
			res.json(data);
		}
	});
}

exports.deleteTicketAuditLog = function(req, res){
	var id = req.params.tal_id;
	TicketAuditLog.findOneAndRemove({_id: id}, {}).lean().exec(function(err, data){
		if(err || !data){
			res.send(400, "Error deleting audit logs: " + err.message);
		} else {
			res.json(data);
		}
	});
}

exports.createAlertAuditLog = function(req, res){
	var content = req.body;

	if(!validate(content)){
		res.send(400, "Error creating audit logs: invalid content");
	}

	var alertAuditLog = new AlertAuditLog(content);
	alertAuditLog.createTime = new Date();
	alertAuditLog.save(function(err, data){
		if(err || !data)
			res.send(400, "Error creating audit logs: " + err.message);
		else {
			res.send(JSON.stringify(data));
		}
	});
}

exports.getAlertAuditLog = function(req, res){
	var id = req.params.aal_id;
	AlertAuditLog.findOne({_id: id}).lean().exec(function(err, data){
		if(err || !data){
			res.send(400, "Error getting audit logs: " + err.message);
		}
		else {
			res.json(data);
		}
	});
}

exports.updateTicketAuditLog = function(req, res){
	var id = req.params.tal_id;
	var content = req.body;
	if(content._id){
		delete content._id;
	}
	TicketAuditLog.findOneAndUpdate({_id: id}, content, {new: true, upsert: false}).lean().exec(function(err, data){
		if(err || !data){
			res.send(400, "Error updating audit logs: " + err.message);
		}
		else {
			res.json(data);
		}
	});
}

exports.updateAlertAuditLog = function(req, res){
	var id = req.params.aal_id;
	var content = req.body;
	if(content._id){
		delete content._id;
	}
	AlertAuditLog.findOneAndUpdate({_id: id}, content, {new: true, upsert: false}).lean().exec(function(err, data){
		if(err || !data){
			res.send(400, "Error updating audit logs: " + err.message);
		}
		else {
			res.json(data);
		}
	});
}

exports.deleteAlertAuditLog = function(req, res){
	var id = req.params.aal_id;
	AlertAuditLog.findOneAndRemove({_id: id}, {}).lean().exec(function(err, data){
		if(err || !data){
			res.send(400, "Error deleting audit logs: " + err.message);
		}
		else {
			res.json(data);
		}
	});
}

exports.getTicketAuditLog = function(req, res){
	var id = req.params.tal_id;
	TicketAuditLog.find({_id: id}).lean().exec(function(err, data){
		if(err || !data){
			res.send(400, "Error getting audit logs: " + err.message);
		}
		else {
			if (data.length >= 1) {
				res.json(data[0]);
			} else {
				res.json(data);
			}
		}
	});
}


exports.getAlertAuditLogs = function(req, res){
	AlertAuditLog.find({}).lean().exec(function(err, data){
		if(err){
			res.send(400, "Error getting audit logs: " + err.message);
		}
		else {
			res.json(data);
		}
	});
}

exports.queryAlertAuditLog = function(req, res){
	var params = req.body;
	//Preventing XSS
	var	isValidationError = validateDateParams(params);
	if(isValidationError) {
		res.send(400, "Input Params Incorrect: " + isValidationError);
	}
	
	var criteria = {};
	if(params.account_id){
		criteria["accountID"] = params.account_id;
	}
	if(params.from || params.to){
		var from = params.from || new Date(1900, 1, 1);
		var to = params.to || new Date();
		criteria["createTime"] = {"$gte":from, "$lte": to};
	} else if(params.updateTimestampFrom || params.updateTimestampTo){
		var from = params.updateTimestampFrom || new Date(1900, 1, 1);
		var to = params.updateTimestampTo || new Date();
		criteria["updateTimestamp"] = {"$gte":from, "$lte": to};
	}

	if(params.status){
		criteria["status"] = params.status;
	}

	var query = AlertAuditLog.find(criteria);
	if(params.applications){
		query = query.where('applicationID').in(params.applications);
	}
	query.sort("-createTime").limit(100).lean().exec(function(err, data){
		if(err || data == null){
			res.send(400, "Error getting audit logs: " + err.message);
		}
		else {
			logger.debug("Search criteria:");
			logger.debug(criteria);
			logger.debug("--------------------------------- Data Length [Normal Alert Logs]: " + data.length)
			res.setHeader('X-Total-Count', data.length);

//			for (var i = 0; i < data.length; i++) {
//			if (data[i].applicationName == 'ISU' && data[i].alertName == 'High number of
//			ABAP Short Dumps') {
//			data[i].applicationName = 'RS6';
//			data[i].applicationID = '555066191c07bd2e00937dd8';
//			data[i].alertName = 'DB2 LUW Error Messages';
//			data[i].alertDesc = 'DB2 LUW Error Messages';
//			}
//			}
			res.json(data);
		}
	});
}

exports.queryTicketAuditLogsWithoutSOP = function(req, res){
	var params = req.body;

	//Preventing XSS
	var	isValidationError = validateDateParams(params);
	if(isValidationError) {
		res.send(400, "Input Params Incorrect: " + isValidationError);
	}	
	
	var criteria = {};
	criteria["errorType"] = "SOPNotDefined";


	if(params.updateTimestampFrom || params.updateTimestampTo){
		var from = params.updateTimestampFrom || new Date(1900, 1, 1);
		var to = params.updateTimestampTo || new Date();
		criteria["updateTimestamp"] = {"$gte":from, "$lte": to};
	} else if(params.from || params.to){
		var from = params.from || new Date(1900, 1, 1);
		var to = params.to || new Date();
		criteria["createTime"] = {"$gte":from, "$lte": to};
	}

	if(params.accountName){
		criteria["account"] = params.accountName;
	}

	criteria["type"] = "incident";

	var query = TicketAuditLog.find(criteria);
	query.sort("-createTime").limit(100).lean().exec(function(err, data){
		if(err || data == null){
			res.send(400, "Error getting audit logs: " + err.message);
		}
		else {
			logger.debug("--------------------------------- Data Length: " + data.length)
			res.setHeader('X-Total-Count', data.length);
			res.json(data);
		}
	});
}

exports.queryTicketAuditLogs = function(req, res){
	var params = req.body;
	
	//Preventing XSS
	var	isValidationError = validateDateParams(params);
	if(isValidationError) {
		res.send(400, "Input Params Incorrect: " + isValidationError);
	}
	
	var isForTicketDownload = params.forTicketDownload;

	logger.debug("=======queryTicketAuditLog======");
	logger.debug("incoming params::"+JSON.stringify(params));
	//*****************Validate Parameter Types****************
  var	isValidationError = validateDateParams(params);
	 if(isValidationError) {
		 res.send(400, "Input Params Incorrect: " + isValidationError);
	 }
	//******************END OF Validation**********************


	var criteria = {};
	if (params["_id"]) {
		criteria["_id"] = params["_id"];
	} else {
		criteria["errorType"] = {"$ne":"SOPNotDefined"};

		if(params.updateTimestampFrom || params.updateTimestampTo){
			var from = params.updateTimestampFrom || new Date(1900, 1, 1);
			var to = params.updateTimestampTo || new Date();
			criteria["updateTimestamp"] = {"$gte":from, "$lte": to};
		} else if(params.from || params.to){
			var from = params.from || new Date(1900, 1, 1);
			var to = params.to || new Date();
			criteria["createTime"] = {"$gte":from, "$lte": to};
		}

		if(params.accountName){
			criteria["account"] = params.accountName;
		}

		criteria["type"] = "incident";

	}

	var query = TicketAuditLog.find(criteria);
	query.sort("-createTime").limit(100).lean().exec(function(err, data){
		if(err || data == null){
			res.send(400, "Error getting audit logs: " + err.message);
		}
		else {
			if(isForTicketDownload) {
				logger.debug("--------------------------------- Data Length: " + data.length)
				res.setHeader('X-Total-Count', data.length);
				res.status(200).json(data);
			} else {
				async.eachSeries(data, function(item, _callback) {
					logger.debug("item[\"workflowGraph\"]: " + JSON.stringify(item["workflowGraph"]));
					if (item["automationProvider"] == "Workflow2" && !item["workflowGraph"]) {
						getWorkflowGraph(item._id, function(err1, graph, state){
							if (!err1) {
//								if (item.remediationState == "Error") {
//									if (state == "completed") {
//										item.remediationState = "Completed";
//										item.errorType = null;
//										item.errorMessage = null;
//										item.logDetails[item.logDetails.length - 1].type = "INFO";
//										item.logDetails[item.logDetails.length - 1].message = item.logDetails[item.logDetails.length - 1].message.split(")")[0] + " has been processed";
//									} else if (state == "in progress") {
//										item.remediationState = "In Progress";
//										var details = [];
//										for (var i = 0; i < item.logDetails.length - 1; i++) {
//											details.push(item.logDetails[i]);
//										}
//										item.logDetails = details;
//									}
//								}
								graph.nodes.push({
									id: 'notstarted',
									label: 'NOT STARTED',
									x: 1.98,
									y: 1.5,
									color: '#b956af',
									size: 1
								});
								graph.nodes.push({
									id: 'inprogress',
									label: 'IN PROGRESS',
									x: 0.66,
									y: 1.5,
									color: '#668f3c',
									size: 1
								});
								graph.nodes.push({
									id: 'completed',
									label: 'COMPLETE',
									x: 0,
									y: 1.5,
									color: '#617db4',
									size: 1
								});
								graph.nodes.push({
									id: 'error',
									label: 'ERROR',
									x: 1.32,
									y: 1.5,
									color: '#c6583e',
									size: 1
								});
								item["workflowGraph"] = graph;

								if (state == "completed" || state == "error") {
									var item_updated = underscore.clone(item);
									if(item_updated._id){
										delete item_updated._id;
									}
									if (item_updated.logDetails.length < 8 && state == "completed") {
										item_updated.remediationState = "Completed";
										item_updated.completedTime = new Date();
										item_updated.logDetails.push({
											subject: item_updated.logDetails[item_updated.logDetails.length - 1].subject,
											type: "INFO",
											message: item_updated.logDetails[item_updated.logDetails.length - 1].message.split(")")[0] + " has been processed",
											timestamp: new Date()
										});
									}
									if (item_updated.logDetails.length < 8 && state == "error") {
										item_updated.remediationState = "Error";
										item_updated.errorMessage = "The service management system terminated abnormally.";
										item_updated.errorType = 'RemediationProcessAbnormal';

										item_updated.logDetails.push({
											subject: item_updated.logDetails[item_updated.logDetails.length - 1].subject,
											type: "ERROR",
											message: item_updated.logDetails[item_updated.logDetails.length - 1].message.split(")")[0] + " get an error in " + item_updated.automationProvider,
											timestamp: new Date()
										});
									}

									TicketAuditLog.findOneAndUpdate({_id: item._id}, item_updated, {new: true, upsert: false}).lean().exec(function(err2){
										if (err2) {
											logger.error("Workflow graph update error!");
											_callback(err2);
										} else {
											logger.debug("Workflow graph update successfully!");
											_callback(null);
										}
									});
								} else {
									_callback(null);
								}
							} else {
								_callback(err1);
							}
						});
					} else {
						_callback(null);
					}
				}, function(err) {
					if (err) {
						logger.error('Check error============>');
						logger.error(err);
						res.status(400).json(err);
					} else {
						logger.debug("--------------------------------- Data Length: " + data.length)
						res.setHeader('X-Total-Count', data.length);
						res.status(200).json(data);
					}
				});
			}
		}//END OF OUTER ELSE
	});
}

var getWorkflowGraph = function(tal_id,  callback){
	//Authorization key changed by Arijit -08/01/17
	var path = "/rest/GetWorkflowGraph/" + tal_id;
	var option = {
			method : "GET",
			port : global_server_port,
			hostname : global_server_host,
			path : path,
			headers : {
				"Content-Type" : "application/json",
				"Authorization" : "Basic UW5yY2g4TVdreW1zODVuaw==",
			}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if(res.statusCode != 200){
					return callback(new Error(data));
				}
				var result = JSON.parse(data);
				callback(null, result.graph, result.state);
				return;
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.error("error message: " + e.message);
		callback(e);
	});
	req.end();
}


exports.queryAlertAuditLogsWithoutSOP = function(req, res){
	var params = req.body;

	//Preventing XSS
	var	isValidationError = validateDateParams(params);
	if(isValidationError) {
		res.send(400, "Input Params Incorrect: " + isValidationError);
	}
	
	var criteria = {};
	criteria["errorType"] = "SOPNotDefined";

	if(params.updateTimestampFrom || params.updateTimestampTo){
		var from = params.updateTimestampFrom || new Date(1900, 1, 1);
		var to = params.updateTimestampTo || new Date();
		criteria["updateTimestamp"] = {"$gte":from, "$lte": to};
	} else if(params.from || params.to){
		var from = params.from || new Date(1900, 1, 1);
		var to = params.to || new Date();
		criteria["createTime"] = {"$gte":from, "$lte": to};
	}

	if(params.accountName){
		criteria["accountName"] = params.accountName;
	}

 	var query = AlertAuditLog.find(criteria);
 	query.sort("-createTime").limit(100).lean().exec(function(err, data){
		if(err || data == null){
			res.send(400, "Error getting audit logs: " + err.message);
		}
		else {
			logger.debug("--------------------------------- Data Length: " + data.length)
			res.setHeader('X-Total-Count', data.length);
			res.json(data);
		}
	});
}

exports.notify = function(req, res){
	logger.debug("sending notification");
	var auditLog = req.body;

	var emails = notificationRecipients.split(",");
	var recipients = "";
	for (var i = 0; i < emails.length; i++) {
		recipients += ("&to[]=" + emails[i]);
	}
	var sendGridURL = "https://api.sendgrid.com/api/mail.send.json?api_user=dangyb&api_key=pass1234";
	var subject = "&subject=Notification of Ticket (" + auditLog.ticketNumber + ")";
	var text = "&text=This is anotification email about the ticket (" + auditLog.ticketNumber + ")\n"
	+ "- Ticket Number: " + auditLog.ticketNumber + "\n"
	+ "- Ticket Subject: " + auditLog.subject;
	var from = "&from=admin@goldenbridge.ibm.com";

//	var urlObj = URL.parse("https://api.sendgrid.com/api/mail.send.json?api_user=5T9SInJI3k&api_key=QrsTM4KrPEQm7505&to[]=dangyb@cn.ibm.com&subject=Notification of Ticket&text=This is anotification email about the ticket&from=admin@goldenbridge.ibm.com");
	var urlObj = URL.parse(sendGridURL + recipients + subject + text + from);
	logger.debug(sendGridURL + recipients + subject + text + from);

	var option = {
			method : "GET",
			port : urlObj.port,
			hostname : urlObj.hostname,
			path : urlObj.path,
			headers : {
			}
	}
	var request = https.request(option,function(response) {
		var data = '';
		response.on("data", function(chunk) {
			data += chunk;
			logger.debug("Get chunk: " + chunk);
		});
		response.on("end",function() {
			logger.debug("Notification get response status:" + response.status);
			if (response.statusCode != 200) {
				res.send(response.statusCode, "Error sending notification");
			} else {
				var id = auditLog._id;
				if(auditLog._id){
					delete auditLog._id;
				}
				auditLog.lastNotifiedTime = new Date();
				TicketAuditLog.findOneAndUpdate({_id: id}, auditLog, {new: true, upsert: false}).lean().exec(function(err, data){
					if(err || !data){
						res.send(400, "Error updating audit logs: " + err.message);
					}
					else {
						res.send(200, "Successful");
					}
				});

			}
		});
	});
	request.on("error", function(e) {
		logger.error("error message: " + e.message);
		res.send(400, "Error sending notification " + e.message);
	});
	request.end();
	logger.debug("Notification request has been sent out");
}

exports.sendEmail = function(req, res){
	logger.debug("Sending email");
	var sendGridURL = "https://api.sendgrid.com/api/mail.send.json?api_user=dangyb&api_key=pass1234";

	var to = req.body.to;
	var subject = req.body.subject;
	var text = req.body.text;

	if (to == undefined || to == null || to.trim() == "") {
		res.send(400, "Error sending email: no sender address.");
		return;
	}
	if (subject == undefined || subject == null || subject.trim() == "") {
		subject = "";
	}
	if (text == undefined || text == null || text.trim() == "") {
		text = "";
	}

	var emails = to.split(",");
	var recipients = "";
//	var	reg = /[\w!#$%&’+/=?^_{|}~-]+(?:\.[\w!#$%&'*+/=?^_{|}~-]+)@(?:\w?.)+\w?/gim;
	var reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
		for (var i = 0; i < emails.length; i++) {
			if (emails[i] != null && emails[i].trim() != "" && reg.test(emails[i])) {
				recipients += ("&to[]=" + emails[i]);
			}
		}
	if (recipients.trim() == "") {
		res.send(400, "Error sending email: no valid sender address.");
		return;
	}

	subject = "&subject=" + subject;
	text = "&text=" + text;

	var host_domain = system_properties.base_uri.split("://")[1].split(":")[0];
	if (host_domain == undefined || host_domain == null || host_domain.trim() == "") {
		host_domain = "goldenbridge.ibm.com";
	}
	var from = "&from=gbfuncid@" + host_domain;

	var urlObj = URL.parse(sendGridURL + recipients + subject + text + from);
	logger.debug(sendGridURL + recipients + subject + text + from);

	var option = {
			method : "GET",
			port : urlObj.port,
			hostname : urlObj.hostname,
			path : urlObj.path,
			headers : {
			}
	}
	var request = https.request(option,function(response) {
		var data = '';
		response.on("data", function(chunk) {
			data += chunk;
			logger.debug("Get chunk: " + chunk);
		});
		response.on("end",function() {
			logger.debug("Sending email get response status:" + response.statusCode);
			if (response.statusCode != 200) {
				logger.error(response.statusCode);
				logger.error(data);
				res.send(response.statusCode, "Error sending email");
			} else {
				res.send(200, "Success.");
			}
		});
	});
	request.on("error", function(e) {
		logger.error("error message: " + e.message);
		res.send(400, "Error sending email " + e.message);
	});
	request.end();
	logger.debug("Email request has been sent out");
}

exports.parse = function(req, res){
	logger.debug("receiving email as alert ............");
	logger.debug(req);
	var from = req.body.from;
	var text = req.body.text;
	var subject = req.body.subject;
	logger.info("From: " + from);
	logger.info("Text: " + text);
	logger.info("Subject: " + subject);
	res.send(200, "Successful");
	logger.info("Email alert processed");
}

exports.createHumanActivity = function(req, res){
	var content = req.body;

	var humanActivity = new HumanActivity(content);
	humanActivity.save(function(err, data){
		if(err || !data)
			res.send(400, "Error creating human activity: " + err.message);
		else {
			res.send(JSON.stringify(data));
		}
	});
}

exports.updateHumanActivity = function(req, res){
	var id = req.params.ha_id;
	var content = req.body;
	if(content._id){
		delete content._id;
	}
	HumanActivity.findOneAndUpdate({_id: id}, content, {new: true, upsert: false}).lean().exec(function(err, data){
		if(err || !data){
			res.send(400, "Error updating human activity: " + err.message);
		}
		else {
			res.json(data);
		}
	});
}

exports.getHumanActivity = function(req, res){
	var id = req.params.ha_id;
	HumanActivity.find({_id: id}).lean().exec(function(err, data){
		if(err || !data){
			logger.error(err);
			res.send(400, "Error getting human activity: " + err.message);
		}
		else {
			if (data.length >= 1) {
				res.json(data[0]);
			} else {
				res.json(data);
			}
		}
	});
}
