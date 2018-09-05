
var mqlight = require("mqlight");

var logger = getLogger("AMAServiceMonitoringAgent");

var credentials = null;
if(process.env.VCAP_SERVICES){
	var services = JSON.parse(process.env.VCAP_SERVICES);
	if (services['mqlight']) {
		credentials = services["mqlight"][0]["credentials"];
	}
}
else {
	credentials = {
	       "username": "admin",
	       "connectionLookupURI": "amqp://localhost:5672",
	       "password": "admin"
//			"username": "6hdSJzJW2huk",
//	        "connectionLookupURI": "http://mqlightprod-lookup.ng.bluemix.net/Lookup?serviceId=aeb132a8-af05-4ada-bec9-ec52641c12b4",
//	        "password": "3EtjAHZv7CcW"
	}
}

var mqlightServer = function(){
	var self = this;
	
	logger.info("[MQLight]credentials: "+ JSON.stringify(credentials));
	
	this._mqlight = mqlight.createClient({
		  service  : credentials.connectionLookupURI,
		  user     : credentials.username,
		  password : credentials.password
	});
	
	
	this._mqlight.on("started", function(){
		logger.info("[MQLight]MQLight is started");
	});
	
	this.subscribe = function(topic){
		logger.info("[MQLight]Subscribe topic : " + topic);
		self._mqlight.subscribe(topic);
	}
	
	this.onMessage = function(callback){
		self._mqlight.on('message', callback);
	}
	
	return this;
}

module.exports = mqlightServer;

