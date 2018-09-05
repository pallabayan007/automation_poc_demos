var mongo = require('mongodb');

var MongoClient = mongo.MongoClient;


var util = require("util");

var logger = getLogger("Adapters"); 

var BaseAdapter = require("./BaseAdapter.js");

var BPVClient = require("./clients/BPVClient.js");

//var MQClient = require("./mqlight_client");

var RabbitMQClient = require("../common/rabbitmq_client");

var MQTopics = require("../common/MQTopics.js");

var http = require("http");
var mapper = require("../../config/mapper_config.json");
var SOPConfig = require("../../config/SOPConfig.json");

var AutomationProcessRules = require("../rules/AutomationProcess/AutomationProcessRules.js");

var models = require("../../models");
var AlertAuditLog = models.AlertAuditLog;
var SQLAlertLog = models.SQLAdapterAlertLastTS;



var Adapter = function(){
	
	var self = this;
	
	this.adapter_name = "SQLAdapter";
	
	this.connect = function(connectionId, connectionProperties){
		logger.info("[SQLAdapter]connect to %s",connectionId);
		switch(connectionId){
		case "1":
			self.handleITMConnect(connectionId,connectionProperties);
			break;
		default:
			logger.error("[SQlAdapter]Undefined connection of id %s", connectionId);
			break;
		}
	}
	
	// this.mqclient = new MQClient();
	this.rabbitMQClient = new RabbitMQClient();
	this.automationProcessRules = new AutomationProcessRules();

	this.handleITMConnect = function(connectionId,connectionProperties){
		var lastTimestamp =null;
		getLastTimestamp(function(err, data){
			if(err){
				logger.info("err in connect BPV from SQLAdapter"+err);
				
				}
			else{
				/*if(data==null){
					data ={updateTimestamp: 'empty'};
				}
			
				lastTimestamp = data.updateTimestamp;
				dateLast = new Date(lastTimestamp);
				
				logger.info("dateLast ::"+dateLast);*/
				
				logger.info("data in SQLAdapter------------------------>" +data);
				var client = new BPVClient( connectionProperties.authetication.userId, connectionProperties.authetication.password, connectionProperties.server, connectionProperties.database, connectionProperties.account, connectionProperties.client);
				
				var clientName = connectionProperties.client; 
				var accounts = (connectionProperties.account!=null&&connectionProperties.account!="")?[connectionProperties.account]:[];
				
				client.getAllAlerts(data, function(err, alerts){
					if(err){
						logger.info("[SQLAdapter]Get error in ITM APIs: mmmmmmmmmmmmmmmmmmm " + err.message);
						
						// self.mqclient.publish(MQTopics.monitoring_adapter_topic, {adapter:"ITMRESTAlert",status:"Error"});
//						debugger; 
						
						if (accounts != null && accounts.length > 0) {
							for (var j = 0; j < accounts.length; j++) {
								self.rabbitMQClient.publish(clientName, accounts[j],
										MQTopics.monitoring_adapter_topic, {
											adapter : "SQLAlert",
											client: clientName,
											account: accounts[j], 
											status : "Error"
										});
							}
						} else {
							self.rabbitMQClient.publish(clientName, null,
									MQTopics.monitoring_adapter_topic, {
										adapter : "SQLAlert",
										client: clientName,  
										status : "Error"
									});
						}
						return;
					}
					if(!alerts || alerts.length == 0){
						logger.error("[SQLAdapter]Cannot reach to alerts");
						if (accounts != null && accounts.length > 0) {
							for (var j = 0; j < accounts.length; j++) {
								self.rabbitMQClient.publish(clientName, accounts[j],
										MQTopics.monitoring_adapter_topic, {
											adapter : "SQLAlert",
											client: clientName,
											account: accounts[j], 
											status : "Successful"
										});
							}
						} else {
							self.rabbitMQClient.publish(clientName, null,
									MQTopics.monitoring_adapter_topic, {
										adapter : "SQLAlert",
										client: clientName,  
										status : "Successful"
									});
						}
						return;
					}
					
					var accountName = null; 
					if (alerts.length > 0 && alerts[0].accountName != null ) {
						var messages = [];
						accountName = alerts[0].accountName;
						logger.info("checking if alerts size is correct" + accountName);
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
//									query = query.where('applicationName').in(alert.applicationName);
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
//											debugger; 
													self.rabbitMQClient.publish(clientName, accountName,
															MQTopics.alert_topic, messages);
												}
											}
										} else {
											//most recent alert raised time retrieved from Audit log
//											var alrt = '12:11:12 2-aug-2015';
											var alrt = data[0].createTime.toString();
											
											//Alert state
//											var st = 'AutomationDone' ;
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
//												debugger; 
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
//							debugger; 
							self.rabbitMQClient.publish(clientName, accounts[j],
									MQTopics.alert_topic, JSON.stringify(alerts));
						}
					}
					
					// self.mqclient.publish(MQTopics.alert_topic, alerts);
					insertLastTimestamp(connectionId);
				});
			}
			});
		
		

	}
	return this;
}


var MapAlert = function(ex_alert, callback){
	var alertPublisherName = ex_alert.alertPublishName;
	var path = mapper["adapterMappers"][alertPublisherName];
	logger.info("Mapper Service: test  " + global_server_host + ":" + global_server_port + path);
	var option = {
			method : "POST",
			port : global_server_port,
			hostname : global_server_host,
			path : "/rest/mappers/SQLAlertMapper",
			headers : {
				"Content-Type" : "application/json",
				"Authorization" : SOPConfig.basicAuthHeader
				
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
	logger.info("ex_alert"+ ex_alert);
	//req.write(JSON.stringify(alert));
	req.write(JSON.stringify(ex_alert));
	logger.info("req: "+ req);
	req.end();
}

util.inherits(Adapter, BaseAdapter);

function insertLastTimestamp(connectionId){
	logger.info("connectionId"+ connectionId);
	var sqlLog = new SQLAlertLog({
		//_id: mongoose.Types.ObjectId(),
		connectionID: connectionId,
		lastTimestamp:new Date().toISOString(),
		  updateTimestamp:new Date().toISOString()
		  

	    });
	
	sqlLog.save(function (err) {
		logger.info("connectionId" +connectionId);
		  if (err) {
			  logger.info("error in inserting record"+err);
				return err;
		  }
		  else {
			  logger.info("success in inserting record");
		  }
		});
	
}

function getLastTimestamp(cb){
	  logger.info("inside the getLastTimestamp" );
	SQLAlertLog.findOne({}, {}, { sort: { 'updateTimestamp' : -1 } }, function(err, post) {
		 if (err) {
			  logger.info("error in inserting record"+err);
			   cb( err );
				return ;
		  }else{
			  logger.info("success in pulling record" +post);
			  
			  cb( err, post );
		  }
});
	
	//model.findOne().sort({ field: 'asc', _id: -1 }).limit(1)
}


function sqlCall(query, cb) {
	  var connection = new sql.Connection(config, function(err) {
	    if (typeof err !== "undefined" && err !== null) {
	    	logger.info("inside sqlCall error");
	      cb( err );
	      return
	    }

	    var request = new sql.Request(connection); // or: var request = connection.request();
	    request.query(query, function(err, recordset) {
	    	logger.info("inside sqlCall correct");
	      cb( err, recordset );
	    });

	  });

	}

module.exports = Adapter;
