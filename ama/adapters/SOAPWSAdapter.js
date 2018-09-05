var util = require("util");


var BaseAdapter = require("./BaseAdapter.js");
var logger = getLogger("Adapters");


var Adapter = function(config){
	
	this.adapter_name = "SOAPWSAdapter";
	
	this.connect = function(connectionId, connectionProperties){
		logger.debug("connect to %s", connectionId );
	}
	
	return this;
}


util.inherits(Adapter, BaseAdapter);


module.exports = Adapter;