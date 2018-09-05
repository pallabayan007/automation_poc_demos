var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var usercredentials = new Schema({  
	userName: { type: String, required: true},
	password: { type: String, required: true},
	trashed: {type: String},
});

module.exports = usercredentials;