
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var HumanActivity = new Schema({
	question 		: {type: String, required : true},
	type			: {type: String, required : true},
	options			: {type: String, required : true},
	next 			: {type: String, required : true},
	status 			: {type: String, required : true},
	actors 			: {type: String, required : true},
	eventId 		: {type: String, required : true},
	answer			: {type: String, required : false},
	actor 			: {type: String, required : false},
	conversationId 	: {type: String, required : false},
	createTime 		: {type: Date, required : true, default: Date.now},
	completedTime 	: {type: Date, required : false}
});

module.exports = HumanActivity;