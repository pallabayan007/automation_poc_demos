/**
 * AA Automata APIs Client
 */
var adpaters_config_info = require("../../../../../config/automation_adapter_config.json");
var http = require("http");
var logger = getLogger("APP");
var IOD_Execution_Mapping = {};
var fs = require("fs");

var AARESTAdapterClient = function() {

	var self = this;
	var AA_FILE_PREFIX= "GBInput";

	this.execute = function(IOD, callback) {
		IOD.connectionId = "1";
		logger.info(JSON.stringify(IOD));
		var automationFileNameSuffix = IOD.WorkflowAutomationID;

		// retrieve required info from IOD and related config file
		var right_aa_adpater_connection = null;
		var aa_rest_adapter_connections = adpaters_config_info.adapters.AARESTAdapter.connections;
		right_aa_adpater_connection = aa_rest_adapter_connections[0].connection;

		if (right_aa_adpater_connection == null) {
			logger.info("Connection Properties Not Found");
			return callback(new Error(
					"can not find the connection info of the specified Automation Anywhere instance"));
		}
   
		var timestamp = new Date().getTime();
		var execution = {
			execution_id : timestamp,
			name : "AA Automaton Execution",
			status : "In Progress"
		};

		var connectionProperties = right_aa_adpater_connection.connectionProperties;
		logger.debug("connectionProperties "+JSON.stringify(connectionProperties));
		
		// to asynchronously invoke the FTP REST service to upload a file and record the status info
		try {
			logger.info("Ticket ID :" + IOD.ticketID);
			logger.info("Full Automation Input :" + JSON.stringify(IOD.AutomationInput));
			logger.info("File Path :" + connectionProperties.filePath);
			logger.info("File Extension :" + connectionProperties.fileType);
			
			logger.info("Payload Details");
			var jsonStr = JSON.parse(IOD.AutomationInput[1]);
			jsonStr["AutomationID"] = IOD.ticketID;
			jsonStr["ProcessInstanceID"] = IOD.processInstanceID;
			jsonStr["gbDomain"] = IOD.AutomationInput[0]["gbDomain"];
			var fileStr = "";
			
			for(var myKey in jsonStr) {
			   logger.info("key:"+myKey+", value:"+jsonStr[myKey]);
			   fileStr = fileStr + myKey + " : " + jsonStr[myKey] + "\r\n";
			}
			logger.info("Payload Details");
			
			//call the REST service
			callFTPRESTService(connectionProperties, jsonStr, function (error,result){
				if (error) {
					execution.status = "error";
					IOD_Execution_Mapping[IOD.ticketID] = execution;
					logger.info("File Not Saved!!!!");
					logger.info(err);
					callback(err);
				  } else {
					execution.status = "In Progress";
					IOD_Execution_Mapping[IOD.ticketID] = execution;
					logger.info("File Saved Successfully!!!!");
					callback(null, execution);
				  }
			});
			
			//Saving File in local machine
			/*fs.writeFile(connectionProperties.filePath + connectionProperties.fileName + "_" + Date.now() + "." + connectionProperties.fileType, fileStr, function(err) {
			  if (err) {
				execution.status = "error";
				IOD_Execution_Mapping[IOD.ticketID] = execution;
				logger.info("File Not Saved!!!!");
				logger.info(err);
				callback(err);
			  } else {
				execution.status = "In Progress";
				IOD_Execution_Mapping[IOD.ticketID] = execution;
				logger.info("File Saved Successfully!!!!");
				callback(null, execution);
			  }
			  
			});*/
			//Saving file in local machine
			
		} catch (e) {
			logger.error(e);
			execution.status = "error";
			IOD_Execution_Mapping[IOD.id] = execution;
			callback(e);
		}
	}

	
	//Calling External Rest
	
	
	var callFTPRESTService = function(connectionProperties,jsonContent, callback) {
		logger.info("callFTPRESTService jsonContent %s", JSON.stringify(jsonContent));
		logger.info("Port "+connectionProperties.port + " host "+connectionProperties.host + " path " + connectionProperties.path);
		var option = {
			method : "POST",
			port : connectionProperties.port,
			hostname : connectionProperties.host,
			path : connectionProperties.path,
			//TODO::have to make the header with basic authentication
			headers : {
				"Content-Type" : "application/json",
				//"Authorization" : SOPConfig.basicAuthHeader,
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
					callback(null, result);
				} catch (e) {
					callback(e);
				}
			});
		});
		req.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});

		req.write(JSON.stringify(jsonContent));
		req.end();
	}
	
	
	
	
	
	
	//Calling External Rest
	
	
	
	
	this.getStatus = function(IOD, callback) {
		// check the in-memory variables
		var status = IOD_Execution_Mapping[IOD.ticketID].status;
		callback(null, status, IOD_Execution_Mapping[IOD.ticketID]);
	}

}

module.exports = AARESTAdapterClient;
