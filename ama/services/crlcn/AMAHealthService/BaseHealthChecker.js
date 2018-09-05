

var logger = getLogger("HealthCheck");
var underscore = require("underscore");



var DISPLAY_STATUS_MAPPING = {
	null : "Not available",
	0	: "Good",
	1   : "Bad"
}

var DISPLAY_COR_STATUS_MAPPING = {
	null : "grey",
	0	: "green",
	1   : "red"
}



var HealthChecker = function(properties) {

	this.health_checker_name = "BaseHealthChecker";

	this.error_messages = [];

	this.checkConnectivity = function(callback){
		return callback(true);
	}

	return this;
};

HealthChecker.prototype.health_status = null;
HealthChecker.prototype.tooltip_description = "";
HealthChecker.prototype.deployment_mode = "ON_PREM";
HealthChecker.prototype.display_name = "";
HealthChecker.prototype.properties = null;




HealthChecker.prototype.initialize = function(properties){
	if(properties){
		this.tooltip_description = properties.tooltip_description|| "";
		this.deployment_mode = properties.deployment_mode || "";
		this.display_name = properties.display_name || "";
		this.properties = properties;
	}
}

HealthChecker.prototype.checkHealth = function(){
	logger.debug("Check Health : %s", this.health_checker_name);
	var self = this;
	this.checkConnectivity(function(flag){
		if(flag){
			logger.info("%s Status : Green", self.health_checker_name);
			self.health_status = 0;
		}
		else {
			logger.info("%s Status : Red", self.health_checker_name);
			self.health_status = 1;
		}
	});
}

HealthChecker.prototype.getName = function(){
	return this.health_checker_name;
}


HealthChecker.prototype.getStatus = function(){
	return {
		status_code : this.health_status,
		status: DISPLAY_STATUS_MAPPING[this.health_status],
		status_color: DISPLAY_COR_STATUS_MAPPING[this.health_status],
		tooltip_description : this.tooltip_description,
		deployment_mode : this.deployment_mode,
		display_name : this.display_name,
		error_messages : this.error_messages
	};
}


module.exports = HealthChecker;