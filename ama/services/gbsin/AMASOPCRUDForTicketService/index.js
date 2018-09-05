var logger = getLogger("DB");

// ----------------------- Start -----------------
var express = require('express');
var app = express();
var request = require('request');
var http = require("http");
var fs = require("fs");
var models = require("../../../../models");
var errorcodes = require('../../../../config/errorcodes.json');
var userMsg = require('../../../../config/user_message.json');
var msg = require('../../../../config/message.js');
var WorkflowManager = require('../../../../ama/services/crlcn/AMAServiceManagementAgent/client/WorkflowManager.js');
var ServiceMonitoringAgent = require('../../../../ama/services/crlcn/AMAServiceMonitoringAgent');

// var mongoose = require('mongoose');
var cors = require('cors');
app.use(cors());

var TicketModel = models.Ticket;
var SOPModel = models.SOP;
var BPMNModel = models.BPMN;
var TicketAuditLogModel = models.TicketAuditLog;
var AccountsModel = models.Account;
var ChoreographModel=models.Choreograph;
var HumanInterface=models.HumanInterface;

/**
 * url :/rest/v1/sopmeta/DefineSOP Description :Create Record for Ticket Method :
 * POST
 */
exports.DefineSOP = function(req, res) {

	var mainjson = req.body;
	logger.info('Define SOP =======================');
	logger.info(JSON.stringify(mainjson));
	var keyArray = Object.keys(mainjson);
	if (keyArray[0] == 'Tickets') {
		var ticketjson = req.body.Tickets;
		var sopjson = req.body.SOPs;

		TicketModel
				.findOne({
					"ticketKey" : ticketjson.ticketKey,
					"trashed" : 'n'
				})
				.lean()
				.exec(
						function(err, Checkticket) {
							if (err) {
								logger.info('1001-Error in Ticket Entry function =======================');
								logger.info(err);
								var errorCode = errorcodes["DBError"];
								res.status(errorCode.statusCode).json({
									operationName : req.originalUrl,
									serviceCode : errorCode.serviceCode,
									internalMessage : err.message,
									userMessage : errorCode.userMessage,
									response : {}
								});
								return;

							} else if (!Checkticket) {
								checkDuplicateSOP(req, res, mainjson,
										ticketjson, sopjson)
							} else {
								var userMessage = userMsg.sopDuplicateTicket;
								var msgJson = msg
										.successMessage("CreateSOP", "1",
												userMessage, userMessage,
												mainjson);
								return res.status(400).send(msgJson);
							}
						});
	}

}

/**
 * Function to add ticket details in the database.
 *
 * @param req
 * @param res
 * @param ticketjson
 * @param sopjson
 * @returns
 */

function ticketentry(req, res, ticketjson, sopjson) {

	logger.info('Ticket entry =======================');
	ticketjson["trashed"] = 'n';
	ticketjson["updateTimestamp"] = new Date().toISOString();
	var newTicket = new TicketModel(ticketjson);
	newTicket.save(function(err, ticketResult) {
		if (err) {

			logger.info('1004-My Error : --- ' + err);
			var errorCode = errorcodes["DBError"];
			res.status(errorCode.statusCode).json({
				operationName : req.originalUrl,
				serviceCode : errorCode.serviceCode,
				internalMessage : err.message,
				userMessage : errorCode.userMessage,
				response : {}
			});
			return;
		} else {
			var ticketkey = ticketjson.ticketKey;
			sopentry(req, res, sopjson, ticketkey);
		}
	});
}

function bpmnPublisher(sopjson,cb)
{
	var sopBpmnData = sopjson["bpmn"]["sopBpmnData"];
	sopBpmnData = sopBpmnData.replace(/\n/g, '\r\n');
	var bpmn_header = '';
	var bpmn_footer = '';
	bpmn_header = bpmn_header + "--28319d96a8c54b529aa9159ad75edef9\r\n";
	bpmn_header += "Content-Disposition: form-data; name=\"deployment-name\"\r\n";
	bpmn_header += "Content-Type: text/plain; charset=us-ascii\r\n\r\n";
	bpmn_header += "aName\r\n";
	bpmn_header += "--28319d96a8c54b529aa9159ad75edef9\r\n";
	bpmn_header += "Content-Disposition: form-data; name=\"enable-duplicate-filtering\"\r\n";
	bpmn_header += "Content-Type: text/plain; charset=us-ascii\r\n\r\n";
	bpmn_header += "true\r\n";
	bpmn_header += "--28319d96a8c54b529aa9159ad75edef9\r\n";
	bpmn_header += "Content-Disposition: form-data; name=\"data\"; filename=\"test.bpmn\"\r\n";
	bpmn_header += "Content-Type: application/octet-stream\r\n\r\n";
	bpmn_footer = bpmn_footer + "\r\n\r\n\r\n--28319d96a8c54b529aa9159ad75edef9--\r\n";
	var newContent = bpmn_header + sopBpmnData + bpmn_footer;
	fs.writeFile("newLoadedContent.bpmn", newContent,'utf8', function(err)
	{
		logger.info('newLoadedContent.bpmn writeFile =======================');
			if(err)
			{
				return console.log(err);
			}
			console.log("The file got saved!");
			console.log(err);
			fs.readFile("newLoadedContent.bpmn", 'utf8', function(err, newLoadedContent)
			{
				logger.info('newLoadedContent.bpmn readFile =======================');
	var options = {
					method: 'POST',
					url: "http://9.195.237.77:8080/engine-rest/deployment/create",
					auth: {
						'user': "demo",
						'pass': "demo",
						'sendImmediately': true
					},
					headers: {"Content-Type": "multipart/form-data; boundary=28319d96a8c54b529aa9159ad75edef9"},
					body: newLoadedContent,
				};
				request(options, function(error, response, body) {
					logger.info('request to camunda =======================');
					logger.info(error);
				});
			});
	});
}

/**
 * Function to add sop in the database.
 *
 * @param req
 * @param res
 * @param sopjson
 * @returns
 */
function sopentry(req, res, sopjson, ticketkey) {

	logger.info('SOP Entry =======================');
	logger.info('SOP area added===========>');
	sopjson["trashed"] = 'n';
	sopjson["updateTimestamp"] = new Date().toISOString();
	sopjson["createTimestamp"] = new Date().toISOString();
	sopjson["BPMNWorkFlowName"] = sopjson["bpmn"]["workflowName"];//sopjson.SOPName; 
	logger.info("****************************");
	logger.info(sopjson["bpmn"]["workflowName"]);
	logger.info(sopjson["BPMNWorkFlowName"]);
	logger.info("****************************");
	
	sopjson.ticket.push(ticketkey);
	
	bpmnPublisher(sopjson);
	var bpmnjson = sopjson["bpmn"];
	bpmnjson["createdByUserId"] = sopjson["createdByUserId"];
	bpmnjson["createDate"] = new Date().toISOString();
	var newBPMN = new BPMNModel(bpmnjson);
	newBPMN.save(function(err, sopResult) {});
	
	logger.info("Before Saving JSON");
	var newSOP = new SOPModel(sopjson);
	newSOP.save(function(err, sopResult) {
		if (err) {
			logger.info('1005-My Error : --- ' + err);
			var errorCode = errorcodes["DBError"];
			res.status(errorCode.statusCode).json({
				operationName : req.originalUrl,
				serviceCode : errorCode.serviceCode,
				internalMessage : err.message,
				userMessage : errorCode.userMessage,
				response : {}
			});
			return;
		} else {
			logger.info("SOAP Saved");
			if(sopResult.SOPType=="S"){

				var userMessage = userMsg.sopNewSOPAdded;
				var msgJson = msg.successMessage("CreateSop", "0", userMessage,
						userMessage, {});
				return res.status(200).send(msgJson);
			}

			else if(sopResult.SOPType=="C"){

				var choreographEventObj=req.body.choreographEvent;
				choreographEventObj["SOPID"]=sopResult._id;
				choreographEventObj["SOPName"]=sopResult.SOPName;
				logger.info('Ready to hit workflow====================');
				var client = new WorkflowManager();
				client.createWorkflow(choreographEventObj, function(err, result) {
					if (err) {
							logger.info('Error in workFlow client----- >'+err);
							var errorCode = errorcodes["DBError"];
							res.status(errorCode.statusCode).json({
								operationName : req.originalUrl,
								serviceCode : errorCode.serviceCode,
								internalMessage : err.message,
								userMessage : errorCode.userMessage,
								response : {}
							});
							return;
					} else {
						//res.status(200).send(result);
						CreateChoreograph(req,res,choreographEventObj);
					}
				});

			}
			else
				return res.status(400).send('Problem in sop type');

		}
	});
}


function CreateChoreograph(req,res,choreographEventObj){

	//var obj=choreographEventObj;

var newChoriograph = new ChoreographModel(choreographEventObj);
	logger.info("choreographObj into the ======== "+JSON.stringify(newChoriograph));
	newChoriograph.save(function(err, choriograph){
		if(err){
			logger.info("err = "+err);
			res.send(err);
			var errorCode=errorcodes["DBError"];
			res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
			return;
		}
		else
		{
			if(req.body.human_activities==undefined)
				{
					logger.info("saving alert==========> = "+choriograph);
					var userMessage=userMsg.sopNewSOPAdded;
					//return res.status(200).send(userMessage);
					var msgJson=msg.successMessage("CreateSop","0",userMessage,userMessage,{});
					return res.status(200).send(msgJson);
				}
			else
				{
					createHumanInterface(req,res);
				}




		}
	});

}


function createHumanInterface(req,res){

	var humanInterfaceObj=req.body.human_activities;
	var humaninterface=new HumanInterface(humanInterfaceObj);

	humaninterface.save(function(err, humanactivityResult){
		if(err){
			logger.info("err = "+err);
			res.send(err);
			var errorCode=errorcodes["DBError"];
			res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
			return;
		}
		else
		{

					logger.info("saving HA==========> = "+humanactivityResult);
					var userMessage=userMsg.sopNewSOPAdded;
					//return res.status(200).send(userMessage);
					var msgJson=msg.successMessage("CreateSop","0",userMessage,userMessage,{});
		}
	});
}

/**
 * Generate SOPAutomationKey
 *
 * @param sopjson
 * @returns
 */
function generateSOPAutomationKey(sopjson) {

	logger.info('Generate SOP automation key area ===========>');
	var provider = sopjson.AutomationProvider;
	if (provider == 'Blue Prism') {
		return (provider + sopjson.AutomationProcess);
	} else if (provider == 'IPSoft') {
		return (provider + sopjson.AutomationInput[0].WorkflowAutomationID);
	}
	else if(provider=='Workflow'|| provider=='Automation Simulator'){
		return (provider);
		}
	else {
		return (provider + sopjson.AutomationInput[0].LibraryName + sopjson.AutomationInput[0].ProcessName);
	}
}

/**
 * Function used to check the sop with same
 * account,application,sopname,ticketkey,sopautomation key exists.
 *
 * @param req
 * @param res
 * @param mainjson
 * @param ticketjson
 * @param sopjson
 */
function checkDuplicateSOP(req, res, mainjson, ticketjson, sopjson) {
	if (mainjson.wholesopFlag == "true") {
		var SOPAutomationKey = generateSOPAutomationKey(sopjson);
		sopjson["SOPAutomationKey"] = SOPAutomationKey;
		SOPModel
				.find({
					"account" : sopjson.account,
					"application" : sopjson.application,
					"SOPName" : sopjson.SOPName,
					"SOPAutomationKey" : SOPAutomationKey,
					"trashed" : 'n'
				})
				.exec(
						function(err, Checksop) {
							if (err) {
								logger
										.info('1002-Error in Ticket Entry function =======================');
								logger.info(err);
								var errorCode = errorcodes["DBError"];
								res.status(errorCode.statusCode).json({
									operationName : req.originalUrl,
									serviceCode : errorCode.serviceCode,
									internalMessage : err.message,
									userMessage : errorCode.userMessage,
									response : {}
								});
								return;

							} else if (Checksop.length == 0) {
								checkDuplicateAutomationSOP(req, res, mainjson,
										ticketjson, sopjson);
							} else {
								var sopnamelist = "";
								console
										.log('qwerty==================================');

								for (var i = 0; i < Checksop.length; i++) {
									console.log(Checksop[i].SOPName);
									sopnamelist = sopnamelist
											+ Checksop[i].SOPName;
									sopnamelist += " ";
									if (i == Checksop.length - 2)
										sopnamelist += "and ";
								}
								var userMessage = "SOP with matching attributes already exists - "
										+ sopnamelist
										+ "Are you sure you want to proceed ?";
								var msgJson = msg.successMessage("CreateSOP",
										"1", userMessage, 'wholesopFlagError',
										mainjson);
								return res.status(400).send(msgJson);
							}
						});
	} else {
		checkDuplicateAutomationSOP(req, res, mainjson, ticketjson, sopjson);
	}
}

/**
 * Function used to check the sop with same account,application,sopautomation
 * key exists.
 *
 * @param req
 * @param res
 * @param mainjson
 * @param ticketjson
 * @param sopjson
 */
function checkDuplicateAutomationSOP(req, res, mainjson, ticketjson, sopjson) {

	if (mainjson.sameautomationFlag == "true") {
		SOPModel
				.find({
					"account" : sopjson.account,
					"application" : sopjson.application,
					"SOPAutomationKey" : sopjson.SOPAutomationKey,
					"trashed" : 'n'
				})
				.exec(
						function(err, checkSopKey) {
							if (err) {
								logger
										.info('1003-Error in Ticket Entry function =======================');
								logger.info(err);
								var errorCode = errorcodes["DBError"];
								res.status(errorCode.statusCode).json({
									operationName : req.originalUrl,
									serviceCode : errorCode.serviceCode,
									internalMessage : err.message,
									userMessage : errorCode.userMessage,
									response : {}
								});
								return;

							} else if (checkSopKey.length == 0) {
								// Go ahead with entry in the database.
								ticketentry(req, res, ticketjson, sopjson)
								// return res.status(200).send('Allow to add
								// ticket');

							} else {

								var sopnamelist = "";
								for (var i = 0; i < checkSopKey.length; i++) {
									sopnamelist = sopnamelist
											+ checkSopKey[i].SOPName;
									sopnamelist += " ";
									if (i == checkSopKey.length - 2)
										sopnamelist += "and ";
								}
								var userMessage = "SOP "
										+ sopnamelist
										+ " exists with same automation provider id and ticket key. Are you sure you want to proceed ?";
								var msgJson = msg.successMessage("CreateSOP",
										"1", userMessage,
										'sameautomationFlagError', mainjson);
								return res.status(400).send(msgJson);
							}
						});
	} else {
		// Go ahead with entry in the database.
		ticketentry(req, res, ticketjson, sopjson)
		// return res.status(200).send('Allow to add ticket');
	}

}

/**
 * url :/rest/v1/sopmeta/GetSOPForEvent Service used to get a respective ticket.
 * Method : GET
 */
exports.GetSOPForEvent = function(req, res) {

	var EventKey = req.query.EventKey;
    var eventType = req.params.eventtype;

    logger.info("====Inside Ticket GetSOPForEvent===="+eventType);
	if (eventType == "ticket") {
		TicketModel.findOne({
			"ticketKey" : EventKey,
			"trashed"   : "n"
		}).lean().exec(
				function(err, ticket) {
					logger.info("Ticket Query Complete::Err->"+err+" ticket :"+ticket);
					if (err) {
						logger.info('2001- My error - ' + err);
						var errorCode = errorcodes["DBError"];
						res.status(errorCode.statusCode).json({
							operationName : req.originalUrl,
							serviceCode : errorCode.serviceCode,
							internalMessage : err,
							userMessage : errorCode.userMessage,
							response : {}
						});
						return;
					} else if (!ticket) {
						var userMessage = userMsg.noticket;
						var msgJson = msg.successMessage("GetSOP", "1",
								userMessage, userMessage, {});
						return res.status(400).send(msgJson);
					} else {

						var accountId = ticket.account;
						AccountsModel.findOne({"_id":accountId}).lean().exec(function (err, accounts) {
						    if (err) {
						      logger.info('Problem during searching account name============');
						    	var errorCode=errorcodes["DBError"];
						    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
						    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
						    	return;
						    } else {
						      //return logger.debug(err);
						    	ticket["accountName"]=accounts.accountName;
						    	logger.info("Fetching respective SOP....");
						    	getRespectiveSOP(req, res, ticket);
						    }
						  });



					}
				});
	} else {
		return res.status(400).send('Area for alert task');
	}

}

/**
 * Get the sop details for a particular ticket key.
 * This should return only valid sops that are not already marked for soft delete( trash = y).
 *
 * @param req
 * @param res
 * @param ticketObj
 */
function getRespectiveSOP(req, res, ticketObj) {

	// var TicketKey = req.query.TicketKey;
	SOPModel.findOne({
		"ticket" : ticketObj.ticketKey,
		"trashed" : "n"
	}).exec(
			function(err, sop) {
				if (err) {
					logger.info('2001- My error - ' + err);
					var errorCode = errorcodes["DBError"];
					res.status(errorCode.statusCode).json({
						operationName : req.originalUrl,
						serviceCode : errorCode.serviceCode,
						internalMessage : err,
						userMessage : errorCode.userMessage,
						response : {}
					});
					return;
				} else if (!sop) {
					var userMessage = userMsg.nosop;
					var msgJson = msg.successMessage("GetSOP", "1",
							userMessage, userMessage, {});
					return res.status(400).send(msgJson);
				} else {
					var returnObj = {};
					returnObj["Tickets"] = ticketObj;
					returnObj["SOPs"] = sop;
					if(sop.SOPType=="S")
						{
						returnObj["ChoreographObj"]={};
						var msgJson = msg.successMessage("GetSOP", "0",
								"Ticket  details", "Ticket details", returnObj);
						return res.status(200).send(msgJson);
						}
					else if(sop.SOPType=="C")
						{
							getRespectiveChoreograph(req,res,returnObj);
						}
					else
						{
							res.status(400).send('Wrong Sop type found.Please check...!');
						}

				}
			});
}

function getRespectiveChoreograph(req,res,returnObj){
	logger.info('return obj json type =============== >');
	logger.info(returnObj);

	ChoreographModel.findOne({"SOPID" : returnObj.SOPs._id}).exec(function(err, choreo) {
				if (err) {
					logger.info('2001- My error - ' + err);
					var errorCode = errorcodes["DBError"];
					res.status(errorCode.statusCode).json({
						operationName : req.originalUrl,
						serviceCode : errorCode.serviceCode,
						internalMessage : err,
						userMessage : errorCode.userMessage,
						response : {}
					});
					return;
				} else if (!choreo) {
					var userMessage = userMsg.nosop;
					var msgJson = msg.successMessage("GetSOPChoreographed", "1",
							userMessage, userMessage, {});
					return res.status(400).send(msgJson);
				} else {

					returnObj["ChoreographObj"]=choreo;

						var msgJson = msg.successMessage("GetSOP", "0","Ticket  details", "Ticket details", returnObj);
						return res.status(200).send(msgJson);


				}
			});
}



/**
 * url:/rest/v1/sopmeta/AmendSOP This service is used to update ticket. Method :
 * PUT
 */
exports.AmendSOP = function(req, res) {

	// AlertModel.findOne({"alertName":alertName, "accountName":accountName,
	// "applicationName":applicationName}).sort( { updateTimestamp: -1 }
	// ).lean().exec(function (err, result) {

	logger.info('Come to this section =================');
	TicketModel.findById(req.query.Id,function(err, ticket) {
						if (err) {
							var errorCode = errorcodes["DBError"];
							res.status(errorCode.statusCode).json({
								operationName : req.originalUrl,
								serviceCode : errorCode.serviceCode,
								internalMessage : err,
								userMessage : errorCode.userMessage,
								response : {}
							});
							return;
						} else if (!ticket) {
							logger.info('ticket not found');
							var userMessage = userMsg.noticket;
							var msgJson = msg.successMessage("GetSOP", "1",
									userMessage, userMessage, {});
							return res.status(400).send(msgJson);
						} else {

							logger.info('Ticket found and need to update==============');

							var obj = req.body;

							logger.info(JSON.stringify(obj));

							ticket.requester = obj.Tickets.requester;
							ticket.assignee = obj.Tickets.assignee;
							ticket.asignmentGroup = obj.Tickets.asignmentGroup;
							ticket.type = obj.Tickets.type;
							ticket.priority = obj.Tickets.priority;
							ticket.subject = obj.Tickets.subject;
							ticket.status = obj.Tickets.status;
							ticket.openedAt = obj.Tickets.openedAt;
							ticket.account = obj.Tickets.account;
							ticket.application = obj.Tickets.application;
							ticket.impact = obj.Tickets.impact;
							ticket.cause = obj.Tickets.cause;
							ticket.urgency = obj.Tickets.urgency;
							ticket.category = obj.Tickets.category;
							ticket.ticketKey = obj.Tickets.ticketKey;
							ticket.updateTimestamp = new Date().toISOString();
							ticket.updatedByUserId = obj.Tickets.updatedByUserId;
							ticket.updateComment = obj.Tickets.updateComment;
							ticket.trashed = 'n';

							// alert.SOPs=obj[0].SOPs;

							/*
							 * console.log('New
							 * alert==================================================>');
							 * console.log(alert);
							 */
							ticket.save(function(err) {
										if (err) {
											logger.info('Error OCCUREDDDDDDDDDDDD +++++++++++++++++++ >');
											logger.info(err);
											var errorCode = errorcodes["DBError"];
											res
													.status(
															errorCode.statusCode)
													.json(
															{
																operationName : req.originalUrl,
																serviceCode : errorCode.serviceCode,
																internalMessage : err,
																userMessage : errorCode.userMessage,
																response : {}
															});
											return;

										} else {
											logger.info('ticket part updated=================');
											updateSop(req, res, obj);
										}
									});

						}

					});

}

/**
 * This function is used to update the sop part.
 *
 * @param req
 * @param res
 * @param obj
 *            is the whole ticket/sop structure.
 */
function updateSop(req, res, obj) {
	SOPModel.findById(obj.SOPs._id,function(err, sop) {
		if (err) {
			var errorCode = errorcodes["DBError"];
			res.status(errorCode.statusCode).json({operationName : req.originalUrl,
								serviceCode : errorCode.serviceCode,
								internalMessage : err,
								userMessage : errorCode.userMessage,
								response : {}
		});
							return;
						} else if (!sop) {
							logger.info('ticket not found');
							var userMessage = userMsg.noticket;
							var msgJson = msg.successMessage("GetSOP", "1",
									userMessage, userMessage, {});
							return res.status(400).send(msgJson);
						} else {

							logger.info('sop found and need to update==============');
							sop.SOPName = obj.SOPs.SOPName;
							sop.SOPShortDesc = obj.SOPs.SOPShortDesc;
							sop.SOPPurpose = obj.SOPs.SOPPurpose;
							sop.account = obj.SOPs.account;
							sop.application = obj.SOPs.application;
							var sopOldActiveMode = sop.activeMode;
							sop.activeMode =obj.SOPs.activeMode;
							// alert : [],
							sop.ticket = obj.SOPs.ticket;
							sop.AutomationInput = obj.SOPs.AutomationInput;
							sop.AutomationProcess = obj.SOPs.AutomationProcess;
							sop.operationShortDesc = obj.SOPs.operationShortDesc;
							sop.AutomationProvider = obj.SOPs.AutomationProvider;
							var SOPAutomationKey = generateSOPAutomationKey(obj.SOPs);
							sop.SOPAutomationKey = SOPAutomationKey;
							sop.Classification = obj.SOPs.Classification;
							sop.ExpectedInput = obj.SOPs.ExpectedInput;
							sop.ExpectedOutput = obj.SOPs.ExpectedOutput;
							sop.ExecuteAutomation = obj.SOPs.ExecuteAutomation;
							sop.TaskMasters = obj.SOPs.TaskMasters;
							sop.SOPCognitiveInfos = obj.SOPs.SOPCognitiveInfos;
							sop.updateTimestamp = new Date().toISOString();
							sop.updatedByUserId = obj.SOPs.updatedByUserId;
							sop.updateComment = obj.SOPs.updateComment;
							sop.trashed = 'n';

							sop.save(function(err) {
										if (err) {
											logger.info('Error OCCUREDDDDDDDDDDDD +++++++++++++++++++ >');
											logger.info(err);
											var errorCode = errorcodes["DBError"];
											res.status(errorCode.statusCode).json({
											operationName : req.originalUrl,
											serviceCode : errorCode.serviceCode,
											internalMessage : err,
											userMessage : errorCode.userMessage,
											response : {}
										});
												return;

										} else {
											logger.info("Updating SOP....sopType=>["+obj.SOPs.SOPType+"]");
											if(obj.SOPs.SOPType=="S")
												{
													var msgJson = msg.successMessage("UpdateSOP","0","Ticket updated successfully","Ticket updated successfully",{});
													//Check if the SOP is being activated
													//If yes then process the link tickets as well
													logger.info("Updating SOP....sopOldActiveMode=>["+sopOldActiveMode+"] currentMode=>["+obj.SOPs.activeMode+"]");
													if(sopOldActiveMode=='n' && obj.SOPs.activeMode=='y'){
														logger.info("Calling processSOPLinkedTickets");
														if(obj.SOPs.ticket.constructor === Array){
															logger.info("Calling processSOPLinkedTickets as Array");
															exports.processSOPLinkedTickets(obj.SOPs.ticket);
														} else {
															var tempArr = [];
															tempArr.push(obj.SOPs.ticket);
															logger.info("Calling processSOPLinkedTickets as temporary Array");
															exports.processSOPLinkedTickets(tempArr);
														}
													}

													return res.status(200).send(msgJson);
												}
											else if(obj.SOPs.SOPType=="C")
												{
													logger.info('Sop part also updated fine -------------------');
													//UpdateChoreograph(req,res,obj.choreographEvent)

													var choreographEventObj=obj.choreographEvent;
													logger.info('Corograph area ============');
													logger.info(JSON.stringify(choreographEventObj));
													//choreographEventObj["SOPID"]=sopResult._id;
													//choreographEventObj["SOPName"]=sopResult.SOPName;
													logger.info('Ready to hit workflow====================');
													var client = new WorkflowManager();
													client.createWorkflow(choreographEventObj, function(err, result) {
														if (err) {
																logger.info('Error in workFlow client----- >'+err);
																var errorCode = errorcodes["DBError"];
																res.status(errorCode.statusCode).json({
																	operationName : req.originalUrl,
																	serviceCode : errorCode.serviceCode,
																	internalMessage : err.message,
																	userMessage : errorCode.userMessage,
																	response : {}
																});
																return;
														} else {
															//res.status(200).send(result);
															//CreateChoreograph(req,res,choreographEventObj);
															UpdateChoreograph(req,res,obj.choreographEvent)
														}
													});

												}
										}
									});

						}

					});

}

/**
 * Retrieves tickets info from Ticket Audit Logs using ticketKey
 */
exports.fetchTicketInfoNProcess = function(ticketKey,callback) {
	logger.info("===Inside fetchTicketInfoNProcess====");
	logger.info("::ticketKey::"+ticketKey);
	TicketAuditLogModel.find({
		"ticketKey" : ticketKey.trim(),
		"errorType" : "SOPNotDefined"
	}).sort({
		updateTimestamp : -1
	}).lean().exec(
			function(err, result) {
				if (err) {
					logger.error(err);
					callback(err,null);

				} else {
					logger.info("Result::"+result);
					var ex_ticketArr = [];
					if(result.length>0) {
						for(var index=0 ; index < result.length ; index++){
							var ex_ticket = result[index];//Need to setup the structure
							logger.info(" To be processed ticketnumber ::"+ex_ticket.ticketNumber);
							ex_ticketArr.push(ex_ticket);
						}

					}
					callback(null,ex_ticketArr);
				}
			});


}
/**
 * Process the tickets linked with the SOP and change their state from 'SOPUnDefined' as per the activity status.
 *
 * Tickets that are not processed due to unavailability of appropriate active SOPS
 * need to be processed once appropriate SOP is created and activated for the same.
 * This method iterates through all the tickets linked with the SOP and and push them into the processing queue
 * such that they can be addressed appropriately by the automation engine.
 *
 */
exports.processSOPLinkedTickets = function(linkedTickets) {
	logger.info("===Inside processSOPLinkedTickets===="+linkedTickets);
	if(linkedTickets!=null) {
		logger.info("::linkedTickets.length::"+linkedTickets.length);
		for(var index=0; index < linkedTickets.length; index++) {
			var ticketKey = linkedTickets[index];
			logger.info("...Processing TicketKey ::"+ticketKey);
			exports.fetchTicketInfoNProcess(ticketKey,function(err,ex_ticketArr){
				if(err){
					//Log Error
					logger.error("Error fetching ticket info -"+err);
				} else {
					//Invoke ticket processing for the given tickets
					for(var curIndex=0; curIndex < ex_ticketArr.length ; curIndex++){
						var ex_ticket = ex_ticketArr[curIndex];
						ServiceMonitoringAgent.processTicketRequest(ex_ticket,function(err,log_id){
							if(err){
								logger.error("Processing of ticket with number "+ex_ticket.ticketNumber+" Failed with Error -"+err);
							} else {
								logger.info ("Processing of ticket with number "+ex_ticket.ticketNumber+" completed auccessfully");
							}
						});
					}
				}
			});

		}
	}

}

/**
 * url :/rest/v1/sopmeta/UpdateSOP Description :Update the SOP part
 * Method : PUT
 */
exports.updateSOPContent = function(req, res) {
	sop_updated = req.body;
	logger.info(JSON.stringify(sop_updated));
	logger.info("SOP ID: " + sop_updated._id);
	SOPModel
	.findById(
			sop_updated._id,
			function(err, sop) {
				if (err) {
					var errorCode = errorcodes["DBError"];
					res.status(errorCode.statusCode).json({
						operationName : req.originalUrl,
						serviceCode : errorCode.serviceCode,
						internalMessage : err,
						userMessage : errorCode.userMessage,
						response : {}
					});
					return;
				} else if (!sop) {
					logger.info('sop not found');
					var userMessage = userMsg.nosop;
					var msgJson = msg.successMessage("GetSOP", "1",
							userMessage, userMessage, {});
					return res.status(400).send(msgJson);
				} else {

					logger
							.info('sop found and need to update==============');
					sop.AutomationProcess = sop_updated.AutomationProcess;
//					sop.SOPName = obj.SOPs.SOPName;
//					sop.SOPShortDesc = obj.SOPs.SOPShortDesc;
//					sop.SOPPurpose = obj.SOPs.SOPPurpose;
//					sop.account = obj.SOPs.account;
//					sop.application = obj.SOPs.application;
//					sop.activeMode =obj.SOPs.activeMode;
//					// alert : [],
//					sop.ticket = obj.SOPs.ticket;
					sop.AutomationInput = sop_updated.AutomationInput;
					sop.AutomationOutput = sop_updated.AutomationOutput;
					sop.workflowGraph = sop_updated.workflowGraph;
//					sop.AutomationProcess = obj.SOPs.AutomationProcess;
//					sop.operationShortDesc = obj.SOPs.operationShortDesc;
//					sop.AutomationProvider = obj.SOPs.AutomationProvider;
//					var SOPAutomationKey = generateSOPAutomationKey(obj.SOPs);
//					sop.SOPAutomationKey = SOPAutomationKey;
//					sop.Classification = obj.SOPs.Classification;
//					sop.ExpectedInput = obj.SOPs.ExpectedInput;
//					sop.ExpectedOutput = obj.SOPs.ExpectedOutput;
//					sop.ExecuteAutomation = obj.SOPs.ExecuteAutomation;
//					sop.TaskMasters = obj.SOPs.TaskMasters;
//					sop.SOPCognitiveInfos = obj.SOPs.SOPCognitiveInfos;
//					sop.updateTimestamp = new Date().toISOString();
//					sop.updatedByUserId = obj.SOPs.updatedByUserId;
//					sop.updateComment = obj.SOPs.updateComment;
//					sop.trashed = 'n';

					sop
							.save(function(err) {
								if (err) {
									logger
											.info('Error OCCUREDDDDDDDDDDDD +++++++++++++++++++ >');
									logger.info(err);
									var errorCode = errorcodes["DBError"];
									res
											.status(
													errorCode.statusCode)
											.json(
													{
														operationName : req.originalUrl,
														serviceCode : errorCode.serviceCode,
														internalMessage : err,
														userMessage : errorCode.userMessage,
														response : {}
													});
									return;

								} else {
									var msgJson = msg
											.successMessage(
													"UpdateSOP",
													"0",
													"SOP updated successfully",
													"SOP updated successfully",
													{});
									return res.status(200)
											.send(msgJson);
								}
							});

				}

			});

}

/**
 * url :/rest/v1/sopmeta/GetEventList Description :Populate the ticket list
 * based on application ids. Method : GET
 */
exports.GetAllTicketList = function(req, res) {
	TicketModel.find().exec(
			function(err, ticket) {
				if (err) {
					var errorCode = errorcodes["DBError"];
					res.status(errorCode.statusCode).json({
						operationName : req.originalUrl,
						serviceCode : errorCode.serviceCode,
						internalMessage : err,
						userMessage : errorCode.userMessage,
						response : {}
					});
					return;
				} else {
					var msgJson = msg
							.successMessage("GetTicketList", "200",
									"List of  all Ticket",
									"List of all ticket", ticket);
					return res.status(200).send(msgJson);
				}
			});

}

/**
 * url :/rest/v1/sopmeta/GetEventList Description :Populate the ticket list
 * based on application ids. Method : GET
 */
exports.GetEventList = function(req, res) {

	var eventType = req.params.eventtype;
	var applicationId = req.query.application;
	if (eventType == "ticket") {
		TicketModel.find({
			"application" : applicationId,
			"trashed" : 'n'
		}).exec(
				function(err, ticket) {
					if (err) {
						var errorCode = errorcodes["DBError"];
						res.status(errorCode.statusCode).json({
							operationName : req.originalUrl,
							serviceCode : errorCode.serviceCode,
							internalMessage : err,
							userMessage : errorCode.userMessage,
							response : {}
						});
						return;

					} else {
						var msgJson = msg.successMessage("GetTicketList",
								"200", "List of  all Ticket",
								"List of all ticket", ticket);
						return res.status(200).send(msgJson);
					}
				});
	} else {
		return res.status(400).send('Area for alert task......');
	}
}

/**
 * url :/rest/v1/sopmeta/GetTicketListFromAuditLog Description :Retrive the
 * ticket list from TicketAuditLog. Method : GET
 */
exports.GetTicketListFromAuditLog = function(req, res) {

	var applicationName = req.query.applicationName;
	var accountName = req.query.accountName;

	/*
	 * console.log('Account Name =========== > '+accountName);
	 * console.log('Application Name =========== > '+applicationName);
	 */

	TicketAuditLogModel
			.find({
				"account" : accountName.trim()
			})
			.exec(
					function(err, result) {
						if (err) {

							// logger.info('My Error :--- '+err);
							var errorCode = errorcodes["DBError"];
							res.status(errorCode.statusCode).json({
								operationName : req.originalUrl,
								serviceCode : errorCode.serviceCode,
								internalMessage : err,
								userMessage : errorCode.userMessage,
								response : {}
							});
							return;
						} else if (result.length == 0) {
							// logger.info('audit ticket not
							// found===============');
							var userMessage = userMsg.noticket;
							var msgJson = msg.successMessage(
									"getTicketListFromTicketAuditLog", "1",
									userMessage, userMessage, {});
							return res.status(400).send(msgJson);
						} else {

							console
									.log('Arijit checkDuplicateAutomationSOP ==================='
											+ result.length);

							var jsonArray = [];
							var resultArray = [];
							for (j = 0; j < result.length; j++) {
								var ticketJson = {};
								ticketJson["ticketKey"] = result[j].ticketKey;
								if (result[j].subject != '') {
									ticketJson["subject"] = result[j].subject;
								} else {
									ticketJson["subject"] = "-";
								}

								jsonArray.push(ticketJson);
							}

							for (var j = 0; j < jsonArray.length; j++) {

								var a = CheckExistance(resultArray,
										'ticketKey', jsonArray[j].ticketKey);
								if (a == -1) {
									resultArray.push(jsonArray[j]);
								}
							}

							getUnprocessSOPTicket(req, res, resultArray);
							/*
							 * var
							 * msgJson=msg.successMessage("GetTicketListFromAuditLog","200","List
							 * of all Ticket in Audit Log","List of all ticket
							 * in Audit Log",jsonArray); return
							 * res.status(200).send(msgJson);
							 */
						}
					});

}

/**
 * url :/rest/v1/sopmeta/GetTicketFromAuditLog Description :Retrive the ticket
 * from TicketAuditLog. Method : GET
 */
exports.GetTicketFromAuditLog = function(req, res) {

	var ticketKey = req.query.ticketKey;
	var applicationName = req.query.applicationName;
	var accountName = req.query.accountName;

	TicketAuditLogModel.findOne({
		"ticketKey" : ticketKey.trim(),
		"account" : accountName.trim()
	}).sort({
		updateTimestamp : -1
	}).lean().exec(
			function(err, result) {
				if (err) {

					var errorCode = errorcodes["DBError"];
					res.status(errorCode.statusCode).json({
						operationName : req.originalUrl,
						serviceCode : errorCode.serviceCode,
						internalMessage : err,
						userMessage : errorCode.userMessage,
						response : {}
					});
					return;

				} else {
					var msgJson = msg.successMessage("GetTicketFromAuditLog",
							"200", "Ticket Audit log details",
							"Ticket Audit log details", result);
					return res.status(200).send(msgJson);
				}
			});
}

/**
 * url :/rest/v1/sopmeta/RemoveSOP Description :Delete specific record for
 * ticket/sop . Method : DELETE
 */
exports.RemoveSOP = function(req, res) {

	TicketModel.findById(req.query.Id, function(err, ticket) {
		if (err) {
			var errorCode = errorcodes["DBError"];
			res.status(errorCode.statusCode).json({
				operationName : req.originalUrl,
				serviceCode : errorCode.serviceCode,
				internalMessage : err.message,
				userMessage : errorCode.userMessage,
				response : {}
			});
			return;
		} else if (!ticket) {
			var userMessage = userMsg.noticket;
			var msgJson = msg.successMessage("RemoveSOP", "1", userMessage,
					userMessage, {});
			return res.status(400).send(msgJson);
		} else {
			ticket.trashed = 'y';
			ticket.updateTimestamp = new Date().toISOString();
			ticket.save(function(err) {
				if (err) {
					var errorCode = errorcodes["DBError"];
					res.status(errorCode.statusCode).json({
						operationName : req.originalUrl,
						serviceCode : errorCode.serviceCode,
						internalMessage : err.message,
						userMessage : errorCode.userMessage,
						response : {}
					});
					return;
				} else {
					var msgJson = msg.successMessage("RemoveSOP", "0",
							"SOP deleted successfully",
							"SOP deleted successfully", {});
					return res.status(200).send(msgJson);
				}
			});
		}
	});
}

/**
 *
 * @param req
 * @param res
 * @param auditTicketArr-Array
 *            list contain ticketKey value from audit log
 */
function getUnprocessSOPTicket(req, res, auditTicketArr) {

	var resultArr = [];
	// var processedTicketList=[];
	TicketModel.find().exec(
			function(err, ticket) {
				if (err) {
					var errorCode = errorcodes["DBError"];
					res.status(errorCode.statusCode).json({
						operationName : req.originalUrl,
						serviceCode : errorCode.serviceCode,
						internalMessage : err.message,
						userMessage : errorCode.userMessage,
						response : {}
					});
					return;
				} else {

					console.log('Ticket from Audit Log ===========> ');
					console.log(auditTicketArr);
					for (var j = 0; j < auditTicketArr.length; j++) {

						var a = CheckExistance(ticket, 'ticketKey',
								auditTicketArr[j].ticketKey);
						console.log('Value of j ===== > ' + j);
						console.log('auditTicketArr value======= >'
								+ auditTicketArr[j].ticketkey);
						console.log('value of a ----  > ' + a);
						if (a == -1) {
							resultArr.push(auditTicketArr[j]);
						}
					}

					var msgJson = msg.successMessage(
							"GetTicketListFromAuditLog", "200",
							"List of  all Ticket in Audit Log",
							"List of all ticket in Audit Log", resultArr);
					return res.status(200).send(msgJson);

					// return res.status(200).send(ticket);

				}
			});

}

function CheckExistance(arr, key, value) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i][key] === value) {
			return (i);
		}
	}
	return (-1);
}

// *********************Search By Text For Ticket
// **************************************

/**
 * url :/rest/v1/sopmeta/searchText/:type Description : Search by wild
 * characters for finding proper ticket. Method : GET
 */
exports.searchText = function(req, res) {

	//var type = req.params.type;
	// var event=req.params.event;

	var searchCriteria = (req.query.searchCriteria).trim();
	logger.info('Search Criteria=====>' + searchCriteria);
	var regJson;
	var finalSearchResult = {
			"ticket":[],
			"sops":[]
	};
	var arrList = [];

	if (searchCriteria.charAt(0) == '"' && searchCriteria.charAt(searchCriteria.length - 1) == '"') {
		var tempcriteria = (searchCriteria.substring(1,searchCriteria.length - 1)).trim();
		arrList.push(tempcriteria);
		logger.info('11111111111111111111111111111111111111');
		logger.info(arrList);
		search(req, res, arrList, finalSearchResult, 0,"true");
	} else if (searchCriteria.charAt(0) == '*'
			&& searchCriteria.charAt(searchCriteria.length - 1) == '*') {
		var tempcriteria = (searchCriteria.substring(1,
				searchCriteria.length - 1)).trim();
		arrList = tempcriteria.split(" ");
		logger.info('222222222222222222222222222');
		search(req, res, arrList, finalSearchResult, 0,"true");
	} else {
		arrList = searchCriteria.split(" ");
		logger.info('3333333333333333333');
		search(req, res, arrList, finalSearchResult, 0,"false");
	}
}

/**
 * Description :If search by text is with * at start and end,calling from search
 * by text service.
 */
function search(req, res, arrList, obj, i,filter) {

	if (i < arrList.length) {
		if(filter=="true")
		{
			var regFiled = new RegExp('.*' + arrList[i] + '.*');
			regJson = {
			$regex : regFiled
			};
		}
		else{
			regJson = (arrList[i]).trim();
		}


			var searchTicket = [ {
				"requester" : regJson
			}, {
				"assignee" : regJson
			}, {
				"asignmentGroup" : regJson
			}, {
				"type" : regJson
			}, {
				"priority" : regJson
			}, {
				"subject" : regJson
			}, {
				"asignmentGroup" : regJson
			}, {
				"status" : regJson
			}, {
				"account" : regJson
			}, {
				"application" : regJson
			}, {
				"impact" : regJson
			}, {
				"cause" : regJson
			}, {
				"urgency" : regJson
			}, {
				"subject" : regJson
			}, {
				"category" : regJson
			}, {
				"ticketKey" : regJson
			} ];

			TicketModel.find({$or : searchTicket }).lean().exec(function(err, result) {
								if (err) {

									logger.info('ticket search error ------- >');
									logger.info(err);
									var errorCode = errorcodes["DBError"];
									res.status(errorCode.statusCode).json({
										operationName : req.originalUrl,
										serviceCode : errorCode.serviceCode,
										internalMessage : err.message,
										userMessage : errorCode.userMessage,
										response : {}
									});
									return;
								} else {
									for (j = 0; j < result.length; j++) {
										var newObj = {};
										logger.info('REsult of seach shown ============================>');
										logger.info(result[j]);
										newObj["id"] = result[j]._id;
										newObj["ticketKey"] = result[j].ticketKey;
										newObj["subject"] = result[j].subject;
										newObj["account"] = result[j].account;
										newObj["application"] = result[j].application;
										obj["ticket"].push(newObj);
									}

									searchSOP(req, res, arrList, obj, i, regJson,filter);
									/*i = i + 1;
									search(req, res, arrList, obj, i, type);*/
								}
							});
		//} else if (type == 'sop') {




		}
		else {
			//res.status(400).send('Check type...This is alert section');
			var msgJson = msg.successMessage("searchByText", "0",
					"Displaying the searching details....",
					"Displaying the searching details....", obj);
			return res.status(200).send(msgJson);
		}

	} /*else {
		var msgJson = msg.successMessage("searchByText", "0",
				"Displaying the searching details....",
				"Displaying the searching details....", obj);
		return res.status(200).send(msgJson);
	}

}*/


function searchSOP(req, res, arrList, obj, i, regJson,filter)
{
	var searchSOP = [ {
		"SOPName" : regJson
	}, {
		"SOPShortDesc" : regJson
	}, {
		"SOPPurpose" : regJson
	}, {
		"AutomationProcess" : regJson
	}, {
		"Classification" : regJson
	}, {
		"TaskMasters.TaskName" : regJson
	}, {
		"TaskMasters.TaskOwner" : regJson
	}, {
		"TaskMasters.TaskExecutionType" : regJson
	}, {
		"TaskMasters.TaskExecutionOrder" : regJson
	} ];

	SOPModel.find({$or : searchSOP}).lean().exec(function(err, result) {
		if (err) {
				var errorCode = errorcodes["DBError"];
				res.status(errorCode.statusCode).json({
					operationName : req.originalUrl,
					serviceCode : errorCode.serviceCode,
					internalMessage : err.message,
					userMessage : errorCode.userMessage,
					response : {}
				});
				return;
				} else {
					for (j = 0; j < result.length; j++) {
						var newObj = {};
						logger
								.info('REsult of seach shown ============================>');
						logger.info(result[j]);
						newObj["id"] = result[j]._id;
						newObj["SOPName"] = result[j].SOPName;
						newObj["SOPShortDesc"] = result[j].subject;
						newObj["account"] = result[j].account;
						newObj["application"] = result[j].application;
						newObj["ticketKey"]= result[j].ticket[0];
						//newObj["alertName"]= result[j].alert[0];
						obj["sops"].push(newObj);
					}
					i = i + 1;
					search(req, res, arrList, obj, i,filter);
				}
			});
}

/**
 * url :/rest/v1/sopmeta/getEventFromSOP/:type Description : Search
 * corrosponding event from a sop id. Method : GET
 */
exports.getEventFromSOP = function(req, res) {

	var type = req.params.type;
	if (type == 'ticket') {
		SOPModel.findById(req.query.Id, function(err, sop) {
			if (err) {
				var errorCode = errorcodes["DBError"];
				res.status(errorCode.statusCode).json({
					operationName : req.originalUrl,
					serviceCode : errorCode.serviceCode,
					internalMessage : err.message,
					userMessage : errorCode.userMessage,
					response : {}
				});
				return;
			} else {

				TicketModel.findOne({
					"ticketKey" : sop.ticket[0]
				}).exec(
						function(err, ticketObj) {
							if (err) {
								var errorCode = errorcodes["DBError"];
								res.status(errorCode.statusCode).json({
									operationName : req.originalUrl,
									serviceCode : errorCode.serviceCode,
									internalMessage : err.message,
									userMessage : errorCode.userMessage,
									response : {}
								});
								return;
							} else {
								var returnObj = {};
								returnObj["Tickets"] = ticketObj;
								returnObj["SOPs"] = sop;
								var msgJson = msg.successMessage("GetSOP", "0",
										"Ticket  details", "Ticket details",
										returnObj);
								return res.status(200).send(msgJson);
							}
						});

			}
		});
	} else {
		res.status(400).send('Check type...This is alert section');
	}

}

/**
 * url :/rest/v1/sopmeta/GetSOP/:sopid
 * Description :Populate a specific SOP record based on _id of the SOP
 * Method : GET
 */
exports.GetSOP = function (req, res){
	var sopid = req.params.sopid;
	logger.info("SOP id ="+sopid);
	SOPModel.findOne({"_id":sopid}).exec(function (err, sop) {
	    if (err) {
	    	//throw new Error('DBError');
	    	//return res.status(500).send(err);
	    	logger.info("Error in GetSOP========== > "+err);
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    }
	    else if(!sop)
	    	{
	    		logger.info('No sop id found in GETSOP service in sop ticket index page');
		    	var errorCode=errorcodes["SOPIdInvalid"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
		    	return;
	    	}
	    else {
	          var msgJson=msg.successMessage("GetSOP","0","Fetching SOP Details","Fetching SOP Details",sop);
	          return res.status(200).send(msgJson);
	    }
	  });

}


function UpdateChoreograph(req,res,choreographObj){


	logger.info('Comes to the choreograph update section=============>');
	logger.info(JSON.stringify(choreographObj));

	ChoreographModel.findById(choreographObj._id, function (err, choreoevent) {

		if(err)
			{
				logger.info('Error in choreo event update ...'+err);
				//res.status(500).send(err);
				var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else if(!choreoevent)
			{
				res.status(400).send('No choreograph event Available');
			}
		else
			{
				/*choreoevent.SOPID=choreographObj.SOPID;
				choreoevent.SOPName=choreographObj.SOPName;*/
				choreoevent.start_sop_id=choreographObj.start_sop_id;
				choreoevent.start_sop_name=choreographObj.start_sop_name;
				choreoevent.paths=choreographObj.paths;

				choreoevent.save(function (err) {
				      if (err) {
				    	  /*logger.info("My Error "+err);
					    	//return res.status(500).send(err);
				    	  throw new Error('DBError');*/
				    	  logger.info('My error ===========>1');
				    	  logger.info(err);
				    	  var errorCode=errorcodes["DBError"];
					    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
					    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
					    	return;
				    	  //res.status(500).send(err);
				      } else {

				    	  logger.info('My success ========================>');
				          var msgJson=msg.successMessage("UpdateSop","0","UpdateSop details updated successfully","UpdateSop details updated successfully",{});
				    	  return res.status(200).send(msgJson);
				    	  //return res.status(200).send("SOP Update Successfully");
				      }
				    });
			}


	  });

}
