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

module.exports = function(req, res, next) {

	var token = (req.body && req.body.access_token)
			|| (req.query && req.query.access_token)
			|| req.headers['x-access-token'];

	if (token) {
		try {
			var decoded = jwt.decode(token, jwtTokenKey);

			// handle token here
			if (decoded.exp <= Date.now()) {
				res.status(400).json({statusCode : "1", message : 'Access token has expired'});
			}

			// call the login service to validate the user info
			UserCredentialModel.findOne({
				_id : decoded.iss
			}).lean().exec(function(err, usercred) {
				if (usercred) {
					req.user = usercred;
					next();
				} else {
					res.status(400).json({statusCode : "1", message : 'Access token is not valid'});
				}
			});
		} catch (err) {
			var returnObj = {statusCode : "1", message : 'Access token invalid'}; 
			res.status(400).json(returnObj);
			return;
		}
	} else {
		res.status(400).json({statusCode : "1", message : 'Access token not provided'});
	}
}
