
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
var systemEnv= require('../../../../config/system_properties.json');
var enterpriseauthentication=require('../../../../config/enterprise_authentication_config.json');
//var systemProp=require('../../../../public/lib/system_properties.json');


// ----------------------- Start  -----------------
var express = require('express');
var app = express();

var http = require("http");
var models = require("../../../../models");
var errorcodes = require('../../../../config/errorcodes.json');

var msg = require('../../../../config/message.js');
//var globalUrl = require('../../../../config/SOPConfig.json');
var userMsg = require('../../../../config/user_message.json');
var mongoose = require('mongoose');
var cors = require('cors');
var session = require('express-session'); 
var retJson={};
app.use(cors());

var AccountsModel = models.Account;
/*var ApplicationsModel = models.Application;
var AlertModel = models.Alert;*/
var UsersAccessModel=models.UserAccess;
var RolesModel=models.Role;
var CapabilitiesModel=models.Capability;

var UserCredentialModel=models.UserCredential;



/**
 * url :/rest/v1/adminmeta/GetAuthorization
 * Description :Populate the authorization required json 
 * Method : GET
 */
exports.getAuthorization=function(req,res){
	var uiUserId = req.query.userID;
	logger.info("======================= uiUserId ================= "+uiUserId);
	
	//AuthorizationService(session.loggedInUserId,res,req);
	
	/*logger.info('check user 001==========++++=================');
	var value = myCacheSession.get( "myKey" );
  	logger.info(value);
  	if(value!=null || value!=undefined)
  		AuthorizationService(uiUserId,res,req);
  	else
  		res.status(403).send('You are not authorize to access swaransetu service');*/
	
	AuthorizationService(uiUserId,res,req);
	 
}


/**
 * url :/rest/v1/adminmeta/GetAuthorization1
 * Description :Duplicate service as getauthorization 
 * Method : GET
 */
/*exports.getAuthorization1=function(req,res){
	AuthorizationService(req.query.userName,res,req);
}*/


/**
 * Description :generate capability list of a specific user with the associate role.
 */
function getCapList(users,roles,capListArr,i,res,newArr){
	if(i<capListArr.length){
	  var cname=capListArr[i];
	  CapabilitiesModel.findOne({"capName":cname,"trashed": 'n'}).lean().exec(function (err, cap) {
	            if (err) {       
	              /*logger.info("My Error Cap"+err);
	              return res.status(500).send(err);*/
	            	var errorCode=errorcodes["DBError"];
	    	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	    	return;
	            }
	            else if(!cap){
	                //logger.info("My Error "+err);
	                //return res.status(404).send('No capability found');
	            	var errorCode=errorcodes["CapabilityIdInvalid"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
			    	return;
	            }  
	            else {
	              newArr.push(cap);
	              i=i+1;
	              getCapList(users,roles,capListArr,i,res,newArr);
	              
	            }
	          });
	}
	else
	{
		roles.Capabilities=newArr;
		users["Roles"]=roles;
		//return res.status(200).send(users);
		var msgJson=msg.successMessage("getAuthorization","0","Details of all user access capabilities.","Details of all user access capabilities.",users);
  	  	return res.status(200).send(msgJson);
	}
	}


/**
 * Description :Generating the json with all role and capability association of logged in user after successful authentication.
 */
function AuthorizationService(userName,res,req){
	var tempUSer=userName.split("/");
		var paramUser=tempUSer[tempUSer.length-1];
		logger.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-------->'+paramUser);
	UsersAccessModel.findOne({"userID":paramUser,"trashed": 'n'}).lean().exec(function (err, users) {
	      if (err) {       
	    	  logger.info("My Error "+err);
		      /*return res.status(500).send(err);*/
	    	  var errorCode=errorcodes["DBError"];
  	    		res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
  	    		internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
  	    		return;
	      }
	      else if(!users)
	    	  {
	    	  	//return res.status(404).send('No user access found');
	    	  	logger.info('Auto useraccess added');
	    	  	/*var n = userName.indexOf("ibm.com");
	    	  	if(n<1)
	    	  		{
	    	  			var msgJson=msg.successMessage("getAuthorization","1","You are not authorized to access swarnasetu portal","You are not authorized to access swarnasetu portal",users);
		  	  	  		return res.status(200).send(msgJson);
	    	  		}
	    	  	else
	    	  		{
	    	  			
	    	  			CreateUserAccess(paramUser,res,req);
	    	  		}*/
	    	  	CreateUserAccess(paramUser,res,req);
	    	  	
	    	  }
	    	  
	      else {
	    	  
	    	  logger.info('11111111111111');
	    	  RolesModel.findOne({"roleName":users.roleName,"trashed": 'n'}).lean().exec(function (err, roles) {
                  if (err) {
                	  logger.info('222222222222');
                    logger.info("My Error "+err);
                    /*return res.status(500).send(err);*/
                    var errorCode=errorcodes["DBError"];
              res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
              internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
              return;
                  }
                  else if(!roles)
                    {
                	  logger.info('3333333333333333');
                    //return res.status(404).send('No role found');
                    var errorCode=errorcodes["RoleNameInvalid"];
            res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
            internalMessage:errorCode.internalMessage,userMessage:errorCode.userMessage,response:{}});
            return;
                    }
                  else {
                    logger.info("printing user roles...");
                    logger.info(roles);
                    
                    //users["Role"]=roles;
                    var capListArr=[];
                    var newArr=[];
                    var capList=roles.capabilityNameList;
                    if(capList!=''&& capList!=undefined)  
                      capListArr=capList.split(",");
                      getCapList(users,roles,capListArr,0,res,newArr);
                    
                  }
                });
	      }
	    });
}


/**
 * Description :For creating new record for user access 
 */
function CreateUserAccess(userName,res,req){
	var user = new UsersAccessModel({
		//_id: mongoose.Types.ObjectId(),
		  userName: userName,
		  userID:userName,
		  roleName: 'DEFAULT', 
		  //account: req.body.account, 
		  type: 'Normal', 
		  active: 'Y',
		  //email:req.body.email,
		  updateTimestamp:new Date().toISOString(),
		  //updatedByUserId: req.body.updatedByUserId, 
		  //updateComment: req.body.updateComment,
		  trashed:'n',

	    });
	  user.save(function (err) {
	    if (err) {
	    	var errorCode=errorcodes["DBError"];
	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	return;
	    } else {
	    	AuthorizationService(userName,res,req);
	    }
	  });
}


//------------------ START SSO configuration ------------------
//console.log("For SSO Config...");

var passport = require('passport'); 
var cookieParser = require('cookie-parser');
//var bodyParser = require('body-parse');
var session = require('express-session'); 

app.use(cookieParser());
//app.use(bodyParser());
app.use(session({resave: 'true', saveUninitialized: 'true' , secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session());

/*app.use(function(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	  next();
});*/

passport.serializeUser(function(user, done) {
logger.info("serialized user  = "+user);
done(null, user);
}); 

passport.deserializeUser(function(obj, done) {
done(null, obj);
});         

//VCAP_SERVICES contains all the credentials of services bound to
//this application. For details of its content, please refer to
//the document or sample of each service.  
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");

if(!services["SingleSignOn"]){
	services["SingleSignOn"] = [{
		"credentials": {
	    	"secret": "IqBp6gM9Dz",
	    	"tokenEndpointUrl": "https://ibm-cegmjdajqo-cix9.iam.ibmcloud.com/idaas/oidc/endpoint/default/token",
	    	"authorizationEndpointUrl": "https://ibm-cegmjdajqo-cix9.iam.ibmcloud.com/idaas/oidc/endpoint/default/authorize",
	    	"issuerIdentifier": "ibm-cegmjdajqo-cix9.iam.ibmcloud.com",
	    	"clientId": "Y8Sf1NdJNf",
	    	"serverSupportedScope": ["openid"]
	    }
	}];
}

var ssoConfig = services.SingleSignOn[0];
var client_id = ssoConfig.credentials.clientId;
var client_secret = ssoConfig.credentials.secret;
var authorization_url = ssoConfig.credentials.authorizationEndpointUrl;
var token_url = ssoConfig.credentials.tokenEndpointUrl;
var issuer_id = ssoConfig.credentials.issuerIdentifier;
//var callback_url = "http://swarnasetu.mybluemix.net/rest/v1/sopmeta/ssocallback";
//var callback_url = globalUrl.callback_url;
var callback_url = systemEnv.base_uri+"/rest/v1/sopmeta/ssocallback";
/*logger.info('test global variable');
logger.info(globalUrl.callback_url);*/
var globarUserId;

var OpenIDConnectStrategy = require('passport-idaas-openidconnect').IDaaSOIDCStrategy;
var Strategy = new OpenIDConnectStrategy({
             authorizationURL : authorization_url,
             tokenURL : token_url,
             clientID : client_id,
             scope: 'openid',
             response_type: 'code',
             clientSecret : client_secret,
             callbackURL : callback_url,
             skipUserProfile: true,
             issuer: issuer_id}, 
	function(accessToken, refreshToken, profile, done) {
	    process.nextTick(function() {
			profile.accessToken = accessToken;
			profile.refreshToken = refreshToken;
			logger.info('STEPPPPPPPPP22222222222222.0000000');
			logger.info('Access token---------------------------');
			logger.info(accessToken);
			
			logger.info('Refresh token---------------------------');
			logger.info(refreshToken);
			
			logger.info("profile data+++++++++++++++++++++++");
			logger.info(profile);
			//logger.info(profile.id);
			//logger.info(profile.refreshToken);
			var str = profile.id;
			var strSplit = str.split("/");
			session.loggedInUserId = strSplit[strSplit.length-1];
			logger.info('Test Session Value ==========>'+session.loggedInUserId);
			done(null, profile);
     	})
});

passport.use(Strategy); 

var authRouter = express.Router();
app.use('/sso', authRouter);

/**
 * url :/rest/v1/sopmeta/login
 * Description :For cloud login
 * Method : GET
 */
//exports.login = passport.authenticate('openidconnect', {});

exports.login = function(req, res) {
	
	logger.info('Its db connetion authenticate');
	var obj=req.body;
	logger.info(JSON.stringify(obj));
	dbAuthentication(req, res);
}

/**
 * url :/rest/v1/sopmeta/loginPrem
 * Description :For on premise login
 * Method : POST
 */
exports.loginPrem = function(req, res) {
	
	/*var authType=appProperty['deployment-specific-properties']['ON_PREM'].authenticationEnterprise;
	logger.info('AUTTHTYPE ================= '+authType);
	if(authType=="")
	{
		logger.info('Its db connetion authenticate');
		dbAuthentication(req, res);
	}
	else if(authType=="bluepage")
	{
		logger.info('AUTTHTYPE !!!!!!!!!!!!!!!!!!');
		authenticateBluePages(req,res);
	}
	else if(authType=="enterprise")
	{
		logger.info('Authenticate Enterprise 111');
		authenticateEnterprise(req, res)
	}*/
	
	
	//*********************************************************************************************
	
	var IBM_BLUEPAGE  =  'ibmbluepages';
	var ENTERPRISE	=	"enterprise";
	var authType=req.body.authenticationFrom;
	
	logger.info('Auth type ======= > '+authType);
	
	if(authType==IBM_BLUEPAGE)
	{
		logger.info('AUTTHTYPE !!!!!!!!!!!!!!!!!!');
		authenticateBluePages(req,res);
	}
	else if(authType==ENTERPRISE)
		{
			var protocol=appProperty['deployment-specific-properties']['ON_PREM'].authenticationProtocol;
			if(protocol=="")
			{
				logger.info('Its db connetion authenticate');
				dbAuthentication(req, res);
			}
			else
				{
					logger.info('Authenticate Enterprise 111');
					authenticateEnterprise(req, res);
				}
		}
}

/**
 * Description :For database authentication in OnPrem.
 */
function dbAuthentication(req, res) {

	UserCredentialModel.findOne({"userName":req.body.userName}).lean().exec(function (err, usercred) {
	            if (err) {       
	            	var errorCode=errorcodes["DBError"];
	    	    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
	    	    	internalMessage:err.message,userMessage:errorCode.userMessage,response:{}});
	    	    	return;
	            }
	            else if(!usercred){
			    	res.status(400).send('false');
	            }  
	            else {
	              /*logger.info('ARIJIT 9999999999999999====================>');*/
	            	var bcrypt = require('bcrypt-nodejs');
	            	var encpwd=usercred.password;
	            	var result=bcrypt.compareSync(req.body.password,encpwd);
	            	if(result==true)
	            		{
	            		
	            		var crypto = require('crypto');
	      	    	  	var buf = crypto.randomBytes(16);
	      	    	  	var tokenkey=buf.toString('hex');
	      	    	  
	            		var loggedObj = {};
	      	    	  	loggedObj["loggedUser"]=req.body.userName;
	      	    	  	loggedObj["loggedinTime"]=new Date().toISOString();
	      	    	  	logger.info('new json =========> '+loggedObj);
	      	    	  	var success = myCacheSession.set( tokenkey, loggedObj, 10000 );
	      	    	  	logger.info('Success =====? > '+success);
	      	    	  	res.status(200).send(tokenkey);
	      	    	  	
	            		}
	            		
	            	else
	            		res.status(400).send('false'); 		
	            }

	          });
}


/**
 * Description :For IBM Bluepage authentication in OnPrem.
 */
function authenticateBluePages(req,res) {

	logger.info('??????????????????????????????????????????');
	var ldap = require('ldapjs');
	var DN = '';

	//var TYPE=appProperty['deployment-specific-properties']['ON_PREM'].authenticationProtocol;
	//define  global variables for IBM BluePages
	var URL= enterpriseauthentication.BLUEPAGE.serverUrl;  //'ldap://bluepages.ibm.com';
	var PORT= enterpriseauthentication.BLUEPAGE.port;	//'389';
	var BLUEPAGE_LDAP_SERVER_URL = URL+":"+PORT;  //'ldap://bluepages.ibm.com:389';
	var BLUEPAGE_BASE_DN = enterpriseauthentication.BLUEPAGE.baseDN;		//'ou=bluepages,o=ibm.com';
	var BLUEPAGE_AUTHENTICATED = false;
	var BLUEPAGE_OBJECT_CLASS = enterpriseauthentication.BLUEPAGE.objectClass;		//'ibmperson';

	var retValue='';
	var intranetId = req.body.userName;
	var password = req.body.password;
	
	logger.info("userId="+intranetId);
	//console.log("password="+password);

	
	//sess = req.session;
	
	
	var client = ldap.createClient({
		url: BLUEPAGE_LDAP_SERVER_URL
	});
	
	logger.info('IBM BluePages LDAP client sucessfully connected.');
	
	//creating a filter for searching LDAP and getting the username
	var opts = {
		filter: '(&(objectclass='+BLUEPAGE_OBJECT_CLASS+')(mail='+intranetId+'))',
		scope: 'sub',
		attributes: ['uid']
	};
	
	//Search for user ID for validation
	client.search(BLUEPAGE_BASE_DN, opts, function(err, resp) {
		if(err){
			
			retValue="Login Failed 000000: "+err;
			logger.info(retValue);
			res.status(400).send(retValue);
		}
		else{
			resp.on('searchEntry', function(entry) {
				
				if(entry.object){
					var UID = entry.object;
					logger.info(UID);
					DN = UID.dn ;
					logger.info('DN: ' + DN);
				}
			});
			resp.on('error', function(error) {
				retValue="Login Failed 111: "+error;
				logger.info(retValue);
				res.status(400).send(retValue);
			});
			resp.on('end', function(entry) {
				client.bind(DN, password, function(err) {
					if (err)
					{
						DN ='';
						retValue="Login Failed 222: "+err;
						logger.info(retValue);
						res.status(400).send(retValue);

					}
					else
					{
						DN='';
						//sess.intranetId = intranetId;
						retValue="Login sucessfull";
						logger.info(retValue);
						 res.status(200).send('true');
					}
				});
				client.unbind(function(error){
					if(error){
						retValue="Login Failed 333: "+error;
						logger.info(retValue);
						res.status(400).send(retValue);
					} else{
						logger.info('IBM BluePages LDAP client sucessfully disconnected');
					}
				});
			});
		}
	});
	
	//res.end( "IBM BluePages Authenticate service over.");
}//end of bluepageAuthenticate  function*/ 


/**
 * Description :For enterprise LDAP Authentication in OnPrem.
 */
function authenticateEnterprise(req, res) {
	
	var ldap = require('ldapjs');

	var DN = '';
	var TYPE=appProperty['deployment-specific-properties']['ON_PREM'].authenticationProtocol;
	
	// define global variables for enterprise
	var URL= enterpriseauthentication.LDAP.serverUrl;  //'ldap://ldap.forumsys.com';
	var PORT= enterpriseauthentication.LDAP.port;	//'389';
	
var ENTERPRISE_LDAP_SERVER_URL = URL+":"+PORT; //'ldap://ldap.forumsys.com:389';
var ENTERPRISE_LDAP_BASE_DN =  enterpriseauthentication.LDAP.baseDN; //cn=read-only-admin,dc=example,dc=com';
var ENTERPRISE_OBJECT_CLASS = enterpriseauthentication.LDAP.objectClass; //'';
var ENTERPRISE_EMAIL_DOMAIN =  enterpriseauthentication.LDAP.emailDomain; //'@ldap.forumsys.com';

	logger.info('qwertyuuuuuuuuuuuuuuuuuuu');
	var retValue='';
	
	var userId = req.body.userName;
	var password = req.body.password;

	logger.info("userId=" + userId);
	//console.log("password=" + password);

	//sess = req.session;
	var client = ldap.createClient({
		url : ENTERPRISE_LDAP_SERVER_URL
	});
	logger.info('LDAP client sucessfully connected.');
	// creating a filter for searching LDAP and getting the username
	
	
	
	var opts = {
		// filter: '(&(objectclass=*)(uid='+userId+'))',
		// scope: 'base',
		attributes : [ 'uid' ]
	};
	
	 
	 
	logger.info("filters="+opts.filter);
	
	// Search for user ID for validation
	client.search(ENTERPRISE_LDAP_BASE_DN, opts, function(err, resp) {
		if (err) {
			retValue="Login Failed 000000: "+err;
			logger.info(retValue);
			res.status(400).send(retValue);
		} else {
			resp.on('searchEntry', function(entry) {
				logger.info('----->1 searchEntry: ' + entry); 
				if (entry.object) {
					var UID = entry.object;
					logger.info(entry.object);
					DN = UID.dn;
					logger.info('----->2 DN: ' + DN);
				}
			});

			res.on('searchReference', function(referral) {
				logger.info('referral: ' + referral.uris.join());
			});

			resp.on('error', function(error) {
			//	console.error('----->3 error: ' + error.message);
				retValue="Login Failed : 111111-->"+error;
				logger.info(retValue);
			res.status(400).send(retValue);
			});
			resp.on('end', function(entry) {

				//console.log('----->2 entry: ' + entry);

				client.bind(DN, password, function(err) {
					if (err) {
						DN = '';
						//console.error(err);
						retValue="Login Failed 2222222: ==>"+err;
						logger.info(retValue);
			res.status(400).send(retValue);
					} else {
						DN = '';
						//sess.intranetId = userId;
						retValue="Login sucessfull";
						logger.info(retValue);
			res.status(200).send('true');
					}
				});
				client.unbind(function(error) {
					if (error) {
						retValue="Login Failed 3333333: "+error;
						logger.info(retValue);
			res.status(400).send(retValue);
					} else {
						console.log('LDAP client sucessfully disconnected.');
					}
				});
			});
		}
	});
	//res.end( "Enterprise Authenticate service over.");
}// end of Enterprise Authentication function*/


/**
 * Description :For SSO Login
 */
/*function ensureAuthenticated(req, res, next) {
	
	logger.info('step3333333333333333333=======================');
	logger.info("req.originalUrl = "+req.originalUrl);
	logger.info("req.isAuthenticated() = "+req.isAuthenticated());
	logger.info(req.body);
	logger.info(req.body.username);
	logger.info(req.username);
	if(!req.isAuthenticated()) {		
	    req.session.originalUrl = req.originalUrl;
	    //res.redirect(globalUrl.moduleSOPUrl+'/login');
	    res.redirect("/rest/v1/sopmeta/login");
	} else {
		return next();
	}
}*/


/**
 * url :/rest/v1/sopmeta/ssocallback
 * Description :For SSO login service this callback is used.
 * Method : GET
 */
exports.ssocallback = function(req,res,next) {
	
	logger.info('step111111111111111111-?==========================');
	passport.authenticate('openidconnect',function(err,result) {
	    if (err) {
	    	/*console.log("error ============================== "+err);*/
	    	logger.info(err);
	      } else {
	    	  
	    	  //*****************************************************************
	    	  var crypto = require('crypto');
	    	  var buf = crypto.randomBytes(16);
	    	  var tokenkey=buf.toString('hex');
	    	  //*******************************************************************

	    	  //var redirect_url = systemEnv.base_uri+"/ama/index.html?userId="+session.loggedInUserId;
	    	  var redirect_url = systemEnv.base_uri+"/ama/index.html?token="+tokenkey;
	    	  logger.info('newurl============> '+redirect_url);
	  
	    	  //var redirect_url = "https://swarnasetu.mybluemix.net/ama/index.html?userId="+session.loggedInUserId;
				//logger.info("============================ redirect url ========================= "+redirect_url);
				//logger.info("======================= result ========================= "+result);
	    	  
	    	   var loggedObj = {};
	    	  loggedObj["loggedUser"]=session.loggedInUserId;
	    	  loggedObj["loggedinTime"]=new Date().toISOString();
	    	  logger.info('new json =========> '+loggedObj);
	    	  var success = myCacheSession.set( tokenkey, loggedObj, 10000 );
	    	  logger.info('Success =====? > '+success);
				res.redirect(redirect_url);
	      }
	    })(req,res,next);
	
	//res.redirect(redirect_url);
}


/**
 * url :/rest/v1/sopmeta/postLogin
 * Description :Service for post login ie after authentication from cloud directory or SAML
 * Method : GET
 */
/*exports.postLogin = function(req, res) {
	
	logger.info('stepppppp5555555555555555=========================');
	ensureAuthenticated;
	var redirect_url = systemEnv.base_uri+"/sop_editor/index.html";
	logger.info("postLogin redirecting to "+redirect_url);
	res.redirect(redirect_url);
	
	
	
}*/

exports.checkLogin = function(req, res) {
	
	var mykey=req.body.token;
  	var value = myCacheSession.get(mykey);
  	logger.info('Get cache details=============================>');
  	logger.info(value);
  	if(value!=null || value!=undefined)
  		{
  			var moment = require('moment');
  			var logedTime=(value.loggedinTime).toString();
  			logger.info('loggedintime============= >'+logedTime);
  	  		var currentTime = moment(new Date().toISOString(),'YYYY-M-DD HH:mm:ss');
  	  		var loggedintime = moment(logedTime,'YYYY-M-DD HH:mm:ss');
  	  
  	  		var aa=currentTime.diff(loggedintime, 'seconds'); // 1
		  	var bb=aa.toString();
		  	logger.info('time diff in sec =========== > '+bb);
  			res.status(200).send(value);
  		}
  		
  	else
  		res.status(403).send('false');
}

/**
 * url :/rest/v1/sopmeta/failure
 * Description :This service is used to redirect if some failure occur during login in cloud.
 * Method : GET
 */
/*exports.failure = function(req, res) {
res.send('login failed');
}*/



/**
 * url :/rest/v1/sopmeta/logout/
 * Description :This service is used to logout from cloud .
 * Method : GET
 */
exports.logout=function(req,res){
	logger.info("logging out...");
	var redirect_url = systemEnv.base_uri;
	//var redirect_url='https://swarnasetu-sso-krmj4bycyg-cj10.iam.ibmcloud.com/idaas/mtfim/sps/idaas/logout'; 
	session.loggedInUserId = null;
	var mykey=req.body.token;
  	var value = myCacheSession.del(mykey);
	logger.info(value);
    req.logout();
    res.redirect(redirect_url);
}

//------------------ END SSO configuration ------------------


/**
 * url :/rest/v1/adminmeta/getApplicationProperties
 * Description :Return the app_config json data
 * Method : GET
 */
exports.getApplicationProperties = function(req, res) {
	
	logger.info('arijit chatterjjee 29 sep 2015====================>');
	res.status(200).send(appProperty);
	//logger.info(systemProp1.uiconfig);
	//res.status(200).send(systemProp1);
}


/**
 * url :/rest/v1/adminmeta/createUserCredential
 * Description :This service is used to create new user credential which is used for db authentication during OnPrem 
 * Method : POST
 */
exports.createUserCredential = function(req, res) {
	
	var bcrypt = require('bcrypt-nodejs');
	var pin=req.body.password;
	var hash = bcrypt.hashSync(pin);
	
	UserCredentialModel.findOne({"userName":req.body.userID}).lean().exec(function (err, users) {
		if(err)
			{
			var errorCode=errorcodes["DBError"];
		    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
		    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
		    	return;
			}
		else if(!users)
			{
			var usercred = new UserCredentialModel({
				//_id: mongoose.Types.ObjectId(),
				  userName: req.body.userID,
				  password:hash,
				  trashed:'n',

			    });
			  usercred.save(function (err) {
			    if (err) {
			    	var errorCode=errorcodes["DBError"];
			    	res.status(errorCode.statusCode).json({operationName:req.originalUrl,serviceCode:errorCode.serviceCode,
			    	internalMessage:err,userMessage:errorCode.userMessage,response:{}});
			    	return;
			    } else {
			    	
			    	return res.status(200).send('User credential created succesfully.');
			    	
			    }
			  });
			}
		else
			{
				return res.status(400).send('User id already exists..plz try .');
			}
	});
	
}


/**
 * url :/rest/v1/adminmeta/changePassword
 * Description :This service is used to change the password of a specific  user credential in OnPrem 
 * Method : POST
 */
exports.changePassword=function(req,res){
	 
	var bcrypt = require('bcrypt-nodejs');
	var uid=req.body.id;
 	var pin=req.body.newPassword;
  	var hash = bcrypt.hashSync(pin);
  	
	UserCredentialModel.findById(uid, function (err, user){
		 user.password= hash;
		 
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
			    	  
			          var msgJson=msg.successMessage("UpdateUserCredenial","0","UsersCredentials details updated successfully","UsersCredentials details updated successfully",user);
			    	  return res.status(200).send(msgJson);
			      }
			    });
			 
		  
	  });
}
