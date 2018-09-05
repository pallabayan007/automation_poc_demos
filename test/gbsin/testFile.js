//"use strict";

var logger = getLogger("APP");


exports.XMLtoURL = function (req, res){

	var xmlVal="<Response><Dial><Number>919433065267</Number></Dial></Response>";
	//res.set('Content-Type', 'text/xml');
	res.send(xmlVal);
};

exports.CallBackForPlivoAnswer = function (req, res){
	console.log("inside CallBackForPlivoAnswer========== ");
	logger.info("inside CallBackForPlivoAnswer========== ");
	logger.info(req);
	console.log(req.body);
	logger.info(req.body);
	var xmlVal="<Response><Dial><Number>919433065267</Number></Dial></Response>";
	//res.set('Content-Type', 'text/xml');
	res.send(xmlVal);
	//res.send("OK");
};


