/**
 *
 * Utility Module to intercept user response from the ongoing chat
 * and initiate subsequent processing.
 */
 var moment = require('moment');
var obj = require("./goldenBridgeUtil.js");
var Client = require('node-rest-client').Client;
var cbconfig = require("../config/chatbot_config.json");

 exports.processUserResponse = function (input_context, input_params,currentuser) {
   console.log("Inside utils processUserResponse...");
   console.log("==Input context======"+JSON.stringify(input_context));
   
   if(input_context.service_endpoint!=null){
	   
	   console.log("\n ----------service_endpoint:- "+input_context.service_endpoint);
	   
	   if ((input_context.service_endpoint != "" || input_context.service_endpoint != null)){
			   
				   console.log("==currentuser======"+currentuser);
				   //modifyInput.modifyInputParam(input_context);
				   obj.callGB(input_context.service_endpoint,input_context,currentuser);
				   input_context.service_endpoint = null;
	   }else {
		   console.log("service_endpoint in dialog api is empty");
	   }
	   
	   input_context.service_endpoint = null;
	   //input_context.address = null;
	   //input_context.phone = "";
	   /*input_context.transactionNo = null;
	   input_context.esn = null;
	   input_context.personName = null;
	   //input_context = null;
	   //delete input_context.phoneNo;
	   delete input_context.transactionNo;
	   delete input_context.esn;
	   delete input_context.personName;*/
	   
   }else {
	   console.log("No service_endpoint defined in dialog api till now");
   }
   
  
 }
