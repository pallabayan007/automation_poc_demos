var TWS   = require('./utils/tws');
var WAProcess = require('./helpers/WAProcess');
var RestfulStep = require('./helpers/steps/RestfulStep');
var TriggerFactory = require('./helpers/TriggerFactory');
var TaskLibrary = require('./helpers/TaskLibrary');
var LOGIN_SERVICE_URL = "/Status/RestoreSession";
var TASKLIBRARY_SERVICE_URL = "/TaskLibrary/";
var TASKS_SERVICE_URL = "/Tasks/";
var RUNNOW_SERVICE_URL = "/RunNow";
var TASKHISTORY_SERVICE_URL = "/TaskHistory/";
var JOBS_SERVICE_URL = "/Jobs/";
var ACTIONLIST_SERVICE_URL = "/ACTION_LIST";
var SIMPLEUI_COOKIE_PARAMETER = "JSESSIONID_ibm_console";

var defaultLibraryName = "BlueMix";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function WorkloadService(properties) {
	this.tws = new TWS(properties);
	this.cookie = "";
	this.defaultLibraryId = 0;
}
//TODO exception management
//TODO trigeer
//TODO variables
//TODO variabletable


//schedule RestfulStep with cron definition
//  
WorkloadService.schedule = function(twsprops, agent, nameProcess, descriptionProcess, cronDefinition, url, method, body, inputTextBody, accept, contentType, userName, password, keyStoreFilePath, keyStorePassword, verifyHostname, outputFileName, queryParameters, inputFileName, headers, jsonObjectResultQuery, callback) {
		var a = new WorkloadService(twsprops);
	 
		var p3 = new WAProcess(nameProcess,descriptionProcess);
		p3.addStep(new RestfulStep(agent, url, method, body , inputTextBody, accept, contentType, userName, password, keyStoreFilePath, keyStorePassword, verifyHostname, outputFileName, queryParameters, inputFileName, headers, jsonObjectResultQuery));
		p3.addTrigger( TriggerFactory.fromCron(cronDefinition));
			 
		a.createAndEnableTask(p3, function(newTask){
			 
		});
			  
};

WorkloadService.prototype = {
		
			login : function(callback) {
					var workServ = this;
					if (workServ.cookie.length > 0) {
						callback();
					} else {
						console.log("login: Login...");
						workServ.tws.login(LOGIN_SERVICE_URL, function(errorMessage, res) {
							if(errorMessage){
								console.error("Failed the login: User profile cannot be loaded " +errorMessage);
							}
							else{
								for (var i = 0; i < res['headers']['set-cookie'].length; i++) {
									if (res['headers']['set-cookie'][i].indexOf(SIMPLEUI_COOKIE_PARAMETER) == 0)
									{
										workServ.cookie = res['headers']['set-cookie'][i];
									}
								}
								if (workServ.cookie.length > 0) {
									console.log("cookie... "+workServ.cookie);
									callback();
								} else {
									console.error("Error Retrieveing Cookie");
								}
							}
						});
					}
			},
			
			
		/**
	     * Creates and enables to run a Task (internal name of process)
	     * 
	     * @param task
	     */

		createAndEnableTask : function(task,callback) {
			var workServ = this;
			this.login(function () {
				workServ.createTask(task, function(res) {
			
					console.log("createAndEnableTask: Creating task... ");
					var createdTask = res;
					createdTask.taskstatus = true;
					workServ.enableDisableTask(createdTask, true, function(res) {
						console.log("createAndEnableTask: Enabling task... ");
						callback(createdTask);
					});
						
				});
			});
		},
		
		
		/**
	     * Creates a Process on the Workload Automation enviroment.
	     * 
	     * Task is the internal name for the Process.
	     * 
	     * @param task
	     */
		
		createTask : function(task,callback) {
			
			var workServ = this;
			this.login(function () {
				workServ.getLibraryId(task, function(res) {
					task.tasklibraryid = res;

					//create task
					console.log("createTask: Creating task...");
					workServ.tws.post(TASKS_SERVICE_URL, task, workServ.cookie, function(errorMessage, res) {
						if(errorMessage){
							console.error("Error create task: "+ errorMessage);
						}else{	
							var createdTask = res[0];
							createdTask.taskstatus = true;
							callback(createdTask);	
						}				
					});				
				});
			});	
		},
		
		
		/**
	     * Creates a process library on the Workload Environment
	     * 
	     * @param taskLibrary
	     */
	     
		createTaskLibrary : function(taskLibrary,callback) {
			var workServ = this;
			this.login(function () {
				console.log("createTaskLibrary: Creating task Library...");
				workServ.tws.post(TASKLIBRARY_SERVICE_URL, taskLibrary, workServ.cookie, function(errorMessage, res) {
					if(errorMessage){
						console.error("Error create task library: "+ errorMessage);
					}
					else{
						var createdTaskLibrary = res[0];
						createdTaskLibrary.taskstatus = true;
							callback(createdTaskLibrary);
					}		
				});
			});
		},


		/**
	     * Enable disables a task
	     * 
	     * @param task
	     * @param enable
	     */
		
		enableDisableTask : function(task,enable,callback) {
			try{
				var workServ = this;
				this.login(function () {
					console.log("enableDisableTask: " + (enable ? "Enabling" : "Disabling") + " task with id:" + task.id);
					if (task.actions.length == 0) {
						throw "Error No Action is present";
					}
					task.taskstatus = enable;
					workServ.updateTask(task, function(){
						callback();
					});
				});
			}
			catch(exc){
				console.log(exc);
			}
		},
		
		
		/**
	     * Updates a task
	     * 
	     * @param task
	     * @param enable
	     */

		updateTask : function(task,callback) {
			var workServ = this;
			this.login(function () {
				console.log("updateTask: Updating task...");
				workServ.tws.put(TASKS_SERVICE_URL+task.id, task, workServ.cookie, function(errorMessage, res) {
					if(errorMessage){
							console.error("Error update task: "+ errorMessage);
					}else{
						callback();		
					}		
				});
			});
		},
		
		
		/**
	     * Updates a task library
	     * 
	     * @param task library object
	     * @param enable
	     */
			
		updateTaskLibrary : function(taskLibrary,callback) {
			var workServ = this;
			this.login(function () {
				console.log("updateTaskLibrary: Updating task Library...");
				workServ.tws.put(TASKLIBRARY_SERVICE_URL+taskLibrary.id, taskLibrary, workServ.cookie, function(errorMessage, res) {
					if(errorMessage){
						console.error("Error update task Library: "+ errorMessage);
					}else{
						callback();		
					}		
				});
			});
		},
		
		
		/**
	     * Returns the library
	     * 
	     * @param task 
	     */

		getLibraryId : function(task,callback) {
				var workServ = this;
				var found = false;
				this.login(function () {
					if (task.tasklibraryid != 0) {
						callback(task.tasklibraryid);
						console.log("getLibraryId: taskLibraryId is "+task.tasklibraryid);
					} else if (workServ.defaultLibraryId != 0) {
						callback(workServ.defaultLibraryId);
						console.log("getLibraryId: taskLibraryId is "+workServ.defaultLibraryId);
					} else {
						console.log("getLibraryId: Retrieving default tasklibrary...");
						
						workServ.tws.get(TASKLIBRARY_SERVICE_URL, workServ.cookie, function(errorMessage, res) {
							if(errorMessage){
								console.error("Error get Library Id: "+errorMessage);
							}
							else{
								for (var i = 0; i < res.length; i++) {
									 if (res[i].name == defaultLibraryName){
										workServ.defaultLibraryId = res[i].id;
										found = true;
										break;
									}
								}
							
								if(found == false){
									var t = new TaskLibrary();
									t.name = defaultLibraryName;
	             					t.parentid = -1;
									workServ.createTaskLibrary(t, function(res) {
										workServ.defaultLibraryId = res.id;
										console.log("getLibraryId: taskLibraryId is "+workServ.defaultLibraryId);
										callback(workServ.defaultLibraryId);
									});
								}
								else{
									callback(workServ.defaultLibraryId);
								}
							}
						});
					}
				});
		},
		
		
		/**
	     * Starts a process now.
	     * 
	     * @param taskId
	     */
		
		runTask : function(taskid,callback) {
			var workServ = this;
			this.login(function () {
				console.log("runTask: Running the task...");
				workServ.tws.put(TASKS_SERVICE_URL+taskid+RUNNOW_SERVICE_URL, "", workServ.cookie, function(errorMessage, res) {
					if(errorMessage){
						console.error("Error run Task: " +errorMessage);
					}
					else{	
						callback();
					}
				});
			});
		},
		
		
		/**
	     * Deletes a task. The task must be disabled to be deleted
	     * 
	     * @param taskId
	     */
		
		deleteTask : function(taskid,callback) {
			var workServ = this;
			this.login(function () {
				console.log("deleteTaskLibrary: Deleting the task...");
				workServ.tws.remove(TASKS_SERVICE_URL+taskid, workServ.cookie, function(errorMessage, res) {
					if(errorMessage){
						console.error("Error delete task: "+ errorMessage);
					}
					else{
						callback();
					}
				});
			});
		},
		
		
		/**
	     * Deletes a task library, and all containing tasks
	     * 
	     * @param taskLibraryId
	     */
		
		deleteTaskLibrary : function(taskLibraryId,callback) {
			var workServ = this;
			this.login(function () {
				console.log("deleteTask: Deleting the task Library...");
				workServ.tws.remove(TASKLIBRARY_SERVICE_URL+taskLibraryId, workServ.cookie, function(errorMessage, res) {
					if(errorMessage){
						console.error("Error delete task: "+ errorMessage);
					}
					else{
						callback();
					}
				});
			});
		},
		
		
		/**
	     * Returns the run history of a process
	     * 
	     * @param taskId
	     */

		getTaskHistory : function(taskid,callback) {
			var workServ = this;
			this.login(function () {
				console.log("getTaskHistory: Getting the task history...");
				workServ.tws.get(TASKHISTORY_SERVICE_URL+taskid, workServ.cookie, function(errorMessage, res) {
					if(errorMessage){
						console.error("Error get task History: "+ errorMessage);
					}
					else{
						callback(res);
					}
				});
			});
		},
		
		
		/**
	     * Returns the run history of a process
	     * 
	     * @param taskId
	     */
		
		getStepsHistory : function(taskid,taskhistoryinstance,callback) {
			var workServ = this;
			this.login(function () {
				console.log("getStepsHistory: Getting the step history...");
				workServ.tws.get(TASKHISTORY_SERVICE_URL+taskid+'/'+taskhistoryinstance.id+'/'+taskhistoryinstance.instancetype, workServ.cookie, function(errorMessage, res) {
					if(errorMessage){
						console.error("Error get steps History: "+ errorMessage);
					}
					else{
						callback(res);
					}
				});
			});
		},
		
		
		/**
	     * Returns the output of a ran step
	     * 
	     * @param actionHistoryInstance The instance of the ran step to get output 
	     */
		
		getLog : function(actionhistoryinstance,callback) {
			var workServ = this;
			this.login(function () {
				workServ.getLogUrl(actionhistoryinstance, function(res) {
					var jobLog = res;
					console.log("getLog: Getting the job log...");
					workServ.tws.getlog(jobLog, workServ.cookie, function(errorMessage, res) {
						if(errorMessage){
							console.error("Error get Log: "+errorMessage);
						}
						else{
							callback(res);
						}
					});
				});
			});
		},

		getLogUrl : function(actionhistoryinstance,callback) {
			var workServ =this;
			this.login(function () {
				console.log("getLogUrl: Getting the job log url...");
				var step = "startDate:"+actionhistoryinstance.startdate+",instanceType:"+actionhistoryinstance.instancetype+",jobNumber:"+actionhistoryinstance.jobnumber;
				workServ.tws.textpost(JOBS_SERVICE_URL+actionhistoryinstance.id+ACTIONLIST_SERVICE_URL, step, workServ.cookie, function(messageError, res) {
					if(messageError){
						console.error("Error get Log URL: "+messageError);
					}
					else{
						var jobLog = res.jobLog;
						console.log("getLogUrl: Job log url "+jobLog);
						callback(jobLog);
					}
						
				});
			});			
		}
};

module.exports = WorkloadService;
