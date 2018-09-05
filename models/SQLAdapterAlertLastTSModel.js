
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var SQLAdapterAlertLastTS = new Schema({
	connectionID 	: {type: String, required : true},	
	lastTimestamp 	: {type: Date, required : true},
	updateTimestamp : { type: Date, default: Date.now }, 

});

module.exports = SQLAdapterAlertLastTS;