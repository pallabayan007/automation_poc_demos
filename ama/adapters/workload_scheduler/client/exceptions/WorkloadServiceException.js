function WorkloadServiceException() {
	
}

WorkloadServiceException.launchException = function(result) {
		result=tryParseJSON(result);
		var msg = "";

		if(result.message != null && result.cause != null){
			//console.log("Message: "+result.message+ ". Cause: "+result.cause);
			msg = "Message: "+result.message+ ". Cause: "+result.cause;
			return msg;
		}
							
		if(result.message != null){
		//	console.log("message"+result.message);
			msg = "Message: "+result.message;
			return msg;
			//	callback ("Message: "+result.message);
		}
							
		if(result.cause != null){
		//	console.log("cause"+result.cause);
			msg = "Cause: "+result.cause;
			return msg;
			//callback( "Cause: "+result.cause);
		}
		
		if(result === "")
			return "Client Error";
		else
			return result;

};

function tryParseJSON(string){
	try {
		var temp = JSON.parse(string);
		if(temp && typeof temp === "object" && temp !== null){
			return temp;
		}
	}catch(e){
		
	}

	return string;
}



module.exports = WorkloadServiceException;