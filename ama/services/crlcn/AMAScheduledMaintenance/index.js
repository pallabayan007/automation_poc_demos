var logger = getLogger("AMAScheduledMaintenance");

var JOBEvent = require("../../../../models").JOBEvent;
var JOBEventHandler = require("./JOBEventHandler.js");
var JOBEventPostCheck = require("./JOBEventPostCheck.js");

var AlertAuditLog = require("../../../../models").AlertAuditLog;
var TicketAuditLog = require("../../../../models").TicketAuditLog;

JOBEvent.find({}).lean().exec(function(err, jobevents){
	if(err){
		logger.error("Failed to get jobevents " + err.message);
		return;
	}
	logger.info("Restart Scheduled Maintenance when server restarted. ");
	
	if(jobevents.length == 0){
		logger.info("No jobevents on the server");
		return;
	}
	
	for(var i= 0 ; i < jobevents.length ; i++){
		logger.info("Handle job : " + jobevents[i].jobName);
		JOBEventHandler(jobevents[i], "updated");
	}
});

AlertAuditLog.find({status:"In Progress"}).lean().exec(function(err, alertAuditLogs){
	if(err){
		logger.error("Failed to get AlertAuditLog " + err.message);
		return;
	}
	logger.info("Reset in-progress AlertAuditLog status when server restarted. ");
	
	if(alertAuditLogs.length == 0){
		logger.info("No AlertAuditLog on the server");
		return;
	}
	
	for(var i= 0 ; i < alertAuditLogs.length ; i++){
		logger.info("Reset AlertAuditLog : " + alertAuditLogs[i].alertName);
		if (alertAuditLogs[i].status == "In Progress") {
			alertAuditLogs[i].status = "Abort";
		}
		AlertAuditLog.findOneAndUpdate({_id: alertAuditLogs[i]._id}, alertAuditLogs[i], {new: true, upsert: false}).lean().exec(function(err, data){
			if(err || !data){
				logger.info("Error updating AlertAuditLog: " + err.message);
			}
			else {
				logger.info("Successfully updated AlertAuditLog.");
			}
		});
	}
});

TicketAuditLog.find({remediationState:"In Progress"}).lean().exec(function(err, ticketAuditLogs){
	if(err){
		logger.error("Failed to get TicketAuditLog " + err.message);
		return;
	}
	logger.info("Reset in-progress TicketAuditLog status when server restarted. ");
	
	if(ticketAuditLogs.length == 0){
		logger.info("No TicketAuditLogs on the server");
		return;
	}
	
	for(var i= 0 ; i < ticketAuditLogs.length ; i++){
		logger.info("Reset TicketAuditLogs : " + ticketAuditLogs[i].ticketNumber);
		if (ticketAuditLogs[i].remediationState == "In Progress") {
			ticketAuditLogs[i].remediationState = "Abort";
		}
		TicketAuditLog.findOneAndUpdate({_id: ticketAuditLogs[i]._id}, ticketAuditLogs[i], {new: true, upsert: false}).lean().exec(function(err, data){
			if(err || !data){
				logger.info("Error updating TicketAuditLogs: " + err.message);
			}
			else {
				logger.info("Successfully updated TicketAuditLogs.");
			}
		});
	}
});
