/**
 * ./ama/services/crlcn/AMAServiceManagementAgent/client/AutomationSimulatorAdapter.js
 * 
 * A Automation Simulator Client which will do nothing but just accept the execution request
 * from GB and return immediately with success.
 * 
 * Purpose - Capture the GB specific performance/throughput starting from intercepting the
 * ticket/alert and successful automation execution for the same. With this adapter in place
 * there will be no delay for executing the automation so the total time taken can be completely
 * attributed to GB Processing Only.
 * 
 * Date - July 30, 2016
 */

var IOD_Execution_Mapping = {};

var AutomationSimulatorClient = function() {
	/*
	 * Main Automation Execution Method
	 */
	this.execute = function(IOD,callback) {
		console.log("===Inside Dummy Automata Client : Automation Execution===");
		var timestamp = new Date().getTime();
		var execution = {
			execution_id : timestamp,
			name : "Dummy Automaton Execution",
			status : "In Progress"
		};
		IOD_Execution_Mapping[IOD.ticketID] = execution;
		callback(null, execution);		
	}
	
	/*
	 * Automation Status Query Method
	 */
	this.getStatus = function(IOD, callback) {
		// check the in-memory variables
		var status = IOD_Execution_Mapping[IOD.ticketID].status;
		callback(null, status, IOD_Execution_Mapping[IOD.ticketID]);
	}
}

module.exports = AutomationSimulatorClient;
