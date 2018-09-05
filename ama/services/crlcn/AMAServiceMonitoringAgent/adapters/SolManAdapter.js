var URL = require("url");
var http = require("http");
var https = require("https");
var xmlreader = require('xmlreader');
var uuid = require("node-uuid");


var fs = require("fs");
var path = require("path");

var logger = getLogger("AMAServiceMonitoringAgent");
var AMAServiceMonitoringAgent = require("../../AMAServiceMonitoringAgent");

var config = require("../../../../../config");

var SolManAdapter = function(){
	
	var self = this;
	
	this.parse = function(xml){
		xmlreader.read(xml, function(err, res){
			
			logger.info("receive " + res["feed"]["entry"].count() + " alerts");
			
			res["feed"]["entry"].each(function(index, entry){
				
				var category = entry["category"];
				var updated = entry["updated"];
				var properties = entry["content"]["m:properties"];
				
				var alert_id = uuid.v4();
				
				var alert_type = category.attributes().term;
				
				var application_id = properties["d:OBJECTNO"].text();
				var application_name = properties["d:DESCRIPTION"].text();
				
				var alert_name = "Alert_" + application_name;
				
				var alert_severity = "Low";
				
				var value = properties["d:BPM_RED_HISTORY"].text();
				
				if(value > 9000){
					alert_severity = "High";
				}
				else if (value <= 9000 && value > 800){
					alert_severity = "Medium";
				}
				else {
					alert_severity = "Low";
				}
				
				var alert_raisedtime =  new Date(updated.text());
				alert_raisedtime =  new Date();
				
				var alert = {
					alert_id : alert_id,
					alert_name : alert_name,
					alert_type : alert_type,
					alert_description: "From SolMan",
					application_id : application_id,
					application_name : application_name,
					alert_severity : alert_severity,
					alert_raisedtime : alert_raisedtime,
					account_id : "SAP Account"
				}
				
//				logger.info("monitoring alert: " + JSON.stringify(alert));
				
				if(alert_name != "Alert_Z_BPMon_CPG"){
					return;
				}
				
				self.processAlerttoListener(alert);
			})
		});
	}
	
	this.processAlerttoListener = function(alert){
		AMAServiceMonitoringAgent.processRequest(alert, function(){});
	}
	
	
	var make_base_auth = function (user, password) {
		var tok = user + ':' + password;
		var hash = new Buffer((tok)).toString('base64');
		return"Basic "+ hash;
	}
	
	
	this.getContent = function(callback){
		var url = config.solman_base;
		var username = config.solman_user;
		var password = config.solman_pass;
		
		var auth_header = make_base_auth(username, password);
		
		var urlObj = URL.parse(url);
		var option = {
			method : "POST",
			port : urlObj.port,
			hostname : urlObj.hostname,
			path : urlObj.path,
			headers : {
				"Authorization" : auth_header,
				"Content-Type" : "application/json"
			},
		}
		var req = https.request(option, function(res) {
			var data = '';
			res.on("data", function(chunk) {
				data += chunk;
			});
			res.on("end", function() {
				if(res.statusCode != 200){
					return callback(new Error(data));
				}
				callback(null, data);
			});
			
			res.on("error", function(e){
				logger.info("error message: " + e.message);
				callback(e);
			});
			
		});
		req.on("error", function(e) {
			logger.info("error message: " + e.message);
			callback(e);
		});
		req.end();
		
	}
	
}

module.exports = SolManAdapter;

var INTERVAL = 30 * 1000;
var adapter = new SolManAdapter();
SocketManager.emit("Monitoring/refresh", INTERVAL);
//setInterval(function(){
//	adapter.getContent(function(err, data){
//		if(!err){
//			logger.info("get alert report from service: " + data);
//			adapter.parse(data.toString());
//		} else {
//			fs.readFile(path.join(__dirname, '/response.xml'), function (err2, data2) {
//				if (err2){
//					logger.error(err2);
//				}
//				if(!err2){
//					logger.info("get alert report from file");
//					adapter.parse(data2.toString());
//				}
//			});
//		}
//	});
//
//
//	SocketManager.emit("monitoring/refresh", INTERVAL);
//}, INTERVAL);
