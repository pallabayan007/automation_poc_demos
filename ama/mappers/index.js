var fs = require("fs");
var path = require("path");
var moment = require("moment");

var logger = getLogger("Mappers");

exports.ODataAlertMapper = function(req, res) {
	logger.info("ODataAlertMapper : " + JSON.stringify(req.body));
	var ex_alert = req.body;
	var item = ex_alert["content"][0]["m:properties"][0];

	var application_id = ex_alert.application_id;
	var application_name = ex_alert.application_name;
	var account_name = ex_alert.account_name;
	var client_name = ex_alert.client_name;
	var alertPublishName = ex_alert.alertPublishName;
	var alert_id = item["d:alertTypeID"][0];
	var alert_type = item["d:categoryText"][0];
	var alert_name = item["d:name"][0];
	var alert_severity = item["d:priority"][0];
	var alert_timestamp = item["d:lastChangeDateTime"][0].trim();
	// alert_timestamp = moment(alert_timestamp,
	// [ "YYYYMMDDHHmmss" ]).toDate().toString();
	var object = {
		alertID : alert_id,
		applicationID : application_id,
		applicationName : application_name,
		alertName : alert_name,
		alertDesc : alert_name,
		alertState : "OPEN",
		alertShortDesc : alert_name,
		alertSource : ex_alert.alertSource,
		alertResource : ex_alert.alertResource,
		alertSeverity : alert_severity,
		relatedAlerts : ex_alert.relatedAlerts,
		alertRaisedTime : alert_timestamp,
		alertType : alert_type,
		incident : ex_alert.incident,
		events : ex_alert.events,
		monitoringToolName : "SAP Solman",
		accountName : account_name,
		clientName : client_name,
		alertPublishName : alertPublishName
	}

	res.status(200).send(object);
}

exports.RESTAlertMapper = function(req, res) {
	logger.info("RESTAlertMapper : " + JSON.stringify(req.body));
	var ex_alert = req.body;

	var application_id = "558c0dc85a48ca2c00b74ae5";
	var application_name = "ISU";
	var account_name = ex_alert.accountName;
	var client_name = ex_alert.clientName;
	var alertPublishName = ex_alert.alertPublishName;
	var alert_id = "558c18e2e4b0cfb129e10669";
	var alert_type = ex_alert.alertName;
	var alert_name = ex_alert.alertName;
	var alert_description = ex_alert.alertDescription;
	var alert_severity = ex_alert.severity;
	var alert_timestamp = ex_alert.alertRaisedTimestamp.trim();
	// alert_timestamp = moment(alert_timestamp,
	// [ "YYYYMMDDHHmmss" ]).toDate().toString();
	// 
	//
	// 

	var object = {
		alertID : alert_id,
		applicationID : application_id,
		applicationName : application_name,
		alertName : alert_name,
		alertDesc : alert_description,
		alertState : "OPEN",
		alertShortDesc : alert_description,
		alertSource : ex_alert.alertSource,
		alertResource : ex_alert.alertResource,
		alertSeverity : alert_severity,
		relatedAlerts : ex_alert.relatedAlerts,
		alertRaisedTime : alert_timestamp,
		alertType : alert_type,
		incident : ex_alert.incident,
		events : ex_alert.events,
		monitoringToolName : "IBM Tivoli",
		accountName : account_name,
		clientName : client_name,
		alertPublishName : alertPublishName

	}

	res.status(200).send(object);
}

exports.ServiceNowTicketMapper = function(req, res) {
	logger.info("ServiceNowTicketMapper : " + JSON.stringify(req.body));
	var ex_ticket = req.body;

	var application_id = "558c0dc85a48ca2c00b74ae5";
	var account_name = ex_ticket.accountName;
	var client_name = ex_ticket.clientName;
	var alertPublishName = ex_ticket.alertPublishName;

	var update_timestamp = moment(ex_ticket.sys_updated_on,
			"YYYY-MM-DD HH:mm:ss").format('YYYY-MM-DD HH:mm:ss:SS').toString();

	var sla_due = null;
	if (ex_ticket.sla_due != null || ex_ticket.sla_due != "") {
		sla_due = moment(ex_ticket.sla_due, "YYYY-MM-DD HH:mm:ss").format(
				'YYYY-MM-DD HH:mm:ss:SS').toString();
		if (sla_due == "Invalid date") {
			sla_due = null; 
		} 
	}
	var opened_at = null; 
	if (ex_ticket.opened_at != null || ex_ticket.opened_at != "") {
		opened_at = moment(ex_ticket.opened_at, "YYYY-MM-DD HH:mm:ss").format(
		'YYYY-MM-DD HH:mm:ss:SS').toString();
		if (opened_at == "Invalid date") {
			opened_at = null; 
		} 
	} 
	
	var closed_at = null; 
	if (ex_ticket.closed_at != null || ex_ticket.closed_at != "") {
		closed_at = moment(ex_ticket.closed_at, "YYYY-MM-DD HH:mm:ss").format(
		'YYYY-MM-DD HH:mm:ss:SS').toString();
		if (closed_at == "Invalid date") {
			closed_at = null; 
		} 
	}

	// subject+type+category+subcategory+application
	
	var ticket_Key = ""; 
	
	if (ex_ticket.u_incident_type && ex_ticket.u_incident_type != "") {
		ticket_Key += ex_ticket.u_incident_type; 
	} else if (ex_ticket.short_description) {
		ticket_Key += ex_ticket.short_description; 
	} else {
		ticket_Key += "[]";
	}
	
	if (ex_ticket.sys_class_name) {
		ticket_Key += ex_ticket.sys_class_name; 
	} else {
		ticket_Key += "[]";
	}
	if (ex_ticket.category) {
		ticket_Key += ex_ticket.category; 
	} else {
		ticket_Key += "[]";
	}
	if (ex_ticket.subcategory) {
		ticket_Key += ex_ticket.subcategory; 
	} else {
		ticket_Key += "[]";
	}
	if (ex_ticket.businessServiceName) {
		ticket_Key += ex_ticket.businessServiceName; 
	} else {
		ticket_Key += "[]";
	}
	
	var inputParams = {}; 
	if (ex_ticket.user_input && ex_ticket.user_input != "") {
		try {
			var delimiter = ex_ticket.user_input.indexOf(":"); 
			var key = ex_ticket.user_input.substr(0, delimiter).replace(" ", "");
			var value = ex_ticket.user_input.substr(delimiter + 1).replace(" ", "");
			inputParams[key] = value;
		} catch (e) {
			
		} 
	}
	inputParams["TicketNumber"] = ex_ticket.number;
	inputParams = JSON.stringify(inputParams);  
		
	var object = {
		requester : ex_ticket.openedByName,
		assignee : ex_ticket.assignedToName,
		asignmentGroup : ex_ticket.assignmentGroupName,
		type : ex_ticket.sys_class_name,
		priority : ex_ticket.priority,
		subject : ex_ticket.short_description,
		status : ex_ticket.state,
		SLADueDate : sla_due,
		openedAt : opened_at,
		closedAt : closed_at,
		account : account_name,
		impact : ex_ticket.impact,
		cause : ex_ticket.description,
		application : ex_ticket.businessServiceName,
		urgency : ex_ticket.urgency,
		category : ex_ticket.category,
		relatedTicket : "null",
		ticketKey : ticket_Key,
		ticketingToolName : "ServiceNow",
		updateTimestamp : update_timestamp,
		updatedByUserId : "",
		updateComment : "",
		templateBased : "",
		ticketNumber : ex_ticket.number,
		monitoringToolName : "ServiceNow",
		accountName : account_name,
		clientName : client_name,
		alertPublishName : alertPublishName,
		customizedInputParams : inputParams
	}
	res.status(200).send(object);
}

exports.ServiceNowAlertMapper = function(req, res) {
	logger.info("ServiceNowAlertMapper : " + JSON.stringify(req.body));
	var ex_alert = req.body;

	var application_id = "558c0dc85a48ca2c00b74ae5";
	var application_name = ex_alert.source;
	var account_name = ex_alert.accountName;
	var client_name = ex_alert.clientName;
	var alertPublishName = ex_alert.alertPublishName;
	var alert_id = ex_alert.number;
	var alert_type = ex_alert.typeValue;
	var alert_name = ex_alert.source + "_" + ex_alert.node + "_"
			+ ex_alert.typeValue;
	var alert_description = ex_alert.short_description;
	var alert_severity = ex_alert.severity;
	var alert_timestamp = moment(ex_alert.sys_created_on || ex_alert.initial_event_time,
			"YYYY-MM-DD HH:mm:ss").format('YYYY-MM-DD HH:mm:ss:SS').toString();

	var object = {
		alertID : alert_id,
		applicationID : application_id,
		applicationName : application_name,
		alertName : alert_name,
		alertDesc : alert_description,
		alertState : "OPEN",
		alertShortDesc : alert_description,
		alertSource : ex_alert.alertSource,
		alertResource : ex_alert.alertResource,
		alertSeverity : alert_severity,
		relatedAlerts : ex_alert.relatedAlerts,
		alertRaisedTime : alert_timestamp,
		alertType : alert_type,
		incident : ex_alert.incident,
		events : ex_alert.events,
		monitoringToolName : "ServiceNow",
		accountName : account_name,
		clientName : client_name,
		alertPublishName : alertPublishName
	}
	res.status(200).send(object);
}

exports.NetCoolAlertMapper = function(req, res) {
	logger.info("NetCoolAlertMapper : " + JSON.stringify(req.body));
	var ex_alert = req.body;

	var application_id = "558c0dc85a48ca2c00b74ae5";
	var application_name = ex_alert.Node;
	if (ex_alert.Location) {
		application_name = ex_alert.Node + "(" + ex_alert.Location + ")";
	}

	var account_name = ex_alert.accountName;
	var client_name = ex_alert.clientName;
	var alertPublishName = ex_alert.alertPublishName;
	var alert_id = ex_alert.Serial;

	var alert_type = ex_alert.Type;
	switch (ex_alert.Type) {
	case 0:
		alert_type = "Type not set";
		break;
	case 1:
		alert_type = "Problem";
		break;
	case 2:
		alert_type = "Resolution";
		break;
	case 3:
		alert_type = "Netcool/Visionary problem";
		break;
	case 4:
		alert_type = "Netcool/Visionary resolution";
		break;
	case 7:
		alert_type = "Netcool/ISMs new alarm";
		break;
	case 8:
		alert_type = "Netcool/ISMs old alarm";
		break;
	case 11:
		alert_type = "More Severe";
		break;
	case 12:
		alert_type = "Less Severe";
		break;
	case 13:
		alert_type = "Information";
		break;
	default:
		break;
	}

	var alert_status = ex_alert.Acknowledged;
	switch (ex_alert.Acknowledged) {
	case 1:
		alert_status = "CLOSED";
		break;
	case 0:
		alert_status = "OPEN";
		break;
	}

	var alert_name = ex_alert.AlertKey;

	var alert_description = ex_alert.Summary;
	if (ex_alert.Customer && ex_alert.Customer != "") {
		alert_description = alert_description + ": Impacted Customers: "
				+ ex_alert.Customer;
	}
	if (ex_alert.Service && ex_alert.Service != "") {
		alert_description = alert_description + "; Impacted Service: "
				+ ex_alert.Service;
	}

	var alert_severity = ex_alert.Severity;
	var alert_timestamp = moment(ex_alert.FirstOccurrence, [ "X" ]).format(
			'YYYY-MM-DD HH:mm:ss:SS').toString();

	var object = {
		alertID : alert_id,
		applicationID : application_id,
		applicationName : application_name,
		alertName : alert_name,
		alertDesc : alert_description,
		alertState : alert_status,
		alertShortDesc : alert_description,
		alertSource : ex_alert.alertSource,
		alertResource : ex_alert.alertResource,
		alertSeverity : alert_severity,
		relatedAlerts : ex_alert.relatedAlerts,
		alertRaisedTime : alert_timestamp,
		alertType : alert_type,
		incident : ex_alert.incident,
		events : ex_alert.events,
		monitoringToolName : "NetCool",
		accountName : account_name,
		clientName : client_name,
		alertPublishName : alertPublishName

	}

	res.status(200).send(object);
}

exports.ScheduledMaintenanceAlertMapper = function(req, res) {
	logger
			.info("ScheduledMaintenanceAlertMapper : "
					+ JSON.stringify(req.body));
	var ex_alert = req.body;
	var object = {
		alertID : ex_alert.alert_id,
		applicationID : ex_alert.application_id,
		applicationName : ex_alert.application_name,
		alertName : ex_alert.alert_name,
		alertDesc : ex_alert.alert_description,
		alertState : "OPEN",
		alertShortDesc : ex_alert.alert_description,
		alertSource : ex_alert.alertSource,
		alertResource : ex_alert.alertResource,
		alertSeverity : ex_alert.alert_severity,
		relatedAlerts : ex_alert.relatedAlerts,
		alertRaisedTime : ex_alert.alert_timestamp,
		alertType : ex_alert.alert_type,
		incident : ex_alert.incident,
		events : ex_alert.events,
		monitoringToolName : "ScheduledMaintenance",
		accountName : ex_alert.account_name,
		clientName : ex_alert.client_name,
		isScheduled : ex_alert.isScheduled,
		alertPublishName : ex_alert.alertPublishName

	}
	res.status(200).json(object);
}

exports.SQLAlertMapper = function(req, res) {
	logger.info("inside SQLAlertMapper : " + JSON.stringify(req.body));
	var ex_alert = req.body;

	var application_id = "558c0dc85a48ca2c00b74ae5";
	var application_name = ex_alert.application_name;
	var account_name = ex_alert.accountName;
	var client_name = ex_alert.clientName;
	var alertPublishName = ex_alert.alertPublishName;
	var alert_id = "558c18e2e4b0cfb129e10669";
	var alert_type = ex_alert.alert_name;
	var alert_name = ex_alert.alert_name;
	var alert_description = ex_alert.alert_description;
	var alert_severity = ex_alert.severity;
	var alert_timestamp = ex_alert.alert_raised_timestamp ? ex_alert.alert_raised_timestamp
			.trim()
			: ex_alert.alert_raised_timestamp;
	// alert_timestamp = moment(alert_timestamp,
	// [ "YYYYMMDDHHmmss" ]).toDate().toString();
	var object = {
		alertID : alert_id,
		applicationID : application_id,
		applicationName : application_name,
		alertName : alert_name,
		alertDesc : alert_name,
		alertState : "OPEN",
		alertShortDesc : alert_name,
		alertSource : ex_alert.alertSource,
		alertResource : ex_alert.alertResource,
		alertSeverity : alert_severity,
		relatedAlerts : ex_alert.relatedAlerts,
		alertRaisedTime : alert_timestamp,
		alertType : alert_type,
		incident : ex_alert.incident,
		events : ex_alert.events,
		monitoringToolName : "SQL Database",
		accountName : account_name,
		clientName : client_name,
		alertPublishName : alertPublishName
	}

	res.status(200).send(object);
}

exports.ABCDefaultEmailAlertMapper = function(req, res) {
	logger.info("inside ABCDefaultEmailAlertMapper : " + JSON.stringify(req.body));
	var ex_alert = req.body;

	var usecaseName = ex_alert.subject.slice(ex_alert.subject.indexOf("<") + 1, ex_alert.subject.indexOf(">")).trim();
//	var applicationName = ex_alert.subject.slice(ex_alert.subject.lastIndexOf("<") + 1, ex_alert.subject.lastIndexOf(">")).trim();
	var client_id = ex_alert.subject.slice(ex_alert.subject.lastIndexOf(":") + 1).trim();
	
	if (!usecaseName || usecaseName == null || usecaseName == "") {
		res.status(400).send();
		return;
	}
//	if (!applicationName || applicationName == null || applicationName == "") {
//		res.status(400).send();
//		return;
//	}
	if (!client_id || client_id == null || client_id != ex_alert.client_id) {
		res.status(400).send();
		return;
	}
	

	var object = {
		alertID : "",
		applicationID : ex_alert.application_id,
		applicationName : ex_alert.applicationName,
		alertName : usecaseName,
		alertDesc : ex_alert.subject,
		alertState : "OPEN",
		alertShortDesc : usecaseName,
		alertSource : "Email from " + ex_alert.clientName,
		alertResource : "",
		alertSeverity : "High",
		relatedAlerts : "",
		alertRaisedTime : ex_alert.timestamp,
		alertType : "Diagnostics",
		incident : "",
		events : "",
		monitoringToolName : ex_alert.clientName + " (" + ex_alert.from + ")",
		accountName : ex_alert.accountName,
		clientName : ex_alert.clientName,
		alertPublishName : ex_alert.alertPublishName
	}

	res.status(200).send(object);
}


//************************************************MANULIFE DEMO START ************************************************************************************


exports.ManulifeIPCEmailMapper = function(req, res) {
	logger.info("inside ManulifeIPCEmailMapper : " + JSON.stringify(req.body));
	var ex_alert = req.body;

	var usecaseName = ex_alert.subject.slice(ex_alert.subject.indexOf("<") + 1, ex_alert.subject.indexOf(">")).trim();
//	var applicationName = ex_alert.subject.slice(ex_alert.subject.lastIndexOf("<") + 1, ex_alert.subject.lastIndexOf(">")).trim();
	var client_id = ex_alert.subject.slice(ex_alert.subject.lastIndexOf(":") + 1).trim();
	
	if (!usecaseName || usecaseName == null || usecaseName == "") {
		res.status(400).send();
		return;
	}
//	if (!applicationName || applicationName == null || applicationName == "") {
//		res.status(400).send();
//		return;
//	}
	if (!client_id || client_id == null || client_id != ex_alert.client_id) {
		res.status(400).send();
		return;
	}
	

	var object = {
		alertID : "",
		applicationID : ex_alert.application_id,
		applicationName : "Windows Service",
		alertName : "Restart Windows Service",
		alertDesc : "Restart Windows Service",
		alertState : "OPEN",
		alertShortDesc : usecaseName,
		alertSource : "Email from " + ex_alert.clientName,
		alertResource : "",
		alertSeverity : "High",
		relatedAlerts : "",
		alertRaisedTime : ex_alert.timestamp,
		alertType : "Diagnostics",
		incident : "",
		events : "",
		monitoringToolName : ex_alert.clientName + " (" + ex_alert.from + ")",
		accountName : ex_alert.accountName,
		clientName : ex_alert.clientName,
		alertPublishName : ex_alert.alertPublishName
	}

	res.status(200).send(object);
}

//*******************************************************END***********************************************************************************************