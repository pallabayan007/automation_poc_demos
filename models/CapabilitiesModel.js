var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var capabilities = new Schema({  
	capName: { type: String,required: true,unique:true},
	capRegStr: { type: String,required: true,unique:true},
	accessPanel: { type: String,required: true},
	updateTimestamp: { type: Date}, 
	updatedByUserId: { type: String }, 
	updateComment: { type: String },
	trashed: {type: String},
});

module.exports = capabilities;