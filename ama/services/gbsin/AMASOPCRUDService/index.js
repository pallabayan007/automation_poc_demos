

var mongodb_uri;
var logger = getLogger("DB");
var appProperty= require('../../../../config/app_config.json');
var mongoose = require('mongoose');
var async = require("async");

/*var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var mongoose = require('mongoose');
if (process.env.VCAP_SERVICES) {
		mongodb_uri = appProperty['deployment-specific-properties']['CLOUD'].credentials.uri;
		db = mongoose.createConnection(mongodb_uri);
		logger.info("using bluemix database");
}
else {
	mongodb_uri = appProperty['deployment-specific-properties']['ON_PREM'].dbConnectionURL;
	logger.info("Connected to Local Mongo DB")
}
logger.info("DB:" + mongodb_uri);*/






// ----------------------- Start of (added 6 may 2015) -----------------
var express = require('express');
var app = express();

var http = require("http");
var models = require("../../../../models");
var msg = require('../../../../config/message.js');
var errorcodes = require('../../../../config/errorcodes.json');
//var globalUrl = require('../../../../config/SOPConfig.json');
var userMsg = require('../../../../config/user_message.json');

var automationAdapter = require('../../../../config/automation_adapter_config.json');

//var cors = require('cors');
var retJson={};

//app.use(cors());
app.use(function(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	  next();
});



var AccountsModel = models.Account;
var ApplicationsModel = models.Application;
var AlertModel = models.Alert;
var ClientsModel=models.Client;
var UsersAccessModel=models.UserAccess;
var JOBEventsModel=models.JOBEvent;
var SavedSearchModel=models.SavedSearch;
var AlertAuditLog = models.AlertAuditLog;
var ChoreographModel=models.Choreograph;
var SOPModel = models.SOP;

//Added for re-processing of the alerts that are previously marked as Unprocessed for InActive SOP
var ServiceMonitoringAgent = require('../../../../ama/services/crlcn/AMAServiceMonitoringAgent');

/*var UsersModel=models.User;
var RolesModel=models.Role;
var CapabilitiesModel=models.Capability;*/


//var streamifier = require('streamifier');
//var Grid = require('gridfs-stream');
/*mongoose.connect(mongodb_uri);
var gfs = new Grid(mongoose.connection.db, mongoose.mongo);*/

// account APIs
// app.get('/rest/v1/sopmeta/GetAccountList', function (req, res){

/**
 * url : /rest/v1/sopmeta/GetAccountList
 * Description : Populate the list of account in descending order.
 * Method : GET
 */
exports.GetAccountList = function (req, res){
  
	AccountsModel.find({trashed: 'n'}).sort( { updateTimestamp: -1 } ).exec(function (err,accounts) {
	      if (err) {       
	    	  /*logger.info("My Error "+err);
	          return res.status(500).send(err);*/
	    	  //throw new Error('DBError');
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
	      } else {
	          var msgJson=msg.successMessage("GetAccountList","0","List of  accounts  details","List of  accounts details",accounts);
	    	  return res.status(200).send(msgJson);
	    	  //return res.send(accounts);
	      }
	    });
}


/**
 * url :/rest/v1/sopmeta/GetAccount
 * Description : Populate the result of a specific account based on _id value.
 * Method : GET
 */
exports.GetAccount = function (req, res){
	var accountId = req.query.accountId;
	var query = AccountsModel.findOne({"_id":accountId});
	
	  return query.exec(function (err, accounts) {
	    if (err) {	    	
	      //return res.send(accounts);
	    	// return res.send{sopId: alerts.SOPID, sopName: alerts.SOPName};
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    } else {
	      //return logger.debug(err);
	    	var msgJson=msg.successMessage("GetAccount","0","Accounts  details","Accounts details",accounts);
	    	  return res.status(200).send(msgJson);
	    }
	  });
	}


/**
 * url :/rest/v1/sopmeta/CreateAccount
 * Description : Create Account Details.
 * Method : POST
 */
exports.CreateAccount = function (req, res){
	AccountsModel.findOne({"accountName":(req.body.accountName).trim(),"clientName":(req.body.clientName).trim()}).lean().exec(function (err, accnt) {
		if(err)
			{
				//res.status(500).send(err);
				var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else if(!accnt)
			{
			var account;
		  	/*logger.info("accountName="+req.body.accountName);
		  	logger.info("accountCompany="+req.body.accountOwningCompany);
		  	logger.info("accountUSER="+req.body.WorkflowAutomationUserId);*/
		  	var password=req.body.WorkflowAutomationPassword;
		  	//logger.info("Pwd="+password);
		  	var encPassword=encryptPassword(password);
		  	
		  	var userid=req.body.Id;
		  	var userType=req.body.type;
		  	account = new AccountsModel({
			//_id: mongoose.Types.ObjectId(),
			accountName: (req.body.accountName).trim(),
			accountOwningCompany: req.body.accountOwningCompany,
			updateTimestamp:new Date().toISOString(),
			WorkflowAutomationUserId:req.body.WorkflowAutomationUserId,
			WorkflowAutomationPassword:encPassword,
			clientName:(req.body.clientName).trim(),
			trashed:'n',
		    });
		  account.save(function (err) {
		    if (!err) {
		    	/*logger.info('Account Saved ==============================>');
		      logger.info(account);
		      logger.info('USer type =======> '+userType);
		      logger.info('USer ID =======> '+userid);*/

		      UsersAccessModel.find({type:'SuperAdmin',active:'Y',trashed:'n'}).lean().exec(function (err, superuserDetails) {
		      	if(err)
		      	{
		      		var errorCode=errorcodes["DBError"];
		    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    		internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    		return;
		      	}
		      	else
		      	{
		      		accountAssociation(account,superuserDetails,req,res,0);
		      	}
		      });

		    } else {
		    	//return res.status(500).send(err);
		    	var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
		    }
		  });
		  
			}
		else
			{
				var userMessage=userMsg.sopDuplicateAccount;
				var msgJson=msg.successMessage("CreateAccount","1",userMessage,userMessage,account);
		    	  return res.status(400).send(msgJson);
				//return res.status(400).send(userMessage);
			}
	});
}

/** 
 * Description : This recursive function is used to associate the account details with all existing super admin users.
 * 				This function is calling from CreateAccount service.
 * Parameter :	(Newly created account json,Array list of super admin records,req,res,increment variable)
 */

function accountAssociation(account,superuserDetails,req,res,i)
{
	if(i<superuserDetails.length)
	{
							//logger.info('USer Details ++++++++++++++++++++>   '+i);
		    		    	//logger.info(superuserDetails[i]);
		    		    	var users=superuserDetails[i];
		    		    	var userAccountLength=users.account.length;
		    		    	//logger.info('Length of array in useraccess json ------------------->'+userAccountLength);
		    		    	
							UsersAccessModel.findOne({userID:users.userID}).exec(function (err, result) {
		      				if(err)
					      	{
					      		var errorCode=errorcodes["DBError"];
					    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
					    		internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
					    		return;
					      	}
					      	else
					      	{
					      		var newAccountJson={};
		    		    		newAccountJson.accountId=account._id;
		    		    		newAccountJson.applicationIdList=[];
		    		    		result.account.push(newAccountJson);
		    		    		logger.info('New user structure ===========================================?');
		    		    		logger.info(result);
					      		result.save(function (err) {
		    				      if (err) {
		    				    	  /*logger.info("My Error "+err);
		    					    	//return res.status(500).send(err);
		    				    	  throw new Error('DBError');*/
		    				    	  
		    				    	  var errorCode=errorcodes["DBError"];
		    					    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    					    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    					    	return;
		    				      } else {
		    				    	  
		    				    	  accountAssociation(account,superuserDetails,req,res,i+1);
		    				      }
		    				    });
					      	}
		      			});
		    		    	
	}
	else
	{
		var userMessage=userMsg.sopNewAccountAdded;
			          var msgJson=msg.successMessage("CreateAccount","0",userMessage,userMessage,account);
			    	  return res.status(200).send(msgJson);
	}
	
}



/**
 * url :/rest/v1/sopmeta/UpdateAccount
 * Description :Update the specific account record.
 * Method : PUT
 */
exports.UpdateAccount = function (req, res){
	
	return AccountsModel.findById(req.query.accountId, function (err, account) {
		var oldtimestamp=req.body.updateTimestamp;
		 logger.info('request body ------------------------'+oldtimestamp);
		 var newtimestamp=account.updateTimestamp.toISOString();
		 logger.info('user fetch ==========================='+newtimestamp);
		 logger.info('current Date '+new Date().toISOString());
		 
		var AccName=(req.body.accountName).trim();
		var AccCompany=req.body.accountOwningCompany;
		var AccUser=req.body.WorkflowAutomationUserId;
		var AccPin=req.body.WorkflowAutomationPassword;
		var updateTimestamp=new Date().toISOString();
		var updatedByUserId=req.body.updatedByUserId;
		var updateComment=req.body.updateComment;
		var clientName=(req.body.clientName).trim();
		
		logger.info("AccNAme"+AccName);
		logger.info("AccCom"+AccCompany);
		logger.info("AccUser"+AccUser);
		logger.info("AccPin"+AccPin);
		logger.info("ClientName"+clientName);
		 if(err)
		 	{
			  /*logger.info("My Error "+err);
	          return res.status(500).send(err);*/
			 var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
		 	}
		 else if(!account)
		 	{
			 /*logger.info("Account information not found");
	          return res.status(404).send("Account information not found");*/
			 var errorCode=errorcodes["AccountIdInvalid"];
	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    		return;
		 	}
		 else
		 {
			 logger.info('Account Json');
			 logger.info(account);
			 /* 
			  * This checking is blocked in sprint 6 as discussed .
			  * Need discussion over this checking further
			  * */
			 /*if(account.WorkflowAutomationUserId==AccUser)
				 {*/
				 	logger.info("User Match..");
				 	var encPassword=account.WorkflowAutomationPassword;
				 	//return res.send(account);
				 	var bcrypt = require('bcrypt-nodejs');
				 	bcrypt.compare(AccPin,encPassword, function(err, match){
				          if(err) 
				          {
				 			 logger.info("My Error in bcrypt "+err);
				 	          //return res.status(500).send(err);
				 			var errorCode=errorcodes["DBError"];
					    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
					    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
					    	return;
				 		 	}
				          else if(match){
				        	  if(oldtimestamp==newtimestamp)
				 			 {
				        		  account.accountName = AccName;
					    		  account.accountOwningCompany = AccCompany;
					    		  account.clientName=clientName;
					    		  account.updateTimestamp=updateTimestamp; 
					    		  account.updatedByUserId=updatedByUserId;
					    		  account.updateComment=updateComment;
					    		  account.trashed='n';
					    		  //account.AutomationProvider=AutomationProvider;
					    		  return account.save(function (err) {
					    		      if (!err) {
					    		        //logger.info("updated account");
					    		        //return res.status(200).send(account);
					    		    	  var msgJson=msg.successMessage("UpdateAccount","0","Account updated successfully","Account updated successfully",account);
							 	    	  return res.status(200).send(msgJson);
					    		      } else {
					    		    	  logger.info("My Error during update "+err);
							 	          //return res.status(500).send(err);
					    		    	  var errorCode=errorcodes["DBError"];
					    			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
					    			    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
					    			    	return;
					    		      }
					    		      
					    		    });
					        	  logger.info("Passowrd Match Success");
				 			 }
				 		 else
				 			 {
				 			 var userMessage=userMsg.sopUpdateAccountConflict;
				 			  var obj={};
				 			  var msgJson=msg.successMessage("UpdateAccount","1",userMessage,userMessage,obj);
				 	    	  return res.status(400).send(msgJson);
				 			 }
				          }
				          else{
				        	  logger.info('Password MisMatch');
				        	  var msgJson=msg.successMessage("UpdateAccount","0","Password Mismatch","Password Mismatch",{});
				 	    	  return res.status(400).send(msgJson);
				        	  //return res.status(400).send("Password Mismatch");
				          }
				        });
				/* }
			 else
				 {
				 	logger.info("Credential not matched");
				 	return res.status(400).send("Credential not matched");
				 }*/
			  
		 	
		 }
	  });

	
	}


exports.getAlertListFromAlertAuditLog = function (req, res){
	//var accountId = req.query.accountId;
	//var applicationId = req.query.applicationId;
	logger.info("get call--->>>>");
	//var params = req.body;
	 var obj=[];
	 var criteria = {};
		var errorType = "SOPNotDefined";		
		var applicationName = req.query.applicationName;
		var accountName = req.query.accountName;
	 
	 
	 
	 
		AlertAuditLog.find({"errorType": errorType, "accountName":accountName.trim(), "applicationName": applicationName.trim()}).lean().exec(function (err, result){
	    if (!err) {
	    	
	      //alerts['accountId']="'"+accountId+"'";
	    	//logger.info(result);
	     // return res.send(alerts);*/
	    	  if(result.length==0){
	                //logger.info("My Error "+err);
	                return res.status(404).send('No alert list found');
	            } 
	    	
	    	else {
	    		var alertNames={};
	    		for(j=0;j<result.length;j++)
		  		{
		  			var newObj={};
		  			logger.info('REsult of each shown ============================>');
		  			logger.info(result[j]);
		  			var alertName = result[j].alertName;
		  			if(alertNames[alertName]!=null){
		  				logger.info("alertName exists");
		  				
		  			}else{
		  				alertNames[alertName]=alertName;
		  				newObj["alertName"]=alertName;
		  				if(result[j].alertDesc!=null){
			  				newObj["alertDesc"]=result[j].alertDesc;
			  			}else{
			  				newObj["alertDesc"]="-";
			  			}
			  			
			  			//obj.push(result[j]);
			  			obj.push(newObj);
		  			}
		  			
		  			
		  			
		  		}
		  
	    	}
	    	
	    	var msgJson=successMessage("getAlertListFromAlertAuditLog","200","List of  all Alerts","List of  all alerts",obj);
	    	  return res.status(200).send(msgJson);
	    	//return res.send{sopId: alerts.SOPID, sopName: alerts.SOPName};
	    } else {
	      //return logger.debug(err);
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    }
	  });
}



exports.getAlertFromAlertAuditLog = function (req, res){
	//var accountId = req.query.accountId;
	//var applicationId = req.query.applicationId;
	logger.info("get call--->>>>");
	var alertName = req.query.alertName;
	var applicationName = req.query.applicationName;
	var accountName = req.query.accountName;
	logger.info("alert id = "+alertName);
	
	AlertAuditLog.findOne({"alertName":alertName.trim(), "accountName":accountName.trim(), "applicationName":applicationName.trim()}).sort( { updateTimestamp: -1 } ).lean().exec(function (err, result) {
	    if (!err) {
	    	
	      //alerts['accountId']="'"+accountId+"'";
	    	logger.info(result);	    	
	    	var msgJson=successMessage("getAlertFromAlertAuditLog","200","Alert details","Alert details",result);
	    	return res.status(200).send(msgJson);
	    	//return res.send{sopId: alerts.SOPID, sopName: alerts.SOPName};
	    } else {
	      //return logger.debug(err);
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    }
	  });
}



/**
 * url :/rest/v1/sopmeta/GetAccountForClient
 * Description :Populate a array of json of all account for a specific client .
 * Method : GET
 */

exports.GetAccountForClient = function (req, res){
	AccountsModel.find({clientName:(req.query.clientName).trim(),trashed:'n'}).sort( { updateTimestamp: -1 } ).exec(function (err, account) {
	      if (err) {       
	    	  logger.info("My Error "+err);
	          //return res.status(500).send(err);
	    	  //throw new Error('DBError');
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	      } else {
	          var msgJson=successMessage("GetAccountForClient","0","List of  account  details for a client","List of  account details for a client",account);
	    	  return res.status(200).send(msgJson);
	      }
	    });
	  }


/**
 * url :/rest/v1/sopmeta/getAlertNameList
 * Description :This service is used to get all the alertName array from AlertModel for a perticular application name.
 * Method :GET
 */
exports.getAlertNameList = function (req, res){
	var arr=[];
	var applicationName=req.query.applicationName;
	var accountId=req.query.accountId;

	AlertModel.find({"applicationName":applicationName.trim(),"accountID":accountId,"trashed": 'n'}).exec(function (err, alerts) {
	            if (err) {       
	              logger.info("My Error "+err);
	              return res.status(500).send(err);
	            }
	            else if(alerts.length==0){
	                //logger.info("My Error "+err);
	                return res.status(404).send('No alert list found');
	            }  
	            else
	            {
	              for(var i=0;i<alerts.length;i++)
	              {
	                arr.push(alerts[i].alertName);
	              }
	                return res.send(arr);
	            }
	          });
	}


/**
 * url :/rest/v1/sopmeta/DeleteAccount
 * Description :Delete the specific account details based on _id of the account.
 * Method :DELETE
 */
exports.DeleteAccount = function (req, res){
	  /*return AccountsModel.findById(req.query.accountId, function (err, account) {
		  return account.remove(function (err) {
	      if (!err) {
	        logger.debug("removed account");
	      } else {
	        logger.debug(err);
	      }
	      return res.send(account);
	    });
	  });*/
	
	AccountsModel.findById(req.query.accountId, function (err, account) {
	      if(err)
	        {
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else if(!account)
	        {
	    	  //throw new Error('AccountIdInvalid');
	    	  var errorCode=errorcodes["AccountIdInvalid"];
	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    		return;
	        }
	      else
	        {
	    	  account.trashed='y';
	    	  account.updateTimestamp=new Date().toISOString();
	    	  account.save(function (err) {
	    	      if (err) {
	    	    	  //throw new Error('DBError');
	    	    	 var errorCode=errorcodes["DBError"];
	  		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	  		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	  		    	return;
	    	      } else {
	    	          var msgJson=msg.successMessage("DeleteAccount","0","Account deleted successfully","Account deleted successfully",account);
	    	    	  return res.status(200).send(msgJson);
	    	      }
	    	    });
	        }
	    });
	}
	

/**
 * url :/rest/v1/sopmeta/GetApplicationList
 * Description :Populate the list of application.
 * Method : GET
 */
exports.GetApplicationList = function (req, res){

	ApplicationsModel.find({trashed: 'n'}).sort( { updateTimestamp: -1 } ).exec(function (err,applications) {
	      if (err) {       
	    	  /*logger.info("My Error "+err);
	          return res.status(500).send(err);*/
	    	    var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	      } else {
	    	  var msgJson=msg.successMessage("GetApplicationList","0","Get the application list details","Get the application list details",applications);
	    	  return res.status(200).send(msgJson);
	    	  //return res.send(applications);
	      }
	    });
	}


/**
 * url :/rest/v1/sopmeta/GetApplicationListForAccount
 * Description :Populate the list of application based on a perticular account.
 * Method : GET
 */
exports.GetApplicationListForAccount = function (req, res){
  var accountId = req.query.accountId;
  logger.debug("account id = "+accountId);
	
  var query = ApplicationsModel.find({"accountID":accountId,"trashed": 'n'});
  logger.debug(query);
	
  return query.sort( { updateTimestamp: -1 } ).exec(function (err, applications) {
    if (!err) {
    	var msgJson=successMessage("GetApplicationListForAccount","200","List Application details for a specific account.","List Application details for a specific account",applications);
    	  return res.status(200).send(msgJson);
    } else {
    	var errorCode=errorcodes["DBError"];
    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
    	return;
    }
  });
}

/**
 * url :/rest/v1/sopmeta/GetApplicationListForAccount
 * Description :Populate the list of application name only .
 */
exports.getApplicationNameList = function (req, res){
	
	var arr=[];
	var accountId = req.query.accountId;
	ApplicationsModel.find({"accountID":accountId,"trashed": 'n'}).exec(function (err,applications) {
	            if (err) {       
	              logger.info("My Error "+err);
	              //return res.status(500).send(err);
	              var errorCode=errorcodes["DBError"];
	          	   res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	          	   internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	          	   return;
	            }
	            else if(applications.length==0){
	                var msgJson=successMessage("getApplicationNameList","0","No application list found","No application list found",{});
	          	    return res.status(404).send(msgJson);
	            }  
	            else
	            {
	              for(var i=0;i<applications.length;i++)
	              {
	                arr.push(applications[i].applicationName);
	              }
	                return res.send(arr);
	            }
	          });
	}

// app.get('/rest/v1/sopmeta/GetApplication', function (req, res){
/**
 * url :/rest/v1/sopmeta/GetApplication
 * Description :Populate the specific application details based on the _id .
 * Method : GET
 */
exports.GetApplication = function (req, res){
	var applicationId = req.query.applicationId;
	logger.debug("applicationId = "+applicationId);
	var query = ApplicationsModel.findOne({"_id":applicationId});
	
	  return query.exec(function (err, applications) {
	    if (!err) {	    	
	    	var msgJson=successMessage("GetApplication","0","Application Details","Application Details",applications);
      	    return res.status(200).send(msgJson);
	    } else {
	    	var errorCode=errorcodes["DBError"];
       	   res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
       	   internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
       	   return;
	    }
	  });
	}


/**
 * url :/rest/v1/sopmeta/CreateApplication
 * Description : Create new application 
 * Method : POST
 */
exports.CreateApplication = function (req, res){
	
  	ApplicationsModel.findOne({"applicationName":(req.body.applicationName).trim(),"accountID":(req.body.accountID).trim()}).lean().exec(function (err, applicatn) {
		if(err)
			{
				//res.status(500).send(err);
			var errorCode=errorcodes["DBError"];
	       	   res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	       	   internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	       	   return;
				
			}
		else if(!applicatn)
			{
			var application;
			  /*logger.debug("POST: ");
			  logger.debug(req.body);*/
			  
			  /*var userid=req.body.Id;
			  var userType=req.body.type;*/
			  application = new ApplicationsModel({
				//_id: mongoose.Types.ObjectId(),
			    applicationName: (req.body.applicationName).trim(),
			    applicationShortDesc: req.body.applicationShortDesc,
			    applicationSupportLevel: req.body.applicationSupportLevel,
			    applicationSupportStartDate: req.body.applicationSupportStartDate,
			    appContractType: req.body.appContractType,
			    applicationTechStack: req.body.applicationTechStack,
			    applicationAppServer: req.body.applicationAppServer,
			    applicationInterfacingApps: req.body.applicationInterfacingApps,
			    accountID: req.body.accountID,
			    updateTimestamp:new Date().toISOString(),
			    trashed:'n'
			    });
			  
			  
			  application.save(function (err) {
			    if (!err) {
			    	//=================New code========================================
			    		UsersAccessModel.find({type:'SuperAdmin',active:'Y',trashed:'n'}).lean().exec(function (err, superuserDetails) {
				      	if(err)
				      	{
				      		var errorCode=errorcodes["DBError"];
				    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
				    		internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
				    		return;
				      	}
				      	else
				      	{
				      		logger.info('Application Created------------11111');
				      		applicationAssociation(application,superuserDetails,req,res,0);
				      	}
		      });

			    	//====================End Code=====================================
			    	
			    } else {
			    	//return res.status(500).send(err);
			    	var errorCode=errorcodes["DBError"];
      		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
      		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
      		    	return;
			    }
			  });
			}
		else
			{
				var userMessage=userMsg.sopDuplicateApplication;
				var msgJson=successMessage("CreateApplication","1",userMessage,userMessage,{});
          	    //return res.status(200).send(msgJson);
				return res.status(400).send(msgJson); 
			}
	});
  
  
}


/**
 * Description : This function is used to ascociate the newly created application with the super admin users.
 * 					This function is calling from CreateApplication.
 * Parameter :	(Newly created application json,Array list of super admin records,req,res,increment variable)
 */
function applicationAssociation(application,superuserDetails,req,res,i)
{
	if(i<superuserDetails.length)
	{
		
		var newArr=superuserDetails[i].account;
		var accountIdPosition=getPositionValue(newArr,application.accountID);
		newArr[accountIdPosition].applicationIdList.push(application._id);

		logger.info(newArr);
		UsersAccessModel.findById(superuserDetails[i]._id, function (err, user) {
		
		 user.account= newArr;
		 
			 user.save(function (err) {
			      if (err) {
			    	  
			    	  var errorCode=errorcodes["DBError"];
				    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
				    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
				    	return;
			      } else {
			    	  applicationAssociation(application,superuserDetails,req,res,i+1);
			      }
			    });
		
		  
	  });
	}
	else
	{
		var userMessage=userMsg.sopNewApplicationAdded;
		//return res.status(200).send(userMessage); 
		var msgJson=successMessage("CreateApplication","0",userMessage,userMessage,{});
		return res.status(200).send(msgJson);
	}
}


/**
 * url :/rest/v1/sopmeta/UpdateApplication
 * Description :Update specific application record.
 * Method : PUT
 */
exports.UpdateApplication = function (req, res){
  return ApplicationsModel.findById(req.query.applicationId, function (err, application) {
	  
	  var oldtimestamp=req.body.updateTimestamp;
		 logger.info('request body ------------------------'+oldtimestamp);
		 var newtimestamp=application.updateTimestamp.toISOString();
		 logger.info('user fetch ==========================='+newtimestamp);
		 logger.info('current Date '+new Date().toISOString());
		 
	  application.applicationName = (req.body.applicationName).trim();
	  application.applicationShortDesc = req.body.applicationShortDesc;
	  application.applicationSupportLevel = req.body.applicationSupportLevel;
	  application.applicationSupportStartDate = req.body.applicationSupportStartDate;
	  application.appContractType = req.body.appContractType;
	  application.applicationTechStack = req.body.applicationTechStack;
	  application.applicationAppServer = req.body.applicationAppServer;
	  application.applicationInterfacingApps = req.body.applicationInterfacingApps;
	  application.accountID = req.body.accountID;
	  application.updateTimestamp=new Date().toISOString();
	  application.updatedByUserId=req.body.updatedByUserId;
	  application.updateComment=req.body.updateComment;
	  
	  if(oldtimestamp==newtimestamp)
		 {
		  return application.save(function (err) {
		      if (!err) {
		        //logger.debug("updated application");
		        //return res.status(200).send(application);
		    	  //var userMessage=userMsg.sopDuplicateApplication;
					var msgJson=successMessage("UpdateApplication","0","Application Update Successfully","Application Update Successfully",{});
					return res.status(200).send(msgJson);
					//return res.status(200).send(msgJson);
		      } else {
		        /*logger.debug(err);
		        return res.status(500).send(err);*/
		    	  var errorCode=errorcodes["DBError"];
    		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
    		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
    		    	return;
		      }
		      
		    });
		 }
	 else
		 {
		 var userMessage=userMsg.sopUpdateApplicationConflict;
		  var obj={};
		  var msgJson=msg.successMessage("UpdateApplication","1",userMessage,userMessage,obj);
 	  return res.status(400).send(msgJson);
		 }

	 
  });
}

/**
 * url :/rest/v1/sopmeta/DeleteApplication
 * Description :Delete a specific application.
 * Method : DELETE
 */
exports.DeleteApplication = function (req, res){
  /*return ApplicationsModel.findById(req.query.applicationId, function (err, application) {
	  return application.remove(function (err) {
      if (!err) {
        logger.debug("removed application");
      } else {
        logger.debug(err);
      }
      return res.send(application);
    });
  });*/
	
	/*var applicationArrayList=req.body.applicationIDList;
	logger.info('Delete Application ++++++++++++++++++++++++++++++>');
	logger.info(applicationArrayList);
	deleteapplication(req,res,applicationArrayList,0);*/
	
	//******************************In case of single application delete***********************************
	
	ApplicationsModel.findById(req.query.applicationId, function (err, application) {
	      if(err)
	        {
	    	  //throw new Error('DBError');
	    	  	var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else if(!application)
	        {
	    	  //throw new Error('ApplicationIdInvalid');
	    	  var errorCode=errorcodes["ApplicationIdInvalid"];
	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    		return;
	        }
	      else
	        {
	    	  application.trashed='y';
	    	  application.updateTimestamp=new Date().toISOString();
	    	  application.save(function (err) {
	    	      if (err) {
	    	    	  var errorCode=errorcodes["DBError"];
	  		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	  		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	  		    	return;
	    	      } else {
	    	          var msgJson=msg.successMessage("DeleteApplication","0","Application deleted successfully","Application deleted successfully",application);
	    	    	  return res.status(200).send(msgJson);
	    	      }
	    	    });
	        }
	    });
	
	
	//********************************************End******************************************************

}


/**
 * Description : This function is used to delete application one after another in recursive way from the array list.
 * Parameter : req,res,applicationArrayList.
 */
function deleteapplication(req,res,applicationArrayList,i)
{
	if(i<applicationArrayList.length)
		{
		logger.info('Inside function -------------------------> '+i);
		logger.info(applicationArrayList[i]);
		ApplicationsModel.findById(applicationArrayList[i], function (err, application) {
		      if(err)
		        {
		    	  //throw new Error('DBError');
		    	  	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
			    	return;
		        }
		      else if(!application)
		        {
		    	  //throw new Error('ApplicationIdInvalid');
		    	  var errorCode=errorcodes["ApplicationIdInvalid"];
		    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
		    		return;
		        }
		      else
		        {
		    	  application.trashed='y';
		    	  application.updateTimestamp=new Date().toISOString();
		    	  application.save(function (err) {
		    	      if (err) {
		    	    	  var errorCode=errorcodes["DBError"];
		  		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		  		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		  		    	return;
		    	      } else {
		    	    	  deleteapplication(req,res,applicationArrayList,i+1);
		    	      }
		    	    });
		        }
		    });
		}
	else
		{
		var msgJson=msg.successMessage("DeleteApplication","0","Application deleted successfully","Application deleted successfully",{});
  	  return res.status(200).send(msgJson);
		}
}
	

/**
 * url :/rest/v1/sopmeta/GetSOPList
 * Description :Populate the sop list based on accont and application ids.
 * Method : GET
 */
exports.GetSOPList = function (req, res){
	var accountId = req.query.accountId;
	var applicationId = req.query.applicationId;
	logger.debug("account id = "+accountId+", application id = "+applicationId);
	
	//var query = AlertModel.find({"applicationID":applicationId,"trashed": 'n'}).select('_id applicationID alertName alertShortDesc');
	var query = AlertModel.find({"applicationID":applicationId,"trashed": 'n'});
	logger.debug(query);
	
	  return query.exec(function (err, alerts) {
	    if (!err) {
	    	var msgJson=successMessage("GetSOPList","200","List of  all SOP","List of  all SOP",alerts);
	    	  return res.status(200).send(msgJson);
	    } else {
	      //return logger.debug(err);
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    }
	  });
}

function getRespectiveChoreograph(req,res,returnObj){
	logger.info('return obj json type =============== >');
	logger.info(returnObj.SOPs[0]);
	
	ChoreographModel.findOne({"SOPID" : returnObj.SOPs[0].SOPID}).exec(function(err, choreo) {
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
				} 
				 else {
					
					returnObj["ChoreographObj"]=choreo;
					
						var msgJson = msg.successMessage("GetSOP", "0","Ticket  details", "Ticket details", returnObj);
						return res.status(200).send(msgJson);
						
					
				}
			});
}

/**
 * url :/rest/v1/sopmeta/GetSOPListForAlertId
 * Description :Populate the sop list based on a alert id.
 * Method : GET
 */
exports.GetSOPListForAlertId = function (req, res){
	
	var alertId = req.query.alertId;
	logger.debug("alert id = "+alertId);
	
	AlertModel.findOne({"_id":alertId}).lean().exec(function (err, alerts) {
	    if (err) 
	    {	    	
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	return;	
	    }
	    else if(!alerts)
	    	{
	    		var msgJson=msg.successMessage("GetSOPListForAlertId","1","No data available","No data available",alerts);
	    		return res.status(400).send(msgJson);
	    	}
	    else
	    {
	    	var accountID=alerts.accountID;
	    	AccountsModel.findOne({"_id":accountID}).lean().exec(function (err, account) {
	    	    if (err) 
	    	    {	    	
	    	    	var errorCode=errorcodes["DBError"];
	    	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	    	return;	
	    	    }
	    	    else
	    	    {
	    	    	  alerts["accountName"]=account.accountName;
	    	    	  alerts["clientName"]=account.clientName;
	    	    	  /*var msgJson=msg.successMessage("GetSOPReport","0","SOP Report","SOP Report",alerts);
	    	    	  return res.status(200).send(msgJson);*/
	    	    	  GetSopJobEvent(req,res,alerts);
	    	    	  //return res.status(200).send(alerts);
	    	    }
	    	  });
	    	
	    	
	    	
		      //return res.send(alerts);
	    }
	  });
	
}


/**
 * Description :Function to get the sop job event for a perticular sop details .
 * 				This method is calling form GetSOPListForAlertId service.
 * Parameter : req,res,specific alerts json.
 */
function GetSopJobEvent(req,res,alerts){
	logger.info('Get Sop Job events and merged with alert json ==========');
	logger.info(alerts._id);
	JOBEventsModel.findOne({"alertId":alerts._id,"trashed": 'n'}).lean().exec(function (err, sopjob) {
	      if(err)
	        {
	    	  //throw new Error('DBError');
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else if(!sopjob)
	        {
	    	  logger.info('111111111111111111111111111111111111111111111111111');
	    	  alerts["SopJobEvents"]={};
	    	  getRespectiveChoreograph(req,res,alerts);
	    	  //return res.status(200).send(alerts);
	    	  /*var msgJson=successMessage("GetSOPList","200","List of  all SOP","List of  all SOP",alerts);
	    	  return res.status(200).send(msgJson);*/
	        }
	      else
	        {
	    	  logger.info('22222222222222222222222222222222222');
	    	  logger.info(sopjob);
	    	  alerts["SopJobEvents"]=sopjob;
	    	  getRespectiveChoreograph(req,res,alerts);
	    	  /*var msgJson=successMessage("GetSOPList","200","List of  all SOP","List of  all SOP",alerts);
	    	  return res.status(200).send(msgJson);*/
	    	  //return res.status(200).send(alerts);
	        }
	    });
}


/**
 * url :/rest/v1/sopmeta/GetSOPListForAlertSR
 * Description :Populate sop list based account name,application name and alert name.
 * Method : GET
 */
exports.GetSOPListForAlertSR = function (req, res){
	
	logger.info('Test the service===================>');
	var accountName = (req.query.accountName).trim();
	var applicationName = (req.query.applicationName).trim();
	var alertName = (req.query.alertName).trim();
	
	logger.debug("accountName = "+accountName);
	logger.debug("applicationName = "+applicationName);
	logger.debug("alert name = "+alertName);
	
	//var query = AccountsModel.findOne({"accountName":accountName});
	
	AccountsModel.findOne({"accountName":accountName}).exec(function (err, account) {	  
	 // var checkAccount =  AccountsModel.findOne(accountName, function (err, account) {
	      if (!err) {
	        logger.debug("account found "+ account);
	        if(account != null && account != ""){
	        	logger.debug("acc Id = "+ account._id);
	        	//return res.send("account found");
	        	
	        	//-----------
	        	//var query = ApplicationsModel.findOne({"applicationName":applicationName,"accountID":account._id});
	        	
	        	ApplicationsModel.findOne({"applicationName":applicationName,"accountID":account._id}).exec(function (err, application) {
	      	      if (!err) {
	      	        logger.debug("application found="+application+".");
	      	        if(application != null && application != ""){
	      	        	logger.debug("application found within account. application Id = "+ application._id+", application name = "+application.applicationName);
	      	        	//return res.send("application found within account");
	      	        	var applicationName = application.applicationName;
	      	        	
	      	        	//====================
	      	        	
	      	        	//Is this query variable really needed anywhere - If not then we can delete the same. [SUJOY]
	      	        	var query = AlertModel.find({"alertName":alertName,"applicationID":application._id,"accountID":account._id});
	      	      	
	      	        	//Adding a check on trash field to select only those alert sops which are not already marked for soft delete(trashed = y)
	      	        	AlertModel.find({"alertName":alertName,"applicationID":application._id,"accountID":account._id, "trashed" : "n"}).exec(function (err, alerts) {
	      	      	    if (!err) {	    	
	      	      	    	//alerts['accountId']="'"+accountId+"'";
	      	      	    	logger.debug(alerts);
	      	      	      return res.send(alerts);
	      	      	    	//return res.send{sopId: alerts.SOPID, sopName: alerts.SOPName};
	      	      	    } else {
	      	      	      return logger.debug(err);
	      	      	    }
	      	      	  });
	      	        	
	      	        	//===================
	      	        }else {
	      	        	logger.debug("application not found");
	      		        return res.status(400).send("application not found");
	      		    }
	      	      } else {
	      	    	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
			    	return;
	      	      }
	      	  });
	        	
	        	//-------
	        	
	        }else {
	        	logger.debug("account not found");
		        return res.send("account not found");
		    }
	      } else {
	        /*logger.debug(err);
	        logger.debug("err acc Id = "+ account._id);
	        return res.status(500).send("account not found");*/
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
	      }
	  });
}



/**
 * url :/rest/v1/sopmeta/UpdateSOP
 * Description :Update a specific sop record
 * Method : PUT
 */
exports.UpdateSOP = function (req, res){ 
	
	var accountId = req.query.accountId;
	var applicationId = req.query.applicationId;
	var alertId = req.query.alertId;
	logger.info("accountId = "+accountId);
	logger.info("applicationId = "+applicationId);
	logger.info("alertId = "+alertId);
	
	//AlertModel.findOne({"alertName":alertName, "accountName":accountName, "applicationName":applicationName}).sort( { updateTimestamp: -1 } ).lean().exec(function (err, result) {
	AlertModel.findById(req.query.alertId, function (err, alert) {
	if(err)
		{
			var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
		}
		else if(!alert)
			{
				logger.info('alert not found');
			}
		else
			{
			

			logger.info('Alert found and need to update==============');
			
			var obj=req.body.Alerts;
			var jobEventObj=obj[0].SopJobEvents;
			var choreographObj=obj[0].choreographEvent;
			
			alert.alertShortDesc=obj[0].alertShortDesc;
    		alert.alertType=obj[0].alertType;
		    alert.alertSeverity=obj[0].alertSeverity; 
		    alert.updateTimestamp=new Date().toISOString();
			alert.updatedByUserId=obj[0].updatedByUserId;
			alert.updateComment=obj[0].updateComment;
			alert.trashed='n';
			//Capture old active status and requested active status mode to check whether the SOPs is getting activated or not
			var oldSOPActiveStatus = alert.SOPs[0].activeMode;
		    alert.SOPs=obj[0].SOPs;
		    var requestedSOPActiveStatus = alert.SOPs[0].activeMode;
			alert.save(function (err) {
				      if (err) {
				    	  logger.info('Error OCCUREDDDDDDDDDDDD +++++++++++++++++++ >');
				    	  logger.info(err);
				    	  var errorCode=errorcodes["DBError"];
					    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
					    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
					    	return;
				    	  
				      } else {
				    	  logger.info('AUTOMATION PROCESS =============> '+obj[0].SOPs[0].ExecuteAutomation);
				    	  if(obj[0].SOPs[0].SOPType=='S')
				    		{
				    		  if(obj[0].SOPs[0].ExecuteAutomation!='RT')
								{
					    		  logger.info('uPDATE JOB EVENT===================');
									UpdateSopJobEvent(req,res,jobEventObj,alertId,choreographObj);
								}
								else
								{
									logger.info('OKKKKKKKKKKKKKKKKK');
					          		var msgJson=msg.successMessage("UpdateSOP","0","SOP updated successfully","SOP updated successfully",{});
					          		
					          		//Check if SOP is getting activated - If yes process the associated unprocessed alerts
					          		logger.info('Checked the status of sopActiveStatus::oldSOPActiveStatus='+oldSOPActiveStatus+" requestedSOPActiveStatus="+requestedSOPActiveStatus);
					          		if(oldSOPActiveStatus=='n' && requestedSOPActiveStatus=='y'){
					          			logger.info("Invoking processing for the linked alerts")
					          			exports.processSOPLinkedAlerts(alert);
					          		}
					    	  		return res.status(200).send(msgJson);
								}
				    		}
				    	  else if(obj[0].SOPs[0].SOPType=='C')
				    		 {
				    		  if(obj[0].SOPs[0].ExecuteAutomation!='RT')
    								{
				    			  		UpdateSopJobEvent(req,res,jobEventObj,alertId,choreographObj);
    								}
    								else
    								{
    									logger.info('enterd into choriograph declare point============ >');
    									logger.info(choreographObj);
    									UpdateChoreograph(req,res,alertId,choreographObj);
    								}
				    		 }
				    	  else
							{
								res.status(400).send('wrong SOP type');
							} 
				    	  
				      }
				    });
			
		 
			}
		
	  });

}

//app.delete('/rest/v1/sopmeta/DeleteSOPSR', function (req, res){
/**
 * url :/rest/v1/sopmeta/DeleteSOP
 * Description :Delete a specific sop based on accountid.applicationid and alertid
 * Mehod : DELETE
 */
exports.DeleteSOP = function (req, res){  
	
	var accountId = req.query.accountId;
	  var applicationId = req.query.applicationId;
	  var alertId = req.query.alertId;
	  logger.debug("accountId = "+accountId);
	  logger.debug("applicationId = "+applicationId);
	  logger.debug("alertId = "+alertId);
	  
	    AlertModel.findById(alertId, function (err, alert) {
	      if(err)
	      {
	        logger.info(err);
	        var errorCode=errorcodes["DBError"];
	        res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	        internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	        return;
	      }
	      else if(!alert)
	      {
	          var errorCode=errorcodes["AlertIdInvalid"];
	          res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	          internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	          return;
	      }

	      else
	      {
	          logger.info('Check alert information');
	          logger.info(alert);
	         if(alert.applicationID==applicationId &&  alert.accountID==accountId)
	         {
	            alert.trashed='y';
	            alert.updateTimestamp=new Date().toISOString();
	            alert.save(function (err) {
	              if (err) {
	                logger.info(err);
	                var errorCode=errorcodes["DBError"];
	                res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	                internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	                return;
	              } 
	              else 
	              {
	            	  if(alert.SOPs[0].ExecuteAutomation!='RT')
	            		  {
	            		  	logger.info('Enterd to delete related job event');
	            		  	DeleteRelatedJobEvent(req,res,alertId);
	            		  }
	            	  
	            	  else
	            	  {
	            		  var msgJson=msg.successMessage("DeleteSOP","0","SOP deleted successfully","SOP deleted successfully",alert);
		                  return res.status(200).send(msgJson);
	            	  }
	                  
	              }
	            });
	         }
	         else
	         {
	          //return res.status(400).send('Credential mismatch.Please check your input data');
	          var msgJson=msg.successMessage("DeleteSOP","1","Credential mismatch.Please check your input data","Credential mismatch.Please check your input data",alert);
              return res.status(400).send(msgJson);
	         }
	      }//end of alert..........

	    });
}

/**
 * Description :This fuction is used to delete job event corrosponding to the sop associated.
 * 				This function is calling from DELETESOP service.
 * Parameter : req,res,alert id.
 */
function DeleteRelatedJobEvent(req,res,alertId){
	JOBEventsModel.findOne({"alertId":alertId,"trashed": 'n'}).lean().exec(function (err, jbevent) {
	      if(err)
	        {
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else if(!jbevent)
	        {
	          return res.status(404).send('Job not found');
	        }
	      else
	        {
	    	  jbevent.remove(function (err) {
	            if (err) 
	            {
	            		/*logger.info("My Error during remove "+err);
	              		return res.status(500).send(err);*/
	            	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
			    	return;
	            } 
	            else {
	            	var msgJson=msg.successMessage("DeleteSOP","0","SOP deleted successfully","SOP deleted successfully",{});
	                  return res.status(200).send(msgJson);
	            }
	            
	          });
	    	  /*usr.trashed='y';
	    	  usr.updateTimestamp=new Date().toISOString();
	    	  usr.save(function (err) {
	    	      if (err) {
	    	    	  var errorCode=errorcodes["DBError"];
		    	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	    	return;
	    	      } else {
	    	          var msgJson=msg.successMessage("DeleteUserAccess","0","UserAccess deleted successfully","UserAccess deleted successfully",usr);
	    	    	  return res.status(200).send(msgJson);
	    	      }
	    	    });*/
	        }
	    });
}

// ----------------------- End of (added 6 may 2015) -----------------


/**
 * url :/rest/GetSOPListForAlert
 * Description : Populate the sop list based on account id,application id and alert id.
 */
exports.GetSOPListForAlert = function(req, res){
	AlertModel.find({"applicationID":applicationId,"trashed":"n"}).exec(function (err, alertdocs) {
		if(err)
		{
			logger.info('Error Occured============>');
			logger.info(err);
			var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;	
		}
		else
		{
			return res.status(200).send(alertdocs);
		}
	});
}


/**
 * url :/rest/CreateAlertAuditLog
 * Description :Create alert audit log new record.
 */
/*
exports.CreateAlertAuditLog = function(req, res){
	var firstItem=true;
	// var applicationId = req.query.applicationid;
	var reqjson = req.body;
	logger.info(JSON.stringify(reqjson));
	var result="";
	// logger.info(applicationId);
	// logger.info(accountId);
	
	MongoClient.connect (mongodb_uri, function(err, db) {
		if(!err) {
			logger.info("We are connected to DB");
		}
		else {
			logger.info(err);
		}
		
		logger.info(reqjson);
		var doc=reqjson;
		var tempAlertID = reqjson.AlertId;
		db.collection('alerts').find({"_id":tempAlertID,"trashed":"n"}).toArray(function(err,alertdocs){
			logger.info(alertdocs.length);
			if(alertdocs.length){
				db.collection('AlertAuditLog').insert(doc,function(err,inserted){
					if(err) throw err;
					logger.debug(inserted);
					logger.info("Successfully inserted: " + JSON.stringify(inserted));
					result = JSON.stringify(inserted.ops[0]);
					res.writeHead(200, {'content-type': 'text/html','Access-Control-Allow-Origin' : '*'});
					res.write(firstItem ? (firstItem=false,'[') : ',');
					res.write(result);
					res.end(']');
				});
			}
			else
			{
				logger.info("Inside else");
				result ='Invalid alertID.';
				// logger.info("Inside else"+result);
				res.writeHead(200, {'content-type': 'text/html','Access-Control-Allow-Origin' : '*'});
				res.write(firstItem ? (firstItem=false,'[') : ',');
				res.write(result);
				res.end(']');
				// TODO: Here the res return needs to be put in a function which
				// will be called outside the function
			}
		});
		// logger.info(result);
		
	}); // End MongoClient.connect
}
*/
//This function is used to encrypt a password 
/**
 * Description : This function is used to encrypt password
 * Parameter : any password.
 */
function encryptPassword(password) 
{
	logger.info("Funpassword = "+password);
	//INSTALL THIS :npm install bcrypt-nodejs
	var bcrypt = require('bcrypt-nodejs');	     
 	var hash = bcrypt.hashSync(password);
 	return(hash);
}


/**
 * url :/rest/v1/sopmeta/CreateClient
 * Description : Create a new client record.
 * Method : POST
 */
exports.CreateClient = function (req, res){
	
	var clientname=(req.body.clientName).trim();
	ClientsModel.findOne({"clientName":clientname}).lean().exec(function (err, clnt) {
		if(err)
			{
				//res.status(500).send(err);
				var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else if(!clnt)
			{
			var client = new ClientsModel({
				//_id: mongoose.Types.ObjectId(),
				  clientName: clientname,
				  clientID:req.body.clientID,
				  clientShortDescription:req.body.clientShortDescription,
				  updateTimestamp:new Date().toISOString(),
				  updatedByUserId: req.body.updatedByUserId, 
				  updateComment: req.body.updateComment,
				  trashed:'n',

			    });
			  client.save(function (err) {
			    if (err) {
			    	
			    	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
			    	return;
			    } else {
			    	var userMessage=userMsg.sopNewClientAdded;
			    	var msgJson=msg.successMessage("CreateClient","0",userMessage,userMessage,client);
			    	return res.status(200).send(msgJson);
			    	
			    }
			  });
			}
		else
			{
				var userMessage=userMsg.sopDuplicateClient;
		    	var msgJson=msg.successMessage("CreateClient","1",userMessage,userMessage,{});
		    	return res.status(400).send(msgJson);
			}
	});
	  
	  //return res.send(user); 	
	}


/**
 * url :/rest/v1/sopmeta/UpdateClient
 * Description :Update a specific client record
 * Method :PUT
 */
exports.UpdateClient = function (req, res){
	ClientsModel.findById(req.query.Id, function (err, client) {
		if(err)
			{
				var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else if(!client)
			{
			var errorCode=errorcodes["ClientIdInvalid"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    	return;
			}
		else
			{
			var oldtimestamp=req.body.updateTimestamp;
			 logger.info('request body ------------------------'+oldtimestamp);
			 var newtimestamp=client.updateTimestamp.toISOString();
			 logger.info('user fetch ==========================='+newtimestamp);
			 logger.info('current Date '+new Date().toISOString());
			 
			client.clientName=(req.body.clientName).trim();
			client.clientID=req.body.clientID;
			client.clientShortDescription=req.body.clientShortDescription;
			client.updateTimestamp=new Date().toISOString();
			client.updatedByUserId= req.body.updatedByUserId;
			client.updateComment=req.body.updateComment;
			client.trashed='n';
			
			if(oldtimestamp==newtimestamp)
			 {
				client.save(function (err) {
				      if (err) {
				    	  var errorCode=errorcodes["DBError"];
					    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
					    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
					    	return;
				      } else {
				          var msgJson=msg.successMessage("UpdateClient","0","Client updated successfully","Client updated successfully",client);
				    	  return res.status(200).send(msgJson);
				      }
				    });
			 }
		 else
			 {
			 var userMessage=userMsg.sopUpdateClientConflict;
			  var obj={};
			  var msgJson=msg.successMessage("UpdateClient","1",userMessage,userMessage,obj);
			  return res.status(400).send(msgJson);
			 }
			}
		
	  });
	}


/**
 * url :/rest/v1/sopmeta/DeleteClient
 * Description :Delete a specific client record based on _id.
 * Method : DELETE
 */
exports.DeleteClient = function (req, res){
	   ClientsModel.findById(req.query.Id, function (err, client) {
	      if(err)
	        {
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else if(!client)
	        {
	    	  var errorCode=errorcodes["ClientIdInvalid"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else
	        {
	    	  
	    	  /*clint.remove(function (err) {
	            if (err) {
	            	throw new Error('DBError');
	            	
	            } else {
		  	        var msgJson=msg.successMessage("DeleteClient","0","Client deleted successfully","Client deleted successfully",clint);
		  	    	  return res.status(200).send(msgJson);
	            }
	            
	          });*/
	    	  client.trashed='y';
	    	  client.updateTimestamp=new Date().toISOString();
	    	  client.save(function (err) {
	    	      if (err) {
	    	    	  var errorCode=errorcodes["DBError"];
				    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
				    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
				    	return;
	    	      } else {
	    	          var msgJson=msg.successMessage("DeleteClient","0","Client deleted successfully","Client deleted successfully",client);
	    	    	  return res.status(200).send(msgJson);
	    	      }
	    	    });
	        }
	    });
	  }


/**
 * url :/rest/v1/sopmeta/GetAllClients
 * Description :Populate the list of all client.
 * Method :GET
 */
exports.GetAllClients = function (req, res){
	ClientsModel.find({trashed: 'n'}).sort( { updateTimestamp: -1 } ).exec(function (err,clients) {
	      if (err) {       
	    	  //logger.info("My Error "+err);
	          //return res.status(500).send(err);
	    	  //throw new Error('DBError');
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
	      } else {
	          var msgJson=msg.successMessage("GetAllClients","0","List of  clients  details","List of  clients  details",clients);
	    	  return res.status(200).send(msgJson);
	      }
	    });
	  }



/**
 * url :/rest/v1/sopmeta/GetClient
 * Description :Populate a specific client record based on _id of the client
 * Method : GET
 */
exports.GetClient = function (req, res){
	var cid = req.query.Id;
	logger.info("Client id ="+cid);
	ClientsModel.findOne({"_id":cid}).exec(function (err, client) {
	    if (err) {	
	    	//throw new Error('DBError');
	    	//return res.status(500).send(err);
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    }
	    else if(!client)
	    	{
	    	var errorCode=errorcodes["ClientIdInvalid"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    	}
	    else {
	          var msgJson=msg.successMessage("GetClient","0","Fetching client Details","Fetching client Details",client);
	          return res.status(200).send(msgJson);
	    }
	  });
	
}


/**
 * url :/rest/v1/sopmeta/GetSOPReport
 * Description :Populate record to generate record for sop report.
 * Method : GET
 */
exports.GetSOPReport = function (req, res){
	var alertId = req.query.alertId;
	logger.debug("alert id = "+alertId);
	
	AlertModel.find({"_id":alertId,"trashed":"n"}).lean().exec(function (err, alerts) {
	    if (err) 
	    {	    	
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	return;	
	    }
	    else
	    {
	    	var accountID=alerts[0].accountID;
	    	AccountsModel.findOne({"_id":accountID}).lean().exec(function (err, account) {
	    	    if (err) 
	    	    {	    	
	    	    	var errorCode=errorcodes["DBError"];
	    	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	    	return;	
	    	    }
	    	    else
	    	    {
	    	    	  alerts[0]["accountName"]=account.accountName;
	    	    	  alerts[0]["clientName"]=account.clientName;
	    	    	  /*for(var i=0;i<alerts.SOPs.length;i++)
	    	    	  {
	    	    		  delete alerts.SOPs[i]['SOPCognitiveInfos'];
	    	    		  delete alerts.SOPs[i]['TaskExecutionFlows'];
	    	    	  }*/
	    	    	  var msgJson=msg.successMessage("GetSOPReport","0","SOP Report","SOP Report",alerts);
	    	    	  return res.status(200).send(msgJson);
	    		      //return res.send(alerts);
	    	    }
	    	  });
	    	
	    	
	    	
		      //return res.send(alerts);
	    }
	  });
	
}

/**
 * Description : Return sucess message structure for exception handling 
 */
function successMessage(OperationName,ServiceCode,UserMessage,InternalMessage,ResponseJson){
	var msgJson={};
	msgJson.operationName=OperationName;
    msgJson.serviceCode=ServiceCode;
    msgJson.userMessage=UserMessage;
    msgJson.internalMessage=InternalMessage;
    msgJson.response=ResponseJson;
    return(msgJson);
}


/**
 * Description :This function create a sop ,calling from CreateSOP
 * Parameter: req,res,uploaded file name
 */
function sopEntry(req, res,IncommingfileName){
	var accountId = req.query.accountId;
	var applicationId = req.query.applicationId;
	logger.info("accountId = "+accountId);
	logger.info("applicationId = "+applicationId);
	
	var checkAccount =  AccountsModel.findById(accountId, function (err, account) {
	      if (!err) {
	        logger.info("account found "+ account);
	        if(account != null && account != ""){
	        	logger.info("acc Id = "+ account._id);
	        	//return res.send("account found");
	        	
	        	//-----------
	        	var query = ApplicationsModel.findOne({"_id":applicationId,"accountID":accountId});
	        	
	        	return query.exec(function (err, application) {
	      	      if (!err) {
	      	        logger.info("application found="+application+".");
	      	        if(application != null && application != ""){
	      	        	logger.info("application found within account. application Id = "+ application._id);
	      	        	//return res.send("application found within account");
	      	        	var applicationName = application.applicationName;
	      	        	
	      	        	//====================
	      	        	
	      	        	var firstItem=true;
	      	        	var reqjson = req.body;
		      	      	var result="test";
		      	      	var jobEventObj=reqjson.Alerts[0].SopJobEvents;
	      	      		delete reqjson.Alerts[0].SopJobEvents;
	      	      		var choreographEventObj=reqjson.Alerts[0].choreographEvent;
	      	      		delete reqjson.Alerts[0].choreographEvent;
	      	      		var sopObj=reqjson.Alerts
	      	      		logger.info('JsonEVENT==============================>');
	      	      		logger.info(jobEventObj);
	      	      		logger.info('JsonSOP==============================>');
	      	      		logger.info(sopObj);
	      	      		logger.info('Choreograph details===================================>');
	      	      		logger.info(choreographEventObj);
  	      				if(sopObj){
  	      					for(var j=0;sopObj[j];j++){
  	      						var callerAlertObj = sopObj[j];

  	      						var alertId = mongoose.Types.ObjectId().valueOf();
  	      						logger.info("alert id = "+alertId);
  	      						//callerAlertObj._id = ""+alertId;
  	      						callerAlertObj.applicationID = applicationId;
  	      						callerAlertObj.accountID = accountId;
  	      						callerAlertObj.applicationName = applicationName.trim();
  	      						callerAlertObj.updateTimestamp=new Date().toISOString();
  	      						callerAlertObj.trashed="n";
  	      						
  	      						if(callerAlertObj.SOPs){
  	      							for(var k=0;callerAlertObj.SOPs[k];k++){
  	      								var callerSOPObj = callerAlertObj.SOPs[k];
  	      								
  	      								var sopId = mongoose.Types.ObjectId().valueOf();
  	      								logger.info("sop id = "+sopId);
  	      								//callerSOPObj._id = ""+sopId;
  	      								callerSOPObj.SOPID=sopId;//callerSOPObj._id;
  	      								callerSOPObj.alertId = alertId;//callerAlertObj._id;
  	      								//To do enc pwd and reassign.
  	      								//***********************************
  	      									var password=req.body.SOPPassword;//req.params.password;
  	      									logger.info("password = "+password);
 											var encPassword=encryptPassword(password);
 											logger.info("EncPassword = "+encPassword);
 											callerSOPObj.SOPPassword=encPassword;
 											//callerSOPObj.AutomationProvider=req.body.AutomationProvider;
 											callerSOPObj.createTimestamp=new Date().toISOString();
 											
  	      								//************************************
  	      								
  	      								if(callerSOPObj.SOPCognitiveInfos){
  	      									for(var l=0;callerSOPObj.SOPCognitiveInfos[l];l++){
  	      										var callerSOPCognitiveInfoObj = callerSOPObj.SOPCognitiveInfos[l];
  	      										
  	      										var sopCognitiveInfoId = mongoose.Types.ObjectId().valueOf();//mongoose.Types.ObjectId();
  	      										logger.info("sopCognitiveInfo id = "+sopCognitiveInfoId);
  	      										//callerSOPCognitiveInfoObj._id = ""+sopCognitiveInfoId;
  	      										callerSOPCognitiveInfoObj.SOPCognitiveID=sopCognitiveInfoId;//callerSOPCognitiveInfoObj._id;
  	      										callerSOPCognitiveInfoObj.SOPId=sopId;//callerSOPObj._id;
  	      									}
  	      								}
  	      								
  	      								if(callerSOPObj.TaskExecutionFlows){
  	      									for(var l=0;callerSOPObj.TaskExecutionFlows[l];l++){
  	      										var callerTaskExecutionFlowObj = callerSOPObj.TaskExecutionFlows[l];
  	      										
  	      										var taskExecutionFlowId = mongoose.Types.ObjectId().valueOf();//mongoose.Types.ObjectId();
  	      										logger.info("taskExecutionFlow id = "+taskExecutionFlowId);
  	      										//callerTaskExecutionFlowObj._id = ""+taskExecutionFlowId;
  	      										callerTaskExecutionFlowObj.TaskExecutionFlowID=taskExecutionFlowId;//callerTaskExecutionFlowObj._id;
  	      										callerTaskExecutionFlowObj.SOPId=sopId;//callerSOPObj._id;
  	      										
  	      										if(callerTaskExecutionFlowObj.TaskMasters){
  	      											for(var m=0;callerTaskExecutionFlowObj.TaskMasters[m];m++){
  	      												var callerTaskMasterObj = callerTaskExecutionFlowObj.TaskMasters[m];
  	      												
  	      												var taskMasterId = mongoose.Types.ObjectId().valueOf();//mongoose.Types.ObjectId();
  	      												logger.info("taskMaster id = "+taskMasterId);
  	      												//callerTaskMasterObj._id = ""+taskMasterId;
  	      												callerTaskMasterObj.TaskMasterID=taskMasterId;//callerTaskMasterObj._id;
  	      												callerTaskMasterObj.TaskExecutionFlowID=taskExecutionFlowId;//callerTaskExecutionFlowObj._id;
  	      											//To do enc pwd and reassign.
  	      	  	      								//***********************************
  	      	  	      									var TaskPassword=req.body.TaskExecutionPwd;//req.params.password;
  	      	  	      									logger.info("Taskpassword = "+TaskPassword);
  	      	 											var encTPassword=encryptPassword(TaskPassword);
  	      	 											logger.info("EncPassword = "+encTPassword);
  	      	 											callerTaskMasterObj.TaskExecutionPwd=encTPassword;
  	      	 											if(IncommingfileName!=undefined)
  	      	 											{
  	      	 												callerTaskMasterObj.TaskFileName= callerAlertObj.alertName+'_'+IncommingfileName;
  	      	 											}
  	      	 											
  	      	 											
  	      	  	      								//************************************
  	      											}
  	      										}
  	      										
  	      										if(callerTaskExecutionFlowObj.RuleMasters){
  	      											for(var n=0;callerTaskExecutionFlowObj.RuleMasters[n];n++){
  	      												var callerRuleMasterObj = callerTaskExecutionFlowObj.RuleMasters[n];
  	      												
  	      												var ruleMasterId = mongoose.Types.ObjectId().valueOf();//mongoose.Types.ObjectId();
  	      												logger.info("ruleMaster id = "+ruleMasterId);
  	      												//callerRuleMasterObj._id = ""+ruleMasterId;
  	      												callerRuleMasterObj.RuleMasterID=ruleMasterId;//callerRuleMasterObj._id;
  	      												callerRuleMasterObj.TaskExecutionFlowID=taskExecutionFlowId;//callerTaskExecutionFlowObj._id;
  	      												
  	      											}
  	      										}
  	      									}
  	      									
  	      								}
  	      							}
  	      						}
  	      						var newAlert = new AlertModel(callerAlertObj);
  	      						logger.info("callerAlertObj = "+callerAlertObj);
  	      						newAlert.save(function(err, alert){
  	      							if(err){
  	      								/*logger.info("err = "+err);
  	      								res.send(err);*/
  	      								logger.info('Eroor during create ========> '+err);
  	      								var errorCode=errorcodes["DBError"];
  	      								res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
  	      								internalMessage:err,userMessage:errorCode.userMessage,response:{}});
  	      								return;
  	      							}else{
  	      								
  	      								if(choreographEventObj)
  	      									{
  	      										choreographEventObj["SOPID"]=alert.SOPs[0].SOPID;
  	      										choreographEventObj["SOPName"]=alert.SOPs[0].SOPName;
  	      									}
  	      								
  	      								
  	      								logger.info('Check sop id inserted or not============= >');
  	      								logger.info(choreographEventObj);
  	      									
  	      								logger.info('SOP type =============== > '+req.body.Alerts[0].SOPs[0].SOPType=='S');
  	      									if(req.body.Alerts[0].SOPs[0].SOPType=='S')
  	      									{
	  	      									logger.info("saving alert==========> = "+alert);
	  	  	      								//res.json(alert);
	  	  	      								if(callerAlertObj.SOPs[0].ExecuteAutomation!='RT')
	  	  	      								{
	  	  	      									CreateJobEvent(req,res,jobEventObj,alert._id,choreographEventObj);
	  	  	      								}
	  	  	      								else
	  	  	      								{
	  	  	      									var userMessage=userMsg.sopNewSOPAdded;
	  	  	      									//return res.status(200).send(userMessage);
	  	  	      									var msgJson=msg.successMessage("CreateSop","0",userMessage,userMessage,{});
	  	  	      									return res.status(200).send(msgJson);
	  	  	      								}
  	      									}
  	      									else if(req.body.Alerts[0].SOPs[0].SOPType=='C')
  	      									{
	  	      									//logger.info("saving alert==========> = "+alert);
	  	  	      								//res.json(alert);
	  	  	      								if(callerAlertObj.SOPs[0].ExecuteAutomation!='RT')
	  	  	      								{
	  	  	      									CreateJobEvent(req,res,jobEventObj,alert._id,choreographEventObj);
	  	  	      								}
	  	  	      								else
	  	  	      								{
	  	  	      									logger.info('enterd into choriograph declare point============ >');
	  	  	      									logger.info(choreographEventObj);
	  	  	      									CreateChoreograph(req,res,choreographEventObj);
	  	  	      								}
  	      									}
  	      									else
  	      									{
  	      										res.status(400).send('wrong SOP type');
  	      									} 
  	      								
  	      							//choreographEventObj
  	      								
  	      								
  	      							}
  	      						});
  	      						
  	      					}
  	      				}
	      	        }else {
	      	        	//logger.info("application not found");
	      		        //return res.send("application not found");
	      	        	var msgJson=msg.successMessage("CreateSop","1","Application not found","Application not found",{});
						return res.status(400).send(msgJson);
	      		    }
	      	      } else {
	      	        logger.info(err);
	      	        logger.info("err application Id = "+ account._id);
	      	        //return res.send("application not found");
	      	        var msgJson=msg.successMessage("CreateSop","1","application not found","application not found",{});
					return res.status(400).send(msgJson);
	      	      }
	      	  });
	        	
	        	//-------
	        	
	        }else {
	        	/*logger.info("account not found");
		        return res.send("account not found");*/
	        	var msgJson=msg.successMessage("CreateSop","1","Account not found","Account not found",{});
				return res.status(400).send(msgJson);
		    }
	      } else {
	        logger.info(err);
	        /*logger.info("err acc Id = "+ account._id);
	        return res.send("account not found");*/
	        var msgJson=msg.successMessage("CreateSop","1","Account not found","Account not found",{});
			return res.status(400).send(msgJson);
	      }
	  });
	
	logger.debug("checkAccount = "+checkAccount);
}


/**
 * Description : create sop job event while creating sop with job schedular.
 * 					This function is caliing from CreateSOP
 * Parameter : req,res,job event json,alert id of a specific alert)
 */
function CreateJobEvent(req,res,jobEventObj,alertid,choreographEventObj){
	
	logger.info('cpme to jon event section ============>');
	logger.info(choreographEventObj);
	if(!choreographEventObj)
	{
		logger.info('My alert id =========> '+alertid);
		logger.info('JobEventObj Details===========>');
		logger.info(jobEventObj);
		
		var jobevent = new JOBEventsModel({
			  	jobName : (jobEventObj.jobName).trim(),
				jobDetails:jobEventObj.jobDetails,
				alertId: alertid,
			    cronExpression: jobEventObj.cronExpression,
			    active: jobEventObj.active,
			    timeZone: jobEventObj.timeZone,
			    trashed:'n',
			    updateTimestamp:new Date().toISOString(),

		    });
		jobevent.save(function (err) {
		    if (err) {
		    	var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
		    	//return res.status(500).send(err);
		    } else {
		    		var userMessage=userMsg.sopNewSOPAdded;
		    		var msgJson=msg.successMessage("CreateSop","0",userMessage,userMessage,{});
			    	return res.status(200).send(msgJson);
					//return res.status(200).send(userMessage);
		          
		    }
		  });
	}
	else
		{
			logger.info('comes here=================================>');
			CreateChoreograph(req,res,choreographEventObj);
		}
	
	
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
					logger.info("saving alert==========> = "+choriograph);
					var userMessage=userMsg.sopNewSOPAdded;
					//return res.status(200).send(userMessage);
					var msgJson=msg.successMessage("CreateSop","0",userMessage,userMessage,{});
					return res.status(200).send(msgJson);
				
				
			}
		});
		
}


/**
 * url :/rest/v1/sopmeta/CreateSOP
 * Description :Create a new SOP record.
 * Method : POST
 */
exports.CreateSOP = function (req, res){
	
	var accountId = req.query.accountId;
	var applicationId = req.query.applicationId;
	
	AlertModel.findOne({"alertName":req.body.Alerts[0].alertName,"accountID":accountId,"applicationID":applicationId}).lean().exec(function (err, alrt) {
		if(err)
			{
				//res.status(500).send(err)
			var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	return;
			}
		else if(!alrt)
			{
				var IncommingfileName;
				sopEntry(req, res,IncommingfileName);
			}
		else
			{
				logger.info('Already the alert exists------------------->');
				
				//return res.status(400).send(userMessage);
				if(alrt.trashed=='n')
					{
					var userMessage=userMsg.sopDuplicateSOP;
		    		var msgJson=msg.successMessage("CreateSop","0",userMessage,userMessage,{});
			    	return res.status(400).send(msgJson);
					}
				else
					{
					var obj={};
					obj.applicationID= alrt.applicationID;
				    obj.accountID=alrt.accountID;
				    obj.id=alrt._id;
					var userMessage=userMsg.sopDuplicateSOP;
		    		var msgJson=msg.successMessage("CreateSop","0",userMessage,'trashedData',obj);
			    	return res.status(400).send(msgJson);
					}
				
			}
	});

	
}



/*exports.upload = function (req, res){
	
	logger.info('Arijit Chatterjee File Upload testing');
	
	//-------------storing file to DB using Grid-----------
	
	var fileArr = req.body.Alerts[0].SOPs[0].TaskExecutionFlows[0].TaskMasters[0].FileData;
	logger.info('Check incomming file');
	logger.info(fileArr);
    Grid = mongo.Grid;

  // Connect to the db
    
    MongoClient.connect (mongodb_uri, function(err, db) {

    var grid = new Grid(db, 'fs');
    grid.put(b, {metadata:{category:'text'}, content_type: 'text'}, function(err, fileInfo) {
      if(!err) {
        logger.info("Finished writing file to Mongo");
        return res.status(200).send('File upload complete successfully');
      }
    });
    });
    
    //----------------

    
	
	
}*/


/**
 * Description :This function is used to download a file,
 */
exports.download = function (req, res){
	var fs=require('fs');
	//var Grid = require('gridfs-stream');
	//var gfs = new Grid(mongoose.connection.db, mongoose.mongo);
	//var fs_write_stream = fs.createWriteStream('cors.txt');
	
	logger.info(req.query.fileName);
	//read from mongodb
	var readstream = gfs.createReadStream({filename: req.query.fileName});
	logger.info(readstream);
	
	//Get Readstream code here
	var mime = require('mime');
    var mimetype = mime.lookup(req.query.fileName);

    res.setHeader('Content-disposition', 'attachment; filename=' + req.query.fileName);
    res.setHeader('Content-type', mimetype);
    
	//readstream.pipe(fs_write_stream);
	readstream.pipe(res);
}


/**
 * Description :This function is used to update a specific sop record.This method is calling
 * 					from UpdateSOP.
 * Parameter : req,res,uploaded file name.
 */
function sopUpdate(req, res){}


/**
 * Description :This function is used to update sopjob event is reuird which is associated with any specific sop.
 * Parameter : req,res,job event updated json,alert id.
 */
function UpdateSopJobEvent(req,res,jobEventObj,alertid,choreographObj){
	logger.info("Lets Check that what happen here================>");
	logger.info(jobEventObj);
	
	if(!choreographObj)
	{
		if(jobEventObj._id=='')
		{
			logger.info('2222222222222222222222222222222222222222222222222222222');
			logger.info(alertid);
			delete jobEventObj._id;
			logger.info(jobEventObj);
			CreateJobEvent(req,res,jobEventObj,alertid);
		}
	else
		{
		JOBEventsModel.findById(jobEventObj._id, function (err, sopjobevent) {
			
			if(err)
				{
					logger.info('Error in job event update ...'+err);
					//res.status(500).send(err);
					var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
			    	return;
				}
			else if(!sopjobevent)
				{
					res.status(400).send('No Job event Available');
				}
			else
				{
					sopjobevent.jobName=(jobEventObj.jobName).trim();
					sopjobevent.jobDetails=jobEventObj.jobDetails;
					sopjobevent.alertId=jobEventObj.alertId;
					sopjobevent.cronExpression=jobEventObj.cronExpression;
					sopjobevent.active=jobEventObj.active;
					sopjobevent.timeZone=jobEventObj.timeZone;
					sopjobevent.updateTimestamp=new Date().toISOString();
					sopjobevent.updatedByUserId= jobEventObj.updatedByUserId;
					sopjobevent.updateComment=jobEventObj.updateComment;
				 
					 sopjobevent.save(function (err) {
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
	}
	else
	{
		UpdateChoreograph(req,res,alertId,choreographObj);
	}
	
}


function UpdateChoreograph(req,res,alertId,choreographObj){

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
				//choreoevent.SOPID=choreographObj.SOPID;
				//choreoevent.SOPName=choreographObj.SOPName;
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


/**
 * Description :General function to return back index posion .
 */
function getPositionValue(accountArray,accountID)
{
	var position=-1;
	logger.info('UserAccount Details===================>');
	logger.info(accountArray);
	logger.info('Application Account ID================>');
	logger.info(accountID);
	for(var i=0;i<accountArray.length;i++)
		{
			if(accountArray[i].accountId==accountID)
				{
					position=i;
					break;
				}
		}
	return(position);
}


/**
  * Description :This function is used to update user access deails.This function is calling from 
  * 				updateSOP service.
 */
function updateUserAccess(req,res,users)
{
	var account=users.account;
	logger.info('The account details');
	logger.info(account);
	var uid=users._id;
	
	UsersAccessModel.findById(uid, function (err, user){
		 user.account= users.account;
		 
			 user.save(function (err) {
			      if (err) {
			    	  /*logger.info("My Error "+err);
				    	//return res.status(500).send(err);
			    	  throw new Error('DBError');*/
			    	  var errorCode=errorcodes["DBError"];
				    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
				    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
				    	return;
			      } else {
			    	  
			          var msgJson=msg.successMessage("UpdateUser","0","UsersAccess details updated successfully","UsersAccess details updated successfully",user);
			    	  return res.status(200).send(msgJson);
			      }
			    });
			 
		  
	  });
}


/**
 * url :/rest/v1/sopmeta/searchByText
 * Description : Search by wild characters for finding proper alert.
 * Method : GET
 */
exports.searchByText = function (req, res){
	
	var searchCriteria=(req.query.searchCriteria).trim();
	logger.info('Search Criteria=====>'+searchCriteria);
	var regJson;
	var finalSearchResult=[];
	var arrList=[];
	
	if(searchCriteria.charAt(0)=='"' && searchCriteria.charAt(searchCriteria.length-1)=='"')
		{
			var tempcriteria=(searchCriteria.substring(1,searchCriteria.length-1)).trim();
			arrList.push(tempcriteria);
			logger.info('11111111111111111111111111111111111111');
			logger.info(arrList);
			search(req, res,arrList,finalSearchResult,0);
		}
	else if(searchCriteria.charAt(0)=='*' && searchCriteria.charAt(searchCriteria.length-1)=='*')
		{
			var tempcriteria=(searchCriteria.substring(1,searchCriteria.length-1)).trim();
			arrList=tempcriteria.split(" ");
			logger.info('222222222222222222222222222');
			search(req, res,arrList,finalSearchResult,0);
		}
	else
		{
			arrList=searchCriteria.split(" ");
			logger.info('3333333333333333333');
			searchNormal(req, res,arrList,finalSearchResult,0);
		}
	
	
	
}


/**
 * Description :If search by text is with * at start and end,calling from search by text service.
 */
function search(req, res,arrList,obj,i)
{
	
	if(i<arrList.length)
		{
			var regFiled=new RegExp('.*'+arrList[i]+'.*');
			regJson = {$regex:regFiled};
			//regJson=(regJson).trim();
			/*logger.info('Search Criteria Exact =====>'+regJson);
			
			logger.info('Commes here...........------..>'+regJson);*/
			var searchObj=[
			               {"alertName":regJson} ,
			               {"alertShortDesc": regJson},
			               {"alertType": regJson},
			               {"applicationName": regJson},
			               {"SOPs.SOPName":regJson},
			               {"SOPs.SOPShortDesc": regJson},
			               {"SOPs.SOPPurpose": regJson},
			               { "SOPs.Classification": regJson},
			               { "SOPs.TaskExecutionFlows.TaskMasters.TaskName":regJson },
			               { "SOPs.TaskExecutionFlows.TaskMasters.TaskOwner":regJson },
			               { "SOPs.TaskExecutionFlows.TaskMasters.TaskExecutionType":regJson },
			               { "SOPs.TaskExecutionFlows.TaskMasters.TaskExecutionOrder":regJson },
			               { "SOPs.TaskExecutionFlows.TaskMasters.jobContext":regJson },
			               { "SOPs.TaskExecutionFlows.TaskMasters.script":regJson }
			               ];
			
				AlertModel.find({ $or: searchObj }).lean().exec(function (err, result) {
				if(err)
					{
						var errorCode=errorcodes["DBError"];
				    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
				    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
				    	return;
					}
				else
					{
					  	for(j=0;j<result.length;j++)
					  		{
					  			var newObj={};
					  			logger.info('REsult of seach shown ============================>');
					  			logger.info(result[j]);
					  			newObj["id"]=result[j]._id;
					  			newObj["alertName"]=result[j].alertName;
					  			newObj["alertShortDesc"]=result[j].alertShortDesc;
					  			newObj["SOPName"]=result[j].SOPs[0].SOPName;
					  			newObj["SOPShortDesc"]=result[j].SOPs[0].SOPShortDesc;
					  			newObj["applicationID"]=result[j].applicationID;
					  			newObj["accountID"]=result[j].accountID;
					  			//obj.push(result[j]);
					  			obj.push(newObj);
					  		}
					  	i=i+1;
						search(req, res,arrList,obj,i);
					}
			});
		}
	else
		{
			var msgJson=msg.successMessage("searchByText","0","Displaying the searching details....","Displaying the searching details....",obj);
			return res.status(200).send(msgJson);
		}
	
}


/**
 * Description : Calling from searchByText service in case of normal search.
 */
function searchNormal(req, res,arrList,obj,i)
{
	
	if(i<arrList.length)
		{
			//var regFiled=new RegExp('.*'+arrList[i]+'.*');
			regJson = (arrList[i]).trim();
			/*logger.info('Search Criteria Exact =====>'+regJson);
			
			logger.info('Commes here...........------..>'+regJson);*/
			var searchObj=[
			               {"alertName":regJson} ,
			               {"alertShortDesc": regJson},
			               {"alertType": regJson},
			               {"applicationName": regJson},
			               {"SOPs.SOPName":regJson},
			               {"SOPs.SOPShortDesc": regJson},
			               {"SOPs.SOPPurpose": regJson},
			               { "SOPs.Classification": regJson},
			               { "SOPs.TaskExecutionFlows.TaskMasters.TaskName":regJson },
			               { "SOPs.TaskExecutionFlows.TaskMasters.TaskOwner":regJson },
			               { "SOPs.TaskExecutionFlows.TaskMasters.TaskExecutionType":regJson },
			               { "SOPs.TaskExecutionFlows.TaskMasters.TaskExecutionOrder":regJson },
			               { "SOPs.TaskExecutionFlows.TaskMasters.jobContext":regJson },
			               { "SOPs.TaskExecutionFlows.TaskMasters.script":regJson }
			               ];
			
				AlertModel.find({ $or: searchObj }).lean().exec(function (err, result) {
				if(err)
					{
						var errorCode=errorcodes["DBError"];
				    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
				    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
				    	return;
					}
				else
					{
					  	for(j=0;j<result.length;j++)
					  		{
					  		var newObj={};
				  			logger.info('REsult of seach shown ============================>');
				  			logger.info(result[j]);
				  			newObj["id"]=result[j]._id;
				  			newObj["alertName"]=result[j].alertName;
				  			newObj["alertShortDesc"]=result[j].alertShortDesc;
				  			newObj["SOPName"]=result[j].SOPs[0].SOPName;
				  			newObj["SOPShortDesc"]=result[j].SOPs[0].SOPShortDesc;
				  			newObj["applicationID"]=result[j].applicationID;
				  			newObj["accountID"]=result[j].accountID;
				  			//obj.push(result[j]);
				  			obj.push(newObj);
					  		}
					  	i=i+1;
						search(req, res,arrList,obj,i);
					}
			});
		}
	else
		{
			var msgJson=msg.successMessage("searchByText","0","Displaying the searching details....","Displaying the searching details....",obj);
			return res.status(200).send(msgJson);
		}
	
}


/**
 * url :/rest/v1/sopmeta/searchByQuery
 * Description :This service is used to search desired alert based on diffent seacrch criteria.
 * Method :GET
 */
exports.searchByQuery = function (req, res){
	
	var sopnameTemp=req.query.sopname;
	var alertnameTemp=req.query.alertname;
	var tasknameTemp=req.query.taskname;
	var alertSeverity=req.query.alertSeverity;

    var qry="";
    if(sopnameTemp!=undefined)
    {
      var sopname=sopnameTemp.trim();
      qry+='"SOPs.SOPName":"'+sopname+'"';
    }
    if(alertnameTemp!=undefined)
    {
      var alertname=alertnameTemp.trim();
      if(qry!="")
        qry+=',';
         qry+='"alertName":"'+alertname+'"';
    }
    if(tasknameTemp!=undefined)
    {
    	var taskname=tasknameTemp.trim();
      if(qry!="")
        qry+=',';
         qry+='"SOPs.TaskExecutionFlows.TaskMasters.TaskName":"'+taskname+'"';
    }
    
    if(alertSeverity!=undefined)
    {
      if(qry!="")
        qry+=',';
         qry+='"alertSeverity":"'+alertSeverity+'"';
    }    
    qry='{'+qry+'}'
    
    logger.info('query ====== > '+qry);
    var obj = JSON.parse(qry);
    AlertModel.find(obj).exec(function(err, result) {
      if(err)
        {
    	  	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	return;
        }
      else
      {
    	  var objArr=[];
    	  for(j=0;j<result.length;j++)
	  		{
	  		var newObj={};
			logger.info('REsult of seach shown ============================>');
			logger.info(result[j]);
			newObj["id"]=result[j]._id;
			newObj["alertName"]=result[j].alertName;
			newObj["alertShortDesc"]=result[j].alertShortDesc;
			newObj["SOPName"]=result[j].SOPs[0].SOPName;
			newObj["SOPShortDesc"]=result[j].SOPs[0].SOPShortDesc;
			newObj["applicationID"]=result[j].applicationID;
			newObj["accountID"]=result[j].accountID;
			//obj.push(result[j]);
			objArr.push(newObj);
	  		}
    	  var msgJson=msg.successMessage("searchByQuery","0","Displaying the searching details....","Displaying the searching details....",objArr);
    	  return res.status(200).send(msgJson);
      }
    });
}


/**
 * url :/rest/v1/sopmeta/saveSearch
 * Description :This service is used to save any search that we want to make the search condition to be used further.
 * Method :POST
 */
exports.saveSearch= function (req, res){
	
	var eventType = req.params.eventtype;
	SavedSearchModel.findOne({"searchname":req.body.searchname}).lean().exec(function (err, savesearch) {
		if(err)
			{
				//res.status(500).send(err);
				var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else if(!savesearch)
			{
			var savedsearch = new SavedSearchModel({
				//_id: mongoose.Types.ObjectId(),
				searchname: req.body.searchname,
				searchType:req.body.searchType,
				searchQuery:req.body.searchQuery,
				createdByUserId: req.body.createdByUserId,
				createTimestamp:new Date().toISOString(),
				updateTimestamp:new Date().toISOString(),
				eventType:eventType,
				/*updatedByUserId: req.body.updatedByUserId, 
				updateComment: req.body.updateComment,*/
				  
			    });
			
			savedsearch.save(function (err) {
			    if (err) { 	
			    	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
			    	return;
			    } else {
			    	var userMessage=userMsg.sopSavedSearch;
			    	var msgJson=msg.successMessage("SavedSearch","0",userMessage,userMessage,savesearch);
			    	return res.status(200).send(msgJson);
			    	
			    }
			  });
			}
		else
			{
				var userMessage=userMsg.sopSavedSearchDuplicate;
		    	var msgJson=msg.successMessage("SavedSearch","1",userMessage,userMessage,{});
		    	return res.status(400).send(msgJson);
			}
	});
	  
}

/**
 * url :/rest/v1/sopmeta/deleteSaveSearch
 * Description :This service is used to delete the save search.
 * Method :DELETE
 */
exports.deleteSaveSearch= function (req, res){
	SavedSearchModel.findById(req.query.Id, function (err, savesearch) {
	      if(err)
	      {
	        logger.info(err);
	        var errorCode=errorcodes["DBError"];
	        res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	        internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	        return;
	      }
	      else if(!savesearch)
	      {
	          var errorCode=errorcodes["SaveSearchInvalid"];
	          res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	          internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	          return;
	      }
	      else
	    	  {
	    	  	savesearch.remove(function (err) {
		            if (err) {
		            	var errorCode=errorcodes["DBError"];
		    	        res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	        internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	        return;
		            	
		            } else {
			  	        var msgJson=msg.successMessage("DeleteSaveSearch","0","Saved search deleted successfully","Saved search deleted successfully",{});
			  	    	  return res.status(200).send(msgJson);
		            }
		            
		          });
	    	  }
	});
}

/**
 * url :/rest/v1/sopmeta/getSavedSearch
 * Description :This service is used to get the specific saved search record.
 * Method : GET
 */
exports.getSavedSearch= function (req, res){
	SavedSearchModel.findById(req.query.Id, function (err, savesearch) {
	      if(err)
	      {
	        logger.info(err);
	        var errorCode=errorcodes["DBError"];
	        res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	        internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	        return;
	      }
	      else if(!savesearch)
	      {
	          var errorCode=errorcodes["SaveSearchInvalid"];
	          res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	          internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	          return;
	      }
	      else
	    	  {
		    	  var msgJson=msg.successMessage("getSavedSearch","0","Details of Saved search ","Details of Saved search ",savesearch);
	  	    	  return res.status(200).send(msgJson);
	    	  }
	});
}


/**
 * url :/rest/v1/sopmeta/getAllSavedSearch
 * Description :This service is used to get the list of saved search record.
 * Method : GET
 */
exports.getAllSavedSearch= function (req, res){
	
	var username=req.query.createdByUserId;
	logger.info('Username===============> '+username);
	SavedSearchModel.find({"createdByUserId":username}).lean().exec(function (err, savesearch) {
		if(err)
			{
				//res.status(500).send(err);
				var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else
			{
			  var msgJson=msg.successMessage("getAllSavedSearch","0","Details of all Saved search ","Details of all Saved search ",savesearch);
	    	  return res.status(200).send(msgJson);
			}
	});
}


/**
 * url :/rest/v1/sopmeta/updateSavedSearch
 * Description :This service is used to update any specific saved search.
 * Method : PUT
 */
exports.updateSavedSearch= function (req, res){
	
	SavedSearchModel.findById(req.query.Id, function (err, savesearch) {
		if(err)
			{
				var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else if(!savesearch)
			{
			  var errorCode=errorcodes["SaveSearchInvalid"];
	          res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	          internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	          return;
			}
		else
			{
			var oldtimestamp=req.body.updateTimestamp;
			 logger.info('request body ------------------------'+oldtimestamp);
			 var newtimestamp=savesearch.updateTimestamp.toISOString();
			 logger.info('user fetch ==========================='+newtimestamp);
			 logger.info('current Date '+new Date().toISOString());
			 
			 //savesearch.searchname: req.body.searchname,
			 savesearch.searchType=(req.body.searchType).trim();
			 savesearch.searchQuery=(req.body.searchQuery).trim();
			 //savesearch.createdByUserId: req.body.createdByUserId,
			 //savesearch.createTimestamp:new Date().toISOString(),
			 savesearch.updateTimestamp=new Date().toISOString();
			 savesearch.updatedByUserId=req.body.updatedByUserId;
			 savesearch.updateComment=req.body.updateComment;
			
			
			if(oldtimestamp==newtimestamp)
			 {
				savesearch.save(function (err) {
				      if (err) {
				    	  var errorCode=errorcodes["DBError"];
					    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
					    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
					    	return;
				      } else {
				          var msgJson=msg.successMessage("updateSavedSearch","0","updateSavedSearch updated successfully","updateSavedSearch updated successfully",savesearch);
				    	  return res.status(200).send(msgJson);
				      }
				    });
			 }
		 else
			 {
			 var userMessage=userMsg.updateSavedSearchConflict;
			  var obj={};
			  var msgJson=msg.successMessage("updateSavedSearch","1",userMessage,userMessage,obj);
			  return res.status(400).send(msgJson);
			 }
			}
		
	  });
}

/**
 * url :/rest/v1/sopmeta/conversion/:outputType
 * Description :Conversion from json to xml or xml to json
 */
exports.conversion= function (req, res){
	var obj=req.body.input;
	logger.info('BODY ============>');
	logger.info(obj);
	
	var outputType=req.params.outputType;
	logger.info('Output parameter ============>');
	logger.info(outputType);
	
	if(outputType=='json')
		{
			logger.info('This is json output area');
			var parseString = require('xml2js').parseString;
			//var xml = "<root>Hello xml2js!</root>"
			var xml = obj;
			parseString(xml, function (err, result) {
				if(err)
					{
						logger.info('error occured =======> '+err);
						res.status(500).send(err);
					}
				else
					{
						logger.info('Success occured =======> '+err);
						logger.info(result);
						res.status(200).send(result);
					}
			    
			});
		}
	else if(outputType=='xml')
		{
			logger.info('This is xml output area');
			var xml2js = require('xml2js');
			//var obj = {name: "Super", Surname: "Man", age: 23};
			var jsonObj = obj;
			var builder = new xml2js.Builder();
			var xml = builder.buildObject(jsonObj);
			logger.info(xml);
			res.status(200).send(xml);
		}
	else
		{
			res.status(400).send('Wrong output type');
		}
	
	
	
	//================xmlTojson=================================================
	
	/*var parseString = require('xml2js').parseString;
	var xml = "<root>Hello xml2js!</root>"
	parseString(xml, function (err, result) {
		if(err)
			{
				logger.info('error occured =======> '+err);
				res.status(500).send(err);
			}
		else
			{
				logger.info('Success occured =======> '+err);
				logger.info(result);
				res.status(200).send(result);
			}
	    
	});*/
	
	//================jsonToxml=================================================
	
	
	/*var xml2js = require('xml2js');
	var obj = {name: "Super", Surname: "Man", age: 23};
	var builder = new xml2js.Builder();
	var xml = builder.buildObject(obj);
	
	logger.info(xml);
	res.status(200).send(xml);*/
	
	
	
}


/**
 * url :/rest/v1/sopmeta/getBPAutomataOperations
 * Description :Populate the list of Blueprism automata operation process.
 * Method :GET
 */
exports.getBPAutomataOperations= function (req, res){
	
	logger.info('Service hit====================>');
	var AutomataProvider=req.body.AutomataProvider;
	var ClientName=req.body.ClientName;
	var AccountName=req.body.AccountName;
	
	var arr=[];
	var getArray=[];
	logger.info(AutomataProvider);
	logger.info(ClientName);
	logger.info(AccountName);
	logger.info('ARijit Chatterjee=====================>');
	

	if(AutomataProvider=='blueprism')
		{
		var data=automationAdapter.adapters.BluePrismAdapter.connections;

		//var clnt=ClientName+'.'+AccountName;
		//logger.info('Client==============> '+clnt);
		var indexValue=0;
		for(var i=0;i<data.length;i++)
		{
			console.log('for i===== >'+i+' client name=== > '+data[i].connection.connectionProperties.client);
			console.log('for i===== >'+i+' client name=== > '+ data[i].connection.connectionProperties.account);
			console.log(ClientName);
			console.log(AccountName);
		  if(data[i].connection.connectionProperties.client==ClientName && data[i].connection.connectionProperties.account==AccountName)
		          {
		            indexValue=i;
		            console.log('Makin i ==============  >>>> '+i);
		            break;
		          }
		}
			console.log('Index value ================> '+indexValue);
			

			//logger.info('qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq====');
			getArray=automationAdapter.adapters.BluePrismAdapter.connections[indexValue].connection.automationProcesses;
			logger.info(getArray);
		}
	else
		{
			logger.info('ttttttttttttttttttttttttttttttttttttttttttttttt==');
			getArray=automationAdapter.adapters.IPSoftAdapter.connections[0].connection.connectionProperties.automationProcesses;
		}
	
		res.status(200).send(getArray);	
}


/**
 * url :/rest/v1/sopmeta/generateAutomataServiceRequest
 * Description :This service is used to generate the request parameter json from the blueprism wsdl link.
 * Method : POST
 */
exports.generateAutomataServiceRequest= function (req, res){
	//console.log('Arijit Chatterjee ================+++++++++++++++++++++++++++9103');
	var AutomataProvider=req.body.AutomataProvider;
	var ClientName=req.body.ClientName;
	var AccountName=req.body.AccountName;
	var processName=req.body.processName;
	
	var getArray=[];
	
	logger.info('AutomataProvider=======>  '+AutomataProvider);
	logger.info('Client name =======> '+ClientName);
	logger.info('Account Name ==========> '+AccountName);
	logger.info('Process Name =========> '+processName);
	
	

	if(AutomataProvider=='blueprism')
	{
		
		var data=automationAdapter.adapters.BluePrismAdapter.connections;
		var indexPosition;
		for(i=0;i<data.length;i++)
		{
		  if(data[i].connection.connectionProperties.client==ClientName && data[i].connection.connectionProperties.account==AccountName)
		          {
			  		indexPosition=i;
		            break;
		          }
		}
		var indexValue;

		getArray=automationAdapter.adapters.BluePrismAdapter.connections[indexPosition].connection.automationProcesses;
		//console.log(getArray);
		logger.info('processName ============= >'+processName);
		
		for(i=0;i<getArray.length;i++)
			{
			
			logger.info('Operation name === '+getArray[i].operation+'  for i== '+i);
				if(getArray[i].operation==processName)
					{
						indexValue=i;
						break;
					}
			}
		
		//console.log('Index value -------------> '+indexValue);

		var protocol= automationAdapter.adapters.BluePrismAdapter.connections[indexPosition].connection.connectionProperties.protocol;
        var host=automationAdapter.adapters.BluePrismAdapter.connections[indexPosition].connection.connectionProperties.host;
        var port=automationAdapter.adapters.BluePrismAdapter.connections[indexPosition].connection.connectionProperties.port;
        
        /*console.log('Protocol======> '+protocol);
        console.log('Host=========> '+host);
        console.log('port========= > '+port);*/
        
		var ipaddress=protocol+'://'+host;
		if(port!='')
			ipaddress+=':'+port;
		var wsdlLocation=getArray[indexValue].wsdlLocation;
		//console.log('wsdl =============> '+wsdlLocation);
		var url=ipaddress+wsdlLocation;

		//console.log('QWERTY+++++++++++++++++++++++++++++++++++');
		logger.info('URL of the wsdl ================> '+url);
		var soap = require('soap');
		
		soap.createClient(url, function(err, client) {
		    if(err)
		    {
		    	logger.info('Error Occured ========================>9104');
		    	logger.info(err);
		    	var errorCode=errorcodes["generateAutomataServiceError"];
		          res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		          internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		          return;
		    }
		    else
		    {
		
		   	var operation=processName+'Request';
		   	
		   	logger.info('Operation name : '+operation);
		   	
		    	var requiredJson=client.wsdl.definitions.messages[operation].parts;
		    	var keyArray= Object.keys(requiredJson);
			    var newJson={};
			    for(i=0;i<keyArray.length;i++)
			    {
			      var keyname=keyArray[i];
			      newJson[keyname]='??';
			    }
			    
			    logger.info(newJson);
			    
			    res.send(newJson);
		    	//res.send(requiredJson);
		   
		    }
		      
		  });	
	}
else
	{
		res.status(400).send('Please check the provider you have selected !');
	}
}


/**
 * url :/rest/v1/sopmeta/getClientfromAccount
 * Description :This service is used to get the client details from a specific account record.
 * Method : GET
 */
exports.getClientfromAccount= function (req, res){
	 
	var accountName=(req.query.accountName).trim();
	
	AccountsModel.findOne({"accountName":accountName,"trashed": 'n'}).lean().exec(function(err, acc) {
	      if(err)
	        {
	    	  	var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else if(!acc)
	      { 
	    	  var errorCode=errorcodes["AccountIdInvalid"];
	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    		return;
	      }
	      else
	    	  {
	    	  	var clientName=acc.clientName;
	    	  	
	    	  	//*******************************************************************************8
	    	  	ClientsModel.findOne({"clientName":clientName,"trashed": 'n'}).lean().exec(function (err, clnt) {
	    			if(err)
	    				{
	    					//res.status(500).send(err);
	    					var errorCode=errorcodes["DBError"];
	    			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    			    	return;
	    				}
	    			else if(!clnt)
	    		      { 
	    		    	  var errorCode=errorcodes["ClientIdInvalid"];
	    		    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    		    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    		    		return;
	    		      }
	    			else
	    				{
	    					var obj={};
	    					obj["accId"]=acc._id;
	    					obj["accountName"]=acc.accountName;
	    					obj["clientid"]=clnt._id;
	    					obj["clientName"]=clnt.clientName;
	    					
	    					var msgJson=msg.successMessage("getClientfromAccount","0","Success","Success",obj);
	    					  return res.status(200).send(msgJson);
	    					
	    				}
	    	  	});
	    	  	
	    	  	//**********************************************************************************8
	    	  	
	    	  }
	});
}







exports.getAllSops= function (req, res){
	
	var accountId=req.query.accountId;

	async.waterfall([
        fromAlertSop(req,accountId),
        fromTicketSop
    ], function (error, successResult) {
        if (error) 
        	{ 
        		logger.info('Something is wrong!'); 
        		var errorCode=errorcodes["DBError"];
				res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
				internalMessage:err,userMessage:errorCode.userMessage,response:{}});
				return;
        	}
        else
        	{
        		var userMessage='Retrive all sops';
        		//return res.status(200).send(userMessage);
        		var msgJson=msg.successMessage("CreateSop","0",userMessage,userMessage,successResult);
        		return res.status(200).send(msgJson);
        	}
        //return res.send(success);
    });
	
}


function fromAlertSop (req,accountId) {

	//logger.info('step 11111===============> ');
	//logger.info('account id ======= >'+accountId);
	
    return function (callback) {
       /* var something = req.body;
        callback (null, something);*/
        AlertModel.find({"accountID":accountId,"trashed": 'n','SOPs.SOPType':'S'}).exec(function (err, alerts) {
        if (err) {       
          logger.info("My Error "+err);
          //return res.status(500).send(err);
        }
        /*else if(alerts.length==0){
            logger.info("My Error length is zero "+err);
            //return res.status(404).send('No alert list found');
        } */ 
        else
        {
        	//logger.info('Arijit Step 3 =================');
        	var arr=[];
        	for(var i=0;i<alerts.length;i++)
        	{
        		var obj={};
        		obj["SOPID"]=alerts[i].SOPs[0].SOPID;
        		obj["_id"]=alerts[i].SOPs[0]._id;
        		obj["SOPName"]=alerts[i].SOPs[0].SOPName;
        		obj["alertId"]=alerts[i].SOPs[0].alertId;
        		obj["AutomationProvider"]=alerts[i].SOPs[0].AutomationProvider;
        		obj["AutomationOutput"]=alerts[i].SOPs[0].AutomationOutput;
        		obj["AutomationInput"]=alerts[i].SOPs[0].AutomationInput;
        		obj["activeMode"]=alerts[i].SOPs[0].activeMode;
        		obj["EventType"]="alert";
        		
        		arr.push(obj);
        	}
            callback(null, arr,accountId);
            //return(null, alerts);
        }
      });
   }
}

function fromTicketSop (arr, accountId,callback) {

	//logger.info('Now comming to function 2============>');
	//logger.info(arr);
	//logger.info('Account id ======== > '+accountId);
    //return function (callback) {
       /*var somethingelse = function () { // do something here };
       callback (err, somethingelse);
    }*/

    SOPModel.find({"account" : accountId,"trashed" : 'n',SOPType:'S'}).exec(function(err, ticketsop) {
			if (err) 
			{
				logger.info('1002-Error in Ticket Entry function =======================');
				logger.info(err);
			} 
			else {
					var arrTicket=[];
		        	for(var i=0;i<ticketsop.length;i++)
		        	{
		        		var obj={};
		        		obj["SOPID"]=ticketsop[i]._id;
		        		obj["_id"]=ticketsop[i]._id;
		        		obj["SOPName"]=ticketsop[i].SOPName;
		        		obj["alertId"]=ticketsop[i].alertId;
		        		obj["AutomationProvider"]=ticketsop[i].AutomationProvider;
		        		obj["AutomationOutput"]=ticketsop[i].AutomationOutput;
		        		obj["AutomationInput"]=ticketsop[i].AutomationInput;
		        		obj["activeMode"]=ticketsop[i].activeMode;
		        		obj["EventType"]="ticket";
		        		arrTicket.push(obj);
		        	}

        			/*logger.info('qwerty==================================');
					logger.info(ticketsop);*/
					var aa=arr.concat(arrTicket);
					callback (err, aa);

				}
		});
	//}
}

exports.getOutputAutomation= function (req, res){
	
	var sopId=req.query.sopId;
	var eventType = req.params.eventtype;

	logger.info('sopid === > '+sopId+'   eventtype==== > '+eventType)
	if(eventType=='alert')
	{
		logger.info('Alert section ==============>');
		_fromalertSop(req, res,sopId);
	}
	else if(eventType=='ticket')
	{
		_fromTicketSop(req, res,sopId);
	}
	else
	{
		res.status(400).send('Some wrong input=============>');
	}

	
	
}


function _fromalertSop(req, res,sopId)
{

	logger.info('alert section function=====================');  
	logger.info('sopid _____'+sopId);

	AlertModel.findOne({"SOPs.SOPID":sopId,"trashed": 'n','SOPs.SOPType':'S'}).exec(function (err, alerts) {
        if (err) {       
          logger.info("My Error "+err);
          //return res.status(500).send(err);
        }
        else if(alerts.length==0){
            logger.info("My Error length is zero "+err);
            //return res.status(404).send('No alert list found');
        }  
        else
        {
        	logger.info('Arijit Step 3 =================');
        	var obj={};
        	obj["AutomationOutput"]=alerts.SOPs[0].AutomationOutput;
        	obj["AutomationProvider"]=alerts.SOPs[0].AutomationProvider;
        	
        	res.status(200).send(obj);
        }
      });
}


function _fromTicketSop(req, res,sopId)
{

	logger.info('Comes to ticket block==============>');
	SOPModel.findOne({"_id" : sopId,"trashed" : 'n',"SOPType":'S'}).exec(function(err, ticketsop) {
		if (err) 
		{
			logger.info('1002-Error in Ticket Entry function =======================');
			logger.info(err);
		}
		else if (ticketsop.length==0){
            logger.info("My Error length is zero "+err);
            //return res.status(404).send('No alert list found');
        }  
		else {
			logger.info('Arijit Step 4 =================');
			var obj={};
        	obj["AutomationOutput"]=ticketsop.AutomationOutput;
        	obj["AutomationProvider"]=ticketsop.AutomationProvider;
        	
        	res.status(200).send(obj);
			}
	});
}


exports.UpdateSOPActiveStatus = function (req, res){
	
	var eventType = req.params.eventtype;
	var sopid=req.params.sopid;
	
	if(eventType=='alert')
	{
		AlertModel.findOne({ 'SOPs._id': sopid},function(err, result) {
		    if (err)
		    	res.status(500).send(err);
		    else
			{
				result.SOPs[0].activeMode='y';
				result.save(function (err) {
				      if (err) {
				    	 res.status(500).send(' Eorror -----------   '+err);
				      } else {
				          
				    	  return res.status(200).send('Active Mode Changed....');
				      }
				    });
			}
		});
	}
	else if(eventType=='ticket')
	{
		SOPModel.findOne({ '_id': sopid},function(err, result) {
		    if (err)
		    	res.status(500).send(err);
		    else
			{
				result.activeMode='y';
				result.save(function (err) {
				      if (err) {
				    	 res.status(500).send(' Eorror in ticket system -----------   '+err);
				      } else {
				          
				    	  return res.status(200).send('Active Mode Changed....');
				      }
				    });
			}
		});
	}
	else
		res.status(400).send('Check the event type..');
}



exports.testDBExists = function (req, res){

	ClientsModel.find().exec(function (err, clnt) {

		var result=false;
		if(err)
				{
					//res.status(500).send(err);
					var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
			    	return;
				}
			else
			{
				if(clnt.length==0)
				{
					result=true;
					return res.status(400).send(result);
				}

				return res.status(200).send(result);	
			}
	});
	}


/**
 * Retrieves tickets info from Alert Audit Logs using alertName
 */
exports.fetchAlertInfoNProcess = function(alertName,callback) {
	logger.info("===Inside fetchAlertInfoNProcess====");
	logger.info("::alertName::"+alertName);
	AlertAuditLog.find({
		"alertName" : alertName.trim(),
		"errorType" : "SOPNotDefined"
	}).sort({
		updateTimestamp : -1
	}).lean().exec(
			function(err, result) {
				logger.info("fetchAlertInfoNProcess Query Result::err="+err+" result="+result);
				if (err) {
					logger.error(err);
					callback(err,null);

				} else {
					logger.info("Result::"+JSON.stringify(result));
					var ex_alertArr = [];
					if(result.length>0) {
						for(var index=0 ; index < result.length ; index++){
							var ex_alert = result[index];//Need to setup the structure
							logger.info(" To be processed alertId ::"+ex_alert._id);
							ex_alertArr.push(ex_alert);
						}
					   
					}
					callback(null,ex_alertArr);
				}
			});

	
}


/**
 * Process the alerts linked with the SOP and change their state from 'InActiveSOP'  to appropriate activity status.
 * 
 * Alerts that are not processed due to unavailability of appropriate active SOPS
 * need to be processed once appropriate SOP is created and activated for the same.
 * This method iterates through all the alerts linked with the SOP and and push them into the processing queue
 * such that they can be addressed appropriately by the automation engine.
 * 
 */

exports.processSOPLinkedAlerts = function(linkedMainAlert) {
	logger.info("===inside processSOPLinkedAlerts::"+linkedMainAlert);
	var alertName = linkedMainAlert.alertName;
	logger.info("::Processing Unprocessed Alerts with AlertName::"+alertName);
	exports.fetchAlertInfoNProcess(alertName,function(err,ex_AlertArr){
		if(err){
			//Log Error
			logger.error("Error fetching alert info -"+err);
		} else {
			logger.info("fetchAlertInfoNProcess Results obtained::"+ex_AlertArr.length);
			//Invoke ticket processing for the given tickets
			for(var curIndex=0; curIndex < ex_AlertArr.length ; curIndex++){
				var ex_alert = ex_AlertArr[curIndex];
				logger.info ("Started Processing of alert with id -"+ex_alert._id);
				//Call ServiceMonitoring Agent ->processRequest to process all linked unprocessed alerts
				ServiceMonitoringAgent.processRequest(ex_alert,function(err,log_id){
					if(err){
						logger.error("Processing of alert Failed with Error -"+err);
					} else {
						logger.info ("Processing of alert completed auccessfully");
					}
				});
			}
		}
	});
	
	
	
	
}

