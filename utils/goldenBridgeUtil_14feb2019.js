var cbconfig = require("../config/chatbot_config.json");
var Client = require('node-rest-client').Client;


exports.callGB = function (serviceendpoint,input_context,currentuser) {	

		console.log("\nInside callGB Name ......"+JSON.stringify(input_context));		
		
		var operationdetailjson = cbconfig.automationnames[serviceendpoint];
		if(operationdetailjson){
				var args = {
			    data: {"userName" : operationdetailjson.gb_username, "password" : operationdetailjson.gb_password},
			    headers: { "Content-Type":operationdetailjson.content_type , "Authorization": operationdetailjson.authorization }
			};
			var client = new Client();
			var req = client.post(operationdetailjson.gb_token_url, args, function (data, response) {
				    // parsed response body as js object
				    if (data.token){
						console.log("\nToken:"+data.token);
							var ticketbody = createData(data.token,serviceendpoint,operationdetailjson,input_context,currentuser);
							cognitiveTicketService(data.token,ticketbody,currentuser,operationdetailjson,input_context);
							
					}

				});
			req.on('error', function (err) {
			    console.log("\nError while calling GB",err);
			    SocketManager.emit(currentuser+":AutomationComplete", "Error while calling GB");
			});

		}else {
			console.log("\nError in configuration... "+serviceendpoint+" not defined");
		}
}

		function createData(token,automationName,operationdetail,input_context,currentuser){
			
			
			var payload = null;
				
				
				payload = {
					data: {
					"automationName" : automationName,
					"accountId" : operationdetail.accountId,
					"clientId" : operationdetail.clientId,
					"automationInputParameters" : {"InputString":{}}
				},
					headers: { "Content-Type":operationdetail.content_type , "Authorization": operationdetail.authorization,"x-access-token":token}
				};

				var inputParamKey = null;
				var inputParamValue = null;	
				for(var i=0;i<operationdetail.automationInputParameters.length;i++){
					inputParamKey = operationdetail.automationInputParameters[i];
					inputParamValue = input_context[inputParamKey];
					payload.data.automationInputParameters.InputString[inputParamKey]=inputParamValue;
					 
				}
				console.log("\n***AFTER   PAYLOAD---- "+JSON.stringify(payload));
				

			return payload;
		}

		function cognitiveTicketService(token,ticketbody,currentuser,operationdetailjson,input_context){

			var client = new Client();
			var req =	client.post(operationdetailjson.gb_service_url, ticketbody, function (data, response) {
		    // parsed response body as js object
			    console.log("\n----Execution Id Response "+JSON.stringify(data) + " for current user " + currentuser);
			    var automationExecutionID = data.automationExecutionID;
			    var count = 0;
			    var interval = operationdetailjson.polling_interval;
				  var timer =	setInterval(function() {
			    	count++;
			    	getAutomationExeResult(timer, token, automationExecutionID,currentuser,operationdetailjson,count,input_context);

			    }, interval);
		});

		req.on('error', function (err) {
		    console.log("\nError while calling GB");
		    SocketManager.emit(currentuser+":AutomationComplete", "Error while calling GB");
		    //return;
		});
	}

//get the response(status & message) from GB
  function getAutomationExeResult(timer,token, automationExecutionID,currentuser,operationdetailjson,count,input_context){
	  var args = {
		    data: {"automationExecutionID" : automationExecutionID, "access_token":token},
		    headers: { "Content-Type": operationdetailjson.content_type, "Authorization": operationdetailjson.authorization}
		};
		console.log ("\nGetAutomationExeResult Args: "+ JSON.stringify(args));
		var client = new Client();
		var req = client.post(operationdetailjson.gb_automation_result_url, args, function (data, response) {

			parseResponse(data, timer, token, automationExecutionID,currentuser,operationdetailjson,count,input_context)

		});

		req.on('responseTimeout', function (res) {
    	console.log('response has expired');

		});
  }

//poll for response
  function parseResponse(data, timer, token, automationExecutionID,currentuser,operationdetailjson,count,input_context) {
				console.log("\n----getAutomationExeResult() Response:- "+JSON.stringify(data) + " Count " + count);
				var automationStatusMsg = data.automationStatus;
				var logMessage = data.automationResponseMsg;
				var gbErrorMessage = data.message;
				var bpResponse = null;
				var finalResponse = null;
				var responseJson = null;
				var interval = operationdetailjson.polling_interval;
				var max_count = operationdetailjson.number_of_polling;

				console.log ( "\nAutomation Response Msg:- " + logMessage);
				if(automationStatusMsg=="In Progress"){					
					
						if (count>=max_count){
							console.log("\n\n\nAutomation Timed out.Please try after sometime");
									clearInterval(timer);
									SocketManager.emit(currentuser+":AutomationComplete", 'Automation Timed out.Please try after sometime');
									return;
						}

			   }
				if(automationStatusMsg != "In Progress"){

					clearInterval(timer);
					if(logMessage!=null){
							bpResponse = JSON.parse(logMessage);							
							finalResponse = bpResponse;
							console.log("\n====***==== Final response from RPA:- \n"+finalResponse);
					}else if(logMessage==null){
							console.log("\nError Message - GB:: "+gbErrorMessage);
							bpResponse = gbErrorMessage;
							finalResponse = bpResponse;
					}


					if(automationStatusMsg=="Error"){
						console.log("\n============ "+automationStatusMsg);
						finalResponse = gbErrorMessage;
					}

					console.log("^^^^^^^^^^ currentuser-1 "+currentuser);
					if(finalResponse.hasOwnProperty("returnCode")){						
							
							console.log("\n--- input_context :: "+JSON.stringify(input_context));
							//console.log("\n--- 4GAvailable :: "+finalResponse.returnCode[0]["4GAvailable"]);
							if(finalResponse.returnCode[0].hasOwnProperty("BPError")){
								input_context["returnCode"] = finalResponse.returnCode[0]["BPError"];
								console.log("\n--- BPError-2 :: "+finalResponse.returnCode[0]["BPError"]);
								successMessage = "Sorry, We are having some issues. You can retry after sometime";
							}
							else if(finalResponse.returnCode[0].hasOwnProperty("4GAvailable")){
								input_context["returnCode"] = finalResponse.returnCode[0]["4GAvailable"];
								
								console.log("\n--- 4GAvailable :: "+finalResponse.returnCode[0]["4GAvailable"]);
								if(input_context["returnCode"]=="0"){
									successMessage = "Good news, we do have 4G services there, shall I show you a list of 4G plans?";
								}
								else if(input_context["returnCode"]=="1"){
									successMessage = "Sorry, we are yet to commence 4G coverage in that area. Can I help you with anything else?";
								}
								else if(input_context["returnCode"]=="2"){
									successMessage = "The zipcode: "+input_context["zipcode"]+" was invalid. Please verify the zipcode & try again with a valid one";
								}
							}
							else if(finalResponse.returnCode[0].hasOwnProperty("ticketCreationStatus")){
								input_context["returnCode"] = finalResponse.returnCode[0]["ticketCreationStatus"];
								
								console.log("\n--- ticketCreationStatus :: "+finalResponse.returnCode[0]["ticketCreationStatus"]);
								if(input_context["returnCode"]=="0"){
									var randomNumber = Math.random().toString();
									//var randomNumber1 = randomNumber;
									var leadReferenceNumber = randomNumber.substring(2, 10);
									
									
									successMessage = "This is your order reference number <B>" +leadReferenceNumber+".</B> Would you like a company  representative to  get in touch with you shortly, collect the required <a href=https://www.ideacellular.com/content/ideadigital/in/en/terms-and-condition/ValidProofofAddressandValidProofofIdentity.html target='_blank'> supporting documents</a> and home deliver the SIM?"
								}
								
							}
							
							var payload = {											
								data:{context: input_context},
								headers: { "Content-Type":operationdetailjson.content_type}
							  };
							client = new Client();
							var req = client.post("https://telcoassist.mybluemix.net/"+"api/message", payload, function (data, response) {
								console.log("\n^^^^^^^^^^^  "+JSON.stringify(data));								
								input_context.service_endpoint = null;															
							});
							req.on('error', function (err) {
								console.log("\nError while setting up context");
								//SocketManager.emit(currentuser+":AutomationComplete", "Error while calling GB");
								//return;
							});
							
							responseJson = {"context":input_context, "finalMessage":successMessage};
							
								SocketManager.emit(currentuser+":AutomationComplete", responseJson);	
					}else{
						SocketManager.emit(currentuser+":OtherResponse", "Have not received any response yet. You can retry after sometime");
						
					}

				}
}
