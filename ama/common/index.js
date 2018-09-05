var log4js = require('log4js')
var url = require("url");

log4js.configure('./config/log4js.properties', { reloadSecs: 300 });

global.getLogger = function(name){
	var logger = log4js.getLogger(name);
	return logger;
}

//Checks whethern given paramter d represents a valid Date
global.isValidDate = function(d) {
  tempDate = Date.parse(d);
	//For Date it will be a Number. NaN otherwise
	return !isNaN(tempDate);
}

global.validateDateParams = function (params) {
	var dateFields = ["updateTimestampFrom", "updateTimestampTo","from","to"];
  var isValidationError = "";
	for (index =0 ; index < dateFields.length ; index++) {
		 tempField = dateFields[index];
		 if (params[tempField]) {
			 if (!isValidDate(params[tempField])) {
				  isValidationError = "Incorrect Date Param:"+tempField;
					break
			 }
		 }
	}
  return isValidationError;
}


require("./SocketManager.js");
