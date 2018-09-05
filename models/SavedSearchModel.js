var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var savedsearch = new Schema({  
	searchname : {type: String,required: true,unique:true },
	searchType:{type: String},
	searchQuery: [],
	createdByUserId:{ type: String },
	createTimestamp :{ type: Date },
	updateTimestamp: { type: Date }, 
	updatedByUserId: { type: String }, 
	updateComment: { type: String },
	eventtype:{type:String},
});

module.exports = savedsearch;