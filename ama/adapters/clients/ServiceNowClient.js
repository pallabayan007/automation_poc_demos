var http = require("http");
var https = require("https");
var URL = require("url");
var xml2js = require("xml2js");
var async = require("async");

var cipher=require("../../common/CipherKey.js");

var logger = getLogger("ServiceNowClient");

var ServiceNowClient = function(protocol, host, port, path, ticketPaths,
		account, client, authetication) {

	var self = this;

	if (port) {
		this.connection_url = protocol + "://" + host + ":" + port + "/";
		this.itm_url = protocol + "://" + host + ":" + port + "/" + path;
	} else {
		this.connection_url = protocol + "://" + host + "/";
		this.itm_url = protocol + "://" + host + "/" + path;
	}

	this.ticketPaths = ticketPaths;
	this.account = account;
	this.client = client;
	
	
	//Arijit : Decrypt the Service Now Pin
	var pin=cipher.decrypt(authetication.password);
	logger.info("Password decrypt value : === > "+pin);
	
	var auth = new Buffer(authetication.userId + ":" + pin)
			.toString('base64');

	logger.info("using ITM api based on : " + this.itm_url);

	this.getAllAlerts = function(callback) {
		var urlObj = URL.parse(this.itm_url);
		var option = {
			method : "GET",
			port : urlObj.port,
			hostname : urlObj.hostname,
			path : urlObj.path,
			headers : {
				"Content-Type" : "application/xml",
				"Authorization" : "Basic " + auth
			}
		}
		logger.info("Request sent to Monitoring system (for alerts) : " + new Date().toISOString());
		var request = https
				.request(
						option,
						function(response) {
							var data = '';
							response.on("data", function(chunk) {
								data += chunk;
								logger.debug("Get chunk: " + chunk);
							});
							response
									.on(
											"end",
											function() {
												logger
														.info("ServiceNow API[Get Alerts] get response status:"
																+ response.status);
												if (response.statusCode != 200) {
													return callback(new Error(
															data));
												}

												var externalAlerts = JSON
														.parse(data);
												logger
														.info(JSON
																.stringify(externalAlerts));

												var externalAlertArray = externalAlerts.result;
												if (!externalAlertArray
														|| externalAlertArray.length == 0) {
													logger
															.info("ServiceNow API[Get Alerts] invalid response");
													return callback(new Error(
															"Invalid data from ServiceNow API"));
												}

												var activeAlerts = [];
												for (var i = 0; i < externalAlertArray.length; i++) {
													if (externalAlertArray[i].state == 'Reopen'
															|| externalAlertArray[i].state == 'Open') {
														externalAlertArray[i].accountName = self.account;
														externalAlertArray[i].clientName = self.client;
														externalAlertArray[i].alertPublishName = "ServiceNowRESTAlert";
														var index = activeAlerts.length;
														activeAlerts[index] = externalAlertArray[i];
													}
												}

												var successNumber = 0;
												var failedNumber = 0;

												for (var j = 0; j < activeAlerts.length; j++) {
													(function() {
														// get the url
														var focusedActiveAlert = activeAlerts[j];

														var urlObj = URL
																.parse(focusedActiveAlert.type.link);
														var option = {
															method : "GET",
															port : urlObj.port,
															hostname : urlObj.hostname,
															path : urlObj.path,
															headers : {
																"Content-Type" : "application/xml",
																"Authorization" : "Basic "
																		+ auth
															}
														}
														var typeValueRequest = https
																.request(
																		option,
																		function(
																				response) {
																			var data = '';
																			response
																					.on(
																							"data",
																							function(
																									chunk) {
																								data += chunk;
																								logger
																										.debug("Get chunk: "
																												+ chunk);
																							});
																			response
																					.on(
																							"end",
																							function() {
																								logger
																										.info("ServiceNow API[Get Alert Type] ("
																												+ focusedActiveAlert.number
																												+ ") get response status:"
																												+ response.status);
																								if (response.statusCode != 200) {
																									failedNumber++;
																									logger
																											.info("Type Value for ("
																													+ focusedActiveAlert.number
																													+ ") can not be retrieved !!");
																								} else {
																									var alertTypeValue = JSON
																											.parse(data);
																									var typeValue = alertTypeValue.result.name;
																									logger
																											.info("Type Value for ("
																													+ focusedActiveAlert.number
																													+ "):"
																													+ typeValue);
																									focusedActiveAlert.typeValue = typeValue;
																									successNumber++;
																								}

																								var processedNumber = failedNumber
																										+ successNumber;
																								if (processedNumber == activeAlerts.length) {
																									callback(
																											null,
																											activeAlerts);
																									logger
																											.info(
																													"receive %s alerts from ServiceNow",
																													activeAlerts.length);
																								}
																							});
																		});
														typeValueRequest
																.on(
																		"error",
																		function(
																				e) {
																			logger
																					.info("ServiceNow API[Get Ticket Type] ("
																							+ focusedActiveAlert.number
																							+ ") Error message: "
																							+ e.message);
																			callback(e);
																		});
														typeValueRequest.end();
														logger
																.info("ServiceNow API[Get Ticket Type] ("
																		+ focusedActiveAlert.number
																		+ ") request has been sent out");
													})();
												}
											});
						});
		request.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});
		request.end();
		logger.info("ITM API[Get Alerts] request has been sent out");
	}

	this.getAllTickets = function(callback) {

		for (var i = 0; i < this.ticketPaths.length; i++) {
			var ticketPath = this.connection_url + this.ticketPaths[i];
			var urlObj = URL.parse(ticketPath);
			var option = {
				method : "GET",
				port : urlObj.port,
				hostname : urlObj.hostname,
				path : urlObj.path,
				headers : {
					"Content-Type" : "application/xml",
					"Authorization" : "Basic " + auth
				}
			}
			logger.info("Request sent to Monitoring system (for tickets) : " + new Date().toISOString());
			var request = https
					.request(
							option,
							function(response) {
								var data = '';
								response.on("data", function(chunk) {
									data += chunk;
									logger.debug("Get chunk: " + chunk);
								});
								response
										.on(
												"end",
												function() {
													logger
															.info("ServiceNow API[Get Tickets] get response status:"
																	+ response.status);
													if (response.statusCode != 200) {
														return callback(new Error(
																data));
													}

													var externalAlerts = JSON
															.parse(data);
													logger
															.info(JSON
																	.stringify(externalAlerts));

													var externalAlertArray = externalAlerts.result;
													if (!externalAlertArray
															|| externalAlertArray.length == 0) {
														logger
																.info("ServiceNow API[Get Alerts] invalid response");
														return callback(new Error(
																"Invalid data from ServiceNow API"));
													}

													for (var i = 0; i < externalAlertArray.length; i++) {
														externalAlertArray[i].accountName = self.account;
														externalAlertArray[i].clientName = self.client;
														externalAlertArray[i].alertPublishName = "ServiceNowTickets";
													}

													var activeAlerts = externalAlertArray;

													// for each activeAlerts,
													// get
													// the type value via access
													// url
													var successNumber = 0;
													var failedNumber = 0;
													var total = 0;
													var callbacked = false;

													// construct the link array
													// to async accessing
													var linksToAccess = [];

													for (var j = 0; j < externalAlertArray.length; j++) {
														if (externalAlertArray[j].opened_by != null
																&& externalAlertArray[j].opened_by != ""
																&& externalAlertArray[j].opened_by.link != null
																&& externalAlertArray[j].opened_by.link != "") {
															linksToAccess[linksToAccess.length] = {
																"link" : externalAlertArray[j].opened_by.link,
																"valuePath" : [
																		"result",
																		"name" ],
																"valueName" : "openedByName",
																"ticket" : externalAlertArray[j]
															};
															total++;
														}
														if (externalAlertArray[j].assigned_to != null
																&& externalAlertArray[j].assigned_to != ""
																&& externalAlertArray[j].assigned_to.link != null
																&& externalAlertArray[j].assigned_to.link != "") {
															linksToAccess[linksToAccess.length] = {
																"link" : externalAlertArray[j].assigned_to.link,
																"valuePath" : [
																		"result",
																		"name" ],
																"valueName" : "assignedToName",
																"ticket" : externalAlertArray[j]
															};
															total++;
														}
														if (externalAlertArray[j].assignment_group != null
																&& externalAlertArray[j].assignment_group != ""
																&& externalAlertArray[j].assignment_group.link != null
																&& externalAlertArray[j].assignment_group.link != "") {
															linksToAccess[linksToAccess.length] = {
																"link" : externalAlertArray[j].assignment_group.link,
																"valuePath" : [
																		"result",
																		"name" ],
																"valueName" : "assignmentGroupName",
																"ticket" : externalAlertArray[j]
															};
															total++;
														}
														if (externalAlertArray[j].business_service != null
																&& externalAlertArray[j].business_service != ""
																&& externalAlertArray[j].business_service.link != null
																&& externalAlertArray[j].business_service.link != "") {
															linksToAccess[linksToAccess.length] = {
																"link" : externalAlertArray[j].business_service.link,
																"valuePath" : [
																		"result",
																		"name" ],
																"valueName" : "businessServiceName",
																"ticket" : externalAlertArray[j]
															};
															total++;
														}

														var taskCategoryUrl = self.connection_url
																+ "api/now/v1/table/"
																+ externalAlertArray[j].sys_class_name
																+ "?number="
																+ externalAlertArray[j].number;
														linksToAccess[linksToAccess.length] = {
															"link" : taskCategoryUrl,
															"valuePath" : [
																	"result",
																	"category" ],
															"valueName" : "category",
															"ticket" : externalAlertArray[j]
														};
														total++;

														linksToAccess[linksToAccess.length] = {
															"link" : taskCategoryUrl,
															"valuePath" : [
																	"result",
																	"subcategory" ],
															"valueName" : "subcategory",
															"ticket" : externalAlertArray[j]
														};
														total++;
													}

													async
															.eachSeries(
																	linksToAccess,
																	function(
																			linkToAccess,
																			cb) {

																		var urlObj = URL
																				.parse(linkToAccess.link);
																		var option = {
																			method : "GET",
																			port : urlObj.port,
																			hostname : urlObj.hostname,
																			path : urlObj.path,
																			headers : {
																				"Content-Type" : "application/xml",
																				"Authorization" : "Basic "
																						+ auth
																			}
																		};

																		var linkAccessRequest = https
																				.request(
																						option,
																						function(
																								response) {
																							var data = '';
																							response
																									.on(
																											"data",
																											function(
																													chunk) {
																												data += chunk;
																												logger
																														.debug("Get chunk: "
																																+ chunk);
																											});
																							response
																									.on(
																											"end",
																											function() {
																												// logger
																												// .info("ServiceNow
																												// API[Get
																												// Ticket
																												// Value]
																												// ("
																												// +
																												// linkToAccess.valueName
																												// + ")
																												// get
																												// response
																												// status:"
																												// +
																												// response.status);
																												if (response.statusCode != 200) {
																													failedNumber++;
																													logger
																															.info("Value for ("
																																	+ linkToAccess.valueName
																																	+ ") can not be retrieved !!");
																													cb(
																															null,
																															linkToAccess);
																												} else {
																													var realValue = JSON
																															.parse(data);

																													for (var m = 0; m < linkToAccess.valuePath.length; m++) {
																														var pathName = linkToAccess.valuePath[m];
																														realValue = realValue[pathName];
																													}

																													if (!realValue) {
																														logger
																																.info("Value for ("
																																		+ linkToAccess.valueName
																																		+ "):"
																																		+ realValue);
																													} else {
																														logger
																																.info("Value for ("
																																		+ linkToAccess.valueName
																																		+ "):"
																																		+ realValue);
																														linkToAccess.ticket[linkToAccess.valueName] = realValue;
																													}
																													successNumber++;
																													cb(
																															null,
																															linkToAccess);
																												}
																											});
																						});
																		linkAccessRequest
																				.on(
																						"error",
																						function(
																								e) {
																							// logger
																							// .info("ServiceNow
																							// API[Get
																							// Ticket
																							// Type]
																							// ("
																							// +
																							// linkToAccess.link
																							// + ")
																							// Error
																							// message:
																							// "
																							// +
																							// e.message);
																							failedNumber++;
																							cb(
																									null,
																									linkToAccess);

																						});
																		linkAccessRequest
																				.end();
																		logger
																				.info("ServiceNow API[Get Ticket Attribute Values] ("
																						+ linkToAccess.ticket.number
																						+ ") request has been sent out");

																	},
																	function(
																			err) {
																		if (err) {
																			console
																					.log("err is:"
																							+ err);
																		}

																		if (failedNumber
																				+ successNumber == total) {
																			callback(
																					null,
																					activeAlerts);
																		}
																	});

												});
							});
			request.on("error", function(e) {
				logger.info("error message: " + e.message);
				callback(e);
			});
			request.end();
			logger.info("ServiceNow API[Get Ticket] request has been sent out");
		}
	}
}

module.exports = ServiceNowClient;
