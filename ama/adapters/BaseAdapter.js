

var logger = getLogger("Adapters");
var _ = require("underscore");

var Adapter = function() {

	this.connect = function(connectionId, connectionProperties){
		logger.info("connect to %s", connectionId );
	}
	
	return this;
};

Adapter.prototype.initialize = function(config){
//	this.connections = config["connections"]["connection"];
	this.connections = config["connections"];
	
	if(!_.isArray(this.connections)){
		this.connections = [this.connections];
	}
	
	return this;
}

Adapter.prototype.getAdapterName = (function(){
	return this.adapter_name;
});

Adapter.prototype.start =  function(){
	logger.info("Adapter: %s is started", this.getAdapterName());
	for(var i = 0 ; i < this.connections.length ; i++){
		var connection = this.connections[i]["connection"];
		var connectionId = connection.connectionId;
		var connectionProperties = connection.connectionProperties;
		this.connect(connectionId, connectionProperties);
	}
	
}

module.exports = Adapter;