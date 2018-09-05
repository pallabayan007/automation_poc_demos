function Variable(name, type) {
	this.variableidentifier = 0;
	this.variablevalue = "";
	this.variablename = name;
	this.type = type;
	this.taskid = 0;
	this.description ="";
	this.objectType = "com.ibm.tws.simpleui.bus.Variable";
	
	this.textMinChars = "";
	this.textMaxChars = "";
	this.textAllowSpaces = "";
	this.textNotNull = "";
	this.numberMaxValue = "";
	this.numberMinValue = "";
	this.optionsEnabled = "";
}

module.exports = Variable;