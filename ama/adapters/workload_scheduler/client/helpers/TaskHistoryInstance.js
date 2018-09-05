function TaskHistoryInstance() {
	this.status = -1;
	this.startDate = "";
	this.scheduledDate = "";
	this.completedSteps = 0;
	this.totalSteps = 0;
	this.elapsedTime = 0;
	this.instanceType = 0;
	this.id = "";
	this.originalTask = {};
	
}

module.exports = TaskHistoryInstance;
