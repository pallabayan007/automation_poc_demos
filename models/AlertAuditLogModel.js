
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var AlertAuditLog = new Schema({
	accountID 		: {type: String, required : false},
	accountName 	: {type: String, required : false},
	applicationID 	: {type: String, required : false},
	applicationName : {type: String, required : true},
	alertID 		: {type: String, required : false},
	alertName 		: {type: String, required : false},
	alertDesc 		: {type: String, required : false},
	alertState		: {type: String, required : false},
	alertShortDesc	: {type: String, required : false},
	alertSource		: {type: String, required : false},
	alertResource	: {type: String, required : false},
	alertSeverity	: {type: String, required : false},
	relatedAlerts	: [{type: String, required : false}],
	alertRaisedTime	: {type: Date, required : false, default: Date.now},
	alertType		: {type: String, required : false},
	incident		: {type: String, required : false},
	events 			: [{type: String, required : false}],
	monitoringToolName : {type: String, required : false},
	automationProvider : {type: String, required : false},
	sopID 			: {type: String, required : false},
	iodID 			: {type: String, required : false},
	executionID		: {type: String, required : false},
	createTime 		: {type: Date, required : true, default: Date.now},
	status 			: {type: String, required : false},
	errorMessage 	: {type: String, required : false},
	errorType 		: {type: String, required : false},
	completedTime 	: {type: Date, required : false},
	updateTimestamp : { type: Date, default: Date.now }, 
	updatedByUserId : {type: String},
	updateComment : {type: String},
	logDetails : {
		type: [{
			subject : {type : String, required : true},
			type : {type : String, required : true},
			message : {type : String, required : true},
			timestamp : {type : Date, required : true},
		}],
		required: false
	},
	customizedInputParams : {type: String, required: false},
	returnedOutputMessages : {type: String, required: false}
});

module.exports = AlertAuditLog;