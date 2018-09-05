function WAProcess(taskname, taskdescription) {
	this.name = taskname;
	this.description = taskdescription;
	this.objecttype = "com.ibm.tws.simpleui.bus.Task";
	this.taskstatus = false;
	this.enhancedtask = false;
	this.isEditing = true;
	this.nextruntime = "";
	this.lastrunresult = -1;
	this.lastmodifiedtimestamp = "";
	this.creationdate = "";
	this.tasklibraryid = 0;
	this.actions = [];
	this.triggers = [];
	this.variables = [];
	this.variableTable = "";
}

WAProcess.prototype = {
	
		/**
     	* Adds a step to the sequence of the steps to run
     	* 
    	* @param step Step tu run
    	*/
    	
		addStep : function (step) {
			step.sequencenumber = this.actions.length+1;
			this.actions.push(step);
		},
		
		/**
     	* Removes the step at the provided index.
    	* 
    	* @param index index of the step to return
    	*/
		
		removeStep : function (index) {
			this.actions.splice(index, 1);

			 for(var i=0;i<this.actions.length;i++){
			 	this.actions[i].sequencenumber = i+1;
			 }
		},


		/**
    	* Adds a trigger to the Process
     	* 
     	* @param trigger trigger to add
     	*/
		
		addTrigger : function (trigger) {
			if(trigger != null){	
				this.triggers.push(trigger);
			}
		},
		
		
		/**
     	* Removes the trigger at the provided index.
    	* 
    	* @param index index of the trigger to return
    	*/
		
		removeTrigger : function (index) {
			this.triggers.splice(index, 1);
		},
		
		
		/**
    	* Adds a variable to the Process
     	* 
     	* @param variable variable to add
     	*/

		addVariable : function (variable) {
			this.variables.push(variable);
		},
		
		
		/**
     	* Removes the variable at the provided index.
    	* 
    	* @param index index of the variable to return
    	*/
		
		removeVariable : function (index) {
			this.variables.splice(index, 1);
		},
		
		
		/**
    	* Adds a variable table to the Process
     	* 
     	* @param variableTable variableTable to add
     	*/
		
		setVariableTable : function (variableTableName) {
			this.variableTable = variableTableName;
		}

};

module.exports = WAProcess;