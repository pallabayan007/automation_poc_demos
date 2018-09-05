
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var BPMN = new Schema({  
    //_id: { type: String, required: true, unique: true },  
    sopBpmnData: { type: String, required: true},  
    workflowName: { type: String },
    createdByUserId:{ type: String, required: true },
    createDate : {type: String}
});

module.exports = BPMN;