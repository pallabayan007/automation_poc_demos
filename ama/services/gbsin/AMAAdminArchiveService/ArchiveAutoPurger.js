/**
 * Name    - ./ama/services/gbsin/AMAAdminArchiveService/ArchiveAutoPurger.js
 * Purpose - Checks the age of all existing archive files and delete them silently if it is higher than a threshold value.
 * Date    - Aug 12, 2016.
 */
var auditLogArchivalService = require("./AuditLogArchivalService.js");
var logger = getLogger("AuditLogArchival");
var interval = null;
var AuditLogMonitorConfig = require("../../../../config/audit_archive_config.json");
var configuredAgeForAutoDeletion = AuditLogMonitorConfig.archive_age_auto_deteletion_in_years;
var AUDITLOG_ARCHIVE_PATH = "./auditlog_archives";
var ARCHIVE_FOLDER_MARKUP_FILE = "README";

/*
 * Checks the Age of all existing archive files inside the archive folder
 * and purge the archive if it is too old (older than a configured value)
 */
function checkNDeleteAgedArchives() {
	logger.info ("::ArchivePurger Checking Files for Purging");
	auditLogArchivalService.findArchiveFiles (AUDITLOG_ARCHIVE_PATH, function(err,resultFileList){
		if(err){
			logger.info ("Error in retrieving archive file list :"+err);
		} else {
			var archiveFiles = resultFileList;
			logger.info (" ::ArchivePurger File List Length:"+archiveFiles.length);
			for(var index=0; index < archiveFiles.length ; index++){
				var fileName = archiveFiles[index].file;
				var age_fetch_status = archiveFiles[index].age_fetch_status;
				var age_in_years = archiveFiles[index].age;
				logger.info ("::ArchivePurger Selecting File :"+fileName+" Current Age In Years:"+age_in_years+" configured age for delete:"+configuredAgeForAutoDeletion);
				if(age_fetch_status=="Success"){
					if(!fileName.startsWith(ARCHIVE_FOLDER_MARKUP_FILE)){
						if(age_in_years > configuredAgeForAutoDeletion){
							logger.info("::ArchivePurger Purging File "+fileName);
							auditLogArchivalService.deleteArchive(AUDITLOG_ARCHIVE_PATH,fileName);
						}
					}
				}
			}
			//Deleting the reference - enable GC to reclaim the memory
			archiveFiles=null;
		}

	});
}


/*
 * Starts the Periodic Monitoring Process.
 */
exports.startDaemon = function() {
	logger.info("ArchiveAutoPurger Started...");
	var delay = 30000; // TODO : Fetch from config, for now set it to 30 sec
	interval = setInterval(checkNDeleteAgedArchives,delay);

}

/*
 * Stop the Periodic Monitoring Process.
 */
exports.stopDaemon = function() {
	if(interval) {
		logger.info ("Stopping the ArchiveAutoPurger service..");
		clearInterval(interval);
	}
}
