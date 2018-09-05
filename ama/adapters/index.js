var fs = require("fs");
var path = require("path");

var moment = require("moment-timezone");
var cron = require("cron");
var CronJob = cron.CronJob;
var later = require("later");

var logger = getLogger("Adapters");

var APP_CONFIG_FILE = path.join(__dirname, "../../config/app_config.json");
var app_config = JSON.parse(fs.readFileSync(APP_CONFIG_FILE, 'utf8'));

var ADAPTERS_CONFIG_FILE = path.join(__dirname, "../../config/adapter_config.json");
var adapters_config = JSON.parse(fs.readFileSync(ADAPTERS_CONFIG_FILE, 'utf8'));

var adapters = {};

// var MQClient = require("./mqlight_client");
var RabbitMQClient = require("../common/rabbitmq_client");

var MQTopics = require("../common/MQTopics.js");

// var request_counter = 0;

var initialize = exports.initialize = function() {
	var hasAdapter = false;
	for (var adapter_name in adapters_config.adapters) {
		try {
			var Adapter = require("./" + adapter_name + ".js");
			if (!Adapter) {
				logger.info("underfined adapter : " + adapter_name);
			}
			var config = adapters_config["adapters"][adapter_name];
			var adapter = new Adapter();
			adapter.initialize(config);
			adapters[adapter_name] = adapter;
			hasAdapter = true;
		} catch (ex) {
			logger.error("Error in %s:" + ex, adapter_name);
		}

	}

	try {
		if (!hasAdapter) return;
		
		var cron_time = app_config["general-properties"].monitoringAgentSchedulerCron;
		logger.info("using cron time : %s", cron_time);
		var scheduledJob = new CronJob(cron_time, function() {
				try {
					logger.info("execute adapter..." + cron_time);
					var nextTickDate = later.schedule(later.parse.cron(cron_time, true)).next(1);
					var interval = (-1) * (new moment().diff(new moment(nextTickDate.getTime()), "seconds"));
					if (interval == 0) {
						nextTickDate = later.schedule(later.parse.cron(cron_time, true)).next(2)[1];
						interval = (-1) * (new moment().diff(new moment(nextTickDate.getTime()), "seconds"));
					}
					logger.info(nextTickDate, interval);
					SocketManager.emit("monitoring/refresh", interval * 1000);
					executeAdapter();
				} catch (e) {
					logger.error(e.stack);
				}
			}, function() {
				logger.fatal("scheduledJob has been stopped");
			},
			true
		);

		SocketManager.registerEvent("add", function(socket) {
			var nextTickDate = later.schedule(later.parse.cron(cron_time, true)).next(1);
			var interval = (-1) * (new moment().diff(new moment(nextTickDate.getTime()), "seconds"));
			if (interval == 0) {
				nextTickDate = later.schedule(later.parse.cron(cron_time, true)).next(2)[1];
				interval = (-1) * (new moment().diff(new moment(nextTickDate.getTime()), "seconds"));
			}
			logger.info(nextTickDate, interval);
			socket.emit("monitoring/refresh", interval * 1000);
		});

	} catch (e) {
		logger.fatal("Invalid Cron Pattern %s at %s", cron_time, __dirname + "\\index.js");
		logger.fatal(e.stack);
		return;
	}
}

var executeAdapter = function() {
	for (var adapter_name in adapters) {
		try {
			adapters[adapter_name].start();
		} catch (ex) {
			logger.error("Error in %s:" + ex, adapter_name);
		}
	}
}

// var INTERVAL = 10 * 60 * 1000; // 30 secs
// initialize();
// var workloadscheduler = false;
// if (process.env.VCAP_SERVICES) {
// var env = JSON.parse(process.env.VCAP_SERVICES);
// logger.info(JSON.stringify(process.env.VCAP_SERVICES));
// if (env['WorkloadScheduler'] && env['WorkloadScheduler'][0]) {
// workloadscheduler = true;
// logger.info("Use Workload Scheduler!");
// }
// }
// if (!workloadscheduler) {
// logger.info("Use build-in scheduler!")
//	logger.info("-----------------Adapter Execution Start------------------");
// request_counter++;
// logger.info("################### Requests Counter = " + request_counter +
// " ###################");
// executeAdapter();
// SocketManager.emit("monitoring/refresh", INTERVAL);
//	logger.info("-----------------Adapter Execution End--------------------");
// setInterval(
// function() {
//				logger
//						.info("-----------------Adapter Execution Start------------------");
// SocketManager.emit("monitoring/refresh", INTERVAL);
// request_counter++;
// logger.info("################### Requests Counter = " +
// request_counter + " ###################");
// executeAdapter();
//				logger
//						.info("-----------------Adapter Execution End--------------------");
// }, INTERVAL);
// }

// var WorkloadService =
// require("./workload_scheduler/client/WorkloadService.js");
// var WAProcess = require("./workload_scheduler/client/helpers/WAProcess.js");
// var CommandStep =
// require("./workload_scheduler/client/helpers/steps/CommandStep.js");
// var RestfulStep =
// require("./workload_scheduler/client/helpers/steps/RestfulStep.js");
//
// var ws = null;
// if(process.env.VCAP_SERVICES){
// var services = JSON.parse(process.env.VCAP_SERVICES);
// var credentials = services['WorkloadScheduler'][0]['credentials'];
// ws = new WorkloadService(credentials.url);
// }
// else {
// ws = new WorkloadService({
// userId : "03dc3a7079ee449c8bad4d791e394823%40bluemix.net",
// password : "ZOs%3FvYMxw7yiMsP7y%3D21UdptelaUPW",
// url :
// "https://03dc3a7079ee449c8bad4d791e394823%40bluemix.net:ZOs%3FvYMxw7yiMsP7y%3D21UdptelaUPW@sidr37wamxo-114.wa.ibmserviceengage.com/ibm/TWSWebUI/Simple/rest?tenantId=LP&engineName=engine&engineOwner=engine"
// });
// }

// var wp = new WAProcess("AMA process","Hello world process!");
// wp.addStep(new RestfulStep("DA_ClOUD",
// "http://amaagent.mybluemix.net/rest/redirectPost", "POST",
// JSON.stringify({"test": "test"})));
// ws.createAndEnableTask(wp, function(createdTask){
// console.log(createdTask);
// var id = createdTask.id;
// ws.runTask(id, function(){
// ws.getTaskHistory(id, function(result){
// console.log(result);
// });
// });
// })

exports.triggerAdapter = function(req, res) {

	logger.info(req.body);

	// for ( var adapter_name in adapters) {
	// try {
	// adapters[adapter_name].start();
	// } catch (ex) {
	// logger.error("Error in %s:" + ex, adapter_name);
	// }
	//
	// }
	logger
		.info("-----------------Adapter Execution Start by Workload Scheduler------------------");
	// SocketManager.emit("Monitoring/refresh", INTERVAL);
	executeAdapter();
	logger.info("-----------------Adapter Execution End--------------------");

	res.status(200).send("OK");
}

exports.publishAlerts = function(req, res) {

	var alerts = req.body;
	logger.info(alerts);

	var RrabbitMQClient = new RabbitMQClient();
	// how to get client name, account name here
	// entries[i].account_name = "SAP Account"; ??
	// for each alert ??
	var clientName = "client1";
	var accountName = null;
	if (alerts.length > 0) {
		accountName = alerts[0].account_name;
	}
	RrabbitMQClient.publish(clientName, accountName, MQTopics.alert_topic,
		alerts);

	res.status(200).send("OK");
}