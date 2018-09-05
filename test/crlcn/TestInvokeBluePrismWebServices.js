/**
 * New node file
 */

var http = require("http");

// var obj = null;
//
// obj = {"name":"test"};
//
// obj["test2"] = 111;
//
// console.log (obj);
// console.log(obj.test2);
// console.log(obj["test2"]);
//
// var getAccountInfoURL =
// "http://localhost:3000/rest/v1/sopmeta/GetAccountForClient?clientName="
// + "client1";
// http.get(getAccountInfoURL, function(res) {
// console.log("Got response: " + res.statusCode);
// res.on('data', function(data) {
// console.log("Got data: " + data);
// // set accounts
// accounts = data;
// });
// }).on('error', function(e) {
// console.log("Got error: " + e.message);
// });

// var getAccountList = function(callback){
// // var path = "/rest/v1/sopmeta/GetAccountForClient?clientName=" +
// clientName;
// var path = "/rest/v1/sopmeta/GetAccountList";
// var option = {
// method : "GET",
// // port : global_server_port,
// // hostname : global_server_host,
// port : "3000",
// hostname : "localhost",
// path : path,
// headers : {
// "Content-Type" : "application/json",
// "Authorization" : SOPConfig.basicAuthHeader,
// }
// }
// var req = http.request(option, function(res) {
// var data = '';
// res.on("data", function(chunk) {
// data += chunk;
// });
// res.on("end", function() {
// try {
// if(res.statusCode != 200 && res.statusCode != 201){
// return callback(new Error(data));
// }
// console.log(data);
//				
// var result = JSON.parse(data);
//							
// debugger;
//				
// if(result.length == 0){
// return callback(new Error("cannot find account info of the client :" +
// clientName));
// }
//
// console.log(JSON.stringify(result));
// callback(null, result);
//				
// } catch (e) {
// callback(e);
// }
// });
// });
// req.on("error", function(e) {
// console.log("error message: " + e.message);
// callback(e);
// });
// req.end();
// }
//
// var callback = function(err, data){
// if (!err) {
// console.log(data);
// } else {
// console.log(err);
// }
// }
//
// getAccountList(callback);

// var CronJob = require('cron').CronJob;
//
// var job = new CronJob({
// cronTime : '00 00 * * * *',
// onTick : function() {
// /*
// * Runs every weekday (Monday through Friday) at 11:30:00 AM. It
// * does not run on Saturday or Sunday.
// */
// debugger;
// console.log("cron issues an event now: "
// + new Date().toLocaleString());
// },
// start : false,
// timeZone : 'America/Los_Angeles'
// });
// job.start();

exports.invokeBluePrismWebServices = function(req, res){
	var soap = require("soap"); 
	//var url = "http://9.121.230.73:8181/ws/SAPCheckLockEntriesNew?wsdl";
	var url = "http://cap-sg-prd-5.integration.ibmcloud.com:15010/ws/SAPCheckLockEntriesNew?wsdl";
	//var endpoint = http://JBISWAS1:8181/ws/SAPCheckLockEntriesNew
	var available_endpoint = "http://cap-sg-prd-5.integration.ibmcloud.com:15010/ws/SAPCheckLockEntriesNew"; 

	var args = {
		Client : "800", 
		System : "RS6",
		Transaction : "SM12"
	};

	var options = {
		endpoint : available_endpoint
	};

	var credentials_username = 'admin'; 
	var credentials_password = 'SniMadhav3@'; 
	var function_name =  'SAPCheckLockEntriesNew'; 

	// to asynchronously invoke the web service and record the status info locally (e.g., saved as in-memory variables)		
	soap.createClient(url, options, function(err, client) {
		client.setSecurity(new soap.BasicAuthSecurity(credentials_username, credentials_password));
		var toInvokeFunction = client[function_name];  
		toInvokeFunction(args, function(err, result) {

//			if(err)
//				res.send(400, "Error creating audit logs: " + err);
//			else {
//				res.send(JSON.stringify(result));
//			}
			
			if (err) {
				// set err message
				console.log(err);
				res.send(400, "Error creating audit logs: " + err);
			}

			if (result) {
				// set the status
				console.log(result);
				res.send(JSON.stringify(result));
			}
			
		});
		console.log("Created the client and finish the invocation. wait for the result...");
	});
};
