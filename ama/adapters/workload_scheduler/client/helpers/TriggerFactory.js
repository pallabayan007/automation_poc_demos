var FILE_CREATED_EVENT = "fileCreated";
var FILE_DELETED_EVENT = "fileDeleted";
var FILE_LOG_EVENT =  "fileLog";
var FILE_MODIFIED_EVENT = "fileModified";
var DAILY_SCHEDULE = "DailyTrigger";
var WEEKLY_SCHEDULE = "WeeklyTrigger";
var MONTHLY_SCHEDULE = "MonthlyTrigger";

 var Trigger = require('./Trigger');

function TriggerFactory() {

}

	/**
     * Creates a schedule that repeats every number of day, but only for a certain period
     * 
     * @param frequency frequency of repeating: 1 every day, 2 every 2 days, etc.
     * @return The Trigger to add to the Process
     */

	TriggerFactory.repeatDaily = function (frequency, startdate) {
			var trigger = new Trigger();
			trigger.triggertype = DAILY_SCHEDULE;
			trigger.dailyproperty = {};
			if(startdate == null ){
				trigger.dailyproperty.startdate = (new Date()).toISOString().substring(0, 19);
			}
			else{
				trigger.dailyproperty.startdate = startdate;
			}	
			trigger.dailyproperty.frequency= frequency;
			trigger.dailyproperty.repeatevery = ":";
			trigger.dailyproperty.dailyschedule = 1;
			return(trigger);
	};


    /**
     * Creates a schedule that makes the Process to run once, at the specified time
     * 
     * @param y Year
     * @param m Month
     * @param d Day
     * @param hh Hours
     * @param mm Minutes
     * @return The Trigger to add to the Process
     */
	
	TriggerFactory.scheduleOn = function (y, m, d, hh, mm ) {
			var trigger = new Trigger();
			trigger.triggertype = "OnceTrigger";
			var date = new Date(y, m-1, d, hh, mm);
			var d = date.toISOString();
			console.log(date.getTimezoneOffset());
			console.log("isostring"+d);
			trigger.onetimeproperty = new Object();
			trigger.onetimeproperty.startdate = d.substring(0, 19);
			trigger.onetimeproperty.frequency = 1;
			return(trigger);
	};


	/**
     * Creates a schedule that repeats every <frequency> day, at specified time
     * 
     * @param hh Hours
     * @param mm Minutes
     * @return The Trigger to add to the Process
     */

	TriggerFactory.everyDayAt = function (frequency, hh, mm ) {
			var trigger = new Trigger();
			trigger.triggertype = DAILY_SCHEDULE;
			
			trigger.dailyproperty = {};
			trigger.dailyproperty.frequency= frequency;
			var date = new Date();
			date.setHours(hh,mm);
			var d = date.toISOString();	
			trigger.dailyproperty.startdate = d.substring(0,19);
			trigger.dailyproperty.dailyschedule = 1;
			
			return(trigger);
	};
	
	
	/**
     * Creates a schedule that repeats every number of week, but only for a certain period
     * 
     * @param frequency frequency of repeating: 1 every week, 2 every 2 weeks, etc.
     * @return The Trigger to add to the Process
     */

	TriggerFactory.repeatWeekly = function (frequency, d, startdate){
			var trigger = new Trigger();
			trigger.triggertype = WEEKLY_SCHEDULE;
			trigger.weeklyproperty = {};
			if (frequency <0 || frequency>8){
				throw "Frequency not valid, allowed values are from 0 to 8";
			}
			
			//trigger.dailyproperty.objecttype = "com.ibm.tws.simpleui.bus.impl.DailyTriggerProperty";
			if(startdate == null){
				trigger.weeklyproperty.startdate = (new Date()).toISOString().substring(0, 19);
			}
			else{
				trigger.weeklyproperty.startdate =startdate;
			}
			trigger.weeklyproperty.repeatevery = ":";
			trigger.weeklyproperty.frequency= frequency;
			trigger.weeklyproperty.days= d;
			return(trigger);
	}


	/**
     * Creates a schedule that repeats every number of month, but only for a certain period
     * 
     * @param frequency frequency of repeating: 1 every month, 2 every months, etc.
     * @return The Trigger to add to the Process
     */
     
	TriggerFactory.repeatMonthly = function (frequency, ascendingdays, descendingdays, startdate) {
			try{var trigger = new Trigger();
			trigger.triggertype = MONTHLY_SCHEDULE;
			trigger.monthlyproperty = {};
			if(startdate == null ){
				trigger.monthlyproperty.startdate = (new Date()).toISOString().substring(0, 19);
			}
			else{
				trigger.monthlyproperty.startdate = startdate;
			}	
			trigger.monthlyproperty.repeatevery = ":";
			trigger.monthlyproperty.frequency = frequency;
			trigger.monthlyproperty.ascendingdays = [];
			trigger.monthlyproperty.descendingdays = [];
			trigger.monthlyproperty.ascendingdays = ascendingdays;
			trigger.monthlyproperty.descendingdays = descendingdays;
			
			return(trigger);
			}catch(e){
				console.error(e);
			}
	};
	
	
	 /**
       * Create a trigger to make the process start when a file is created on the
       * agent file system
       * 
       * @param filePath Full path of file
       * @param agent Agent name
       * @return The Trigger to add to the Process
       */

	TriggerFactory.onFileCreated = function (filePath, agent ) {
			return (TriggerFactory.createFileTrigger(FILE_CREATED_EVENT, filePath, agent) );
	};
	
	
	/**
       * Create a trigger to make the process start when a file is modified on the
       * agent file system
       * 
       * @param filePath Full path of file
       * @param agent Agent name
       * @return The Trigger to add to the Process
       */

	TriggerFactory.onFileModified = function (filePath, agent ) {
			return (TriggerFactory.createFileTrigger(FILE_MODIFIED_EVENT, filePath, agent));
	};
	
	
	/**
       * Create a trigger to make the process start when a file is deleted on the
       * agent file system
       * 
       * @param filePath Full path of file
       * @param agent Agent name
       * @return The Trigger to add to the Process
       */

	TriggerFactory.onFileDeleted = function (filePath, agent ) {
			return(TriggerFactory.createFileTrigger(FILE_DELETED_EVENT, filePath, agent));
	};



	TriggerFactory.createFileTrigger = function(triggerType, fileName, agent) {
					var trigger = new Trigger();
					trigger.triggertype = triggerType;
					
					if ( FILE_CREATED_EVENT == triggerType ){
						trigger.filecreatedproperties = {};
						trigger.filecreatedproperties.agent = agent;
						trigger.filecreatedproperties.filename = fileName;
						trigger.filecreatedproperties.sampleinterval = 60;
					}else if( FILE_MODIFIED_EVENT == triggerType ){	
						trigger.filemodifiedproperties = {};
						trigger.filemodifiedproperties.agent = agent;
						trigger.filemodifiedproperties.filename = fileName;
						trigger.filemodifiedproperties.sampleinterval = 60;
					} else if( FILE_DELETED_EVENT == triggerType ){	
						trigger.filedeletedproperties = {};
						trigger.filedeletedproperties.agent = agent;
						trigger.filedeletedproperties.filename = fileName;
						trigger.filedeletedproperties.sampleinterval = 60;
					}
					else{
						return null;
					}
					return(trigger);
	};


	/**
	       * Creates a schedule from a partial cron definition string.
	       * 
	       * @param cronDefinition
	       * @return
	       * @throws InvalidRuleException
	       */
	TriggerFactory.fromCron = function (cronDefinition) {
			var temp = [];
			var minute;
			var hour;
			var dayMonth;
			var month;
			var dayWek;
			var date;
			try{
				temp = cronDefinition.split(" ");
				if(temp.length == 5){
					//console.log("Entro");
					if(temp[0]=="*"){
						minute = null
					}else{
						minute = parseInt(temp[0]);
					}
					
					if(temp[1]=="*"){
						hour = null
					}else{
						hour = parseInt(temp[1]);
					}
					
					if(temp[2]=="*"){
						dayMonth = null
					}else{
						dayMonth = parseInt(temp[2]);
					}
					
					if(temp[3]=="*"){
						month = null
					}else{
						month = parseInt(temp[3]);
					}
					
					if(temp[4]=="*"){
						dayWek = null
					}else{
						dayWek = parseInt(temp[4]);
					}
				
					if(minute != null && hour!=null && dayMonth == null && month == null && dayWek == null ){
						date = new Date();
						date.setHours(hour,minute);
						var d = date.toISOString().substring(0,19);
						return(TriggerFactory.repeatDaily(1, d));	
					}
					
					if(minute != null && hour!=null && dayMonth == null && month == null && dayWek != null ){
						date = new Date();
						date.setHours(hour,minute);
						var d = date.toISOString().substring(0,19);
						return(TriggerFactory.repeatWeekly(1, [dayWek], d));
					}
					
					if(minute != null && hour!=null && dayMonth != null && month == null && dayWek == null ){
						date = new Date();
						date.setHours(hour,minute);
						var d = date.toISOString().substring(0,19);
						return(TriggerFactory.repeatMonthly(1, [dayMonth], [], d));
					}
				
			}
			else{
				throw "Error cron definition";
			}
			}
			catch(exc){
				return(exc);
			}
	};

module.exports = TriggerFactory;
 



