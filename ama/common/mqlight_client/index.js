var mqlight = require("mqlight");
var logger = getLogger("Adapters");

var credentials = null;
if (process.env.VCAP_SERVICES) {
	var services = JSON.parse(process.env.VCAP_SERVICES);
	if (services['mqlight']) {
		credentials = services["mqlight"][0]["credentials"];
	}
} else {
	credentials = {
		"username" : "admin",
		"connectionLookupURI" : "amqp://localhost:5672",
		"password" : "admin"
//			"username": "6hdSJzJW2huk",
//	        "connectionLookupURI": "http://mqlightprod-lookup.ng.bluemix.net/Lookup?serviceId=aeb132a8-af05-4ada-bec9-ec52641c12b4",
//	        "password": "3EtjAHZv7CcW"
	}
}

var mqlightClient = function() {

	var self = this;

	this._mqlight = mqlight.createClient({
		service : credentials.connectionLookupURI,
		user : credentials.username,
		password : credentials.password
	});

	this._mqlight.on("started", function() {
		logger.info("[MQLight]MQlight is started");
	});
	
	this.publish = function(topic, message){
		logger.info("[MQLight]Publish topic : %s", topic);
		self._mqlight.send(topic, message);
	}

	return this;
}

module.exports = mqlightClient;
