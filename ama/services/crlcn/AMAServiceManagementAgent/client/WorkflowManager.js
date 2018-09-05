var request = require('request');
var async = require('async');
var config_info = require("../../../../../config/workflow_manager_config.json");
var ticket_info = require("../../../../../config/ticket.json");
var AMAServiceManagementAgent = require("../../../../../ama/services/crlcn/AMAServiceManagementAgent")
var models = require("../../../../../models"); 
var TicketAuditLog = models.TicketAuditLog;

var logger = getLogger("WorkflowManager");
var IOD_Execution_Mapping = {};

var WorkflowManager = function() {
	
		this.execute = function(IOD, callback) {	
		logger.info("===Inside WorkFlow Manager Async====");
		logger.info("IOD Received : " + JSON.stringify(IOD));
		logger.info("Ticket Key in IOD : " + IOD.ticket_audit_log.ticketKey);
		logger.info("BPMN Key in IOD : " + IOD.bpmnProcessName);
		var connectionProperties = config_info.adapters.WorkflowManagerAdapter.connection.connectionProperties;
		
		//Clearing the ticket.json
		AMAServiceManagementAgent.FileWrite("\config\\ticket.json", JSON.stringify(IOD));
		
		//Instantiate A BPMN Flow Starts
		var options_proc_start = {
		  uri: connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/process-definition/key/' + IOD.bpmnProcessName + '/start',
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

		request(options_proc_start, function (error_proc_start, response_proc_start, body_proc_start) {
			
			logger.info("Process start status: " + response_proc_start.statusCode);

			if(!error_proc_start && response_proc_start.statusCode == 200) {

				//Get Instance ID Starts
				var instanceID = body_proc_start.id;
				logger.info("Instance ID :" + instanceID);
				var options_get_task = {
				  uri: connectionProperties.protocol + '://' + connectionProperties.host + ':' + connectionProperties.port + connectionProperties.basePath + '/task/?processInstanceId=' + instanceID,
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
				
				logger.info("options_get_task for startflow task instance : " + JSON.stringify(options_get_task));
				
				request(options_get_task, function (error_get_instance, response_get_task, body_get_task) {
				  console.log("Status :" + response_get_task.statusCode);
				  logger.info("Status :" + response_get_task.statusCode);
				  if (!error_get_instance && response_get_task.statusCode == 200) {
					console.log(body_get_task);
					logger.info("body_get_task: " + JSON.stringify(body_get_task));
					var taskID = JSON.parse(body_get_task)[0].id;
					logger.info("BPMN Currently Running Task ID :" + taskID);
					IOD["processInstanceID"] = instanceID;
					
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

					request(options_task_complete, function (error_1, response_1, body_1) {
					  logger.info("\n\nStatus Code task_complete :" + response_1.statusCode);
					  if (!error_1 && response_1.statusCode == 204) {
						logger.info("BPMN Process Instance Started and Initial Data Loaded");
						updateTicketAuditLog(IOD.ticket_audit_log, instanceID);
					  } else {
						logger.info("BPMN Process Instance Started, But Initial Data Load Failed :");
						logger.info(error_1);
					  }
					});

					//Completing User Task
				  } else {
					logger.info("BPMN Process Instance Started, But Task ID not Retrieved");
				  }
				});
				//Get Instance ID Ends
			} else {
				logger.info("BPMN Process Instance Not Started :" + response_proc_start.statusCode);
			}

		});
		//Instantiate A BPMN Flow Ends
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

