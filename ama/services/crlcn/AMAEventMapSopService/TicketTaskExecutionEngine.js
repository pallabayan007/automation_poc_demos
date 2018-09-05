var async = require("async");
var logger = getLogger('AMAEventMapSopService');

var TicketTaskExecutionEngine = function(options) {

	var TASK_MAXIMUM = 2;
	var PENDING_TAKS_RESTORE_INTERVAL = 500;

	var self = this;

	var queue = this.queue = async.queue(function(task, callback) {
		var sop = task.SOP;
		var ticket_audit_log = task.ticket_audit_log;
		var IOD = task.IOD;
		var result = self._assignIODAuditLog(IOD, ticket_audit_log);
		callback(null, result);
	}, TASK_MAXIMUM);

	queue.drain = function() {
		logger.debug("All tasks have been processed");
	}

	this.start = function() {
		logger.debug("Task Execution Engine started");
	}

	this.executeTask = function(task, callback) {
		var sop = task.SOP;
		var ticket_audit_log = task.ticket_audit_log;
		queue.push(task, function(err, result) {
			callback(err, result);
		});
	}

	this.shutdown = function() {
		logger.debug("Task Execution Engine shutdown");
	}

	this._assignIODAuditLog = function(IOD, ticket_audit_log) {
		logger.info("===Assign Ticket Audit Log to IOD===");
		IOD["ticket_audit_log"] = ticket_audit_log
		return IOD;
	}
}

module.exports = (function() {
	var engine = null;
	try {
		engine = new TicketTaskExecutionEngine();
		engine.start();
	} catch (e) {
		logger.error(e);
	}
	return engine;
})();
