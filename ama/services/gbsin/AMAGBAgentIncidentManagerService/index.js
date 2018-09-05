/**
 * ./ama/services/AMAGBAgentIncidentManagerService.js
 * 
 * Setup the service gateway through which GBAgent can pass on captured information about Incidents(Ticket/Alerts).
 * Once Incidents are intercepted they are pushed to GB Main Queue for further processing.
 * 
 */
//var logger = getLogger("AMAGBAgentIncidentManaerService");
var RabbitMQClient = require("../../../common/rabbitmq_client");
var MQTopics = require("../../../common/MQTopics.js");
var models = require("../../../../models");
var AutomationProcessRules = require("../../../rules/AutomationProcess/AutomationProcessRules.js");
var logger = getLogger("AMAGBAgentIntegratorService");

var AlertAuditLog = models.AlertAuditLog;
var TicketAuditLog = models.TicketAuditLog;
var messages=[];
var processedIndex =0;

/*
 * Creates DBAlertLogPublish Handler with appropriate closure
 * such that alert can be created with appropriate data but w/o creating duplicates.
 * 
 */
function mk_handleDbAlertLogPublisher(alertVal,accountName,clientName,sizeIncidents, rabbitMQClient,automationProcessRules) {
	return function(err,data) {
		
		logger.info("===Inside Alert Audit Log Query==");
		logger.info("===Processing AlertID:"+alertVal.alertID+" Alert Name:"+alertVal.alertName+ " index:"+processedIndex+ " sizeIncidents:"+sizeIncidents+" ===");
		
		if (err || data == null || data.length == 0) {
			logger.info("==New Alert==");
			
			var duplicated = false;
			for (var j = 0; j < messages.length; j++) {
				if (messages[j].alertName == alertVal.alertName && messages[j].applicationName == alertVal.applicationName) {
					duplicated = true;
					break;
				}
			}
			if (!duplicated) {
				logger.info("Pushing alert AlertId:"+alertVal.alertID+" AlertName:"+alertVal.alertName+" to queue");
				messages.push(alertVal);
				
			}
			processedIndex++;
		} else {
			logger.info("==Alert[Name:"+alertVal.alertName+"] Already Exists in the system==");
			// Current Alert raised time
			// received from monitoring system
			var crt = alertVal.alertRaisedTime;
			// Alert status
			var stat = alertVal.alertState;
			//Retrieve DB Stored value
			var alrt = data[0].createTime.toString();
			var st = data[0].status;
			var alrt = data[0].createTime.toString();

			var st = data[0].status;
			if (st.indexOf("Completed") >= 0 || st.indexOf("Error") >= 0) {
				st = 'AutomationDone';
			} else if (st.indexOf("Abort") >= 0) {
				st = 'AutomationAbort' ;
			} else {
				st = 'AutomationInProgress';
			}
			automationProcessRules.executeRule(crt, alrt, stat, st, function(err, response1, response2) {
				if (err) {
					logger.error("===Error==="+err);
				} else {
					logger.info("Rule-engine returns value  ---->" + response1 + " with elapsed time: " + response2 + "ms");
					if (response1 == 1) {
						duplicated = false;
						for (var j = 0; j < messages.length; j++) {
							if (messages[j].alertName == alert.alertName && messages[j].applicationName == alert.applicationName) {
								duplicated = true;
								break;
							}
						}
						if (!duplicated){
							logger.info("Pushing alert AlertId:"+alertVal.alertID+" AlertName:"+alertVal.alertName+" to queue");
							messages.push(alert);
						}
					}
				}
				processedIndex++;
				logger.info(" Rule=> index:"+processedIndex+ "  size:"+sizeIncidents);
				if (processedIndex  == sizeIncidents) {
					
					if (messages.length > 0) {
						logger.info("Publishing alert :" + messages.length+" for client:"+clientName+" account:"+accountName);
						rabbitMQClient.publish(clientName, accountName, MQTopics.alert_topic, messages);
						
					}
				}
			});

		}
		
		
		//Publish the message when we arrived at the last of incidence list		
		
		logger.info(" index:"+processedIndex+ "  size:"+sizeIncidents);
		if (processedIndex  == sizeIncidents) {
			
			if (messages.length > 0) {
				logger.info("Publishing alert :" + messages.length+" for client:"+clientName+" account:"+accountName);
				rabbitMQClient.publish(clientName, accountName, MQTopics.alert_topic, messages);
				
			}
		}
	
		
	}
}

/*
 * Creates DBTicketLogPublish Handler with appropriate closure
 * such that ticket can be created with appropriate data but w/o creating duplicates.
 * 
 */
function mk_handleDbTicketLogPublisher(ticketVal,accountName,clientName,sizeIncidents, rabbitMQClient) {
	return function(err,data) {
		
		logger.info("===Inside Ticket Audit Log Query==");
		logger.info("===Processing Ticket :"+ticketVal.ticketNumber+ " index:"+processedIndex+ " sizeIncidents:"+sizeIncidents+" ===");
		
		if (err || data == null || data.length == 0) {
			logger.info("==No Duplicate Found==");
			
			var duplicated = false;
			for (var j = 0; j < messages.length; j++) {
				if (messages[j].ticketNumber == ticketVal.ticketNumber) {
					duplicated = true;
					break;
				}
			}
			if (!duplicated) {
				logger.info("Pushing ticket:"+ticketVal.ticketNumber+" to queue");
				messages.push(ticketVal);
				
			}
		} else {
			logger.info("==Ticket["+ticketVal.ticketNumber+"] Already Exists in the system==");
		}
		
		// Commented For Now - Need to be checked with Ya Bin and Fix Accordingly
//		var alrt = data[0].createTime.toString();
		//
//					var st = data[0].status;
//					if (st.indexOf("Completed") >= 0 || st.indexOf("Error") >= 0) {
//						st = 'AutomationDone';
//					} else if (st.indexOf("Abort") >= 0) {
//						st = 'AutomationAbort' ;
//					} else {
//						st = 'AutomationInProgress';
//					}
//					self.automationProcessRules.executeRule(crt, alrt, stat, st, function(err, response1, response2) {
//						success++;
//						if (err) {
//							logger.error(err);
//						} else {
//							logger.info("Rule-engine returns value  ---->" + response1 + " with elapsed time: " + response2 + "ms");
//							if (response1 == 1) {
//								duplicated = false;
//								for (var j = 0; j < messages.length; j++) {
//									if (messages[j].alertName == alert.alertName && messages[j].applicationName == alert.applicationName) {
//										duplicated = true;
//										break;
//									}
//								}
//								if (!duplicated)
//									messages
//									.push(alert);
//							}
//						}
//					});
//				}

			

		//Publish the message when we arrived at the last of incidence list
		
		processedIndex++;
		logger.info(" index:"+processedIndex+ "  size:"+sizeIncidents);
		if (processedIndex  == sizeIncidents) {
			
			if (messages.length > 0) {
				//accountName = messages[0].accountName;
				//clientName = "IGA";
				logger.info("Publishing ticket :" + messages.length+ " to client:"+clientName+" for account:"+accountName);
				rabbitMQClient.publish(clientName, accountName, MQTopics.ticket_topic, messages);
				
			}
		}
	
		
	}
}


/*
 * Process intercepted tickets - checks the uniqueness of the tickets and publish unique
 * tickets to processing queue.
 * 
 */
function processTickets(incidentBlock,res) {
	var rabbitMQClient = new RabbitMQClient();
	var clientName = incidentBlock.client;
	var accountName = incidentBlock.account;
	
	messages=[];
	processedIndex =0;
	
	if(incidentBlock.incidents!=null && incidentBlock.incidents.length!=0) {
		var sizeIncidents = incidentBlock.incidents.length;
		for(var index=0; index < sizeIncidents ; index++ ) {
			var ticket=incidentBlock.incidents[index];
			//Check if the ticket already exists in the db, if yes, then do not create duplicate ticket
			//otherwise process it
			var criteria = {};
			criteria["ticketNumber"] = ticket.ticketNumber;
			var query = TicketAuditLog.find(criteria);
			logger.info("Processing ticket "+ticket.ticketNumber);
//			query.sort("-createTime").lean().exec(mk_handleDbTicketLogPublisher(ticket,index,sizeIncidents,rabbitMQClient));
			query.sort("-createTime").lean().exec(mk_handleDbTicketLogPublisher(ticket,accountName,clientName,sizeIncidents,rabbitMQClient));
		}
		res.status(200).send({ result : "success"});
	} else {
		res.status(200).send({ result : "No Incidents to process"});
	}
}

/*
 * Process intercepted alerts - checks the uniqueness of the alerts and publish unique
 * alerts to processing queue.
 * 
 */
function processAlerts(incidentBlock,res) {
	var rabbitMQClient = new RabbitMQClient();
	var automationProcessRules = new AutomationProcessRules();
	messages=[];
	processedIndex = 0;
	var clientName = incidentBlock.client;
	var accountName = incidentBlock.account;
	
	if(incidentBlock.incidents!=null && incidentBlock.incidents.length!=0) {
		var sizeIncidents = incidentBlock.incidents.length;
		for(var index=0; index < sizeIncidents ; index++ ) {
			var alert=incidentBlock.incidents[index];
			//Check if the alert already exists in the db, if yes, then do not create duplicate alert
			//otherwise process it
			var criteria = {};
			criteria["alertName"] = alert.alertName;
			var query = AlertAuditLog.find(criteria);
			logger.info("Processing alert id:"+alert.alertID);
			query.sort("-createTime").lean().exec(mk_handleDbAlertLogPublisher(alert,accountName,clientName,sizeIncidents,rabbitMQClient,automationProcessRules));
		}
		res.status(200).send({ result : "success"});
	} else {
		res.status(200).send({ result : "No Incidents to process"});
	}
}

/*
 * Service URL    : /rest/external/v1/ProcessGBAgentIncidents
 * HTTP METHOD    : POST
 * Content Type   : application/json
 * Responsibility : Intercept Incidents from GBAgent, check the uniqueness of the incident based
 * 	                on some business rule and puts into the main queue for processing and linking
 *                  to appropriate SOP.
 */
exports.processGBAgentIncidents = function (req,res){
	
	logger.info("...Inside processGBAgentIncidents....");
	var incidentRequest=req.body;
	
	//ASSUMPTION : Ideally input structure should contain a incidentType (Ticket/Alert), But for now we are assuming no value means default Ticket Type Incidence
	if(incidentRequest.incidentType=='Ticket') {
		//Ticket Processing
		logger.info("Processing Tickets....");
		processTickets(incidentRequest,res);		
	} else if(incidentRequest.incidentType == 'Alert'){
		//Alert Processing
		logger.info("Processing Alerts....");
		processAlerts(incidentRequest,res);
	}
	
}
