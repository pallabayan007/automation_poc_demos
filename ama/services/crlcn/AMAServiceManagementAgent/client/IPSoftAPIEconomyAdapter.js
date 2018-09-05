/**
u * IPSoft API Economy APIs Client
 */

var adpaters_config_info = require("../../../../../config/automation_adapter_config.json");

var fs = require("fs");
var path1 = require("path");
var https = require("https");
var http = require("http");
var URL = require("url");

var cron = require("cron");
var CronJob = cron.CronJob;

var logger = getLogger("IPSoftAPIEconomyAdapter");
var IOD_Execution_Mapping = {};

var IPSoftAPIEconomyAdapter = function() {

	var self = this;

	this.execute = function(IOD, callback) {
		logger.info('test the function==================>ari@');
		logger.info(IOD);
		
		logger.info(JSON.stringify(IOD));
		
		
		// retrieve connection info from config file
		var right_ipsoftapieconomy_adpater_connection = null;
		var ipsoftapieconomy_adapter_connections = adpaters_config_info.adapters.IPSoftAPIEconomyAdapter.connections;
//		for (var i = 0; i < ipsoftapieconomy_adapter_connections.length; i++) {
//			if (ipsoftapieconomy_adapter_connections[i].connection.connectionId == IOD.connectionId) {
//				right_ipsoftapieconomy_adpater_connection = ipsoftapieconomy_adapter_connections[i].connection;
//			}
//		}
		right_ipsoftapieconomy_adpater_connection = ipsoftapieconomy_adapter_connections[0].connection;
		if (right_ipsoftapieconomy_adpater_connection == null) {
			return callback(new Error(
					"can not find the connection info of the specified ipsoft apieconomy instance"));
		}
		var connectionProperties = right_ipsoftapieconomy_adpater_connection.connectionProperties;
		var connectionHostPort = "";
		if (connectionProperties.port) {
			connectionHostPort = connectionProperties.host + ":"
					+ connectionProperties.port;
		} else {
			connectionHostPort = connectionProperties.host;
		}
		var base_connection_path = connectionProperties.protocol + "://"
				+ connectionHostPort; 

		var credentials_username = connectionProperties.authetication.userId;
		var credentials_password = connectionProperties.authetication.password;
		var client_id = connectionProperties.ipsoft_client_id;
		
		var timestamp = new Date().getTime();
		
		var execution = {
			execution_id : timestamp,
			name : "IPSoft API Economy Automaton Execution",
			status : "In Progress"
		};

		IOD.inputParameters = [];
		//logger.info(JSON.stringify(IOD));
		//logger.info('test the function==================>ari@'+IOD.AutomationInput.length);
		
		if (IOD.AutomationInput) {
			logger.info('IOD lenght ============ > '+IOD.AutomationInput.length);
			for (var i = 0; i < IOD.AutomationInput.length; i++) {
				var input = IOD.AutomationInput[i];
				var inputParameter = {
						"goldenBridgeEventId":IOD.id+"|("+i+")",
						"severity":"",
						"clientId":client_id,
						"osType":"",
						"requestFor":"create",
						"targetHostName":"",
						"automationInput":{
							"name":"",
							"description":"",
							"path":"",
							"parameters":"",
							"assignedGroup":""
						}
				};
				try {
//					logger.info(input);
//					input = JSON.parse(input);
					for (var key in input) {
						if (key == "targetHost") {
							inputParameter["targetHostName"] = input[key];
						} else if (key == "assignedGroup") {
							inputParameter["automationInput"]["assignedGroup"] = input[key];
						} else if (key == "severity") {
							inputParameter["severity"] = input[key];
						} else if (key == "osType") {
							inputParameter["osType"] = input[key];
						} else if (key == "automationDesc") {
							inputParameter["automationInput"]["description"] = input[key];
						} else if (key == "automationPath") {
							inputParameter["automationInput"]["path"] = input[key];
						} else if (key == "automationName") {
							inputParameter["automationInput"]["name"] = input[key];
						} else {
//							if (inputParameter["automationInput"]["parameters"] != "") {
//								inputParameter["automationInput"]["parameters"] += ";";
//							}
							inputParameter["automationInput"]["parameters"] += (key + ":" + input[key]);
							inputParameter["automationInput"]["parameters"] += ";"; // Make sure the semi colon at the end of each parameter. This is required by IPC automata.
						}
					}
					if (   !inputParameter["goldenBridgeEventId"] || inputParameter["goldenBridgeEventId"].trim()==""
						|| !inputParameter["clientId"] || inputParameter["clientId"].trim()==""
						|| !inputParameter["osType"] || inputParameter["osType"].trim()==""
						|| !inputParameter["requestFor"] || inputParameter["requestFor"].trim()==""
						|| !inputParameter["targetHostName"] || inputParameter["targetHostName"].trim()==""
						|| !inputParameter["automationInput"]["name"] || inputParameter["automationInput"]["name"].trim()==""
						|| !inputParameter["automationInput"]["path"] || inputParameter["automationInput"]["path"].trim()=="") {
						logger.error("The input parameters are not completed, and will not be send to IPSoft: " + JSON.stringify(inputParameter));
					} else {
						IOD.inputParameters.push(inputParameter);
						logger.info("The input parameters have been pushed to send to IPSoft: " + JSON.stringify(inputParameter));
					}
				} catch (e) {
					logger.error(e);
				}
			}
		}

		try {
			// invoke IPSoft API Economy API to start the automation process
			for (var i = 0; i < IOD.inputParameters.length; i++) {
				logger.info("Issue request to API Economy for starting automation in IPSoft: " + JSON.stringify(IOD.inputParameters[i]));
				IOD_Execution_Mapping[IOD.inputParameters[i]["goldenBridgeEventId"]] = execution;
				//getAPIeStatus(clientInput, function(err, result){});
				var clientInput = IOD.inputParameters[i];
				var reqPath="create";
				
				getAPIeStatus(reqPath,clientInput, function(err, result){
					
					if(err){
						logger.info("error from apie in create call ::::" + err);
						execution.status = "error"; 
						//IOD_Execution_Mapping[IOD.id] = execution;
						//IOD_Execution_Mapping[IOD.inputParameters[i]["goldenBridgeEventId"]] = execution;
						IOD_Execution_Mapping[IOD.id+"|("+i+")"] = execution;
						callback(err);
					}
					else{
						logger.info("received status ok from create apie status");
						var resultReceived = JSON.parse(result);
						logger.info("resultReceived:::"+resultReceived);
						if(resultReceived.acknowledge==1 && resultReceived.goldenBridgeEventId!=""){
							logger.info("received acknowledge =1");
							var gb_id= resultReceived.goldenBridgeEventId;
							logger.info("goldenBridgeEventId"+gb_id);
							if(resultReceived.statusCode==0){
								//IOD_Execution_Mapping[resultReceived.goldenBridgeEventId] = execution;
								logger.info("goldenBridgeEventId in if"+gb_id);
								IOD_Execution_Mapping[gb_id] = execution;
								callback(null,execution);
							}else{
								execution.status = "error"; 
								logger.info("error in  else");
								//IOD_Execution_Mapping[IOD.inputParameters[i]["goldenBridgeEventId"]] = execution;
								IOD_Execution_Mapping[gb_id] = execution;
								callback(null, execution);
							}
						}else{
							execution.status = "error"; 
							logger.info("error in else 222");
							IOD_Execution_Mapping[IOD.id+"|("+i+")"] = execution;
							//IOD_Execution_Mapping[IOD.inputParameters[i]["goldenBridgeEventId"]] = execution;
							callback(null, execution);
						}
					}
					
				});
				
				

			}
			//IOD_Execution_Mapping[IOD.id] = execution;
			//callback(null,execution);
		} catch(e){
			logger.error("in catch" +e);
			// update execution status
			//execution.status = "error"; 
			IOD_Execution_Mapping[IOD.id] = execution;
			callback(e); 
		}
	}

	this.getStatus = function(IOD, callback) {
		// check the in-memory variables
		var error = false;
		var complete = true;
		
		if (!IOD.inputParameters && IOD.AutomationInput) {
			IOD.inputParameters = [];
			logger.info('IOD lenght ============ > '+IOD.AutomationInput.length);
			for (var i = 0; i < IOD.AutomationInput.length; i++) {
				var input = IOD.AutomationInput[i];
				var inputParameter = {
						"goldenBridgeEventId":IOD.id+"|("+i+")",
						"severity":"",
						"clientId":client_id,
						"osType":"",
						"requestFor":"create",
						"targetHostName":"",
						"automationInput":{
							"name":"",
							"description":"",
							"path":"",
							"parameters":"",
							"assignedGroup":""
						}
				};
				try {
//					logger.info(input);
//					input = JSON.parse(input);
					for (var key in input) {
						if (key == "targetHost") {
							inputParameter["targetHostName"] = input[key];
						} else if (key == "assignedGroup") {
							inputParameter["automationInput"]["assignedGroup"] = input[key];
						} else if (key == "severity") {
							inputParameter["severity"] = input[key];
						} else if (key == "osType") {
							inputParameter["osType"] = input[key];
						} else if (key == "automationDesc") {
							inputParameter["automationInput"]["description"] = input[key];
						} else if (key == "automationPath") {
							inputParameter["automationInput"]["path"] = input[key];
						} else if (key == "automationName") {
							inputParameter["automationInput"]["name"] = input[key];
						} else {
//							if (inputParameter["automationInput"]["parameters"] != "") {
//								inputParameter["automationInput"]["parameters"] += ";";
//							}
							inputParameter["automationInput"]["parameters"] += (key + ":" + input[key]);
							inputParameter["automationInput"]["parameters"] += ";"; // Make sure the semi colon at the end of each parameter. This is required by IPC automata.
						}
					}
					if (   !inputParameter["goldenBridgeEventId"] || inputParameter["goldenBridgeEventId"].trim()==""
						|| !inputParameter["clientId"] || inputParameter["clientId"].trim()==""
						|| !inputParameter["osType"] || inputParameter["osType"].trim()==""
						|| !inputParameter["requestFor"] || inputParameter["requestFor"].trim()==""
						|| !inputParameter["targetHostName"] || inputParameter["targetHostName"].trim()==""
						|| !inputParameter["automationInput"]["name"] || inputParameter["automationInput"]["name"].trim()==""
						|| !inputParameter["automationInput"]["path"] || inputParameter["automationInput"]["path"].trim()=="") {
						logger.error("The input parameters are not completed, and will not be send to IPSoft: " + JSON.stringify(inputParameter));
					} else {
						IOD.inputParameters.push(inputParameter);
						logger.info("The input parameters have been pushed to send to IPSoft: " + JSON.stringify(inputParameter));
					}
				} catch (e) {
					logger.error(e);
				}
			}
		}
		
		if (IOD.inputParameters.length != 0) {
			for (var i = 0; i < IOD.inputParameters.length; i++) {
				var status = IOD_Execution_Mapping[IOD.id+"|("+i+")"].status;
				logger.info("status from getstatus::" + status+ "for iod :::"+ IOD.id+"|("+i+")");
				if (status.toLowerCase() == "complete"|| status.toLowerCase() == "resolved") {
					error = error || false;
					complete = complete && true;
				} else if(status.toLowerCase() == "error" || status.toLowerCase() == "failed" || status.toLowerCase() == "transfer"){
					error = error || true;
					complete = complete && false;
				} else {
					error = error || false;
					complete = complete && false;
				}
			}
		}
		
		if (error) {
			callback(null, "Error");
		} else if (complete) {
			callback(null, "Complete");
		} else {
			callback(null, "In Progress");
		}
		
	}
	
	this.initialize = function() {
		//var cron_time = "0,10,20,30,40,50 * * * * *";
		var flag = true;
		var cron_time = null;
		var client_id = null;
		var ipsoftapieconomy_adapter_connections = adpaters_config_info.adapters.IPSoftAPIEconomyAdapter.connections;
		var right_ipsoftapieconomy_adpater_connection = ipsoftapieconomy_adapter_connections[0].connection;
		if (right_ipsoftapieconomy_adpater_connection!= null) {
			var connectionProperties = right_ipsoftapieconomy_adpater_connection.connectionProperties;
			 client_id = connectionProperties.ipsoft_client_id;		
			 cron_time = connectionProperties.cron_time;
			}
		
		
		
		
		logger.info("Using cron time  status through API Economy"+ cron_time);
		try {
			/*var timestamp = new Date().getTime();
			var execution = {
					execution_id : timestamp,
					name : "IPSoft API Economy Automaton Execution",
					status : "resolved"
				};
			var execution2 = {
					execution_id : timestamp,
					name : "IPSoft API Economy Automaton Execution",
					status : "In progress"
				};

			IOD_Execution_Mapping["1"]=execution;
			IOD_Execution_Mapping["2"] = execution2;*/
			
			
			
			var scheduledJob = new CronJob(cron_time, function() {
				
				var IPsoftAlertCount =0;
				var completeAlertCount =0;
				for (var key in IOD_Execution_Mapping) {
					if (IOD_Execution_Mapping.hasOwnProperty(key)) {
						logger.info(key + " -> " + IOD_Execution_Mapping[key]);
						if(IOD_Execution_Mapping[key].name =="IPSoft API Economy Automaton Execution"){
							//flag = true;
							//logger.info("flag"+flag);
							IPsoftAlertCount = IPsoftAlertCount+1;
							logger.info("IPsoftAlertCount" +IPsoftAlertCount);
							if (IOD_Execution_Mapping[key].status.toLowerCase() == "complete"||
									IOD_Execution_Mapping[key].status.toLowerCase() == "resolved" ||
									IOD_Execution_Mapping[key].status.toLowerCase() == "error"	||
									IOD_Execution_Mapping[key].status.toLowerCase() == "transfer")
							{
								completeAlertCount = completeAlertCount+1;
								logger.info("completeAlertCount" +completeAlertCount);
							}
						}
					}
				}
				
				//var timestamp = new Date().getTime();
			//	var execution = {
			//		execution_id : timestamp,
			//		name : "IPSoft API Economy Automaton Execution",
			//		status : "In Progress"
				//};

			//	IOD_Execution_Mapping[123] = execution;
				try {
					if(completeAlertCount!=IPsoftAlertCount){
					
					var clientInput={
							"clientId": client_id
					};
					var reqPath="status";
					
					// Get status update from API Economy and update IOD_Execution_Mapping
					logger.info("Getting status updates from API Economy forclient id..." + client_id);
					
					var result1 = {
							"updates":[]
					};
					var filteredResult = {
							
					};
					
					
					logger.info("calling the actual apie");
					
					getAPIeStatus(reqPath,clientInput, function(err, result){
						
						if(err){
							logger.info("error from apie in getting status::::" + err)
						}
						else{
							
								if(result!=null || result!=undefined || result!="")	{				
							
							logger.info("Received  status updates from API Economy: " + JSON.stringify(result));
							result = JSON.parse(result);
							
							for (var i = 0; i < result["updates"].length; i++) {
								var execution_id = result["updates"][i]["update"]["goldenBridgeEventId"];
								var statustime = result["updates"][i]["update"]["updateTime"];
								logger.info("goldenBridgeEventId ............." + execution_id);
								if(filteredResult.hasOwnProperty(execution_id)){
									logger.info("yes property exists"+filteredResult[execution_id]);
									if(filteredResult[execution_id] < statustime){
										
									
										filteredResult[execution_id]=statustime;
										
										
										var execution = {
												execution_id : result["updates"][i]["update"]["automationId"],
												name : "IPSoft API Economy Automaton Execution",
												status : result["updates"][i]["update"]["status"]
											};
										IOD_Execution_Mapping[result["updates"][i]["update"]["goldenBridgeEventId"]] = execution;
									}
									
								}else{
									
									filteredResult[execution_id]=statustime;
									
									
									var execution = {
											execution_id : result["updates"][i]["update"]["automationId"],
											name : "IPSoft API Economy Automaton Execution",
											status : result["updates"][i]["update"]["status"]
										};
									IOD_Execution_Mapping[result["updates"][i]["update"]["goldenBridgeEventId"]] = execution;
									
								}
								
							}
							logger.info("Received filteredResult: " + JSON.stringify(filteredResult));
							logger.info("Received IOD_Execution_Mapping: " + JSON.stringify(IOD_Execution_Mapping));
						
						}}
						
					});
					
					
					
					
					
					
				}} catch (e) {
					logger.error(e.stack);
				}
			}, function() {
				logger.fatal("scheduledJob has been stopped");
			},
			true
			);
		} catch (e) {
			logger.fatal("Invalid Cron Pattern %s", cron_time);
			logger.fatal(e.stack);
			return;
		}
	}

}

module.exports = IPSoftAPIEconomyAdapter;

//var initialize = exports.initialize = function() {
//	try {
//		var cron_time = "10 * * * * *";
//		logger.info("using cron time : %s", cron_time);
//		var scheduledJob = new CronJob(cron_time, function() {
//				try {
//					logger.info("execute adapter..." + cron_time);
//					
//					// Get status update from API Economy and update IOD_Execution_Mapping
//					
//					var clientInput={
//						       "clientId": "GBS"
//					}
//					
//					logger.info("clientInput before making call to get status"+ clientInput);
//					getStatus(function(err, result){
//						
//						var resultHardCoded ={
//								
//						          "updates" : [
//						                       {
//						      	             "update" : {
//						      	                  "goldenBridgeEventId" : "",   	//mandatory
//						      	                  "automationId" : "",	         	//mandatory
//						      	                  "status" : "",			 //mandatory
//						      	                  "logDetails" : "",
//						      	                  "solutionCode" : "",
//						      	                  "failureCode" : "",
//						      	                  "estimatedWaitTime" : "",
//						      	                  "automataStartTime" : "",
//						      	                  "automataFinishTime" : "",
//						      	                  "updateTime" : ""		 //mandatory
//						      	             }}
//						      	      ]
//								
//
//						      };
//
//						if(err){
//							logger.info(" got error ");
//						}
//						else{
//							if(resultHardCoded!=null){
//								var updates = resultHardCoded.updates;
//								for(var i = 0 ; i< updates.length ; i++){
//										logger.info("response updates from api economy; "+ updates[i]);
//										var timestamp = new Date().getTime();
//										var execution = {
//											execution_id : timestamp,
//											name : "IPSoft API Economy Automaton Execution status",
//											status : "In Progress"
//										};
//										
//										// could not understand how to update IOD_Execution_Mapping, need to know from YaBin
//									
//								}
//								
//
//								
//							}
//							
//						}
//					});
//					
//				} catch (e) {
//					logger.error(e.stack);
//				}
//			}, function() {
//				logger.fatal("scheduledJob has been stopped");
//			},
//			true
//		);
//
//	} catch (e) {
//		logger.fatal("Invalid Cron Pattern %s at %s", cron_time, __dirname + "\\index.js");
//		logger.fatal(e.stack);
//		return;
//	}
//}
//
//
//
var getAPIeStatus = function(reqpath,clientInput, callback){
	
	//var clientInput={
	//	       "clientId": client_id
//	};
	logger.info("reqpath----in post method"+ reqpath);
	
	logger.info("req----"+ JSON.stringify(clientInput));
	// retrieve connection info from config file
	var right_ipsoftapieconomy_adpater_connection = null;
	var ipsoftapieconomy_adapter_connections = adpaters_config_info.adapters.IPSoftAPIEconomyAdapter.connections;
	right_ipsoftapieconomy_adpater_connection = ipsoftapieconomy_adapter_connections[0].connection;
	if (right_ipsoftapieconomy_adpater_connection == null) {
		return callback(new Error(
				"can not find the connection info of the specified ipsoft apieconomy instance"));
	}
	var connectionProperties = right_ipsoftapieconomy_adpater_connection.connectionProperties;
	var connectionHostPort = "";
	if (connectionProperties.port) {
		connectionHostPort = connectionProperties.host + ":"
				+ connectionProperties.port;
	} else {
		connectionHostPort = connectionProperties.host;
	}
	var base_connection_path = connectionProperties.protocol + "://" +
			connectionProperties.host +":"+connectionProperties.port; 

	var credentials_username = connectionProperties.authetication.userId;
	var credentials_password = connectionProperties.authetication.password;
	var client_id = connectionProperties.ipsoft_client_id;
	var path = connectionProperties.path;
	var goldenbridge_id_for_apie= null;
	if(reqpath=="create"){
		var goldenbridge_id_for_apie= connectionProperties.goldenbridge_id_for_apie_create;
	}else{
		var goldenbridge_id_for_apie= connectionProperties.goldenbridge_id_for_apie_status+"/responder";
	}

	
	var keyPath = "../../../../../config/cert"+connectionProperties.certificates.key;
	var certPath = "../../../../../config/cert"+connectionProperties.certificates.cert;
	var caPath = "../../../../../config/cert"+connectionProperties.certificates.ca;
	logger.info("keypath---------"+keyPath);
	var host = connectionProperties.host;
	var url= path + goldenbridge_id_for_apie;
	logger.info(" apie url from code:::: "+ base_connection_path+url);
	this.auth_header = null;
	var option = {
			method: "POST",
			port: connectionProperties.port,
			hostname: host,
			path: url,
			headers: {
				"Content-Type": "application/json"
				
			},
			
			key: fs.readFileSync(path1.join(__dirname, keyPath)),
			cert: fs.readFileSync(path1.join(__dirname,certPath )),
			ca: fs.readFileSync(path1.join(__dirname, caPath)),
			rejectUnauthorized: false
	}
	var req = https.request(option, function(res) {
		var data = '';
					
			res.on("data", function(chunk) {
				data += chunk;
		});
		res.on("end", function() {
				try {
					if (res.statusCode != 200) {
						logger.info("got status not ok 200 response from apie instance");
					return callback(new Error(data ));
						//return callback(null, resultHardCoded)
					}
					logger.info("got status ok 200 response from apie instance");
					//var result = JSON.parse(data);
					var result = data;
					
				/*	result={
							  "updates": [
							              {
							                "update": {
							                  "goldenBridgeEventId": "b52c15da-6874-46a9-af44-daa0f128b941|(0)",
							                  "automationId": "19036",
							                  "status": "Problem_Submittal",
							                  "logDetails": "IPcenter received following alert:\n\n** PROBLEM - gbs-ipsoft1.gbs.gbs\/gbs-ipsoft1.gbs;IGA:SWB:UNIX:IGA:UNIX:SWB:D:W:GBS:Java Exception Log Entries;b52c15da-6874-46a9-af44-daa0f128b941|(1) is WARNING **\n\nIPautomata is determining if automated solution available.\n\n\n----------------------\nTracking ID:[23126][ibmdev]\n",
							                  "solutionCode": "",
							                  "failureCode": "",
							                  "estimatedWaitTime": "",
							                  "automataStartTime": "",
							                  "automataFinishTime": "",
							                  "updateTime": "2016-03-02T07:02:04.946Z"
							                }
							              },
							              {
							                "update": {
							                  "goldenBridgeEventId": "b52c15da-6874-46a9-af44-daa0f128b941|(0)",
							                  "automationId": "19037",
							                  "status": "Problem_Submittal",
							                  "logDetails": "IPcenter received following alert:\n\n** PROBLEM - gbs-ipsoft1.gbs.gbs\/gbs-ipsoft1.gbs;IGA:SWB:UNIX:IGA:UNIX:SWB:D:W:GBS:Java Exception Log Entries;b52c15da-6874-46a9-af44-daa0f128b941|(0) is WARNING **\n\nIPautomata is determining if automated solution available.\n\n\n----------------------\nTracking ID:[23127][ibmdev]\n",
							                  "solutionCode": "",
							                  "failureCode": "",
							                  "estimatedWaitTime": "",
							                  "automataStartTime": "",
							                  "automataFinishTime": "",
							                  "updateTime": "2016-03-02T07:02:15.020Z"
							                }
							              }
							            ]
							          };*/
					logger.info("response received from apie: " + result);
					callback(null, result);
				} catch (e) {
					callback(e);
				}
			});
		});
		req.on("error", function(e) {
			logger.info("error message: " + e.message);
			logger.error(e);
			callback(e);
	});
		req.write(JSON.stringify(clientInput));
		//logger.info("req" + req);
		req.end();

	
}

