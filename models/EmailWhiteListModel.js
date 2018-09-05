var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var emailwhitelists = new Schema({

	emailIDList:[],
	clientID:{ type: String },
	accountID:{ type: String },
	createTimestamp:{ type: Date},
	updateTimestamp:{ type: Date},
	updateBy:{ type: String },
	updateComment:{ type: String }
});

module.exports = emailwhitelists;