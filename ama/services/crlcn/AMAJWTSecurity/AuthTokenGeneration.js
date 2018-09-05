var http = require("http");
var URL = require("url");
var path = require("path");
var uuid = require("node-uuid");
var moment = require("moment");
var jwt = require('jwt-simple');

var models = require("../../../../models");
var UserCredentialModel = models.UserCredential;
var logger = getLogger("AMAJWTService");
var SOPConfig = require("../../../../config/SOPConfig.json");

var loginPrem = function(username, password, callback) {
	var path = "/rest/v1/sopmeta/loginPrem";
	var option = {
		method : "POST",
		port : global_server_port,
		hostname : global_server_host,
		path : path,
		headers : {
			"Content-Type" : "application/json",
			"Authorization" : SOPConfig.basicAuthHeader,
		}
	}
	var req = http.request(option, function(res) {
		var data = '';
		res.on("data", function(chunk) {
			data += chunk;
		});
		res.on("end", function() {
			try {
				if (res.statusCode != 200) {
					return callback(new Error(data + "(" + url + ")"));
				}
				var result = JSON.parse(data);
				callback(null, result.response);
			} catch (e) {
				callback(e);
			}
		});
	});
	req.on("error", function(e) {
		logger.info("error message: " + e.message);
		callback(e);
	});
	var userObject = {
		authenticationFrom : "enterprise",
		userName : username,
		password : password
	};
	req.write(userObject);
	req.end();
}

exports.generateJWTToken = function(req, res) {

	// call the login service to validate the user info
	UserCredentialModel.findOne({
		"userName" : req.body.userName
	}).lean().exec(function(err, usercred) {
		if (err) {
			var errorCode = errorcodes["DBError"];
			res.status(errorCode.statusCode).json({
				message : errorCode.userMessage,
			});
			return;
		} else if (!usercred) {
			res.status(400).json({
				message : "Invalid user credentials are provided.",
			});
		} else {
			var bcrypt = require('bcrypt-nodejs');
			var encpwd = usercred.password;
			var result = bcrypt.compareSync(req.body.password, encpwd);
			if (result == true) {
				// generate the token
				var expires = moment().add('days', 7).valueOf();
				var token = jwt.encode({
					iss : usercred._id,
					exp : expires
				}, jwtTokenKey);

				res.status(200).json({
					token : token,
					expires : expires
				});
			} else {
				res.status(400).json({
					message : "Invalid user credentials are provided.",
				});
			}
		}
	});
}
