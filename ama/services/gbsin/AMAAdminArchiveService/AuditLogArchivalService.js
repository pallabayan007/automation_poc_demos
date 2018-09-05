/**
 * Name    - ./ama/services/gbsin/AMAAdminArchiveService/AuditLogArchivalService.js
 * Purpose - Manages Audit Log Archival Related Operations - Create, Delete, List Archives.
 * Date    -  Aug 11, 2016
 */
var fs = require('fs');
var async = require("async");
var json2csv = require("json2csv");
var path = require("path");
var models = require("../../../../models");
var logger = getLogger("AuditLogArchival");
var AuditLogConfig = require("../../../../config/audit_archive_config.json");
var one_year = 365*1000*60*60*24; // One Year in Milliseconds
var totalcount;


function currentFormattedDate() {
	var dateObj = new Date();
	var month = dateObj.getUTCMonth() + 1; //months from 1-12
	var day = dateObj.getUTCDate();
	var year = dateObj.getUTCFullYear();

	newdate = year + "_" + month + "_" + day;
	return newdate;
}

function deleteAllAuditLogs(modelName) {
	var dbModel = models[modelName];
	if(dbModel){
		if (modelName == "TransactionAuditLog"){
			dbModel.remove({}, function(err,removed) {
				if(!err){
					logger.info("Complete : Removed Audit Log Records");
					SocketManager.emit("Archive_Status", "Complete");
				} else {
					logger.info("Error Removing Records...");
					SocketManager.emit("Archive_Status", "Complete With Error : Error Deleting Audit Log...");
				}
	
			});
		}else {
			dbModel.find({"status" : {$ne : "In Progress"}}).sort({_id:1}).limit(totalcount).lean().exec(function(err, data){
				if(!err){
					logger.info("Complete : Removed Audit Log Records");					
					data.forEach(function(entry) {
						logger.info(entry._id);
						dbModel.remove({ "_id" : entry._id}, function(err){
							if(err){
								logger.info("Error while deleting "+err);
							}
						});				
					});					
					SocketManager.emit("Archive_Status", "Complete");
				} else {
					logger.info("Error Removing Records...");
					SocketManager.emit("Archive_Status", "Complete With Error : Error Deleting Audit Log...");
				}
			});
		}
	}
}


/*
 * Creates Archive for the given dbModel.
 * archivePath will contain the location of the archives.
 * modelName would be either of "AlertAuditLog","TicketAuditLog","TransactionAuditLog
 */
exports.createArchive = function (archivePath, modelName) {
	if(modelName) {
	   // Fetch Appropriate DB Model
		var dbModel = models[modelName];
		// Read/Select All Records From the Model.
		SocketManager.emit("Archive_Status", "Selecting records to archive...");
		logger.info("Archive_Status-"+modelName+" Selecting records to archive...");		
		if(dbModel){			
			if (modelName == "TransactionAuditLog"){				
				dbModel.find({}).lean().exec(function(err, data){
					if(err){
						logger.info("Error Selecting Records.."+err);
						// Emit Error Message
						SocketManager.emit("Archive_Status", "Error Selecting Records...");
					}
					else {
						var archive_data = {};
						//Create a json containing archiveName(based on ModelName and currentDate), archiveDate and records
						var fileName= modelName +"_"+currentFormattedDate()+".json";
						archive_data["archiveDate"] = new Date();
						archive_data["dbmodel"] = modelName;
						archive_data["records"] = data;
						//Emit Archive Creation Event
						SocketManager.emit("Archive_Status", "Creating Archive File...");
						logger.info("Archive_Status - Creating Archive File...");
						var filePath = archivePath+ "/"+fileName;
						// Save the json as archive file
						fs.writeFile(filePath, JSON.stringify(archive_data),  function(err) {
							   if (err) {
							       //Emit Archive File Writing Error
								   SocketManager.emit("Archive_Status", "Error Creating Archive File...");
								   logger.info("Archive_Status - Error Creating Archive File..."+err);
							   } else {
								   // On Successful file save delete all records from the dbModel
								   //File Creation Success
								   //Delete All Records
								   // Emit Delete All Audit Records
								   SocketManager.emit("Archive_Status", "Deleting Existing Records...");
								   logger.info("Archive_Status - Deleting Existing Records...");
								   deleteAllAuditLogs(modelName);
							   }
							   
							});
						
					}
				});
			} else {								
				dbModel.count({}).lean().exec(function(err, c){
					if(err){
						logger.info("Error Selecting Records.."+err);
						// Emit Error Message
						SocketManager.emit("Archive_Status", "Error Selecting Records...");
					}
					else {
						logger.info("No of records in the table "+c);
						var retainedRecordsPercentage = AuditLogConfig["percentage_of_records_to_be_retained"];
						var retainedRecords = Math.round((retainedRecordsPercentage)*(c/100));
						logger.info("No of records to be retained "+retainedRecords);						
						totalcount = c - retainedRecords;												
						logger.info("No of records to be archived "+totalcount);
						dbModel.find({"status" : {$ne : "In Progress"}}).sort({_id:1}).limit(totalcount).lean().exec(function(err, data){
							if(err){
								logger.info("Error Selecting Records.."+err);
								// Emit Error Message
								SocketManager.emit("Archive_Status", "Error Selecting Records...");
							}else {
								var archive_data = {};
								//Create a json containing archiveName(based on ModelName and currentDate), archiveDate and records
								var fileName= modelName +"_"+currentFormattedDate()+".json";
								archive_data["archiveDate"] = new Date();
								archive_data["dbmodel"] = modelName;
								archive_data["records"] = data;
								//Emit Archive Creation Event
								SocketManager.emit("Archive_Status", "Creating Archive File...");
								logger.info("Archive_Status - Creating Archive File...");
								var filePath = archivePath+ "/"+fileName;
								// Save the json as archive file
								fs.writeFile(filePath, JSON.stringify(archive_data),  function(err) {
									   if (err) {
									       //Emit Archive File Writing Error
										   SocketManager.emit("Archive_Status", "Error Creating Archive File...");
										   logger.info("Archive_Status - Error Creating Archive File..."+err);
									   } else {
										   // On Successful file save delete all records from the dbModel
										   //File Creation Success
										   //Delete All Records
										   // Emit Delete All Audit Records
										   SocketManager.emit("Archive_Status", "Deleting Existing Records...");
										   logger.info("Archive_Status - Deleting Existing Records...");
										   deleteAllAuditLogs(modelName);
									   }
									   
									});
							}
						});																		
					}
				});				
			}
		}
	} else {
		// Indicate Invalid Request
		logger.info("Invalid Create Archive Request");
	}
}

/*
 * Deletes the given archive file from the archive folder.
 */
exports.deleteArchive = function (archivePath,fileName) {
	// Delete the archive file
	logger.info("Inside deleteArchive");
	var deleteFileFullPath = archivePath+"/"+fileName;
	var eventArchiveDelete = "Delete_Archive";
	
	var status = {};
	fs.unlink(deleteFileFullPath, function(err) {
		   if (!err) {
			   status["result"] = "success";
		   } else {
			   status["result"] = "error";
			   status["errorMsg"] = err;			   
		   }
		   SocketManager.emit(eventArchiveDelete, status);
		   logger.info(deleteFileFullPath +" Archive Delete :"+JSON.stringify(status));
	});
}

/*
 * Make File Age Finder with all the necessary host variable(path) to calculate pertinent ages of the files.
 */
function makeFileAgeFinder(path) {
	return function(fileItem,callback) {
		var fullFilePath= path+"/"+fileItem;
		logger.info("Checking "+fullFilePath+"  status ");
		fs.stat(fullFilePath,function(err,stats){
			var reqItemStatus=null;
			if(err) {
				reqItemStatus = { "file" : fileItem, "age_fetch_status" : "Error", "age" : 0, "Error" : err};
				
			} else {
				logger.info("===Status===");
				var creationdate = new Date(stats.birthtime);
				var curdate = new Date();
				var diff_date_yrs = (curdate - creationdate)/one_year;
				logger.info ("file:" + fileItem+ " creationdate :"+creationdate+" curdate:"+curdate+ " diff:"+diff_date_yrs);
				reqItemStatus = { "file" : fileItem, "age_fetch_status" : "Success", "age" : diff_date_yrs};
				
			}
			
			return callback(null,reqItemStatus);			
			
		});
		
	}
}
/*
 * Find Archive Files Stored inside the archive folder
 * Calculate it's age in years and prepares a list.
 */

exports.findArchiveFiles = function (path,callback){
	logger.info("==Inside findArchiveFiles===");
	fs.readdir(path, function(err, items) {
		var reqStatus = [];
		if(!err){
			logger.info(items);			
			var findFileAge = makeFileAgeFinder(path);
			async.map(items,findFileAge,function(err,results){
				callback(err,results);
			});
		} else {
			callback(err,reqStatus);
		}

	});	
}

/*
 * List Existing Archive files.
 */
exports.listExistingArchives = function(path, res) {
	//List Existing Archive Files from the Archive folder
	logger.info("Inside listExistingArchives");
	exports.findArchiveFiles(path, function(err,resultFileList) {
		if(err){
			res.status(404).json({"Error" : err});
		} else {
			res.status(200).json({"Results" : resultFileList});
		}
	});
}

//Create CSV file from JSON
exports.createCSV = function (filePath, callback) {
	logger.info('====== Inside createCSV ======');
	fs. readFile(filePath + '.json', 'utf8', function(err, contents) {
		var reqStatus = [];
		if(!err) {
			
			var fields = getJSONFields(contents);
			console.log(fields);
			try {
				var result = json2csv({ data: JSON.parse(contents).records, fields: fields });
				callback(err, result);
			} catch (err) {
			  console.error(err);
			}
		} else {
			callback(err,reqStatus);
		}
	});
}

//Write CSV output in response
exports.generateCSV = function(filePath, fileName, res) {
	//Generate CSV File from JSON
	logger.info("==== Inside generateCSV ======");
	exports.createCSV(filePath + '/' + fileName, function(err,result) {
		if(err){
			res.status(404).json({"Error" : err});
		} else {
			var file_path = path.resolve(__dirname, "../../../../temp/" + fileName + '.csv');
			fs.writeFile(file_path, result, 'utf8', function (err) {
				if (err) throw err;
				else {
					res.attachment(file_path);
					res.sendFile(file_path);
				}
			});
		}
	});
}

//Get JSON fields in content
function getJSONFields(jsonContents) {
	var jsonObj = JSON.parse(jsonContents).records;
	var firstRow = jsonObj[0];
	var jsonFields = Object.keys(firstRow); 
	return jsonFields;
}