
/****
 * Module dependencies.
 */


var express = require('express')
  , http = require('http')
  , path = require('path')
  , methodOverride = require('method-override')
  , errorhandler = require('errorhandler')
  , bodyParser = require('body-parser')
  ,	xmlparser = require('express-xml-bodyparser')
  , multer = require('multer')
  , serveStatic = require('serve-static')
  , cors = require("cors")
  , log4js = require('log4js')
  , config = require('./config')
  , common = require('./ama/common')
  , models = require('./models')
  , errorcodes = require('./config/errorcodes.json')
  , servicemessage=require('./config/service_config.json')
  , AMAAdminService = require("./ama/services/crlcn/AMAAdminService")
  , AMADashboardService = require("./ama/services/crlcn/AMADashboardService")
  , AMAServiceMonitoringAdapters = require("./ama/adapters")
  , AMAServiceMonitoringEmailAdapters = require("./ama/adapters/EmailAdapter")
  , AMAServiceMonitoringMappers = require("./ama/mappers")
  , AMAServiceMonitoringAgent = require("./ama/services/crlcn/AMAServiceMonitoringAgent")
  , AMAServiceManagementAgent = require("./ama/services/crlcn/AMAServiceManagementAgent")
  , AMAEventMapSopService = require("./ama/services/crlcn/AMAEventMapSopService")
  , AMASOPCRUDService = require("./ama/services/gbsin/AMASOPCRUDService")
  , AMALoginAuthService=require("./ama/services/gbsin/AMALoginAuthService")
  , AMAAdminCRUDService=require("./ama/services/gbsin/AMAAdminCRUDService")
  , AMATicketService=  require("./ama/services/gbsin/AMASOPCRUDForTicketService")
  , AMAGenericCRUDService=require("./ama/services/gbsin/AMAGenericCRUDService")
  , AMATempCRUDService = require("./ama/services/crlcn/AMATempCRUDService")
  , AMAScheduledMaintenance = require("./ama/services/crlcn/AMAScheduledMaintenance")
  , AMAHealthService = require("./ama/services/crlcn/AMAHealthService")
  , TestInvokeBluePrismWebServices = require("./test/crlcn/TestInvokeBluePrismWebServices.js")
  , AMACognitiveTicketRemediation = require("./ama/services/crlcn/AMACognitiveTicketRemediation")
  , AuthTokenGeneration = require("./ama/services/crlcn/AMAJWTSecurity/AuthTokenGeneration.js")
  , AMAGBAgentIncidentManagerService = require("./ama/services/gbsin/AMAGBAgentIncidentManagerService")
  , AuthTokenValidation = require("./ama/services/crlcn/AMAJWTSecurity/AuthTokenValidation.js")
  , AMAProcessPerformance = require("./ama/services/gbsin/AMAProcessPerformance")
  , AMAAdminArchiveService = require("./ama/services/gbsin/AMAAdminArchiveService")
  , AMASystemConfigService = require("./ama/services/gbsin/AMASystemConfigService")
, AMATest = require("./test/gbsin/testFile");

var systemEnv= require('./config/system_properties.json');

//var middleware = require("./ama/common/middleware.js");




var NodeCache = require( "node-cache" );
myCacheSession = new NodeCache();

//Set system properties here
//process.env.deployment_option='CLOUD';
//process.env.deployment_host='swarnasetu.mybluemix.net';

var app = express();
var logger = getLogger("APP");

var serviceHeaderKeyId='Qnrch8MWkyms85nk';
var encodedData = new Buffer(serviceHeaderKeyId).toString('base64');
var authorizationHeader = 'Basic ' + encodedData;
logger.info('Authorization :==='+authorizationHeader);

// app.locals.authHeader = authorizationHeader;
// all environments
app.use(bodyParser.json({limit: '50mb'}));//Adding limit to support huge data exchange through service - GBA
/*app.use(multer({
    dest: './uploads/'
}));*/
app.use(xmlparser());
app.use('/rest/email/parse', multer().any());
app.use('/rest/v1/email/parse', multer().any());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use('/images', express.static(__dirname + '/public/images'));
app.use('/ama/sop_editor/stylesheets', express.static(__dirname + '/public/ama/sop_editor/stylesheets'));
app.use('/lib/bootstrap/dist/css',express.static(__dirname + '/public/lib/bootstrap/dist/css'));

// logger.info("session userList = "+req.session.userList);
// app.use(serveStatic(__dirname + '/public/ama'));
app.use(serveStatic(__dirname + '/public'));
// var corsOptions = config.corsOptions;
// app.use(cors(corsOptions)); //enable all cors

app.use(function(req, res, next) {
	
	var rString = randomString();
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
	  res.cookie('sessionid', rString, { httpOnly: true });
	  res.cookie('sessionid', rString, { secure: true });
	  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	  next();
});

/*app.use(transportSecurity());*/


	/*if(systemEnv.deployment_type == "CLOUD")
	{
		
		app.enable('trust proxy');
		//enforce https encryption
		app.use (function (req, res, next) {
		    if (req.secure) {
		            // request was via https, so do no special handling
		    		logger.info("logger.info test ========== "+req.secure);
		    		logger.info("vcap app=========== > "+process.env.VCAP_APP_HOST);
		    		logger.info("vcap app=========== > "+process.env.VCAP_APP_PORT);
		            next();
		    } else {
		    	
		    			logger.info("Comes to redorect part===============");
		    			logger.info("Req header=========== > "+req.headers.host+"req url===========> "+req.url);
		    			logger.info("Req header=========== > "+req.headers.host+"req url===========> "+req.url);
		    			//res.redirect('https://' + req.headers.host + req.url);
		    			res.redirect(systemEnv.base_uri + req.url); 
		    }
		});
	}*/

/*logger.info('Check configuration setting==========>');
logger.info('Deployment Option ======>'+process.env.deployment_option);
logger.info('Deployment path =========> '+process.env.deployment_host);*/



app.get('/bpmn', function(req, res, next)
{
	res.sendfile('public/bpmn/index.html');
});

app.all('/rest/*', function(req, res, next) {

	logger.info('Get the boolean flag ----------> '+servicemessage.secured);
	logger.info("Req Method===========> "+req.method);
  var restpayload = JSON.stringify(req.body);
  var queryString=JSON.stringify(req.query);
  logger.info("Check queystring========> "+queryString);
	if (restpayload.length > 3){
		if (restpayload.toLowerCase().indexOf("<script>") >= 0||restpayload.toLowerCase().indexOf("<html>") >= 0||restpayload.toLowerCase().indexOf("</html>") >= 0||restpayload.toLowerCase().indexOf("</script>") >= 0){
			res.status(403).send('Please provide valid parameters. Java Script(XSS) not allowed in input.'); 
		}
	}
	if (queryString.toLowerCase().indexOf("<script>") >= 0||queryString.toLowerCase().indexOf("<html>") >= 0||queryString.toLowerCase().indexOf("</html>") >= 0||queryString.toLowerCase().indexOf("</script>") >= 0){
		res.status(403).send('Please provide valid parameters. Java Script(XSS) not allowed in input.'); 
	}
	if (queryString.toLowerCase().indexOf("<script>") >= 0||queryString.toLowerCase().indexOf("<html>") >= 0||queryString.toLowerCase().indexOf("</html>") >= 0||queryString.toLowerCase().indexOf("</script>") >= 0){
		res.status(403).send('Please provide valid parameters. Java Script(XSS) not allowed in input.'); 
	}
	if(servicemessage.secured=='true')
		{
		logger.info('check header...');
		  // logger.info(authorizationHeader);
		  // logger.info(req.headers);
		  logger.info('-------------------->1>'+req.headers.authorization);
		  // logger.info('Original URL :'+req.originalUrl);
			 if((req.originalUrl.indexOf('/rest/v1/sopmeta/login') >= 0) ||
			  (req.originalUrl.indexOf('/rest/v1/adminmeta/GetAllUserAccess') >= 0) ||
			  (req.originalUrl.indexOf('/rest/v1/sopmeta/ssocallback') >= 0) ||
			  (req.originalUrl.indexOf('/rest/v1/sopmeta/postLogin') >= 0) ||
			  (req.originalUrl.indexOf('/rest/v1/sopmeta/download') >= 0) ||
			  (req.originalUrl.indexOf('/rest/v1/sopmeta/failure') >= 0)) { next(); }
			  else {
				  if(authorizationHeader==req.headers.authorization)
					  {
					  	next();
					  }

				  else
					  res.status(403).send('You are not authorize to access swaransetu service'); }
			  }
	else
		{
			next();
		}
//	next();





	});

app.use(log4js.connectLogger(logger, {level:'info'}));

function randomString() {
    var result = '';
	var length=20;
	var chars="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}


//Make sure you run "npm install helmet" to get the Helmet package.
//var helmet = require('helmet')

// Sets "X-XSS-Protection: 1; mode=block".
//app.use(helmet());





/*
 * app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname +
 * '/tmp', limit: '2mb' }));
 */



// development only
// if (process.env.NODE_ENV === 'development') {
// // only use in development
// app.use(errorhandler());
// }


process.on('uncaughtException', function (err) {
	logger.error(err);
});

// use express 4.x Router
var router = express.Router();

// router.post("/rest/", function(req, res, next){
// throw new Error(req.body.text);
// });


router.post("/v1/test/XMLtoURL", AMATest.XMLtoURL);
router.post("/v1/test/CallBackForPlivoAnswer", AMATest.CallBackForPlivoAnswer);


/** AMAEventMapSopService * */
router.post("/rest/ProcessSOPTranslation", AMAEventMapSopService.ProcessSOPTranslation);
router.post("/rest/ProcessTicketSOPTranslation", AMAEventMapSopService.ProcessTicketSOPTranslation);
router.post("/rest/ProcessTicketSOPTranslation_CognitiveRemediation", AMAEventMapSopService.ProcessTicketSOPTranslation_CognitiveRemediation);

/** AMAServiceMonitoringAgent * */
router.get("/rest/CheckAdapterStatus", AMAServiceMonitoringAgent.CheckAdapterStatus);
router.get("/rest/ListenMonSys", AMAServiceMonitoringAgent.ListenMonSys);
router.post("/rest/ListenMonSys", AMAServiceMonitoringAgent.ListenMonSysCallback);

/** AMAServiceManagementAgent * */
router.post("/rest/ListenEventMapSOPService", AMAServiceManagementAgent.ListenEventMapSOPServiceCallback);
router.post("/rest/ListenTicketEventMapSOPService", AMAServiceManagementAgent.ListenEventMapSOPServiceCallback_Ticket);

router.get("/rest/CloudIntegrationAPITest/:id", AMAServiceManagementAgent.CloudIntegrationAPITest);

router.post("/rest/TaskComplete_Ticket", AMAServiceManagementAgent.TaskComplete_Ticket);
router.post("/rest/ExecuteIOD_Ticket", AMAServiceManagementAgent.ExecuteIOD_Ticket);
router.post("/rest/GetStatus_Ticket", AMAServiceManagementAgent.GetStatus_Ticket);
router.get("/rest/CreateWorkflowTest", AMAServiceManagementAgent.CreateWorkflowTest);
router.get("/rest/GetWorkflowGraph/:tal_id", AMAServiceManagementAgent.getWorkflowGraph);

/** Dashboards* */
router.post("/rest/monitoring", AMADashboardService.monitoring);
router.post("/file/AlertAuditLog/download", AMADashboardService.reqDownloadAlertAuditLog);
router.get("/file/AlertAuditlog/download/:filename", AMADashboardService.downloadAlertAuditLog);
router.post("/file/TicketAuditLog/download", AMADashboardService.reqDownloadTicketAuditLog);

/** Audit Log Archival */
router.get("/rest/AuditLogArchival/ExistingArchives", AMAAdminArchiveService.listArchives);
router.delete("/rest/AuditLogArchival/Archive/:archive_file", AMAAdminArchiveService.deleteArchive);
router.post("/rest/AuditLogArchival/Archive/:archive_file", AMAAdminArchiveService.createArchive);
router.post("/rest/AuditLogArchival/generateCSV/:csv_file", AMAAdminArchiveService.generateCSV);

/** System Config */
router.get("/rest/Systemconfig/readJSONFile/:json_file",AMASystemConfigService.readJSONFile);
//router.post("/rest/Systemconfig/writeJSONFile/:json_file/:json_data",AMASystemConfigService.writeJSONFile);
router.post("/rest/Systemconfig/writeJSONFile/:json_file",AMASystemConfigService.writeJSONFile);

/** Alert Audit Log CRUD Services* */
router.post("/rest/AlertAuditLog", AMATempCRUDService.createAlertAuditLog);
router.get("/rest/AlertAuditLog/:aal_id", AMATempCRUDService.getAlertAuditLog);
router.put("/rest/AlertAuditLog/:aal_id", AMATempCRUDService.updateAlertAuditLog);
router.delete("/rest/AlertAuditLog/:aal_id", AMATempCRUDService.deleteAlertAuditLog);
router.get("/rest/AlertAuditLog", AMATempCRUDService.getAlertAuditLogs);
router.post("/rest/AlertAuditLog/query", AMATempCRUDService.queryAlertAuditLog);
router.post("/rest/AlertAuditLogWithoutSOPs/query", AMATempCRUDService.queryAlertAuditLogsWithoutSOP);

/** Ticket Audit Log CRUD Services **/
router.post("/rest/TicketAuditLog", AMATempCRUDService.createTicketAuditLog);
router.get("/rest/TicketAuditLogs", AMATempCRUDService.getTicketAuditLogs);
router.put("/rest/TicketAuditLog/:tal_id", AMATempCRUDService.updateTicketAuditLog);
router.get("/rest/TicketAuditLog/:tal_id", AMATempCRUDService.getTicketAuditLog);
router.delete("/rest/TicketAuditLogs", AMATempCRUDService.deleteTicketAuditLogs);
router.post("/rest/TicketAuditLog/query", AMATempCRUDService.queryTicketAuditLogs);
router.post("/rest/TicketAuditLogWithoutSOPs/query", AMATempCRUDService.queryTicketAuditLogsWithoutSOP);
router.post("/rest/notify", AMATempCRUDService.notify);
router.post("/rest/v1/email/send", AMATempCRUDService.sendEmail);

/** Human Activity CRUD Services **/
router.post("/rest/HumanActivity", AMATempCRUDService.createHumanActivity);
router.put("/rest/HumanActivity/:ha_id", AMATempCRUDService.updateHumanActivity);
router.get("/rest/HumanActivity/:ha_id", AMATempCRUDService.getHumanActivity);
router.put("/rest/HumanActivity/:ha_id/submit", AMAServiceManagementAgent.completeHumanActivity);
router.get("/rest/ActiveHumanActivity/:ha_id", AMAServiceManagementAgent.retrieveActiveHumanActivity);

/** Adapters */
router.post("/rest/adapters/start", AMAServiceMonitoringAdapters.triggerAdapter);
router.post("/rest/adapters/PublishAlerts", AMAServiceMonitoringAdapters.publishAlerts);

router.post("/rest/email/parse", AMAServiceMonitoringEmailAdapters.parse);
router.post("/rest/v1/email/parse", AMAServiceMonitoringEmailAdapters.parseEmail);

/** Mappers */
router.post("/rest/mappers/RESTAlertMapper", AMAServiceMonitoringMappers.RESTAlertMapper);
router.post("/rest/mappers/ServiceNowAlertMapper", AMAServiceMonitoringMappers.ServiceNowAlertMapper);
router.post("/rest/mappers/ServiceNowTicketMapper", AMAServiceMonitoringMappers.ServiceNowTicketMapper);
router.post("/rest/mappers/ODataAlertMapper", AMAServiceMonitoringMappers.ODataAlertMapper);
router.post("/rest/mappers/NetCoolAlertMapper", AMAServiceMonitoringMappers.NetCoolAlertMapper);
router.post("/rest/mappers/ScheduledMaintenanceAlertMapper", AMAServiceMonitoringMappers.ScheduledMaintenanceAlertMapper);
router.post("/rest/mappers/SQLAlertMapper", AMAServiceMonitoringMappers.SQLAlertMapper);
router.post("/rest/mappers/ABCDefaultEmailAlertMapper", AMAServiceMonitoringMappers.ABCDefaultEmailAlertMapper);

//*********************************************MANULIFE DEMO START******************************************************
router.post("/rest/mappers/ManulifeIPCEmailMapper", AMAServiceMonitoringMappers.ManulifeIPCEmailMapper);


/* Health Check*/
router.get("/rest/v1/health/LastestHealthStatus", AMAHealthService.getLastestHealthStatus);
router.post("/rest/v1/health/LastestHealthStatus", AMAHealthService.queryLastestHealthStatus);

/** Admin */
router.get("/file/v1/transactionAuditLog/download", AMAAdminService.downloadTransactionAuditLog);


router.get("/rest/TestInvokeBluePrismWebServices", TestInvokeBluePrismWebServices.invokeBluePrismWebServices);


/** CRUD Services * */
router.get("/rest/v1/sopmeta/GetAccountList", AMASOPCRUDService.GetAccountList);
router.get("/rest/v1/sopmeta/GetAccount", AMASOPCRUDService.GetAccount);
router.post("/rest/v1/sopmeta/CreateAccount", AMASOPCRUDService.CreateAccount);
router.get("/rest/v1/sopmeta/getAlertNameList", AMASOPCRUDService.getAlertNameList);
router.put("/rest/v1/sopmeta/UpdateAccount", AMASOPCRUDService.UpdateAccount);
router.delete("/rest/v1/sopmeta/DeleteAccount", AMASOPCRUDService.DeleteAccount);

router.get("/rest/v1/sopmeta/GetAccountForClient", AMASOPCRUDService.GetAccountForClient);


router.get("/rest/v1/sopmeta/GetApplicationList", AMASOPCRUDService.GetApplicationList);
router.get("/rest/v1/sopmeta/GetApplicationListForAccount", AMASOPCRUDService.GetApplicationListForAccount);
router.get("/rest/v1/sopmeta/GetApplication", AMASOPCRUDService.GetApplication);
router.post("/rest/v1/sopmeta/CreateApplication", AMASOPCRUDService.CreateApplication);
router.put("/rest/v1/sopmeta/UpdateApplication", AMASOPCRUDService.UpdateApplication);
router.delete("/rest/v1/sopmeta/DeleteApplication", AMASOPCRUDService.DeleteApplication);
router.get("/rest/v1/sopmeta/getApplicationNameList", AMASOPCRUDService.getApplicationNameList);

router.get("/rest/v1/sopmeta/GetSOPList", AMASOPCRUDService.GetSOPList);
router.get("/rest/v1/sopmeta/GetSOPListForAlertId", AMASOPCRUDService.GetSOPListForAlertId);
router.get("/rest/v1/sopmeta/GetSOPListForAlertSR", AMASOPCRUDService.GetSOPListForAlertSR);
router.post("/rest/v1/sopmeta/CreateSOP", AMASOPCRUDService.CreateSOP);
router.put("/rest/v1/sopmeta/UpdateSOP", AMASOPCRUDService.UpdateSOP);
router.delete("/rest/v1/sopmeta/DeleteSOP", AMASOPCRUDService.DeleteSOP);
router.get("/rest/v1/sopmeta/testDBExists", AMASOPCRUDService.testDBExists);

router.get("/rest/v1/sopmeta/getAllSops", AMASOPCRUDService.getAllSops);
router.get("/rest/v1/sopmeta/getOutputAutomation/:eventtype", AMASOPCRUDService.getOutputAutomation);
router.put("/rest/v1/sopmeta/UpdateSOPActiveStatus/:eventtype/:sopid", AMASOPCRUDService.UpdateSOPActiveStatus);


router.post("/rest/v1/sopmeta/CreateClient", AMASOPCRUDService.CreateClient);
router.put("/rest/v1/sopmeta/UpdateClient", AMASOPCRUDService.UpdateClient);
router.delete("/rest/v1/sopmeta/DeleteClient", AMASOPCRUDService.DeleteClient);
router.get("/rest/v1/sopmeta/GetAllClients", AMASOPCRUDService.GetAllClients);
router.get("/rest/v1/sopmeta/GetClient", AMASOPCRUDService.GetClient);

router.get("/rest/GetSOPListForAlert", AMASOPCRUDService.GetSOPListForAlert);
router.get("/rest/GetSOPList", AMASOPCRUDService.GetSOPList);
//router.post("/rest/CreateAlertAuditLog", AMASOPCRUDService.CreateAlertAuditLog);
// router.post("/rest/CreateSOP", AMASOPCRUDService.CreateSOP);
router.get("/rest/v1/sopmeta/searchByText", AMASOPCRUDService.searchByText);
router.get("/rest/v1/sopmeta/searchByQuery", AMASOPCRUDService.searchByQuery);
router.post("/rest/v1/sopmeta/saveSearch/:eventtype", AMASOPCRUDService.saveSearch);
router.delete("/rest/v1/sopmeta/deleteSaveSearch", AMASOPCRUDService.deleteSaveSearch);
router.get("/rest/v1/sopmeta/getSavedSearch", AMASOPCRUDService.getSavedSearch);
router.get("/rest/v1/sopmeta/getAllSavedSearch", AMASOPCRUDService.getAllSavedSearch);
router.put("/rest/v1/sopmeta/updateSavedSearch", AMASOPCRUDService.updateSavedSearch);
router.post("/rest/v1/sopmeta/conversion/:outputType", AMASOPCRUDService.conversion);

router.get("/rest/v1/sopmeta/getAlertFromAlertAuditLog", AMASOPCRUDService.getAlertFromAlertAuditLog);
router.get("/rest/v1/sopmeta/getAlertListFromAlertAuditLog", AMASOPCRUDService.getAlertListFromAlertAuditLog);

router.post("/rest/v1/sopmeta/getBPAutomataOperations", AMASOPCRUDService.getBPAutomataOperations);
router.post("/rest/v1/sopmeta/generateAutomataServiceRequest", AMASOPCRUDService.generateAutomataServiceRequest);
router.get("/rest/v1/sopmeta/getClientfromAccount", AMASOPCRUDService.getClientfromAccount);
// router.get("/rest/v1/sopmeta/getAuthorization",
// AMASOPCRUDService.getAuthorization);

// ****************** Change path *********************
/*
 * router.post("/rest/v1/sopmeta/CreateUser", AMA_ADMINCRUDService.CreateUser);
 * router.put("/rest/v1/sopmeta/UpdateUser", AMA_ADMINCRUDService.UpdateUser);
 * router.delete("/rest/v1/sopmeta/DeleteUser",
 * AMA_ADMINCRUDService.DeleteUser); router.get("/rest/v1/sopmeta/GetUser",
 * AMA_ADMINCRUDService.GetUser); router.get("/rest/v1/sopmeta/GetAllUser",
 * AMA_ADMINCRUDService.GetAllUser);
 *
 * router.post("/rest/v1/sopmeta/CreateRole", AMA_ADMINCRUDService.CreateRole);
 * router.put("/rest/v1/sopmeta/UpdateRole", AMA_ADMINCRUDService.UpdateRole);
 * router.delete("/rest/v1/sopmeta/DeleteRole",
 * AMA_ADMINCRUDService.DeleteRole); router.get("/rest/v1/sopmeta/GetRole",
 * AMA_ADMINCRUDService.GetRole); router.get("/rest/v1/sopmeta/GetAllRole",
 * AMA_ADMINCRUDService.GetAllRole);
 *
 * router.post("/rest/v1/sopmeta/CreateCapability",
 * AMA_ADMINCRUDService.CreateCapability);
 * router.put("/rest/v1/sopmeta/UpdateCapability",
 * AMA_ADMINCRUDService.UpdateCapability);
 * router.delete("/rest/v1/sopmeta/DeleteCapability",
 * AMA_ADMINCRUDService.DeleteCapability);
 *
 * router.get("/rest/v1/sopmeta/getAuthorization",
 * AMALoginAuthService.getAuthorization);
 */

router.post("/rest/v1/adminmeta/initialDataLoad", AMAAdminCRUDService.initialDataLoad);
router.get("/rest/v1/adminmeta/getAppConfigurations", AMAAdminCRUDService.getAppConfigurations);
router.post("/rest/v1/adminmeta/updateAppConfigurations", AMAAdminCRUDService.updateAppConfigurations);
router.get("/rest/v1/adminmeta/getMapperConfigurations", AMAAdminCRUDService.getMapperConfigurations);
router.post("/rest/v1/adminmeta/updateMapperConfigurations", AMAAdminCRUDService.updateMapperConfigurations);
router.get("/rest/v1/adminmeta/getMessageQueueConfigurations", AMAAdminCRUDService.getMessageQueueConfigurations);
router.post("/rest/v1/adminmeta/updateMessageQueueConfigurations", AMAAdminCRUDService.updateMessageQueueConfigurations);
router.get("/rest/v1/adminmeta/getAutomationAdapterConfigurations", AMAAdminCRUDService.getAutomationAdapterConfigurations);
router.post("/rest/v1/adminmeta/updateAutomationAdapterConfigurations", AMAAdminCRUDService.updateAutomationAdapterConfigurations);
router.get("/rest/v1/adminmeta/getMonitoringAdapterConfigurations", AMAAdminCRUDService.getMonitoringAdapterConfigurations);
router.post("/rest/v1/adminmeta/updateMonitoringAdapterConfigurations", AMAAdminCRUDService.updateMonitoringAdapterConfigurations);
router.post("/rest/v1/adminmeta/CreateUserAccess", AMAAdminCRUDService.CreateUserAccess);
router.put("/rest/v1/adminmeta/UpdateUserAccess", AMAAdminCRUDService.UpdateUserAccess);
router.delete("/rest/v1/adminmeta/DeleteUserAccess", AMAAdminCRUDService.DeleteUserAccess);
router.get("/rest/v1/adminmeta/GetUserAccess", AMAAdminCRUDService.GetUserAccess);
router.get("/rest/v1/adminmeta/GetAllUserAccess", AMAAdminCRUDService.GetAllUserAccess);
router.get("/rest/v1/adminmeta/GetAllUserName", AMAAdminCRUDService.GetAllUserName);
router.get("/rest/v1/adminmeta/SearchUserAccess", AMAAdminCRUDService.SearchUserAccess);

router.post("/rest/v1/adminmeta/CreateRole", AMAAdminCRUDService.CreateRole);
router.put("/rest/v1/adminmeta/UpdateRole", AMAAdminCRUDService.UpdateRole);
router.delete("/rest/v1/adminmeta/DeleteRole", AMAAdminCRUDService.DeleteRole);
router.get("/rest/v1/adminmeta/GetRole", AMAAdminCRUDService.GetRole);
router.get("/rest/v1/adminmeta/GetAllRoles", AMAAdminCRUDService.GetAllRoles);
router.get("/rest/v1/adminmeta/SearchRole", AMAAdminCRUDService.SearchRole);
router.get("/rest/v1/adminmeta/GetAllRoleName", AMAAdminCRUDService.GetAllRoleName);

/*
 * router.post("/rest/v1/adminmeta/CreateCapability",
 * AMAAdminCRUDService.CreateCapability);
 * router.put("/rest/v1/adminmeta/UpdateCapability",
 * AMAAdminCRUDService.UpdateCapability);
 */
router.delete("/rest/v1/adminmeta/DeleteCapability", AMAAdminCRUDService.DeleteCapability);
router.get("/rest/v1/adminmeta/GetCapability", AMAAdminCRUDService.GetCapability);
router.get("/rest/v1/adminmeta/GetAllCapabilities", AMAAdminCRUDService.GetAllCapability);
router.get("/rest/v1/adminmeta/GetAuthorization", AMALoginAuthService.getAuthorization);
router.post("/rest/v1/adminmeta/checkLogin", AMALoginAuthService.checkLogin);
router.get("/rest/v1/adminmeta/getApplicationProperties", AMALoginAuthService.getApplicationProperties);
router.post("/rest/v1/adminmeta/createUserCredential", AMALoginAuthService.createUserCredential);
router.post("/rest/v1/adminmeta/changePassword", AMALoginAuthService.changePassword);

// router.post("/rest/v1/sopmeta/upload", AMASOPCRUDService.upload);
router.get("/rest/v1/sopmeta/download", AMASOPCRUDService.download);
router.get("/rest/v1/sopmeta/GetSOPReport", AMASOPCRUDService.GetSOPReport);
// router.post("/rest/v1/sopmeta/CreateSOP1", AMASOPCRUDService.CreateSOP1);
router.post("/rest/v1/adminmeta/generateCapabilityName", AMAAdminCRUDService.generateCapabilityName);


// ******************************************************************

// router.get("/rest/v1/sopmeta/login", AMASOPCRUDService.login);
// router.get("/rest/v1/sopmeta/ssocallback", AMASOPCRUDService.ssocallback);
// router.get("/rest/v1/sopmeta/postLogin", AMASOPCRUDService.failure);
// router.get("/rest/v1/sopmeta/failure", AMASOPCRUDService.failure);
// router.get("/rest/v1/sopmeta/logout/", AMASOPCRUDService.logout);


router.get("/rest/v1/sopmeta/login", AMALoginAuthService.login);
router.post("/rest/v1/sopmeta/loginPrem", AMALoginAuthService.loginPrem);
router.get("/rest/v1/sopmeta/ssocallback", AMALoginAuthService.ssocallback);
//router.get("/rest/v1/sopmeta/postLogin", AMALoginAuthService.failure);
//router.get("/rest/v1/sopmeta/failure", AMALoginAuthService.failure);
router.post("/rest/v1/sopmeta/logout/", AMALoginAuthService.logout);


//******************************	TICKET SERVICE ************************************

router.post("/rest/v1/sopmeta/DefineSOP", AMATicketService.DefineSOP);
router.get("/rest/v1/sopmeta/GetSOPForEvent/:eventtype", AMATicketService.GetSOPForEvent);
router.put("/rest/v1/sopmeta/AmendSOP",AMATicketService.AmendSOP);
router.get("/rest/v1/sopmeta/GetEventList/:eventtype", AMATicketService.GetEventList);
router.get("/rest/v1/sopmeta/GetTicketListFromAuditLog", AMATicketService.GetTicketListFromAuditLog);
router.get("/rest/v1/sopmeta/GetTicketFromAuditLog", AMATicketService.GetTicketFromAuditLog);
router.delete("/rest/v1/sopmeta/RemoveSOP", AMATicketService.RemoveSOP);
router.get("/rest/v1/sopmeta/GetAllTicketList", AMATicketService.GetAllTicketList);
router.get("/rest/v1/sopmeta/searchText", AMATicketService.searchText);
router.post("/rest/v1/sopmeta/GetTicketFromAuditLog", AMATicketService.GetTicketFromAuditLog);
router.get("/rest/v1/sopmeta/GetSOP/:sopid", AMATicketService.GetSOP);
router.put("/rest/v1/sopmeta/UpdateSOPContent",AMATicketService.updateSOPContent);


//***************************************Generic Crud Service******************************************

router.post("/rest/v1/adminmeta/createEmailWhitelist", AMAGenericCRUDService.createEmailWhitelist);
router.put("/rest/v1/adminmeta/updateEmailWhitelist",  AMAGenericCRUDService.updateEmailWhitelist);
router.post("/rest/v1/adminmeta/containsEmailWhitelist", AMAGenericCRUDService.containsEmailWhitelist);
router.post("/rest/v1/adminmeta/getEmailWhitelist", AMAGenericCRUDService.getEmailWhitelist);
router.delete("/rest/v1/adminmeta/deleteEmailWhitelist", AMAGenericCRUDService.deleteEmailWhitelist);


// external apis to expose
router.post("/rest/external/v1/ServiceOptimizationAutomation", [AuthTokenValidation], AMACognitiveTicketRemediation.RunAutomation);
router.post("/rest/external/v1/GetAutomationExeResult", [AuthTokenValidation], AMACognitiveTicketRemediation.GetAutomationExeResult);
router.post("/rest/external/v1/GetAuthToken", AuthTokenGeneration.generateJWTToken);
router.post("/rest/external/v1/UpdateAutomationExeResult",[AuthTokenValidation], AMACognitiveTicketRemediation.UpdateAutomationExeResult);

// API to handshake with GB Agent
router.post("/rest/external/v1/ProcessGBAgentIncidents", AMAGBAgentIncidentManagerService.processGBAgentIncidents);
// API to obtain the Performance Report
router.get("/rest/external/v1/PerformanceReport.csv", AMAProcessPerformance.performanceReport);

app.use('/', router);
app.use(function(err, req, res, next){
	try{
		logger.info(err);
		var errorCode = errorcodes[err.message];
		logger.error(errorCode.internalMessage);
		res.status(errorCode.statusCode).json({
			operationName : req.originalUrl,
			serviceCode : errorCode.serviceCode,
			internalMessage : errorCode.internalMessage,
			userMessage : errorCode.userMessage,
			response : {}
		});
	} catch(e){
		logger.error("Unknown Error: " + e);
		next(new Error("Unknown Error"));
	}
});

// There are many useful environment variables available in process.env.
// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
// TODO: Get application information and use it in your app.

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
// TODO: Get service credentials and communicate with bluemix services.

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts
// this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
//var port = (process.env.VCAP_APP_PORT || 3000);

//The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts
//this application:
//var host = (process.env.app_host || 'localhost');
//The port on the DEA for communication with the application:
var port = (process.env.PORT || 3000);

logger.info("environment host : "+process.env.app_host+"   "+process.env.VCAP_APP_PORT);

// Enable Socket IO
var httpServer = http.Server(app);
var sockio = require("socket.io")(httpServer);
sockio.on('connection', function(socket){
	SocketManager.add(socket);
});

global.jwtTokenKey = 'jwtTokenSecret-E2E';

// Start server
var server = httpServer.listen(port, function(){
	global.global_server_host = host;
	global.global_server_port = port;

	logger.info('Application Monitoring listening at http://%s:%s', global.global_server_host, global.global_server_port);
	//Adding A Log To identify Bluemix Node Runtime Enviroment
	logger.info("Current Node Runtime Details :"+JSON.stringify(process.versions));
//	debugger;
	AMAServiceMonitoringAdapters.initialize();
	AMAServiceMonitoringAgent.periodicallySubscribeMQs();

	AMAServiceManagementAgent.initialize();
	//Start Archive Audit Log Related Monitors
	AMAAdminArchiveService.initiateAuditArchivalMonitors();
});
