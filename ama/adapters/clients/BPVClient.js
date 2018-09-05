var http = require("http");
var URL = require("url");

var auth = "Basic: UW5yY2g4TVdreW1zODVuaw==";
var logger = getLogger("BPVClient");

var BPVClient = function(user, password, server, database, account, client) {

	var self = this;
	
	this.user = user;
	this.password = password;
	this.server = server;
	this.database= database;
	this.account = account;
	this.client = client;
	
	logger.info("using SQL  based on : " + this.database );
	var sql = require('mssql'); 
	var config = {
		    user: this.user,
		    password: this.password,
		    server: this.server, // You can use 'localhost\\instance' to connect to named instance 
		    database: this.database   
		   
		} 
	
	/*var config = {
		    user: user,
		    password: password,
		    server:  server, // You can use 'localhost\\instance' to connect to named instance 
		    database: database  
		   
		}*/
	
	this.getAllAlerts = function(data, callback) {
		logger.info("data in BPVClient------------------------>" +data);
		
		if(data!=null){
		lastTimestamp = data.updateTimestamp;
		//dateLast = new Date(lastTimestamp);
		
		//logger.info("dateLast ::"+dateLast)
		logger.info("lastTimestamp in BPVClient"+lastTimestamp);
		//var str ="Thu Oct 15 2015 10:14:11 GMT+0530 (India Standard Time)";
		dateLast = new Date(lastTimestamp).toJSON().substring(0,19).replace('T',' ');
		logger.info("dateLast in BPV"+dateLast );
		var str2="' <= create_timestamp";
		var queryString = "SELECT * FROM [dbo].[Alert_staging2] WHERE  DATEDIFF(day, create_timestamp, '"+dateLast+str2;
			
		var queryString = "SELECT * FROM [dbo].[Alert_staging2] WHERE '" +  dateLast+str2 ;
		// var param = lasttimestamp + ") = 2"
		// var queryString = "SELECT * FROM [dbo].[Alert_staging2] WHERE  DATEDIFF(day, create_timestamp," + param;
		  sqlCall(queryString, function(err, data) {
		     if (typeof err !== "undefined" && err !== null) {
		       logger.info("err" +err);
		       return;
		     }

		    logger.info(data);
		    for (var i = 0; i < data.length; i++) {
				logger.info(data[i].alert_staging_id);
				data[i].accountName = self.account;
				data[i].clientName = self.client;
				data[i].alertPublishName = "SQLAlert";
				
			}
		    callback(null, data);
			logger.info("receive %s alerts from BPV", data.length);
		  });
		}else{
			logger.info("inside if no data in BPV data");
			var queryString = "SELECT * FROM [dbo].[Alert_staging2];" 
				sqlCall(queryString, function(err, data) {
				     if (typeof err !== "undefined" && err !== null) {
				       logger.info("err" +err);
				       return;
				     }

				    logger.info(data);
				    for (var i = 0; i < data.length; i++) {
						logger.info(data[i].alert_staging_id);
						data[i].accountName = self.account;
						data[i].clientName = self.client;
						data[i].alertPublishName = "SQLAlert";
						
					}
				    callback(null, data);
					logger.info("receive %s alerts from BPV", data.length);
				  });	
		}
	}
	function sqlCall(query, cb) {
		  var connection = new sql.Connection(config, function(err) {
		    if (typeof err !== "undefined" && err !== null) {
		    	logger.info("inside sqlCall error");
		      cb( err );
		      return
		    }

		    var request = new sql.Request(connection); // or: var request = connection.request();
		    request.query(query, function(err, recordset) {
		    	logger.info("inside sqlCall correct");
		      cb( err, recordset );
		    });

		  });

		}

}

module.exports = BPVClient;
