var http = require("http");
var URL = require("url");

var auth = "Basic: UW5yY2g4TVdreW1zODVuaw==";
var logger = getLogger("ITMClient");

var ITMClient = function(protocol, host, port, path, account, client) {

	var self = this;
	
	this.itm_url = protocol + "://" + host + ":" + port + "/" + path;
	this.account = account;
	this.client = client;
	
	logger.info("using ITM api based on : " + this.itm_url);

	this.getAllAlerts = function(callback) {
		var urlObj = URL.parse(this.itm_url);
		var option = {
			method : "GET",
			port : urlObj.port,
			hostname : urlObj.hostname,
			path : urlObj.path,
			headers : {
//				"Content-Type" : "application/json",
				"Authorization" : auth
			}
		}
		var request = http.request(option, function(response) {
			var data = '';
			response.on("data", function(chunk) {
				data += chunk;
				logger.debug("Get chunk: " + chunk);
			});
			response.on("end", function() {
				logger.info("ITM API[Get Alerts] get response status:" + response.status);
				if(response.statusCode != 200){
					return callback(new Error(data));
				}
				logger.info("ITM API[Get Alerts] get response data: " + data);
				data = JSON.parse(data);
				if(!data || data.length == 0){
					logger.info("ITM API[Get Alerts] invalid response");
					return callback(new Error("Invalid data from ITM API"));
				}
				
				logger.info("ITM API[Get Alerts] get response data: " + data);
				
				for (var i = 0; i < data.length; i++) {
					data[i].accountName = self.account;
					data[i].clientName = self.client;
					data[i].alertPublishName = "ITMRESTAlert";
				}
				
				callback(null, data);
				logger.info("receive %s alerts from ITM", data.length);

			});
		});
		request.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});
		request.end();
		logger.info("ITM API[Get Alerts] request has been sent out");
	}

	this.getAllTickets = function(callback) {
		callback(null, null);
	}

}

module.exports = ITMClient;
