var util = require("util");
var URL = require("url");

var logger = getLogger("EmailAdapter");

var RabbitMQClient = require("../common/rabbitmq_client");

var MQTopics = require("../common/MQTopics.js");

var http = require("http");
var https = require("https");
var xlsx = require("xlsx");

var mapper = require("../../config/mapper_config.json");
var SOPConfig = require("../../config/SOPConfig.json");

var AutomationProcessRules = require("../rules/AutomationProcess/AutomationProcessRules.js");

var models = require("../../models");
var AlertAuditLog = models.AlertAuditLog;

exports.parse = function(req, res){
	logger.info("receiving email ............");
//	logger.info(req);
	var from = req.body.from.trim();
	var text = req.body.text;
	var subject = req.body.subject.trim();
	logger.info("From: " + from);
	logger.info("Text: " + text);
	logger.info("Subject: " + subject);
	res.send(200, "Successful");
	logger.info("Email received");
	
	var application = "";
	var alertName = "";
	var alertSeverity = "";
	var alertRaisedTime = "";
	var alertType = "";
	var alertStatus = "";
	var description = "";
	var monitoringTool = "";
	
	if (from == "M&A-Service@bluemix.com") {
		monitoringTool = "Monitoing&Analytics";
	}
	alertName = subject.slice(subject.indexOf(" ") + 1, subject.lastIndexOf(" on ")).trim();
	alertStatus = subject.slice(subject.indexOf("[") + 1, subject.indexOf("]")).trim();
	var lines = text.split('\n');
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		logger.info("Line " + i + ": " + line);
		if (i == 0) {
			description = line;
		} else if (line.indexOf("application_name=") == 0) {
			application = line.split('=')[1].trim();
		} else if (line.indexOf("Severity") == 0) {
			alertSeverity = line.slice(line.indexOf(":") + 1).trim();
		} else if (line.indexOf("Timestamp") == 0) {
			alertRaisedTime = line.slice(line.indexOf(":") + 1).trim();
		}
	}
	if (alertName == "Application unavailable") {
		alertType = "Availability";
	} else if (alertName == "Application response time is slow" && alertSeverity == "critical") {
		alertType = "Availability";
	}
	
	logger.info("application: " + application);
	logger.info("alertName: " + alertName);
	logger.info("alertSeverity: " + alertSeverity);
	logger.info("alertRaisedTime: " + alertRaisedTime);
	logger.info("alertType: " + alertType);
	logger.info("alertStatus: " + alertStatus);
	logger.info("description: " + description);
	logger.info("monitoringTool: " + monitoringTool);
	
	if (alertStatus != "CLOSED") {
		var alert = {
				alertPublishName: monitoringTool+"Alert",
				alertType: alertType,
				alertName: alertName,
				alertDesc: description,
				alertShortDesc: description,
				alertSeverity: alertSeverity,
				alertRaisedTime: alertRaisedTime,
				applicationID: application,
				applicationName: application,
				accountName: "SAP Account",
				clientName: "SAP001",
				isScheduled: false,
				incident: "",
				events: [],
				monitoringToolName: monitoringTool,
				automationProvider: "",
				sopID: "",
				executionID: ""
		}
		var mqClient = new RabbitMQClient();
		logger.info("push to Rabbit MQ : " + JSON.stringify(alert));
		mqClient.publish(alert.clientName, alert.accountName,
				MQTopics.alert_topic, [alert]);
	}
	
}

exports.parseEmail_new = function(req, res){
	var self = this;
	
	logger.info("receiving email ............");
	logger.info(req);
	logger.info(req.body);

	var from = req.body.from.trim();
	if (from.indexOf("<") >= 0 && from.indexOf(">") > 0 && from.indexOf("<") < from.indexOf(">")) {
		from = from.slice(from.indexOf("<") + 1, from.lastIndexOf(">")).trim();
	}
	var to = req.body.to.trim();
	var subject = req.body.subject.trim();
	var text = req.body.text;
	var spam_score = req.body.spam_score;
	var attachments = req.body.attachments;
	var attachment_info = req.body["attachment-info"];
	
	logger.info("From: " + from);
	logger.info("To: " + to);
	logger.info("Subject: " + subject);
	logger.info("Text: " + text);
	logger.info("Spam Score: " + spam_score);
	logger.info("Attachments: " + attachments);
	logger.info("Attachment-info: " + JSON.stringify(attachment_info));
	
	res.send(200, "Successful");
	logger.info("Email received");
	
	// To filtering
	if (to.indexOf("swarnasetufuncid@") != 0 || spam_score > 3 || attachments != 1) {
		sendFailedEmail(subject, from, to);
		return;
	}
	var attachment = JSON.parse(req.body["attachment-info"])["attachment1"];
	if (attachment.filename != "AutomataParameter.xls") {
		sendFailedEmail(subject, from, to);
		return;
	}

	var clientName = to.slice(to.indexOf("-") + 1, to.lastIndexOf("-")).trim();
	var toolName = to.slice(to.lastIndexOf("-") + 1, to.indexOf(".")).trim();
	
	// Alert mapping
	var emailAlert = {
			alertPublishName: clientName + "_" + toolName + "_EmailAlert",
			from: from,
			to: to,
			subject: subject,
			text: text,
			attachments: attachments,
			attachment_info: attachment_info,
			clientName: clientName,
			toolName: toolName,
			timestamp: new Date()
	}
	MapAlert(emailAlert, function(err, alert) {
		if (!err) {
			logger.info("converted " + alert.alertName + " (" + alert.applicationName + ")");
			
			// Attachment parsing
			var attachmentBuff = req.files[0].buffer;
			var data = new Uint8Array(attachmentBuff);
			var arr = new Array();
			for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
			var bstr = arr.join("");
			var workbook = xlsx.read(bstr, {type:"binary"});
			var first_sheet_name = workbook.SheetNames[0];
			var worksheet = workbook.Sheets[workbook.SheetNames[0]];
			var worksheetJSON = xlsx.utils.sheet_to_json(worksheet);
			logger.info("Worksheet JSON: " + JSON.stringify(worksheetJSON));
			var inputParameters = {};
			for (var i = 0; i < worksheetJSON.length; i++) {
				var rowJSON = worksheetJSON[i];
				if (rowJSON.Parameters == undefined || rowJSON.Parameters == null || rowJSON.Parameters.trim() == "") {
					sendFailedEmail(subject, from, to);
					return;
				}
				inputParameters[rowJSON.Parameters.trim()] = rowJSON.Values == undefined ? null : rowJSON.Values == null ? rowJSON.Values : rowJSON.Values.trim();
			}
			alert["inputParameters"] = JSON.stringify(inputParameters);
			
			var mqClient = new RabbitMQClient();
			logger.info("push to Rabbit MQ : " + JSON.stringify(alert));
			logger.info("Account name : "+alert.accountName);
			mqClient.publish(alert.clientName, alert.accountName,
					MQTopics.alert_topic, [alert]);
		} else {
			logger.error(err);
			sendFailedEmail(subject, from, to);
			return;
		}
	})
}

exports.parseEmail = function(req, res){
	var self = this;
	
	logger.info("receiving email ............");
	//logger.info(req);
	logger.info(req.body);

	var from = req.body.from.trim();
	if (from.indexOf("<") >= 0 && from.indexOf(">") > 0 && from.indexOf("<") < from.indexOf(">")) {
		from = from.slice(from.indexOf("<") + 1, from.lastIndexOf(">")).trim();
	}
	var to = req.body.to.trim();
	var subject = req.body.subject.trim();
	var text = req.body.text;
	var spam_score = req.body.spam_score;
	var attachments = req.body.attachments;
//	var attachment_info = req.body.attachment_info;
	
	logger.info("From: " + from);
	logger.info("To: " + to);
	logger.info("Subject: " + subject);
	logger.info("Text: " + text);
	logger.info("Spam Score: " + spam_score);
	logger.info("Attachments: " + attachments);
//	logger.info("Attachment-info: " + attachment-info);
	
	res.send(200, "Successful");
	logger.info("Email received");
	
	// To filtering
	var toElements = to.split('@');
	if (toElements.length != 2 || (toElements[0] != "gbfuncid" && toElements[0] != "swarnasetufuncid") || toElements[1].trim() == "") {
		logger.info("There is problem in your functional id ====================>");
		sendFailedEmail(subject, from, to);
		return;
	}
	var domains = toElements[1].split('.');
	var subdomain = domains[0];
	var elements = subdomain.split('-');
	if ((elements.length != 4 && elements.length != 3) || (elements[0] != "gb" && elements[0] != "swarnasetu") || elements[1].trim() == "" || elements[2].trim() == "") {
		logger.info("There is problem in your domain defination ====================>");
		sendFailedEmail(subject, from, to);
		return;
	}
	var clientName = elements[1].trim();
	var toolName = elements[2].trim();
	
	
	if (spam_score > 3) {
		logger.info("Spam score is greater than 3 ====================>");
		sendFailedEmail(subject, from, to);
		return;
	}
	
	if (attachments > 1) {
		logger.info("Attachement is greater than 1 ====================>");
		sendFailedEmail(subject, from, to);
		return;
	}
	
//	var clientName = to.slice(to.indexOf("-") + 1, to.lastIndexOf("-")).trim();
//	var toolName = to.slice(to.lastIndexOf("-") + 1, to.indexOf(".")).trim();

	var alertName = subject.slice(subject.indexOf("[") + 1, subject.indexOf("]")).trim();
	var clientID = subject.slice(subject.lastIndexOf(":") + 1).trim();

	var applicationName = "";
	var description = "";
	var category = "";
	var lines = text.split('\n');
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		logger.info("Line " + i + ": " + line);
		if (line.indexOf("Application_Name :") == 0) {
			applicationName = line.split(':')[1].trim();
		} else if (line.indexOf("Description :") == 0) {
			description = line.slice(line.indexOf(":") + 1).trim();
		} else if (line.indexOf("Category :") == 0) {
			category = line.slice(line.indexOf(":") + 1).trim();
		}
	}

	if (!applicationName || applicationName == null || applicationName == "") {
		logger.info("Application name mismatched  ====================>");
		sendFailedEmail(subject, from, to);
		return;
	}
	if (attachments > 0) {
		var attachment = JSON.parse(req.body["attachment-info"])["attachment1"];
		if ((attachment.filename.lastIndexOf(".xlsx") != (attachment.filename.length-5)) && (attachment.filename.lastIndexOf(".xls") != (attachment.filename.length-4))) {
			sendFailedEmail(subject, from, to);
			return;
		}
	}
	
	
	// Sender filtering
	getClientID(clientName, function(err, client_id){
		if (err || client_id != clientID) {
			sendFailedEmail(subject, from, to);
			return;
		} else {
			getAccountID(applicationName, function(err2, application_id, account_id){
				if (err2) {
					sendFailedEmail(subject, from, to);
					return;
				} else {
					containEmailWhitelist(client_id, account_id, from, function(err3, result){
						if (err3) {
//							sendFailedEmail(subject, from, to);
							logger.info(from + " has been denied due to out of whitelist.");
							return;
						} else {
							getAccountName(account_id, function(err4, accountName, clientName2){
								if (err4 || clientName2 != clientName) {
									sendFailedEmail(subject, from, to);
									return;
								} else {
									// Alert mapping
									var emailAlert = {
											alertPublishName: clientName.toLowerCase() + "_" + toolName.toLowerCase() + "_EmailAlert",
											subject: subject,
											from: from,
											to: to,
											clientName: clientName,
											client_id: client_id,
											accountName: accountName,
											account_id: account_id,
											applicationName: applicationName,
											application_id: application_id,
											toolName: toolName,
											timestamp: new Date()
									}
									var alert = {
											alertID : "",
											applicationID : emailAlert.application_id,
											applicationName : emailAlert.applicationName,
											alertName : alertName,
											alertDesc : description,
											alertState : "OPEN",
											alertShortDesc : description,
											alertSource : "Email from " + emailAlert.clientName,
											alertResource : "",
											alertSeverity : "High",
											relatedAlerts : "",
											alertRaisedTime : emailAlert.timestamp,
											alertType : category,
											incident : "",
											events : "",
											monitoringToolName : emailAlert.clientName + " (" + emailAlert.from + ")",
											accountName : emailAlert.accountName,
											clientName : emailAlert.clientName,
											alertPublishName : emailAlert.alertPublishName,

											
											requester : "",
											assignee : "",
											asignmentGroup : "",
											type : "incident",
											priority : "5",
											subject : alertName,
											status : "1",
											SLADueDate : null,
											openedAt : emailAlert.timestamp,
											closedAt : null,
											account : emailAlert.accountName,
											impact : "3",
											cause : "",
											application : emailAlert.applicationName,
											urgency : "3",
											category : "",
											relatedTicket : "null",
											ticketKey : alertName, //"Test for Orchestrationincident[][][]",
											ticketingToolName : "Email from " + emailAlert.clientName,
											updateTimestamp : emailAlert.timestamp,
											updatedByUserId : "",
											updateComment : "",
											templateBased : "",
											ticketNumber : "",
//											monitoringToolName : "Email",
//											accountName : emailAlert.accountName,
//											clientName : emailAlert.clientName,
//											alertPublishName : emailAlert.alertPublishName,
//											customizedInputParams : "{}"

									}
//									MapAlert(emailAlert, function(err, alert) {
//										if (!err) {
											logger.info("converted " + alert.alertName + " (" + alert.applicationName + ")");
											
											// Attachment parsing
									var inputParameters = {};
									if (attachments > 0) {
										var attachmentBuff = req.files[0].buffer;
										var data = new Uint8Array(attachmentBuff);
										var arr = new Array();
										for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
										var bstr = arr.join("");
										var workbook = xlsx.read(bstr, {type:"binary"});
										var first_sheet_name = workbook.SheetNames[0];
										var worksheet = workbook.Sheets[workbook.SheetNames[0]];
										var worksheetJSON = xlsx.utils.sheet_to_json(worksheet);
										logger.info("Worksheet JSON: " + JSON.stringify(worksheetJSON));
										for (var i = 0; i < worksheetJSON.length; i++) {
											var rowJSON = worksheetJSON[i];
											if (rowJSON.Parameters == undefined || rowJSON.Parameters == null || rowJSON.Parameters.trim() == "") {
												sendFailedEmail(subject, from, to);
												return;
											}
											inputParameters[rowJSON.Parameters.trim()] = rowJSON.Values == undefined ? null : rowJSON.Values == null ? rowJSON.Values : rowJSON.Values.trim();
										}
									}
											alert["inputParameters"] = JSON.stringify(inputParameters);
											alert["customizedInputParams"] = JSON.stringify(inputParameters);
											
											var mqClient = new RabbitMQClient();
											logger.info("push to Rabbit MQ : " + JSON.stringify(alert));
											logger.info("Account name : "+alert.accountName);
											mqClient.publish(alert.clientName, alert.accountName,
													MQTopics.ticket_topic, [alert]);
//										} else {
//											logger.error(err);
//											sendFailedEmail(subject, from, to);
//											return;
//										}
//									})
								}
							})
						}
					})
				}
			})
		}
	});
	
}

exports.parseEmail_old = function(req, res){
	var self = this;
	
	logger.info("receiving email ............");
	logger.info(req);
	logger.info(req.body);

	var from = req.body.from.trim();
	if (from.indexOf("<") >= 0 && from.indexOf(">") > 0 && from.indexOf("<") < from.indexOf(">")) {
		from = from.slice(from.indexOf("<") + 1, from.lastIndexOf(">")).trim();
	}
	var to = req.body.to.trim();
	var subject = req.body.subject.trim();
	var spam_score = req.body.spam_score;
	var attachments = req.body.attachments;
//	var attachment_info = req.body.attachment_info;
	
	logger.info("From: " + from);
	logger.info("To: " + to);
	logger.info("Subject: " + subject);
	logger.info("Spam Score: " + spam_score);
	logger.info("Attachments: " + attachments);
//	logger.info("Attachment-info: " + attachment-info);
	
	res.send(200, "Successful");
	logger.info("Email received");
	
	// To filtering
	if (to.indexOf("swarnasetufuncid@") != 0 || spam_score > 3 || attachments != 1) {
		sendFailedEmail(subject, from, to);
		return;
	}
	var clientName = to.slice(to.indexOf("-") + 1, to.lastIndexOf("-")).trim();
	var toolName = to.slice(to.lastIndexOf("-") + 1, to.indexOf(".")).trim();
//	var accountName = "SAP Account";
	var applicationName = subject.slice(subject.lastIndexOf("<") + 1, subject.lastIndexOf(">")).trim();
	if (!applicationName || applicationName == null || applicationName == "") {
		sendFailedEmail(subject, from, to);
		return;
	}
	var attachment = JSON.parse(req.body["attachment-info"])["attachment1"];
	if ((attachment.filename.lastIndexOf(".xlsx") != (attachment.filename.length-5)) && (attachment.filename.lastIndexOf(".xls") != (attachment.filename.length-4))) {
		sendFailedEmail(subject, from, to);
		return;
	}
	
	
	// Sender filtering
	getClientID(clientName, function(err, client_id){
		if (err) {
			sendFailedEmail(subject, from, to);
			return;
		} else {
			getAccountID(applicationName, function(err2, application_id, account_id){
				if (err2) {
					sendFailedEmail(subject, from, to);
					return;
				} else {
					containEmailWhitelist(client_id, account_id, from, function(err3, result){
						if (err3) {
//							sendFailedEmail(subject, from, to);
							logger.info(from + " has been denied due to out of whitelist.");
							return;
						} else {
							getAccountName(account_id, function(err4, accountName, clientName2){
								if (err4 || clientName2 != clientName) {
									sendFailedEmail(subject, from, to);
									return;
								} else {
									// Alert mapping
									var emailAlert = {
											alertPublishName: clientName.toLowerCase() + "_" + toolName.toLowerCase() + "_EmailAlert",
											subject: subject,
											from: from,
											to: to,
											clientName: clientName,
											client_id: client_id,
											accountName: accountName,
											account_id: account_id,
											applicationName: applicationName,
											application_id: application_id,
											toolName: toolName,
											timestamp: new Date()
									}
									MapAlert(emailAlert, function(err, alert) {
										if (!err) {
											logger.info("converted " + alert.alertName + " (" + alert.applicationName + ")");
											
											// Attachment parsing
											var attachmentBuff = req.files[0].buffer;
											var data = new Uint8Array(attachmentBuff);
											var arr = new Array();
											for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
											var bstr = arr.join("");
											var workbook = xlsx.read(bstr, {type:"binary"});
											var first_sheet_name = workbook.SheetNames[0];
											var worksheet = workbook.Sheets[workbook.SheetNames[0]];
											var worksheetJSON = xlsx.utils.sheet_to_json(worksheet);
											logger.info("Worksheet JSON: " + JSON.stringify(worksheetJSON));
											var inputParameters = {};
											for (var i = 0; i < worksheetJSON.length; i++) {
												var rowJSON = worksheetJSON[i];
												if (rowJSON.Parameters == undefined || rowJSON.Parameters == null || rowJSON.Parameters.trim() == "") {
													sendFailedEmail(subject, from, to);
													return;
												}
												inputParameters[rowJSON.Parameters.trim()] = rowJSON.Values == undefined ? null : rowJSON.Values == null ? rowJSON.Values : rowJSON.Values.trim();
											}
											alert["inputParameters"] = JSON.stringify(inputParameters);
											
											var mqClient = new RabbitMQClient();
											logger.info("push to Rabbit MQ : " + JSON.stringify(alert));
											logger.info("Account name : "+alert.accountName);
											mqClient.publish(alert.clientName, alert.accountName,
													MQTopics.alert_topic, [alert]);
										} else {
											logger.error(err);
											sendFailedEmail(subject, from, to);
											return;
										}
									})
								}
							})
						}
					})
				}
			})
		}
	});
	
}

var MapAlert = function(ex_alert, callback) {
	var alertPublisherName = ex_alert.alertPublishName;
	var path = mapper["adapterMappers"][alertPublisherName];
	logger.info("Mapper Service: " + global_server_host + ":" + global_server_port + path);
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
				if (res.statusCode != 200) {
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
	req.write(JSON.stringify(ex_alert));
	req.end();
}

var getClientID = function(clientName,  callback){
	var path = "/rest/v1/sopmeta/GetAllClients";
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
				if(res.statusCode != 200){
					return callback(new Error(data));
				}
				var clients = JSON.parse(data)["response"];
				for (var i = 0; i < clients.length; i++) {
					if (clients[i].clientName == clientName) {
						callback(null, clients[i]._id);
						return;
					}
				}
				callback(new Error("Client does not exist."));
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

var getAccountID = function(applicationName,  callback){
	var path = "/rest/v1/sopmeta/GetApplicationList";
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
				if(res.statusCode != 200){
					return callback(new Error(data));
				}
				var applications = JSON.parse(data)["response"];
				for (var i = 0; i < applications.length; i++) {
					if (applications[i].applicationName == applicationName) {
						callback(null, applications[i]._id, applications[i].accountID);
						return;
					}
				}
				callback(new Error("Application does not exist."));
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

var getAccountName = function(accountID,  callback){
	var path = "/rest/v1/sopmeta/GetAccount?accountId=" + accountID;
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
				if(res.statusCode != 200){
					return callback(new Error(data));
				}
				var account = JSON.parse(data)["response"];
				if (account != undefined && account != null) {
					callback(null, account.accountName, account.clientName);
					return;
				}
				callback(new Error("Account does not exist."));
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

var containEmailWhitelist = function(client_id, account_id, email, callback) {
	var request_body = {
			clientId: client_id,
			accid: account_id,
			senderemailId: email
	}
	var path = "/rest/v1/adminmeta/containsEmailWhitelist";
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
				if (res.statusCode != 200) {
					return callback(new Error(data));
				}
				callback(null, true);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});
	req.write(JSON.stringify(request_body));
	req.end();
}

var sendFailedEmail = function(subject, to, from) {
	var sendGridURL = "https://api.sendgrid.com/api/mail.send.json?api_user=dangyb&api_key=pass1234";
	var subject = "&subject=!!! Golden Bridge failed to process automation for " + subject + "!!!";
	var text = "&text=Golden Bridge was unable to process your email based alert automation because the e-mail may have one or more anomalies in the information provided :"
				+ "\n\n" + "- Incorrect subject format"
				+ "\n" + "- Multiple attachments"
				+ "\n" + "- Attachment with incorrect format"
				+ "\n" + "- No attachment"
				+ "\n" + "- Spam or infected materials"
				+ "\n" + "- Unauthorized senders"
				+ "\n\n" + "Please send email with precise format for automation.";
	var from = "&from=" + from;
	var to = "&to[]=" + to;
	
	var urlObj = URL.parse(sendGridURL + to + subject + text + from);
	logger.info(sendGridURL + to + subject + text + from);
	
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
			logger.info("Notification get response status:" + response.status);
			if (response.statusCode != 200) {
				res.send(response.statusCode, "Error sending notification");
			} else {
				
			}
		});
	});
	request.on("error", function(e) {
		logger.info("error message: " + e.message);
		res.send(400, "Error sending notification " + e.message);
	});
	request.end();
	logger.info("Notification request has been sent out");
}

