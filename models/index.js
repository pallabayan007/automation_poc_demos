var mongoose = require("mongoose");
var _s = require("underscore.string");

//***************ARIJIT************************
/*var databaseUrl = "mongodb://IbmCloud_h65aeqju_lm95s3it_qcobq5ft:-pnC2fSAqdtx7hptLNJsRK1u71inRBWo@ds041190.mongolab.com:41190/SAP_Cl_DB"; // "username:password@example.com/mydb"
var collections = ["things"]
var db1 = require("mongojs").connect(databaseUrl, collections);*/

//***************ARIJIT************************

var logger = getLogger("DB");

var appProperty= require('../config/app_config.json');

var conn = null;
var db;
if (process.env.VCAP_SERVICES) {
	// var env = JSON.parse(process.env.VCAP_SERVICES);
	//console.log(env);
	// if (env["mongolab"] && env["mongolab"][0]
			// && env["mongolab"][0].credentials) {
		mongodb_uri = appProperty['deployment-specific-properties']['CLOUD'].credentials.uri;
		db = mongoose.createConnection(mongodb_uri);
		/*var dbUrl = env['mongolab'][0].credentials.uri;
		logger.info(dbUrl);
		var dbStr = dbUrl.split('/');
		logger.info(dbStr[dbStr.length-1]);
		var db2 = mongoose.createConnection("mongodb://IbmCloud_h65aeqju_lm95s3it_qcobq5ft:-pnC2fSAqdtx7hptLNJsRK1u71inRBWo@ds041190.mongolab.com:41190/SAP_Cl_DB");
		db2.on('error', console.error.bind(console, 'connection error:'));
		db2.once('open', function (callback) {
		  logger.info("conncted to db2!!");
		});*/
		logger.info("using bluemix database");
	// }
}
if (!db) {
	//Radha
	mongodb_uri = appProperty['deployment-specific-properties']['ON_PREM'].dbConnectionURL;
	//mongodb_uri = "mongodb://IbmCloud_h65aeqju_lm95s3it_qcobq5ft:-pnC2fSAqdtx7hptLNJsRK1u71inRBWo@ds041190.mongolab.com:41190/IbmCloud_h65aeqju_lm95s3it";
	db = mongoose.createConnection(mongodb_uri);
	
	
	//db = mongoose.createConnection('localhost', 'amadb');
	//logger.info("using local database");
}

var TicketAuditLogModel = require("./TicketAuditLogModel.js");
exports.TicketAuditLog = db.model('ticketauditlog', TicketAuditLogModel);

var AlertAuditLogModel = require("./AlertAuditLogModel.js");
exports.AlertAuditLog = db.model('alertauditlog', AlertAuditLogModel);

var AlertModel = require("./AlertModel.js");
exports.Alert = db.model('alert', AlertModel);

var AccountModel = require("./AccountsModel.js");
exports.Account = db.model('account', AccountModel);

var ApplicationModel = require("./ApplicationsModel.js");
exports.Application = db.model('application', ApplicationModel);

var UserAccessModel = require("./UsersAccessModel.js");
exports.UserAccess = db.model('user', UserAccessModel);

var RoleModel = require("./RolesModel.js");
exports.Role = db.model('role', RoleModel);

var CapabilityModel = require("./CapabilitiesModel.js");
exports.Capability = db.model('capability', CapabilityModel);

var ClientModel = require("./ClientsModel.js");
exports.Client = db.model('client', ClientModel);

var SQLAdapterAlertLastTS = require("./SQLAdapterAlertLastTSModel.js");
exports.SQLAdapterAlertLastTS = db.model('SQLAdapterAlertLastTS', SQLAdapterAlertLastTS);

var JOBEventModel = require("./JOBEventsModel.js");
exports.JOBEvent = db.model('jobevent', JOBEventModel);
exports.JOBEventModel = JOBEventModel;


var SavedSearchModel = require("./SavedSearchModel.js");
exports.SavedSearch = db.model('savedsearch', SavedSearchModel);

var UserCredentialModel = require("./UserCredentialModel.js");
exports.UserCredential = db.model('usercredential', UserCredentialModel);

var TicketModel=require("./TicketModel.js");
exports.Ticket = db.model('ticket', TicketModel);

var SOPModel=require("./SOPModel.js");
exports.SOP = db.model('sop', SOPModel);

var BPMNModel = require("./BpmnModel.js");
exports.BPMN = db.model('bpmn', BPMNModel);

var EmailWhiteListModel=require("./EmailWhiteListModel.js");
exports.EmailWhiteList = db.model('emailwhitelist', EmailWhiteListModel);

var ChoreographModel=require("./ChoreographsModel.js");
exports.Choreograph = db.model('choreograph', ChoreographModel);
exports.ChoreographModel = ChoreographModel;

var TransactionAuditLogsModel = require("./TransactionAuditLogsModel.js");
var TransactionAuditLog = exports.TransactionAuditLog = db.model('transactionAuditLog', TransactionAuditLogsModel);

var HumanActivityModel = require("./HumanActivityModel.js");
exports.HumanActivity = db.model('humanactivity', HumanActivityModel);


var AuditOnCreatOrUpdate = function(data, collectionName){
	var _id = data._id;
	TransactionAuditLog.findOne({auditTargetId: _id}, function(err, auditLog){
		var eventType = "Create";
		if(auditLog){
			eventType = "Update";
		}
		var auditLog = new TransactionAuditLog({
			auditTargetId : _id,
			updateTimeStamp: data.updateTimeStamp || new Date(),
			eventType: eventType,
			updatedByUserId: data.updatedByUserId || "defaultuser@ibm.com",
			updatedCollectionName : _s.titleize(collectionName),
			updatedCollectionTimestamp : new Date(),
			previousDescription : data.previousDescription,
			currentDescription:  data.currentDescription,
			updateComment: data.updateComment || eventType + " "+ _s.titleize(collectionName),
			serviceName : data.serviceName || eventType + _s.titleize(collectionName)
		});
		auditLog.save(function(err, ret){
			if(err){
				logger.info("Get an error when audit " + JSON.stringify(data) + " in collection "+ collectionName);
			}
			logger.info("%s has been %sd by %s in collection %s with comment \"%s\"", ret.auditTargetId, ret.eventType.toLowerCase(), ret.updatedByUserId, ret.updatedCollectionName, ret.updateComment);
		});
	})
}

var AuditOnDelete = function(data, collectionName){
	var _id = data._id;
	var auditLog = new TransactionAuditLog({
		auditTargetId : _id,
		updateTimeStamp: data.updateTimeStamp || new Date(),
		eventType: "Delete",
		updatedByUserId: data.updatedByUserId || "defaultuser@ibm.com",
		updatedCollectionName : _s.titleize(collectionName),
		updatedCollectionTimestamp : new Date(),
		previousDescription : data.previousDescription,
		currentDescription:  data.currentDescription,
		updateComment: data.updateComment ||  "Delete "+ _s.titleize(collectionName),
		serviceName : data.serviceName || "Delete" + _s.titleize(collectionName)
	});
	auditLog.save(function(err, ret){
		if(err){
			logger.info("Get an error when audit " + JSON.stringify(data) + " in collection "+ collectionName);
		}
		logger.info("%s has been %sd by %s in collection %s with comment \"%s\"", ret.auditTargetId, ret.eventType.toLowerCase(), ret.updatedByUserId, ret.updatedCollectionName, ret.updateComment);
	});
}

var AuditDataModel = function(model, collectionName){
	/**
	 * COMMENT: It has to add both save/update before mongoose 4.0. 
	 * https://github.com/Automattic/mongoose/issues/964
	 */
	model.post('save', function(data) {
		AuditOnCreatOrUpdate(data, collectionName);
	});
	model.post('updated', function(data) {
		AuditOnCreatOrUpdate(data, collectionName);
	});
	model.post('remove', function(data) {
		AuditOnDelete(data, collectionName);
	});
}
//Doing Auditing
AuditDataModel(AlertModel, "alert");
AuditDataModel(AccountModel, "account");
AuditDataModel(ApplicationModel, "application");
AuditDataModel(UserAccessModel, "user");
AuditDataModel(RoleModel, "role");
AuditDataModel(CapabilityModel, "capability");
AuditDataModel(ClientModel, "client");

