var amqp = require('amqp');
var rf = require("fs");
var logger = getLogger("RabbitMQClient");
var http = require("http");
var SOPConfig = require("../../../config/SOPConfig.json");

var CronJob = require('cron').CronJob;

/**
 * Module dependencies.
 */

var subscribe = function(clientName, clientRabbitMQURL, accountName, topic,
		callback) {

	var queque_name = null;

	if (accountName == null) {
		queque_name = topic;
	} else {
		queque_name = accountName + '-' + topic;
	}

	var rabitmq_connnection = null;

	if (global.suscribedClients != null
			&& global.suscribedClients[clientName] != null) {
		// get the cached connection (avoid over-duplicated connections)
		rabitmq_connnection = global.suscribedClients[clientName];

		rabitmq_connnection.queue(queque_name, function(q) {
			// Catch all messages
			q.bind('#');

			// Receive messages
			q.subscribe(callback);
		});
	} else {
		if (clientRabbitMQURL == null) {
			// load the url from the config?
			clientRabbitMQURL = getClientRabbitMQURL(clientName);
			if (clientRabbitMQURL == null) {
				logger.error("the rabbit mq url of the client is not found: "+ clientName);
				return;
			}
		}
		// setup the connection for the message publishing
		rabitmq_connnection = amqp.createConnection({
			url : clientRabbitMQURL
		});

		// Wait for connection to become established.
		rabitmq_connnection.on('ready', function() {
			rabitmq_connnection.queue(queque_name, function(q) {
				// Catch all messages
				q.bind('#');

				// Receive messages
				q.subscribe(callback);
			});

			// add the connection into the cache
			if (global.suscribedClients == null) {
				global.suscribedClients = {};
			}
			global.suscribedClients[clientName] = rabitmq_connnection;
		});

	}

}

var getAccountListByClient = function(clientName, topic, subscribedCallBack,
		callback) {
	var path = "/rest/v1/sopmeta/GetAccountForClient?clientName=" + clientName;
	var option = {
		method : "GET",
		port : global.global_server_port,
		hostname : global.global_server_host,
		// port : "3000",
		// hostname : "localhost",
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
				if (res.statusCode != 200 && res.statusCode != 201) {
					return callback(new Error(data));
				}
				var result = JSON.parse(data);
				if (result.length == 0) {
					return callback(new Error(
							"cannot find account info of the client :"
									+ clientName));
				}
				logger.info(JSON.stringify(result));
				callback(null, clientName, topic, subscribedCallBack, result);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.error("error message: " + e.message);
		callback(e);
	});
	req.end();
}

var subscribeAccountMessages = function(err, clientName, topic, callback,
		accounts) {
	if (err != null || accounts == null || accounts.response == null
			|| accounts.response.length == 0) {
		logger.info("the client " + clientName + " with no accounts registered.");
	} else {
		for (var l = 0; l < accounts.response.length; l++) {

			var account_name = accounts.response[l].accountName;

			logger.info("RabbitMQ to subscribe:" + clientName + "-"
					+ account_name + "-" + topic);
			subscribe(clientName, null, account_name, topic, callback);
		}
	}
}

var initiateRabbitConfig = function() {
	var credentials = null;
	if (process.env.VCAP_SERVICES) {
		var services = JSON.parse(process.env.VCAP_SERVICES);
		if (services['cloudamqp']) {
			global.rabbitmq_config = services["cloudamqp"];
		}
	}

	if (global.rabbitmq_config == null) {
		var rabbitmq_config = JSON.parse(rf.readFileSync(
				"./config/mq_config.json", "utf-8"));
		if (rabbitmq_config["cloudamqp"]) {
			logger.info(rabbitmq_config);
			global.rabbitmq_config = rabbitmq_config["cloudamqp"];
		}
	}
}

var getClientRabbitMQURL = function(clientName) {
	var length = global.rabbitmq_config.length;
	for (var i = 0; i < length; i++) {
		if (global.rabbitmq_config[i].name == clientName) {
			return global.rabbitmq_config[i].credentials.uri;
		}
	}
	return null;
}

var rabbitMQClient = function() {

	var self = this;

	this.publish = function(clientName, accountName, topic, message) {

		var rabitmq_connnection = null;
		var queque_name = null;

		if (accountName == null) {
			queque_name = topic;
		} else {
			queque_name = accountName + '-' + topic;
		}


		// get an existing connection based on clientName
		if (global.suscribedClients != null
				&& global.suscribedClients[clientName] != null) {
			rabitmq_connnection = global.suscribedClients[clientName];
			rabitmq_connnection.publish(queque_name, message, {
				contentType : "String"
			}, null);
		} else {
			// create a new connection based on clientName
			// read credentials from latest file (may updated any time)
			logger.info("the client name is %s", clientName);
			var client_connection_url = getClientRabbitMQURL(clientName);
			if (client_connection_url == null) {
				logger.error("the client connection url %s is not found. pls make sure the url is added", client_connection_url);
				return;
			}
			// setup the connection for the message publishing
			rabitmq_connnection = amqp.createConnection({
				url : client_connection_url
			});

			// Wait for connection to become established.
			rabitmq_connnection.on('ready', function() {
				// rabitmq_connnection.publish(queque_name, message, {
				// contentType : "String"
				// }, function() {
				// rabitmq_connnection.disconnect();
				// });
				rabitmq_connnection.publish(queque_name, message, {
					contentType : "String"
				}, null);
			});
		}
	}

	this.subscribeAll = function(topic, callback) {
		// use the environment context or config file to initiate the rabbitmq
		// credentials
		initiateRabbitConfig();

		// check the new clients without queue subscriptions
		var length = global.rabbitmq_config.length;
		for (var i = 0; i < length; i++) {
			var rabitmq_connnection = null;
			if (global.suscribedClients == null
					|| global.suscribedClients[global.rabbitmq_config[i].name] == null) {
				// this is a new client, we need to subscribe its queues here
				var clientName = global.rabbitmq_config[i].name;
				if (clientName == null) {
					logger
							.error("the client is undefined:" + JSON.stringify(global.rabbitmq_config[i]));
					continue;
				}
				var client_connection_url = global.rabbitmq_config[i].credentials.uri;
				if (client_connection_url == null) {
					logger
							.error("the client connection url is not found. pls make sure the url is added");
					continue;
				}
				
				subscribe(clientName, client_connection_url, null, topic,
						callback);

				var currentObj = this;
				// to subscribe the topic queues for each account
				getAccountListByClient(clientName, topic, callback,
						subscribeAccountMessages);
			}
		}
	}

	return this;
}

module.exports = rabbitMQClient;
