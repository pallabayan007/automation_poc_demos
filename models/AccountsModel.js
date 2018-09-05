
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var accounts = new Schema({  
    //_id: { type: String, required: true, unique: true },  
    accountName: { type: String, required: true},  
    accountOwningCompany: { type: String },
    clientName:{ type: String, required: true },
    WorkflowAutomationUserId : {type: String},
	WorkflowAutomationPassword : {type: String},
	updateTimestamp : { type: Date }, 
	updatedByUserId : {type: String},
	updateComment : {type: String},
	trashed: {type: String},
});

module.exports = accounts;