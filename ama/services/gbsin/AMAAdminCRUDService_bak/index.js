
/*var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var mongodb_uri;
if (process.env.VCAP_SERVICES) {
	var env = JSON.parse(process.env.VCAP_SERVICES);
	logger.info(JSON.stringify(process.env.VCAP_SERVICES));
	if (env['mongolab'] && env['mongolab'][0]) {
		mongodb_uri = env['mongolab'][0]['credentials']["uri"];
		logger.info("Connected to Bluemix Mongo DB");
	}
}
else {
	mongodb_uri = appProperty['deployment-specific-properties']['ON_PREM'].dbConnectionURL;
	logger.info("Connected to Local Mongo DB")
}
logger.info("DB:" + mongodb_uri);*/

var logger = getLogger("DB");
var appProperty= require('../../../../config/app_config.json');
var appPropertyFileName= ('./config/app_config.json');
var initdbdata=require('../../../../config/DB/initialDBData.json');
var systemEnv= require('../../../../config/system_properties.json');
var SOPConfig= require('../../../../config/SOPConfig.json');
var mappers= require('../../../../config/mapper_config.json');
var mappersFileName= ('./config/mapper_config.json');
var monitoringAdapters= require('../../../../config/adapter_config.json');
var monitoringAdapterFileName= ('./config/adapter_config.json');
var automationAdapters=require('../../../../config/automation_adapter_config.json');
var automationAdapterFileName= ('./config/automation_adapter_config.json');
var messageQueueConfig=require('../../../../config/rabbitmq_config.json');
var messageQueueConfigFileName= ('./config/rabbitmq_config.json');
var mongoose = require('mongoose');

// ----------------------- Start  -----------------
var express = require('express');
var app = express();

var http = require("http");
var fs = require("fs");
var models = require("../../../../models");
var errorcodes = require('../../../../config/errorcodes.json');
var userMsg = require('../../../../config/user_message.json');
var msg = require('../../../../config/message.js');
var mongoose = require('mongoose');
var cors = require('cors');
app.use(cors());


var UsersAccessModel=models.UserAccess;
var RolesModel=models.Role;
var CapabilitiesModel=models.Capability;
var AccountsModel = models.Account;
var ApplicationsModel = models.Application;
var ClientsModel=models.Client;
var UserCredentialModel=models.UserCredential;
var t_AuditLogModel=models.TransactionAuditLog;


var updateFlag=false;


/*exports.Test=function(req,res){
	var aa=msg.successMessage('Asansol');
	logger.info('Test Global message '+ aa);
	return res.status(200).send(aa);
}*/


/**
 * url :/rest/v1/adminmeta/CreateUserAccess
 * Description :Create new record for user access
 * Method : POST
 */
exports.CreateUserAccess = function (req, res){
	
	
	
	//-----------------------------------------------------------------------------------------------
	var uid=(req.body.userID).trim();
	var type=(req.body.type).trim();
	UsersAccessModel.findOne({"userID":uid}).lean().exec(function (err, users) {
	    if (err) {	
	    	//throw new Error('DBError');
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    	//res.status(500).send(err);
	    }
	    else if(!users)
	    	{
	    		if(type=='SuperAdmin')
	    		{
	    			if(SOPConfig.SuperAdminLimit<=5)
	    			{
	    				UsersAccessModel.count({"type":type}).exec(function (err, usersCount) {
		    				if (err) {	
		    			    	//throw new Error('DBError');
		    			    	var errorCode=errorcodes["DBError"];
		    			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    			    	return;
		    			    	//res.status(500).send(err);
		    			    }
		    				else
		    					{
		    						if(usersCount<SOPConfig.SuperAdminLimit)
		    							{
		    								adduser(req,res);
		    							}
		    						else
		    							{
		    								//give message on more users that super admin limit exits.
		    							  var userMessage=userMsg.superUserExceed+" No more users can be given Super Admin role. A max of"+ SOPConfig.SuperAdminLimit +" users can have Super Admin role for a client";
		    					    	  var msgJson=msg.successMessage("CreateUser","1",userMessage,userMessage,{});
		    					    	  return res.status(400).send(msgJson);
		    							}
		    					}
		    			});
	    			}
	    			else
	    			{
	    				   var userMessage=userMsg.superuserNoExcess;
				    	  var msgJson=msg.successMessage("CreateUser","1",userMessage,userMessage,{});
				    	  return res.status(400).send(msgJson);
	    			}
	    			
	    		}
	    		else
	    		{
	    			adduser(req,res);
	    		}
	    	}
	    else {
	    	  var userMessage=userMsg.adminDuplicateUser;
	    	  var msgJson=msg.successMessage("CreateUser","1",userMessage,userMessage,{});
	    	  return res.status(400).send(msgJson);
	    }
	  });
	//------------------------------------------------------------------------------------------------
	
	  
	  //return res.send(user); 	
	}


function adduser(req,res)
{
	var user = new UsersAccessModel({
		//_id: mongoose.Types.ObjectId(),
		  userName: req.body.userName,
		  userID:(req.body.userID).trim(),
		  roleName: (req.body.roleName).trim(), 
		  account: req.body.account, 
		  type: (req.body.type).trim(), 
		  active: req.body.active,
		  email:req.body.email,
		  updateTimestamp:new Date().toISOString(),
		  updatedByUserId: req.body.updatedByUserId, 
		  updateComment: req.body.updateComment,
		  trashed:'n',

	    });
	  user.save(function (err) {
	    if (err) {
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    } else {
	          var msgJson=msg.successMessage("CreateUser","0","UsersAccess details created successfully","UsersAccess details created successfully",user);
	    	  return res.status(200).send(msgJson);
	    }
	  });
}


/**
 * url :/rest/v1/adminmeta/UpdateUserAccess
 * Description :Updatespecific record for user access
 * Method : PUT
 */
exports.UpdateUserAccess = function (req, res){
	 UsersAccessModel.findById(req.query.Id, function (err, user) {
		 var oldtimestamp=req.body.updateTimestamp;
		 logger.info('request body ------------------------'+oldtimestamp);
		 var newtimestamp=user.updateTimestamp.toISOString();
		 logger.info('user fetch ==========================='+newtimestamp);
		 logger.info('current Date '+new Date().toISOString());
		 user.userName=req.body.userName;
		 user.userID=(req.body.userID).trim();
		 user.roleName= (req.body.roleName).trim();
		 user.account= req.body.account;
		 user.type= (req.body.type).trim();
		 user.active=(req.body.active).trim();
		 user.email=(req.body.email).trim();
		 user.updateTimestamp=new Date().toISOString();
		 user.updatedByUserId= req.body.updatedByUserId;
		 user.updateComment=req.body.updateComment;
		 if(oldtimestamp==newtimestamp)
			 {
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
			 }
		 else
			 {
			 
			  var userMessage=userMsg.adminUpdateUserConflict;
			  var obj={};
			  var msgJson=msg.successMessage("UpdateUser","1",userMessage,userMessage,obj);
	    	  return res.status(400).send(msgJson);
			 }
		  
	  });
	}



/**
 * url :/rest/v1/adminmeta/DeleteUserAccess
 * Description :Delete specific record for user access
 * Method : DELETE
 */
exports.DeleteUserAccess = function (req, res){
	   UsersAccessModel.findById(req.query.Id, function (err, usr) {
	      if(err)
	        {
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else if(!usr)
	        {
	          //return res.status(404).send('User not found');
	    	  //throw new Error('UserIdInvalid');
	    	  var errorCode=errorcodes["UserIdInvalid"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else
	        {
	        /*usr.remove(function (err) {
	            if (err) {
	              logger.info("My Error during remove "+err);
	              return res.status(500).send(err);
	            	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
			    	return;
	            } else {
	  	        var msgJson=msg.successMessage("DeleteUser","0","UsersAccess details deleted successfully","UsersAccess details deleted successfully",usr);
	  	    	  return res.status(200).send(msgJson);
	            }
	            
	          });*/
	    	  usr.trashed='y';
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
	    	    });
	        }
	    });
	  }


/**
 * url :/rest/v1/adminmeta/GetUserAccess
 * Description :Get specific record for user access
 * Method : GET
 */
exports.GetUserAccess = function (req, res){
	var uid = req.query.userID;
	//logger.info("USer id ="+uid);
	UsersAccessModel.findOne({"userID":uid,"trashed": 'n'}).lean().exec(function (err, users) {
	    if (err) {	
	    	//throw new Error('DBError');
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    	//res.status(500).send(err);
	    }
	    else if(!users)
	    	{
	    		logger.info('GetUserAccess Exception handling.');
	    		logger.info(users);
	    		var errorCode=errorcodes["UserIdInvalid"];
	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    		return;
	    	}
	    else {
	    	
	    	/*logger.info('Get the user Details --------------------->');
	    	logger.info(users)*/;
	    	/*AccountsModel.findOne({"_id":users.accountID,"trashed": 'n'}).lean().exec(function (err, accounts) {
	    	    if (err) {	    	
	    	    	var errorCode=errorcodes["DBError"];
	    	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	    	return;
	    	    }
	    	    else if(!accounts)
		    	{
		    		logger.info('GetUserAccess Account Exception handling.');
		    		logger.info(users);
		    		var errorCode=errorcodes["AccountIdInvalid"];
		    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
		    		return;
		    	}
	    	    else {
	    	      users["accountName"]=accounts.accountName;
	    	      var msgJson=msg.successMessage("GetUser","0","Fetching user Details","Fetching user Details",users);
	  	    		return res.status(200).send(msgJson);
	    	    }
	    	  });*/
	    		
	    		collectAccountApplicationName(users,0,res,req);
	    	
	    }
	  });
	
}


/**
 * url :/rest/v1/adminmeta/GetAllUserAccess
 * Description :Get all the records of user access
 * Method : GET
 */
exports.GetAllUserAccess = function (req, res){
	    UsersAccessModel.find({"trashed": 'n'}).exec(function (err, users) {
	      if (err) {       
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	      } else {
	          var msgJson=msg.successMessage("GetAllUser","0","List of  user access  details","List of  user access  details",users);
	    	  return res.status(200).send(msgJson);
	      }
	    });
	  }


/**
 * url :/rest/v1/adminmeta/GetAllUserName
 * Description :Get the List of  all username
 * Method : GET
 */
exports.GetAllUserName=function(req,res){
	UsersAccessModel.find({"trashed": 'n'}).distinct('userID', function(error, users) {
	      if (error) {
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	      } else {
	    	  var msgJson=msg.successMessage("GetAllUserName","0","List of  all username","List of  all username",users);
	    	  return res.status(200).send(msgJson);
	      }
	    });
}


/**
 * url :/rest/v1/adminmeta/SearchUserAccess
 * Description :Get the specific useraccess record based on userid
 * Method : GET
 */
exports.SearchUserAccess=function(req,res){
	UsersAccessModel.findOne({userID:req.query.userID,"trashed": 'n'}).lean().exec(function (err, users) {
	    if(err)
	      {
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	return;
	      }
	      else if(!users)
	      {
	    	  logger.info('SearchUserAccess Exception handling.');
	    	  logger.info(users);
	    	  var errorCode=errorcodes["UserIdInvalid"];
	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    		return;
	      }
	      else
	      {
	        var msgJson=msg.successMessage("SearchUserAccess","0","UserName searched successfully","UserName searched successfully",users);
	        return res.status(200).send(msgJson);
	      }
	  });
}


/**
 * url :/rest/v1/adminmeta/CreateRole
 * Description :Create a new Role record
 * Method : POST
 */
exports.CreateRole = function (req, res){

	RolesModel.findOne({"roleName":(req.body.roleName).trim()}).lean().exec(function (err, rol) {
		if(err)
			{
				var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else if(!rol)
			{
			var obj=req.body;
			logger.info('arijit chatterjee');
			logger.info(req.body);
			  var role = new RolesModel({
				//_id: mongoose.Types.ObjectId(),
				  roleName: (req.body.roleName).trim(), 
				  roleDescription: req.body.roleDescription,  
				  updateTimestamp:new Date().toISOString(), 
				  updatedByUserId: req.body.updatedByUserId, 
				  updateComment: req.body.updateComment,
				  capabilityNameList:req.body.capabilityNameList,
				  trashed:'n',

			    });
			  role.save(function (err) {
			    if (err) {
			    	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
			    	return;
			    	
			    } else {
			    	
			    	var capArr = req.body.Capabilities;
			    	logger.info('My arr '+capArr);
			    	createCapability(capArr,0,res,obj,req,'createrole');
			    }
			  });
			}
		else
			{
				var userMessage=userMsg.adminDuplicateRole;
				var msgJson=msg.successMessage("CreateRole","1",userMessage,userMessage,obj);
				return res.status(400).send(msgJson);
			}
	});
	
	}

/**
 * Description :Create a new capability associate with a role.
 */
function createCapability(capNamelist,i,res,obj,req,flag){
	/*logger.info('step2');
	logger.info(capNamelist);
	logger.info('i ='+i);*/
	if(i<capNamelist.length)
		{
		var capElem = capNamelist[i];
		var capability = new CapabilitiesModel({
			  capName: (capElem.capName).trim(),
			  capRegStr: (capElem.capRegStr).trim(),
			  accessPanel:capElem.accessPanel,
			  updateTimestamp:new Date().toISOString(),
			  trashed:'n',
		    });
		  capability.save(function (err) {
		    if (err) {
		    	/*logger.info("My Error "+err);
		    	return res.status(500).send(err);
		    	throw new Error('DBError');*/
		    	var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
		    } else {
		          i=i+1;
		          createCapability(capNamelist,i,res,obj,req,flag);
		    }
		  });
		}
	else
		{
			if(flag=='createrole')
				{
					var msgJson=msg.successMessage("CreateRole","0","Role created successfully","Role created successfully",obj);
					return res.status(200).send(msgJson);
				}
			else
				{
					var msgshown="Initial Data Load for below MongoDB Collections successfully completed";
					logger.info('Add in transactional audit log');
					var transactionalDetails=req.body;
					logger.info(transactionalDetails);
					UpdateTauditLog(req,res);
					//var msgJson=msg.successMessage("InitalDataload","0",msgshown,msgshown,{});
					return res.status(200).send(msgshown);
				}
				
		}
}


/**
 * url :/rest/v1/adminmeta/UpdateRole
 * Description :Update a specific Role record
 * Method : PUT
 */
exports.UpdateRole = function (req, res){
	var obj=req.body;
	logger.info('update role');
	logger.info(req.body);
	 RolesModel.findById(req.query.Id, function (err, role) {
		 logger.info('Fetching role data==========>');
		 logger.info(role);
		 var oldtimestamp=req.body.updateTimestamp;
		 logger.info('request body ------------------------'+oldtimestamp);
		 var newtimestamp=role.updateTimestamp.toISOString();
		 logger.info('user fetch ==========================='+newtimestamp);
		 logger.info('current Date '+new Date().toISOString());
		 
		 role.roleName=(req.body.roleName).trim();
		 role.roleDescription=req.body.roleDescription;  
		 role.updateTimestamp=new Date().toISOString(); 
		 role.updatedByUserId=req.body.updatedByUserId;
		 role.updateComment= req.body.updateComment;
		 role.capabilityNameList=(req.body.capabilityNameList).toString();

		 if(oldtimestamp==newtimestamp)
		 {
			 role.save(function (err) {
			      if (err) {
			    	  var errorCode=errorcodes["DBError"];
				    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
				    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
				    	return;
			      } else {
			    	  	
			    	  var capArr = req.body.Capabilities;
				    	logger.info('My arr '+capArr);
				    	updateCapability(capArr,0,res,obj)
			          /*var msgJson=successMessage("UpdateRole","0","Role updated successfully","Role updated successfully",role);
			    	  return res.status(200).send(msgJson);*/
			      }
			    });
		 }
	 else
		 {
		   var userMessage=userMsg.adminUpdateRoleConflict;
		   var obj1={};
		   var msgJson=msg.successMessage("UpdateRole","1",userMessage,userMessage,obj1);
    	   return res.status(400).send(msgJson);
		 }
		 
		 
	  });
	}


/**
 * Description :Update a specific capability associate with a role.
 */
function updateCapability(capNamelist,i,res,obj){
	if(i<capNamelist.length)
		{
			var capElem = capNamelist[i];
			logger.info('qwerty =');
			logger.info(capElem);
			logger.info(capElem._id);
			if(capElem._id=='')
				delete capElem['_id'];
			//var capElem = capNamelist[i];
			logger.info('new capelem ==');
			logger.info(capElem);
			CapabilitiesModel.findById(capElem._id, function (err, cap) {
				 if(err)
		         {
					 logger.info('Find Error 1');
		          logger.info(err);
		          return res.status(500).send(err);
		         }
		         else if(!cap)
		         {
		        	 logger.info('Find Error 12');
		            
		            var cap = new CapabilitiesModel({
		            capName: (capElem.capName).trim(),
		            capRegStr: (capElem.capRegStr).trim(),
		            accessPanel:capElem.accessPanel,
		            updateTimestamp:new Date().toISOString(),
		            trashed:'n',
		            });
		            cap.save(function (err) {
		                if (err) {
		                  var errorCode=errorcodes["DBError"];
		                  res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		                  internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		                  return;
		                } 
		                else {
		                  i=i+1;
		                  updateCapability(capNamelist,i,res,obj);
		                }
		              });
		         }
		         else
		         {
		            cap.capName=(capElem.capName).trim();
		            cap.capRegStr=(capElem.capRegStr).trim();
		            cap.accessPanel=capElem.accessPanel;
		            cap.updateTimestamp=new Date().toISOString(); ; 
		             cap.updatedByUserId=capElem.updatedByUserId;
		             cap.updateComment= capElem.updateComment;

		             cap.save(function (err) {
		                if (err) {
		                  //throw new Error('DBError');
		                  //return res.status(500).send(err);
		                  var errorCode=errorcodes["DBError"];
		                  res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		                  internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		                  return;
		                } else {
		                  i=i+1;
		                  updateCapability(capNamelist,i,res,obj);
		                }
		              });
		          }
			  });
		
		}
	else
		{
			var msgJson=msg.successMessage("UpdateRole","0","Role updated successfully","Role updated successfully",obj);
			return res.status(200).send(msgJson);
		}
}


/**
 * url :/rest/v1/adminmeta/DeleteRole
 * Description :Delete a specific Role record
 * Method : DELETE
 */
exports.DeleteRole = function (req, res){
	   RolesModel.findById(req.query.Id, function (err, role) {
	      if(err)
	        {
	    	  logger.info("My Error "+err);
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else if(!role)
	        {
	    	  var errorCode=errorcodes["RoleIdInvalid"];
	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    		return;
	        }
	      else
	        {
	    	  /*role.remove(function (err) {
	            if (err) {
	            	var errorCode=errorcodes["DBError"];
	    	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	    	return;
	            } 
	            else {
	  	        var msgJson=msg.successMessage("DeleteRole","0","Role deleted successfully","Role deleted successfully",role);
	  	    	  return res.status(200).send(msgJson);
	            }
	            
	          });*/
	    	  
	    	  role.trashed='y';
	    	  role.updateTimestamp=new Date().toISOString();
	    	  role.save(function (err) {
	    	      if (err) {
	    	    	  var errorCode=errorcodes["DBError"];
		    	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	    	return;
	    	      } else {
	    	          var msgJson=msg.successMessage("DeleteRole","0","Role deleted successfully","Role deleted successfully",role);
	    	    	  return res.status(200).send(msgJson);
	    	      }
	    	    });
	        }
	    });
	  }


/**
 * url :/rest/v1/adminmeta/GetRole
 * Description :get a specific Role record based on _id
 * Method : GET
 */
exports.GetRole = function (req, res){
	var rid = req.query.Id;
	logger.info("Role id ="+rid);
	RolesModel.findOne({"_id":rid,"trashed": 'n'}).exec(function (err, role) {
	    if (err) {	
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    }
	    else if(!role)
	    	{
	    		//throw new Error('RoleIdInvalid');
	    		var errorCode=errorcodes["RoleIdInvalid"];
	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    		return;
	    	}
	    else {
	          var msgJson=msg.successMessage("GetRole","0","Fetching role Details","Fetching role Details",role);
	    	return res.status(200).send(msgJson);
	    }
	  });
	
}


/**
 * url :/rest/v1/adminmeta/GetAllRoles
 * Description :get list of  Role records.
 * Method : GET
 */
exports.GetAllRoles = function (req, res){
	RolesModel.find({"trashed": 'n'}).exec(function (err, role) {
	      if (err) {       
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	      } else {
	          var msgJson=msg.successMessage("GetAllRole","0","List of  role  details","List of  role  details",role);
	    	  return res.status(200).send(msgJson);
	      }
	    });
	  }


/**
 * url :/rest/v1/adminmeta/SearchRole
 * Description :get specific  Role record based on role name.
 * Method : GET
 */
exports.SearchRole=function(req,res){

	  RolesModel.findOne({"roleName":(req.query.roleName).trim(),"trashed": 'n'}).lean().exec(function (err, roles) {
	    if (err) {       
	      /*throw new Error('DBError');*/
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    }
	    else if(!roles)
	      {
	    	var errorCode=errorcodes["RoleNameInvalid"];
    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
    		return;
	      }
	    else {
	    	var capListArr=[];
	    	var newArr=[];
	    	var capList=roles.capabilityNameList;
	    	if(capList!=''&& capList!=undefined)  
	    	  capListArr=capList.split(",");
	    	getRoleCapList(roles,capListArr,0,res,newArr,req);
	      //return res.status(200).send(users);
	    }
	  });
	}


/**
 * url :/rest/v1/adminmeta/GetAllRoleName
 * Description :get all the distinct rolename.
 * Method : GET
 */
exports.GetAllRoleName=function(req,res){
	RolesModel.find({"trashed": 'n'}).distinct('roleName', function(error, users) {
	      if (error) {
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	      } else {
	    	  var msgJson=msg.successMessage("GetAllRoleName","0","List of  all rolename","List of  all rolename",users);
	    	  return res.status(200).send(msgJson);
	      }
	    });
  }

	function getRoleCapList(roles,capListArr,i,res,newArr,req){
		/*logger.info('Testing the issue');
		logger.info(capListArr.length);
		logger.info(capListArr);*/
	  if(i<capListArr.length){
	    var cname=capListArr[i];
	    CapabilitiesModel.findOne({"capName":cname,"trashed": 'n'}).lean().exec(function (err, cap) {
	              if (err) {       
	            	  var errorCode=errorcodes["DBError"];
	      	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	      	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	      	    	return;
	              }
	              else if(!cap){
	                  /*logger.info("My Error65 "+cap);
	                  throw new Error('CapabilityIdInvalid');*/
	                  var errorCode=errorcodes["CapabilityIdInvalid"];
	  	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	  	    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	  	    		return;
	              }  
	              else {
	                newArr.push(cap);
	                i=i+1;
	                getRoleCapList(roles,capListArr,i,res,newArr,req)
	                
	              }
	            });
	  }
	  else
	  {
	    roles.Capabilities=newArr;
	    var msgJson=msg.successMessage("SearchRole","0","Role searched successfully","Role searched successfully",roles);
	    return res.status(200).send(msgJson);
	  }

	  }
	
/*exports.CreateCapability = function (req, res){
	
	  var capability = new CapabilitiesModel({
		  capName: req.body.capName,
		  capRegStr: req.body.capRegStr,
	    });
	  capability.save(function (err) {
	    if (err) {
	    	logger.info("My Error "+err);
	    	return res.status(500).send(err);
	    	throw new Error('DBError');
	    } else {
	          var msgJson=successMessage("CreateCapability","0","Capability created successfully","Capability created successfully",capability);
	    	  return res.status(200).send(msgJson);
	    }
	  });
	}

exports.UpdateCapability = function (req, res){
	 CapabilitiesModel.findById(req.query.Id, function (err, cap) {
		 cap.capName=req.body.capName;
		 cap.capRegStr=req.body.capRegStr;
		 cap.updateTimestamp=req.body.updateTimestamp; 
		 cap.updatedByUserId=req.body.updatedByUserId;
		 cap.updateComment= req.body.updateComment;

	 cap.save(function (err) {
	      if (err) {
	    	  throw new Error('DBError');
	      } else {
	          var msgJson=successMessage("UpdateCapability","0","Capability updated successfully","Capability updated successfully",cap);
	    	  return res.status(200).send(msgJson);
	      }
	    });
	  });
	}*/


	
/**
 * url :/rest/v1/adminmeta/DeleteCapability
 * Description :delete a specific rolename.
 * Method : DELETE
*/
exports.DeleteCapability = function (req, res){
	   CapabilitiesModel.findById(req.query.Id, function (err, cap) {
	      if(err)
	        {
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else if(!cap)
	        {
	    	  
	    	  var errorCode=errorcodes["CapabilityIdInvalid"];
	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    		return;
	        }
	      else
	        {
	    	  /*cap.remove(function (err) {
	            if (err) {
	            	var errorCode=errorcodes["DBError"];
	    	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	    	return;
	            } else {
	  	          var msgJson=msg.successMessage("DeleteCapability","0","Capability deleted successfully","Capability deleted successfully",cap);
	  	    	  return res.status(200).send(msgJson);
	            	
	            }
	            
	          });*/
	    	  cap.trashed='y';
	    	  cap.updateTimestamp=new Date().toISOString();
	    	  cap.save(function (err) {
	    	      if (err) {
	    	    	  var errorCode=errorcodes["DBError"];
		    	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	    	return;
	    	      } else {
	    	          var msgJson=msg.successMessage("DeleteCapability","0","Capability deleted successfully","Capability deleted successfully",cap);
	    	    	  return res.status(200).send(msgJson);
	    	      }
	    	    });
	    	  
	        }
	    });
	  }

/**
 * url :/rest/v1/adminmeta/GetCapability
 * Description :get a specific capability name based on id.
 * Method : GET
*/
exports.GetCapability = function (req, res){
	var cid = req.query.Id;
	logger.info("Capability id ="+cid);
	CapabilitiesModel.findOne({"_id":cid,"trashed": 'n'}).exec(function (err, cap) {
	    if (err) {	
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    }
	    else if(!cap)
	    	{
	    	var errorCode=errorcodes["CapabilityIdInvalid"];
    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
    		return;
	    	}
	    else {
	          var msgJson=msg.successMessage("GetCapability","0","Fetching capability Details","Fetching capability Details",cap);
	    	return res.status(200).send(msgJson);
	    }
	  });
	
}


/**
 * url :/rest/v1/adminmeta/GetAllCapability
 * Description :get list of  capability records.
 * Method : GET
*/
exports.GetAllCapability = function (req, res){
	CapabilitiesModel.find({"trashed": 'n'}).exec(function (err, cap) {
	      if (err) {       
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
	      } else {
	          var msgJson=msg.successMessage("GetAllCapability","0","List of  capability  details","List of  capability  details",cap);
	    	  return res.status(200).send(msgJson);
	      }
	    });
	  }


function collectAccountApplicationName(user,i,res,req){
	//logger.info('collectAccountApplicationName---------------->'+i);
	if(i < user.account.length)
	{
		var tempArry=[];
		var accountId = user.account[i].accountId;
		logger.info('AccountID---------------->'+i+'------------->'+accountId);
		  AccountsModel.findOne({"_id":accountId,"trashed": 'n'}).lean().exec(function (err, accounts) {
		    if (err) {	
		    	
		    	var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
		    } 
		    else if(!accounts)
		    	{
		    	/*var errorCode=errorcodes["AccountIdInvalid"];
  	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
  	    		internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
  	    		return;*/
		    	i=i+1;
				collectAccountApplicationName(user,i,res,req);
		    	}
		    else {
		      logger.info('Value of i -------->'+i);
		      logger.info(accounts);
			  user.account[i].accountName=accounts.accountName;
			  ApplicationsModel.find({'_id': { $in:user.account[i].applicationIdList },'trashed': 'n'}).lean().exec(function (err,application) {
				    if (err) {
				    	var errorCode=errorcodes["DBError"];
				    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
				    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
				    	return;
				    	
				    } else {
				    	logger.info('**********************APPName');
				    	logger.info(application);
				    	var tempArry=[];
				    	for(var k=0;k<application.length;k++)
			    		{
			    			var tempJson={};
			    			var appID=application[k]._id;
			    			var appname=application[k].applicationName;
			    			logger.info('ApplicationName---------------->'+i+'------------->'+appname);
			    			tempJson.applicationId=appID;
			    			tempJson.applicationName=appname;
			    			tempArry.push(tempJson);
			    		}
				    	user.account[i].applicationList=tempArry;
				    	//delete the id array
				    	delete user.account[i].applicationIdList;
				    	i=i+1;
						collectAccountApplicationName(user,i,res,req);
				    }
				  });
		    }
		  });
	}
	else
		{
			var msgJson=msg.successMessage("GetUserAccess","0","Fetching useraccess Details","Fetching useraccess Details",user);
			return res.status(200).send(msgJson);
		}
}


/**
 * url :/rest/v1/adminmeta/generateCapabilityName
 * Description :Generate capabilty name as per the capabilit selection.
 * Method : POST
*/
exports.generateCapabilityName = function (req, res){
	
//var clientId = req.query.clientId;
var accessPanel=req.body.AccessPanel;
var permissions=req.body.Permissions;

var panelName;
/*logger.info('!!!!!!!!!!!!!!!!!! Client id '+clientId);
logger.info('!!!!!!!!!!!!!!!!!! accesspanel  '+accesspanel);
logger.info('!!!!!!!!!!!!!!!!!! permission '+permission);*/

if(accessPanel=='dashboard')
	panelName='Dash';
else if(accessPanel=='adminportal')
	panelName='AdmPort';
else if(accessPanel=='sopeditor')
	panelName='SopEdtr';	
	

var permissionPattern=getPermissionPattern(permissions);
//var capabilityName=clientId.substring(0,3)+panelName+permissionpattern;
var capabilityName=panelName+"-"+permissionPattern;

CapabilitiesModel.findOne({"capName":capabilityName,"trashed": 'n'}).lean().exec(function (err, capability) {
    if (err) {	
    	var errorCode=errorcodes["DBError"];
    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
    	return;
    }
    else if(!capability)
    	{
    		//return res.status(200).send(capabilityName);
    		var msgJson=msg.successMessage("createCapabilityName","0","The capability name "+capabilityName+" generated","The capability name "+capabilityName+" generated",{capabilityName:capabilityName});
            return res.status(200).send(msgJson);
    	}
    else {
          var msgJson=msg.successMessage("createCapabilityName","1","The capability name "+capabilityName+" Already exists","The capability name "+capabilityName+" Already exists",capability);
          return res.status(200).send(msgJson);
    }
  });

}

function getPermissionPattern(permissions)
{
    var permissionShortName = "";
    for (var i = 0; i < permissions.length; i++)
    {
    	var permission = permissions[i];

    	switch(permission){
    	case 'Add': 
    		permissionShortName += "Add"+"|"; break;
    	case 'Update': 
    		permissionShortName += "Upd"+"|"; break;
    	case 'Delete': 
    		permissionShortName += "Del"+"|"; break;
    	case 'View': 
    		permissionShortName += "VW"+"|"; break;
    		
    	case 'ViewSelfAccounts': 
    		permissionShortName +="VW_SLF_ACC"+"|"; break; 
    	case 'ViewAllAccounts': 
    		permissionShortName += "VW_ALL_ACC"+"|"; break;
    	case 'ViewReport': 
    		permissionShortName += "VW_REP"+"|"; break;
    	case 'DownloadReport': 
    		permissionShortName += "DNLD_REP"+"|"; break;
    		
    	case 'ActivateUser': 
    		permissionShortName += "ACT_USR"+"|"; break;    	
    	case 'DeactivateUser': 
    		permissionShortName += "DACT_USR"+"|"; break;
    	case 'AddUserAccess': 
    		permissionShortName += "ADD_USR_ACS"+"|"; break;
    	case 'UpdateUserAccess': 
    		permissionShortName += "UPD_USR_ACS"+"|"; break;
    	case 'DeleteUserAccess': 
    		permissionShortName += "DEL_USR_ACS"+"|"; break;
    	case 'ViewUserAccess': 
    		permissionShortName += "VW_USR_ACS"+"|"; break;
    	case 'ExportAuditReport': 
    		permissionShortName += "EXP_AUD_REP"+"|"; break;

    	case 'ViewSelfAccounts': 
    		permissionShortName += "VW_SLF_ACC"+"|"; break;
    	case 'ViewAllAccounts': 
    		permissionShortName += "VW_ALL_ACC"+"|"; break;
    	case 'ViewReport': 
    		permissionShortName += "VW_REP"+"|"; break;

    	case 'AddRoleCap': 
    		permissionShortName += "ADD_ROLE_CAP"+"|"; break;
    	case 'UpdateRoleCap': 
    		permissionShortName += "UPD_ROLE_CAP"+"|"; break;
    	case 'DeleteRoleCap': 
    		permissionShortName += "DEL_ROLE_CAP"+"|"; break;
    	case 'ViewRoleCap': 
    		permissionShortName += "VW_ROLE_CAP"+"|"; break;
    	}
    }
    return(permissionShortName.substring(0,permissionShortName.length-1));
}



/**
 * url :/rest/v1/adminmeta/initialDataLoad
 * Description :create all the new initial records which are mandatory to run the application.
 * Method : POST
*/
exports.initialDataLoad = function (req, res){
	var mongo = require('mongodb');
	var MongoClient = mongo.MongoClient;
	var mongodb_uri;
	if(systemEnv.deployment_type=='CLOUD')
		mongodb_uri = appProperty['deployment-specific-properties']['CLOUD'].credentials.uri;
	else
		mongodb_uri= appProperty['deployment-specific-properties']['ON_PREM'].dbConnectionURL;
	//Radha
	//mongodb_uri = "mongodb://localhost:27017/citidb";
	MongoClient.connect (mongodb_uri, function(err, db) {
        if(err)
        {
            console.log('Problem in connection');
            var errorCode=errorcodes["DBError"];
            res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
            internalMessage:err,userMessage:errorCode.userMessage,response:{}});
            return;
        }
        else
        {
        	db.listCollections().toArray(function(err, colls){
				if(err){
    				
					var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
			    	return;
    			}
    			else
    			{
    				logger.info("We are connected to DB now bbb----------");
    				deleteallcollection(req,res,colls,0,db);
    			}
			});
        }
    });
}

/**
 * Description : Function used to delete all the collection from the database.
 * @param req
 * @param res
 * @param colls
 * @param i
 * @param db
 */
function deleteallcollection(req,res,colls,i,db)
{
	if(i<colls.length)
	{
		var currCollection = colls[i];
    	logger.info("name:::: "+currCollection.name);
		if ( currCollection.name.substring(0, 6) !== "system")
		{
    		db.dropCollection(currCollection.name, function(err) {
                if(!err) {
                	logger.info("not a system collection so dropped");
                	deleteallcollection(req,res,colls,i+1,db);
                } else {
                	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
			    	return;
                }
            });
    	} 
    	else {
        		logger.info(currCollection.name + " cannot be dropped because it's a system file");
        		deleteallcollection(req,res,colls,i+1,db);
    		 }  
	}
	else
	{
		dataload(req,res);
	}
}


/**
 * Description : Load the inital data.Calling from initialDataLoad service.
 * @param req
 * @param res
 */
function dataload(req, res){


	ClientsModel.findOne({"clientName":(initdbdata.client.clientName).trim()}).lean().exec(function (err, clnt) {
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
				  clientName: (initdbdata.client.clientName).trim(),
				  updateTimestamp:new Date().toISOString(),
				  trashed:'n',

			    });
			  		client.save(function (err) {
			    	if (err) {
			    	
			    	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
			    	return;
			    	} else {

			    			//Start of account+++++++++++++++++++++++++++++


			    			AccountsModel.findOne({"accountName":(initdbdata.account.accountName).trim()}).lean().exec(function (err, accnt) {
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
		  	
		  	account = new AccountsModel({
			//_id: mongoose.Types.ObjectId(),
			accountName: (initdbdata.account.accountName).trim(),
			clientName:(initdbdata.account.clientName).trim(),
			trashed:'n',
			updateTimestamp:new Date().toISOString(),
		    });
		  account.save(function (err) {
		    if (err) {
		    	
		      //return res.status(500).send(err);
		    	var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
		    } else {
		    	//*******************************APPLICATION**********************************************
		    	/*logger.info('ACCOUNTTTTTTTTTTTTTTTTTTTTTTTTTTTAVVVVVV');
		    	logger.info(account)*/
		    	ApplicationsModel.findOne({"applicationName":(initdbdata.application.applicationName).trim()}).lean().exec(function (err, applicatn) {
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
			  application = new ApplicationsModel({
				//_id: mongoose.Types.ObjectId(),
			    applicationName: (initdbdata.application.applicationName).trim(),
			    accountID: account._id,
			    updateTimestamp:new Date().toISOString(),
			    trashed:'n'
			    });
			  
			  
			  application.save(function (err) {
			    if (err) {
			    	
			    	var errorCode=errorcodes["DBError"];
      		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
      		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
      		    	return;
			    } else {
			    	//************************************UserAccess******************************

			    	var uid=initdbdata.userAccess.userID;
	UsersAccessModel.findOne({"userID":uid}).lean().exec(function (err, users) {
	    if (err) {	
	    	//throw new Error('DBError');
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    	//res.status(500).send(err);
	    }
	    else if(!users)
	    	{
	    		//var accountmapp=[];
	    		var jsonobj=[{
            			"accountId": account._id,
            			"applicationIdList": [
                				application._id
            ]
        }];

        logger.info('user structure ==========');
        logger.info(jsonobj);
	    		var user = new UsersAccessModel({
	    		//_id: mongoose.Types.ObjectId(),
	    		  userName: initdbdata.userAccess.userName,
	    		  userID:(initdbdata.userAccess.userID).trim(),
	    		  roleName: (initdbdata.userAccess.roleName).trim(), 
	    		  account: jsonobj, 
	    		  type: (initdbdata.userAccess.type).trim(), 
	    		  active: (initdbdata.userAccess.active).trim(),
	    		  updateTimestamp:new Date().toISOString(),
	    		  trashed:'n',

	    	    });
	    	  user.save(function (err) {
	    	    if (err) {
	    	    	logger.info('TEST THE BEST==========');
	    	    	logger.info(err);
	    	    	var errorCode=errorcodes["DBError"];
	    	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	    	return;
	    	    } else {
	    	          //*****************************dbUserCredential**********************
	    	    	
	    	    	var bcrypt = require('bcrypt-nodejs');
	    	    	var pin='pass1234';
	    	     	var hash = bcrypt.hashSync(pin);
	    	          var usercred = new UserCredentialModel({
				//_id: mongoose.Types.ObjectId(),
				  userName: (initdbdata.dbUserCredential.userID).trim(),
				  password:hash,
				  trashed:'n',

			    });
			  usercred.save(function (err) {
			    if (err) {
			    	
			    	res.send(err);
			    } else {
			    	
			    	//*******************RoleCap**********************************888

			    				    	logger.info('ARIJIT =======1111111111');
	RolesModel.findOne({"roleName":(initdbdata.rolecapability.roleName).trim()}).lean().exec(function (err, rol) {
		if(err)
			{
				logger.info('ARIJIT =======2222222');
				var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else if(!rol)
			{
				logger.info('ARIJIT =======333333333');
			var obj=initdbdata.rolecapability;
			logger.info('arijit chatterjee');
			logger.info(req.body);
			  var role = new RolesModel({
				//_id: mongoose.Types.ObjectId(),
				  roleName: (initdbdata.rolecapability.roleName).trim(), 
				  updateTimestamp:new Date().toISOString(), 
				  capabilityNameList:initdbdata.rolecapability.capabilityNameList,
				  trashed:'n',

			    });
			  role.save(function (err) {
			    if (err) {
			    	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
			    	return;
			    	
			    } else {
			    	
			    	var roleDefault = new RolesModel({
						//_id: mongoose.Types.ObjectId(),
						  roleName: 'DEFAULT', 
						  updateTimestamp:new Date().toISOString(), 
						  capabilityNameList:"",
						  trashed:'n',

					    });
					  roleDefault.save(function (err) {
					    if (err) {
					    	var errorCode=errorcodes["DBError"];
					    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
					    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
					    	return;
					    	
					    } else {
					    	
					    	var capArr = initdbdata.rolecapability.Capabilities;
					    	logger.info('My arr '+capArr);
					    	createCapability(capArr,0,res,obj,req,'initialdb');
					    }
					  });

			    }
			  });
			}
		else
			{
				var userMessage=userMsg.adminDuplicateRole;
				var msgJson=msg.successMessage("CreateRole","1",userMessage,userMessage,obj);
				return res.status(400).send(msgJson);
			}
	});
			    	
			    }
			  });
	    	    }
	    	  });
	    	}
	    else {
	    	  var userMessage=userMsg.adminDuplicateUser;
	    	  var msgJson=msg.successMessage("CreateUser","1",userMessage,userMessage,{});
	    	  return res.status(400).send(msgJson);
	    }
	  });
	
			    	
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
		  });
		  
			}
		else
			{
				var userMessage=userMsg.sopDuplicateAccount;
				var msgJson=msg.successMessage("CreateAccount","0",userMessage,userMessage,account);
		    	  return res.status(400).send(msgJson);
				//return res.status(400).send(userMessage);
			}
	});


			    			//End of account+++++++++++++++++++++++++++++
					
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


}

exports.getMapperConfigurations = function (req, res){
	
	logger.info("get call mappers--->>>>");
	//var params = req.body;
	
	 var obj = mappers;
	 logger.info("mappers"+ mappers);
	// var msgJson=successMessage("getMappers","200","List of  all Mappers","List of  all Mappers",obj);
	  return res.status(200).send(obj);
	 		
	 
	}

exports.getMonitoringAdapterConfigurations = function (req, res){
	
	logger.info("get call mappers--->>>>");
	//var params = req.body;
	
	 var obj = monitoringAdapters;
	 logger.info("monotoringAdapters"+ monitoringAdapters);
	// var msgJson=successMessage("getMappers","200","List of  all Mappers","List of  all Mappers",obj);
	  return res.status(200).send(obj);
	 		
	 
	}


exports.getAutomationAdapterConfigurations = function (req, res){
	
	logger.info("get call automation adapter--->>>>");
	//var params = req.body;
	
	 var obj = automationAdapters;
	 logger.info("adapters"+ automationAdapters);
	// var msgJson=successMessage("getMappers","200","List of  all Mappers","List of  all Mappers",obj);
	  return res.status(200).send(obj);
	 		
	 
	}

exports.getMessageQueueConfigurations = function (req, res){
	
	logger.info("get call message queue--->>>>");
	//var params = req.body;
	
	 var obj = messageQueueConfig;
	 logger.info("messageQueueConfig"+ messageQueueConfig);
	// var msgJson=successMessage("getMappers","200","List of  all Mappers","List of  all Mappers",obj);
	  return res.status(200).send(obj);
	 		
	 
	}

exports.getAppConfigurations = function (req, res){
	
	logger.info("get call message queue--->>>>");
	//var params = req.body;
	
	 var obj = appProperty;
	 logger.info("appProperty"+ appProperty);
	// var msgJson=successMessage("getMappers","200","List of  all Mappers","List of  all Mappers",obj);
	  return res.status(200).send(obj);
	 		
	 
	}


exports.updateAppConfigurations = function (req, res){
	
	var requestData = req.body;
	//logger.info("requestData"+ cron.cron);
	if(!requestData){
		res.send(400, "No content");
		return;
	}
	
	if(isEmptyObject(requestData)){
		res.send(400, "empty object");
		return;
	}
	
	appProperty = requestData;
	fs.writeFile(appPropertyFileName, JSON.stringify(appProperty,null,2), function (err) {
		  if (err){
			  return logger.info(err);
		  }
		//  logger.info(JSON.stringify(appProperty));
		 logger.info('writing to ' + appPropertyFileName);
		 res.send(200, "ok");
		});
	
	
}


exports.updateAutomationAdapterConfigurations = function (req, res){
	
	var requestData = req.body;
	//logger.info("requestData"+ cron.cron);
	if(!requestData){
		res.send(400, "Nocontent");
		return;
	}
	
	if(isEmptyObject(requestData)){
		res.send(400, "empty object");
		return;
	}
	
	automationAdapters = requestData;
	fs.writeFile(automationAdapterFileName, JSON.stringify(automationAdapters,null,2), function (err) {
		  if (err){
			  return logger.info(err);
		  }
		//  logger.info(JSON.stringify(appProperty));
		 logger.info('writing to ' + automationAdapterFileName);
		 res.send(200, "ok");
		});
	
	
}

exports.updateMessageQueueConfigurations = function (req, res){
	
	var requestData = req.body;
	//logger.info("requestData"+ cron.cron);
	if(!requestData){
		res.send(400, "No content");
		return;
	}
	
	if(isEmptyObject(requestData)){
		res.send(400, "empty object");
		return;
	}
	
	messageQueueConfig = requestData;
	fs.writeFile(messageQueueConfigFileName, JSON.stringify(messageQueueConfig,null,2), function (err) {
		  if (err){
			  return logger.info(err);
		  }
		//  logger.info(JSON.stringify(appProperty));
		 logger.info('writing to ' + messageQueueConfigFileName);
		 res.send(200, "ok");
		});
	
	
}


exports.updateMonitoringAdapterConfigurations = function (req, res){
	
	var requestData = req.body;
	//logger.info("requestData"+ cron.cron);
	if(!requestData){
		res.send(400, "Nocontent");
		return;
	}
	
	if(isEmptyObject(requestData)){
		res.send(400, "No content in request");
		return;
	}
	
	monitoringAdapters = requestData;
	fs.writeFile(monitoringAdapterFileName, JSON.stringify(monitoringAdapters,null,2), function (err) {
		  if (err){
			  return logger.info(err);
		  }
		//  logger.info(JSON.stringify(appProperty));
		 logger.info('writing to ' + monitoringAdapterFileName);
		 res.send(200, "ok");
		});
	
	
}

exports.updateMapperConfigurations = function (req, res){
	
	var requestData = req.body;
	//logger.info("requestData"+ cron.cron);
	if(!requestData){
		res.send(400, "Nocontent");
		return;
	}
	
	if(isEmptyObject(requestData)){
		res.send(400, "No content in request");
		return;
	}
	
	mappers = requestData;
	fs.writeFile(mappersFileName, JSON.stringify(mappers,null,2), function (err) {
		  if (err){
			  return logger.info(err);
		  }
		//  logger.info(JSON.stringify(appProperty));
		 logger.info('writing to ' + mappersFileName);
		 res.send(200, "ok");
		});
	
	
}

function isEmptyObject(obj) {
	  for (var key in obj) {
	    if (Object.prototype.hasOwnProperty.call(obj, key)) {
	      return false;
	    }
	  }
	  return true;
	}



function UpdateTauditLog(req,res){
	var auditLog = new t_AuditLogModel({
		auditTargetId : mongoose.Types.ObjectId(),
		updateTimeStamp:new Date().toISOString() ,
		eventType: 'Initial_DB',
		updatedByUserId: req.body.UserId,
		updatedCollectionName : 'ALL',
		updatedCollectionTimestamp : new Date().toISOString(),
		updateComment: "Run initial dataload by : "+req.body.UserId
	});
	auditLog.save(function(err, ret){
		if(err){
			logger.info("Get an error when create T_audit ");
			var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	return;
		}
		else
			{
			var msgshown="Initial Data Load for below MongoDB Collections successfully completed";
			return res.status(200).send(msgshown);
			}
		
	});
}

