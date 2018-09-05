var util = require("util");

var logger = getLogger("Adapters");

var BaseAdapter = require("./BaseAdapter.js");

var ITMClient = require("./clients/ITMClient.js");
var ServiceNowClient = require("./clients/ServiceNowClient.js");

// var MQClient = require("./mqlight_client");

var RabbitMQClient = require("../common/rabbitmq_client");

var MQTopics = require("../common/MQTopics.js");

var http = require("http");
var mapper = require("../../config/mapper_config.json");
var SOPConfig = require("../../config/SOPConfig.json");

var AutomationProcessRules = require("../rules/AutomationProcess/AutomationProcessRules.js");

var models = require("../../models");
var AlertAuditLog = models.AlertAuditLog;
var TicketAuditLog = models.TicketAuditLog;

var Adapter = function() {

	var self = this;

	this.adapter_name = "RESTAdapter";

	this.connect = function(connectionId, connectionProperties) {
		logger.debug("[RESTAdapter]connect to %s", connectionId);
		self.handleConnect(connectionProperties);
	}

	this.rabbitMQClient = new RabbitMQClient();
	this.automationProcessRules = new AutomationProcessRules();

	this.handleConnect = function(connectionProperties) {

		var client = null;

		switch (connectionProperties.toolName) {
			case "ServiceNow":
				client = new ServiceNowClient(connectionProperties.protocol,
					connectionProperties.domain, connectionProperties.port,
					connectionProperties.path, connectionProperties.ticketPaths, connectionProperties.account,
					connectionProperties.client,
					connectionProperties.authetication);
				adapterName = "ServiceNowRestAdapter";
				break;
			case "Tivoli":
				client = new ITMClient(connectionProperties.protocol,
					connectionProperties.domain, connectionProperties.port,
					connectionProperties.path, connectionProperties.account,
					connectionProperties.client);
				adapterName = "TIMRestAdapter";
				break;

		}

		var clientName = connectionProperties.client;
		var accounts = (connectionProperties.account != null && connectionProperties.account != "") ? [connectionProperties.account] : [];

		client.getAllAlerts(function(err, alerts) {
			logger.info("Response received from the Monitoring system (for alerts): " + new Date().toISOString());
			if (err) {
				logger.debug("[RESTAdapter]Get error in APIs: " + err.message);

				if (accounts != null && accounts.length > 0) {
					for (var j = 0; j < accounts.length; j++) {
						self.rabbitMQClient.publish(clientName, accounts[j], MQTopics.monitoring_adapter_topic, {
							adapter: "ITMRESTAlert",
							client: clientName,
							account: accounts[j],
							status: "Error"
						});
					}
				} else {
					self.rabbitMQClient.publish(clientName, null, MQTopics.monitoring_adapter_topic, {
						adapter: "ITMRESTAlert",
						client: clientName,
						status: "Error"
					});
				}
				return;
			}
			if (!alerts || alerts.length == 0) {
				logger.error("[RESTAdapter]Cannot reach to alerts");
				if (accounts != null && accounts.length > 0) {
					for (var j = 0; j < accounts.length; j++) {
						self.rabbitMQClient.publish(clientName, accounts[j], MQTopics.monitoring_adapter_topic, {
							adapter: "ITMRESTAlert",
							client: clientName,
							account: accounts[j],
							status: "Successful"
						});
					}
				} else {
					self.rabbitMQClient.publish(clientName, null, MQTopics.monitoring_adapter_topic, {
						adapter: "ITMRESTAlert",
						client: clientName,
						status: "Successful"
					});
				}
				return;
			}

			var accountName = null;
			if (alerts.length > 0 && alerts[0].accountName != null) {
				var messages = [];

				// apply mapper service to convert external alert to
				// internal alert
				var alerts_count = alerts.length;
				var success = 0;
				var failed = 0;
				for (var i = 0; i < alerts.length; i++) {
					MapAlert(alerts[i], function(err, alert) {
						if (!err) {
							logger.info("converted " + alert.alertName + " (" + alert.applicationName + ")");

							// apply rule engine to decide which
							// alerts need to be published to
							// the message queue
							// Current Alert raised time
							// received from monitoring system
							var crt = Date.parse(alert.alertRaisedTime).toString();
							// Alert status
							var stat = alert.alertState;
							var criteria = {};
							criteria["alertName"] = alert.alertName;
							var query = AlertAuditLog.find(criteria);
							// query =
							// query.where('applicationName').in(alert.applicationName);
							query.sort("-createTime").lean().exec(function(err, data) {
								if (err || data == null || data.length == 0) {
									success++;
									var duplicated = false;
									for (var j = 0; j < messages.length; j++) {
										if (messages[j].alertName == alert.alertName && messages[j].applicationName == alert.applicationName) {
											duplicated = true;
											break;
										}
									}
									if (!duplicated)
										messages.push(alert);
									if ((failed + success) == alerts_count) {
										logger.info("----------------- Total %s Alerts ----------------", alerts_count);
										logger.info("Success converted : %s, Failed converted : %s", success, failed);
										logger.info("----------------------------------------------------");

										if (messages.length > 0) {
											accountName = messages[0].accountName;
											logger.info("to publish the alerts:" + messages.length);
											// self.mqclient.publish(MQTopics.alert_topic,
											// alerts);
											// debugger;
											self.rabbitMQClient.publish(clientName, accountName, MQTopics.alert_topic, messages);
										}
									}
								} else {
									//var alrt = Date.parse(data[0].alertRaisedTime).toString();

									//var st = data[0].status;
									
									//Retrieve appropriate record for checking with the rule
									var matchingDataRecord = getMatchingAlertDataRecord(crt,data);
									
									var alrt = Date.parse(matchingDataRecord.alertRaisedTime).toString();
									var st = matchingDataRecord.status;

									
									if (st.indexOf("Completed") >= 0 || st.indexOf("Error") >= 0) {
										st = 'AutomationDone';
									} else if (st.indexOf("Abort") >= 0) {
										st = 'AutomationAbort' ;
									} else {
										st = 'AutomationInProgress';
									}
									
									logger.info("Alert["+alert.alertName+"] Status :"+stat+" State:"+st+" crt:"+crt+" alrt:"+alrt);
									self.automationProcessRules.executeRule(crt, alrt, stat, st, function(err, response1, response2) {
										success++;
										if (err) {
											logger.error(err);
										} else {
											logger.info("Rule-engine returns value  ---->" + response1 + " with elapsed time: " + response2 + "ms");
											if (response1 == 1) {
												duplicated = false;
												for (var j = 0; j < messages.length; j++) {
													if (messages[j].alertName == alert.alertName && messages[j].applicationName == alert.applicationName) {
														duplicated = true;
														break;
													}
												}
												if (!duplicated)
													messages
													.push(alert);
											}
										}
										if ((failed + success) == alerts_count) {
											logger.info("----------------- Total %s Alerts ----------------", alerts_count);
											logger.info("Success converted : %s, Failed converted : %s", success, failed);
											logger.info("----------------------------------------------------");

											if (messages.length > 0) {
												accountName = messages[0].accountName;
												logger.info("to publish the alerts:" + messages.length);
												// self.mqclient.publish(MQTopics.alert_topic,
												// alerts);
												// debugger;
												self.rabbitMQClient.publish(clientName, accountName, MQTopics.alert_topic, messages);
											}
										}
									});
								}
							});
						} else {
							logger.error(err);
							failed++;
						}
					})
				}

			} else if (accounts != null && accounts.length > 0) {
				for (var j = 0; j < accounts.length; j++) {
					// debugger;
					self.rabbitMQClient.publish(clientName, accounts[j], MQTopics.alert_topic, JSON.stringify(alerts));
				}
			}

			// self.mqclient.publish(MQTopics.alert_topic, alerts);
		});
		
		
		client.getAllTickets(function(err, alerts) {
			logger.info("Response received from the Monitoring system (for tickets): " + new Date().toISOString());
			if (err) {
				logger.debug("[RESTAdapter]Get error in APIs: " + err.message);

				if (accounts != null && accounts.length > 0) {
					for (var j = 0; j < accounts.length; j++) {
						self.rabbitMQClient.publish(clientName, accounts[j], MQTopics.monitoring_adapter_topic, {
							adapter: "ITMRESTAlert",
							client: clientName,
							account: accounts[j],
							status: "Error"
						});
					}
				} else {
					self.rabbitMQClient.publish(clientName, null, MQTopics.monitoring_adapter_topic, {
						adapter: "ITMRESTAlert",
						client: clientName,
						status: "Error"
					});
				}
				return;
			}
			if (!alerts || alerts.length == 0) {
				logger.error("[RESTAdapter]Cannot reach to alerts");
				if (accounts != null && accounts.length > 0) {
					for (var j = 0; j < accounts.length; j++) {
						self.rabbitMQClient.publish(clientName, accounts[j], MQTopics.monitoring_adapter_topic, {
							adapter: "ITMRESTAlert",
							client: clientName,
							account: accounts[j],
							status: "Successful"
						});
					}
				} else {
					self.rabbitMQClient.publish(clientName, null, MQTopics.monitoring_adapter_topic, {
						adapter: "ITMRESTAlert",
						client: clientName,
						status: "Successful"
					});
				}
				return;
			}

			var accountName = null;
			if (alerts.length > 0 && alerts[0].accountName != null) {
				var messages = [];

				// apply mapper service to convert external alert to
				// internal alert
				var alerts_count = alerts.length;
				var success = 0;
				var failed = 0;
				for (var i = 0; i < alerts.length; i++) {

					MapTicket(alerts[i], function(err, ticket) {
						if (!err) {
							
							logger.info("converted " + ticket.ticketNumber + " (" + ticket.cause + ")");

//							if (ticket.ticketNumber != "INC0010005") {
//								failed++;
//								if ((failed + success) == alerts_count) {
//									logger.info("----------------- Total %s Tickets ----------------", alerts_count);
//									logger.info("Success converted : %s, Failed converted : %s", success, failed);
//									logger.info("----------------------------------------------------");
//
//									if (messages.length > 0) {
//										accountName = messages[0].accountName;
//										logger.info("to publish the tickets:" + messages.length);
//										// self.mqclient.publish(MQTopics.alert_topic,
//										// alerts);
//										// debugger;
//										self.rabbitMQClient.publish(clientName, accountName, MQTopics.ticket_topic, messages);
//									}
//								}
//								return;
//							}
							
							// apply rule engine to decide which
							// alerts need to be published to
							// the message queue
							// Current Alert raised time
							// received from monitoring system
							
							var criteria = {};
							criteria["ticketNumber"] = ticket.ticketNumber;
							var query = TicketAuditLog.find(criteria);
							// query =
							// query.where('applicationName').in(alert.applicationName);
							query.sort("-createTime").lean().exec(function(err, data) {
								
								if (err || data == null || data.length == 0) {
									success++;
									var duplicated = false;
									for (var j = 0; j < messages.length; j++) {
										if (messages[j].ticketNumber == ticket.ticketNumber) {
											duplicated = true;
											break;
										}
									}
									if (!duplicated)
										messages.push(ticket);
								} else {
									success++;									
//									messages.push(ticket);
								}
									
//									var alrt = data[0].createTime.toString();
//
//									var st = data[0].status;
//									if (st.indexOf("Completed") >= 0 || st.indexOf("Error") >= 0) {
//										st = 'AutomationDone';
//									} else if (st.indexOf("Abort") >= 0) {
//										st = 'AutomationAbort' ;
//									} else {
//										st = 'AutomationInProgress';
//									}
//									self.automationProcessRules.executeRule(crt, alrt, stat, st, function(err, response1, response2) {
//										success++;
//										if (err) {
//											logger.error(err);
//										} else {
//											logger.info("Rule-engine returns value  ---->" + response1 + " with elapsed time: " + response2 + "ms");
//											if (response1 == 1) {
//												duplicated = false;
//												for (var j = 0; j < messages.length; j++) {
//													if (messages[j].alertName == alert.alertName && messages[j].applicationName == alert.applicationName) {
//														duplicated = true;
//														break;
//													}
//												}
//												if (!duplicated)
//													messages
//													.push(alert);
//											}
//										}
//									});
//								}

								if ((failed + success) == alerts_count) {
									logger.info("----------------- Total %s Tickets ----------------", alerts_count);
									logger.info("Success converted : %s, Failed converted : %s", success, failed);
									logger.info("----------------------------------------------------");

									if (messages.length > 0) {
										accountName = messages[0].accountName;
										logger.info("to publish the tickets:" + messages.length);
										// self.mqclient.publish(MQTopics.alert_topic,
										// alerts);
										// debugger;
										self.rabbitMQClient.publish(clientName, accountName, MQTopics.ticket_topic, messages);
									}
								}
							});
						} else {
							logger.error(err);
							failed++;
							if ((failed + success) == alerts_count) {
								logger.info("----------------- Total %s Tickets ----------------", alerts_count);
								logger.info("Success converted : %s, Failed converted : %s", success, failed);
								logger.info("----------------------------------------------------");

								if (messages.length > 0) {
									accountName = messages[0].accountName;
									logger.info("to publish the tickets:" + messages.length);
									// self.mqclient.publish(MQTopics.alert_topic,
									// alerts);
									// debugger;
									self.rabbitMQClient.publish(clientName, accountName, MQTopics.ticket_topic, messages);
								}
							}
						}
					})
				}

			} else if (accounts != null && accounts.length > 0) {
				for (var j = 0; j < accounts.length; j++) {
					// debugger;
					self.rabbitMQClient.publish(clientName, accounts[j], MQTopics.alert_topic, JSON.stringify(alerts));
				}
			}

			// self.mqclient.publish(MQTopics.alert_topic, alerts);
		});
	}
	return this;
}

function getMatchingAlertDataRecord(alertCreateTime, dataRecords) {
	var tempRecord = {};
	var matchingRecord = null;
	
	for(var index = dataRecords.length - 1 ; index >= 0 ; index--) {
		tempRecord = dataRecords[index];
		var alertRaisedTime = Date.parse(tempRecord.alertRaisedTime).toString();
		if(alertCreateTime === alertRaisedTime) {
			matchingRecord = dataRecords[index];
			logger.info("====getMatchingAlertDataRecord::Matching Record Found::"+matchingRecord);
		}
	}
	
	return ((matchingRecord!=null) ? matchingRecord : tempRecord);
	
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
					return callback(new Error(data + "(" + url + ")"));
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

var MapTicket = function(ex_alert, callback) {
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
					return callback(new Error(data + "(" + url + ")"));
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

util.inherits(Adapter, BaseAdapter);

module.exports = Adapter;