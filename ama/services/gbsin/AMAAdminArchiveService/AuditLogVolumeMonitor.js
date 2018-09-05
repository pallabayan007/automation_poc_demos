/**
* Name    - ./ama/services/gbsin/AMAAdminArchiveService/AuditLogVolumeMonitor.js
* Purpose - Checks the Audit Log Volume against a configured values and raised
*           warnings accordingly.
* Date    - Aug 10, 2016.
*/

var logger = getLogger("AuditLogVolumeMonitor");
var models = require("../../../../models");
var AuditLogMonitorConfig = require("../../../../config/audit_archive_config.json");


var interval = null;
var audit_log_threshold_params = ["alert_audit_log_threshold_in_mb","ticket_audit_log_threshold_in_mb","transaction_audit_log_threshold_in_mb"];
var audit_log_models = ["AlertAuditLog","TicketAuditLog","TransactionAuditLog"];
var archive_warning_events = ["Alert_Audit_Archive_Needed","Ticket_Audit_Archive_Needed","Transaction_Audit_Archive_Needed"];

function checkAlertAuditLogVolume() {
	//logger.info(" Configured Alert Audit Threshold in MB :"+alert_audit_log_threshold_in_mb);
}

/*
* Provides necessary closure to db action handler to operate on collections
* size, compare with the limit and throw warning event accordingly.
*/
function makeDBStatActionHandler (modelIndex, configured_threshold_limit) {
	return function(err,results){
		if(!err){
			//var dbStoredSize_in_mb = results.storageSize / (1024 * 1024);
			var dbStoredSize_in_mb = results.size / (1024 * 1024);
			logger.info("model["+audit_log_models[modelIndex]+"] storagesize(mb):"+dbStoredSize_in_mb);
			logger.info("model["+audit_log_models[modelIndex]+"] configured size(mb):"+configured_threshold_limit);
			if(dbStoredSize_in_mb > configured_threshold_limit){
				//Emit Warning event
				var warningEvent = archive_warning_events[modelIndex];
				logger.info ("Emitting Event::"+warningEvent);
				SocketManager.emit(warningEvent, dbStoredSize_in_mb);
				logger.info ("Emitted Event::"+warningEvent);
			}
		} else {
			logger.error("model["+audit_log_models[modelIndex]+"]Error : "+err);
		}
	}
}

/*
 * Checks all audit log volume and see if the store size indicates immediate archiving.
 * 
 */
function checkAuditLogVolume() {
	logger.info("Checking Audit Log Volume...");
	var numberofArchivableLogs = audit_log_models.length;
	logger.info("Number of Archivable logs:"+numberofArchivableLogs);
	for(var index=0; index < numberofArchivableLogs; index++) {
		logger.info( " Processing model ["+audit_log_models[index]+"]");
		var configured_threshold = AuditLogMonitorConfig[audit_log_threshold_params[index]];
		logger.info("Configured Threshold:"+configured_threshold);
		var auditLogs=models[audit_log_models[index]];
		if(auditLogs) {
			auditLogs.collection.stats (makeDBStatActionHandler(index, configured_threshold));
			//Deleting the reference - enable GC to reclaim the memory
			auditLogs=null;
		} else {
			logger.info("No Matching DB Model");
		}
	}
}

/*
* Starts the Periodic Monitoring Process.
*/
exports.startMonitor = function() {
	logger.info("AuditLogVolumeMonitor Started...");
	var delay = 15000; // TODO : Fetch from config, for now set it to 15 sec
	interval = setInterval(checkAuditLogVolume,delay);

}

/*
* Stop the Periodic Monitoring Process.
*/
exports.stopMonitor = function() {
	if(interval) {
		logger.info ("Stopping the monitoring service..");
		clearInterval(interval);
	}
}
