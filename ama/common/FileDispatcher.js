var Client = require('ftp');
var c=new Client();
exports.transferFileToAutomationServer  = function(connectionProperties, filePath, fileName, callback) {
	c.connect(connectionProperties);
	c.on('ready', function () {
		c.put(filePath + '/' + fileName, fileName, function(err) {
	      if (err) {
	    	  callback(err);
	      } else {
	    	  callback (null);
	      }
	      c.end();
	    });
	});
}