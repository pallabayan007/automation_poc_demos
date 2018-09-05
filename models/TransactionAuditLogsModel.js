var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var TransactionAuditLogs = new Schema({
	auditTargetId : {type: String, required: true},
	updateTimeStamp: { type: Date, required: true, default: Date.now},
	eventType:{ type: String, required: true },  		//CREATE|UPDATE|DELETE
	updatedByUserId: { type: String, required: true}, 
	updatedCollectionName : {type : String, required: true},
	updatedCollectionTimestamp : {type: Date, required: true, default: Date.now},
	previousDescription : {type : String},
	currentDescription: {type:String},
	updateComment: { type: String, required: true},
	serviceName : {type:String}
});

module.exports = TransactionAuditLogs;