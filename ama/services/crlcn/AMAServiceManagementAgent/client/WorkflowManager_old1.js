var request = require('request');
var async = require('async');
var config_info = require("../../../../../config/workflow_manager_config.json");
var models = require("../../../../../models"); 
var TicketAuditLog = models.TicketAuditLog;

var logger = getLogger("WorkflowManager");
var IOD_Execution_Mapping = {};

var connectionProperties = config_info.adapters.WorkflowManagerAdapter.connection.connectionProperties;

var WorkflowManager = function() {
	
	this.execute = function(IOD, callback){
		logger.info("IOD Received : " + JSON.stringify(IOD));
		logger.info("Ticket Key in IOD : " + IOD.ticket_audit_log.ticketKey);
		logger.info("BPMN Key in IOD : " + IOD.bpmnProcessName);
		var bpmnProcessName = IOD.bpmnProcessName;
		var processInstanceId = "";
		var taskID = "";
		
		
		async.waterfall([
					
		function(callback){
			//Instantiate A BPMN Flow Starts
			var options_proc_start = {
			  uri: connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/process-definition/key/' + bpmnProcessName + '/start',
			  method: 'POST',
			  auth: {
				'user': connectionProperties.authetication.userId,
				'pass': connectionProperties.authetication.password,
				'sendImmediately': true
			  },
			  header: {
				 "Content-Type": "application/json"
			  },
			  json: {}
			};
			
			logger.info("options_proc_start : " + JSON.stringify(options_proc_start));
//			logger.info("IOD from getBPMNProcess:" + JSON.stringify(IOD));
			
			request(options_proc_start, function (err, response_proc_start, body_proc_start){
				logger.info("Status from callBPMNProcessStart: " + response_proc_start.statusCode);
				if(!err && response_proc_start.statusCode == 200) {
					//Get Instance ID Starts					
					processInstanceId = body_proc_start.id;
					IOD["processInstanceID"] = processInstanceId;
					logger.info("Instance ID from callBPMNProcessStart:  " + processInstanceId);
//					logger.info("===========IOD Instance ID from callBPMNProcessStart:" + IOD.processInstanceId);
					callback(null, processInstanceId);
				}else{
					logger.info("BPMN Process Instance Not Started :" + response_proc_start.statusCode);
					callback(err, "Error occurred in get process instance");
				}			
			});					
		},		
		function(processInstanceId, callback){			
//			logger.info("IOD from getBPMNTask:" + JSON.stringify(IOD));
			var options_get_task = {
					  uri: connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/task/?processInstanceId=' + processInstanceId,
					  method: 'GET',
					 auth: {
						'user': connectionProperties.authetication.userId,
						'pass': connectionProperties.authetication.password,
						'sendImmediately': true
					},

					  header: {
						 "Content-Type": "application/json"
					  },
					};
					
					logger.info("options_get_task from getBPMNTask : " + JSON.stringify(options_get_task));
					request(options_get_task, function (err, response_get_task, body_get_task) {
						 console.log("Status :" + response_get_task.statusCode);
						  logger.info("Status from getBPMNTask:" + response_get_task.statusCode);
						  if (!err && response_get_task.statusCode == 200) {
							  	console.log(body_get_task);
								logger.info("body_get_task from getBPMNTask: " + JSON.stringify(body_get_task));
								taskID = JSON.parse(body_get_task)[0].id;
								logger.info("BPMN Currently Running Task ID :" + taskID);
								callback(null, processInstanceId, taskID);
						  }
						  else {
								logger.info("BPMN Process Instance Started, But Task ID not Retrieved");
								callback(err, "error occurred in get task")
							  }
					});	  
		},		
		function(processInstanceId, taskID, callback){
			
//			logger.info("IOD from completeBPMNTask:" + JSON.stringify(IOD));
			logger.info("task id from completeBPMNTask: " + taskID);
			
			//Completing User Task
			var options_task_complete = {
			  uri: connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/task/' + taskID + '/complete',
			  method: 'POST',
			  		  auth: {
						'user': connectionProperties.authetication.userId,
						'pass': connectionProperties.authetication.password,
						'sendImmediately': true
					  },

			  header: {
				 "Content-Type": "application/json"
			  },
			  json: {
				"variables": 
					{"ticket":{
						"value": JSON.stringify(IOD), 
						"type": "json", 
						"valueInfo":{"serializationDataFormat":"application/json"}
						}
					}
			  }

			};

			logger.info("OPTION :" + JSON.stringify(options_task_complete));
			request(options_task_complete, function (err, response_1, body_1) {
				  logger.info("\n\nStatus Code task_complete :" + response_1.statusCode);
				  if (!err && response_1.statusCode == 204) {
					logger.info("BPMN Process Instance Started and Initial Data Loaded");
					updateTicketAuditLog(IOD.ticket_audit_log, processInstanceId);
					callback(null, processInstanceId);
				  } else {
					logger.info("BPMN Process Instance Started, But Initial Data Load Failed :");
					logger.info(error_1);
					callback(err, "error occurred in task complete");
				  }
			});
			
		},
		function(processInstanceId, callback){
			logger.info("IOD after async call:" + JSON.stringify(IOD));
			logger.info("processInstanceId after async call:" + processInstanceId);
			IOD["processInstanceID"] = instanceID;
			callback(null, IOD, processInstanceId);
		}
		], function (err) {
		    if (err) {
		        //handle readFile error or processFile error here
		    	if(err){
		    		console.log('Error :: \n' + err);
		    		logger.error('Error :: \n' + err);
		    	}
		    }
		});
		
		
	}
	
		
	/*
	 * Automation Status Query Method
	 */
	this.getStatus = function(IOD, callback) {
		// check the in-memory variables
		
		var status = IOD_Execution_Mapping[IOD.ticketID].status;
		callback(null, status, IOD_Execution_Mapping[IOD.ticketID]);
	}
	

	var make_base_auth = function (user, password) {
		var tok = user + ':' + password;
		var hash = new Buffer((tok)).toString('base64');
		return"Basic "+ hash;
	}
	
	
	var updateTicketAuditLog = function(ticketAuditLog, pid){
		var id = ticketAuditLog._id;
		var content = ticketAuditLog;
		content.bpmnProcessInstance = pid;
		/*if(content._id){
			delete content._id;
		}*/
		TicketAuditLog.findOneAndUpdate({_id: id}, content, {new: true, upsert: false}).lean().exec(function(err, data){
			if(err || !data){
				logger.info("Ticket NOT Updated With Instance ID");
			}
			else {
				//callback(data);
				logger.info("Ticket Updated With Instance ID");
			}
		});
	} 
	
}
	

module.exports = WorkflowManager;

