var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var users = new Schema({  
	userName: { type: String, required: true},
	userID:{ type: String, required: true,unique:true },
	roleName: { type: String, required: true }, 
	account: [], 
	type: { type: String }, 
	active: { type: String },
	email:{ type: String },
	updateTimestamp: { type: Date }, 
	updatedByUserId: { type: String }, 
	updateComment: { type: String },
	trashed: {type: String},
});

module.exports = users;