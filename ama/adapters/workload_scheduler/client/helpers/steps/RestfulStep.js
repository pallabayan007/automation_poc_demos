var Step = require('../Step');

function RestfulStep(agent, uri,  method,  TextBody, InputTextBody, accept, contentType, userName, password, keyStoreFilePath, keyStorePassword, verifyHostname, outputFileName, queryParameters, InputFileName, headers, JsonObjectResultQuery) {
	Step.call(this);
	this.type = "restful";
	this.target = agent;
	this.user = "";
	if(uri == null){
		throw "Error: URI is null";
	}
	else{
		this.properties.URI = uri;
	}
	
    if(accept == null){
    	this.properties.Accept = "application/json";
    }else{
    	this.properties.Accept = accept;
    }
    
    if(headers == null){
    	this.properties.Headers =[];
    }else{
    	this.properties.Headers = headers;	
    }
    
    if(contentType == null){
    	 this.properties.contentType = "application/json";
    }
    else{
    	  this.properties.contentType = contentType;  	
    }
    
    if(method == null){
    	this.properties.method = "GET";
    }
    else{
    	if(method == "POST" || method == "GET" || method == "PUT" || method == "DELETE" || method == "HEAD")
    	{
    		this.properties.method = method;
    	}
    	else{
    		throw "Error: the value is not valid";
    	}
    }
    
    if(userName == null){
    	this.properties.User = "";
    }
    else{
    	this.properties.userName = userName;
    }
    
    if(password == null){
    	this.properties.password = "";
    }
    else{
    	this.properties.password = password;
    }
    
    if(keyStoreFilePath == null){
    	this.properties.keyStoreFilePath = "";
    }
    else{
    	this.properties.keyStoreFilePath = keyStoreFilePath;
    }

	if(keyStorePassword == null){
    	this.properties.keyStorePassword = "";
    }
    else{
    	this.properties.keyStorePassword = keyStorePassword;
    }
    
    if(outputFileName == null){
    	this.properties.outputFileName = "";
    }
    else{
    	this.properties.outputFileName = outputFileName;
    }
    
    if(queryParameters == null){
    	this.properties.QueryParameters = [];
    }
    else{
    	this.properties.QueryParameters = queryParameters;
    }
    
    if(TextBody == null){
    	this.properties.FileBody = "";
    	this.properties.TextBody = "";
    }
    else{
    	this.properties.FileBody = !TextBody;
    	this.properties.TextBody = TextBody;
    }
    
    if(JsonObjectResultQuery == null){
    	this.properties.JsonObjectResultQuery = "";
    }
    else{
    	this.properties.JsonObjectResultQuery = JsonObjectResultQuery;
    }
  //  this.properties.HostnameVerifyCheckbox = HostnameVerifyCheckbox;


	
}

module.exports = RestfulStep;