
var URL = require("url");
var http = require("http");
var https = require("https");

var logger = getLogger('AMAEventMapSopService');

var config = require("../../../../config");
var SOPConfig = require("../../../../config/SOPConfig.json");


var getSOPbyAlertID = function(alert_id, callback){
	var sops = sample_data.sops;
	for(var i = 0 ; i < sops.length ; i++){
		if(sops[i].alert_id == alert_id){
			callback(null, sops[i]);
			break;
		}
	}
}


var EventSOPMapEngine = function(){
	
	this.identifySOPToExecute = function (alert_id, account_id, application_id, alert_audit_log, callback) {
		logger.info('Performance-identify the sop to execute==================>');
		getSOPbyAlertID(alert_id, function(err, data){
			logger.info("Get SOP : " + JSON.stringify(data));
			var ret = {
				sop : data,  
				alert_audit_log: alert_audit_log
			}; 
			callback(err, ret);
		}); 
	}
	
	this.identifyTicketSOPToExecute = function (ticket_audit_log, callback) {
		
		getSOPbyTicketKey(ticket_audit_log.ticketKey, function(err, data){
			logger.info("Get SOP : " + JSON.stringify(data));
			var ret = {
				sop : data,  
				ticket_audit_log: ticket_audit_log
			}; 
			callback(err, ret);
		}); 
	}
}

var getSOPbyTicketKey = function(ticket_key,  callback){
	var path = "/rest/v1/sopmeta/GetSOPForEvent/ticket?EventKey=" + encodeURIComponent(ticket_key);
	var option = {
		method : "GET",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if(res.statusCode != 200){
					return callback(new Error(data));
				}
				var result = JSON.parse(data);
				callback(null, result.response.SOPs);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});
	req.end();
}


var getSOPbyAlertID = function(alert_id,  callback){
	var path = "/rest/v1/sopmeta/GetSOPListForAlertId?alertId=" + alert_id;
	var option = {
		method : "GET",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if(res.statusCode != 200){
					return callback(new Error(data));
				}
				var result = JSON.parse(data)["response"]["SOPs"][0];
				callback(null, result);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});
	req.end();
}


module.exports = EventSOPMapEngine;

