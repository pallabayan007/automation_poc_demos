/**
 * New node file
 */
var http = require("http");
var https = require("https");
var config = require("../../../../../config");
var URL = require("url");

var request = require("request");
var logger = getLogger("iPASSClient");

var getRequest = function(url, headers, callback) {
	logger.info(url);
	request.get({
		url : url,
		headers : headers,
		json : true
	}, function(error, response, body){
		return callback(error, body);
	});
}


var postRequest = function(url, headers, body, callback) {
	logger.info(url);
	request.post({
		url : url,
		headers : headers,
		json : true,
		body : JSON.parse(body)
	}, function(error, response, result){
		return callback(error, result);
	});
}


var iPASSClient = function() {
	var self = this;

	var user_id = this.user_id = user_id;
	var thread_id = this.thread_id = thread_id;
	var receiver_id = this.receiver_id = receiver_id;
	var service_id = this.service_id = service_id;
	var message_account_id = this.message_account_id = message_account_id;

	this.account_name = "Workflow";

	var _makeCustomizedAuth = function(username, password) {
		var tok = username + ':' + password;
		var hash = new Buffer(tok).toString('base64');
		return "Basic " + hash;
	}
	
	this.startSpecificConversation = function(adpater_connection, dialog_id, context_items, callback) {

		var start_time = new Date().getTime();
		logger.info("[%s] start conversation (dialog_id : %s, context_items: %s)", user_id, dialog_id, JSON.stringify(context_items));

		var connectionProperties = adpater_connection.connectionProperties;
		if (!connectionProperties.port) {
			if (connectionProperties.protocol.toLowerCase() == "http") {
				connectionProperties.port = "80";
			} else if (connectionProperties.protocol.toLowerCase() == "https") {
				connectionProperties.port = "443";
			} else {
				connectionProperties.port = "";
			}
		}
		
		var authHeader = _makeCustomizedAuth(connectionProperties.authetication.userId, connectionProperties.authetication.password);
		var headers = {
			"Content-Type": "application/json",
			"Authorization": authHeader 
		}; 
		
		var option = {
			method : "POST",
			port : connectionProperties.port,
			hostname : connectionProperties.host,
			path : connectionProperties.basePath + "/rest/conversations/start",
			headers : {
				"Content-Type" : "application/json",
				"Authorization" : authHeader,
			}
		}
		var req = null;
		if (connectionProperties.protocol.toLowerCase() == "http") {
			req = http.request(option, function(res) {
				var data = '';
				res.on("data", function(chunk) {
					data += chunk;
				});
				res.on("end", function() {
					try {
						if (res.statusCode != 200 && res.statusCode != 201) {
							logger.info(res.statusCode + ": " + data);
							return callback(new Error(data));
						}
						var end_time = new Date().getTime();
						logger.info("[%s] start conversation takes %s milliseconds", user_id, (end_time - start_time));
						callback(null, data);
					} catch (e) {
						callback(e);
					}
				});
			});
		} else if (connectionProperties.protocol.toLowerCase() == "https") {
			req = https.request(option, function(res) {
				var data = '';
				res.on("data", function(chunk) {
					data += chunk;
				});
				res.on("end", function() {
					try {
						if (res.statusCode != 200 && res.statusCode != 201) {
							logger.info(res.statusCode + ": " + data);
							return callback(new Error(data));
						}
						var end_time = new Date().getTime();
						logger.info("[%s] start conversation takes %s milliseconds", user_id, (end_time - start_time));
						callback(null, data);
					} catch (e) {
						callback(e);
					}
				});
			});
		}
		req.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});

		req.write(JSON.stringify({
			dialog_id: parseInt(dialog_id),
			context_items : context_items
		}));
		req.end();
	}
	
	this.resumeConversation = function(conversation_id, callback) {
		logger.info("[%s] resume conversation %s", user_id, conversation_id);
		postRequest(config.dm_api + "conversations/" + conversation_id + "/resume", self.headers, JSON.stringify({}), function(err, conversation) {
			callback(err, conversation);
		});
	}

	this.nextConversation = function(next_node_uri, action_index, context_items, adpater_connection, callback) {
		var start_time = new Date().getTime();
		logger.info("[%s] next conversation (index: %s)", user_id, action_index);

		var connectionProperties = adpater_connection.connectionProperties;
		if (!connectionProperties.port) {
			if (connectionProperties.protocol.toLowerCase() == "http") {
				connectionProperties.port = "80";
			} else if (connectionProperties.protocol.toLowerCase() == "https") {
				connectionProperties.port = "443";
			} else {
				connectionProperties.port = "";
			}
		}

		var authHeader = _makeCustomizedAuth(connectionProperties.authetication.userId, connectionProperties.authetication.password);
		var headers = {
			"Content-Type": "application/json",
			"Authorization": authHeader 
		}; 
		
		var option = {
			method : "POST",
			port : connectionProperties.port,
			hostname : connectionProperties.host,
			path : connectionProperties.basePath + "/rest/conversations/" + next_node_uri.split("/rest/conversations/")[1],
			headers : {
				"Content-Type" : "application/json",
				"Authorization" : authHeader,
			}
		}
		logger.info(JSON.stringify(option));
		var req = null;
		if (connectionProperties.protocol.toLowerCase() == "http") {
			req = http.request(option, function(res) {
				var data = '';
				res.on("data", function(chunk) {
					data += chunk;
				});
				res.on("end", function() {
					try {
						if (res.statusCode != 200 && res.statusCode != 201) {
							logger.info(res.statusCode + ": " + data);
							return callback(new Error(data));
						}
						var end_time = new Date().getTime();
						logger.info("[%s] next conversation takes %s milliseconds", user_id, (end_time - start_time));
						logger.info(data);
						callback(null, data);
					} catch (e) {
						callback(e);
					}
				});
			});
		} else if (connectionProperties.protocol.toLowerCase() == "https") {
			req = https.request(option, function(res) {
				var data = '';
				res.on("data", function(chunk) {
					data += chunk;
				});
				res.on("end", function() {
					try {
						if (res.statusCode != 200 && res.statusCode != 201) {
							logger.info(res.statusCode + ": " + data);
							return callback(new Error(data));
						}
						var end_time = new Date().getTime();
						logger.info("[%s] next conversation takes %s milliseconds", user_id, (end_time - start_time));
						logger.info(data);
						callback(null, data);
					} catch (e) {
						callback(e);
					}
				});
			});
		}
		req.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});

		var input = {action_indexes: [action_index]};
		if (context_items) {
			input.context_items = context_items;
		}
		req.write(JSON.stringify(input));
		req.end();

	}

	this.conversationSummary = function(conversation_id, adpater_connection, callback) {
		var start_time = new Date().getTime();
		logger.info("[%s] conversation summary (conversation id: %s)", user_id, conversation_id);

		var connectionProperties = adpater_connection.connectionProperties;
		if (!connectionProperties.port) {
			if (connectionProperties.protocol.toLowerCase() == "http") {
				connectionProperties.port = "80";
			} else if (connectionProperties.protocol.toLowerCase() == "https") {
				connectionProperties.port = "443";
			} else {
				connectionProperties.port = "";
			}
		}

		var authHeader = _makeCustomizedAuth(connectionProperties.authetication.userId, connectionProperties.authetication.password);
		var headers = {
			"Content-Type": "application/json",
			"Authorization": authHeader 
		}; 
		
		var option = {
			method : "GET",
			port : connectionProperties.port,
			hostname : connectionProperties.host,
			path : connectionProperties.basePath + "/rest/conversations/" + conversation_id + "/summary",
			headers : {
				"Content-Type" : "application/json",
				"Authorization" : authHeader,
			}
		}
		logger.info(JSON.stringify(option));
		var req = null;
		try {
			if (connectionProperties.protocol.toLowerCase() == "http") {
				req = http.request(option, function(res) {
					var data = '';
					res.on("data", function(chunk) {
						data += chunk;
					});
					res.on("end", function() {
						try {
							if (res.statusCode != 200 && res.statusCode != 201) {
								logger.info(res.statusCode + ": " + data);
								return callback(new Error(data));
							}
							var end_time = new Date().getTime();
							logger.info("[%s] conversation summary takes %s milliseconds", user_id, (end_time - start_time));
							logger.info(data);
							callback(null, data);
						} catch (e) {
							logger.error(e.stack);
							callback(e);
						}
					});
				});
			} else if (connectionProperties.protocol.toLowerCase() == "https") {
				req = https.request(option, function(res) {
					var data = '';
					res.on("data", function(chunk) {
						data += chunk;
					});
					res.on("end", function() {
						try {
							if (res.statusCode != 200 && res.statusCode != 201) {
								logger.info(res.statusCode + ": " + data);
								return callback(new Error(data));
							}
							var end_time = new Date().getTime();
							logger.info("[%s] conversation summary takes %s milliseconds", user_id, (end_time - start_time));
							logger.info(data);
							callback(null, data);
						} catch (e) {
							logger.error(e.stack);
							callback(e);
						}
					});
				});
			}
			req.on("error", function(e) {
				logger.error(e.stack);
				callback(e);
			});
			
			req.end();
			
		} catch (e) {
			logger.error(e.stack);
			if (req)
				req.end();
			callback(e)
		}

	}

	this.getDialog = function(dialog_id, callback) {
		var start_time = new Date().getTime();
		logger.infp("[%s] get dialog (dialog_id : %s) ", user_id, dialog_id);
		getRequest(config.dm_api + "dialogs/" + dialog_id, self.headers, function(err, dialog) {
			var end_time = new Date().getTime();
			logger.info("[%s] get dialog takes %s milliseconds", user_id, (end_time - start_time));
			TraceOperations.trace(user_id, thread_id, receiver_id, service_id, message_account_id, "INFO", "DM_DIALOG", dialog);
			callback(err, dialog);
		});
	}

	this.getDialogNode = function(dialog_id, node_id, callback) {
		var start_time = new Date().getTime();
		logger.info("[%s] get dialog node  (dialog_id : %s, node_id : %s) ", user_id, dialog_id, node_id);
		getRequest(config.dm_api + "dialogs/" + dialog_id + "/nodes/" + node_id, self.headers, function(err, node) {
			var end_time = new Date().getTime();
			logger.info("[%s] get dialog node takes %s milliseconds", user_id, (end_time - start_time));
			TraceOperations.trace(user_id, thread_id, receiver_id, service_id, message_account_id, "INFO", "DM_NODE", node);
			callback(err, node);
		});
	}

	this.getAccounts = function(callback) {
		logger.info("[%s] get accounts", user_id);
		getRequest(config.dm_api + "accounts", self.headers, function(err, accounts) {
			TraceOperations.trace(user_id, thread_id, receiver_id, service_id, message_account_id, "INFO", "DM_ACCOUNTS", accounts);
			callback(err, accounts);
		});
	}

	this.createAccount = function(account, callback) {
		logger.info("[%s] create account : %s" + account.account_name, user_id);
		postRequest(config.dm_api + "accounts/add", self.headers, JSON.stringify(account), function(err, account) {
			TraceOperations.trace(user_id, thread_id, receiver_id, service_id, message_account_id, "INFO", "DM_ACCOUNT", account);
			callback(err, account);
		});
	}

	//GET API:
	// http://9.186.89.140:9080/DialogManager/rest/dialogs/3/context_data_items
	// [{data_name: 'MatchDate', data_type: 'Date'}, {data_name: 'Stadium', data_type: 'String'}]
	this.getDialogRequiredContext = function(dialog_id, callback) {
		var start_time = new Date().getTime();
		logger.info("[%s] get required context (dialog_id : %s )", user_id, dialog_id);
		getRequest(config.dm_api + "dialogs/" + dialog_id + "/context_data_items", self.headers, function(err, context_items) {
			if(err){
				logger.error(err.stack);
				return callback(err);
			}

			var end_time = new Date().getTime();
			logger.info("[%s] get dialog context takes %s milliseconds", user_id, (end_time - start_time));
			logger.info("[%s] get required context_items : %s", user_id, JSON.stringify(context_items));
			TraceOperations.trace(user_id, thread_id, receiver_id, service_id, message_account_id, "INFO", "DM_REQUIRED_CONTEXT_ITEMS", {dialog_id : dialog_id, context_items: context_items});
			callback(err, context_items);
		});
	}

	this.getConversationContext = function(conversation_id, context_data_name, callback) {
		var start_time = new Date().getTime();
		logger.info("[%s] get context (conversation_id : %s , context_data_name: %s)", user_id, conversation_id, context_data_name);
		//http://9.186.89.140:9080/DialogManager/rest/conversations/2/broker_get_context?data_name=matchdates
		getRequest(config.dm_api + "conversations/" + conversation_id + "/broker_get_context?data_name=" + encodeURIComponent(context_data_name), self.headers, function(err, context_item) {
			if(err){
				logger.error(err.stack);
				return callback(err);
			}
			var end_time = new Date().getTime();
			logger.info("[%s] get conversation context takes %s milliseconds", user_id, (end_time - start_time));
			logger.info("[%s] get context (conversation_id : %s , context_data_name: %s, context_item: %s)", user_id, conversation_id, context_data_name, JSON.stringify(context_item));
			TraceOperations.trace(user_id, thread_id, receiver_id, service_id, message_account_id, "INFO", "DM_CONTEXT_ITEM", {conversation_id : conversation_id, context_data_name: context_data_name,context_item :context_item });
			return callback(err, context_item);
		});
	}

	this.setConversationContext = function(conversation_id, context_data_name, context_data_value, callback){
		var start_time = new Date().getTime();
		logger.info("[%s] set required context (conversation_id : %s, context_data_name: %s, context_data_value: %s)", user_id, conversation_id, context_data_name, context_data_value);
		//http://9.186.89.140:9080/DialogManager/rest/conversations/2/broker_set_context?data_name=matchdates&data_value=2015-10-2
		
		postRequest(config.dm_api + "conversations/" + conversation_id + "/broker_set_context?data_name=" + encodeURIComponent(context_data_name) + "&data_value=" + encodeURIComponent(context_data_value), self.headers, JSON.stringify({}), function(err, context_item){
			if(err){
				logger.error(err.stack);
				return callback(err);
			}

			var end_time = new Date().getTime();
			logger.info("[%s] set context takes %s milliseconds", user_id, (end_time - start_time));
			TraceOperations.trace(user_id, thread_id, receiver_id, service_id, message_account_id, "INFO", "DM_CONTEXT_ITEM", {conversation_id : conversation_id, context_data_name: context_data_name, context_data_value: context_data_value });
			return callback(err, context_item);
		});
	}
	
	this.createDialog = function(dialog_content, adpater_connection, callback){
		var start_time = new Date().getTime();
		logger.info("[%s] create dialog", user_id);
		
		var connectionProperties = adpater_connection.connectionProperties;
		if (!connectionProperties.port) {
			if (connectionProperties.protocol.toLowerCase() == "http") {
				connectionProperties.port = "80";
			} else if (connectionProperties.protocol.toLowerCase() == "https") {
				connectionProperties.port = "443";
			} else {
				connectionProperties.port = "";
			}
		}

		var authHeader = _makeCustomizedAuth(connectionProperties.authetication.userId, connectionProperties.authetication.password);
		var headers = {
			"Content-Type": "application/json",
			"Authorization": authHeader 
		}; 
		
		var option = {
			method : "POST",
			port : connectionProperties.port,
			hostname : connectionProperties.host,
			path : connectionProperties.basePath + "/rest/dialogs/save",
			headers : {
				"Content-Type" : "application/json",
				"Authorization" : authHeader,
			}
		}
		var req = null;
		if (connectionProperties.protocol.toLowerCase() == "http") {
			var req = http.request(option, function(res) {
				var data = '';
				res.on("data", function(chunk) {
					data += chunk;
				});
				res.on("end", function() {
					try {
						if (res.statusCode != 200 && res.statusCode != 201) {
							logger.info(res.statusCode + ": " + data);
							return callback(new Error(data));
						}
						var end_time = new Date().getTime();
						logger.info("[%s] create dialog takes %s milliseconds", user_id, (end_time - start_time));
						callback(null, data);
					} catch (e) {
						callback(e);
					}
				});
			});
		} else if (connectionProperties.protocol.toLowerCase() == "https") {
			var req = https.request(option, function(res) {
				var data = '';
				res.on("data", function(chunk) {
					data += chunk;
				});
				res.on("end", function() {
					try {
						if (res.statusCode != 200 && res.statusCode != 201) {
							logger.info(res.statusCode + ": " + data);
							return callback(new Error(data));
						}
						var end_time = new Date().getTime();
						logger.info("[%s] create dialog takes %s milliseconds", user_id, (end_time - start_time));
						callback(null, data);
					} catch (e) {
						callback(e);
					}
				});
			});
		}
		req.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});
		
		logger.info(JSON.stringify(dialog_content));
		req.write(JSON.stringify({"account_id": 1, "user_id": "admin", "dialog_content": dialog_content}));
		req.end();

	}

}

module.exports = iPASSClient;

