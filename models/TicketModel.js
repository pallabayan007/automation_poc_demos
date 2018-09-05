
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Ticket = new Schema({
	
	requester:{ type: String },
	assignee:{ type: String },
	asignmentGroup:{ type: String,required:true },
	type:{ type: String ,required: true},
	priority:{ type: String },
	subject:{ type: String },
	status:{ type: String,required: true },
	openedAt:{ type: String },
	account:{ type: String ,required: true},
	application:{ type: String ,required: true},
	applicationName: { type: String, required: false },
	impact:{ type: String },
	cause:{ type: String },
	urgency:{ type: String },
	category:{ type: String },
	ticketKey:{ type: String,required:true },
	updateTimestamp:{ type: Date}, 
	updatedByUserId:{ type: String },
	updateComment:{ type: String },
	trashed:{ type: String }
});

module.exports = Ticket;