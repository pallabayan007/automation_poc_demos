/*
 * IPSoft Automata APIs Client
 */

var https = require("https");
var http = require("http");
var URL = require("url");
var async = require("async");
var fs = require('fs');

var config = require("../../../../../config");
var adpaters_config_info = require("../../../../../config/automation_adapter_config.json");

var logger = getLogger("IPSoftAutomataClient");

var IOD_Execution_Mapping = {};

var IPSoftAutomataClient = function() {

	// constructor
	var ci_test_baseUrl = config.ci_test_base;
	var baseUrl = null;
	var category_uri = null;
	var execute_uri = null;
	var status_uri = null;
	var client_id = null;
	//	var username = config.ipsoft_user;
	//	var password = config.ipsoft_pass;

	var self = this;

	var make_base_auth = function(user, password) {
		var tok = user + ':' + password;
		var hash = new Buffer((tok)).toString('base64');
		return "Basic " + hash;
	}

	this.auth_header = null;

	this.getAutomata = function(client_id, automata_id, callback) {
		var url = baseUrl + "";
	}

	this.getCategory = function(client_id, callback) {
		var url = baseUrl + category_uri + "/" + encodeURIComponent(client_id) + "?recursively=true";
		logger.info("getCategory: " + url);

		var urlObj = URL.parse(url);
		var option = {
			method: "GET",
			port: urlObj.port,
			hostname: urlObj.hostname,
			path: urlObj.path,
			headers: {
				"Authorization": this.auth_header
			},
			rejectUnauthorized: false
		}
		var req = https.request(option, function(res) {
			var data = '';
			res.on("data", function(chunk) {
				data += chunk;
			});
			res.on("end", function() {
				if (res.statusCode != 200) {
					return callback(new Error(data));
				}
				logger.debug("get data" + JSON.stringify(data));
				callback(null, JSON.parse(data));
			});

			res.on("error", function(e) {
				logger.info("error message on response: " + e.message);
				callback(e);
			});

		});
		req.on("error", function(e) {
			logger.info("error message on request: " + e.message);
			callback(e);
		});
		req.end();
	}

	this.getAutomatons = function(client_id, callback) {
		var automatons = [];
		self
			.getCategory(
				client_id,
				function(err, categories) {
					if (err) {
						return callback(err);
					}
					for (var i = 0; i < categories.length; i++) {
						var category_1 = categories[i].name;
						if (categories[i].children && categories[i].children.length) {
							var sub_categories = categories[i].children;
							for (var j = 0; j < sub_categories.length; j++) {
								var category_2 = sub_categories[j].name;
								if (sub_categories[j].children && sub_categories[j].children.length) {
//									var sub_sub_categories = sub_categories[j].children;
//									for (var k = 0; k < sub_sub_categories.length; k++) {
//										var category_3 = sub_sub_categories[k].name;
//										if (sub_sub_categories[k].children && sub_sub_categories[k].children.length) {
											var items = sub_categories[j].children;
											for (var l = 0; l < items.length; l++) {
												var item = items[l];
												var item_name = item.name;
												if (item.automatons && item.automatons.length > 0) {
													for (var m = 0; m < item.automatons.length; m++) {
														var automaton = {
																category_1: category_1,
																category_2: category_2,
//																category_3: category_3,
																item_name: item_name,
																automaton_id: item.automatons[m].automatonID,
																automaton_name: item.automatons[m].name,
																variables: item.automatons[m].variables
														}
														automatons
														.push(automaton);
													}
												}
											}
//										}
//									}
								}
							}
						}
					}
					callback(null, automatons);
				});
	}

	this.getAutomatonbyID = function(client_id, automaton_id, callback) {
		self.getAutomatons(client_id, function(err, automatons) {
			if (err) {
				return callback(err);
			}
			for (var i = 0; i < automatons.length; i++) {
				var automaton = automatons[i];
				if (automaton_id == automaton.automaton_id) {
					callback(null, automaton);
					return;
				}
			}
			callback(null, null);
		});
	}

	this.executeAutomatonbyID = function(client_id, automaton_id, inputParameters, callback) {

		self
			.getAutomatonbyID(
				client_id,
				automaton_id,
				function(err, automaton) {
					if (err) {
						return callback(err);
					}

					if (!automaton) {
						logger.error("Automaton " + automaton_id + " cannot found in IPSoft");
						return callback(new Error("Automaton " + automaton_id + " cannot found in IPSoft"));
					}

					var url = baseUrl + execute_uri + "/" + encodeURIComponent(client_id) + "/" + encodeURIComponent(automaton.category_1) + "/" + encodeURIComponent(automaton.category_2) + "/" + encodeURIComponent(automaton.item_name) + "/" + encodeURIComponent(automaton.automaton_name);

					//HARDCODE: automaton param
					logger.info("inputParameters: ");
					for (var key in inputParameters) {
						logger.info(key + ":" + inputParameters[key]);
						if (key != "WorkflowAutomationID" || key != "WorkflowAutomationUserId" || key != "WorkflowAutomationPassword") {
							url += ";" + key + "=" + encodeURIComponent(inputParameters[key]);
						}
					}
//					url += ";command_to_execute=isconfig;cmd=pwd";


			// use default
			// var strs = [];
			// for (var i = 0; i < automaton.variables.length; i++) {
			// 	var variable = automaton.variables[i];
			// 	var str = variable.name + "=" + ((variable.name == "to_email") ? "dangyb@cn.ibm.com" : variable.defaultValue);
			// 	strs.push(str);
			// }
			// url += ";" + strs.join(";");

					logger.info("IPSoft execution url : %s ", url);
					var urlObj = URL.parse(url);
					var option = {
						method: "POST",
						port: urlObj.port,
						hostname: urlObj.hostname,
						path: urlObj.path,
						headers: {
							"Authorization": self.auth_header
						},
						rejectUnauthorized: false
					}
					var req = https.request(option, function(res) {
						var data = '';
						res.on("data", function(chunk) {
							data += chunk;
						});
						res.on("end", function() {

							if (res.statusCode != 200) {
								return callback(new Error(data));
							}

							logger.debug("get data" + JSON.stringify(data));
							var result = JSON.parse(data);
							var execution = {
								execution_id: result.executionID,
								name: automaton.automaton_name,
								status: result.status
							}
							callback(null, execution);
						});

						res.on("error", function(e) {
							logger.info("error message: " + e.message);
							callback(e);
						});

					});
					req.on("error", function(e) {
						logger.info("error message: " + e.message);
						callback(e);
					});
					req.end();

				});
	}

	this.getExecutionStatus = function(execution_id, callback) {
		var url = baseUrl + status_uri + "/" + execution_id + "/status";

		var urlObj = URL.parse(url);
		var option = {
			method: "GET",
			port: urlObj.port,
			hostname: urlObj.hostname,
			path: urlObj.path,
			headers: {
				"Authorization": self.auth_header
			},

			rejectUnauthorized: false
		}
		var req = https.request(option, function(res) {
			var data = '';
			res.on("data", function(chunk) {
				data += chunk;
			});
			res.on("end", function() {
				if (res.statusCode != 200) {
					return callback(new Error(data));
				}
				callback(null, data);
			});

			res.on("error", function(e) {
				logger.info("error message: " + e.message);
				callback(e);
			});

		});
		req.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});
		req.end();
	}

	this.executeQueue = async.queue(function(IOD, callback) {
		logger.info("[%s] start to execute", IOD.WorkflowAutomationID);
		self._executeWithRetry(IOD, callback);
	}, 1);

	this.execute = function(IOD, callback) {

		IOD.connectionId = "1";
		// based on IOD.connectionId, to get the client_id, and connection
		// properties to initiate the connection info
		// retrieve required info from IOD and related config file
		var right_ipsoft_adpater_connection = null;
		var ipsoft_adapter_connections = adpaters_config_info.adapters.IPSoftAdapter.connections;
		for (var i = 0; i < ipsoft_adapter_connections.length; i++) {
			if (ipsoft_adapter_connections[i].connection.connectionId == IOD.connectionId) {
				right_ipsoft_adpater_connection = ipsoft_adapter_connections[i].connection;
			}
		}

		baseUrl = right_ipsoft_adpater_connection.connectionProperties.protocol + "://" + right_ipsoft_adpater_connection.connectionProperties.host;
		if (right_ipsoft_adpater_connection.connectionProperties.port) {
			baseUrl = baseUrl + ":" + right_ipsoft_adpater_connection.connectionProperties.port;
		}
		category_uri = right_ipsoft_adpater_connection.connectionProperties.category_uri;
		execute_uri = right_ipsoft_adpater_connection.connectionProperties.execute_uri;
		status_uri = right_ipsoft_adpater_connection.connectionProperties.status_uri;
		client_id = right_ipsoft_adpater_connection.connectionProperties.ipsoft_client_id;
		var username = right_ipsoft_adpater_connection.connectionProperties.authetication.userId;
		var password = right_ipsoft_adpater_connection.connectionProperties.authetication.password;
		self.auth_header = make_base_auth(username, password);

		self.executeQueue.push(IOD, callback);
	}

	this._executeWithRetry = function(IOD, callback) {
		this._execute(IOD, function(err, result) {
			if (err && err.message == "Too Many Requests") {
				(function() {
					logger.info("[%s]Get %s, and retry after 100ms",
						IOD.WorkflowAutomationID, err.message);
					setTimeout(function() {
						self._executeWithRetry(IOD, callback);
					}, 100);
				})();
				return;
			} else if (err && err.message == "getaddrinfo ENOTFOUND") {
				err = new Error("Management system not working");
			} else if (err && err.message == "connect ETIMEDOUT") {
				err = new Error("Management system not working");
			}
			callback(err, result);
		});
	}

	this._execute = function(IOD, callback) {

		var automaton_id = IOD.WorkflowAutomationID;
		IOD.inputParameters = {"automationParam":{}};
		if (IOD.AutomationInput) {
			for (var i = 0; i < IOD.AutomationInput.length; i++) {
				var input = IOD.AutomationInput[i];
				try {
					input = JSON.parse(input);
					for (var key in input) {
						IOD.inputParameters[key] = input[key];
					}
				} catch (e) {
					IOD.inputParameters = input;
				}
			}
		}

		// to change

//		var client_id = config.ipsoft_client_id;


		self.executeAutomatonbyID(client_id, automaton_id, IOD.inputParameters.automationParam, function(err,
			execution) {
			if (err) {
				return callback(err);
			}
			var execution_id = execution.execution_id;
			IOD_Execution_Mapping[IOD.id] = execution_id;
			callback(null, execution);
		});
	}

	this.getStatus = function(IOD, callback) {
		var execution_id = IOD_Execution_Mapping[IOD.id];
		self.getExecutionStatus(execution_id, function(err, result) {
			callback(err, result);
		});
	}

	this.test = function(id, callback) {
		var execution_id = id;
		// var url = ci_test_baseUrl + "/v1/public/yq";
		var url = ci_test_baseUrl + "/IPautomata/v1/id/" + execution_id + "/status";

		var urlObj = URL.parse(url);
		var option = {
			method: "GET",
			port: urlObj.port,
			hostname: urlObj.hostname,
			path: urlObj.path,
			headers: {
				"Authorization": self.auth_header
			},
			// key: fs.readFileSync('../../../../../config'),
			// cert:
			// fs.readFileSync('../../../../../config/108.168.255.111_80-basic-server-cert.pem'),
			// ca:
			// [fs.readFileSync('./108.168.255.111_80-basic-server-cert.pem'),
			// fs.readFileSync('./DigiCertCA2.pem'),
			// fs.readFileSync('./DigiCertTrustedRoot.pem')],
			// cert:
			// fs.readFileSync('C:/Users/IBM_ADMIN/git/swarnasetu/config/108.168.255.111_80-basic-server-cert.pem'),
			ca: [
				fs
				.readFileSync('C:/Users/IBM_ADMIN/git/swarnasetu/config/108.168.255.111_80-basic-server-cert.pem'),
				fs
				.readFileSync('C:/Users/IBM_ADMIN/git/swarnasetu/config/DigiCertCA2.pem'),
				fs
				.readFileSync('C:/Users/IBM_ADMIN/git/swarnasetu/config/DigiCertTrustedRoot.pem')
			],
			checkServerIdentity: function(host, cert) {
				return true;
			},

			rejectUnauthorized: true
		}
		option.agent = new https.Agent(option);
		var req = https.request(option, function(res) {
			var data = '';
			res.on("data", function(chunk) {
				data += chunk;
			});
			res.on("end", function() {
				logger.info("status message: " + res.statusCode);
				if (res.statusCode != 200) {
					return callback(res.statusCode, data);
				}
				callback(null, data);
			});

			res.on("error", function(e) {
				logger.info("error message: " + e.message);
				callback(e);
			});

		});
		req.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});
		req.end();
	}

}

var ParameterValueEncode = function(value){
	var result = value;
	if (value && (Object.prototype.toString.call(value) === "[object String]") && (value.indexOf("/") != -1)) {
		result = value.replace(new RegExp("/","g"),"%2F");
	}
	return result;
}

module.exports = IPSoftAutomataClient;

/*
 * var client = new IPSoftAutomataClient(); client.executeAutomatonbyID("tc1",
 * "7691", function(err, execution){ console.log(execution); var execution_id =
 * execution.execution_id; console.log(execution_id);
 * console.log(execution.status); client.getExecutionStatus(execution_id,
 * function(err, result){ console.log(result); }); });
 */
 