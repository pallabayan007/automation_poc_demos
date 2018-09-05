var logger = getLogger("AMAScheduledMaintenance");

var JOBEventScheduler = require('./JOBEventScheduler.js');

var JOBEventHandler = function(job, action){
	logger.info("JOBEventHandler : handle job " + job.jobName + "(id:" + job._id + ")");
	var scheduler = JOBEventScheduler.getInstance();
	if(action == "delete"){
		logger.info("delete job :" + job._id);
		scheduler.deleteJOBEvent(job);
	}
	else if (action == "save" || action == "updated"){
		logger.info("update job : " + job._id);
		scheduler.updateJOBEvent(job);
	}
}


module.exports = JOBEventHandler; 