var util = require("util");
var mongoose = require("mongoose");


var BaseHealthChecker = require("./BaseHealthChecker.js");
var logger = getLogger("HealthCheck");

var appProperty = require('../../../../config/app_config.json');



var MongoDBHealthChecker = function() {
	var self = this;

	this.error_messages =[];

	this.health_checker_name = "MongoDBHealthChecker";

	this.checkConnectivity = function(callback) {

		self.error_messages =[];

		var conn = null;
		var db;
		try {
//			if (process.env.VCAP_SERVICES) {
//				var env = JSON.parse(process.env.VCAP_SERVICES);
//				if (env["mongolab"] && env["mongolab"][0] && env["mongolab"][0].credentials) {
//					db = mongoose.createConnection(env['mongolab'][0].credentials.uri);
//					db.once("error", function(error) {
//						return callback(false);
//					});
//				}
//			}
			if (this.deployment_mode == "CLOUD") {
				mongodb_uri = appProperty['deployment-specific-properties']['CLOUD']['credentials'].uri;
				db = mongoose.createConnection(mongodb_uri);
				db.once("error", function(error) {
					self.error_messages.push(util.format("MongoDB %s failed to connected. ", mongodb_uri));
					db.close();
					return callback(false);
				});
			} else if (this.deployment_mode == "ON_PREM") {
				mongodb_uri = appProperty['deployment-specific-properties']['ON_PREM'].dbConnectionURL;
				db = mongoose.createConnection(mongodb_uri);
				db.once("error", function(error) {
					self.error_messages.push(util.format("MongoDB %s failed to connected. ", mongodb_uri));
					db.close();
					return callback(false);
				});
			} else {
				self.error_messages.push(util.format("Deployment %s is not supported. ", this.deployment_mode));
				return callback(false);
			}
			if (db) {
				db.close();
				return callback(true);
			} else {
				self.error_messages.push("MongoDB failed to connected. ");
				return callback(false);
			}
		} catch (e) {
			logger.info(e.stack);
			if (db) db.close();
			return callback(false);
		}

	}

	return this;
}


util.inherits(MongoDBHealthChecker, BaseHealthChecker);


module.exports = MongoDBHealthChecker;