//This is for global function used to return success message for exception handling architecture.

exports.successMessage = function (OperationName,ServiceCode,UserMessage,InternalMessage,ResponseJson) {
	var msgJson={};
	msgJson.operationName=OperationName;
    msgJson.serviceCode=ServiceCode;
    msgJson.userMessage=UserMessage;
    msgJson.internalMessage=InternalMessage;
    msgJson.response=ResponseJson;
    return(msgJson);
};