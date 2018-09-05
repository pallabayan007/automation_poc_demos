var WorkloadServiceException = require('../exceptions/WorkloadServiceException');
var url = require('url');
var https = require('https');

function TWS(properties) {
	this.tws = properties;
	this.auth = 'Basic ' + new Buffer(decodeURIComponent(this.tws.userId + ':' + this.tws.password)).toString('base64');
	this.parsed = url.parse(this.tws.url);
	this.query = url.parse(this.tws.url,true).query;
}

TWS.prototype = {
	put : function(key, value, cookie, callback) {
		var post_options = {
			hostname : this.parsed.hostname,
			port : '443',
			path : this.parsed.pathname + '/' + key,
			method : 'PUT',
			headers : {
				'Content-Type' : 'application/json',
				'Authorization' : this.auth,
				'Cookie' : cookie
			},
			rejectUnauthorized : false,
			agent : false,
		};
		var post_req = https.request(post_options, function(res) {
			var resultString = '';
			res.setEncoding('utf8');
			res.on('data', function(chunk) {
				resultString += chunk;
			});
			res.on('error', function(c) {
				console.log('put error: ' + c);
			});
			res.on('end', function() {
				console.log('put status ' + res.statusCode);
				if (res.statusCode === 200) {
						callback(null);
					} else 
					{
						if(resultString != null){
							callback(WorkloadServiceException.launchException(resultString));
						}
						else{
							callback("Put: Internal error");
						}
					}
			});
		});
		post_req.write(JSON.stringify(value));
		post_req.end();
	},
	
	post : function(key, value, cookie, callback) {
		var post_options = {
			hostname : this.parsed.hostname,
			port : '443',
			path : this.parsed.pathname + '/' + key,
			method : 'POST',
			headers : {
				'Content-Type' : 'application/json',
				'Authorization' : this.auth,
				'Cookie' : cookie
			},
			rejectUnauthorized : false,
			agent : false,
		};
		var post_req = https.request(post_options, function(res) {
				
				var resultString = '';
				res.setEncoding('utf8');
				res.on('data', function(chunk) {
					resultString += chunk;
				});
				res.on('error', function(c) {
					console.log('post error: ' + c);
				});
				res.on('end', function() {
					console.log('post status ' + res.statusCode);
					if (res.statusCode === 200) {
						callback(null, JSON.parse(resultString));
					} else 
					{
						if(resultString != null){
							callback(WorkloadServiceException.launchException(resultString));
						
						}
						else{
							callback("Post: Internal error");
						}
						
					}
				});	
		});
		post_req.write(JSON.stringify(value));
		post_req.end();
	},
	
	textpost : function(key, value, cookie, callback) {
		var post_options = {
			hostname : this.parsed.hostname,
			port : '443',
			path : this.parsed.pathname + '/' + key,
			method : 'POST',
			headers : {
				'Content-Type' : 'text/plain',
				'Authorization' : this.auth,
				'Cookie' : cookie
			},
			rejectUnauthorized : false,
			agent : false,
		};
		var post_req = https.request(post_options, function(res) {
			try{
				var resultString = '';
				res.setEncoding('utf8');
				res.on('data', function(chunk) {
					resultString += chunk;
				});
				res.on('error', function(c) {
					console.log('post error: ' + c);
				});
				res.on('end', function() {
					console.log('post status ' + res.statusCode);
					if (res.statusCode === 200) {
						callback(null, JSON.parse(resultString));
					} else 
					{
						if(resultString != null){
							callback(WorkloadServiceException.launchException(resultString));
						}
						else{
							callback("Text Post: Internal error");
						}						
					}
				});
			}
			catch(e){
				console,log(e);
			}
		});
		post_req.write(value);
		post_req.end();
	},
	
	login : function(key, callback) {
		var post_options = {
			hostname : this.parsed.hostname,
			port : '443',
			path : this.parsed.pathname + '/' + key,
			method : 'POST',
			headers : {
				'Content-Type' : 'text/plain',
				'Authorization' : this.auth
			},
			rejectUnauthorized : false,
			agent : false,
			requestCert: true,
		};
		var post_req = https.request(post_options, function(res) {
			var resultString = '';
			res.setEncoding('utf8');
				
			res.on('data', function(chunk) {
				resultString += chunk;
			});
			res.on('error', function(c) {
				console.log('post error: ' + c);
			});
			res.on('end', function() {
				console.log('post status ' + res.statusCode);
					if (res.statusCode === 200) {
						callback(null, res);
					} else 
					{
						if(resultString != null){
							callback(WorkloadServiceException.launchException(resultString));
						
						}
						else{
							callback("Login: Internal error");
						}
						
					}
			});	
	});
			
		//console.log( post_options );		
		post_req.write("engineOwner:"+this.query.engineOwner+",engineName:"+this.query.engineName+",tenantId:"+this.query.tenantId);
		post_req.end();
	},
	
	get : function(key, cookie, callback) {
		var get_options = {
			hostname : this.parsed.hostname,
			port : '443',
			path : this.parsed.pathname + '/' + key,
			method : 'GET',
			headers : {
				'Content-Type' : 'application/json',
				'Authorization' : this.auth,
				'Cookie' : cookie
			},
			rejectUnauthorized : false,
			agent : false,
		};
		
		//console.log(get_options);
		
		
		var get_req = https.request(get_options, function(res) {
			var resultString = '';
			res.on('data', function(chunk) {
				//console.log('get response: ' + chunk);
				resultString += chunk;
			});
			res.on('error', function(c) {
				console.log('get error: ' + c);
			});
			res.on('end', function() {
				console.log('get status ' + res.statusCode);
				if (res.statusCode === 200) {
						callback(null, JSON.parse(resultString));
				} else 
				{
					if(resultString != null){
						callback(WorkloadServiceException.launchException(resultString));
					}
					else{
						callback("Login: Internal error");
					}	
				}
			});
		});
		get_req.end();
		
	},
	
	getlog : function(path, cookie, callback) {
		var get_options = {
			hostname : this.parsed.hostname,
			port : '443',
			path : path,
			method : 'GET',
			headers : {
				'Content-Type' : 'application/json',
				'Authorization' : this.auth,
				'Cookie' : cookie
			},
			rejectUnauthorized : false,
			agent : false,
		};
		
		var get_req = https.request(get_options, function(res) {
			var resultString = '';
			res.on('data', function(chunk) {
				//console.log('getLog response: ' + chunk);
				resultString += chunk;
			});
			res.on('error', function(c) {
				console.log('getLog error: ' + c);
			});
			res.on('end', function() {
				console.log('getLog status ' + res.statusCode);
				if (res.statusCode === 200) {
						callback(null, resultString);
				} else 
				{
					if(resultString != null){
						callback(WorkloadServiceException.launchException(resultString));
					}
					else{
						callback("Login: Internal error");
					}	
				}
			});
		});
		get_req.end();
	},
	
	remove : function(key, cookie, callback) {
		var get_options = {
			hostname : this.parsed.hostname,
			path : this.parsed.pathname + '/' + key,
			port : '443',
			method : 'DELETE',
			headers : {
				'Content-Type' : 'application/json',
				'Authorization' : this.auth,
				'Cookie' : cookie
			},
			rejectUnauthorized : false,
			agent : false,
		};
		var get_req = https.request(get_options, function(res) {
			var resultString = '';
			res.on('data', function(chunk) {
				resultString += chunk;
			});
			res.on('error', function(c) {
				console.log('get error: ' + c);
			});
			res.on('end', function() {
				console.log('get status ' + res.statusCode);
				if (res.statusCode === 200) {
						callback(null);
				} else 
				{
					if(resultString != null){
						callback(WorkloadServiceException.launchException(resultString));
					}
					else{
						callback("Login: Internal error");
					}	
				}
			});
		});
		get_req.end();
	}
};

module.exports = TWS;
