/**
 * Name    - ./ama/gbsin/AMAAdminArchiveService/index.js
 * Purpose - Controls All Audit Archival Related Process
 * Date    - Aug 10, 2016
 * 
 */
var fs = require('fs');
var json2csv = require("json2csv");
var auditLogVolumeMonitor = require("./AuditLogVolumeMonitor.js");
var auditLogArchivalService = require("./AuditLogArchivalService.js");
var archiveAutoPurger = require("./ArchiveAutoPurger.js");

var AUDITLOG_ARCHIVE_PATH = "./auditlog_archives";

/*
 * Initiate all back-ground monitors related to Audit Archival.
 * - Archive Audit Log Monitors
 * 1) Audit Log Monitoring Service - checks the Audit Log Volume
 *    against a configured values and raised warning accordingly.
 *    
 * 2) Archive Auto Purge Service   - checks the age of the stored archive
 *    files and deletes it automatically if it reaches a configured threshold
 *    value. 
 */
exports.initiateAuditArchivalMonitors = function () {
	//Initiate Audit Archive Log Monitor Service
	auditLogVolumeMonitor.startMonitor();
	
	//Initiate Archive Auto Purge Service
	archiveAutoPurger.startDaemon();
}

/*
 * REST SERVICE TO RETRIEVE EXISTING ARCHIVE FILES
 * METHOD : GET
 * URI    : /rest/AuditLogArchival/ExistingArchives
 */
exports.listArchives = function (req,res) {
	auditLogArchivalService.listExistingArchives(AUDITLOG_ARCHIVE_PATH,res);
}


/*
 * REST SERVICE TO DELETE EXISTING ARCHIVE FILE
 * METHOD : DELETE
 * URI    : /rest/AuditLogArchival/Archive/:archive_file
 */
exports.deleteArchive = function (req,res) {
	//Retrieve Archive File Name From Request
	var fileName = req.params.archive_file;
	
	if(fileName){
		auditLogArchivalService.deleteArchive(AUDITLOG_ARCHIVE_PATH,fileName);
		res.status(200).json({"status" : fileName+ " Delete Initiated"});
	} else {
		res.status(200).json({"status" : "No archiveFile in request"});
	}	
}


/*
 * REST SERVICE TO CREATE ARCHIVE FILE
 * METHOD : POST
 * URI    : /rest/AuditLogArchival/Archive/:archive_file
 */
exports.createArchive = function (req, res) {
	//Retrieve Archive File Name From Request
	var fileName = req.params.archive_file;
	
	if(fileName){
		auditLogArchivalService.createArchive(AUDITLOG_ARCHIVE_PATH,fileName);
		res.status(200).json({"status" : fileName+ " Archival Creation Initiated"});
	} else {
		res.status(200).json({"status" : "No archiveFile in request"});
	}
}

/*
 * REST SERVICE TO GENERATE CSV FILE
 * METHOD : GET
 * /rest/AuditLogArchival/generateCSV/:csv_file
 */

exports.generateCSV = function (req, res) {
	var csvFile = req.params.csv_file;
	auditLogArchivalService.generateCSV(AUDITLOG_ARCHIVE_PATH, csvFile, res);	
}