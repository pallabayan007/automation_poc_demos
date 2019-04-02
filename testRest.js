var Client = require('node-rest-client').Client;

var client = new Client();

var payload = null;
				
				
				payload = {
					
					headers: { "Content-Type":"application/json"}

				};
				
	var req =	client.post('https://gb-app.mybluemix.net', payload, function (data, response) {
		    // parsed response body as js object
				console.log("\n-----Plain Data  "+data);
			    //console.log("\n----Strigyfied Data  "+JSON.stringify(data));
				var jsonStr = '{"Success": "Y", "Delivery Number": "01810098", "Customer Number": "US001983", "Sales Organization": "9000"}';
				//var jsonStr = data;
				var strJson = JSON.parse(jsonStr);
				console.log("\n----Strigyfied Data  "+JSON.stringify(strJson));
				
				console.log("\nSuccess---" + strJson["Success"]);

				console.log("\nDelivery Number---" + strJson["Delivery Number"]); 			    
		});
		
		req.on('error', function (err) {
		    console.log("\nError while calling Rest Service "+err);
		    
		    //return;
		});