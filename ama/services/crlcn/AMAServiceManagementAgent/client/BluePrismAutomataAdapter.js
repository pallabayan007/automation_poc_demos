/**
 * BluePrism Automata APIs Client
 */

var soap = require('soap');
var AMAServiceManagementAgent = require("../../../../../ama/services/crlcn/AMAServiceManagementAgent")
var adpaters_config_info = require("../../../../../config/automation_adapter_config.json");
var ticket_param_info = require("../../../../../config/ticket_param.json");
//var ticket_info = require("../../../../../config/ticket.json");
var fs = require("fs");

var logger = getLogger("BluePrismAutomataClient");
var IOD_Execution_Mapping = {};
var clientName;
var accountName;
var eventType;
var ticket_param_array;

var BluePrismAutomataClient = function(botconn) {

	
	var self = this;

	this.execute = function(IOD, callback) {

		//IOD.connectionId = "2";
		IOD.connectionId = botconn;
		//IOD.WorkflowAutomationID = "TestNumberProcess";
		logger.info(' Check IOD=================>');
		logger.info("IOD received ---"+JSON.stringify(IOD));

		var right_blueprism_adpater_connection = null;
		var blueprism_adapter_connections = adpaters_config_info.adapters.BluePrismAdapter.connections;
							
//		//Reading the ticket.json
//		ticket_info = AMAServiceManagementAgent.FileRead("\config\\ticket.json");
//		logger.info("ticket.json value: " + ticket_info);
		var contents = fs.readFileSync("\config\\ticket.json");
		logger.info("+++++++======= Ticket contents: " + contents);
		var ticket_info = JSON.parse(contents);
		
		var ticket_params = ticket_param_info.param;
		logger.info("ticket_params: " + ticket_params);
		
		if(!ticket_params == null || !ticket_params == ''){
			logger.info("ticket_param_array creation");
			ticket_param_array = ticket_params.split(',');
			logger.info("ticket_param_array.length: " + ticket_param_array.length);
		}
		
		
		if(IOD.hasOwnProperty('alert_audit_log'))
		{
			/*if(IOD.alert_audit_log.alertName!=null){
			clientName = IOD.alert_audit_log.
			logger.info("clientName"+clientName);
			accountName = IOD.account;
			}*/
			logger.info("Comes to alert part=========");
			for (var i = 0; i < blueprism_adapter_connections.length; i++) {
			if (blueprism_adapter_connections[i].connection.connectionId == IOD.connectionId) {
				right_blueprism_adpater_connection = blueprism_adapter_connections[i].connection;
				logger.info("1");
				}
			}

		}
		if(IOD.hasOwnProperty('ticket_audit_log'))
		{
			logger.info("Comes to ticket part=========");
			if(IOD.ticket_audit_log.ticketKey!=null){
			//clientName = (IOD.ticket_audit_log.ticketKey).substring(0, IOD.ticket_audit_log.ticketKey.indexOf("."));
//			clientName="suntrust";
			logger.info("clientName  "+IOD.client);
			accountName = IOD.account;
			}
			for (var i = 0; i < blueprism_adapter_connections.length; i++) {
			if (blueprism_adapter_connections[i].connection.connectionId == IOD.connectionId) {
				right_blueprism_adpater_connection = blueprism_adapter_connections[i].connection;
				logger.info("1");
				}
			}
		}

		// retrieve required info from IOD and related config file		

		if (right_blueprism_adpater_connection == null) {
			logger.info("2");
			return callback(new Error(
					"can not find the connection info of the specified blueprism instance"));
		}

		// retrieve the info of the specified automation process
		var right_automation_process = null;
		var automation_processes = right_blueprism_adpater_connection.automationProcesses;
		logger.info("automation_processes"+JSON.stringify(automation_processes));
		logger.info("IOD.WorkflowAutomationID: "+JSON.stringify(IOD.WorkflowAutomationID));
		logger.info("automation_processes.length: "+JSON.stringify(automation_processes.length));
		for (var j = 0; j < automation_processes.length; j++) {
			if (automation_processes[j].processId == IOD.WorkflowAutomationID) {
				//if (automation_processes[j].processId == 'IBPGBGateway') {
				logger.info("3====>");
				right_automation_process = automation_processes[j];
			}
			else if(IOD.WorkflowAutomationID == 'Camunda'){
				logger.info("Inside BP Adapter camunda call reference====>");
				right_automation_process = automation_processes[j];				
			}
		}

		if (right_automation_process == null) {
			return callback(new Error(
					"can not find the automation process info of the specified blueprism instance"));
		}

		var timestamp = new Date().getTime();
		var execution = {
			execution_id : timestamp,
			name : "BluePrism Automaton Execution",
			status : "In Progress"
		};
		

		// identify the right web service to invoke, including: endpoint,
		// parameter lists, actual values of parameters,
		// access credentials of blueprism instance
		// var url = "http://9.121.230.73:8181/ws/SAPCheckLockEntriesNew?wsdl";
		var connectionProperties = right_blueprism_adpater_connection.connectionProperties;
		var connectionHostPort = "";
		if (connectionProperties.port) {
			connectionHostPort = connectionProperties.host + ":"
					+ connectionProperties.port;
		} else {
			connectionHostPort = connectionProperties.host;
		}
		var base_connection_path = connectionProperties.protocol + "://"
				+ connectionHostPort;
		// "http://cap-sg-prd-1.integration.ibmcloud.com:15043/ws/SAPCheckLockEntriesNew?wsdl";
		// var endpoint = http://JBISWAS1:8181/ws/SAPCheckLockEntriesNew

		var available_endpoint = base_connection_path
				+ right_automation_process.epuri;
		var available_wsdl_location = base_connection_path
				+ right_automation_process.wsdlLocation;
		
		logger.info('Available_Endpoint ======== >'+available_endpoint);
		logger.info('Available WSDL location ========> '+available_wsdl_location);

		var options = {
			endpoint : available_endpoint,
			wsdl_headers: {connection:'keep-alive'}
		};
		
		logger.info('Option in blueprism adapter =========== > '+JSON.stringify(options));
		// var credentials_username = 'admin';
		// var credentials_password = 'SniMadhav3@';
		// var function_name = 'SAPCheckLockEntriesNew';

		var credentials_username = connectionProperties.authetication.userId;
		var credentials_password = connectionProperties.authetication.password;
		var function_name = right_automation_process.operation;
		var client = connectionProperties.client;
		var account = connectionProperties.account;
		var processName ;
		var workqueue;
		var gbDomain;
		var InputString;
		var Request;
		logger.info('Available function_name ========> '+function_name);
		
		
		if (IOD.AutomationInput) {
			IOD.inputParameters = {};
			if(!clientName ){
				IOD.inputParameters["clientId"] = IOD.client;
			}else{
				IOD.inputParameters["clientId"] = clientName;
			}
			if(!accountName ){
				IOD.inputParameters["accountId"] = IOD.account;
			}else{
				IOD.inputParameters["accountId"] = accountName;
			}
			
			
			if(IOD.hasOwnProperty("ticketID")){
				//myCacheSession.set("ticketkey",IOD.ticketNumber);
				myCacheSession.set("eventId",IOD.ticketID);
				myCacheSession.set("status",null);
				IOD.inputParameters["gbEventId"] = IOD.ticketID;
				IOD.inputParameters["gbEventType"] = "ticket";
			}
			else if (IOD.hasOwnProperty("alert_audit_log")){
				logger.info("Comes to inputParameters part=======>");
				IOD.inputParameters["gbEventId"] = IOD.alert_audit_log._id;
				IOD.inputParameters["gbEventType"] = "alert";
				var aaaa=IOD.alert_audit_log.customizedInputParams;
				logger.info("arijit 158===== >"+JSON.stringify(aaaa));
				//IOD.inputParameters["customizedInput"]=aaaa;
				//IOD.inputParameters["InputString"]=aaaa;
				IOD.inputParameters["InputString"]=JSON.parse(aaaa);
			}
			if(IOD.hasOwnProperty("processInstanceID")){
				IOD.inputParameters["pid"] = IOD.processInstanceID;
				logger.info("====Inside process instance id update in adapter====");
			}
			
						
			logger.info("ticket_param_array.length: " + ticket_param_array.length);
			for(var t_info = 0; t_info<ticket_param_array.length; t_info++){
				logger.info("==ticket_info inside for loop: " + JSON.stringify(ticket_info));
				logger.info("==ticket_param_array[t_info] inside for loop: " + ticket_param_array[t_info]);
				if(ticket_info.hasOwnProperty(ticket_param_array[t_info])){
					
					var input_param = ticket_param_array[t_info];
					logger.info("=====input_param:  " + input_param);
					IOD.inputParameters[input_param] = ticket_info[input_param];
					logger.info("=====ticket_info.input_param:  " + ticket_info[input_param]);
				}
			}
			/*if(IOD.hasOwnProperty("bpmnProcessName")){
				IOD.inputParameters["pname"] = IOD.bpmnProcessName;
			}*/
			logger.info("IOD inputParameters check=========== > "+JSON.stringify(IOD.inputParameters));
			logger.info("in this automationinput" + IOD.AutomationInput.length);
			for (var i = 0; i < IOD.AutomationInput.length; i++) {
				var input = IOD.AutomationInput[i];
				logger.info("in this input" + JSON.stringify(input));
				if(input.hasOwnProperty("roboProcessName")){					
					processName = input.roboProcessName;
					IOD.inputParameters["roboProcessName"] = processName;
					logger.info("in this processname " + processName);
				}if(input.hasOwnProperty("workQueue")){
					workQueue =input.workQueue;
					logger.info("in this workqueue " + workQueue);
					IOD.inputParameters["workQueue"] = workQueue;
				}if(input.hasOwnProperty("gbDomain")){
					gbDomain =input.gbDomain;
					logger.info("in this gbDomain " + gbDomain);
					IOD.inputParameters["gbDomain"] = gbDomain;
				}if(input.hasOwnProperty("InputString")){
					InputString =input.InputString;
					logger.info("in this InputString " + InputString);
					IOD.inputParameters["InputString"] = InputString;
				}
				
				
				try {
					input = JSON.parse(input);
					logger.info("in this input 2" + JSON.stringify(input));
					for ( var key in input) {
					
						IOD.inputParameters[key] = input[key];
						logger.info("in this section" + key)
					}
				} catch (e) {
					// IOD.inputParameters = input;
				}
			}
			}
		
		

		// to asynchronously invoke the web service and record the status info
		// locally (e.g., saved as in-memory variables)
		try {
			logger.info("Soap client is to be created. ");
			
			
			

			logger
					.info("Soap client function is to be invoked. "+JSON.stringify(IOD.inputParameters));
			soap
					.createClient(
							available_wsdl_location,
							options,
							function(err, client) {
								logger.info("Soap client has been created. ");
								if (err) {
									// set err message
									logger.error(err);
									// update execution status
									execution.status = "error";
									execution.errorMessage = err.message;
									IOD_Execution_Mapping[IOD.ticketID] = execution;
									
									myCacheSession.set("status","Error");

									if (err.message == 'connect ECONNREFUSED') {
										callback(new Error(
												'Management system not working'));
									} else {
										callback(err);
									}
									return;
								}
								logger.info("Before client.setsecurity.");
								client.setSecurity(new soap.BasicAuthSecurity(
										credentials_username,
										credentials_password));
								var toInvokeFunction = client[function_name];
								var args ={};
								var args1 = "";
								var obj=IOD.inputParameters;
							    var obj1=JSON.stringify(obj);
							    //var obj1=JSON.stringify({"Email":"arichatt@in.ibm.com"});
							    logger.info("obj==."+JSON.stringify(obj));
							    logger.info("obj1==."+obj1);
							    args.Request=obj1;
							    logger.info("args==."+JSON.stringify(args));
								toInvokeFunction(
										args,
										function(err, result) {
											logger.info("Soap client function has been invoked. ");
											if (err) {
												// set err message
												logger.error(err);												
												logger.error(err.message);
												logger.info("====Got Error in SOAP CAll====");
												// update execution status
												execution.status = "error";
												IOD_Execution_Mapping[IOD.ticketID] = execution;
												
												myCacheSession.set("status","Error");
											}

											try {
												if (result) {
													logger.info("result in blueprism adapter ------" + JSON.stringify(result));
													//result = {"FinalOutcome":{"attributes":{"xsi:type":"xs:string"},"$value":"[{\"gvEventId\":\"5796037b9565403b00ed28e7\",\"message\":\"Queued\",\"statusCode\":\"1\",\"acknowledge\":\"Received\"}]"}};
													if (result.hasOwnProperty("FinalOutcome")) {

														var finalReturnObj = JSON
																.parse(result.FinalOutcome.$value);
														result = finalReturnObj;
logger.info("value ............."+ JSON.stringify(result));

for(var i in result){
	logger.info("result[i].statusCode" + result[i].statusCode);
	if (result[i].statusCode == null) {
		// set err message
		logger.info("result[i].statusCode" + i + ":" + result[i].statusCode);
		logger
				.error(new Error(
						result));
		// update execution
		// status
		execution.status = "error";
		execution.errorMessage = "the returned result is not valid";
		IOD_Execution_Mapping[IOD.ticketID] = execution;
		
		myCacheSession.set("status","Error");
	} else {
		// set the status
		logger.info("result  at no 2 ::" +JSON.stringify(result));
		// update execution
		// status
		if (result[i].statusCode == '1') {
			logger.info("result  is fine ");
			
			myCacheSession.set("status","In Progress");
			//execution.status = "complete";
			//execution.returnedOutputMessages = result.returnedMessages;
		//	IOD_Execution_Mapping[IOD.ticketID] = execution;
			callback(null, execution);
		} else if (result[i].statusCode == '0') {
			execution.status = "error";
			execution.errorMessage = result.errorMessage;
			IOD_Execution_Mapping[IOD.ticketID] = execution;
			
			myCacheSession.set("status","Error");
			callback(null, execution);
		}
		//IOD_Execution_Mapping[IOD.ticketID] = execution;
	}
}
														
													}else{
														execution.status = "error";
														execution.errorMessage = "the returned result is not valid";
														IOD_Execution_Mapping[IOD.ticketID] = execution;
														logger.info("the returned result is not valid");
														
														myCacheSession.set("status","Error");
														callback(null, execution);
													}
												}
											} catch (e) {
												execution.status = "error";
												execution.errorMessage = "the returned result is not valid";
												IOD_Execution_Mapping[IOD.ticketID] = execution;
												
												myCacheSession.set("status","Error");
												callback(null, execution);
											}

										});

								// execute the callback function;
								// set the error message or the initial status
								// info (e.g.,
								// data.execution_id;
								// data.name
								// data.status ["start"?, "complete" right]
								IOD_Execution_Mapping[IOD.ticketID] = execution;
								logger
										.info("finish the invocation. wait for the result...");
								//callback(null, execution);
							}, null, {connection:'keep-alive'});
		} catch (e) {
			logger.error("its here -----------"+e);
			// update execution status
			execution.status = "error";
			IOD_Execution_Mapping[IOD.id] = execution;
			
			myCacheSession.set("status","Error");
			callback(e);
		}
	}

	this.getStatus = function(IOD, callback) {
		// check the in-memory variables
		var status = IOD_Execution_Mapping[IOD.ticketID].status;
		callback(null, status, IOD_Execution_Mapping[IOD.ticketID]);
	}

}

module.exports = BluePrismAutomataClient;
