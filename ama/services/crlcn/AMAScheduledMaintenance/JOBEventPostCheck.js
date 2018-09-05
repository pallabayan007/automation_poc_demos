var logger = getLogger("AMAScheduledMaintenance");
var JOBEventModel = require("../../../../models").JOBEventModel;
var JOBEventHandler = require("./JOBEventHandler");

var ChoreographModel = require("../../../../models").ChoreographModel;
var WorkflowManager = require("../AMAServiceManagementAgent/client/WorkflowManager");

/*ChoreographModel.post('save', function(choreograph){
	logger.info("save ChoreographModel");
	(new WorkflowManager()).createWorkflow(choreograph);
});*/



JOBEventModel.post('save', function(job){
	logger.info("save JOBEventModel");
	JOBEventHandler(job, "save");
});

JOBEventModel.post('updated', function(job){
	logger.info("updated JOBEventModel");
	JOBEventHandler(job, "updated");
});

JOBEventModel.post('delete', function(job){
	logger.info("delete JOBEventModel");
	JOBEventHandler(job, "delete");
})


