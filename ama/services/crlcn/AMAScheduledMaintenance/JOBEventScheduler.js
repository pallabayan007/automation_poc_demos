var logger = getLogger("AMAScheduledMaintenance");
var cron = require("cron");
var CronJob = cron.CronJob;

var Alert = require("../../../../models").Alert;
var Account = require("../../../../models").Account;

//var MQClient = require("./mqlight_client");
var MQTopics = require("../../../common/MQTopics.js");

var RabbitMQClient = require("../../../common/rabbitmq_client");


var JOBEventScheduler = function() {
	var self = this;

	this.cronJobs = {};

	this.findCronJob = function(JOBEvent) {
		var jobevent_id = JOBEvent._id;
		var cronJob = this.cronJobs[jobevent_id];

		if (cronJob) {
//			logger.info("found exist cron job : " + JSON.stringify(cronJob));
			logger.info("found exist cron job : " + cronJob);
		} else {
			logger.info("cannot found exist cron job");
			return null;
		}

		return cronJob;
	}

	this.updateJOBEvent = function(JOBEvent) {
		logger.info("update JOB Event : " + JSON.stringify(JOBEvent));
		var active = JOBEvent.active;
		var trashed = JOBEvent.trashed;
		var cronJob = self.findCronJob(JOBEvent);
		if (cronJob) {
			logger.info("stop cron job");
			cronJob.stop();
			cronJob = null;
			self.cronJobs[JOBEvent._id] = null;
		}
		if (trashed == 'n') {
			logger.debug("try to translate");
			cronJob = self.translateToCronJob(JOBEvent);
			self.cronJobs[JOBEvent._id] = cronJob;
			if (cronJob && active == 'y') {
				cronJob.start();
				logger.info("started cronJob : " + JOBEvent.jobName);
			}
		}
	}

	this.deleteJOBEvent = function(JOBEvent) {
		logger.info("delete JOB Event : " + JSON.stringify(JOBEvent));
		var cronJob = self.findCronJob(JOBEvent);
		if (cronJob) {
			cronJob.stop();
			cronJob = null;
		}
	}

	this.translateToCronJob = function(JOBEvent) {
		logger.debug("translate To CronJob");
		var timeZone = JOBEvent.timeZone;
		var cronExpression = JOBEvent.cronExpression;
		var active = JOBEvent.active;

		if (timeZone == "NOT Available" || cronExpression == "NOT Available" || active == "NOT Available") {
			logger.info("Job is not available: %s", JOBEvent.jobName);
			return null;
		}
		//logger.info("create cronJob with expression : %s", cronExpression);
		return new CronJob(cronExpression, function() {
			logger.info("new cronjob expression : " + cronExpression);
			self.translateJobEventToAlert(JOBEvent, function(err, alert) {
				//publish to MQ
				logger.info("publish alert to MQ : " + JSON.stringify(alert));
				self.publishToMQ([alert]);
			});
		}, function() {
			logger.info("cronjob has been stopped");
		}, false, timeZone);
	}

	this.translateJobEventToAlert = function(JOBEvent, callback) {
		Alert.findOne({
			_id: JOBEvent.alertId
		}).lean().exec(function(err, data) {
			//			callback(err, data);

			Account.findOne({
				_id: data.accountID
			}).lean().exec(function(err, account) {
				var alert = {
					alertID: data._id,
					alertPublishName: 'ScheduledMaintenanceAlert',
					alertType: data.alertType,
					alertName: data.alertName,
					alertDesc: data.alertShortDesc,
					alertShortDesc: data.alertShortDesc,
					alertSeverity: data.alertSeverity,
					alertRaisedTime: data.alertRaisedTimeStamp,
					applicationID: data.applicationID,
					applicationName: data.applicationName,
					accountName: account.accountName,
					clientName: account.clientName,
					isScheduled: true,
					incident: "",
					events: [],
					monitoringToolName: "ScheduledMaintenance",
					automationProvider: "",
					sopID: "",
					executionID: ""
				}
				callback(null, alert);
			});
		});
	}

	this.publishToMQ = function(alerts) {
		//		var mqClient = new MQClient();
		//		mqClient.publish(MQTopics.alert_topic, alerts);
		var mqClient = new RabbitMQClient();
		for (var i = 0; i < alerts.length; i++) {
			var alert = alerts[i];
			logger.info("push to Rabbit MQ : " + JSON.stringify(alerts[i]));
			mqClient.publish(alert.clientName, alert.accountName,
				MQTopics.alert_topic, [alert]);
		}
	}
}

var schedulerInstance = null;

var getInstance = function() {
	if (schedulerInstance == null) {
		schedulerInstance = new JOBEventScheduler();
	}
	return schedulerInstance;
}


exports.getInstance = getInstance;