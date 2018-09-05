
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var TicketAuditLog = new Schema({
	requester 		: {type: String, required : false},
	assignee 		: {type: String, required : false},
	asignmentGroup 	: {type: String, required : false},
	type			: {type: String, required : false},
	priority 		: {type: String, required : false},
	subject 		: {type: String, required : false},
	status	 		: {type: String, required : false},
	SLADueDate		: {type: Date, required : false},
	openedAt		: {type: Date, required : false},
	closedAt		: {type: Date, required : false},
	account			: {type: String, required : false},
	impact			: {type: String, required : false},
	cause			: {type: String, required : false},
	application		: {type: String, required : false},
	urgency			: {type: String, required : false},
	category		: {type: String, required : false},
	relatedTicket 	: [{type: String, required : false}],
	ticketKey		: {type: String, required : false},
	ticketingToolName : {type: String, required : false},
	updateTimestamp : { type: Date, default: Date.now }, 
	updatedByUserId	: {type: String, required : false},
	updateComment 	: {type: String, required : false},
	templateBased	: {type: String, required : false},
	ticketNumber 	: {type: String, required : false}, 
	remediationState: {type: String, required : false},
	createTime 		: {type: Date, required : true, default: Date.now},
	lastNotifiedTime: {type: Date, required : false},
	completedTime 	: {type: Date, required : false}, 
	errorMessage 	: {type: String, required : false},
	errorType 		: {type: String, required : false},
	bpmnProcessInstance: {type: String, required : false},
	logDetails : {
		type: [{
			subject : {type : String, required : true},
			type : {type : String, required : true},
			message : {type : String, required : true},
			timestamp : {type : Date, required : true},
		}],
		required: false
	}, 
	workflowGraph	: {type: Schema.Types.Mixed, required : false},
	ticketID		: {type: String, required : false},
	sopID 			: {type: String, required : false},
	iodID 			: {type: String, required : false},
	executionID		: {type: String, required : false},
	automationProvider : {type: String, required : false},
	customizedInputParams : {type: String, required: false},
	returnedOutputMessages : {type: String, required: false}
});

module.exports = TicketAuditLog;