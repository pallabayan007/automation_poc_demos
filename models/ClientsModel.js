var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var clients = new Schema({  
	clientName: { type: String, required: true,unique:true },
	clientID:{ type: String },
	clientShortDescription:{ type: String },
	updateTimestamp: { type: Date}, 
	updatedByUserId: { type: String }, 
	updateComment: { type: String },
	trashed: {type: String},
});

module.exports = clients;