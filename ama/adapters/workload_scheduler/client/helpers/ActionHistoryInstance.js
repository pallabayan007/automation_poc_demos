function ActionHistoryInstance() {
    this.status = -1;
	this.startDate = "";
	this.elapsedTime = 0;
	this.instanceType = 0;
	this.originalAction = {};
	this.jobNumber = 0;
	this.target = "";
	this.id = "";
	this.returnCode = "";
	this.type = "";
	this.details = "";
}

module.exports = ActionHistoryInstance;