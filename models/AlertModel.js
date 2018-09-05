
var mongoose = require("mongoose");
var Schema = mongoose.Schema;



var SOPCognitiveInfo = new Schema({
	//_id : {type: String, required : true, unique: true},
	SOPCognitiveID : { type: String, required: false },
	SOPId : {type: String, required : false}
});

var TaskMaster = new Schema({
	//_id : {type: String, required : true, unique: true},
	TaskMasterID :  { type: String, required: false },
	TaskExecutionFlowID : {type: String, required : false},
	TaskExecutionOrder : {type: String},
	TaskName : {type: String},
	TaskShortDesc : {type: String},
	TaskOwner: {type: String},
	TaskExecutionType: {type: String},
	TaskExecutionUserId : {type: String},
	TaskExecutionPwd : {type: String},
	TaskDuration: {type: String},
	Action: {type: String},
	TaskFileName :{type :String},
	jobContext :{type :String},
	script :{type :String}
});

var RuleMaster = new Schema({
	//_id : {type: String, required : true, unique: true },
	RuleMasterID :  { type: String, required: false },
	TaskExecutionFlowID : {type: String, required : false}
});

var TaskExecutionFlow = new Schema({
	//_id : {type: String, required : true, unique: true },
	TaskExecutionFlowID :  { type: String, required: false },
	SOPId : {type: String, required : false},
	TaskMasters : [TaskMaster],
	RuleMasters : [RuleMaster]
});

/*var SopJobEvent=new Schema({
	//jobID: { type: String,required: true, unique: true },
	jobName : {type: String,required: true },
	jobDetails:{type: String},
	sopID: { type: String, required: true },
    cronExpression: { type: String, required: true },
    active: { type: String, required: true },
    timeZone: { type: String, required: true },
});*/



var SOP = new Schema({
	//_id : {type: String, required : true, unique: true },
	SOPID : { type: String, required: true },
	SOPName : { type: String, required: true },
	SOPShortDesc : { type: String},
	SOPPurpose: { type: String},
	alertId : {type: String, required : true},
	activeMode : {type: String, required : true},
	
	SOPType:{ type: String, required: true },
	ChoreographID : { type: String, required: false },
	AutomationInput:[],
	AutomationOutput : [],
	
	AutomationProcess:{ type: String},
	operationShortDesc:{ type: String},
	AutomationProvider:{type: String, required: true},
	SOPUserId : {type: String},
	SOPPassword : {type: String},
	Classification : {type:String},
	ExpectedInput : {type :String},
	ExpectedOutput : {type :String},
	ExecuteAutomation :{type:String},
	WorkflowAutomationUserId :  {type:String},
	WorkflowAutomationPassword : {type:String},
	createTimestamp : { type: Date}, 
	createdByUserId : {type: String},
	TaskExecutionFlows : [TaskExecutionFlow],
	SOPCognitiveInfos : [SOPCognitiveInfo],
	//SopJobEvents :[SopJobEvent]
});


var Alert = new Schema({
	//_id : {type: String, required : true, unique: true },
	alertName: { type: String, required: true},
	alertShortDesc : {type: String, required : false},
	alertStatus: { type: String, required: false },
    alertFrequency: { type: String, required: false },
    alertType: { type: String, required: false },
    alertSeverity: { type: String, required: false },
    alertMetrics: { type: String, required: false },
    alertRaisedTimeStamp: { type: Date, default: Date.now },
    applicationID: { type: String, required: true },
    applicationName: { type: String, required: false },
    accountID: { type: String, required: true },
    updateTimestamp : { type: Date}, 
	updatedByUserId : {type: String},
	updateComment : {type: String},
	trashed: {type: String},
    SOPs : [SOP]
});



module.exports = Alert;