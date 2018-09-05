var logger = getLogger("DB");

var appProperty= require('../../../../config/app_config.json');
var systemEnv= require('../../../../config/system_properties.json');
var enterpriseauthentication=require('../../../../config/enterprise_authentication_config.json');


// ----------------------- Start  -----------------
var express = require('express');
var app = express();

var http = require("http");
var models = require("../../../../models");
var errorcodes = require('../../../../config/errorcodes.json');

var msg = require('../../../../config/message.js');
var userMsg = require('../../../../config/user_message.json');
var mongoose = require('mongoose');
var cors = require('cors');
//var session = require('express-session'); 
//var retJson={};
app.use(cors());


var EmailWhiteListModel=models.EmailWhiteList;


/**
 * url :/rest/v1/adminmeta/createEmailWhitelist
 * Description : Create a new email whitelist record.
 * Method : POST
 */
exports.createEmailWhitelist = function (req, res){
	
	var obj=req.body ;
	//var emailArray
	EmailWhiteListModel.findOne({"clientID":obj.clientID,"accountID":obj.accountID}).lean().exec(function (err, result) {
		if(err)
			{
				//res.status(500).send(err);
				var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else if(!result)
			{
			var emailwhitelist = new EmailWhiteListModel({
				
				  clientID:(req.body.clientID).trim(),
				  accountID:(req.body.accountID).trim(),
				  emailIDList:req.body.emailIDList,
				  createTimestamp:new Date().toISOString(),
				  updateTimestamp:new Date().toISOString(),
			    });
			emailwhitelist.save(function (err) {
			    if (err) {
			    	
			    	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
			    	return;
			    } else {
			    	var userMessage=userMsg.newemailWhiteListAdded;
			    	var msgJson=msg.successMessage("createEmailWhitelist","0",userMessage,userMessage,client);
			    	return res.status(200).send(msgJson);
			    	
			    }
			  });
			}
		else
			{
				var userMessage=userMsg.emailWhiteListDuplicate;
		    	var msgJson=msg.successMessage("createEmailWhitelist","1",userMessage,userMessage,{});
		    	return res.status(400).send(msgJson);
			}
	});
	  
	  //return res.send(user); 	
	}




/**
 * url :/rest/v1/adminmeta/UpdateClient
 * Description :Update a specific client record
 * Method :PUT
 */
exports.updateEmailWhitelist = function (req, res){
	EmailWhiteListModel.findById(req.query.Id, function (err, result) {
		if(err)
			{
				var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else if(!result)
			{
			var errorCode=errorcodes["whiteListIDInvalid"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    	return;
			}
		else
			{
			var oldtimestamp=req.body.updateTimestamp;
			 logger.info('request body ------------------------'+oldtimestamp);
			 var newtimestamp=result.updateTimestamp.toISOString();
			 logger.info('user fetch ==========================='+newtimestamp);
			 logger.info('current Date '+new Date().toISOString());
			 
			 result.accountID=req.body.accountID;
			 result.clientID=req.body.clientID;
			 result.emailIDList=req.body.emailIDList;
			 result.updateTimestamp=new Date().toISOString();
			 result.updateBy= req.body.updateBy;
			 result.updateComment=req.body.updateComment;
			
			
			if(oldtimestamp==newtimestamp)
			 {
				result.save(function (err) {
				      if (err) {
				    	  var errorCode=errorcodes["DBError"];
					    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
					    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
					    	return;
				      } else {
				          var msgJson=msg.successMessage("updateEmailWhitelist","0","White List updated successfully","White List updated successfully",result);
				    	  return res.status(200).send(msgJson);
				      }
				    });
			 }
		 else
			 {
			 var userMessage=userMsg.WhiteListConflict;
			  var obj={};
			  var msgJson=msg.successMessage("updateEmailWhitelist","1",userMessage,userMessage,obj);
			  return res.status(400).send(msgJson);
			 }
			}
		
	  });
	}


/**
 * url :/rest/v1/adminmeta/containsEmailWhitelist
 * Description :Return boolean value based on specific clientID,accountID and emailId
 * Method :POST
 */
exports.containsEmailWhitelist = function (req, res){
	
var flag =false;
	
	EmailWhiteListModel.findOne({"clientID":(req.body.clientId).trim(),"accountID":(req.body.accid).trim(),"emailIDList":(req.body.senderemailId).trim()}).lean().exec(function (err, result) {
		if(err)
		{
			//res.status(500).send(err);
			var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
		}
		else if(!result)
		{
			console.log('return result false========>');
			return res.status(400).send(flag);
		}
		else
			{
				console.log('return result true========>');
				flag=true;
				return res.status(200).send(flag);
			}
	});
	
}


/**
 * url :/rest/v1/adminmeta/getEmailWhitelist
 * Description :Return the result of a specific record based on unique autogenerated id
 * Method :POST
 */
exports.getEmailWhitelist=function(req,res){
	//var eventType = req.params.eventtype;
	//var id = req.query.Id;query
	
	EmailWhiteListModel.find({"clientID":(req.body.clientId).trim(),"accountID":(req.body.accountId).trim() }).exec(function(err, callback) {
		if (err) 
		{
			var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
	    	return;
		}
		else if(!callback)
		{
			var errorCode=errorcodes["whiteListIDInvalid"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    	return;
		}
		else 
		{
			var msgJson = msg.successMessage("getEmailWhitelist","0", "Specific whiteList for a specific client","Specific whiteList for a specific client", callback);
			return res.status(200).send(msgJson);
			
		}				
	});
	
}


/**
 * url :/rest/v1/adminmeta/deleteEmailWhitelist
 * Description :Delete a specific record based on unique autogenerated id
 * Method :GET
 */
exports.deleteEmailWhitelist=function(req,res){

	EmailWhiteListModel.findById(req.query.Id, function (err, callback) {

	      if(err)
	        {
	    	  var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
	        }
	      else if(!callback)
	        {
	    	  var errorCode=errorcodes["whiteListIDInvalid"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
	    	return;
	        }
	      else
	        {
	    	  
	    	  callback.remove(function (err) {
	            if (err) {
	            	var errorCode=errorcodes["DBError"];
		    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    		internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    		return;
	            	
	            } else {
		  	        var msgJson=msg.successMessage("deleteEmailWhitelist","0","WhiteList deleted successfully","WhiteList deleted successfully",callback);
		  	    	  return res.status(200).send(msgJson);
	            }
	            
	          });
		}
	});
}
