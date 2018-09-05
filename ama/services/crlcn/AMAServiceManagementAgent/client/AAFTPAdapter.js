/**
 * AA Automata APIs Client
 */
var fs = require("fs");
var path = require("path");
var adpaters_config_info = require("../../../../../config/automation_adapter_config.json");
var ftp_handle = require("../../../../common/FileDispatcher");

var logger = getLogger("APP");
var IOD_Execution_Mapping = {};

var AAFTPAdapterClient = function() {

	var self = this;
	var AA_FILE_PREFIX= "GBServiceInput";

	this.execute = function(IOD, callback) {
		IOD.connectionId = "1";
		logger.info('=============IOD=================>');
		logger.info(JSON.stringify(IOD));
		//need to uncomment
		var automationFileNameSuffix = IOD.WorkflowAutomationID;
		var timestamp = new Date().getTime();
		//var automationFileNameSuffix = IOD.ticketID;
		var automationAAFTPTransferFileName = AA_FILE_PREFIX + "_"+automationFileNameSuffix+"_"+timestamp+".csv";
		/*if (IOD.AutomationInput) {
			IOD.inputParameters = {};
			for (var i = 0; i < IOD.AutomationInput.length; i++) {
				var input = IOD.AutomationInput[i];
				try {
					for ( var key in input) {
						IOD.inputParameters[key] = input[key];
					}
				} catch (e) {
					logger.info(e);
				}
			}
		}*/

		// retrieve required info from IOD and related config file
		var right_aa_adpater_connection = null;
		var aa_adapter_connections = adpaters_config_info.adapters.AAAdapter.connections;
		for (var i = 0; i < aa_adapter_connections.length; i++) {
			logger.info("aa_adapter_connections[i].connection.connectionId :"+aa_adapter_connections[i].connection.connectionId);
			logger.info("IOD.connectionId:"+IOD.connectionId);
			if (aa_adapter_connections[i].connection.connectionId == IOD.connectionId) {
				right_aa_adpater_connection = aa_adapter_connections[i].connection;
			}
		}

		if (right_aa_adpater_connection == null) {
			logger.info("Error 1");
			return callback(new Error(
					"can not find the connection info of the specified blueprism instance"));
		}
        logger.info("Outside Error 1");
		// retrieve the info of the specified automation process
		/*var right_automation_process = null;
		var automation_processes = right_aa_adpater_connection.automationProcesses;
		for (var j = 0; j < automation_processes.length; j++) {
			logger.info("automation_processes[j].processId :"+automation_processes[j].processId);
			logger.info("IOD.WorkflowAutomationID:"+IOD.WorkflowAutomationID);
			
			if (automation_processes[j].processId == IOD.WorkflowAutomationID) {
				right_automation_process = automation_processes[j];
			}
		}

		if (right_automation_process == null) {
			logger.info("Error 2");
			return callback(new Error(
					"can not find the automation process info of the specified blueprism instance"));
		}
*/
		logger.info("Outside Error 2");   
		var execution = {
			execution_id : timestamp,
			name : "AA Automaton Execution",
			status : "In Progress"
		};

		var connectionProperties = right_aa_adpater_connection.connectionProperties;
		var host = connectionProperties.host;
		var port = connectionProperties.port;
		var timeout = connectionProperties.timeout;
		var tls = connectionProperties.tls;
		var uid = connectionProperties.authentication.userId;
		var pwd = connectionProperties.authentication.password;
		
		var connectionProp = {
			    host: host,
			    user: uid,
			    password: pwd
			};
		
		
		// to asynchronously invoke the FTP Client to upload a file and record the status info
		try {
			logger.info("FTP client is to be created - File Name "+automationAAFTPTransferFileName);
			//Prepare file from IoD
			logger.info("Ticket ID :" + IOD.ticketID);
			logger.info("Automation Input :" + JSON.stringify(IOD.AutomationInput[0]));
			//var jsonObj = JSON.parse(IOD.AutomationInput[0]);
			//
			var incomingJsonObj = null;
			var jsnObj = {};
			var csvStr = "Params, Value\r\n" +"AutomationID," + IOD.ticketID + "\r\n";
			if (IOD.AutomationInput.length  == 2){
				logger.info("====inside 2=====");
				jsnObj["Param1"] = IOD.AutomationInput[0].param1;
				csvStr = csvStr + "Param1, " + IOD.AutomationInput[0].param1;
				logger.info("Automation Input Parameter 1 :" + IOD.AutomationInput[0].param1);
			}else{
				logger.info("====inside 1=====");
				incomingJsonObj = JSON.parse(IOD.AutomationInput[0]);
				jsnObj["Param1"] = incomingJsonObj[0].param1;
				csvStr = csvStr + "Param1, " + incomingJsonObj[0].param1;
				logger.info("Automation Input Parameter 1 :" + incomingJsonObj[0].param1);
			} 
			logger.info("Content to Save in CSV :\r\n" + csvStr + "\r\n");
			var filePath = path.resolve("temp");
			var fileName = automationAAFTPTransferFileName; 
			
			fs.writeFile(filePath + '/' + fileName, csvStr, (err) => {
			  if (err) {
				  logger.info(err)
			  } else {
				  ftp_handle.transferFileToAutomationServer(connectionProp, filePath, fileName, function(err) {
						if(err) {
							execution.status = "error";
							IOD_Execution_Mapping[IOD.ticketID] = execution;
							logger.info("File Not Uploaded!!!!");
							logger.info(err);
							callback(err);
						} else {
							execution.status = "In Progress";
							IOD_Execution_Mapping[IOD.ticketID] = execution;
							logger.info("File Uploaded Successfully!!!!");
							callback(null, execution);
						}
					});
			  }
			  
			});
		} catch (e) {
			logger.error(e);
			execution.status = "error";
			IOD_Execution_Mapping[IOD.id] = execution;
			callback(e);
		}
	}

	this.getStatus = function(IOD, callback) {
		// check the in-memory variables
		var status = IOD_Execution_Mapping[IOD.ticketID].status;
		callback(null, status, IOD_Execution_Mapping[IOD.ticketID]);
	}

}

module.exports = AAFTPAdapterClient;
