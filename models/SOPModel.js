var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var TaskMasters = new Schema({
	TaskExecutionOrder : {type: String},
	TaskName : {type: String},
	TaskShortDesc : {type: String},
	TaskOwner: {type: String},
	TaskExecutionType: {type: String},
	TaskDuration: {type: String},
	Action: {type: String},
	TaskFileName :{type :String},
	jobContext :{type :String},
	script :{type :String}
});

var SOP = new Schema({
	SOPName : { type: String, required: true },
	SOPShortDesc : { type: String},
	SOPPurpose: { type: String},
	activeMode : {type: String, required : true},
	account:{ type: String ,required: true},
	application:{ type: String ,required: true},
	alert : [],
	ticket :[],
	
	SOPType:{ type: String, required: true },
	ChoreographID : { type: String, required: false },
	AutomationInput:[],
	AutomationOutput : [],
	workflowGraph: { type: Object, required: false },
		
	AutomationProcess:{ type: String},
	operationShortDesc:{ type: String},
	AutomationProvider:{type: String, required: true},
	SOPAutomationKey:{type: String },
	BPMNWorkFlowName:{type: String, required: true},
	Classification : {type:String},
	ExpectedInput : {type :String},
	ExpectedOutput : {type :String},
	ExecuteAutomation :{type:String},
	createTimestamp : { type: Date}, 
	createdByUserId : {type: String},
	TaskMasters : [TaskMasters],
	SOPCognitiveInfos : [],
	updateTimestamp:{ type: Date}, 
	updatedByUserId:{ type: String },
	updateComment:{ type: String },
	trashed:{ type: String }
	
});



module.exports = SOP;