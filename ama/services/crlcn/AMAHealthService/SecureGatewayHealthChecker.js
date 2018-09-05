var SecureGateway = require("bluemix-secure-gateway");
var util = require("util");
var underscore = require("underscore");
var async = require("async");


var BaseHealthChecker = require("./BaseHealthChecker.js");
var logger = getLogger("HealthCheck");


var SecureGatewayHealthChecker = function() {
	var self = this;
	this.error_messages = [];

	this.health_checker_name = "SecureGatewayHealthChecker";

	this.checkConnectivity = function(callback) {
		self.error_messages = [];

		if (this.deployment_mode == "ON_PREM") {
			self.error_messages.push("No Secure Gateway in Env");
			return callback(false);
		}

		if (!process.env.VCAP_SERVICES) {
			self.error_messages.push("No Secure Gateway in Env");
			return callback(false);
		}

		var env = JSON.parse(process.env.VCAP_SERVICES);
		if (env["SecureGateway"]) {
			var all_connected = true;
			var list = env["SecureGateway"];
			async.each(list, function(serviceObj, _callback) {
				var credentials = serviceObj.credentials;
				var org_id = credentials["org_id"];
				var space_id = credentials["space_id"];
				var secure_gateway = new SecureGateway.defaults({
					'username': self.properties.username,
					'password': self.properties.password,
					'orgID': org_id,
					'spaceID': space_id
				});

				secure_gateway.listGateways({type: "enabled"}, function(error, list) {
					if (error) {
						logger.error(error);
						self.error_messages.push("Secure Gateway failed to connected.");
						return _callback(error);
					}
					underscore.each(list, function(gateway) {
						// console.log("gateway : %s\t%s\t%s", gateway.desc, gateway.status, gateway.connected);
						if (!gateway.connected) {
							all_connected = false;
							self.error_messages.push(util.format("Secure Gateway %s failed to connected. ", gateway.desc));
						}
					});

					return _callback(null);
				});

			}, function(err) {
				if (err) {
					logger.info(err.stack);
					self.error_messages.push("Secure Gateway failed to connected.");
					return callback(false);
				}
				return callback(all_connected);
			});
		} else {
			self.error_messages.push("No Secure Gateway in Env");
			return callback(false);
		}
	}

	return this;
}


util.inherits(SecureGatewayHealthChecker, BaseHealthChecker);


module.exports = SecureGatewayHealthChecker;