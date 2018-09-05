/**
 * Name    - ./ama/gbsin/AMASystemConfigService/index.js
 * Purpose - Contains all system config file related process
 * Date    - Sep 10, 2016
 * 
 */
var fs = require('fs');
var crypto = require('crypto'),
algorithm = "aes-256-ctr",
password = "d6F3Efeq";

//exports.encrypt = function(text){
function encrypt(text){
var cipher = crypto.createCipher(algorithm,password);
var crypted = cipher.update(text,'utf8','hex');
crypted += cipher.final('hex');
return crypted;
}

exports.decrypt = function(text){
var decipher = crypto.createDecipher(algorithm,password)
var dec = decipher.update(text,'hex','utf8')
dec += decipher.final('utf8');
return dec;
} 

/*
 * 
 * 1) readJSONFile Service - reads json file
 *    
 * 2) writeJSONFile Service   - writes JSON file in <app_dir>/config folder
 */

/*
 * REST SERVICE TO CREATE JSON FILE
 * METHOD : GET
 * URI    : /rest/Systemconfig/readJSONFile/:json_file
 */
exports.readJSONFile = function (req, res) {
	//Retrieve JSON File Name From Request
	var fileName = req.params.json_file;
	console.log("Inside readJSONFile");
	var rootConfigPath = "config/";
	if(fileName){
		fs.readFile(rootConfigPath+fileName+".json", function (err, data) {
			   if (err) {
			       return console.error(err);
			   }
			   console.log("Inside readJSONFile: ");
			  // var jsondata = JSON.parse(data);
			   var encryptedjson = new Buffer(data.toString()).toString('base64');
			   //var encryptedjson = encrypt(data.toString());
			   //res.status(200).json(jsondata);
			   res.status(200).send(encryptedjson);
			});
	} else {
		res.status(200).json({"status" : "No json file in request"});
	}
}

/*
 * REST SERVICE TO GENERATE JSON FILE
 * METHOD : POST
 * /rest/Systemconfig/writeJSONFile/:json_file
 */
exports.writeJSONFile = function (req, res) {
	//Retrieve JSON File Name From Request
	var fileName = req.params.json_file;
	console.log("Inside writeJSONFile");
	var jsonData = JSON.stringify(req.body,null, "\t");
	console.log("Inside writeJSONFile "+jsonData);
	var rootConfigPath = "config/";
	if(fileName){
		if (jsonData){
			fs.writeFile(rootConfigPath+fileName+".json", jsonData, function (err) {
			    if (err) {
			        console.log(err);
			        res.status(200).json({"status" : "Error "+err});
			    }
			    res.status(200).json({"status" : "File written successfully"});
			});			
		}else{
			res.status(200).json({"status" : "No json data in request"});
		}
	} else {
		res.status(200).json({"status" : "No json file name in request"});
	}
}
