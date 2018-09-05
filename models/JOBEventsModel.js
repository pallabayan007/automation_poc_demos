var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var jobevents = new Schema({  
	jobName : {type: String,required: true },
	jobDetails:{type: String},
	alertId: { type: String, required: true },
    cronExpression: { type: String, required: true },
    active: { type: String, required: true },
    timeZone: { type: String, required: true },
	updateTimestamp: { type: Date }, 
	updatedByUserId: { type: String }, 
	updateComment: { type: String },
	trashed: {type: String},
});

module.exports = jobevents;