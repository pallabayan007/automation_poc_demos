var Step = require('../Step');

function CommandStep(command, agent) {
	return this.CommandStep(command, agent, "");
} 

function CommandStep(command, agent, input) {
	return this.CommandStep(command, agent, input, "", "", "", "", "");
}

function CommandStep(command, agent, input, output, stderror, user, workingDir, fileExtension) {
	Step.call(this);
	this.type = "executable";
	this.target = agent;
	this.user = "";
    this.properties.ByPath = false;
    this.properties.ByScript = true;
    this.properties.arguments = [];
    this.properties.environment = [];
    this.properties.error = "";
    this.properties.extension = fileExtension;
    this.properties.groupName = "";
    this.properties.input = input;
    this.properties.interactive = false;
    this.properties.nativeScript = command;
    this.properties.output = output;
    this.properties.userName = user;
    this.properties.workingDirectory = workingDir;
}

var ctor = function() {};
ctor.prototype = Step.prototype;
CommandStep.prototype = new ctor();
CommandStep.prototype.constructor = CommandStep;

CommandStep.prototype.compareTo = function(step) {
	var returnValue = 0;
	if (this.sequencenumber > step.sequencenumber) {
		returnValue = 1;
	} else {
		returnValue = -1;
	}
	return returnValue;
};

module.exports = CommandStep;
