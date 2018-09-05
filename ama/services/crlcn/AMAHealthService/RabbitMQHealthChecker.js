var util = require("util");
var amqp = require('amqp');
var underscore = require("underscore");
var async = require("async");
var CronJob = require('cron').CronJob;


var BaseHealthChecker = require("./BaseHealthChecker.js");
var logger = getLogger("HealthCheck");


var config = require("../../../../config/mq_config.json");
var health_config = require("../../../../config/healthchecker.json");

var checkSchedulerCron = health_config.checkSchedulerCron;


var rabbitmq_configs = [];
var rabbitmq_connections = {};
var rabbitmq_status = {};

var HEALTH_CHECK_TOPIC = "health_check_topic";


var RabbitMQHealthChecker = function() {
	var self = this;

	this.error_messages = [];

	this.health_checker_name = "RabbitMQHealthChecker";

	if (this.deployment_mode == "CLOUD" || process.env.VCAP_SERVICES) {
		var env = JSON.parse(process.env.VCAP_SERVICES);
		if (env["cloudamqp"] && env["cloudamqp"].length > 0) {
			rabbitmq_configs = env["cloudamqp"];
		}
	} else {
		rabbitmq_configs = config["cloudamqp"];
	}


	this.checkConnectivity = function(callback) {

		self.error_messages = [];

		var all_connected = true;

		async.each(rabbitmq_configs, function(rabbitmq_config, _callback) {
			var credentials = rabbitmq_config.credentials;

			var rabbitmq_connection = rabbitmq_connections[rabbitmq_config.name];
			if (rabbitmq_connection) {
				rabbitmq_status[rabbitmq_config.name] = false;
				rabbitmq_connection.publish(HEALTH_CHECK_TOPIC + rabbitmq_config.name, "true", {
					contentType: "String"
				}, null);
				return _callback(null);
			} else {
				rabbitmq_connection = amqp.createConnection({
					url: credentials.uri
				});
				logger.info(credentials.uri);
				rabbitmq_connection.once('ready', function() {
					rabbitmq_connection.queue(HEALTH_CHECK_TOPIC + rabbitmq_config.name, function(q) {
						q.bind('#');
						q.subscribe(function() {
							rabbitmq_status[rabbitmq_config.name] = true;
						});
						rabbitmq_status[rabbitmq_config.name] = false;
						rabbitmq_connection.publish(HEALTH_CHECK_TOPIC + rabbitmq_config.name, "true", {
							contentType: "String"
						}, null);
						return _callback(null);
					});
					rabbitmq_connections[rabbitmq_config.name] = rabbitmq_connection;

				});

				rabbitmq_connection.once('error', function(error) {
					logger.info("connect to rabbitmq %s error", rabbitmq_config.name);
					rabbitmq_status[rabbitmq_config.name] = false;
					rabbitmq_connections[rabbitmq_config.name] = null;
					self.error_messages.push(util.format("Rabbit MQ %s failed to connected. ", credentials.uri));
					return _callback(null);
				});

			}

		}, function(err) {
			if (err) {
				return callback(false);
			}
			setTimeout(function() {
				underscore.mapObject(rabbitmq_status, function(value, key) {
					if (!value) all_connected = false;
				});
				return callback(all_connected);
			}, 1000);
		});
	}

	return this;
}


util.inherits(RabbitMQHealthChecker, BaseHealthChecker);


module.exports = RabbitMQHealthChecker;