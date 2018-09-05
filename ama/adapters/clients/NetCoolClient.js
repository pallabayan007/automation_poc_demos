var http = require("http");
var URL = require("url");
var logger = getLogger("NetCoolClient");

var NetCoolClient = function(protocol, host, port, path, account, client, authetication) {

	var self = this;
	
	this.itm_url = protocol + "://" + host + ":" + port + "/" + path + "/restapi/alerts/status";
	this.account = account;
	this.client = client;
	var auth = new Buffer(authetication.userId + ":" + authetication.password).toString('base64');
	
	logger.info("using NetCool api based on : " + this.itm_url);

	this.getAllAlerts = function(callback) {
		var urlObj = URL.parse(this.itm_url);
		var option = {
			method : "GET",
			port : urlObj.port,
			hostname : urlObj.hostname,
			path : urlObj.path, 
			headers : {
				"Content-Type" : "application/json",
				"Authorization" : "Basic " + auth
			}
		}
		var request = http.request(option, function(response) {
			var data = '';
			response.on("data", function(chunk) {
				data += chunk;
				logger.debug("Get chunk: " + chunk);
			});
			response.on("end", function() {
				logger.info("NetCool API[Get Alerts] get response status:" + response.status);
				if(response.statusCode != 200){
					return callback(new Error(data));
				}
				data = JSON.parse(data);
							
				if(!data || !data.rowset || !data.rowset.rows || data.rowset.rows.length == 0){
					logger.info("NetCool API[Get Alerts] invalid response");
					return callback(new Error("Invalid data from NetCool API"));
				}
				
				data = data.rowset.rows;
				logger.info("NetCool API[Get Alerts] get response data: " + data);

				for (var i = 0; i < data.length; i++) {
					data[i].accountName = self.account;
					data[i].clientName = self.client;
					data[i].alertPublishName = "NetCoolHttpOSLCAlert";
				}
				
				callback(null, data);
				logger.info("receive %s alerts from NetCool", data.length);

			});
		});
		request.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});
		request.end();
		logger.info("NetCool API[Get Alerts] request has been sent out");
	}

}

module.exports = NetCoolClient;
