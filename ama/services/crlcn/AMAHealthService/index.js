var logger = getLogger("HealthCheck");
var underscore = require("underscore");
var cron = require("cron");
var CronJob = cron.CronJob;

var config = require("../../../../config/healthchecker.json");


var getDeploymentMode = function() {
//	return "CLOUD";
	if (process.env.VCAP_SERVICES) {
		return "CLOUD";
	} else {
		return "ON_PREM";
	}
}

var checkers = [];

exports.healthCheckStart = function() {
	var mode = getDeploymentMode();
	logger.info("Health Check Started %s MODE", mode);

	var checker_categories = config[mode]["checker_categories"];

	underscore.each(checker_categories, function(checker_category) {
		var checker_points = checker_category["check_points"];
		underscore.each(checker_points, function(check_point) {
			var checker_name = check_point.checker;
			var healthchecker = require("./" + checker_name + ".js");
			if (healthchecker) {
				if (check_point.enable) {
					logger.info("Load Health Checker :  %s", checker_name);
					check_point["deployment_mode"] = mode;

					var checker = new healthchecker();
					checker.initialize(check_point);
					checkers.push(checker);
				}

			} else {
				logger.fatal("Checker is not exist ： %s", checker);
			}
		});
	})



	var cron_time = config.checkSchedulerCron;
	logger.info("Using cron time: %s", cron_time);
	var scheduledJob = new CronJob(cron_time, function() {
			underscore.each(checkers, function(checker) {
				checker.checkHealth();
			});
		}, function() {
			logger.fatal("scheduledJob has been stopped");
		},
		true
	);
}

exports.healthCheckStart();

exports.getLastestHealthStatus = function(req, res) {
	var reports = {};
	underscore.each(checkers, function(checker) {
		reports[checker.getName()] = checker.getStatus();
	});
	res.json(reports);
}

exports.queryLastestHealthStatus = function(req, res) {
	var reports = {};
	var accounts = req.body;
	underscore.each(checkers, function(checker) {
		var status = checker.getStatus(accounts);
		if (status)
			reports[checker.getName()] = status;
	});
	res.json(reports);
}