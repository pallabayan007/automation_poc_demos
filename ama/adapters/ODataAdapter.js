var util = require("util");

var logger = getLogger("Adapters");

var BaseAdapter = require("./BaseAdapter.js");

var SolmanClient = require("./clients/SolmanClient.js");

//var MQClient = require("./mqlight_client");

var RabbitMQClient = require("../common/rabbitmq_client");

var MQTopics = require("../common/MQTopics.js");

var http = require("http");
var mapper = require("../../config/mapper_config.json");
var SOPConfig = require("../../config/SOPConfig.json");

var AutomationProcessRules = require("../rules/AutomationProcess/AutomationProcessRules.js");

var models = require("../../models");
var AlertAuditLog = models.AlertAuditLog;

var Adapter = function() {

	var self = this;

	this.adapter_name = "ODataAdapter";

	this.connect = function(connectionId, connectionProperties) {
		logger.debug("[ODataAdapter]connect to %s", connectionId);
		switch (connectionId) {
		case "1":
			self.handleSolmanConnect(connectionProperties);
			break;
		default:
			logger.error("[ODataAdapter]Undefined connection of id %s",
					connectionId);
			break;
		}
	}

//	this.mqclient = new MQClient();
	this.rabbitMQClient = new RabbitMQClient();
	this.automationProcessRules = new AutomationProcessRules();

	this.handleSolmanConnect = function(connectionProperties) {
		var client = new SolmanClient(connectionProperties.protocol,
				connectionProperties.domain, connectionProperties.port, connectionProperties.account, connectionProperties.client);

		var clientName = connectionProperties.client; 
		var accounts = (connectionProperties.account!=null&&connectionProperties.account!="")?[connectionProperties.account]:[];
		
		client.getAllAlerts(function(err, alerts) {
			if (err) {
				logger.debug("[ODataAdapter]Get error in Solman APIs: "
						+ err.message);
// self.mqclient.publish(MQTopics.monitoring_adapter_topic, {
// adapter : "SolManODataAlert",
// status : "Error"
// });
//				debugger; 
				
				if (accounts != null && accounts.length > 0) {
					for (var j = 0; j < accounts.length; j++) {
						self.rabbitMQClient.publish(clientName, accounts[j],
								MQTopics.monitoring_adapter_topic, {
									adapter : "SolManODataAlert",
									client: clientName,
									account: accounts[j], 
									status : "Error"
								});
					}
				} else {
					self.rabbitMQClient.publish(clientName, null,
							MQTopics.monitoring_adapter_topic, {
								adapter : "SolManODataAlert",
								client: clientName,  
								status : "Error"
							});
				}
				
				
				return;
			}
			if (!alerts || alerts.length == 0) {
				logger.error("[ODataAdapter]Cannot reach to alerts");
				if (accounts != null && accounts.length > 0) {
					for (var j = 0; j < accounts.length; j++) {
						self.rabbitMQClient.publish(clientName, accounts[j],
								MQTopics.monitoring_adapter_topic, {
									adapter : "SolManODataAlert",
									client: clientName,
									account: accounts[j], 
									status : "Successful"
								});
					}
				} else {
					self.rabbitMQClient.publish(clientName, null,
							MQTopics.monitoring_adapter_topic, {
								adapter : "SolManODataAlert",
								client: clientName,  
								status : "Successful"
							});
				}
				return;
			}
			
			var accountName = null; 
			if (alerts.length > 0 && alerts[0].accountName != null ) {
				var messages = [];
				
				// apply mapper service to convert external alert to internal alert
				var alerts_count = alerts.length;
				var success = 0;
				var failed = 0;
				for(var i = 0 ; i< alerts.length ; i++){
					MapAlert(alerts[i], function(err, alert){
						if (!err) {
							logger.info("converted " + alert.alertName + " (" + alert.applicationName + ")");
							
							// apply rule engine to decide which alerts need to be published to the message queue
							//Current Alert raised time  received from monitoring system
							var crt = alert.alertRaisedTime; 
							//Alert status
							var stat = alert.alertState;
							var criteria = {};
							criteria["alertName"] = alert.alertName;
							var query = AlertAuditLog.find(criteria);
//							query = query.where('applicationName').in(alert.applicationName);
							query.sort("-createTime").lean().exec(function(err, data){
								if(err || data == null || data.length == 0){
									success ++;
									messages.push(alert);
									if((failed + success) == alerts_count){
										logger.info("----------------- Total %s Alerts ----------------", alerts_count);
										logger.info("Success converted : %s, Failed converted : %s", success, failed);
										logger.info("----------------------------------------------------");
										
										if (messages.length > 0) {
											accountName = messages[0].accountName;
											logger.info("to publish the alerts:" + messages.length); 
											// self.mqclient.publish(MQTopics.alert_topic, alerts);
//									debugger; 
											self.rabbitMQClient.publish(clientName, accountName,
													MQTopics.alert_topic, messages);
										}
									}
								} else {
									//most recent alert raised time retrieved from Audit log
//									var alrt = '12:11:12 2-aug-2015';
									var alrt = data[0].createTime.toString();
									
									//Alert state
//									var st = 'AutomationDone' ;
									var st = data[0].status;
									if (st.indexOf("Completed") >= 0 || st.indexOf("Error") >= 0) {
										st = 'AutomationDone';
									} else if (st.indexOf("Abort") >= 0) {
										st = 'AutomationAbort' ;
									} else {
										st = 'AutomationInProgress' ;
									}
									self.automationProcessRules.executeRule(crt, alrt, stat, st, function(err, response1, response2){
										success ++;
										if (err) {
											logger.error(err);
										} else {
											logger.info("Rule-engine returns value  ---->" + response1 + " with elapsed time: " + response2 + "ms");
											if (response1 == 1) {
												messages.push(alert);
											}
										}
										if((failed + success) == alerts_count){
											logger.info("----------------- Total %s Alerts ----------------", alerts_count);
											logger.info("Success converted : %s, Failed converted : %s", success, failed);
											logger.info("----------------------------------------------------");
											
											if (messages.length > 0) {
												accountName = messages[0].accountName;
												logger.info("to publish the alerts:" + messages.length); 
												// self.mqclient.publish(MQTopics.alert_topic, alerts);
//										debugger; 
												self.rabbitMQClient.publish(clientName, accountName,
														MQTopics.alert_topic, messages);
											}
										}
									});
								}
							});
						} else {
							logger.error(err);
							failed ++;
						}
					})
				}
				
			} else if (accounts != null && accounts.length > 0) {
				for (var j = 0; j < accounts.length; j++) {
					self.rabbitMQClient.publish(clientName, accounts[j],
							MQTopics.alert_topic, JSON.stringify(alerts));
				}
			}
		});
	}
	return this;
}

var MapAlert = function(ex_alert, callback){
	var alertPublisherName = ex_alert.alertPublishName;
	var path = mapper["adapterMappers"][alertPublisherName];
	logger.info("Mapper Service: " + global_server_host + ":" + global_server_port + path);
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
				if(res.statusCode != 200){
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
