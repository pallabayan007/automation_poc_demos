/**
 * WorkloadScheduler Process APIs Client
 */

var https = require("https");
var http = require("http");
var URL = require("url");
var async = require("async");
var fs = require('fs');
var ws = require('iws-light');
var underscore = require("underscore");

var config = require("../../../../../config");
var adpaters_config_info = require("../../../../../config/automation_adapter_config.json");

var logger = getLogger("WSProcessClient");

var IOD_Execution_Mapping = {};
var wsConnections = {};

var processesMap = {};
var historiesMap = {};

var WSProcessClient = function() {
	// constructor
	var self = this;
	var agentName = null;
	
	this.execute = function(IOD, callback) {
		logger.info("[%s] push to execute", IOD.WorkflowAutomationID);
		self.executeQueue.push(IOD, callback);
	}

	this.executeQueue = async.queue(function(IOD, callback) {
		logger.info("[%s] start to execute", IOD.WorkflowAutomationID);
		self._executeWithRetry(IOD, callback);
	}, 1);

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
			} else if (err != null && err.message == "getaddrinfo ENOTFOUND") {
				err = new Error("Management system not working"); 
			} else if (err != null && err.message == "connect ETIMEDOUT") {
				err = new Error("Management system not working"); 
			}
			callback(err, result);
		});
	}
	
	
	
	this._execute = function(IOD, callback) {
		// construct url based on config info of ibm workload scheduler service
		// instance
		IOD.connectionId = "1";
		var right_wa_adpater_connection = null;
		var adapter_connections = adpaters_config_info.adapters.WorkloadSchedulerAdapter.connections;
		for (var i = 0; i < adapter_connections.length; i++) {
			if (adapter_connections[i].connection.connectionId == IOD.connectionId) {
				right_wa_adpater_connection = adapter_connections[i].connection.connectionProperties;
			}
		}
		
        // var baseUrl = "https://55f747e92f16401abd07e9fb4cf9e906%40bluemix.net:O%26aV9%3FvMHeX4mkdFn%3FkIirIkXRZpqJ@sidr37wamxo-114.wa.ibmserviceengage.com/ibm/TWSWebUI/Simple/rest?tenantId=QG&engineName=engine&engineOwner=engine";
		var baseUrl = right_wa_adpater_connection.protocol 
				+ "://" + right_wa_adpater_connection.authentication.userId 
				+ ":" + right_wa_adpater_connection.authentication.password
				+ "@" + right_wa_adpater_connection.host
				+ (right_wa_adpater_connection.port != "" ? right_wa_adpater_connection.port : "")
				+ right_wa_adpater_connection.path; 
		logger.info("To connect: " + baseUrl); 
		var wsConn = this.getWSConnection(baseUrl);
		
		var libName = IOD.AutomationInput[0].LibraryName; 
		var procName = IOD.AutomationInput[0].ProcessName; 
		
		var execution = {}; 
		if (processesMap[libName + "|" + procName]) {
			var process = processesMap[libName + "|" + procName];
			logger.info("run Process Parameter "+JSON.stringify({id:process.id, variables:IOD.AutomationInput[0].sys_id?{sys_id:IOD.AutomationInput[0].sys_id}:null}));
			var variables = IOD.AutomationInput[0];
			if (IOD.AutomationInput.length > 1) {
				try {
					variables = underscore.extend(variables, JSON.parse(IOD.AutomationInput[IOD.AutomationInput.length - 1]));
				} catch (pe) {
				}
			}
			//wsConn.runProcess({id:process.id}, function(err,
			wsConn.runProcess({id:process.id, variables:variables}, function(err,
					execution_id) {
				var execution = {}; 
				if (err) {
					execution.status = "error"; 
					execution.errorMessage = err.message; 
					return callback(err);
				}

				execution.status = "in process";
				execution.id = execution_id.id;
				execution.processID = process.id;
				execution.wsConn = wsConn; 
				IOD_Execution_Mapping[IOD.id] = execution;
				callback(null, execution);
			});
		} else {
		    logger.info("Loading libraries...");
			wsConn.getProcessLibraries(null, function (err, data) {
			    if (err) {
			    	callback(err);
				} else {
					var library;
					var process;
					for (var i = 0; i < data.length; i++) {
						if (data[i].name === libName) {
							library = data[i];
							logger.info("Process library found: " + libName);
							break;
						}
					}
//					data.forEach(function(lib) {
//						if (lib.name === libName) {
//							library = lib;
//							logger.info("Process library found: " + libName);
//						}
//					});
					if (!library) {
						var errorMsg = "Process library not found: " + libName;  
						logger.info(errorMsg);
						execution.status = "error"; 
						execution.errorMessage = errorMsg; 
						return callback(new Error(errorMsg));
					} else {
						logger.info("Loading processes...");
						wsConn.getProcesses(library, function (err, data) {
							if (err) {
								callback(err);
							} else {
								for (var i = 0; i < data.length; i++) {
									if (data[i].name === procName) {
										process = data[i];
										processesMap[libName + "|" + procName] = process;
										logger.info("Process found: " + procName);
										break;
									}
								}
//								data.forEach(function(proc) {
//									if (proc.name === procName) {
//										process = proc;
//										processesMap[libName + "|" + procName] = process;
//										logger.info("Process found: " + procName);
//									}
//								});
								if (process) {
									logger.info("run Process Parameter "+JSON.stringify({id:process.id, variables:IOD.AutomationInput[0].sys_id?{sys_id:IOD.AutomationInput[0].sys_id}:null}));
									var variables = IOD.AutomationInput[0];
									if (IOD.AutomationInput.length > 1) {
										try {
											variables = underscore.extend(variables, JSON.parse(IOD.AutomationInput[IOD.AutomationInput.length - 1]));
										} catch (pe) {
										}
									}
									//wsConn.runProcess({id:process.id}, function(err,
									wsConn.runProcess({id:process.id, variables:variables}, function(err,
											execution_id) {
										var execution = {}; 
										if (err) {
											execution.status = "error"; 
											execution.errorMessage = err.message; 
											return callback(err);
										}

										execution.status = "in process";
										execution.id = execution_id.id;
										execution.processID = process.id;
										execution.wsConn = wsConn; 
										IOD_Execution_Mapping[IOD.id] = execution;
										callback(null, execution);
									});
								} else {
									var errorMsg = "Process not found: " + procName;  
									logger.info(errorMsg);
									execution.status = "error"; 
									execution.errorMessage = errorMsg; 
									return callback(new Error(errorMsg));
								}
							}
						});
					}
				}
			});
		}
	}

	this.getWSConnection = function (baseURL) {
		
		var wsConn = null; 
		
//		if (wsConnections != null && wsConnections.baseURL != null) {
//			wsConn = wsConnections.baseURL; 
//		} else {
			wsConn = ws.createConnection(baseURL);
			wsConn.getCloudAgent(function(data) {
				agentName = data;
			});
			
			// wsConn.enableLogging(true);
			wsConn.setTimezone({timezone: "Europe/Rome"}, function(err){
				if(err){
					console.log(err);
				} 
			});
			wsConnections.baseURL = wsConn; 
//		} 
		return wsConn; 
	}

	this.getStatus = function(IOD, callback) {
		logger.info("[%s] start to get status", IOD.WorkflowAutomationID);
		var execution_id = IOD_Execution_Mapping[IOD.id].id;
		var options = {}; 
		options.id = IOD_Execution_Mapping[IOD.id].processID;
		var returnMsg = ""; 
		var wsConn = IOD_Execution_Mapping[IOD.id].wsConn;
		
		if (wsConn == null) {
			logger.error ("no workload scheduler is specified to connect"); 
			returnMsg = "error"; 
			callback(returnMsg);
			return; 
		}
		
		if (historiesMap[options.id + "|" + execution_id]) {
			var executionStatusObj = historiesMap[options.id + "|" + execution_id];
			var response=null;
			try {
				wsConn.getStepDetails({
					processid:options.id,
					step:{
						id:executionStatusObj.id,
						instancetype:executionStatusObj.instancetype+''
					}
				}, function(err, data) {
					if (err) {
						logger.error(err); 
						returnMsg = "error";
						return callback(returnMsg);
					} else {
						logger.info("Step: " + JSON.stringify(data));
						if (data[0].status == 0) {
							returnMsg = "complete";
							wsConn.getStepLogURLs({
								id:data[0].id,
								startdate:data[0].startdate,
								instancetype:data[0].instancetype+'',
								jobnumber:data[0].jobnumber
							}, function(err, data) {
								if (err) {
									logger.error(err);
									returnMsg = "error"; 
									return callback(returnMsg);
								} else {
									logger.info("Log: " + JSON.stringify(data));
									wsConn.getStepLog({
										download:data.download
									}, function(err, data) {
										if (err) {
											logger.error(err);
											returnMsg = "error"; 
											return callback(returnMsg);
										} else {
											logger.info("Download: " + JSON.stringify(data));
									        if( typeof data == "object" ) {
									            data = JSON.stringify(data);
									        } else if (typeof data != "string") {
									        	logger.error("Log is neither JSON nor String format.");
									        	returnMsg = "error"; 
									        	return callback(returnMsg);
									        }
									        //var response = data.split("===============================================================")[2].trim();
									        response=data.split("===============================================================")[2].trim().replace("\n","");
									        logger.info("Response: " + response);
									        logger.info("Response (stringified): " + JSON.stringify(response));
//									        logger.info("Response (JSON): " + JSON.stringify(JSON.parse(response)));
									        returnMsg = "complete";
									        return callback(null, returnMsg, response);
										}
									});
								}
							});
						} else if (data[0].status == 1) {
							returnMsg = "error"; 
							return callback(null, returnMsg);
						} else {
							returnMsg = "in progress"; 
							return callback(null, returnMsg);
						}
					}
				});
			} catch (e) {
				logger.error(e);
				logger.info("Error from type");
				returnMsg = "error"; 
				return callback(null, returnMsg);
			}
		} else {
			wsConn.getProcessHistory(options, function(err, data){
				if (err) {
					logger.error(err); 
					returnMsg = "error"; 
					callback(returnMsg);
					return; 
				}
				if (data) {
					logger.info("ProcessHistory(" + options.id + "):" + data); 
					// extract history item based on execution id
					// set the return message based on the identified history item
					logger.info("execution_id: " + execution_id);
					for (var i = 0; i < data.length; i++) {
						logger.info(i + " : " + JSON.stringify(data[i]));
						var internalid = data[i].internalid; 
						logger.info("internalid: " + internalid);
						var isInclude = execution_id.indexOf(internalid);
						if (isInclude >= 0) {
							var executionStatusObj = data[i];
							historiesMap[options.id + "|" + execution_id] = executionStatusObj;
							logger.info("History (" + i + "): " + JSON.stringify(executionStatusObj));
							if (executionStatusObj.status == 0) {
								returnMsg = "complete";
								var response=null;
								try {
									wsConn.getStepDetails({
										processid:options.id,
										step:{
											id:executionStatusObj.id,
											instancetype:executionStatusObj.instancetype+''
										}
									}, function(err, data) {
										if (err) {
											logger.error(err); 
											returnMsg = "error";
											return callback(returnMsg);
										} else {
											logger.info("Step: " + JSON.stringify(data));
											wsConn.getStepLogURLs({
												id:data[0].id,
												startdate:data[0].startdate,
												instancetype:data[0].instancetype+'',
												jobnumber:data[0].jobnumber
											}, function(err, data) {
												if (err) {
													logger.error(err);
													returnMsg = "error"; 
													return callback(returnMsg);
												} else {
													logger.info("Log: " + JSON.stringify(data));
													wsConn.getStepLog({
														download:data.download
													}, function(err, data) {
														if (err) {
															logger.error(err);
															returnMsg = "error"; 
															return callback(returnMsg);
														} else {
															logger.info("Download: " + JSON.stringify(data));
													        if( typeof data == "object" ) {
													            data = JSON.stringify(data);
													        } else if (typeof data != "string") {
													        	logger.error("Log is neither JSON nor String format.");
													        	returnMsg = "error"; 
													        	return callback(returnMsg);
													        }
													        //var response = data.split("===============================================================")[2].trim();
													        response=data.split("===============================================================")[2].trim().replace("\n","");
													        logger.info("Response: " + response);
													        logger.info("Response (stringified): " + JSON.stringify(response));
//													        logger.info("Response (JSON): " + JSON.stringify(JSON.parse(response)));
													        returnMsg = "complete";
													        return callback(null, returnMsg, response);
														}
													});
												}
											});
										}
									});
									break;
								} catch (e) {
									logger.error(e);
									logger.info("Error from type");
									returnMsg = "error"; 
									return callback(null, returnMsg);
								}
							} else if (executionStatusObj.status == 1) {
								returnMsg = "error"; 
								return callback(null, returnMsg);
							} else {
								returnMsg = "in progress"; 
								return callback(null, returnMsg);
							}
						} 
					}

//					returnMsg = "in progress"; 
//					callback(null, returnMsg);
//					return;
				}
			});
		}
	}
}

module.exports = WSProcessClient;

// test
/*
 * var client = new IPSoftAutomataClient(); client.executeAutomatonbyID("tc1",
 * "7691", function(err, execution){ console.log(execution); var execution_id =
 * execution.execution_id; console.log(execution_id);
 * console.log(execution.status); client.getExecutionStatus(execution_id,
 * function(err, result){ console.log(result); }); });
 */

