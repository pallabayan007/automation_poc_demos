var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var roles = new Schema({  
	roleName: { type: String, required: true,unique:true },
	roleDescription: { type: String }, 
	updateTimestamp: { type: Date}, 
	updatedByUserId: { type: String }, 
	updateComment: { type: String }, 
	capabilityNameList: { type: String },
	trashed: {type: String},
});

module.exports = roles;