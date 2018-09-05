var http = require("http");
var URL = require("url");
var path = require("path");
var uuid = require("node-uuid");
var moment = require("moment");

var models = require("../../../../models");
var excelOperator = require("../../../common/ExcelOperator");
var mapperConfig = require("../../../../config/mapper_config.json"); 
var logger = getLogger("AMAAdminService");

var TransactionAuditLog = models.TransactionAuditLog;

var collectionMap = mapperConfig.collectionUIMapper; 

//{
//	"Alert" : "SOP Editor",
//	"Account" : "SOP Editor",
//	"Application" : "SOP Editor",
//	"Client" : "SOP Editor",
//	"User" : "Admin Portal",
//	"Role" : "Admin Portal",
//	"Capability" : "Admin Portal",
//}

var cloneObject = function(a){
	return JSON.parse(JSON.stringify(a))
}


exports.downloadTransactionAuditLog = function(req, res){
	var user = req.query.user_id;
	TransactionAuditLog.find().lean().exec(function(err, results){
		var timestamp = new Date().getTime();
		var excelFileName = "TransactionAuditLog_" + timestamp + ".xlsx"; 
		var initial = [
			["Swarnasetu Audit Log Report"],
			["------------------------------------------"],
			["Genereated By " + user],
			["Generation Time:" + moment().format("YYYY/MM/DD HH:mm:ss")],
			["Changes happened in Swarnasetu for time slot (From :   To: )"], 
			[""],
			["Swaransetu users have made the following changes to the DB collections:"],
			[""],
			["Collection Name","Updated Collection Time",  "Object Id", "Event Type", "Service Name", "Updated Comment", "Updated by User ID", "Update Time", "Previous", "Current"]];
		var sheets = {"SOP Editor" : cloneObject(initial), "Admin Portal" : cloneObject(initial)};
		for(var i = 0 ; i < results.length ; i++){
			var item = results[i];
			sheets[collectionMap[item.updatedCollectionName]].push([
			    item.updatedCollectionName,
			    moment(new Date(item.updatedCollectionTimestamp)).format("YYYY/MM/DD HH:mm:ss"),
			    item.auditTargetId,
			    item.eventType,
			    item.serviceName,
			    item.updateComment,
			    item.updatedByUserId,
			    moment(new Date(item.updateTimeStamp)).format("YYYY/MM/DD HH:mm:ss"),
			    item.previous,
			    item.current
			]);
		}
		excelOperator.writeExcel2 (sheets, excelFileName);
		var filepath = path.resolve(__dirname, "../../../../temp/" + excelFileName);
		res.download(filepath, excelFileName);
	});
}

