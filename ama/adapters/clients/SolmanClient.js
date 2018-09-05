var http = require("http");
var https = require("https");
var URL = require("url");
var fs = require("fs");
var path = require("path");

var moment = require("moment");

var xml2js = require('xml2js');

var auth = "Basic c25hbmR5OjFxYXpAV1NY";
var logger = getLogger("SolmanClient");

//var response_counter = 0;
//var success_response_counter = 0;

var SolmanClient = function(protocol, host, port, account, client) {

	var self = this;
	
	this.solman_base = protocol + "://" + host + ":" + port;
	
	this.account = account;
	this.client = client;
	
	logger.info("using solman api based on : " + this.solman_base);

	this.getContext = function(callback) {
		var url = this.solman_base
				+ "/sap/opu/odata/AIGW/TECHMON/TechnicalSystemCollection";
		logger.info("Solman API[Get Context] " + url);
		var urlObj = URL.parse(url);
		var option = {
			method : "GET",
			port : urlObj.port,
			hostname : urlObj.hostname,
			path : urlObj.path,
			headers : {
				"Content-Type" : "application/json",
				"Authorization" : auth
			}
		}
		var request = http.request(option, function(response) {
			var data = '';
			response.on("data", function(chunk) {
				data += chunk;
				logger.debug("Get chunk: " + chunk);
			});
			response.on("end", function() {
//				response_counter++;
//				logger.info("################### Responses Counter = " + response_counter + " ###################");
				logger.info("Solman API[Get Context] get response status:" + response.status);
				if(response.statusCode != 200){
					return callback(new Error(data));
				}
				
				if(!data || data.length == 0){
					logger.info("Solman API[Get Context] invalid response");
					return callback(new Error("Invalid data from Solman API"));
				}
				
				logger.info("Solman API[Get Context] get response data" + data);
				
				xml2js.parseString(data, function(err, result) {
					if(err){
						logger.info("Solman API[Get Context] parse get error");
						return callback(err);
					}
					logger.info("Solman API[Get Context] parse successfully");
					var entries = result["feed"]["entry"];
					var ret = [];
					for (var i = 0; i < entries.length; i++) {
						var item = entries[i]["content"][0]["m:properties"][0];
						var application_id = item["d:contextID"][0];
						var application_name = item["d:contextName"][0];
						var application_name = application_name.substring(0,
								application_name.indexOf("~"));
						var application_description = item["d:caption"][0];
						var application_type = item["d:systemType"][0];
						var noOfAlerts = item["d:noOfAlerts"][0];
						var object = {
							application_id : application_id,
							application_name : application_name,
							application_description : application_description,
							application_type : application_type,
							noOfAlerts : noOfAlerts
						}
						ret.push(object);
					}
					callback(null, ret);
				});
//				success_response_counter++;
//				logger.info("################### Success Responses Counter = " + success_response_counter + " ###################");

			});
		});
		request.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});
		request.end();
		logger.info("Solman API[Get Context] request has been sent out");
	}

	this.getContextbyContextID = function(contextID, contextName, callback) {
		var url = this.solman_base
				+ "/sap/opu/odata/AIGW/TECHMON/TechnicalSystemCollection(contextID='"
				+ contextID + "',contextName='" + contextName + "')";
		logger.info("Solman API[Get Context by Given Context ID] " + url);
		var urlObj = URL.parse(url);
		var option = {
			method : "GET",
			port : urlObj.port,
			hostname : urlObj.hostname,
			path : urlObj.path,
			headers : {
				"Content-Type" : "application/json",
				"Authorization" : auth
			}
		}
		var request = http.request(option, function(response) {
			var data = '';
			response.on("data", function(chunk) {
				data += chunk;
			});
			response.on("end", function() {
				xml2js.parseString(data, function(err, result) {
					var entry = result["entry"];
					var ret = {};
					var item = entry["content"][0]["m:properties"][0];
					var application_id = item["d:contextID"][0];
					var application_name = item["d:contextName"][0];
					var application_name = application_name.substring(0,
							application_name.indexOf("~"));
					var application_description = item["d:caption"][0];
					var application_type = item["d:systemType"][0];
					var noOfAlerts = item["d:noOfAlerts"][0];
					ret = {
						application_id : application_id,
						application_name : application_name,
						application_description : application_description,
						application_type : application_type,
						noOfAlerts : noOfAlerts
					}
					callback(null, ret);
				});
			});
		});
		request.on("error", function(e) {
			logger.info("error message test: " + e.message);
			callback(e);
		});
		request.end();
	}

	this.getAlerts = function(contextID, contextName, callback) {
		var url = this.solman_base
				+ "/sap/opu/odata/AIGW/TECHMON/TechnicalSystemCollection(contextID='"
				+ contextID + "',contextName='" + contextName + "')/alerts";
		logger.info("Solman API[Get Alert by Given Context ID] " + url);
		var urlObj = URL.parse(url);
		var option = {
			method : "GET",
			port : urlObj.port,
			hostname : urlObj.hostname,
			path : urlObj.path,
			headers : {
				"Content-Type" : "application/json",
				"Authorization" : auth
			}
		}
		var request = http.request(option, function(response) {
			var data = '';
			response.on("data", function(chunk) {
				data += chunk;
			});
			response.on("end", function() {
				xml2js.parseString(data, function(err, result) {
					var entries = result["feed"]["entry"];
					var ret = [];

					for (var i = 0; i < entries.length; i++) {
						entries[i].application_id = contextID;
						entries[i].application_name = contextName.split("~")[0];
						entries[i].account_name = self.account;
						entries[i].client_name = self.client;
						entries[i].alertPublishName = "SolManODataAlert";
						ret.push(entries[i]);
						
//						var item = entries[i]["content"][0]["m:properties"][0];
//
//						var alert_id = item["d:alertTypeID"][0];
//						var alert_type = item["d:categoryText"][0];
//						var alert_name = item["d:name"][0];
//						var alert_severity = item["d:priority"][0];
//						var alert_timestamp = item["d:lastChangeDateTime"][0]
//								.trim();
//						alert_timestamp = moment(alert_timestamp,
//								[ "YYYYMMDDHHmmss" ]).toDate().toString();
//						var object = {
//							alert_id : alert_id,
//							alert_type : alert_type,
//							alert_name : alert_name,
//							alert_description : alert_name,
//							alert_severity : alert_severity,
//							alert_timestamp : alert_timestamp
//						}
//						ret.push(object);
					}
					callback(null, ret);
				});
			});
		});
		request.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});
		request.end();
	}

	this.getAlertDetails = function() {
		// TBD
	}
	this.getAlertExDetails = function() {
		// TBD
	}

	this.getAllAlerts = function(callback) {
		var all_alerts = [];
		logger.info("Get all alerts API");
		self.getContext(function(err, context_list) {
			if(err){
				return callback(err);
			}
			
			var count = context_list.length;
			if (count == 0) {
				callback(null, all_alerts)
			}
			for (var i = 0; i < context_list.length; i++) {
				(function(){
					var app = context_list[i];
					self.getAlerts(app.application_id,
						app.application_name + "~"
								+ app.application_type, function(
								err, alerts) {
							if(err){
								return callback(err);
							}
//							for(var j = 0; j < alerts.length; j++){
//								alerts[j].application_id = app.application_id;
//								alerts[j].application_name = app.application_name;
//								alerts[j].account_name = "SAP Account";
//							}
							
							all_alerts = all_alerts.concat(alerts);
							count--;
							if (count == 0) {
								callback(null, all_alerts);
								logger.info("receive %s alerts from Solman", all_alerts.length);
							}
					});
				})();
			}

		});
	}
}

module.exports = SolmanClient;
