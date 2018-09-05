var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var human_activity = Schema({
	ha_id : { type: String, require: true },
	ha_name : { type: String, require: true },
	ha_description : { type: String, require: true },
	actors : [{ type: String }],
	input_type : { type: String, require: true },
	input_set : [{ type: String }]
});

var condition = new Schema({
    sop_id : { type: String, require: false },
    sop_name : { type: String, require: false },
    param : { type: String, required: false },
    
    ha_id : { type: String, require: false },
    ha_name : { type: String, require: false },
	
    value : { type: String, require: true }
});

var conditionSet = new Schema({
	conditions : [condition]
});

var ioMap = new Schema({
	input : { type: String, required: true },
	
    type : { type: String, required: true },
    
    source_sop_id : { type: String, require: false },
    source_sop_name : { type: String, require: false },
    output : { type: String, required: false },
    
    source_ha_id : { type: String, require: false },
    source_ha_name : { type: String, require: false },
    
    conditionSets : [conditionSet]
});

var path = new Schema({
	fromSOPId : { type: String, required: false },
	fromSOPName : { type: String, required: false },
	
	fromHAId : { type: String, required: false },
	fromHAName : { type: String, required: false },
	
    toSOPId : { type: String, required: false },
    toSOPName : { type: String, required: false },
    
    toHAId : { type: String, required: false },
    toHAName : { type: String, required: false },
    
    ioMaps : [ioMap]
});

var choreographs = new Schema({  
	SOPID : { type: String, required: true },
	SOPName : { type: String, required: false },
	
	human_activities : [human_activity],
	
	start_sop_id : { type: String, required: false },
	start_sop_name : { type: String, required: false },
	
	start_ha_id : { type: String, required: false },
	start_ha_name : { type: String, required: false },
	
	paths : [path]
});

module.exports = choreographs;