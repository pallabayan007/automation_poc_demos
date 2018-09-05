var util = require("util");
var async = require('async');
var url = require("url");
var request = require("request");

var BaseHealthChecker = require("./BaseHealthChecker.js");
var logger = getLogger("HealthCheck");

var config = require('../../../../config/automation_adapter_config.json');



var IPSoftHealthChecker = function() {
	var self = this;

	this.error_messages =[];

	this.health_checker_name = "IPSoftHealthChecker";

	this.checkConnectivity = function(callback) {
		
//		return callback(true);
		self.error_messages =[];
		var connections = config["adapters"]["IPSoftAPIEconomyAdapter"]["connections"];
		var connected = true;
		var status = [];

		async.each(connections, function(connection, _callback) {
			var protocol = connection["connection"]["connectionProperties"]["protocol"];
			var host = connection["connection"]["connectionProperties"]["host"];
			var port = connection["connection"]["connectionProperties"]["port"];
			var timeout = connection["connection"]["connectionProperties"]["timeout"];
			var client = connection["connection"]["connectionProperties"]["client"];
			var account = connection["connection"]["connectionProperties"]["account"];
			if(!protocol){
				protocol = "http";
			}
			if(!timeout){
				timeout = 100000;
			}
			else {
				timeout = parseInt(timeout);
			}
			if(!port){
				port = protocol == "http" ? 80 : 443;
			}

			var test = protocol + "://" + host + ":" + port;
//			request.head(test, {
//				timeout: timeout
//			}, function(err, resppnse, body) {
//				if (err) {
//					logger.error("ping IPSoft %s got error : %s", test, err.toString());
//					self.error_messages.push(util.format("ping IPSoft %s timeout", test)); 
//					connected = false;
//				} else {
//					logger.debug("ping to IPSoft %s success", test);
//				}
//				return _callback(null);
//			});
			status.push({
				connected: true,
				client: client,
				account: account,
				uri: test,
				error_message: ""
			});
			return _callback(null);
		}, function(err) {
			return callback(connected, status);
		});
	}

	return this;
}


util.inherits(IPSoftHealthChecker, BaseHealthChecker);


module.exports = IPSoftHealthChecker;