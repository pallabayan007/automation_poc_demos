var globalUName = '';
var globalSOP = 'AlertSOP';
var loggedUserId = '';
app.controller("UserAuth",function($scope,$http){
	var queryURL  = window.location.search.substring(7);
	localStorage.setItem("tokenId", queryURL);
	console.log('Index page token ID: '+queryURL);
	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";	
	var dataToken =  {							  
		   "token":queryURL		   
	 };
	var responsePromiseToken = $http.post(checkLogin, dataToken, {});				
	responsePromiseToken.success(function(dataFromServer, status, headers, config) {
	console.log("User From token: "+dataFromServer.loggedUser);
		loggedUserId = dataFromServer.loggedUser;
		localStorage.setItem("TestUserID", loggedUserId);	
		
		/*Code for Initial data load*/
		var testDBExistsToken = {
				"UserId" : localStorage.getItem("TestUserID")
		}	
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";	
		var responsePromisetestDBExists = $http.get(testDBExists, testDBExistsToken, {});
		responsePromisetestDBExists.success(function(dataFromServer, status, headers, config) {
			console.log("testDB: "+dataFromServer);
			$http.get(getAuthorization+'?userID='+loggedUserId).success(function(data) {
				setTimeout(function(){
					console.log("Authorization successful!" + data.response);
					var ls_serviceCode = data.serviceCode;
					var userMessage = data.userMessage;		
					if(ls_serviceCode==0){
						var authData = data.response;
						var authRole = data.response.Roles;					
						var _iduser = authData._id;
						var userName = authData.userName;
						globalUName = authData.userName;
						var userID = authData.userID;
						var roleName = authData.roleName;
						var accountID = authData.accountID;
						var type = authData.type;
						var active = authData.active;
						var typeGlobal = authData.type;
						var accountName = authData.accountName;
						var roleName = authRole.roleName;
						var roleDescription = authRole.roleDescription;
						var capabilityNameList = authRole.capabilityNameList;
						var Capabilities = authRole.Capabilities;
				
						localStorage.setItem("_iduser", _iduser);
						localStorage.setItem("servicecode", ls_serviceCode);
						localStorage.setItem("usermessage", userMessage);
						localStorage.setItem("username", userName);
						localStorage.setItem("userID", userID);
						localStorage.setItem("roleName", roleName);
						localStorage.setItem("accountID", accountID);
						localStorage.setItem("type", type);
						localStorage.setItem("active", active);
						localStorage.setItem("accountName", accountName);
						localStorage.setItem("roleName", roleName);
						localStorage.setItem("roleDescription", roleDescription);
						localStorage.setItem("capabilityNameList", capabilityNameList);
						localStorage.setItem("Capabilities",JSON.stringify(Capabilities));		
						console.log("Global User type and Name : "+typeGlobal+" - "+globalUName);
						if(typeGlobal =='Normal'){
							$('#adminLink').hide();
						}else if(typeGlobal =='Admin' ){
							$('#adminLink').show();
						}else if(typeGlobal == 'SuperAdmin'){
							$('#adminLink').show();
						} 
					
						$("#homepage-username").html(localStorage.getItem("username")); 
						var active_user = (localStorage.getItem("active")).toLowerCase();
						var auth_servicecode = localStorage.getItem("servicecode");
						var auth_usermessage = localStorage.getItem("usermessage");
						console.log("active_user :" + active_user);
						console.log("auth_servicecode :" + auth_servicecode);
						console.log("auth_usermessage :" + auth_usermessage);
						 if (typeof(active_user) != 'undefined' && active_user != null){
					          if(active_user != "y"){
					        	  //$("#welcome_message").html("Your access on swaransetu portal has been revoked");	
					        	  $('#homepage_content').hide();
					        	  window.location.href = docDomain;	
					         }else{
					     		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
					    		$http.get(GetUserAccess + '?userID='+localStorage.getItem("userID")).success(function(data) { 
					    		//$http.get(GetUserAccess + '?userID=sauser').success(function(data) { 
					    			var dataArray = data.response;
					    			var accountArray = dataArray.account;
					    	     	for (var i = 0; i < accountArray.length; i++){      		    		
					    	     		//$('#accountSelOps').append("<option value='"+accountArray[i].accountId+"'>"+accountArray[i].accountName+"</option>");
					    	     		firstAccountId = accountArray[0].accountId;
					    	     		firstAccountName = accountArray[0].accountName;
					    	     	} 
					    	     	//$("#accountSelOps option[value='"+firstAccountId+"']").attr("selected","selected");
					    	     	//$("#accountNameNav").html(firstAccountName);
					    	     	localStorage.setItem("accountName", firstAccountName);
					    	     	localStorage.setItem("accountId", firstAccountId);
					    	     	var currClientName;
					    	     	var currClientId;
					    	     	
					    	     	setTimeout(function(){
						    	 		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
						    	 		var responsePromise = $http.get(getClientfromAccount + '?accountName='+firstAccountName, {});
						    	 		responsePromise.success(function(data) { 
						    					var currObj = data.response;
						    	    			currClientName = currObj.clientName;
						    	    			currClientId = currObj.clientid;
						    	    			console.log("currClientName: "+currClientName);
						    	    			$("#clientNameNav").html(currClientName.toUpperCase());
						    	    			localStorage.setItem("clientName", currClientName);
						    	    			localStorage.setItem("clientId", currClientId);
						    			});	
						    	 		responsePromise.error(function(data) { 
						    	 			alert(data.userMessage);
						    	 		});
					    	 		
					    	     	}, 1200);
					    	     });
					    		$('#sop-username').html(localStorage.getItem("username"));
					         }
				        }else{
				       	 	alert('User is not active, please contact Administrator');
				        }
					   }else if(ls_serviceCode==1){
						   $("#welcome_message").html(userMessage); 	    	 	
			      	  	 	$('#homepage_content').hide(); 
			      	  	 	$('#aboutDialogButton').hide();       	  
			        	}
			    	}, 800);
			
				});	

		});
		responsePromisetestDBExists.error(function(dataFromServer, status, headers, config) {
			console.log("testDB: "+dataFromServer);
			if(dataFromServer != false){	
				$("#showAutoBackContainerDL").show();
				$("#initialDataLoad").show();
			}
		});
		/*Code for Initial data load Ends--*/
	});
	responsePromiseToken.error(function(data, status, headers, config) {
		//$("#welcome_message").html("Your access on swaransetu portal has been revoked");	
		window.location.href = docDomain;
    	console.log("Unauthorized Access from Response!");
   });
	
	$scope.cancelInitialDataLoad = function(){
		$("#showAutoBackContainerDL").hide();
		$("#initialDataLoad").hide();
		var dataToken =  {							  
				   "token":localStorage.getItem("tokenId")		   
		};	
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";	
		console.log("logout data token: "+dataToken);
		var responsePromiseToken = $http.post(logout, dataToken, {});
		responsePromiseToken.success(function(dataFromServer, status, headers, config) {
 		console.log("Authorization cancelled-Logout successful!");
 		localStorage.clear();
 		window.location.href = logoutDomain + '/idaas/mtfim/sps/idaas/logout';
 								//docDomain+'/ama/logout.html';
	 	});	    	
	 	responsePromiseToken.error(function(data, status, headers, config) {
	     	console.log("Logout not successful!");
	    });	
	};
	
	$scope.callInitialDataLoad = function(){
		console.log('INITIAL Data Loading.....')
		var initialDataLoadParam = {
				"UserId" : localStorage.getItem("TestUserID")
		}
		var responsePromiseinitialDataLoad = $http.post(initialDataLoad, initialDataLoadParam, {});
		responsePromiseinitialDataLoad.success(function(dataFromServer, status, headers, config) {
			console.log("Initial data load: "+dataFromServer);		
			$http.get(getAuthorization+'?userID='+loggedUserId).success(function(data) {
				$("#showAutoBackContainerDL").hide();
				$("#initialDataLoad").hide();
				setTimeout(function(){
					console.log("Authorization successful!" + data.response);
					var ls_serviceCode = data.serviceCode;
					var userMessage = data.userMessage;		
					if(ls_serviceCode==0){
						var authData = data.response;
						var authRole = data.response.Roles;					
						var _iduser = authData._id;
						var userName = authData.userName;
						globalUName = authData.userName;
						var userID = authData.userID;
						var roleName = authData.roleName;
						var accountID = authData.accountID;
						var type = authData.type;
						var active = authData.active;
						var typeGlobal = authData.type;
						var accountName = authData.accountName;
						var roleName = authRole.roleName;
						var roleDescription = authRole.roleDescription;
						var capabilityNameList = authRole.capabilityNameList;
						var Capabilities = authRole.Capabilities;
				
						localStorage.setItem("_iduser", _iduser);
						localStorage.setItem("servicecode", ls_serviceCode);
						localStorage.setItem("usermessage", userMessage);
						localStorage.setItem("username", userName);
						localStorage.setItem("userID", userID);
						localStorage.setItem("roleName", roleName);
						localStorage.setItem("accountID", accountID);
						localStorage.setItem("type", type);
						localStorage.setItem("active", active);
						localStorage.setItem("accountName", accountName);
						localStorage.setItem("roleName", roleName);
						localStorage.setItem("roleDescription", roleDescription);
						localStorage.setItem("capabilityNameList", capabilityNameList);
						localStorage.setItem("Capabilities",JSON.stringify(Capabilities));		
						console.log("Global User type and Name : "+typeGlobal+" - "+globalUName);
						if(typeGlobal =='Normal'){
							$('#adminLink').hide();
						}else if(typeGlobal =='Admin' ){
							$('#adminLink').show();
						}else if(typeGlobal == 'SuperAdmin'){
							$('#adminLink').show();
						} 
					
						$("#homepage-username").html(localStorage.getItem("username")); 
						var active_user = (localStorage.getItem("active")).toLowerCase();
						var auth_servicecode = localStorage.getItem("servicecode");
						var auth_usermessage = localStorage.getItem("usermessage");
						console.log("active_user :" + active_user);
						console.log("auth_servicecode :" + auth_servicecode);
						console.log("auth_usermessage :" + auth_usermessage);
						 if (typeof(active_user) != 'undefined' && active_user != null){
					          if(active_user != "y"){
					        	  //$("#welcome_message").html("Your access on swaransetu portal has been revoked");	
					        	  $('#homepage_content').hide();
					        	  window.location.href = docDomain;	
					         }else{
					     		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
					    		$http.get(GetUserAccess + '?userID='+localStorage.getItem("userID")).success(function(data) { 
					    		//$http.get(GetUserAccess + '?userID=sauser').success(function(data) { 
					    			var dataArray = data.response;
					    			var accountArray = dataArray.account;
					    	     	for (var i = 0; i < accountArray.length; i++){      		    		
					    	     		//$('#accountSelOps').append("<option value='"+accountArray[i].accountId+"'>"+accountArray[i].accountName+"</option>");
					    	     		firstAccountId = accountArray[0].accountId;
					    	     		firstAccountName = accountArray[0].accountName;
					    	     	} 
					    	     	//$("#accountSelOps option[value='"+firstAccountId+"']").attr("selected","selected");
					    	     	//$("#accountNameNav").html(firstAccountName);
					    	     	localStorage.setItem("accountName", firstAccountName);
					    	     	localStorage.setItem("accountId", firstAccountId);
					    	     	var currClientName;
					    	     	var currClientId;
					    	 		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
					    	 		var responsePromise = $http.get(getClientfromAccount + '?accountName='+firstAccountName, {});
					    	 		responsePromise.success(function(data) { 
					    					var currObj = data.response;
					    	    			currClientName = currObj.clientName;
					    	    			currClientId = currObj.clientid;
					    	    			console.log("currClientName: "+currClientName);
					    	    			$("#clientNameNav").html(currClientName.toUpperCase());
					    	    			localStorage.setItem("clientName", currClientName);
					    	    			localStorage.setItem("clientId", currClientId);
					    			});	
					    	 		responsePromise.error(function(data) { 
					    	 			alert(data.userMessage);
					    	 		});	
					    	     });
					    		$('#sop-username').html(localStorage.getItem("username"));
					         }
				        }else{
				       	 	alert('User is not active, please contact Administrator');
				        }
					   }else if(ls_serviceCode==1){
						   $("#welcome_message").html(userMessage); 	    	 	
			      	  	 	$('#homepage_content').hide(); 
			      	  	 	$('#aboutDialogButton').hide();       	  
			        	}
			    	}, 800);
			
				});
			
			
		});
		responsePromiseinitialDataLoad.error(function(dataFromServer, status, headers, config) {
			alert("Intial data load not possible. ");
		});
	};	
});


/* cookie functions starts here */

function createCookie(name, value, expires, path, domain) {
	  var cookie = name + "=" + escape(value) + ";";
	 
	  if (expires) {
	    // If it's a date
	    if(expires instanceof Date) {
	      // If it isn't a valid date
	      if (isNaN(expires.getTime()))
	       expires = new Date();
	    }
	    else
	      expires = new Date(new Date().getTime() + parseInt(expires) * 1000 * 60 * 60 * 24);
	 
	    cookie += "expires=" + expires.toGMTString() + ";";
	  }
	 
	  if (path)
	    cookie += "path=" + path + ";";
	  if (domain)
	    cookie += "domain=" + domain + ";";
	 
	  document.cookie = cookie;
	}

function deleteAllCookies() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
    	var cookie = cookies[i];
    	console.log("deleting cookie "+cookie+", "+i);
    	var eqPos = cookie.indexOf("=");
    	var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    	document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}  
function getCookie(name) {
	  var regexp = new RegExp("(?:^" + name + "|;\s*"+ name + ")=(.*?)(?:;|$)", "g");
	  var result = regexp.exec(document.cookie);
	  return (result === null) ? null : result[1];
	}


function deleteCookie(name, path, domain) {
	  // If the cookie exists
	  if (getCookie(name))
	    createCookie(name, "", -1, path, domain);
	}

/* cookie functions ends here */


/* MyCookie functions starts here */

/*function createMyCookie(name,value,days) {
	  if (days) {
	    var date = new Date();
	    date.setTime(date.getTime()+(days*24*60*60*1000));
	    var expires = "; expires="+date.toGMTString();
	  }
	  else var expires = "";
	  document.cookie = name+"="+value+expires+"; path=/";
	}

function readMyCookie(name) {
	  var nameEQ = name + "=";
	  var ca = document.cookie.split(';');
	  for(var i=0;i < ca.length;i++) {
	    var c = ca[i];
	    while (c.charAt(0)==' ') c = c.substring(1,c.length);
	    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	  }
	  return null;
	}

function eraseMyCookie(name) {
	  createCookie(name,"",-1);
	}*/

/* MyCookie functions ends here */

/* Date format and valid date function  starts */

function isDate(txtDate)
{
    var currVal = txtDate;
  //  if(currVal == '')
  //      return false;
    
    var rxDatePattern = /^(\d{1,2})(\/|-)(\d{1,2})(\/|-)(\d{4})$/; //Declare Regex
    var dtArray = currVal.match(rxDatePattern); // is format OK?
    
    if (dtArray == null) 
        return false;
    
    //Checks for mm/dd/yyyy format.
    dtDay = dtArray[1];
    dtMonth = dtArray[3];
    dtYear = dtArray[5];        
    
    if (dtMonth < 1 || dtMonth > 12) 
        return false;
    else if (dtDay < 1 || dtDay> 31) 
        return false;
    else if ((dtMonth==4 || dtMonth==6 || dtMonth==9 || dtMonth==11) && dtDay ==31) 
        return false;
    else if (dtMonth == 2) 
    {
        var isleap = (dtYear % 4 == 0 && (dtYear % 100 != 0 || dtYear % 400 == 0));
        if (dtDay> 29 || (dtDay ==29 && !isleap)) 
                return false;
    }
    return true;
}

/* Date format and valid date function  ends */

app.controller('EventsCtrl', function($scope, Idle) {
	  $scope.events = [];
	  $scope.idle = sessionTimeOutIdleMaxLimitInSec;
	  $scope.timeout = 5;
	
	  $scope.$on('IdleStart', function() {
	    addEvent({event: 'IdleStart', date: new Date()});
	  });
	
	  $scope.$on('IdleEnd', function() {
	    addEvent({event: 'IdleEnd', date: new Date()});
	  });
	
	  $scope.$on('IdleWarn', function(e, countdown) {
	    addEvent({event: 'IdleWarn', date: new Date(), countdown: countdown});
	  });
	
	  $scope.$on('IdleTimeout', function() {
	    addEvent({event: 'IdleTimeout', date: new Date()});
	  });
	
	  $scope.$on('Keepalive', function() {
	    addEvent({event: 'Keepalive', date: new Date()});
	  });
	
	  function addEvent(evt) {
	    $scope.$evalAsync(function() {
	      $scope.events.push(evt);
	    })
	  }
	
	  $scope.reset = function() {
	    Idle.watch();
	  }
	
	  $scope.$watch('idle', function(value) {
	    if (value !== null) Idle.setIdle(value);
	  });
	
	  $scope.$watch('timeout', function(value) {
	    if (value !== null) Idle.setTimeout(value);
	  });
})
.config(function(IdleProvider, KeepaliveProvider) {
	KeepaliveProvider.interval(10);
})
.run(function($rootScope, Idle, $log, Keepalive){
	Idle.watch();
	$log.debug('Session Timeout Watching.');
});
app.controller('logoutController', function($location, $scope, $http) {
	$scope.logout=function(){		
			 var dataToken =  {							  
				   "token":localStorage.getItem("tokenId")		   
			 };	
			 var r = confirm("Do you want to log out?");
			 if (r == true) {			 
					$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";	
					console.log("logout data token: "+dataToken);
					var responsePromiseToken = $http.post(logout, dataToken, {});
					responsePromiseToken.success(function(dataFromServer, status, headers, config) {
			    		console.log("Authorization cancelled-Logout successful!");
			    		localStorage.clear();
			    		/*if(deploy_type=='ON_PREM')
							logoutURl= logoutDomain + '/ama/logout.html';
						else
							logoutURl= logoutDomain + '/idaas/mtfim/sps/idaas/logout';*/
			    		window.location.href = logoutDomain + '/ama/logout.html'; 
			    								//docDomain+'/ama/logout.html';
			    	});	    	
			    	responsePromiseToken.error(function(data, status, headers, config) {
			        	console.log("Logout not successful!");
			        });	    	
			 }
	}
});

app.controller('onpremiseLoginController', function($location, $scope, $http) {
	$scope.submitLogin=function(){		
		  //  localStorage.setItem("username", sop_username);				
		 var dataObject =  {							  
				   "userName":$scope.user.accId,
				   "userPassword":$scope.user.passWord			   
			 };
			var responsePromise = $http.post("http://localhost:3000/rest/v1/sopmeta/login", dataObject, {});				
		   responsePromise.success(function(dataFromServer, status, headers, config) {
			      //console.log(dataFromServer.title);

				localStorage.setItem("usermessage", userMessage);
				localStorage.setItem("username", userName);
			   window.location.href = "ama/index.html";
			   });
		   
		    responsePromise.error(function(data, status, headers, config) {
		    	alert("Login Failed !");
		    	console.log("Login failed!");
		   });
/*	    	$http.post("http://localhost:3000/rest/v1/sopmeta/login").success(function(data) {
	    		
	    		window.location.href = docDomain;
	    	});
	    	console.log("Eser logged-in");		*/
	};
	
	
	$scope.callInitialDataLoad = function(){
		console.log('INITIAL Data Loading.....')
		var initialDataLoadParam = {
				"UserId" : localStorage.getItem("TestUserID")
		}
		var responsePromiseinitialDataLoad = $http.post(initialDataLoad, initialDataLoadParam, {});
		responsePromiseinitialDataLoad.success(function(dataFromServer, status, headers, config) {
			console.log("Initial data load: "+dataFromServer);		
			$http.get(getAuthorization+'?userID='+loggedUserId).success(function(data) {
				$("#showAutoBackContainerDL").hide();
				$("#initialDataLoad").hide();
				setTimeout(function(){
					console.log("Authorization successful!" + data.response);
					var ls_serviceCode = data.serviceCode;
					var userMessage = data.userMessage;		
					if(ls_serviceCode==0){
						var authData = data.response;
						var authRole = data.response.Roles;					
						var _iduser = authData._id;
						var userName = authData.userName;
						globalUName = authData.userName;
						var userID = authData.userID;
						var roleName = authData.roleName;
						var accountID = authData.accountID;
						var type = authData.type;
						var active = authData.active;
						var typeGlobal = authData.type;
						var accountName = authData.accountName;
						var roleName = authRole.roleName;
						var roleDescription = authRole.roleDescription;
						var capabilityNameList = authRole.capabilityNameList;
						var Capabilities = authRole.Capabilities;
				
						localStorage.setItem("_iduser", _iduser);
						localStorage.setItem("servicecode", ls_serviceCode);
						localStorage.setItem("usermessage", userMessage);
						localStorage.setItem("username", userName);
						localStorage.setItem("userID", userID);
						localStorage.setItem("roleName", roleName);
						localStorage.setItem("accountID", accountID);
						localStorage.setItem("type", type);
						localStorage.setItem("active", active);
						localStorage.setItem("accountName", accountName);
						localStorage.setItem("roleName", roleName);
						localStorage.setItem("roleDescription", roleDescription);
						localStorage.setItem("capabilityNameList", capabilityNameList);
						localStorage.setItem("Capabilities",JSON.stringify(Capabilities));		
						console.log("Global User type and Name : "+typeGlobal+" - "+globalUName);
						if(typeGlobal =='Normal'){
							$('#adminLink').hide();
						}else if(typeGlobal =='Admin' ){
							$('#adminLink').show();
						}else if(typeGlobal == 'SuperAdmin'){
							$('#adminLink').show();
						} 
					
						$("#homepage-username").html(localStorage.getItem("username")); 
						var active_user = (localStorage.getItem("active")).toLowerCase();
						var auth_servicecode = localStorage.getItem("servicecode");
						var auth_usermessage = localStorage.getItem("usermessage");
						console.log("active_user :" + active_user);
						console.log("auth_servicecode :" + auth_servicecode);
						console.log("auth_usermessage :" + auth_usermessage);
						 if (typeof(active_user) != 'undefined' && active_user != null){
					          if(active_user != "y"){
					        	  //$("#welcome_message").html("Your access on swaransetu portal has been revoked");	
					        	  $('#homepage_content').hide();
					        	  window.location.href = docDomain;	
					         }else{
					     		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
					    		$http.get(GetUserAccess + '?userID='+localStorage.getItem("userID")).success(function(data) { 
					    		//$http.get(GetUserAccess + '?userID=sauser').success(function(data) { 
					    			var dataArray = data.response;
					    			var accountArray = dataArray.account;
					    	     	for (var i = 0; i < accountArray.length; i++){      		    		
					    	     		//$('#accountSelOps').append("<option value='"+accountArray[i].accountId+"'>"+accountArray[i].accountName+"</option>");
					    	     		firstAccountId = accountArray[0].accountId;
					    	     		firstAccountName = accountArray[0].accountName;
					    	     	} 
					    	     	//$("#accountSelOps option[value='"+firstAccountId+"']").attr("selected","selected");
					    	     	//$("#accountNameNav").html(firstAccountName);
					    	     	localStorage.setItem("accountName", firstAccountName);
					    	     	localStorage.setItem("accountId", firstAccountId);
					    	     	var currClientName;
					    	     	var currClientId;
					    	 		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
					    	 		var responsePromise = $http.get(getClientfromAccount + '?accountName='+firstAccountName, {});
					    	 		responsePromise.success(function(data) { 
					    					var currObj = data.response;
					    	    			currClientName = currObj.clientName;
					    	    			currClientId = currObj.clientid;
					    	    			console.log("currClientName: "+currClientName);
					    	    			$("#clientNameNav").html(currClientName.toUpperCase());
					    	    			localStorage.setItem("clientName", currClientName);
					    	    			localStorage.setItem("clientId", currClientId);
					    			});	
					    	 		responsePromise.error(function(data) { 
					    	 			alert(data.userMessage);
					    	 		});	
					    	     });
					    		$('#sop-username').html(localStorage.getItem("username"));
					         }
				        }else{
				       	 	alert('User is not active, please contact Administrator');
				        }
					   }else if(ls_serviceCode==1){
						   $("#welcome_message").html(userMessage); 	    	 	
			      	  	 	$('#homepage_content').hide(); 
			      	  	 	$('#aboutDialogButton').hide();       	  
			        	}
			    	}, 800);
			
				});
			
			
		});
		responsePromiseinitialDataLoad.error(function(dataFromServer, status, headers, config) {
			alert("Intial data load not possible. ");
		});
	};	
	
	
});

/*Scope for Account List in SOP*/
var firstApplicationList = new Array();
var firstAccountId = '';
var firstAccountName = '';
var currLeftApplId ='';
var sopType ='S';
var ChoreographObj;
app.controller('accountPannel', function($scope, $http) {
	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	$http.get(GetUserAccess + '?userID='+localStorage.getItem("userID")).success(function(data) { 
	//$http.get(GetUserAccess + '?userID=sauser').success(function(data) { 
		var dataArray = data.response;
		var accountArray = dataArray.account;
		
		firstApplicationList.push(accountArray[0].applicationList);
     	for (var i = 0; i < accountArray.length; i++){      		    		
     		$('#accountSelOps').append("<option value='"+accountArray[i].accountId+"'>"+accountArray[i].accountName+"</option>");
     		firstAccountId = accountArray[0].accountId;
     		firstAccountName = accountArray[0].accountName;
     	} 
     	$("#accountSelOps option[value='"+firstAccountId+"']").attr("selected","selected");
     	//$("#accountNameNav").html(firstAccountName);
     	var currClientName;
 		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
 		$http.get(getClientfromAccount + '?accountName='+firstAccountName).success(function(data) { 
				var currObj = data.response;
    			currClientName = currObj.clientName;
    			console.log("currClientName: "+currClientName);
    			$("#clientNameNav").html(currClientName.toUpperCase());
		});			
     	var applArray = firstApplicationList[0];
     	for (var j = 0; j < applArray.length; j++){   
     		$('#leftSelAppl').append("<option value='"+applArray[j].applicationId+"'>"+applArray[j].applicationName+"</option>");
     	}
     });
	
 	$(document).on('change', '#accountSelOps', function(event) {		
		firstAccountId = $("#accountSelOps").val();
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		$http.get(GetUserAccess + '?userID='+localStorage.getItem("userID")).success(function(data) { 
		//$http.get(GetUserAccess + '?userID=sauser').success(function(data) { 
			var dataArray = data.response;
			var accountArray = dataArray.account;
			$('#leftSelAppl').html('');	
			$('#applNameCreate').html('');
	     	for (var i = 0; i < accountArray.length; i++){ 
	     		if(accountArray[i].accountId == firstAccountId){
	     			var applicationList = new Array();
	     			applicationList = accountArray[i].applicationList;
	     			for (var j = 0; j < applicationList.length; j++){ 
	     				$('#leftSelAppl').append("<option value='"+applicationList[j].applicationId+"'>"+applicationList[j].applicationName+"</option>");
	     				$('#applNameCreate').append("<option value='"+applicationList[j].applicationId+"'>"+applicationList[j].applicationName+"</option>");	     				
	     			}
	     			
	     		}
	     		
	     	} 
		});
		//***************************Change by Arijit Start********************************
		console.log('Test the value comes here..................');
		console.log(firstAccountId);
		$http.get(GetApplicationListForAccount + '?accountId='+firstAccountId).success(function(data) {
			$scope.receivedData = [];
			$scope.receivedData = data.response;
			  $scope.currentPage = 1;
			  $scope.numPerPage = 6;
			  $scope.maxSize = 5;
	
			  
			  $scope.$watch('currentPage + numPerPage', function() {
			    var begin = (($scope.currentPage - 1) * $scope.numPerPage)
			    , end = begin + $scope.numPerPage;
			    $scope.applist = $scope.receivedData.slice(begin, end);
			  });
	    
		});
		
		//*********************************End*********************************************
 	});
	
});
/*Scope for Account List in SOP Ends here*/
/* Controller for Search, Filter, Create and Update, Delete SOP*/
var currentAlertId;
var currentTicketId;
var TaskExecutionFlowID;
var taskExeArray = new Array();
var currentuserID = '';
var currentroleID = '';
var sopReportData = '';
var alertRaiseTimeVal = '';
var firstApplicationId = '';
var sopalertId = '';
var sop_id = '';
var alertId = '';
var ticketId = '';
var createdByUserIdSOP;
var createTimestampSOP;
var PDFSOPReportName;
var currAutoProvider = '';
var currClientId = '';
var currClientName ='';
var currAccId = '';
var currAccName = '';
var automataJSONobj;
var automataJSONobjRes = [];
var wholesopFlag = "true";
var sameautomationFlag = "true";
var sopAutomationParam = 1;
var ipsoftAutomationInput = [];
var ipsoftAutomationResInput = [];
var rowValUP = 1;
var currActiveStatus = '';
var activeMode;
var validateGraph = '';

//var applicationListArray= new Array();
app.controller('updateFormCtrl', function($location, $scope, $http, $window) {
/* exit without update alert message  - starts */
/*	var win = $window;	
	  $scope.$watch('updateSOPForm.$dirty', function(value) {
	    if(value) {
	      win.onbeforeunload = function(){
	        return 'Warning : Any unsaved data will be lost';
	      };
	    }
	  });*/
	  /* exit without update alert message  - ends */
	$scope.createsop = {};
	firstAccountId = $("#accountSelOps").val();
	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	$http.get(GetApplicationListForAccount+'?accountId='+firstAccountId).success(function(data) { 
			var dataArray = data.response;
	     	for (var i = 0; i < dataArray.length; i++){      		
	     		$scope.applications = dataArray;
	     	}    	
	 });
	$scope.showProcessTip= function(){
		var processShortDesc = $("#selectProcessValueUp option:selected").val();
		$('#autoProcessOpShortDescUp').attr('title',processShortDesc);
	}
	 $scope.createsop.updateForm = function(item, event) {
		  	var d = new Date();
	        var month = d.getMonth()+1;
	        var mVal ="";
	        if(month == 1){mVal='JAN';}else if(month == 2){mVal = 'FEB';}else if(month == 3){mVal = 'MAR';}else if(month == 4){mVal = 'APR';}
	        else if(month == 5){mVal = 'MAY'}else if(month == 6){mVal = 'JUN'}else if(month == 7){mVal = 'JUL'}else if(month == 8){mVal = 'AUG'}
	        else if(month == 9){mVal = 'SEP'}else if(month == 10){mVal = 'OCT'}else if(month == 11){mVal = 'NOV'}else if(month == 12){mVal = 'DEC'}
	        var day = d.getDate();
	        var timeInMs = 	            
	        	((''+day).length<2 ? '0' : '') + day+ '-' + mVal + '-' +d.getFullYear() ;
		   
		   var upAlertname = $('#alertname').val();
		   var upAlertdescription = $('#alertdescription').val();
		   var upAlerttype = $('#alerttype').val();
		   var upAlertseverity = $('#alertseverity').val();
		   var upSopname = $('#sopname').val();
		   var upAutomationid = $('#automationid').val();
		   var upSopdescription = $('#sopdescription').val();
		   var upSoppurpose = $('#soppurpose').val();
		   var upSopclassification = $('#sopclassification').val(); /* 3 fields added starts */
		   var upSopexpectedinput = $('#sopexpectedinput').val();
		   var upSopexpectedoutput = $('#sopexpectedinput').val(); /* 3 fields added ends */
		   var upAutomationuserId = $('#automationuserIdup').val();
		   var upAutomationpassword = $('#automationpassword').val();
		   var upSelectAppl = $('#selectapplication').val();
		   var upComments = $('#upsopalertcomments').val();
		   var upAutomationProviderValue;
		   if(currAutoProvider == 'blueprism'){
			   upAutomationProviderValue = 'Not avaliable';
		   }else{
			   upAutomationProviderValue = ''; 
		   }
		   var upAutomationProviderDesc = 'None';
		   var selectProviderValueUp = $('#selectProviderValueUp').val();
		   var AutomationInputUp = $('#blueAutoGenUp').html();
		   var ExecuteAutomationVal = $("input[name='executeAutomationu']:checked").val();
		    if (ExecuteAutomationVal == 'scheduled') {
		       var ExecuteAutoVal = 'SJ';
		       var cronExpSel = $("#createTimeZoneu option:selected").attr('value');
			   var upActiveCron = $("input[name='timeZoneu']:checked").val();
			   var triggerOnVal = $('#triggerOnValu').val();
			   var sobJobNameUpdate = $('#sopjobnmu').val();
			   var scheduledetailsUpdate = $('#scheduledetailsu').val();
		    }else{
		    	var ExecuteAutoVal = 'RT';
			    var cronExpSel = 'NOT Available';
				var upActiveCron = 'NOT Available';
				var triggerOnVal = 'NOT Available';
				var sobJobNameUpdate = 'NOT Available';
				var scheduledetailsUpdate = 'NOT Available';
		    }		  
		  // var upTaskData = $('#taskUpdateTable').tableToJSON({ignoreColumns:[3,6,7],ignoreHiddenRows:false});		 
		  // var taskupdateData = JSON.stringify(table); 
		   
		   var upTaskData = [];
		   $("#taskUpdateTable tr").each(function(i){
		     if(i==0) return;
		     var TaskExecutionOrder = $.trim($(this).find("td").eq(0).html());
		     var TaskName = $.trim($(this).find("td").eq(1).html());
		     var TaskShortDesc = $.trim($(this).find("td").eq(2).html());
		     var TaskOwner = $.trim($(this).find("td").eq(4).html());
		     var TaskExecutionType = $.trim($(this).find("td").eq(5).html());
		     var FileData = [];
		     upTaskData.push({TaskMasterID: "56606b0e446a903d007ef199",TaskExecutionFlowID:"56606b0e446a903d007ef198", TaskExecutionOrder: TaskExecutionOrder, TaskName: TaskName, TaskShortDesc: TaskShortDesc, TaskOwner:TaskOwner, TaskExecutionType:TaskExecutionType, FileData:FileData});
		   });
		  
		   if(selectProviderValueUp == 'IPSoft'){
			   	var automationids = $('#automationidsUp').val();
				var automationuserId = $('#automationuserIdUp').val();
				var automationuserpass = $('#automationuserpassUp').val();
				var automationPathUp = $('#automationPathUp').val();				
				var automationParam1 = $('#paramNameUP0').val();
				var automationParam2 = $('#paramNameUP1').val();
				var automationParam3 = $('#paramNameUP2').val();
				var automationParam4 = $('#paramNameUP3').val();
				var automationParam5 = $('#paramNameUP4').val();
				var automationParam6 = $('#paramNameUP5').val();
				var automationParamVal1 = $('#paramValUP0').val();
				var automationParamVal2 = $('#paramValUP1').val();
				var automationParamVal3 = $('#paramValUP2').val();
				var automationParamVal4 = $('#paramValUP3').val();
				var automationParamVal5 = $('#paramValUP4').val();
				var automationParamVal6 = $('#paramValUP5').val();
				automataJSONobj = ipsoftAutomationInput;
				automataJSONobjRes = ipsoftAutomationResInput;
			}
		   automataJSONobj = ipsoftAutomationInput;
		   automataJSONobjRes = ipsoftAutomationResInput;
		   console.log("automataJSONobj" + automataJSONobj);
		   console.log(" Updating Saved Data form");
			var dataObject = {
							"Alerts":[
										{
											"_id" : currentAlertId,
											"alertName" : upAlertname,
											"alertShortDesc" : upAlertdescription,
											"alertType" : upAlerttype,
											"alertSeverity" : upAlertseverity,										
											"alertStatus": "acc001app001alertStatus001",
											"alertFrequency": "acc001app001alertFrequency001",
											"alertMetrics": "acc001app001alertMetrics001",
											"applicationID": currLeftApplId,
											"accountID" : firstAccountId,
											"applicationName" : upSelectAppl,
											"trashed": "n",
											"alertRaisedTimeStamp" : alertRaiseTimeVal,
											"updateTimestamp" :  timeInMs,
											"updateComment " : upComments,
											"updatedByUserId" : localStorage.getItem("userID"),
											"SOPs" : [ 
												{
													"SOPID" : SOPID,
													"SOPType": sopType,
													"SOPName" : upSopname,														
													"SOPShortDesc" : upSopdescription,
													"SOPPurpose": upSoppurpose,
													"activeMode": currActiveStatus,
													"alertId" : currentAlertId,
													"AutomationInput" : automataJSONobj,
													"AutomationOutput" : automataJSONobjRes,
													"AutomationProvider" : selectProviderValueUp,
													"AutomationProcess":upAutomationProviderValue,
													"operationShortDesc":upAutomationProviderDesc,													
													"Classification": upSopclassification, 
													"ExpectedInput": upSopexpectedinput,
													"ExpectedOutput": upSopexpectedoutput,
													"ExecuteAutomation" : ExecuteAutoVal,
													"createdByUserId":createdByUserIdSOP,
													"createTimestamp":createTimestampSOP,
													"SOPCognitiveInfos" : [ 
														{
															"SOPCognitiveID" : "56606b0e446a903d007ef197",
															"SOPId" : SOPID
														}
													],
													"TaskExecutionFlows" : [ 
														{
															"TaskExecutionFlowID" : "565fd9360d38603d002e9199",
															"SOPId" : SOPID,
															"taskExecutionFlowName" : "app001alert001sop001FlowName001",
															"TaskMasters" : upTaskData,
															"RuleMasters" : [ 
																{
																	"RuleMasterID" : "566049cb446a903d007ef0ad",
																	"TaskExecutionFlowID" : "565fd9360d38603d002e9199"
																}
															]
														}
													],
													
												}
											],
											"SopJobEvents" : {	
														 "_id" : sop_id,
												         "jobName" : sobJobNameUpdate,
												         "jobDetails" : scheduledetailsUpdate,
												         "alertId" : sopalertId,															
												         "cronExpression" : triggerOnVal,
												         "active": upActiveCron,
												         "timeZone" : cronExpSel											        
											},
											"choreographEvent" : choreographEvent
										}
									],
								   "updateTimestamp": {
								        "$date": timeInMs
								    }
					
			};
			
			var dataObjectTicket =	{
				    "Tickets":{
				    	"_id":ticketId,
						"requester": $('#requesterTicketUp').val(),
						"assignee": $('#assigneeTicketUp').val(),
						"asignmentGroup": $('#assigneeGroupUp').val(),
						"type": $('#ticketTypeDrpUp').val(),
						"priority": $('#ticketPriorityDrpUp').val(),
						"subject": $('#ticketDescTxtAreaUp').val(),
						"status": $('#ticketStatusDrpUp').val(),
						"openedAt": $('#ticketRaisedOnUp').val(),
						"account": firstAccountId,
						"application":currLeftApplId,
						"applicationName": upSelectAppl,
						"impact": $('#ticketSeverityDrpUp').val(),
						"cause": $('#ticketCauseUp').val(),
						"category": $('#ticketCategoryUp').val(),
						"ticketKey": $('#createTicketNameUp').val()
					},
					"SOPs":{	
							"_id" : SOPID,
				            "SOPName": upSopname,
				            "SOPType": sopType,
				            "SOPShortDesc": upSopdescription,
				            "SOPPurpose": upSoppurpose,
				            "activeMode": currActiveStatus,
				            "AutomationInput": automataJSONobj,
				            "AutomationOutput" : automataJSONobjRes,
							"account": firstAccountId,
						    "application": currLeftApplId,
				            "AutomationProcess": upAutomationProviderValue,
				            "operationShortDesc": upAutomationProviderDesc,
				            "AutomationProvider": selectProviderValueUp,
				            "Classification": upSopclassification,
				            "ExpectedInput": upSopexpectedinput,
				            "ExpectedOutput": upSopexpectedinput,
				            "ExecuteAutomation": ExecuteAutoVal,
				            "createdByUserId": createdByUserIdSOP,
				            "TaskMasters": upTaskData,
				            "SOPCognitiveInfos": [],
				            "updateTimestamp":timeInMs, 
							"updatedByUserId":localStorage.getItem("userID"),
							"updateComment":upComments,
				            "alert" : [],
							"ticket" :[$('#createTicketNameUp').val()]
				        },
				        "choreographEvent" : choreographEvent,
						"wholesopFlag":wholesopFlag,
						"sameautomationFlag":sameautomationFlag		    
				};	
			
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			var responsePromise;
			if(globalSOP == 'AlertSOP'){
				responsePromise = $http.put(updateSOP + "?accountId="+firstAccountId+"&applicationId="+currLeftApplId+"&alertId="+currentAlertId, dataObject, {});	
			}else{
				responsePromise = $http.put(AmendSOP + "?Id="+ticketId, dataObjectTicket, {});
			}
		   
		   
		   responsePromise.success(function(dataFromServer, status, headers, config) {
			   //$('#messg').html('SOP <strong>"'+upSopname + '"</strong> has been updated!')
		      
			/*   $('#alterMessageBoxCreateUser').show();
		       if(dataFromServer.userMessage){
		    	   $('.updateMsg').html(dataFromServer.userMessage);    	 
		       }else {
		    	   $('.updateMsg').html($scope.message);    
		       }		*/	   
			   //$('#messg').html('SOP <strong>"'+upSopname + '"</strong> has been updated!');
			   updateChoreoId = '';
			   ipsoftAutomationInput = [];
			   ipsoftAutomationResInput = [];
			   $('#alterMessageBoxCreateUser').show();
		       if(dataFromServer.userMessage){
		    	   $('.updateMsg').html(dataFromServer.userMessage);    	 
		       }else {
		    	   $('.updateMsg').html('SOP <strong>"'+upSopname + '"</strong> has been updated!');    
		       }
		   });
		    responsePromise.error(function(dataFromServer, status, headers, config) {
		    /*	
		    	$('#messageBoxError').show();
			       if(dataFromServer.userMessage){
			    	   $('.errorAdminMsg').html(dataFromServer.userMessage);    	 
			       }else {	    	
		    	$('.errorAdminMsg').html(dataFromServer.internalMessage);  
			       }		    	
		    	console.log("Submitting form failed!");
		    	 //$('#messg').html('SOP <strong>"'+upSopname + '"</strong> not updated!')
		    	 */
		       $('#messageBoxError').show();
		       if(dataFromServer.userMessage){
		    	   $('.errorAdminMsg').html(dataFromServer.userMessage);    	 
		       }else {	    	
		    	   $('.errorAdminMsg').html('SOP <strong>"'+upSopname + '"</strong> has not updated!');  //$('.errorAdminMsg').html(dataFromServer.userMessage);
		       }
		    	//$('#messg').html('SOP <strong>"'+upSopname + '"</strong> has not updated!');
		   });
		   
		   $location.path('/createSOP');
		   $('#searchInput').attr('placeholder','Enter Alert Name');
		   $('#accountSelOps').removeAttr("disabled") ;
		   $('#deletedata').addClass('disableamend');
		   $('#addTaskOnAmendTable').addClass('disableamend');	
		 }; 
});	

app.controller('TabbedFormCtrl', function($location, $scope, $http) {
   $scope.createsop = {};
   $scope.message = '';

   $scope.taskdescPlaceholderText = 'Short description';
   $scope.createsop.taskdesc = $scope.taskdescPlaceholderText;

   $scope.createsop.clearTaskdesc = function () {
	   if($('.form-control').html() == 'Short description'){
		   $('.form-control').html('');
	   }
	   //$scope.createsop.taskdesc = "";
   };

	$scope.alertSearchData = function() {
		var datatableRowData = '';
		var oTable = $('#alertResultTable').dataTable();
		oTable.fnDestroy();
		$("#showAutoBackContainer").show();
		$("#waitContainer").show();
		var currAccName = $("#accountSelOps option:selected").text();
		var applNameCreate = $("#applNameCreate option:selected").text();  
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		var responsePromiseAuditLog;
		if(globalSOP == 'AlertSOP'){
			responsePromiseAuditLog = $http.get(getAlertListFromAlertAuditLog + '?accountName='+currAccName+'&applicationName='+applNameCreate);	
		}else{
			responsePromiseAuditLog = $http.get(getTicketListFromAuditLog + '?accountName='+currAccName+'&applicationName='+applNameCreate);
		}
		
		if(globalSOP == 'AlertSOP'){
			responsePromiseAuditLog.success(function(data) { 
				var fetchData = data.response; 
				for(var i = 0; i< fetchData.length; i++){
					  if(typeof (fetchData[i].alertShortDesc) == 'undefined'){fetchData[i].alertShortDesc = 'Not Available'}				
					  datatableRowData = datatableRowData + '<tr><td align="center"><a href="javascript:void(0);" onclick="getSOPUnprocessAlertData(\''+fetchData[i].alertName+'\');">'+fetchData[i].alertName+'</a></td><td align="center">'+fetchData[i].alertShortDesc+'</td></tr>';
				}
	
				$('#alertResultContainer').show();
				$('#listAuditLog').html('Alert List');
				$('#alertResultData').html(datatableRowData);
				$('#alertResultTable').dataTable( {
					"scrollY":        300,
					"scrollCollapse": true,
					"jQueryUI":       true,
					"order": [[ 1, "desc" ]],
					 "aLengthMenu": [[5, 10, 20, 100, -1], [5, 10, 20, 100, "All"]],
				     "iDisplayLength": 5,
				});
				$('#waitContainer').hide();
				
			});
			responsePromiseAuditLog.error(function(dataFromServer) {
				alert("No alert list found");
				$('#waitContainer').hide();
				$("#showAutoBackContainer").hide();
			 });
		}else if(globalSOP == 'AlertTicket'){
			responsePromiseAuditLog.success(function(data) { 
				var fetchData = data.response; 
				for(var i = 0; i< fetchData.length; i++){
					  if(typeof (fetchData[i].subject) == 'undefined'){fetchData[i].subject = 'Not Available'}				
					  datatableRowData = datatableRowData + '<tr><td align="center"><a href="javascript:void(0);" onclick="getSOPUnprocessTicketData(\''+fetchData[i].ticketKey+'\');">'+fetchData[i].ticketKey+'</a></td><td align="center">'+fetchData[i].subject+'</td></tr>';
				}
	
				$('#alertResultContainer').show();
				$('#listAuditLog').html('Ticket List');
				$('#alertResultData').html(datatableRowData);
				$('#alertResultTable').dataTable( {
					"scrollY":        300,
					"scrollCollapse": true,
					"jQueryUI":       true,
					"order": [[ 1, "desc" ]],
					 "aLengthMenu": [[5, 10, 20, 100, -1], [5, 10, 20, 100, "All"]],
				     "iDisplayLength": 5,
				});
				$('#waitContainer').hide();
				
			});	
			responsePromiseAuditLog.error(function(dataFromServer) {
				alert(dataFromServer.userMessage);
				$('#waitContainer').hide();
				$("#showAutoBackContainer").hide();
			});
	   }	

	};
   
   $scope.createsop.searchAlert = function(item, event) {	   
	   	var currAlertVal = $('#createAlertName').val();
   		var applNameCreate = $("#applNameCreate option:selected").html();   		
   		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
   		$http.get(getAlertNameList + '?accountId='+firstAccountId+'&applicationName=' +applNameCreate).success(function(data) {      			
	     	var savedAlertName = data;
	     	setTimeout(function(){
		   		var checkCurrentAlert = savedAlertName.indexOf(currAlertVal);
				if(checkCurrentAlert >= 0){
					dialogDepAlert.dialog("open");
					$('#createAlertName').val('');
					$('#createAlertName').focus();
					return false;
				}
	     	}, 200);
	    });
   		//console.log(applNameCreate +"  currAlertVal:  "+currAlertVal+" savedAlertName: "+savedAlertName);
   		
   		var unProcessAlertArray = new Array();
		var currAccName = $("#accountSelOps option:selected").text();
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		$http.get(getAlertListFromAlertAuditLog + '?accountName='+currAccName+'&applicationName='+applNameCreate).success(function(data) { 
			var fetchData = data.response; 
			for(var i = 0; i< fetchData.length; i++){			
				unProcessAlertArray.push(fetchData[i].alertName);
			}	
			setTimeout(function(){
		   		var checkProcessAlert = unProcessAlertArray.indexOf(currAlertVal);
				if(checkProcessAlert >= 0){
					dialogDepAlert.dialog("open");
					$('#dupAlertMsg').html('This alert aleary exists in Alert Audit Log.')
					$('#createAlertName').val('');
					$('#createAlertName').focus();
					return false;
				}
	     	}, 200);
		});
		
		
	   
   }
   
   $scope.createsop.totaltask = 0;
   $scope.execTyps = [
      {name:'Manual'},
      {name:'Event Based'},
      {name:'Automation'},
      {name:'SentNotification'},
      {name:'SOP Meta based execution'},
      {name:'Logger Alert'},
      {name:'Mail notification'}
  
	];
  
	firstAccountId = $("#accountSelOps").val();
	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	$http.get(GetUserAccess + '?userID='+localStorage.getItem("userID")).success(function(data) { 
	//$http.get(GetUserAccess + '?userID=sauser').success(function(data) { 
		var dataArray = data.response;
		var accountArray = dataArray.account;
		$('#applNameCreate').html('');			
     	for (var i = 0; i < accountArray.length; i++){ 
     		if(accountArray[i].accountId == firstAccountId){
     			var applicationList = new Array();
     			applicationList = accountArray[i].applicationList;
     			//$('#applNameCreate').html('');
     			for (var j = 0; j < applicationList.length; j++){ 
     				$('#applNameCreate').append("<option value='"+applicationList[j].applicationId+"'>"+applicationList[j].applicationName+"</option>");
     				firstApplicationId = applicationList[0].applicationName;
     			}
     			
     		}
     	}
     	var currAccName=$("#accountSelOps option:selected").html();
	    var datatableRowData = '';
	    var responsePromiseAuditLog = $http.get(getTicketListFromAuditLog + '?accountName='+currAccName+'&applicationName='+firstApplicationId); 
		responsePromiseAuditLog.success(function(data) { 
			var fetchData = data.response; 			
			for(var i = 0; i< fetchData.length; i++){				
				  datatableRowData = datatableRowData + '<option value="'+fetchData[i].ticketKey+'" onclick="getSOPUnprocessTicketDataFromMultiselect(\''+fetchData[i].ticketKey+'\')">'+fetchData[i].ticketKey+'</option>';
			}
			$('#createTicketName').html(datatableRowData);
		});
		responsePromiseAuditLog.error(function(dataFromServer) {
			console.log("No Ticket list found");
		});    	
	});
   
   
   
  /*  $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	$http.get(GetApplicationListForAccount+'?accountId='+firstAccountId).success(function(data) {    
		var dataArr = data.response;
		console.log(dataArr);
     	for (var i = 0; i < dataArr.length; i++){      		
     		$scope.applications = dataArr;
     	}    	
    });*/
   $scope.rows = [];
   $scope.rowsDesc = [];
   $scope.TaskMasters =  [];
   var taskExeArrayCre =  [];
   $scope.appTaskTable = true;
   $scope.createsop.addTask = function(item, event) {
	 var taskname = $scope.createsop.taskname;
	 //var taskdescription = $scope.createsop.taskdesc;
	 var taskdescription = $('#taskDescRTE').val();
	 var taskowner = $scope.createsop.taskowner;
	 //var taskExecutionType = $scope.createsop.taskexecutiontype;
	 var taskExecutionType = $('select#createTaskExe option:selected').attr('label');
	 var taskjobContext = $('#taskContextData').val();
	 var taskscript = $('#teskScriptData').val();
	 var currExecutionOrder = $('#autoExeOrder').val();
	 var checkExeOrder = taskExeArrayCre.indexOf(currExecutionOrder);

	/* if(checkExeOrder >= 0){
		 dialogExe.dialog("open");
		 //alert('You CANNOT save two different tasks with same execution order');
		 return false;
	 }else{
		 var taskExecutionOrder = $('#autoExeOrder').val();
		 taskExeArrayCre.push(taskExecutionOrder);
	 }
	 */
	 var taskExecutionOrder = $('#autoExeOrder').val();
	 taskExeArrayCre.push(taskExecutionOrder);
	 var files = [];
	/* var fileUpload = document.getElementById('taskFileUpload').files[0];

 	
     if (fileUpload) {
    	 var reader = new FileReader();
    	    reader.onload = function(event) { 
    	      object = {};
    	      object.filename = fileUpload.name;
    	      object.data = event.target.result;
    	      files.push(object);
    	      //currentUploadFile = files;
    	    }; 
    	    reader.readAsDataURL(fileUpload);
     }
*/
	 var taskDuration = $scope.createsop.taskduration;
	 var taskData = {'name':taskname,'description':taskdescription,'executionorder':taskExecutionOrder};
	 // defect - 200175, Owner - Radha M De
	 if(taskname != null && taskowner != null && taskExecutionType != null && taskExecutionType.length > 0){
		 var SaveTaskdata = {
								"TaskName" : taskname,
								"TaskShortDesc" : taskdescription,
								"TaskOwner" : taskowner,
								"TaskExecutionType" : taskExecutionType,
								"TaskExecutionOrder" : taskExecutionOrder,
								"jobContext" : taskjobContext,
								"script" : taskscript,
								"FileData" : files
							};							
		 $scope.TaskMasters.push(SaveTaskdata);
		 $scope.rows.push(taskData);
		 $scope.appTaskTable = false;
		 $scope.createsop.taskname=null;
		 $scope.createsop.taskdesc=null;
		 $scope.createsop.taskowner=null;
		 $scope.createsop.taskexecutiontype=null;
		 $scope.createsop.taskcontext=null;
		 $scope.createsop.taskscript=null;
		 $scope.createsop.taskexecutionuerId=null;
		 $scope.createsop.taskexecutionpassword=null;
		// $scope.createsop.taskexecutionoder=null;
		 taskExecutionOrder = parseInt(taskExecutionOrder) + 1;
		 $('#autoExeOrder').val(taskExecutionOrder);
		 $scope.createsop.totaltask = $scope.createsop.totaltask + 1;
		// $scope.messageTask = 'Task '+taskname +' has been added!';		
		// $scope.rowsDesc.push(taskdescription);
		 CKupdate();
		 CKEDITOR.instances[instance].setData('');
		 $('#taskContainer').html('');
	 }else{
		 alert('Please fill up all required fields in Task Details.');
	 }
 };
 
 
 $scope.createsop.processForm = function(item, event) {
 	 $scope.createsop.workflowName = document.getElementById("workflowName").value;//Abhishek code
	 $scope.createsop.sopBpmnData = document.getElementById("sopBpmnData").value;//Abhishek code
	 console.log("**********************************************");
	 console.log("**********************************************");
	 console.log($scope.createsop);
	 console.log("**********************************************");
	 console.log("**********************************************");//Abhishek code
 		//201372 - Radha M De
	 	if($("input[name='executeAutomation']:checked").val() == 'scheduled' && $('#createTimeZone').val() == ''){
	 		alert ('Please select Time Zone');
			return false;
		}
		if($("input[name='executeAutomation']:checked").val() == 'scheduled' &&  ($("input[name='timeZone']:checked").val() != 'y' && $("input[name='timeZone']:checked").val() != 'n')){
	 		alert ('Please select Time Zone');
			return false;
		}
		//201372 - Radha M De
 
	 	if($('#applNameCreate').val() == ''){
	 		alert('Please fill up all the required fields - Application Name');
	 		return false;
	 	}
	 	if(globalSOP == 'AlertSOP'){
		 	if($('#createAlertName').val() == ''){
		 		alert('Please fill up all the required fields - Alert Name');
		 		return false;
		 	}
	 	}
	 	if($('#createsopuserid').val() == ''){
	 		alert('Please fill up all the required fields - SOP User Id');
	 		return false;
	 	}
	 	if($("#selectProviderValue option:selected").val()!='IBMWorkloadAutomation' || $("#selectProviderValue option:selected").val()!='Automation Simulator'){
		 	if($('#selectProviderValue').val() == ''){
		 		alert('Please fill up all the required fields - Provider Value');
		 		return false;
		 	}
	 	}
	 	if($('#puropseCreateSOP').val() == ''){
	 		alert('Please fill up all the required fields - Purpose');
	 		return false;
	 	}
		var ExecuteAutomationVal = $("input[name='executeAutomation']:checked").val();
		if (ExecuteAutomationVal == 'scheduled') {
			if($('#jobNameSJ').val()==''){
		 		alert('Please fill up all the required fields - Job Name');
		 		return false;
		 	}
			if($('#triggerOnValText').val()==''){
		 		alert('Please fill up all the required fields - Trigger On');
		 		return false;
		 	}
		}	 	
	 	if(sopType == 'S'){
		 	if($scope.TaskMasters.length <= 0){
		 		alert('Please fill up all the required fields - Task');
		 		return false;
		 	}
	 	}
	 	if(sopType == 'S'){
	 		if($("#selectProviderValue option:selected").val()!='Automation Simulator'){
			 	if (typeof(automataJSONobj) == 'undefined' && automataJSONobj == null){
			 		alert('Please fill up all the required fields - Automata request.');
			 		return false;
			 	}
	 		}
	 	}
	    var d = new Date();
	    var month = d.getMonth()+1;
	    var mVal ="";
	    if(month == 1){mVal='JAN';}else if(month == 2){mVal = 'FEB';}else if(month == 3){mVal = 'MAR';}else if(month == 4){mVal = 'APR';}
	    else if(month == 5){mVal = 'MAY'}else if(month == 6){mVal = 'JUN'}else if(month == 7){mVal = 'JUL'}else if(month == 8){mVal = 'AUG'}
	    else if(month == 9){mVal = 'SEP'}else if(month == 10){mVal = 'OCT'}else if(month == 11){mVal = 'NOV'}else if(month == 12){mVal = 'DEC'}
	    var day = d.getDate();
	    var timeInMs = 	          
	    	((''+day).length<2 ? '0' : '') + day+ '-' + mVal + '-' +d.getFullYear() ;
	     
	    var applIdCreate = $("#applNameCreate option:selected").attr('value');  
	    var ExecuteAutomationVal = $("input[name='executeAutomation']:checked").val();
	    if (ExecuteAutomationVal == 'scheduled') {
	    	var ExecuteAutoVal = 'SJ';
	    	var jobnameCR = $scope.createsop.jobname;
	    	var scheduleDetailsCR = $scope.createsop.scheduleDetails;
	    	//var activeCR = $scope.createsop.active;
	    	var activeCR = $("input[name='timeZone']:checked").val();
		    var cronExpSel = $("#createTimeZone option:selected").attr('value');  
		    var triggerOnVal = $('#triggerOnVal').val();
	    }else{
	    	 var ExecuteAutoVal = 'RT';
	    	 var jobnameCR = 'NOT Available';
		     var scheduleDetailsCR = 'NOT Available';
		     var activeCR = 'NOT Available';
	    	 var cronExpSel = 'NOT Available';
	         var triggerOnVal = 'NOT Available';
	    }
	    //var automataJSONObjData = JSON.parse(automataJSONobj);
	   // var applIdCreate = $('#applNameCreate').val();
	    currentSOPUserId = $("#createsopuserid").val();	
	    var alertNameCurr =  $('#createAlertName').val();
	    var alertDescCurr = $('#alertDescTxtArea').val();
	    var alertTypeCurr = $('#alertTypeDrp').val();
	    var alertServCurr = $('#alertSeverityDrp').val();
	  /*  var multicketArray = []; 
		$('#createTicketName option:selected').each(function(i, selected){ 
			multicketArray[i] = $(selected).text(); 
		});
		//console.log("ticketkyArr -> "+multicketArray);
		var ticketKeys = multicketArray.toString();  */ 
		var dataObjectAlert = {
						"Alerts":[
								{
									"alertName" : alertNameCurr,
									"alertShortDesc" : alertDescCurr,
									"alertType" : alertTypeCurr,
									"alertSeverity" : alertServCurr,
									"alertStatus": "acc001app001alertStatus001",
									"alertFrequency": "acc001app001alertFrequency001",
									"alertMetrics": "acc001app001alertMetrics001",
									"alertRaisedTimeStamp": timeInMs,
									
									"SOPs" : [ 
										{
											"SOPID" : "app001alert001sop001",
											"SOPType": sopType,
											"SOPName" : $scope.createsop.sopuserName,
											"SOPShortDesc" : $scope.createsop.sopDescription,
											"SOPPurpose": $scope.createsop.purpose,
											"activeMode":"n",
											"Classification": $scope.createsop.classification,
											"ExpectedInput": $scope.createsop.expectedInput,
											"ExpectedOutput": $scope.createsop.expectedOutput,
											"AutomationInput" : automataJSONobj,
											"AutomationOutput" : automataJSONobjRes,
											"AutomationProvider" : $('#selectProviderValue option:selected').val(), //$scope.createsop.autoProvider,
											"AutomationProcess": $("#selectProcessValue").val(),
											"operationShortDesc":"",
											"ExecuteAutomation" : ExecuteAutoVal,
											"createdByUserId" : localStorage.getItem("userID"),
											"SOPCognitiveInfos" : [ 
												{
													"SOPCognitiveID" : "app001alert001sop001sopcogn001",
													"goal" : $scope.createsop.sopgoal,
													"noOfHumanTasks" : $scope.createsop.numofhumantask,
												}
											],
											"TaskExecutionFlows" : [ 
												{
													"TaskExecutionFlowID" : "app001alert001sop001FlowName001id00099345",
													"taskExecutionFlowName" : "app001alert001sop001FlowName001",
													"TaskExecutionUserId " : $scope.createsop.taskexecutionuerId,
													"TaskExecutionPwd"	: $scope.createsop.taskexecutionpassword, 
													"TaskMasters" : $scope.TaskMasters,
													"RuleMasters" : [ 
														{
															"RuleMasterID" : "app001alert001sop001Flow001Rule001",
															"RuleName" : "app001alert001sop001Flow001RuleName001",
															"RuleCondition" : "app001alert001sop001Flow001RuleCond001"
														}
													]
												}
											]
											
										}
									],
									"SopJobEvents" :{       
										         "jobName" : jobnameCR,
										         "jobDetails" : scheduleDetailsCR,
										         "cronExpression" : triggerOnVal,
										         "active": activeCR,
										         "timeZone" : cronExpSel
									        },
									"choreographEvent" : choreographEvent
							        
								}
							]
			
	};
	
		
	var dataObjectTicket =	{
		    "Tickets":{
				"requester": $('#requesterTicket').val(),
				"assignee": $('#assigneeTicket').val(),
				"asignmentGroup": $('#assigneeGroup').val(),
				"type": $('#ticketTypeDrp').val(),
				"priority": $('#ticketPriorityDrp').val(),
				"subject": $('#ticketDescTxtArea').val(),
				"status": $('#ticketStatusDrp').val(),
				"openedAt": $('#ticketRaisedOn').val(),
				"account": $("#accountSelOps option:selected").val(),
				"application":$("#applNameCreate option:selected").val(),
				"applicationName": $("#applNameCreate option:selected").text(),
				"impact": $('#ticketSeverityDrp').val(),
				"cause": $('#ticketCause').val(),
				"category": $('#ticketCategory').val(),
				"ticketKey": $('#createTicketName').val()
			},
			"SOPs":{				
		            "SOPName": $scope.createsop.sopuserName,
		            "SOPType": sopType,
		            "SOPShortDesc": $scope.createsop.sopDescription,
		            "SOPPurpose": $scope.createsop.purpose,
		            "activeMode":"n",
		            "AutomationInput": automataJSONobj,
		            "AutomationOutput" : automataJSONobjRes,
					"account": $("#accountSelOps option:selected").val(),
				    "application":$("#applNameCreate option:selected").val(),
		            "AutomationProcess": $("#selectProcessValue").val(),
		            "operationShortDesc": "",
		            "AutomationProvider": $('#selectProviderValue option:selected').val(),
		            "Classification": $scope.createsop.classification,
		            "ExpectedInput": $scope.createsop.expectedInput,
		            "ExpectedOutput": $scope.createsop.expectedOutput,
		            "ExecuteAutomation": ExecuteAutoVal,
		            "createdByUserId": localStorage.getItem("userID"),
		            "TaskMasters": $scope.TaskMasters,
		            "SOPCognitiveInfos": [],
		            "alert" : [],
					"ticket" :[],
					"bpmn":{
						"workflowName":$scope.createsop.workflowName,
						"sopBpmnData":$scope.createsop.sopBpmnData
					}
		        },
		        "choreographEvent" : choreographEvent,
				"wholesopFlag":wholesopFlag,
				"sameautomationFlag":sameautomationFlag	    
		};		
		
		   $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		   var responsePromise;
		   if(globalSOP == 'AlertSOP'){
			   $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			   responsePromise = $http.post(sop_create+"?accountId="+firstAccountId+"&applicationId="+applIdCreate, dataObjectAlert, {});
		   }else if(globalSOP == 'AlertTicket'){
			   $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			   responsePromise = $http.post(createTicket, dataObjectTicket, {});
		   }		   
		   responsePromise.success(function(dataFromServer, status, headers, config) {		   
				   $('#alterMessageBoxCreateUser').show();
			       if(dataFromServer.userMessage){
			    	   $('.updateMsg').html(dataFromServer.userMessage);    	 
			       }else {
			    	   $('.updateMsg').html($scope.message);    
			       }
				    $scope.TaskMasters = [];
				    $scope.messageTask = '';
				    taskExeArrayCre.length = 0;
				    $scope.appTaskTable = true;
				    $scope.createsop = angular.copy($scope.originForm); 
				    $scope.rows = [];
				    ipsoftAutomationInput = [];
				    ipsoftAutomationResInput = [];
				    sopDataArray = [];
				    currentMapRowId = '';
				    ioMapArray = [];
				    choreoPathArray = [];
				    choreographEvent = '';
				    sourcesopIDArray = [];
				    sourcesopValueArray = [];
				    automataJSONobjRes = [];
				    $("#ipsoftAutomationNameu").val('').removeAttr("disabled");
					$("#ipsoftAutomationPathu").val('').removeAttr("disabled");								
					$("#ipsoftautomationDescriptionu").val('').removeAttr("disabled");
					$("#ipsoftOSTypeu").val('').removeAttr("disabled");
					$('#ipsoftSeverityu').val('').removeAttr("disabled");
					$('#ipsoftAssGroupu').val('').removeAttr("disabled");
					$('#ipsoftTargetHostu').val('').removeAttr("disabled");
					$('#ipsoftTimeOutu').val('').removeAttr("disabled");
					$("#paramList").html('');
			    	$('#createAutoRes').removeClass('disableClass');
					$('#editAutoRes').addClass('disableClass');
					$('#viewAutoRes').addClass('disableClass');
				    $('#triggerOnValText').val('');
				    $('#automationids').val('');
				    $('#createTicketName').val('');
				    $('#requesterTicket').val('');
				    $('#assigneeTicket').val('');
				    $('#assigneeGroup').val('');
				    $('#ticketTypeDrp').val('');
				    $('#ipsoftautomationuserId').val('');
				    $('#automationuserpass').val('');
				    $('#autoExeOrder').val('1');
				    $('#tabOutputParam').hide();
				    $('#workLoadLib').val('');
				    $('#workLoadProcess').val('');
				    $('#createAutoReq').removeClass('disableClass');
				    $('#editAutoReq').addClass('disableClass');
				    $('#viewAutoReq').addClass('disableClass');
				    $('#selectProviderValue').removeAttr('disabled');
				    $('#selectProcessValue').removeAttr('disabled'); 
				    $('#createAlertName').val('').removeAttr('disabled');
				    $('#alertDescTxtArea').val('').removeAttr('disabled');
				    $('#selectStartSOP').removeAttr('disabled');
				    $('#addedSopPath').html('');
				    $('#tableToMap').hide();
				    $('#addedSopIOTo').html('');
				    $('#wholesopFlagErrorDialog').hide();
				    $('#showAutoBackContainer').hide();
					$("#secmultiple option:selected").prop("selected", false);
					$("#minmultiple option:selected").prop("selected", false);
					$("#hrsmultiple option:selected").prop("selected", false);
					$("#daymultiple option:selected").prop("selected", false);
					$("#monthmultiple option:selected").prop("selected", false);
					$("#weekmultiple option:selected").prop("selected", false);
					$("#outNmTpRow").html('');
					$("#choreoGraphChart").html('');
					$('#selectStartSOP').removeAttr("disabled");
				    wholesopFlag = 'true';
		    		sameautomationFlag = 'true';
				    $scope.createSOPForm.$setPristine();
					/*alert('hi');
					$scope.createsop.tabs[0].active = true;	*/
		   });
		    responsePromise.error(function(dataFromServer, status, headers, config) {		    	
		    	if(dataFromServer.internalMessage == 'wholesopFlagError'){
		    		$('#wholesopFlagErrorMsg').html(dataFromServer.userMessage);
		    		$('#showAutoBackContainer').show();
		    		$('#wholesopFlagErrorDialog').show();
		    		wholesopFlag = 'false';
		    	}else if(dataFromServer.internalMessage == 'sameautomationFlagError'){
		    		$('#wholesopFlagErrorMsg').html(dataFromServer.userMessage);
		    		$('#showAutoBackContainer').show();
		    		$('#wholesopFlagErrorDialog').show();
		    		wholesopFlag = 'false';
		    		sameautomationFlag = 'false';
		    	}else if(dataFromServer.internalMessage == 'trashedData'){		    	
		    		 var r = confirm("This SOP existed and has been deleted, do you want to recover it ?");
					    if (r == true) {
					    	var repsData = dataFromServer.response;
				    		$location.path('/amendSOP');
							$("#richTextEditorContainer").show();
							$("#WaitAlertMsg").show();
				    		setTimeout(function(){
					    	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";	
					    	if(globalSOP == 'AlertSOP'){
								sopGetService = getSOPList + '?accountId='+repsData.accountID+'&applicationId='+repsData.applicationID+'&alertId='+repsData.id;
								currentAlertId = repsData.id;
							}else{
								sopGetService = getSOPforTicketKey + '?EventKey=' +repsData.id;
								currentTicketId = repsData.id;
							}
							$http.get(sopGetService).success(function(dataObj) {
								var data = dataObj.response;
								if(globalSOP == 'AlertSOP'){
									$('#pdfTicketRow').html('');
									$('#scheduledCheckUp').show();
									$('#ticketDetailsUp').hide();
									$('#alertDetailsUp').show();
									$('#tabAlertText').html(uiconfig.SOPEditortab1);
									$('#uitab1headingUp').html('Enter Alert Details');
									var c = data.SOPs; 
									for (var k = 0; k < c.length; c++){
										SOPID = c[0].SOPID;
										autoId = c[0].WorkflowAutomationID;
										SOPPurpose = c[0].SOPPurpose;
										SOPClassification = c[0].Classification;
										SOPExpectedInput = c[0].ExpectedInput;
										SOPExpectedOutput = c[0].ExpectedOutput;
										SOPDesc = c[0].SOPShortDesc;
										SOPName = c[0].SOPName;
										sopType = c[0].SOPType;
										activeMode = c[0].activeMode;
										userID = c[0].WorkflowAutomationUserId;
										passD = c[0].WorkflowAutomationPassword;
										autoProvd = c[0].AutomationProvider;
										automationProcessUp = c[0].AutomationProcess;
										operationShortDesc = c[0].operationShortDesc;
										ExecuteAutomation = c[0].ExecuteAutomation;
										createdByUserIdSOP = c[0].createdByUserId;
										createTimestampSOP = c[0].createTimestamp;
										currActiveStatus = activeMode;
										//console.log("Automation Input: "+c[0].AutomationInput);
										if (typeof(c[0].AutomationInput) != 'undefined' || c[0].AutomationInput != null){
											AutomationInput = c[0].AutomationInput;
											ipsoftAutomationInput = AutomationInput;
											var htmlAutoParam = '';
											if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
												var i = 0;
												for(var j = 0 ; j <AutomationInput.length; j++){
													htmlAutoParam += '<tr id="paramrowId'+(j+1)+'"><td style="visibility:hidden;">'+(j+1)+'</td><td>';
													rowValUP = j + 2;
													//console.log(rowValUP);
													$.each(AutomationInput[j], function(key, value){	
														if(autoProvd == 'IPSoft'){
															if(key != 'timeOut' && key != 'targetHost' && key != 'assignedGroup' && key != 'automationDesc' && key !='automationName' && key !='automationPath' && key != 'osType' && key !='severity'){
																htmlAutoParam += '<span style="float:left; width:200px;">' + key + '</span>';
																htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
															}
														}else if(autoProvd == 'blueprism'){
															if(key != 'processName'){
																htmlAutoParam += '<span style="float:left; width:200px;">' + key + '</span>';
																htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
															}
														}
													});
													htmlAutoParam += '</td><td><a class="deleteParam disableamend" title="Delete Parameter" onclick="removeParamUpdate('+(j+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a><a class="editParam disableamend" title="Edit Parameter" onclick="editParamUpdate('+(j+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-edit"></span></a></td></tr>';
												}

												/*AutomationParam = AutomationInput[0].automationParam;
												var htmlAutoParam = '';
												if (typeof(AutomationParam) != 'undefined' || AutomationParam != null){
													var i = 0;
													$.each(AutomationParam, function(key, value){							
														if(key != ''){
															htmlAutoParam += '<div class="col-sm-4" style="float:left; font-weight:bold;"><input type="text" id="paramNameUP'+i+'" class="paramNMS" disabled value="' + key + '" /></div>';
															htmlAutoParam += '<div class="col-sm-8"><input type="text" id="paramValUP'+i+'" class="paramVALS" disabled value="' + value + '" /></div><br /><br />';
														}
														sopAutomationParam = i + 1;
														i = i + 1;
													});
												}*/
											}else{
												htmlAutoParam = '';
											}
										}
										if(autoProvd == 'IPSoft'){
											$('#paramListUp').html(htmlAutoParam);
											$('#appParamTableUp').show();
										}else if(autoProvd == 'blueprism'){
											$('#paramListUpB').html(htmlAutoParam);
											$('#appParamTableUpB').show();
										}
										var taskExec = c[0].TaskExecutionFlows;
										TaskExecutionFlowID = taskExec.TaskExecutionFlowID;
										//var SopJobEvents = c[0].SopJobEvents;
										if (ExecuteAutomation != 'RT'){
											var sopJobName = data.SopJobEvents.jobName;
											var sopJobDetails = data.SopJobEvents.jobDetails;
											var sopCronExpr = data.SopJobEvents.cronExpression;
											//var sopCronExpr = cronParser(data.SopJobEvents.cronExpression);
											var sopTimeZone = data.SopJobEvents.timeZone;
											var sopactive = data.SopJobEvents.active;
											sopalertId = data.SopJobEvents.alertId;
											sop_id = data.SopJobEvents._id;
										}else{
											var sopCronExpr = null; 
										}
										var amtaskOwner = new Array();
										var amtaskName = new Array();
										var amtaskDesc = new Array();
										var amtaskExecution = new Array();
										var amtaskExeOrder = new Array();
										var amtaskDuration = new Array();
										var amtaskFileNm = new Array();
										for(var j = 0; j<taskExec.length; j++){					
											taskMaster = taskExec[0].TaskMasters;
											for(var k = 0; k<taskMaster.length; k++){
												amtaskOwner[k] = taskMaster[k].TaskOwner;
												amtaskName[k] = taskMaster[k].TaskName;
												amtaskDesc[k] = taskMaster[k].TaskShortDesc;
												amtaskExecution[k] = taskMaster[k].TaskExecutionType;
												amtaskExeOrder[k] = taskMaster[k].TaskExecutionOrder;
												amtaskFileNm[k] = taskMaster[k].TaskFileName;
												//amtaskDuration[k] = taskMaster[k].TaskDuration;
											}
										}
									}
								
									//var taskRTE = '<div name="taskdesc" style="display:none;" ng-model="createsop.taskdesc" text-angular="" class="ng-pristine ng-valid ng-isolate-scope ta-root ng-touched txtAngDiv"><div class="ta-toolbar btn-toolbar"><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H1</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H2</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H3</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">P</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">pre</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-quote-right"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-bold"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-italic"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-underline"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-list-ul"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-list-ol"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-repeat"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-undo"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-ban"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-left"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-center"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-right"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">Toggle HTML</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-picture-o"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-link"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-unlink"></i></button></div></div><div contenteditable="true" ng-model="text" ta-bind="text" ng-hide="showHtml" class="ng-pristine ng-untouched ng-valid ng-scope ng-isolate-scope ta-text ta-editor form-control"></div><textarea ng-model="html" ta-bind="html" ng-show="showHtml" class="ng-pristine ng-untouched ng-valid ng-scope ng-isolate-scope ta-html ta-editor form-control ng-hide"></textarea><input type="hidden" style="display: none;" name="taskdesc" value=""><br />Task Update Coments : <input type="text" ng-model="createsop.taskcomments" id="createsoptaskcomments" placeholder="Enter task update comment" required /></div>';
									
									
									for(var l=0; l<amtaskName.length; l++){
										if (typeof(amtaskExecution[l]) == 'undefined' || amtaskExecution[l] == null){
											amtaskExecution[l] = '';
										}
										var fileURL = '';
										if (typeof(amtaskFileNm[l]) == 'undefined' || amtaskFileNm[l] == null){
											fileURL = 'NO FILE AVAILABLE'
										}else{
											fileURL = '<a href="https://swarnasetu.mybluemix.net/rest/v1/sopmeta/download?fileName='+amtaskFileNm[l]+'" alt="Download File">Download</a>';
										}
										
										$('#taskAmendRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td>'+amtaskName[l]+'</td><td id="taskDesc'+l+'">'+amtaskDesc[l]+'</td><td><input type="button" class="form-control editDesc disableamend"  value="Edit Description" disabled="disabled"/><td>'+amtaskOwner[l]+'</td><td>'+amtaskExecution[l]+'</td><td style="text-align:center;" align="center"><a href="javascript:void(0)" ng-click="editTask();" class="editTask disableamend" title="Edit Task"><span class="glyphicon glyphicon-edit" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="saveTask" ng-click="saveTask();" style="display:none;" title="Save Task"><span class="glyphicon glyphicon-floppy-disk" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="deleteTask disableamend" title="Delete Task"><span class="glyphicon glyphicon-remove-sign" style="font-size:20px;"></span></a></td></tr>');
										$('#taskPdfRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td style="word-wrap:break-word;">'+amtaskName[l]+'</td><td>'+amtaskDesc[l]+'</td></tr>');
										taskExeArray.push(amtaskExeOrder[l]);
									}
									alertId = data._id;				
									$('#accountSelOps').attr("disabled","disabled") ;
									$('#alertname').val(data.alertName).attr("disabled","disabled") ;
									$('#alertdescription').val(data.alertShortDesc).attr("disabled","disabled") ;
									$('#automationid').val(autoId).attr("disabled","disabled") ;
									$('#alerttype').val(data.alertType).attr("disabled","disabled");
									$('#alertseverity').val(data.alertSeverity).attr("disabled","disabled");
									$('#sopdescription').val(SOPDesc).attr("disabled","disabled");
									$('#soppurpose').val(SOPPurpose).attr("disabled","disabled");
									$('#sopclassification').val(SOPClassification).attr("disabled","disabled");	
									$('#sopexpectedinput').val(SOPExpectedInput).attr("disabled","disabled");	
									$('#sopexpectedoutput').val(SOPExpectedOutput).attr("disabled","disabled");		
									$('#sopname').val(SOPName).attr("disabled","disabled");
									$("#selectProviderValueUp").html("<option>"+autoProvd+"</option>").attr("disabled","disabled");	
									//$("#selectProviderValueUp").attr("disabled","disabled");
									//if (typeof(automationProcessUp) != 'undefined' || automationProcessUp != null){
										if(autoProvd == 'blueprism'){
											$("#selectProcessValueUp").val(automationProcessUp).attr("disabled","disabled");
											$('#autoReqInfo').show();
											$('#autoProvideRow').show();
											$('#autoProcessContainer').show();
										}else{
											$("#autoProcessContainer").hide();
										}
									/*}else{
										$('#autoProcessContainer').hide();
										$('#autoReqInfo').hide();
										$('#autoProvideRow').hide();
									}*/
									$('#automationuserIdup').val(userID).attr("disabled","disabled");	
									$('#automationpassword').val(passD).attr("disabled","disabled");
									
									if(sopCronExpr != null){
										$("#scheduleAutoContainerUp").show();
										$('#sopjobnmu').val(sopJobName).attr("disabled","disabled");
										$('#scheduledetailsu').val(sopJobDetails).attr("disabled","disabled");						
										$('#triggerOnValu').val(sopCronExpr).attr("disabled","disabled");
										 for(var i = 0; i<timezone.length; i++){
							            	 $('#createTimeZoneu').append('<option value="'+timezone[i]+'">'+timezone[i]+'</option>');
							             }
										$("#createTimeZoneu option[value='"+sopTimeZone+"']").attr("selected","selected");	
										$('#createTimeZoneu').attr("disabled","disabled");	
										if(sopactive != 'NOT Available'){
											$("input[name=timeZoneu][value=" + sopactive + "]").attr('checked', 'checked');
										}
										$("input[name=executeAutomationu][value=scheduled]").attr('checked', 'checked');
										$("#cronExpTool").hide();
									}else{
										$("#scheduleAutoContainerUp").hide();
										$("input[name=executeAutomationu][value=realTime]").attr('checked', 'checked');
									}
									$('#selectapplication').attr("disabled","disabled");
									$('#selectapplication').html('<option selected>'+data.applicationName+'</option>').attr("disabled","disabled") ;
									$('#amendData').removeClass('disableamend');
									$('#deletedata').removeClass('disableamend');
									$('#sopNameHeader').html(SOPName);				
									$('#clientNmAutoUp').html(data.clientName);
									$('#clientNmAutoResp').html(data.clientName);
									$('#PDFClientname').html(data.clientName);
									$('#PDFalertName').html(data.alertName);
									$('#PDFapplicationName').html(data.applicationName);					
									$('#accNmAutoUp').html(data.accountName);
									$('#accNmAutoResp').html(data.accountName);
									$('#PDFaccountName').html(data.accountName);
									$('#PDFApplication_Name').html(data.applicationName);
									$('#PDFAlert_Name').html(data.alertName);
									$('#PDFAlertDescription').html(data.alertShortDesc);
									$('#PDFAlertType').html(data.alertType);
									$('#PDFSopName').html(SOPName);
									$('#PDFAlertSev').html(data.alertSeverity);
									/*if (typeof(AutomationInput) != 'undefined' || AutomationInput != null){
										if(autoProvd == 'blueprism'){							
											var html = '';
											if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
												$.each(AutomationInput[0], function(key, value){
													html += '<div style="width:150px; margin:10px 20px; font: bold 13px verdana; float:left;">' + key + '</div>';
													html += '<input class="autoDOMvalue disableClass" style="float:left;" type="text" value="' + value + '" />';
												});
											}
											$("#blueAutoGenUp").html(html);
										}else if(autoProvd == 'IPSoft'){
											if (typeof(AutomationInput[1]) != 'undefined' || AutomationInput[1] != null){
												$("#ipsoftAutomationNameu").val(AutomationInput[1].automationName).attr("disabled","disabled");
												$("#ipsoftAutomationPathu").val(AutomationInput[1].automationPath).attr("disabled","disabled");								
												$("#ipsoftautomationDescriptionu").val(AutomationInput[1].automationDesc).attr("disabled","disabled");
												$("#ipsoftOSTypeu").val(AutomationInput[1].osType).attr("disabled","disabled");
												$('#ipsoftSeverityu').val(AutomationInput[1].severity).attr("disabled","disabled");
												$('#ipsoftAssGroupu').val(AutomationInput[1].assignedGroup).attr("disabled","disabled");
												$('#ipsoftTargetHostu').val(AutomationInput[1].targetHost).attr("disabled","disabled");
												
											}
										}else if(autoProvd == 'IBMWorkloadAutomation'){
											if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
												$("#workLoadProcess").val(AutomationInput[0].ProcessName).attr("disabled","disabled");
												$("#workLoadLib").val(AutomationInput[0].LibraryName).attr("disabled","disabled");
											}
										}
										
									}*/
									//$('#blueAutoGen').html(JSON.parse(data.AutomationInput));
									//console.log("AutoinputData: "+JSON.parse(data.AutomationInput));
									
									var sopCratedOn;
							    	var updatedByUserId = data.updatedByUserId;
							    	var updateTimestamp = convertDate(data.updateTimestamp);
							    	 if (typeof(createdByUserIdSOP) == 'undefined' || createdByUserIdSOP == null){
							    		 createdByUserIdSOP = 'NOT Available';
							    	 }			    	
							    	 if (typeof(updatedByUserId) == 'undefined' || updatedByUserId == null){
							    		 updatedByUserId = 'NOT Available';
							    	 }
							    	 if (typeof(createTimestampSOP) == 'undefined' || createTimestampSOP == null){
							    		 createTimestampSOP = 'NOT Available';
							    	 }else{
							    		 sopCratedOn = convertDate(createTimestampSOP);
							    	 }
							    	 if (typeof(updateTimestamp) == 'undefined' || updateTimestamp == null){
							    		 updateTimestamp = 'NOT Available';
							    	 }
							    
							    	$('#PDFSOPCreatedBy').html('Created By:- '+createdByUserIdSOP); 
							    	$('#PDFSOPCrO').html('Created On:- '+sopCratedOn);
							    	$('#PDFSOPUpdtby').html('Last Updated By:- '+updatedByUserId);
							    	$('#PDFLstUpdOn').html('Last Updated On:-'+ updateTimestamp);
							    	$('#PDFSopDesc').html(SOPDesc);
							    	$('#PDFSopPurpose').html(SOPPurpose);
							    	$('#PDFSopActiveInactive').html(activeMode);
							    	$('#PDFSopClassification').html(SOPClassification);
							    	$('#PDFSopExInput').html(SOPExpectedInput);
							    	$('#PDFSopExOutput').html(SOPExpectedOutput);
							    	$('#PDFSopAutoId').html(autoId);
							    	$('#PDFSopAutoProvider').html(autoProvd);
							    	var PDFAccUserId = localStorage.getItem("userID");
							    	$('#PDFAccUserId').html(PDFAccUserId);
							    	PDFSOPReportName = 'SOP for ' + data.alertName + ' for '+ data.applicationName + ' of '+ data.accountName;
							    	var d = new Date();
							 	    var month = d.getMonth()+1;
							 	    var mVal ="";
							 	    if(month == 1){mVal='JAN';}else if(month == 2){mVal = 'FEB';}else if(month == 3){mVal = 'MAR';}else if(month == 4){mVal = 'APR';}
							 	    else if(month == 5){mVal = 'MAY'}else if(month == 6){mVal = 'JUN'}else if(month == 7){mVal = 'JUL'}else if(month == 8){mVal = 'AUG'}
							 	    else if(month == 9){mVal = 'SEP'}else if(month == 10){mVal = 'OCT'}else if(month == 11){mVal = 'NOV'}else if(month == 12){mVal = 'DEC'}
							 	    var day = d.getDate();
							 	    var timeInMs = 	          
							 	    	((''+day).length<2 ? '0' : '') + day+ '-' + mVal + '-' +d.getFullYear() ;
							 	    $('#todayDate').html(timeInMs);
									$("#richTextEditorContainer").hide();
									$("#WaitAlertMsg").hide();
									alertRaiseTimeVal = data.alertRaisedTimeStamp;
									
									
								}else if(globalSOP == 'AlertTicket'){
									//$('#exportPDF').hide();
									var pdfTicketRow = '';
									pdfTicketRow = '<p style="font-size:120%; text-align:left;"><span>Assignee - </span><span id="PDFassigneeTicketUp"></span><br /></p>';
									pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Assignment Group - </span><span id="PDFassigneeGroupUp"></span><br /></p>';
									pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Priority - </span><span id="PDFticketPriorityDrpUp"></span><br /></p>';
									pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Status - </span><span id="PDFticketStatusDrpUp"></span><br /></p>';
									pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Raised On - </span><span id="PDFticketRaisedOnUp"></span><br /></p>';
									pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Requester - </span><span id="PDFTicketRequestor"></span><br /></p>';
									pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Cause - </span><span id="PDFTicketCause"></span><br /></p>';
									pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Category - </span><span id="PDFTicketCategory"></span><br /></p>';
									$('#pdfTicketRow').html(pdfTicketRow);
									$('#scheduledCheckUp').hide();
									$('#ticketDetailsUp').show();
									$('#alertDetailsUp').hide();
									$('#tabAlertText').html(uiconfig.SOPEditortab4);
									$('#uitab1headingUp').html('Enter Ticket Details');
									var c = data.Tickets;
									$('#selectapplication').html('<option selected>'+c.applicationName+'</option>').attr("disabled","disabled") ;
									$('#createTicketNameUp').val(c.ticketKey);
									$('#requesterTicketUp').val(c.requester);
									$('#assigneeTicketUp').val(c.assignee);
									$('#assigneeGroupUp').val(c.asignmentGroup);
									$('#ticketTypeDrpUp').val(c.type);
									$('#ticketPriorityDrpUp').val(c.priority);
									$('#ticketDescTxtAreaUp').val(c.subject);				
									$('#ticketStatusDrpUp').val(c.status);
									$('#ticketRaisedOnUp').val(c.openedAt);
									$('#ticketCauseUp').val(c.cause);
									$('#ticketCategoryUp').val(c.category);
									$('#accNmAutoUp').html(c.accountName);
									$('#accNmAutoResp').html(c.accountName);
									$('#clientNmAutoUp').html(data.clientName);
									$('#clientNmAutoResp').html(data.clientName);
									$("#sopname").val(data.SOPs.SOPName).attr("disabled","disabled");
									$('#sopdescription').val(data.SOPs.SOPShortDesc).attr("disabled","disabled");
									$('#soppurpose').val(data.SOPs.SOPPurpose).attr("disabled","disabled");
									$('#sopclassification').val(data.SOPs.Classification).attr("disabled","disabled");	
									$('#sopexpectedinput').val(data.SOPs.ExpectedInput).attr("disabled","disabled");	
									$('#sopexpectedoutput').val(data.SOPs.ExpectedOutput).attr("disabled","disabled");
									$('#amendData').removeClass('disableamend');
									$('#deletedata').removeClass('disableamend');
									ticketId = c._id;
									SOPID = data.SOPs._id;
									sopType = data.SOPs.SOPType;									
									autoProvd = data.SOPs.AutomationProvider;
									automationProcessUp = data.SOPs.AutomationProcess;
									operationShortDesc = data.SOPs.operationShortDesc;
									ExecuteAutomation = data.SOPs.ExecuteAutomation;
									createdByUserIdSOP = data.SOPs.createdByUserId;
									createTimestampSOP = data.SOPs.createTimestamp;
									automataJSONobj = data.SOPs.AutomationInput;
									$("#selectProviderValueUp").html("<option>"+autoProvd+"</option>").attr("disabled","disabled");
									if(sopType == 'S'){
										$("input[name=sopTypeu][value=S]").attr('checked', 'checked');
										if (typeof(data.SOPs.AutomationInput) != 'undefined' || data.SOPs.AutomationInput != null){
											AutomationInput = data.SOPs.AutomationInput;
											ipsoftAutomationInput = AutomationInput;
											var htmlAutoParam = '';
											if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){							
													var i = 0;
													for(var j = 0 ; j <AutomationInput.length; j++){
														htmlAutoParam += '<tr id="paramrowId'+(j+1)+'"><td style="visibility:hidden;">'+(j+1)+'</td><td>';
														rowValUP = j + 2;
														//htmlAutoParam += '<tr><td>'+(j+1)+'</td><td>';
														$.each(AutomationInput[j], function(key, value){							
															if(autoProvd == 'IPSoft'){
																if(key != 'timeOut' && key != 'targetHost' && key != 'assignedGroup' && key != 'automationDesc' && key !='automationName' && key !='automationPath' && key != 'osType' && key !='severity'){
																	htmlAutoParam += '<span style="float:left; width:200px;">' + key + '</span>';
																	htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
																}
															}else if(autoProvd == 'blueprism'){
																if(key != 'processName'){
																	htmlAutoParam += '<span style="float:left; width:200px;">' + key + '</span>';
																	htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
																}
															}
														});
														htmlAutoParam += '</td><td><a class="deleteParam disableamend" title="Delete Parameter" onclick="removeParamUpdate('+(j+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a><a class="editParam disableamend" title="Edit Parameter" onclick="editParamUpdate('+(j+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-edit"></span></a></td></tr>';
													}
											}else{
												htmlAutoParam = '';
											}
										}
										$('#autoParamContent').html(htmlAutoParam);

									var taskExec = data.SOPs;
									//TaskExecutionFlowID = taskExec.TaskExecutionFlowID;
									//var SopJobEvents = c[0].SopJobEvents;
									/*if (ExecuteAutomation != 'RT'){
										var sopJobName = data.SopJobEvents.jobName;
										var sopJobDetails = data.SopJobEvents.jobDetails;
										var sopCronExpr = data.SopJobEvents.cronExpression;
										//var sopCronExpr = cronParser(data.SopJobEvents.cronExpression);
										var sopTimeZone = data.SopJobEvents.timeZone;
										var sopactive = data.SopJobEvents.active;
										sopalertId = data.SopJobEvents.alertId;
										sop_id = data.SopJobEvents._id;
									}else{
										var sopCronExpr = null; 
									}*/
									var amtaskOwner = new Array();
									var amtaskName = new Array();
									var amtaskDesc = new Array();
									var amtaskExecution = new Array();
									var amtaskExeOrder = new Array();
									var amtaskDuration = new Array();
									var amtaskFileNm = new Array();				
									taskMaster = taskExec.TaskMasters;
									for(var k = 0; k<taskMaster.length; k++){
										amtaskOwner[k] = taskMaster[k].TaskOwner;
										amtaskName[k] = taskMaster[k].TaskName;
										amtaskDesc[k] = taskMaster[k].TaskShortDesc;
										amtaskExecution[k] = taskMaster[k].TaskExecutionType;
										amtaskExeOrder[k] = taskMaster[k].TaskExecutionOrder;
										amtaskFileNm[k] = taskMaster[k].TaskFileName;
										//amtaskDuration[k] = taskMaster[k].TaskDuration;
									}

							
								//var taskRTE = '<div name="taskdesc" style="display:none;" ng-model="createsop.taskdesc" text-angular="" class="ng-pristine ng-valid ng-isolate-scope ta-root ng-touched txtAngDiv"><div class="ta-toolbar btn-toolbar"><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H1</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H2</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H3</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">P</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">pre</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-quote-right"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-bold"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-italic"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-underline"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-list-ul"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-list-ol"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-repeat"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-undo"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-ban"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-left"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-center"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-right"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">Toggle HTML</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-picture-o"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-link"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-unlink"></i></button></div></div><div contenteditable="true" ng-model="text" ta-bind="text" ng-hide="showHtml" class="ng-pristine ng-untouched ng-valid ng-scope ng-isolate-scope ta-text ta-editor form-control"></div><textarea ng-model="html" ta-bind="html" ng-show="showHtml" class="ng-pristine ng-untouched ng-valid ng-scope ng-isolate-scope ta-html ta-editor form-control ng-hide"></textarea><input type="hidden" style="display: none;" name="taskdesc" value=""><br />Task Update Coments : <input type="text" ng-model="createsop.taskcomments" id="createsoptaskcomments" placeholder="Enter task update comment" required /></div>';
								
								
								for(var l=0; l<amtaskName.length; l++){
									if (typeof(amtaskExecution[l]) == 'undefined' || amtaskExecution[l] == null){
										amtaskExecution[l] = '';
									}
									var fileURL = '';
									if (typeof(amtaskFileNm[l]) == 'undefined' || amtaskFileNm[l] == null){
										fileURL = 'NO FILE AVAILABLE'
									}else{
										fileURL = '<a href="https://swarnasetu.mybluemix.net/rest/v1/sopmeta/download?fileName='+amtaskFileNm[l]+'" alt="Download File">Download</a>';
									}
									
									$('#taskAmendRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td>'+amtaskName[l]+'</td><td id="taskDesc'+l+'">'+amtaskDesc[l]+'</td><td><input type="button" class="form-control editDesc disableamend"  value="Edit Description" disabled="disabled"/><td>'+amtaskOwner[l]+'</td><td>'+amtaskExecution[l]+'</td><td style="text-align:center;" align="center"><a href="javascript:void(0)" ng-click="editTask();" class="editTask disableamend" title="Edit Task"><span class="glyphicon glyphicon-edit" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="saveTask" ng-click="saveTask();" style="display:none;" title="Save Task"><span class="glyphicon glyphicon-floppy-disk" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="deleteTask disableamend" title="Delete Task"><span class="glyphicon glyphicon-remove-sign" style="font-size:20px;"></span></a></td></tr>');
									$('#taskPdfRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td  style="word-wrap:break-word;">'+amtaskName[l]+'</td><td>'+amtaskDesc[l]+'</td></tr>');
									taskExeArray.push(amtaskExeOrder[l]);
								}
									
									
									

									if(autoProvd == 'blueprism'){
										$("#selectProcessValueUp").val(automationProcessUp).attr("disabled","disabled");
										$('#autoReqInfo').show();
										$('#autoProvideRow').show();
										$('#autoProcessContainer').show();
									}else{
										$("#autoProcessContainer").hide();
									}
									
										if (typeof(AutomationInput) != 'undefined' || AutomationInput != null){
											if(autoProvd == 'blueprism'){							
												var html = '';
												if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
													$.each(AutomationInput[0], function(key, value){
														html += '<div style="width:150px; margin:10px 20px; font: bold 13px verdana; float:left;">' + key + '</div>';
														html += '<input class="autoDOMvalue disableClass" style="float:left;" type="text" value="' + value + '" />';
													});
												}
												$("#blueAutoGenUp").html(html);
											}else if(autoProvd == 'IPSoft'){
												if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
													$("#ipsoftAutomationNameu").val(AutomationInput[0].automationName).attr("disabled","disabled");
													$("#ipsoftAutomationPathu").val(AutomationInput[0].automationPath).attr("disabled","disabled");
													$("#ipsoftautomationDescriptionu").val(AutomationInput[0].automationDesc).attr("disabled","disabled");
													$("#ipsoftOSTypeu").val(AutomationInput[0].osType).attr("disabled","disabled");
													$('#ipsoftSeverityu').val(AutomationInput[0].severity).attr("disabled","disabled");
													$('#ipsoftAssGroupu').val(AutomationInput[0].assignedGroup).attr("disabled","disabled");
													$('#ipsoftTargetHostu').val(AutomationInput[0].targetHost).attr("disabled","disabled");
												}
											}else if(autoProvd == 'IBMWorkloadAutomation'){
												if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
													$("#workLoadProcess").val(AutomationInput[0].ProcessName).attr("disabled","disabled");
													$("#workLoadLib").val(AutomationInput[0].LibraryName).attr("disabled","disabled");
												}
											}
											
										}
									}else{
										$("input[name=sopTypeu][value=C]").attr('checked', 'checked');
									}
									$("#richTextEditorContainer").hide();
									$("#WaitAlertMsg").hide();
									
								}					
								});	
				    		},2500);
				    		
				    		$('#PDFClientname').html(data.Tickets.clientName);
							$('#PDFalertName').html(data.Tickets.ticketKey);
							$('#PDFapplicationName').html(data.Tickets.applicationName);					
							$('#PDFaccountName').html(data.Tickets.account);
				    		$('#PDFSOPCreatedBy').html('Created By:- '+createdByUserIdSOP); 
					    	$('#PDFSOPCrO').html('Created On:- '+sopCratedOn);
					    	$('#PDFSOPUpdtby').html('Last Updated By:- '+updatedByUserId);
					    	$('#PDFLstUpdOn').html('Last Updated On:-'+ updateTimestamp);
					    	$('#PDFSopDesc').html(data.SOPs.SOPShortDesc);
					    	$('#PDFSopPurpose').html(data.SOPs.SOPPurpose);
					    	$('#PDFSopActiveInactive').html(data.SOPs.activeMode);
					    	$('#PDFSopClassification').html(data.SOPs.SOPClassification);
					    	$('#PDFSopExInput').html(data.SOPs.SOPExpectedInput);
					    	$('#PDFSopExOutput').html(data.SOPs.SOPExpectedOutput);
					    	//$('#PDFSopAutoId').html(autoId);
					    	//$('#PDFSopAutoProvider').html(autoProvd);
					    	var PDFAccUserId = localStorage.getItem("userID");
					    	$('#PDFAccUserId').html(PDFAccUserId);
					    	PDFSOPReportName = 'SOP for ' + data.Tickets.ticketKey + ' for '+ data.Tickets.applicationName + ' of '+ data.Tickets.account;
					    	var d = new Date();
					 	    var month = d.getMonth()+1;
					 	    var mVal ="";
					 	    if(month == 1){mVal='JAN';}else if(month == 2){mVal = 'FEB';}else if(month == 3){mVal = 'MAR';}else if(month == 4){mVal = 'APR';}
					 	    else if(month == 5){mVal = 'MAY'}else if(month == 6){mVal = 'JUN'}else if(month == 7){mVal = 'JUL'}else if(month == 8){mVal = 'AUG'}
					 	    else if(month == 9){mVal = 'SEP'}else if(month == 10){mVal = 'OCT'}else if(month == 11){mVal = 'NOV'}else if(month == 12){mVal = 'DEC'}
					 	    var day = d.getDate();
					 	    var timeInMs = 	          
					 	    	((''+day).length<2 ? '0' : '') + day+ '-' + mVal + '-' +d.getFullYear() ;
					 	    $('#todayDate').html(timeInMs);
				    		
							$("#richTextEditorContainer").hide();
							$("#WaitAlertMsg").hide();
					    } else {
					    	$location.path('/createSOP');
					    }		    	
		    	}else{
		    	   $('#messageBoxError').show();
			       if(dataFromServer.userMessage){
			    	   $('.errorAdminMsg').html(dataFromServer.userMessage);    	 
			       }else {	    	
			    	   $('.errorAdminMsg').html(dataFromServer.internalMessage);  //$('.errorAdminMsg').html(dataFromServer.userMessage);
			       }			       
			       console.log("Submitting form failed!");		    		
		    	}
		   });


 }   
 $scope.originForm = angular.copy($scope.createsop);
 $scope.reset = function() {
	  $scope.createsop = angular.copy($scope.originForm); // Assign clear state to modified form 
	  $scope.createSOPForm.$setPristine(); 
 };

 $scope.chooseProviderValue = function() {
	currAccId=$("#accountSelOps option:selected").val();
	currAccName=$("#accountSelOps option:selected").html();
	 if($("#selectProviderValue option:selected").val()=='blueprism'){
			$('#autoReqInfo').hide();
			$('#showAutoBackContainer').show();
			$('#waitContainer').show();
			currAutoProvider = 'blueprism';
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			var responsePromise = $http.get(getClientfromAccount + '?accountName='+firstAccountName, {});
	 		responsePromise.success(function(data) {  
				var currObj = data.response;
				currClientId = currObj.clientid;
				currClientName = currObj.clientName;
				var dataObject = {
						"AutomataProvider":"blueprism",
						"ClientName":currClientName,
						"AccountName":currAccName
				};
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				/*var responsePromise = $http.post(getBPAutomataOperations, dataObject, {});
				responsePromise.success(function(dataFromServer, status, headers, config) {
					 $('#selectProcessValue').html('<option disabled value="" label="">Select Automation Process</option>');
				      for(var i=0; i< dataFromServer.length; i++){
				    	  $('#selectProcessValue').append('<option value="'+dataFromServer[i].operationShortDesc+'">'+dataFromServer[i].operation+'</option>');
				    	  $('#autoProcessContainer').show();
				    	  $('#autoReqInfo').show();
				      }
				      $('#showAutoBackContainer').hide();
						$('#waitContainer').hide();
				 });
				 */
				var currAccNameTest = $("#accountSelOps option:selected").text();
				$('#autoProcessContainer').show();
			 	$('#accNmAuto').html(currAccNameTest);		 	
			 	$('#clientNmAuto').html(currClientName);
			 	$('#accNmAutoResp').html(currAccNameTest);	
			 	$('#clientNmAutoResp').html(currClientName);			 	
			 	$('#showAutoBackContainer').hide();
				$('#waitContainer').hide();
				$('#autoReqInfo').show();
			});
	 		responsePromise.success(function(data) {  
	 			$('#showAutoBackContainer').hide();
				$('#waitContainer').hide();
	 		});
		}else if($("#selectProviderValue option:selected").val()=='IPSoft'){
			$('#showAutoBackContainer').show();
			$('#waitContainer').show();
			$('#autoProcessContainer').hide();
			currAutoProvider = 'ipsoft';
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			$http.get(getClientfromAccount + '?accountName='+currAccName).success(function(data) { 
				var currObj = data.response;
				currClientId = currObj.clientid;
				currClientName = currObj.clientName;
				$('#autoReqInfo').show();
				$('#autoProcessContainer').hide();
				var currAccNameTest = $("#accountSelOps option:selected").text();
			 	$('#accNmAuto').html(currAccNameTest);
			 	$('#accNmAutoResp').html(currAccNameTest);
			 	$('#clientNmAuto').html(currClientName);
			 	$('#showAutoBackContainer').hide();
				$('#waitContainer').hide();
			});
				
		}else if($("#selectProviderValue option:selected").val()=='IBMWorkloadAutomation'){
			$('#autoReqInfo').show();
			$('#autoProcessContainer').hide();
			currAutoProvider = 'IBMWorkloadAutomation';
			var currAccNameTest = $("#accountSelOps option:selected").text();
		 	$('#accNmAuto').html(currAccNameTest);
		 	$('#accNmAutoResp').html(currAccNameTest);
		 	$('#clientNmAuto').html(currClientName);
		}
};
$scope.showProcessTip= function(){
	var processShortDesc = $("#selectProcessValue option:selected").val();
	$('#autoProcessOpShortDesc').attr('title',processShortDesc);
}
$scope.createAutoReqInfo= function(){
	$('#clientNmAutoResp').html(localStorage.getItem("clientName"));
	if(currAutoProvider == 'blueprism'){
		$('#showAutoBackContainer').show();
		$('#showAutomationRequest').show();
		$('#blueAutoGen').show();
		$('#blueAutoGen').removeAttr('disabled');
		$('#ipSoftAutoGen').hide();
		$('#ibmWorkLoadAutoGen').hide();
		$('#generateInputBtn').removeClass('hideClass');
		//$('#blueAutoGen').html('');

	}else if(currAutoProvider == 'ipsoft'){
		$('#showAutoBackContainer').show();
		$('#showAutomationRequest').show();
		$('#blueAutoGen').hide();
		$('#ibmWorkLoadAutoGen').hide();
		$('#ipSoftAutoGen').show();
		$('#generateInputBtn').addClass('hideClass');
	}else if(currAutoProvider == 'IBMWorkloadAutomation'){
		$('#showAutoBackContainer').show();
		$('#showAutomationRequest').show();
		$('#blueAutoGen').hide();
		$('#ipSoftAutoGen').hide();
		$('#ibmWorkLoadAutoGen').show();		
		$('#generateInputBtn').addClass('hideClass');
	}
};
/*$scope.createAutoResInfo= function(){
	if(currAutoProvider == 'blueprism'){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#blueAutoGenResp').show();
		$('#blueAutoGenResp').removeAttr('disabled');
		$('#ipSoftAutoGenResp').hide();
		$('#ibmWorkLoadAutoGenResp').hide();
		//$('#generateInputBtn').removeClass('hideClass');
		//$('#blueAutoGen').html('');

	}else if(currAutoProvider == 'ipsoft'){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#blueAutoGenResp').hide();
		$('#ibmWorkLoadAutoGenResp').hide();
		$('#ipSoftAutoGenResp').show();
		//$('#generateInputBtn').addClass('hideClass');
	}else if(currAutoProvider == 'IBMWorkloadAutomation'){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#blueAutoGenResp').hide();
		$('#ipSoftAutoGenResp').hide();
		$('#ibmWorkLoadAutoGenResp').show();		
		//$('#generateInputBtn').addClass('hideClass');
	}
};*/
$scope.createAutoResInfo= function(){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#ibmWorkLoadAutoGenResp').show();
		$('#clientNmAutoResp').html(localStorage.getItem("clientName"));
};

/*$scope.viewAutoResInfo= function(){
	if(currAutoProvider == 'blueprism'){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#blueAutoGenResp').show();
		$('#ipSoftAutoGenResp').hide();
		//$('#generateInputBtn').addClass('disableClass');
		$('#createParamJSONRespB').show();
	}else if(currAutoProvider == 'ipsoft'){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#blueAutoGenResp').hide();
		$('#blueAutoGenResp').attr('disabled','disabled');
		$('#ipSoftAutoGenResp').show();
		$('#ipsoftAutomationNameResp').attr('disabled','disabled');
		$('#ipsoftAutomationPathResp').attr('disabled','disabled');
		$('#ipsoftautomationDescriptionResp').attr('disabled','disabled');
		$('#ipsoftOSTypeResp').attr('disabled','disabled');
		$('#ipsoftSeverityResp').attr('disabled','disabled');
		$('#ipsoftAssGroupResp').attr('disabled','disabled');
		$('#ipsoftTargetHostResp').attr('disabled','disabled');
		$('#appParamTableResp').show();
		$('#addParamCreateLinkResp').hide();
		$('#createParamJSONResp').hide();		
		$('.deleteParam').addClass('disableamend');
		//$('#generateInputBtn').addClass('hideClass');
	}else if(currAutoProvider == 'IBMWorkloadAutomation'){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#blueAutoGenResp').hide();
		$('#ipSoftAutoGenResp').hide();
		$('#ibmWorkLoadAutoGenResp').show();
		$('#workLoadProcessResp').attr('disabled','disabled');
		$('#workLoadLibResp').attr('disabled','disabled');
		//$('#generateInputBtn').addClass('hideClass');
	}
};*/

$scope.viewAutoResInfo= function(){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#ibmWorkLoadAutoGenResp').show();
		$('.deleteOutResParam').addClass('disableClass');
		$('.editOutputParam').addClass('disableClass');
		$('#outputName').attr('disabled','disabled');
		$('#outputDesc').attr('disabled','disabled');
		$('#outputType').attr('disabled','disabled');		
};

$scope.viewAutoReqInfo= function(){
	if(currAutoProvider == 'blueprism'){
		$('#showAutoBackContainer').show();
		$('#showAutomationRequest').show();
		$('#blueAutoGen').show();
		$('#ipSoftAutoGen').hide();
		$('#generateInputBtn').addClass('disableClass');
		$('#createParamJSONB').show();
		$('#appParamTableB').show();
	}else if(currAutoProvider == 'ipsoft'){
		$('#showAutoBackContainer').show();
		$('#showAutomationRequest').show();
		$('#blueAutoGen').hide();
		$('#blueAutoGen').attr('disabled','disabled');
		$('#ipSoftAutoGen').show();
		$('#ipsoftAutomationName').attr('disabled','disabled');
		$('#ipsoftAutomationPath').attr('disabled','disabled');
		$('#ipsoftautomationDescription').attr('disabled','disabled');
		$('#ipsoftOSType').attr('disabled','disabled');
		$('#ipsoftSeverity').attr('disabled','disabled');
		$('#ipsoftAssGroup').attr('disabled','disabled');
		$('#ipsoftTargetHost').attr('disabled','disabled');
		$('#appParamTable').show();
		$('#addParamCreateLink').hide();
		$('#createParamJSON').hide();		
		$('.deleteParam').addClass('disableamend');
		$('#generateInputBtn').addClass('hideClass');
	}else if(currAutoProvider == 'IBMWorkloadAutomation'){
		$('#showAutoBackContainer').show();
		$('#showAutomationRequest').show();
		$('#blueAutoGen').hide();
		$('#ipSoftAutoGen').hide();
		$('#ibmWorkLoadAutoGen').show();
		$('#workLoadProcess').attr('disabled','disabled');
		$('#workLoadLib').attr('disabled','disabled');
		$('#generateInputBtn').addClass('hideClass');
	}
};
$scope.editAutoReqInfo= function(){
	if(currAutoProvider == 'blueprism'){
		$('#showAutoBackContainer').show();
		$('#showAutomationRequest').show();
		$('#blueAutoGen').show();
		$('#blueAutoGen').removeAttr('disabled');
		$('#ipSoftAutoGen').hide();
		$('#ibmWorkLoadAutoGen').hide();
		$('#generateInputBtn').addClass('disableClass');
		$('#createParamJSONB').show();

	}else if(currAutoProvider == 'ipsoft'){
		$('#showAutoBackContainer').show();
		$('#showAutomationRequest').show();
		$('#blueAutoGen').hide();
		$('#ibmWorkLoadAutoGen').hide();
		$('#ipSoftAutoGen').show();
		$('#ipsoftAutomationName').removeAttr('disabled');
		$('#ipsoftAutomationPath').removeAttr('disabled');
		$('#ipsoftautomationDescription').removeAttr('disabled');
		$('#ipsoftOSType').removeAttr('disabled');
		$('#ipsoftSeverity').removeAttr('disabled');
		$('#ipsoftAssGroup').removeAttr('disabled');
		$('#ipsoftTargetHost').removeAttr('disabled');
		$('#appParamTable').show();
		$('#addParamCreateLink').show();
		$('#createParamJSON').show();
		$('.deleteParam').removeClass('disableamend');
		$('#generateInputBtn').addClass('hideClass');
	}else if(currAutoProvider == 'IBMWorkloadAutomation'){
		$('#showAutoBackContainer').show();
		$('#showAutomationRequest').show();
		$('#blueAutoGen').hide();
		$('#ipSoftAutoGen').hide();
		$('#ibmWorkLoadAutoGen').show();
		$('#workLoadProcess').removeAttr('disabled');
		$('#workLoadLib').removeAttr('disabled');
		$('#generateInputBtn').addClass('hideClass');
	}
};

/*
$scope.editAutoResInfo= function(){
	if(currAutoProvider == 'blueprism'){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#blueAutoGenResp').show();
		$('#blueAutoGenResp').removeAttr('disabled');
		$('#ipSoftAutoGenResp').hide();
		$('#ibmWorkLoadAutoGenResp').hide();
		//$('#generateInputBtn').addClass('disableClass');
		$('#createParamJSONRespB').show();

	}else if(currAutoProvider == 'ipsoft'){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#blueAutoGenResp').hide();
		$('#ibmWorkLoadAutoGenResp').hide();
		$('#ipSoftAutoGenResp').show();
		$('#ipsoftAutomationNameResp').removeAttr('disabled');
		$('#ipsoftAutomationPathResp').removeAttr('disabled');
		$('#ipsoftautomationDescriptionResp').removeAttr('disabled');
		$('#ipsoftOSTypeReps').removeAttr('disabled');
		$('#ipsoftSeverityResp').removeAttr('disabled');
		$('#ipsoftAssGroupResp').removeAttr('disabled');
		$('#ipsoftTargetHostResp').removeAttr('disabled');
		$('#appParamTableResp').show();
		$('#addParamCreateLinkResp').show();
		$('#createParamJSONResp').show();
		$('.deleteParam').removeClass('disableamend');
		//$('#generateInputBtn').addClass('hideClass');
	}else if(currAutoProvider == 'IBMWorkloadAutomation'){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#blueAutoGenResp').hide();
		$('#ipSoftAutoGenResp').hide();
		$('#ibmWorkLoadAutoGenResp').show();
		$('#workLoadProcessResp').removeAttr('disabled');
		$('#workLoadLibResp').removeAttr('disabled');
		//$('#generateInputBtn').addClass('hideClass');
	}
};
*/

$scope.editAutoResInfo= function(){
		$('#showAutoBackContainer').show();
		$('#showAutomationResponse').show();
		$('#ibmWorkLoadAutoGenResp').show();
		$('.deleteOutResParam').removeClass('disableClass');
		$('.editOutputParam').removeClass('disableClass');
		$('#outputName').removeAttr('disabled');
		$('#outputDesc').removeAttr('disabled');
		$('#outputType').removeAttr('disabled');
};

$scope.generateAutomataServiceRequest = function(){
	if(currAutoProvider == 'blueprism'){
		var processName = $("#selectProcessValue option:selected").text();
		var dataObject = {
				"AutomataProvider":currAutoProvider,
				"ClientName":currClientName,
				"AccountName":currAccName,
				"processName":processName
		} 
		$('#waitContainerOnGen').show();
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		var responsePromise = $http.post(generateAutomataServiceRequest, dataObject, {});
		responsePromise.success(function(dataFromServer, status, headers, config) {
			//automataJSONobj = dataFromServer;
			//var jsondataObject = JSON.stringify(dataFromServer);
			var html = '';
			$.each(dataFromServer, function(key, value){
				html += '<div style="width:150px; margin:10px 20px; font: bold 13px verdana;">' + key + '</div>';
				html += '<input class="autoDOMvalue" type="text" value="' + value + '" />';
			});
			
			 $('#blueAutoGen').html(html);
			 $('#autoGenDone').show();
			 $('#waitContainerOnGen').hide();
		 });
		 responsePromise.error(function(dataFromServer, status, headers, config) {
			 $('#waitContainerOnGen').hide();
			 $('#alertAutomataGenerate').html(dataFromServer.userMessage); 
			 $('#alertErrorData').show();
		 });
	}else{
		return false;
	}
};
$scope.autoGenerateDone = function(){	
	//$('#selectProviderValue').attr('disabled','disabled');
	//$('#selectProcessValue').attr('disabled','disabled');
	if(currAutoProvider == 'blueprism'){
		/*if($('.autoDOMvalue').val()=='??' || $('.autoDOMvalue').val()==''){
			alert('Please enter the Automation Input Feilds');
			return false;
		}*/
		$('#createAutoReq').addClass('disableClass');
		//$('#editAutoReq').removeClass('disableClass');
		$('#viewAutoReq').removeClass('disableClass');
		$('#appParamTableB').hide();
		//var autamataArray = [];
		//getJSONFromDOM($('#blueAutoGen'), autamataArray);
		automataJSONobj = ipsoftAutomationInput;
		closeGenDialog();
	}else if(currAutoProvider == 'ipsoft'){	
		automataJSONobj = ipsoftAutomationInput;
		$('#createAutoReq').addClass('disableClass');
		//$('#editAutoReq').removeClass('disableClass');
		$('#viewAutoReq').removeClass('disableClass');
		$('#appParamTable').hide();
		closeGenDialog();
	}else if(currAutoProvider == 'IBMWorkloadAutomation'){
		if(ipsoftAutomationInput.length < 1){
			alert("Please ADD one Workload Automation");
		}else{
			automataJSONobj = ipsoftAutomationInput;
			$('#createAutoReq').addClass('disableClass');
			//$('#editAutoReq').removeClass('disableClass');
			$('#viewAutoReq').removeClass('disableClass');
			closeGenDialog();
		}
	}
};
/*
$scope.autoGenerateDoneResp = function(){	
	if(currAutoProvider == 'blueprism'){
		$('#createAutoRes').addClass('disableClass');
		$('#editAutoRes').removeClass('disableClass');
		$('#viewAutoRes').removeClass('disableClass');
		$('#appParamTableBResp').hide();
		automataJSONobjRes = ipsoftAutomationResInput;
		closeGenDialog();
	}else if(currAutoProvider == 'ipsoft'){	
		automataJSONobjRes = ipsoftAutomationResInput;
		$('#createAutoRes').addClass('disableClass');
		$('#editAutoRes').removeClass('disableClass');
		$('#viewAutoRes').removeClass('disableClass');
		$('#appParamTableResp').hide();
		closeGenDialog();
	}else if(currAutoProvider == 'IBMWorkloadAutomation'){
		//console.log('IBMWorkloadAutomation');
		var workLoadProcess = $('#workLoadProcessResp').val();
    	var workLoadLib = $('#workLoadLibResp').val(); 	
    	if(workLoadLib != '' && workLoadProcess != '')  {
            $('#autoGenDoneRes').show(); 	
			automataJSONobjRes = [{
				   "LibraryName": workLoadLib,
	               "ProcessName": workLoadProcess
			}];
			$('#createAutoRes').addClass('disableClass');
			$('#editAutoRes').removeClass('disableClass');
			$('#viewAutoRes').removeClass('disableClass');
			closeGenDialog();
    	} else {
            alert('Please enter the required feilds.');
        } 
	}
};*/

var outputParamRowVal = 0;
$scope.addOutputParam = function(){	
	console.log('Inside Automation Param Output...');
	var outputName = $('#outputName').val();
	var outputDesc = $('#outputDesc').val(); 
	var outputType = $('#outputType option:selected').val();
	if(outputName != '')  {      
		var currOutputParam = {
			   "OutputName": outputName,
               "OutputDescription": outputDesc,
               "OutputType": outputType
		};
		automataJSONobjRes = [];
		automataJSONobjRes.push(currOutputParam);
		//$('#createAutoRes').addClass('disableClass');
		//$('#editAutoRes').removeClass('disableClass');
		//$('#viewAutoRes').removeClass('disableClass');
		$('#outNmTpRow').append('<tr id="outputRow'+outputParamRowVal+'"><td>'+outputName+'</td><td>'+outputType+'</td><td>'+outputDesc+'</td><td><a class="deleteOutResParam" title="Delete Automation Response Parameter" onclick="removeOutputParam('+outputParamRowVal+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a></td></tr>');
		$('#autoGenDoneRes').show();
		$('#tabOutputParam').show();
		$('#outputName').val('');
		$('#outputDesc').val(''); 
		$('#outputType').html('<option value="none">Select Output Type</option><option value="String">String</option><option value="Integer">Integer</option><option value="Boolean">Boolean</option><option value="Float">Float</option>');
		outputParamRowVal = outputParamRowVal + 1;
	} else {
        alert('Please enter the output name');
    } 
	
};
$scope.autoGenerateDoneResp = function(){	
    	closeGenDialog();
    	$('#createAutoRes').addClass('disableClass');
		$('#editAutoRes').removeClass('disableClass');
		$('#viewAutoRes').removeClass('disableClass');
};


$scope.refreshAutomataRequest = function(){	
	$('#createAutoReq').removeClass('disableClass');
	$('#editAutoReq').addClass('disableClass');
	$('#viewAutoReq').addClass('disableClass');
};
});

app.controller('TabbedTicketForm', function($scope, $http) {
	
	 $scope.toggleDropdown = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.status.isopen = !$scope.status.isopen;
  };
});


app.filter('searchFor', function(){
	return function(arr, searchString){
		if(!searchString){
			return arr;
		}
		var result = [];
		searchString = searchString.toLowerCase();

		angular.forEach(arr, function(item){
			if (typeof(item.alertName) != 'undefined' && item.alertName != null)
			{
				if(item.alertName.toLowerCase().indexOf(searchString) !== -1){
					result.push(item);
				}
			}
			if (typeof(item.userName) != 'undefined' && item.userName != null)
			{
				if(item.userName.toLowerCase().indexOf(searchString) !== -1){
					result.push(item);
				}
			}
			if (typeof(item.roleName) != 'undefined' && item.roleName != null)
			{
				if(item.roleName.toLowerCase().indexOf(searchString) !== -1){
					result.push(item);
				}
			}
		});
		return result;
	};

});

app.controller("crudController",function($location,$scope,$http){
	$scope.showHidePanel = function(obj) {
		$('#definePanel').toggle("slow");
		if($('#defineCollapseICO').hasClass('glyphicon-plus') == true){
			$('#defineCollapseICO').removeClass('glyphicon-plus').addClass('glyphicon-minus');
		}else{
			$('#defineCollapseICO').addClass('glyphicon-plus').removeClass('glyphicon-minus');
		}
	};
	$scope.defineSOP = function(obj) {
		$('#dropdownLeftNav').hide();
		$('#showAutoBackContainerNavBar').show();
		$('#waitContainerNavBar').show();	
		//checkPermission("Add","sopeditor");
    	//if(flagCheckPM){
			$location.path('/createSOP');
			setTimeout(function(){
				$("#taskTabSet").removeClass('active');
				$("#sopTabSet").removeClass('active');
				$("#alertTabSet").addClass('active');
				$(".tab-content > div:nth-child(1)").addClass("active");
				$(".tab-content > div:nth-child(2)").removeClass("active");
				$(".tab-content > div:nth-child(3)").removeClass("active");
				$('#messg').html('');
				$('#accountSelOps').removeAttr("disabled") ;
				globalSOP = 'AlertSOP';
				$('#tab-alert-text').html(uiconfig.SOPEditortab1);
				$('#ticketDetails').hide();
				$('#alertDetails').show();
				$('#uitab1heading').html('Enter Alert Details');
				$('#searchInput').attr('placeholder','Enter Alert Name').removeAttr('disabled');
				$('#advancedSearchBtn').removeAttr('disabled');				
				$('#scheduledCheck').show();
				ipsoftAutomationInput = [];
				ipsoftAutomationResInput = [];
				$('#showAutoBackContainerNavBar').hide();
				$('#waitContainerNavBar').hide();
			},3500);
    	/*}else{
			dialogAccess.dialog("open");
			return false;
    	}*/
		ipsoftAutomationInput = [];
	    ipsoftAutomationResInput = [];
	    sopDataArray = [];
	    currentMapRowId = '';
	    ioMapArray = [];
	    choreoPathArray = [];
	    choreographEvent = '';
	    sourcesopIDArray = [];
	    sourcesopValueArray = [];
	    $('#addedSopPath').html('');
	    $('#selectStartSOP').removeAttr("disabled");
	};
	$scope.defineTicket = function(obj) {
		$("#taskTabSet").removeClass('active');
		$("#sopTabSet").removeClass('active');
		$("#alertTabSet").addClass('active');
		$(".tab-content > div:nth-child(1)").addClass("active");
		$(".tab-content > div:nth-child(2)").removeClass("active");
		$(".tab-content > div:nth-child(3)").removeClass("active");
		$('#dropdownLeftNav').hide();
		$('#showAutoBackContainerNavBar').show();
		$('#waitContainerNavBar').show();
		$location.path('/createSOP');
		setTimeout(function(){
			globalSOP = 'AlertTicket';
			$("#createSOPForm > div > ul > li:eq(2)").html();
			//tabs[0].active = true;
			$('#tab-alert-text').html(uiconfig.SOPEditortab4);
			$('#ticketDetails').show();
			$('#alertDetails').hide();
			$('#uitab1heading').html('Enter Ticket Details');
			$('#searchInput').attr('placeholder','Enter Ticket Name').removeAttr('disabled');
			$('#advancedSearchBtn').removeAttr('disabled');		
			$('#scheduledCheck').hide();
			ipsoftAutomationInput = [];
			ipsoftAutomationResInput = [];
			if(testEnabler !='true'){
				$("#createTicketName").attr("disabled","disabled");
				$("#assigneeGroup").attr("disabled","disabled");
				$("#ticketTypeDrp").attr("disabled","disabled");
				$("#ticketStatusDrp").attr("disabled","disabled");
			}else{
				$("#createTicketName").removeAttr("disabled");
				$("#assigneeGroup").removeAttr("disabled");
				$("#ticketTypeDrp").removeAttr("disabled");
				$("#ticketStatusDrp").removeAttr("disabled");
			}
			$('#showAutoBackContainerNavBar').hide();
			$('#waitContainerNavBar').hide();
		},3500);
		
		ipsoftAutomationInput = [];
	    ipsoftAutomationResInput = [];
	    sopDataArray = [];
	    currentMapRowId = '';
	    ioMapArray = [];
	    choreoPathArray = [];
	    choreographEvent = '';
	    sourcesopIDArray = [];
	    sourcesopValueArray = [];
	    $('#addedSopPath').html('');
	    $('#selectStartSOP').removeAttr("disabled");		
	};
	
	$scope.showSOPHome = function(obj) {
		$location.path('/');
		$('#forticketmenutext').removeAttr("checked"); 
		$('#foralertmenutext').removeAttr("checked");
		$('#searchInput').attr('disabled','disabled');
	};
	$scope.updateSOP = function(obj) {
		checkPermission("Update","sopeditor");
		if(flagCheckPM){
			if($('#amendData').hasClass('disableamend') == true){
				return false;
			}else{
				//$('#alertname').removeAttr("disabled") ;
				//$('#alertdescription').removeAttr("disabled") ;
				$('#automationid').removeAttr("disabled") ;
				//$('#alerttype').removeAttr("disabled");
				//$('#alertseverity').removeAttr("disabled");
				$('#sopdescription').removeAttr("disabled");
				$('#soppurpose').removeAttr("disabled");
				$('#sopclassification').removeAttr("disabled");
				$('#sopexpectedinput').removeAttr("disabled");
				$('#sopexpectedoutput').removeAttr("disabled");
				$('#toggle_event_editing button').eq(0).removeClass('disabled');
		    	$('#toggle_event_editing button').eq(1).removeClass('disabled');
								
				//$('#sopname').removeAttr("disabled");
				$('#automationuserIdup').removeAttr("disabled");
				$('#automationpassword').removeAttr("disabled");
				$('#autoProvideSOPUp').removeAttr("disabled");
				$('#selectapplication').removeAttr("disabled");
				
				$('#sopjobnmu').removeAttr("disabled","disabled");
				$('#scheduledetailsu').removeAttr("disabled","disabled");											
				$('#createTimeZoneu').removeAttr("disabled","disabled");	
				$("input[name=timeZoneu]").removeAttr("disabled","disabled");
				$("input[name=executeAutomationu]").removeAttr("disabled","disabled");
				$("input[name=sopTypeu][value=C]").removeAttr("disabled","disabled");
				$("input[name=sopTypeu][value=S]").removeAttr("disabled","disabled");
				$('#editChoreou').removeClass('disableClass');				
				$("#cronExpTool").show();
				
				$('#taskName').removeAttr("disabled");
				$('#taskDescription').removeAttr("disabled");
				$('#taskOwner').removeAttr("disabled");
				$('#taskExeTyp').removeAttr("disabled");
				$('#taskExeOrder').removeAttr("disabled");
				$('.editTask').removeClass('disableamend');
				$('.deleteTask').removeClass('disableamend');	
				$('#addTaskOnAmendTable').removeClass('disableamend');			
				$('#amendData').addClass('disableamend');
				$('#editAutoReq').removeClass('disableClass');
				$('#editAutoResu').removeClass('disableClass');
				$('.autoDOMvalue').removeClass('disableClass');				
				$('#viewAutoReq').removeClass('disableClass');
				$('.deleteOutResParam').removeClass('disableClass');
				$('.editOutputParam').removeClass('disableClass');
				$('#sopUpdateComment').show();
				$('#upSOPButton').show();
				$('#exportSOP').hide();
				$('#exportPDF').hide();
				$('#messg').html('');		
			}
		}else{
			dialogAccess.dialog("open");
			return false;
		}
	};
	/*$scope.createDefineSOP = function(obj) {
		$('#indexContainer').show();
		$('#updatePage').hide();
		$('#messg').html('');
	};*/
	$scope.deleteSOP = function(obj) {
		if(globalSOP == 'AlertSOP'){
			checkPermission("Delete","sopeditor");
			var delSOPMsg;
			if(activeMode == 'y'){
				delSOPMsg = "This SOP is in Active status - Do you still want to delete it ?";
	    	}else{
	    		delSOPMsg = "Do you want to delete it ?";
	    	}
			
			if(flagCheckPM){
				if($('#deletedata').hasClass('disableamend') == true){
					return false;
				}else{
				    var r = confirm(delSOPMsg);
				    if (r == true) {
				    	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				    	$http.delete(DeleteSOPSR + '?accountId='+firstAccountId+'&applicationId='+currLeftApplId+'&alertId='+currentAlertId).success(function(data) {});		
				    	$location.path('/createSOP');
				    	 $('#searchInput').attr('placeholder','Enter Alert Name');
				    } else {
				       
				    }
				}
			}else{
				dialogAccess.dialog("open");
				return false;
			}
		}else{
			 var r = confirm("Are you sure to delete!");
			    if (r == true) {
			    	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			    	$http.delete(RemoveSOP + '?Id='+ticketId).success(function(data) {});		
			    	$location.path('/createSOP');
			    	 $('#searchInput').attr('placeholder','Enter Alert Name');
			    }
		}
	};
	
});
app.controller("InstantSearchController",function($location,$scope,$http){
	$scope.changeSearch = function() {
		$location.path('/amendSOP');
		//console.log(globalSOP);
		if(globalSOP == 'AlertSOP'){
			$('#ticketDataList').hide();
			$('#alertDataList').show();
		}else{
			$('#alertDataList').hide();
			$('#ticketDataList').show();
		}
		currLeftApplId = $("#leftSelAppl option:selected").attr('value');
		//console.log("Search Application Id: "+currLeftApplId);
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		if(globalSOP == 'AlertSOP'){
			$http.get(GetSOPListAlert + '?accountId='+firstAccountId+'&applicationId='+currLeftApplId).success(function(data) { 
				var fetchData = data.response; 
				if(fetchData != ''){
					for(i=0;i<fetchData.length; i++){
						$scope.items = fetchData;
					}
				}else{
					alert('No Alert Saved for this application');
				}
				
			});
		}else if(globalSOP == 'AlertTicket'){
			$http.get(GetTicketList + '?application='+currLeftApplId).success(function(data) { 
				var fetchData = data.response; 
				if(fetchData != ''){
					for(i=0;i<fetchData.length; i++){
						$scope.items = fetchData;
					}
				}else{
					alert('No Ticket Saved for this application');
				}
				
			});
		}
		
	};
	$scope.advancedSearchOption = function(obj) {console.log('Inside'+globalSOP);
		if(globalSOP == 'AlertSOP'){
			$location.path('/advanceSearch');
		}else{
			$location.path('/advanceSearchTicket');
		}
	};
	
	$scope.hasFocus = false;	

	
	$scope.showAlertData = function(obj) {
		checkPermission("Update","sopeditor");
		if(flagCheckPM){
			$('#taskAmendRecord').html('');
			$('#taskPdfRecord').html('');
			$('#messg').html('');
			//$('#exportSOP').show();
			$('#exportPDF').show();
			$location.path('/amendSOP');
			setTimeout(function(){
				$("#richTextEditorContainer").show();
				$("#WaitAlertMsg").show();
				if(globalSOP == 'AlertSOP'){
					currentAlertId = obj;
				}else{
					currentTicketId = obj;
				}
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				var sopGetService = '';
				if(globalSOP == 'AlertSOP'){
					sopGetService = getSOPList + '?accountId='+firstAccountId+'&applicationId='+currLeftApplId+'&alertId='+obj;
					$('#ticketReq').hide();
				}else{
					sopGetService = getSOPforTicketKey + '?EventKey=' +obj;
					$('#ticketReq').show();
				}
				$http.get(sopGetService).success(function(dataObj) {
				var data = dataObj.response;
				if(globalSOP == 'AlertSOP'){
					$('#pdfTicketRow').html('');
					$('#scheduledCheckUp').show();
					$('#ticketDetailsUp').hide();
					$('#alertDetailsUp').show();
					$('#tabAlertText').html(uiconfig.SOPEditortab1);
					$('#uitab1headingUp').html('Enter Alert Details');
					var c = data.SOPs; 
					ChoreographObj = data.ChoreographObj;
					choreographEvent = ChoreographObj;
					if(ChoreographObj != null){
						choreoPathArray = ChoreographObj.paths;
					}
					for (var k = 0; k < c.length; c++){
						SOPID = c[0].SOPID;
						autoId = c[0].WorkflowAutomationID;
						SOPPurpose = c[0].SOPPurpose;
						SOPClassification = c[0].Classification;
						SOPExpectedInput = c[0].ExpectedInput;
						SOPExpectedOutput = c[0].ExpectedOutput;
						SOPDesc = c[0].SOPShortDesc;
						SOPName = c[0].SOPName;
						sopType = c[0].SOPType;
						activeMode = c[0].activeMode;
						userID = c[0].WorkflowAutomationUserId;
						passD = c[0].WorkflowAutomationPassword;
						autoProvd = c[0].AutomationProvider;
						automationProcessUp = c[0].AutomationProcess;
						operationShortDesc = c[0].operationShortDesc;
						ExecuteAutomation = c[0].ExecuteAutomation;
						createdByUserIdSOP = c[0].createdByUserId;
						createTimestampSOP = c[0].createTimestamp;
						currActiveStatus = c[0].activeMode;
						if(sopType == 'C'){
							$("input[name=sopTypeu][value=C]").attr('checked', 'checked').attr("disabled","disabled");
							$("input[name=sopTypeu][value=S]").attr("disabled","disabled");
							$('#autoProcessContainer').hide();
							$('#choreoReqInfou').show();
							$('#autoReqInfou').hide();
							$('#tabTickChoreo').show();
							$('#tabTickSimple').hide();
						}else{
							$('#tabTickChoreo').hide();
							$('#tabTickSimple').show();
							$('#autoReqInfou').show();
							$("input[name=sopTypeu][value=S]").attr('checked', 'checked').attr("disabled","disabled");
							$("input[name=sopTypeu][value=C]").attr("disabled","disabled");
							$('#choreoReqInfou').hide();
						
						var AutomationOutput = c[0].AutomationOutput;
						console.log("AutomationOutput: "+AutomationOutput);
						automataJSONobjRes = AutomationOutput;
						console.log("automataJSONobjRes : "+automataJSONobjRes);
						$("#outNmTpRowu").html('');
						if (typeof(AutomationOutput[0]) != 'undefined' || AutomationOutput[0] != null){
							for(var j = 0 ; j <AutomationOutput.length; j++){
								if(AutomationOutput[j] != null){
									var OutputType = AutomationOutput[j].OutputType;
									var OutputDescription = AutomationOutput[j].OutputDescription;
									var OutputName = AutomationOutput[j].OutputName;
									$("#outNmTpRowu").append('<tr id="outputParamRow'+j+'"><td>'+OutputName+'</td><td>'+OutputType+'</td><td>'+OutputDescription+'</td><td><a class="deleteOutResParam disableClass" title="Delete Parameter" onclick="removeOutputParamUpdate('+j+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a>&nbsp;<a class="editOutputParam disableClass" title="Edit Parameter" href="javascript:void(0)"><span class="glyphicon glyphicon-edit"></span></a>&nbsp;<a class="saveOutputParam" title="Save Output Parameter" style="display:none;" href="javascript:void(0)"><span class="glyphicon glyphicon-floppy-disk"></span></a></td></tr>');
									//$("#outputNameu").val(OutputName);
									//$("#outputDescu").val(OutputDescription);
									//$("#outputTypeu").val(OutputType);
							    }
							}
							$("#tabOutputParamu").show();
						}
						if (typeof(c[0].AutomationInput) != 'undefined' || c[0].AutomationInput != null){
							AutomationInput = c[0].AutomationInput;
							ipsoftAutomationInput = AutomationInput;
							var htmlAutoParam = '';
							if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
								var i = 0;
								for(var j = 0 ; j <AutomationInput.length; j++){
									htmlAutoParam += '<tr id="paramrowId'+(j+1)+'"><td style="visibility:hidden;">'+(j+1)+'</td><td>';
									rowValUP = j + 2;
									//console.log(ipsoftAutomationInput);
									$.each(AutomationInput[j], function(key, value){
										if(autoProvd == 'IPSoft'){
											if(key != 'timeOut' && key != 'targetHost' && key != 'assignedGroup' && key != 'automationDesc' && key !='automationName' && key !='automationPath' && key != 'osType' && key !='severity'){
												htmlAutoParam += '<span style="float:left; width:200px;">' + key + '</span>';
												htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
											}
										}else if(autoProvd == 'blueprism'){
											if(key != 'processName'){
												htmlAutoParam += '<span style="float:left; width:200px;">' + key + '</span>';
												htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
											}
											$("#autoProcessContainer").show();
										}else if(autoProvd == 'IBMWorkloadAutomation'){
											if(key != 'ProcessName' && key != 'LibraryName'){
												htmlAutoParam += '<span style="float:left; width:200px;">' + key + '</span>';
												htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
											}
											//$("#autoProcessContainer").show();
											$('#autoParamContentWLA').html(htmlAutoParam);
										}
									});
									htmlAutoParam += '</td><td><a class="deleteParam disableamend" title="Delete Parameter" onclick="removeParamUpdate('+(j+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a><a class="editParam disableamend" title="Edit Parameter" onclick="editParamUpdate('+(j+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-edit"></span></a></td></tr>';
								}

								/*AutomationParam = AutomationInput[0].automationParam;
								var htmlAutoParam = '';
								if (typeof(AutomationParam) != 'undefined' || AutomationParam != null){
									var i = 0;
									$.each(AutomationParam, function(key, value){							
										if(key != ''){
											htmlAutoParam += '<div class="col-sm-4" style="float:left; font-weight:bold;"><input type="text" id="paramNameUP'+i+'" class="paramNMS" disabled value="' + key + '" /></div>';
											htmlAutoParam += '<div class="col-sm-8"><input type="text" id="paramValUP'+i+'" class="paramVALS" disabled value="' + value + '" /></div><br /><br />';
										}
										sopAutomationParam = i + 1;
										i = i + 1;
									});
								}*/
							}else{
								htmlAutoParam = '';
							}
						}
						
						if(autoProvd == 'IPSoft'){
							$('#paramListUp').html(htmlAutoParam);
							$('#appParamTableUp').show();
							$('#PDFipSoftParamInfo').html(htmlAutoParam);
						}else if(autoProvd == 'blueprism'){
							$('#paramListUpB').html(htmlAutoParam);
							$('#appParamTableUpB').show();
						}
						var taskExec = c[0].TaskExecutionFlows;
						TaskExecutionFlowID = taskExec.TaskExecutionFlowID;
						//var SopJobEvents = c[0].SopJobEvents;
						if (ExecuteAutomation != 'RT'){
							var sopJobName = data.SopJobEvents.jobName;
							var sopJobDetails = data.SopJobEvents.jobDetails;
							var sopCronExpr = data.SopJobEvents.cronExpression;
							//var sopCronExpr = cronParser(data.SopJobEvents.cronExpression);
							var sopTimeZone = data.SopJobEvents.timeZone;
							var sopactive = data.SopJobEvents.active;
							sopalertId = data.SopJobEvents.alertId;
							sop_id = data.SopJobEvents._id;
						}else{
							var sopCronExpr = null; 
						}
						var amtaskOwner = new Array();
						var amtaskName = new Array();
						var amtaskDesc = new Array();
						var amtaskExecution = new Array();
						var amtaskExeOrder = new Array();
						var amtaskDuration = new Array();
						var amtaskFileNm = new Array();
						for(var j = 0; j<taskExec.length; j++){					
							taskMaster = taskExec[0].TaskMasters;
							for(var k = 0; k<taskMaster.length; k++){
								amtaskOwner[k] = taskMaster[k].TaskOwner;
								amtaskName[k] = taskMaster[k].TaskName;
								amtaskDesc[k] = taskMaster[k].TaskShortDesc;
								amtaskExecution[k] = taskMaster[k].TaskExecutionType;
								amtaskExeOrder[k] = taskMaster[k].TaskExecutionOrder;
								amtaskFileNm[k] = taskMaster[k].TaskFileName;
								//amtaskDuration[k] = taskMaster[k].TaskDuration;
							}
						}
					}
					}
					//var taskRTE = '<div name="taskdesc" style="display:none;" ng-model="createsop.taskdesc" text-angular="" class="ng-pristine ng-valid ng-isolate-scope ta-root ng-touched txtAngDiv"><div class="ta-toolbar btn-toolbar"><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H1</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H2</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H3</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">P</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">pre</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-quote-right"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-bold"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-italic"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-underline"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-list-ul"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-list-ol"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-repeat"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-undo"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-ban"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-left"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-center"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-right"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">Toggle HTML</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-picture-o"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-link"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-unlink"></i></button></div></div><div contenteditable="true" ng-model="text" ta-bind="text" ng-hide="showHtml" class="ng-pristine ng-untouched ng-valid ng-scope ng-isolate-scope ta-text ta-editor form-control"></div><textarea ng-model="html" ta-bind="html" ng-show="showHtml" class="ng-pristine ng-untouched ng-valid ng-scope ng-isolate-scope ta-html ta-editor form-control ng-hide"></textarea><input type="hidden" style="display: none;" name="taskdesc" value=""><br />Task Update Coments : <input type="text" ng-model="createsop.taskcomments" id="createsoptaskcomments" placeholder="Enter task update comment" required /></div>';
					
					if(sopType != 'C'){
					$('#taskAmendRecord').html('');
					for(var l=0; l<amtaskName.length; l++){
						if (typeof(amtaskExecution[l]) == 'undefined' || amtaskExecution[l] == null){
							amtaskExecution[l] = '';
						}
						var fileURL = '';
						if (typeof(amtaskFileNm[l]) == 'undefined' || amtaskFileNm[l] == null){
							fileURL = 'NO FILE AVAILABLE'
						}else{
							fileURL = '<a href="https://swarnasetu.mybluemix.net/rest/v1/sopmeta/download?fileName='+amtaskFileNm[l]+'" alt="Download File">Download</a>';
						}
						
						$('#taskAmendRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td>'+amtaskName[l]+'</td><td id="taskDesc'+l+'">'+amtaskDesc[l]+'</td><td><input type="button" class="form-control editDesc disableamend"  value="Edit Description" disabled="disabled"/><td>'+amtaskOwner[l]+'</td><td>'+amtaskExecution[l]+'</td><td style="text-align:center;" align="center"><a href="javascript:void(0)" ng-click="editTask();" class="editTask disableamend" title="Edit Task"><span class="glyphicon glyphicon-edit" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="saveTask" ng-click="saveTask();" style="display:none;" title="Save Task"><span class="glyphicon glyphicon-floppy-disk" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="deleteTask disableamend" title="Delete Task"><span class="glyphicon glyphicon-remove-sign" style="font-size:20px;"></span></a></td></tr>');
						$('#taskPdfRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td style="word-wrap:break-word;">'+amtaskName[l]+'</td><td>'+amtaskDesc[l]+'</td></tr>');
						taskExeArray.push(amtaskExeOrder[l]);
					}
					}
					alertId = data._id;				
					$('#accountSelOps').attr("disabled","disabled") ;
					$('#alertname').val(data.alertName).attr("disabled","disabled") ;
					$('#alertdescription').val(data.alertShortDesc).attr("disabled","disabled") ;
					$('#automationid').val(autoId).attr("disabled","disabled") ;
					$('#alerttype').val(data.alertType).attr("disabled","disabled");
					$('#alertseverity').val(data.alertSeverity).attr("disabled","disabled");
					$('#sopdescription').val(SOPDesc).attr("disabled","disabled");
					$('#soppurpose').val(SOPPurpose).attr("disabled","disabled");
					$('#sopclassification').val(SOPClassification).attr("disabled","disabled");	
					$('#sopexpectedinput').val(SOPExpectedInput).attr("disabled","disabled");	
					$('#sopexpectedoutput').val(SOPExpectedOutput).attr("disabled","disabled");		
					$('#sopname').val(SOPName).attr("disabled","disabled");	
					$("#selectProviderValueUp").html("<option>"+autoProvd+"</option>").attr("disabled","disabled");	
					if(activeMode == 'n'){
						$('#toggle_event_editing button').eq(0).addClass('locked_active btn-info disabled').removeClass('locked_inactive btn-default');
						$('#toggle_event_editing button').eq(1).addClass('unlocked_inactive btn-default disabled').removeClass('unlocked_active btn-info');
					}else{
						$('#toggle_event_editing button').eq(0).removeClass('locked_active btn-info').addClass('locked_inactive btn-default disabled');
						$('#toggle_event_editing button').eq(1).removeClass('unlocked_inactive btn-default').addClass('unlocked_active btn-info disabled');
					}
					/*$.each(AutomationInput[j], function(key, value){
						if(autoProvd == 'blueprism'){
							if(key != 'processName'){
								htmlAutoParam += '<span style="float:left; width:200px;">' + key + '</span>';
								htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
							}
							$("#autoProcessContainer").show();
						}else{
							$("#autoProcessContainer").hide();
						}
					});*/
					$('#automationuserIdup').val(userID).attr("disabled","disabled");	
					$('#automationpassword').val(passD).attr("disabled","disabled");
					
					if(sopCronExpr != null){
						$("#scheduleAutoContainerUp").show();
						$('#sopjobnmu').val(sopJobName).attr("disabled","disabled");
						$('#scheduledetailsu').val(sopJobDetails).attr("disabled","disabled");						
						$('#triggerOnValu').val(sopCronExpr).attr("disabled","disabled");
						 for(var i = 0; i<timezone.length; i++){
			            	 $('#createTimeZoneu').append('<option value="'+timezone[i]+'">'+timezone[i]+'</option>');
			             }
						$("#createTimeZoneu option[value='"+sopTimeZone+"']").attr("selected","selected");	
						$('#createTimeZoneu').attr("disabled","disabled");	
						if(sopactive != 'NOT Available'){
							$("input[name=timeZoneu][value=" + sopactive + "]").attr('checked', 'checked');
						}
						$("input[name=executeAutomationu][value=scheduled]").attr('checked', 'checked');
						$("#cronExpTool").hide();
					}else{
						$("#scheduleAutoContainerUp").hide();
						$("input[name=executeAutomationu][value=realTime]").attr('checked', 'checked');
					}
					$('#selectapplication').attr("disabled","disabled");
					$('#selectapplication').html('<option selected>'+data.applicationName+'</option>').attr("disabled","disabled") ;
					$('#amendData').removeClass('disableamend');
					$('#deletedata').removeClass('disableamend');
					$('#sopNameHeader').html(SOPName);				
					$('#clientNmAutoUp').html(data.clientName);
					$('#clientNmAutoResp').html(data.clientName);
					$('#PDFClientname').html(data.clientName);
					$('#PDFalertName').html(data.alertName);
					$('#PDFapplicationName').html(data.applicationName);					
					$('#accNmAutoUp').html(data.accountName);
					$('#accNmAutoResp').html(data.accountName);
					$('#PDFaccountName').html(data.accountName);
					$('#PDFApplication_Name').html(data.applicationName);
					$('#altickNm').html('Alert Name - ');
					$('#PDFAlert_Name').html(data.alertName);					
					$('#PDFAlertDescription').html(data.alertShortDesc);
					$('#PDFAlertType').html(data.alertType);
					$('#PDFSopName').html(SOPName);
					$('#PDFAlertSev').html(data.alertSeverity);
					if(sopType != 'C'){
					if (typeof(AutomationInput) != 'undefined' || AutomationInput != null){
						var pdfHtml = '';
						if(autoProvd == 'blueprism'){							
							if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
								$("#blueprismProcessNameu").val(AutomationInput[0].processName).attr("disabled","disabled");
							}
							//$("#blueAutoGenUp").html(html);
							$('#PDFAutoReqInfo').html(pdfHtml);
						}else if(autoProvd == 'IPSoft'){
							if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
								$("#ipsoftAutomationNameu").val(AutomationInput[0].automationName).attr("disabled","disabled");
								$("#ipsoftAutomationPathu").val(AutomationInput[0].automationPath).attr("disabled","disabled");								
								$("#ipsoftautomationDescriptionu").val(AutomationInput[0].automationDesc).attr("disabled","disabled");
								$("#ipsoftOSTypeu").val(AutomationInput[0].osType).attr("disabled","disabled");
								$('#ipsoftSeverityu').val(AutomationInput[0].severity).attr("disabled","disabled");
								$('#ipsoftAssGroupu').val(AutomationInput[0].assignedGroup).attr("disabled","disabled");
								$('#ipsoftTargetHostu').val(AutomationInput[0].targetHost).attr("disabled","disabled");
								$('#ipsoftTimeOutu').val(AutomationInput[0].timeOut).attr("disabled","disabled");
								pdfHtml += '<p><span style="font-size:120%;">Automation Name - </span><span>' + AutomationInput[0].automationName + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Automation Path - </span><span>' + AutomationInput[0].automationPath + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Automation Description - </span><span>' + AutomationInput[0].automationDesc + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">OS Type - </span><span>' + AutomationInput[0].osType + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Automation Severity - </span><span>' + AutomationInput[0].severity + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Assigned Group - </span><span>' + AutomationInput[0].assignedGroup + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Target Host - </span><span>' + AutomationInput[0].targetHost + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Time Out - </span><span>' + AutomationInput[0].timeOut + '</span></p>';
							}
							$('#PDFAutoReqInfo').html(pdfHtml);
						}else if(autoProvd == 'IBMWorkloadAutomation'){
							if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
								$("#workLoadProcess").val(AutomationInput[0].ProcessName).attr("disabled","disabled");
								$("#workLoadLib").val(AutomationInput[0].LibraryName).attr("disabled","disabled");
								pdfHtml += '<p><span style="font-size:120%;">Process Name - </span><span>' + AutomationInput[0].ProcessName + '</span></p>';
								pdfHtml += '<p><span style="font-size:120%;">Library Name - </span><span>' + AutomationInput[0].LibraryName + '</span></p>';
							}
							$('#PDFAutoReqInfo').html(pdfHtml);
						}
						
					}
				}
					//$('#blueAutoGen').html(JSON.parse(data.AutomationInput));
					//console.log("AutoinputData: "+JSON.parse(data.AutomationInput));
					
					var sopCratedOn;
			    	var updatedByUserId = data.updatedByUserId;
			    	var updateTimestamp = convertDate(data.updateTimestamp);
			    	 if (typeof(createdByUserIdSOP) == 'undefined' || createdByUserIdSOP == null){
			    		 createdByUserIdSOP = 'NOT Available';
			    	 }			    	
			    	 if (typeof(updatedByUserId) == 'undefined' || updatedByUserId == null){
			    		 updatedByUserId = 'NOT Available';
			    	 }
			    	 if (typeof(createTimestampSOP) == 'undefined' || createTimestampSOP == null){
			    		 createTimestampSOP = 'NOT Available';
			    	 }else{
			    		 sopCratedOn = convertDate(createTimestampSOP);
			    	 }
			    	 if (typeof(updateTimestamp) == 'undefined' || updateTimestamp == null){
			    		 updateTimestamp = 'NOT Available';
			    	 }
			    
			    	$('#PDFSOPCreatedBy').html('Created By:- '+createdByUserIdSOP); 
			    	$('#PDFSOPCrO').html('Created On:- '+sopCratedOn);
			    	$('#PDFSOPUpdtby').html('Last Updated By:- '+updatedByUserId);
			    	$('#PDFLstUpdOn').html('Last Updated On:-'+ updateTimestamp);
			    	$('#PDFSopDesc').html(SOPDesc);
			    	var pdfAcStat;
			    	if(activeMode == 'y'){
			    		pdfAcStat = "SOP active";
			    	}else{
			    		pdfAcStat = "SOP de-active";
			    	}
			    	$('#PDFSopActiveInactive').html(pdfAcStat);		
			    	$('#PDFSopPurpose').html(SOPPurpose);
			    	$('#PDFSopClassification').html(SOPClassification);
			    	$('#PDFSopExInput').html(SOPExpectedInput);
			    	$('#PDFSopExOutput').html(SOPExpectedOutput);
			    	$('#PDFSopAutoId').html(autoId);
			    	$('#PDFSopAutoProvider').html(autoProvd);
			    	var PDFAccUserId = localStorage.getItem("userID");
			    	$('#PDFAccUserId').html(PDFAccUserId);
			    	PDFSOPReportName = 'SOP for ' + data.alertName + ' for '+ data.applicationName + ' of '+ data.accountName;
			    	var d = new Date();
			 	    var month = d.getMonth()+1;
			 	    var mVal ="";
			 	    if(month == 1){mVal='JAN';}else if(month == 2){mVal = 'FEB';}else if(month == 3){mVal = 'MAR';}else if(month == 4){mVal = 'APR';}
			 	    else if(month == 5){mVal = 'MAY'}else if(month == 6){mVal = 'JUN'}else if(month == 7){mVal = 'JUL'}else if(month == 8){mVal = 'AUG'}
			 	    else if(month == 9){mVal = 'SEP'}else if(month == 10){mVal = 'OCT'}else if(month == 11){mVal = 'NOV'}else if(month == 12){mVal = 'DEC'}
			 	    var day = d.getDate();
			 	    var timeInMs = 	          
			 	    	((''+day).length<2 ? '0' : '') + day+ '-' + mVal + '-' +d.getFullYear() ;
			 	    $('#todayDate').html(timeInMs);
					$("#richTextEditorContainer").hide();
					$("#WaitAlertMsg").hide();
					alertRaiseTimeVal = data.alertRaisedTimeStamp;
					
					
				}else if(globalSOP == 'AlertTicket'){console.log("Started..");
					//$('#exportPDF').hide();
					var pdfTicketRow = '';
					pdfTicketRow = '<p style="font-size:120%; text-align:left;"><span>Assignee - </span><span id="PDFassigneeTicketUp"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Assignment Group - </span><span id="PDFassigneeGroupUp"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Priority - </span><span id="PDFticketPriorityDrpUp"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Status - </span><span id="PDFticketStatusDrpUp"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Raised On - </span><span id="PDFticketRaisedOnUp"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Requester - </span><span id="PDFTicketRequestor"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Cause - </span><span id="PDFTicketCause"></span><br /></p>';
					pdfTicketRow += '<p style="font-size:120%; text-align:left;"><span>Category - </span><span id="PDFTicketCategory"></span><br /></p>';
					$('#pdfTicketRow').html(pdfTicketRow);
					$('#scheduledCheckUp').hide();
					$('#ticketDetailsUp').show();
					$('#alertDetailsUp').hide();
					$('#tabAlertText').html(uiconfig.SOPEditortab4);
					$('#uitab1headingUp').html('Enter Ticket Details');
					var c = data.Tickets;
					$('#selectapplication').html('<option selected>'+c.applicationName+'</option>').attr("disabled","disabled") ;
					$('#createTicketNameUp').val(c.ticketKey);
					$('#requesterTicketUp').val(c.requester);
					$('#assigneeTicketUp').val(c.assignee);
					$('#assigneeGroupUp').val(c.asignmentGroup);
					$('#ticketTypeDrpUp').val(c.type);
					$('#ticketPriorityDrpUp').val(c.priority);
					$('#ticketDescTxtAreaUp').val(c.subject);				
					$('#ticketStatusDrpUp').val(c.status);
					$('#ticketRaisedOnUp').val(c.openedAt);
					$('#ticketCauseUp').val(c.cause);
					$('#ticketCategoryUp').val(c.category);
					$('#accNmAutoUp').html(c.accountName);
					$('#accNmAutoResp').html(c.accountName);
					$('#clientNmAutoUp').html(localStorage.getItem("clientName"));
					$('#clientNmAutoResp').html(localStorage.getItem("clientName"));
					console.log("Started1..");
					sopType = data.SOPs.SOPType;
					$("#sopname").val(data.SOPs.SOPName).attr("disabled","disabled");
					$('#sopdescription').val(data.SOPs.SOPShortDesc).attr("disabled","disabled");
					$('#soppurpose').val(data.SOPs.SOPPurpose).attr("disabled","disabled");
					$('#sopclassification').val(data.SOPs.Classification).attr("disabled","disabled");	
					$('#sopexpectedinput').val(data.SOPs.ExpectedInput).attr("disabled","disabled");	
					$('#sopexpectedoutput').val(data.SOPs.ExpectedOutput).attr("disabled","disabled");
					activeMode = data.SOPs.activeMode;
					currActiveStatus = activeMode;
					if(activeMode == 'n'){
						$('#toggle_event_editing button').eq(0).addClass('locked_active btn-info disabled').removeClass('locked_inactive btn-default');
						$('#toggle_event_editing button').eq(1).addClass('unlocked_inactive btn-default disabled').removeClass('unlocked_active btn-info');
					}else{
						$('#toggle_event_editing button').eq(0).removeClass('locked_active btn-info').addClass('locked_inactive btn-default disabled');
						$('#toggle_event_editing button').eq(1).removeClass('unlocked_inactive btn-default').addClass('unlocked_active btn-info disabled');
					}
					$('#amendData').removeClass('disableamend');
					$('#deletedata').removeClass('disableamend');
					$('#PDFApplication_Name').html(c.applicationName);
					$('#altickNm').html('Ticket ID - '); 
					$('#PDFAlert_Name').html(c.ticketKey);
					$('#PDFalertName').html(c.ticketKey);
					$('#PDFAlertDescription').html(c.subject);
					$('#PDFAlertType').html(c.type);
					$('#PDFSopName').html(data.SOPs.SOPName);
					$('#PDFAlertSev').html(c.type);
					$('#PDFassigneeTicketUp').html(c.assignee);
					$('#PDFassigneeGroupUp').html(c.asignmentGroup);
					$('#PDFticketPriorityDrpUp').html(c.priority);
					$('#PDFticketStatusDrpUp').html(c.status);
					$('#PDFticketRaisedOnUp').html(c.openedAt);
					$('#PDFTicketCause').html(c.cause);
					$('#PDFTicketCategory').html(c.category);				

					ticketId = c._id;
					SOPID = data.SOPs._id;
					ChoreographObj = data.ChoreographObj;
					choreographEvent = ChoreographObj;
					if(ChoreographObj != null){
						choreoPathArray = ChoreographObj.paths;
					}
					autoProvd = data.SOPs.AutomationProvider;
					automationProcessUp = data.SOPs.AutomationProcess;
					operationShortDesc = data.SOPs.operationShortDesc;
					ExecuteAutomation = data.SOPs.ExecuteAutomation;
					createdByUserIdSOP = data.SOPs.createdByUserId;
					createTimestampSOP = data.SOPs.createTimestamp;

					if(sopType == 'C'){
						$("input[name=sopTypeu][value=C]").attr('checked', 'checked').attr("disabled","disabled");
						$("input[name=sopTypeu][value=S]").attr("disabled","disabled");
						$('#autoProcessContainer').hide();
						$('#choreoReqInfou').show();
						$('#autoReqInfou').hide();
						$('#tabTickChoreo').show();
						$('#tabTickSimple').hide();
					}else{
						$('#tabTickChoreo').hide();
						$('#tabTickSimple').show();
						$('#autoReqInfou').show();
						$("input[name=sopTypeu][value=S]").attr('checked', 'checked').attr("disabled","disabled");
						$("input[name=sopTypeu][value=C]").attr("disabled","disabled");
						$('#choreoReqInfou').hide();
						var AutomationOutput = data.SOPs.AutomationOutput;
						automataJSONobjRes = AutomationOutput;
						$("#outNmTpRowu").html('');
						if (typeof(AutomationOutput[0]) != 'undefined' || AutomationOutput[0] != null){
							for(var j = 0 ; j <AutomationOutput.length; j++){
								if(AutomationOutput[j] != null){
									var OutputType = AutomationOutput[j].OutputType;
									var OutputDescription = AutomationOutput[j].OutputDescription;
									var OutputName = AutomationOutput[j].OutputName;
									$("#outNmTpRowu").append('<tr id="outputParamRow'+j+'"><td>'+OutputName+'</td><td>'+OutputType+'</td><td>'+OutputDescription+'</td><td><a class="deleteOutResParam disableClass" title="Delete Parameter" onclick="removeOutputParamUpdate('+j+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a>&nbsp;<a class="editOutputParam disableamend" title="Edit Parameter" onclick="editOutputParamUpdate('+j+');" href="javascript:void(0)"><span class="glyphicon glyphicon-edit"></span></a></td></tr>');
							    }
							}
							$("#tabOutputParamu").show();
						}
						if (typeof(data.SOPs.AutomationInput) != 'undefined' || data.SOPs.AutomationInput != null){
							AutomationInput = data.SOPs.AutomationInput;
							ipsoftAutomationInput = AutomationInput;
							var htmlAutoParam = '';
							if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){							
									var i = 0;
									for(var j = 0 ; j <AutomationInput.length; j++){
										htmlAutoParam += '<tr><td>'+(j+1)+'</td><td>';
										$.each(AutomationInput[j], function(key, value){							
											if(autoProvd == 'IPSoft'){
												if(key != 'timeOut' && key != 'targetHost' && key != 'assignedGroup' && key != 'automationDesc' && key !='automationName' && key !='automationPath' && key != 'osType' && key !='severity'){
													htmlAutoParam += '<span style="float:left; width:200px;">' + key + '</span>';
													htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
												}
												$("#autoProcessContainer").hide();
											}else if(autoProvd == 'blueprism'){
													$("#blueprismProcessNameu").val(AutomationInput[0].processName).attr("disabled","disabled");
												if(key != 'processName'){
													htmlAutoParam += '<span style="float:left; width:200px;">' + key + '</span>';
													htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
												}
												$("#autoProcessContainer").show();
											}else if(autoProvd == 'IBMWorkloadAutomation'){
												if(key != 'ProcessName' && key != 'LibraryName'){
													htmlAutoParam += '<span style="float:left; width:200px;">' + key + '</span>';
													htmlAutoParam += '<span style="float:left; width:432px;">' + value + '</span>';
												}
												$("#autoProcessContainer").hide();
												$('#autoParamContentWLA').html(htmlAutoParam);
											}
										});
										htmlAutoParam += '</td><td><a class="deleteParam disableamend" title="Delete Parameter" onclick="removeParamUpdate('+(j+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a><a class="editParam disableamend" title="Edit Parameter" onclick="editParamUpdate('+(j+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-edit"></span></a></td></tr>';
									}
							}else{
								htmlAutoParam = '';
							}
						}
						$('#autoParamContent').html(htmlAutoParam);
						$('#PDFipSoftParamInfo').html(htmlAutoParam);
						console.log(sopType);
						if(autoProvd == 'IPSoft'){
							//$('#paramListUp').html(htmlAutoParam);
							//$('#appParamTableUp').show();
							//$('#PDFipSoftParamInfo').html(htmlAutoParam);
						}else if(autoProvd == 'blueprism'){
							$('#paramListUpB').html(htmlAutoParam);
							$('#appParamTableUpB').show();
						}
						$("input[name=sopTypeu][value=S]").attr('checked', 'checked');
						var taskExec = data.SOPs;
						//TaskExecutionFlowID = taskExec.TaskExecutionFlowID;
						//var SopJobEvents = c[0].SopJobEvents;
						/*if (ExecuteAutomation != 'RT'){
							var sopJobName = data.SopJobEvents.jobName;
							var sopJobDetails = data.SopJobEvents.jobDetails;
							var sopCronExpr = data.SopJobEvents.cronExpression;
							//var sopCronExpr = cronParser(data.SopJobEvents.cronExpression);
							var sopTimeZone = data.SopJobEvents.timeZone;
							var sopactive = data.SopJobEvents.active;
							sopalertId = data.SopJobEvents.alertId;
							sop_id = data.SopJobEvents._id;
						}else{
							var sopCronExpr = null; 
						}*/
						var amtaskOwner = new Array();
						var amtaskName = new Array();
						var amtaskDesc = new Array();
						var amtaskExecution = new Array();
						var amtaskExeOrder = new Array();
						var amtaskDuration = new Array();
						var amtaskFileNm = new Array();				
						taskMaster = taskExec.TaskMasters;
						for(var k = 0; k<taskMaster.length; k++){
							amtaskOwner[k] = taskMaster[k].TaskOwner;
							amtaskName[k] = taskMaster[k].TaskName;
							amtaskDesc[k] = taskMaster[k].TaskShortDesc;
							amtaskExecution[k] = taskMaster[k].TaskExecutionType;
							amtaskExeOrder[k] = taskMaster[k].TaskExecutionOrder;
							amtaskFileNm[k] = taskMaster[k].TaskFileName;
							//amtaskDuration[k] = taskMaster[k].TaskDuration;
						}

				
					//var taskRTE = '<div name="taskdesc" style="display:none;" ng-model="createsop.taskdesc" text-angular="" class="ng-pristine ng-valid ng-isolate-scope ta-root ng-touched txtAngDiv"><div class="ta-toolbar btn-toolbar"><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H1</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H2</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">H3</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">P</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">pre</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-quote-right"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-bold"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-italic"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-underline"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-list-ul"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-list-ol"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-repeat"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-undo"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-ban"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-left"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-center"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-align-right"></i></button></div><div class="btn-group"><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()">Toggle HTML</button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-picture-o"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-link"></i></button><button ng-class="displayActiveToolClass(active)" ng-click="action()" type="button" class="btn btn-default ng-scope" unselectable="on" ng-disabled="showHtml()"><i class="fa fa-unlink"></i></button></div></div><div contenteditable="true" ng-model="text" ta-bind="text" ng-hide="showHtml" class="ng-pristine ng-untouched ng-valid ng-scope ng-isolate-scope ta-text ta-editor form-control"></div><textarea ng-model="html" ta-bind="html" ng-show="showHtml" class="ng-pristine ng-untouched ng-valid ng-scope ng-isolate-scope ta-html ta-editor form-control ng-hide"></textarea><input type="hidden" style="display: none;" name="taskdesc" value=""><br />Task Update Coments : <input type="text" ng-model="createsop.taskcomments" id="createsoptaskcomments" placeholder="Enter task update comment" required /></div>';
					
					
						for(var l=0; l<amtaskName.length; l++){
							if (typeof(amtaskExecution[l]) == 'undefined' || amtaskExecution[l] == null){
								amtaskExecution[l] = '';
							}
							if (amtaskDesc[l] == 'Short description'){
								amtaskDesc[l] = 'Not Available';
							}
							
							var fileURL = '';
							if (typeof(amtaskFileNm[l]) == 'undefined' || amtaskFileNm[l] == null){
								fileURL = 'NO FILE AVAILABLE'
							}else{
								fileURL = '<a href="https://swarnasetu.mybluemix.net/rest/v1/sopmeta/download?fileName='+amtaskFileNm[l]+'" alt="Download File">Download</a>';
							}
							
							$('#taskAmendRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td>'+amtaskName[l]+'</td><td id="taskDesc'+l+'">'+amtaskDesc[l]+'</td><td><input type="button" class="form-control editDesc disableamend"  value="Edit Description" disabled="disabled"/><td>'+amtaskOwner[l]+'</td><td>'+amtaskExecution[l]+'</td><td style="text-align:center;" align="center"><a href="javascript:void(0)" ng-click="editTask();" class="editTask disableamend" title="Edit Task"><span class="glyphicon glyphicon-edit" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="saveTask" ng-click="saveTask();" style="display:none;" title="Save Task"><span class="glyphicon glyphicon-floppy-disk" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="deleteTask disableamend" title="Delete Task"><span class="glyphicon glyphicon-remove-sign" style="font-size:20px;"></span></a></td></tr>');
							$('#taskPdfRecord').append('<tr><td>'+amtaskExeOrder[l]+'</td><td style="word-wrap:break-word;">'+amtaskName[l]+'</td><td>'+amtaskDesc[l]+'</td></tr>');
							taskExeArray.push(amtaskExeOrder[l]);
						}
					
						if (typeof(AutomationInput) != 'undefined' || AutomationInput != null){
							var pdfHtml = '';
							if(autoProvd == 'IPSoft'){
								if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
									$("#ipsoftAutomationNameu").val(AutomationInput[0].automationName).attr("disabled","disabled");
									$("#ipsoftAutomationPathu").val(AutomationInput[0].automationPath).attr("disabled","disabled");
									$("#ipsoftautomationDescriptionu").val(AutomationInput[0].automationDesc).attr("disabled","disabled");
									$("#ipsoftOSTypeu").val(AutomationInput[0].osType).attr("disabled","disabled");
									$('#ipsoftSeverityu').val(AutomationInput[0].severity).attr("disabled","disabled");
									$('#ipsoftAssGroupu').val(AutomationInput[0].assignedGroup).attr("disabled","disabled");
									$('#ipsoftTargetHostu').val(AutomationInput[0].targetHost).attr("disabled","disabled");
									$('#ipsoftTimeOutu').val(AutomationInput[0].timeOut).attr("disabled","disabled");
									pdfHtml += '<p><span style="font-size:120%;">Automation Name - </span><span>' + AutomationInput[0].automationName + '</span></p>';
									pdfHtml += '<p><span style="font-size:120%;">Automation Path - </span><span>' + AutomationInput[0].automationPath + '</span></p>';
									pdfHtml += '<p><span style="font-size:120%;">Automation Description - </span><span>' + AutomationInput[0].automationDesc + '</span></p>';
									pdfHtml += '<p><span style="font-size:120%;">OS Type - </span><span>' + AutomationInput[0].osType + '</span></p>';
									pdfHtml += '<p><span style="font-size:120%;">Automation Severity - </span><span>' + AutomationInput[0].severity + '</span></p>';
									pdfHtml += '<p><span style="font-size:120%;">Assigned Group - </span><span>' + AutomationInput[0].assignedGroup + '</span></p>';
									pdfHtml += '<p><span style="font-size:120%;">Target Host - </span><span>' + AutomationInput[0].targetHost + '</span></p>';
									pdfHtml += '<p><span style="font-size:120%;">Time Out - </span><span>' + AutomationInput[0].timeOut + '</span></p>';
								}
							}else if(autoProvd == 'IBMWorkloadAutomation'){
								if (typeof(AutomationInput[0]) != 'undefined' || AutomationInput[0] != null){
									$("#workLoadProcess").val(AutomationInput[0].ProcessName).attr("disabled","disabled");
									$("#workLoadLib").val(AutomationInput[0].LibraryName).attr("disabled","disabled");
									pdfHtml += '<p><span style="font-size:120%;">Process Name - </span><span>' + AutomationInput[0].ProcessName + '</span></p>';
									pdfHtml += '<p><span style="font-size:120%;">Library Name - </span><span>' + AutomationInput[0].LibraryName + '</span></p>';
								}
							}else if(autoProvd == 'Workflow'){
	
							}
							
						}
						
						if(autoProvd == 'blueprism'){
							$("#selectProcessValueUp").val(automationProcessUp).attr("disabled","disabled");
							$('#autoReqInfo').show();
							$('#autoProvideRow').show();
							$('#autoProcessContainer').show();
						}else{
							$("#autoProcessContainer").hide();
						}
					}
										
					$("#selectProviderValueUp").html("<option>"+autoProvd+"</option>").attr("disabled","disabled");
					var sopCratedOn;
			    	var updatedByUserId = c.updatedByUserId;
			    	var updateTimestamp = convertDate(c.updateTimestamp);
			    	 if (typeof(createdByUserIdSOP) == 'undefined' || createdByUserIdSOP == null){
			    		 createdByUserIdSOP = 'NOT Available';
			    	 }			    	
			    	 if (typeof(updatedByUserId) == 'undefined' || updatedByUserId == null){
			    		 updatedByUserId = 'NOT Available';
			    	 }
			    	 if (typeof(createTimestampSOP) == 'undefined' || createTimestampSOP == null){
			    		 createTimestampSOP = 'NOT Available';
			    	 }else{
			    		 sopCratedOn = convertDate(createTimestampSOP);
			    	 }
			    	 if (typeof(updateTimestamp) == 'undefined' || updateTimestamp == null){
			    		 updateTimestamp = 'NOT Available';
			    	 }
			    
			    	$('#PDFSOPCreatedBy').html('Created By:- '+createdByUserIdSOP); 
			    	$('#PDFSOPCrO').html('Created On:- '+sopCratedOn);
			    	$('#PDFSOPUpdtby').html('Last Updated By:- '+updatedByUserId);
			    	$('#PDFLstUpdOn').html('Last Updated On:-'+ updateTimestamp);
			    	$('#PDFSopDesc').html(data.SOPs.SOPShortDesc);
			    	$('#PDFSopPurpose').html(data.SOPs.SOPPurpose);
			    	$('#PDFSopActiveInactive').html(data.SOPs.activeMode);			    	
			    	$('#PDFSopClassification').html(data.SOPs.SOPClassification);
			    	$('#PDFSopExInput').html(data.SOPs.SOPExpectedInput);
			    	$('#PDFSopExOutput').html(data.SOPs.SOPExpectedOutput);
			    	$('#PDFClientname').html(c.clientName);
					$('#PDFalertName').html(c.ticketKey);
					$('#PDFapplicationName').html(c.applicationName);					
					$('#PDFaccountName').html(c.accountName);
					$('#PDFTicketRequestor').html(c.requester);
					$('#PDFSopAutoId').html(data.SOPs.AutomationProcess);
					$('#PDFSopAutoProvider').html(data.SOPs.AutomationProvider);
					console.log("Started6..");
			    	//$('#PDFSopAutoId').html(autoId);
			    	//$('#PDFSopAutoProvider').html(autoProvd);
			    	var PDFAccUserId = localStorage.getItem("userID");
			    	$('#PDFAccUserId').html(PDFAccUserId);
			    	PDFSOPReportName = 'SOP for ' + c.ticketKey + ' for '+ c.applicationName + ' of '+ c.account;
			    	var d = new Date();
			 	    var month = d.getMonth()+1;
			 	    var mVal ="";
			 	    if(month == 1){mVal='JAN';}else if(month == 2){mVal = 'FEB';}else if(month == 3){mVal = 'MAR';}else if(month == 4){mVal = 'APR';}
			 	    else if(month == 5){mVal = 'MAY'}else if(month == 6){mVal = 'JUN'}else if(month == 7){mVal = 'JUL'}else if(month == 8){mVal = 'AUG'}
			 	    else if(month == 9){mVal = 'SEP'}else if(month == 10){mVal = 'OCT'}else if(month == 11){mVal = 'NOV'}else if(month == 12){mVal = 'DEC'}
			 	    var day = d.getDate();
			 	    var timeInMs = 	          
			 	    	((''+day).length<2 ? '0' : '') + day+ '-' + mVal + '-' +d.getFullYear() ;
			 	    $('#todayDate').html(timeInMs);
					$("#richTextEditorContainer").hide();
					$("#WaitAlertMsg").hide();
					
				}					
				});				
			}, 1000);
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			/*$http.get(GetSOPReport + '?alertId='+obj).success(function(data) {
				sopReportData = data.response;
			});*/
		}else{
				dialogAccess.dialog("open");
				return false;
		}
	};
});	
/* Controller for Search, Filter, Create and Update, Delete SOP */


/* Controller for Application Module Ends Here */

/*Controller for left nav application dropdown - Saumya Starts here*/
app.controller('leftSearchPannel', function ($scope, $http) {
	//firstAccountId = $("#accountSelOps").val();
	/*
	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	$http.get(GetApplicationListForAccount + '?accountId='+firstAccountId).success(function(data) { 
		var dataArray = data.response;
     	for (var i = 0; i < dataArray.length; i++){      		
     		$scope.applications = dataArray;
     	}    	
     });
	*/
	$scope.selectApplication = function(obj){
		//var aplNmCr = document.getElementById("leftSelAppl").selectedIndex;
	    currLeftApplId = $("#leftSelAppl option:selected").attr('value');
	}
});
/*Controller for left nav application dropdown - Saumya Ends here*/

/* Controller for Application Module */

app.controller("amaappformcontroller", function($location,$scope, $http) {
	
    $scope.createapp = {};
    $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	$http.get(GetAccountList).success(function(data) {    
		var dataAccountArr = data.response;
		console.log(dataAccountArr);
     	for (var i = 0; i < dataAccountArr.length; i++){      		
     		$scope.accounts = dataAccountArr;
     	}    	
    });  
	
	
	$scope.createapp.submitForm = function(item, event) {
	
	var submitApplicationCreate = true;
	var submitAccountName = $("#appAccountName option:selected").val();
	if($scope.createapp.date!=null){
		if(!isDate($scope.createapp.date)){
			submitApplicationCreate = false;
		}
	}
	if(submitAccountName == ''){
		submitApplicationCreate = false;
		alert("Please select Account Name")
	}
	if(submitApplicationCreate == true){

		console.log("Submitting form");
	 var dataObject =  {
							   "accountID": $scope.createapp.accountName, //"554b474ccd25122e003b1f00",
							   "applicationName":$scope.createapp.appname,
							   "applicationShortDesc":$scope.createapp.sdesc,
							   "applicationSupportLevel": $scope.createapp.supportlevel,
							   "applicationSupportStartDate":$scope.createapp.date,
							   "applicationTechStack":$scope.createapp.techstack,
							   "applicationAppServer":$scope.createapp.appserv,
							   "applicationInterfacingApps":$scope.createapp.iterfacingapp,
							   "Id": localStorage.getItem("_iduser"),
							   "type": localStorage.getItem("type")
						 };
	   					
	 $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
    var responsePromise = $http.post(CreateApplication, dataObject, {});
    responsePromise.success(function(dataFromServer, status, headers, config) {
       //console.log(dataFromServer.title);
     	
    	 $scope.createapp.message = 'New Application "' + $scope.createapp.appname + '" has been created!';
    	 setTimeout(function(){
	       $('#alterMessageBoxCreateUser').show();
	       if(dataFromServer.userMessage){
	    	   $('.updateMsg').html(dataFromServer.userMessage);    	 
	       }else {
	    	   $('.updateMsg').html($scope.createapp.message);    
	       }
      	 },200);

         $scope.createapp = angular.copy($scope.originForm); 
         $scope.createAPPForm.$setPristine();
         $location.path('/application');
         $http.get(GetApplicationList).success(function(data) { 
         	for (var i = 0; i < data.length; i++){      		
         		$scope.applications = data.response;
         		console.log("application data: "+data.response);
         	}
         	
         }); 
         //window.location.href="#application";
     	/*$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
    	$http.get(GetUserAccess + '?userID='+localStorage.getItem("userID")).success(function(data) {  
    		var dataArray = data.response;
    		var accountArray = dataArray.account;  		
    		firstApplicationList.push(accountArray[0].applicationList);		
         	var applArray = firstApplicationList[0];
         	$('#leftSelAppl').html('<option value="" disabled="">Select Application</option>');
         	for (var j = 0; j < applArray.length; j++){   
         		$('#leftSelAppl').append("<option value='"+applArray[j].applicationId+"'>"+applArray[j].applicationName+"</option>");
         	}
         }); */  
    });
     responsePromise.error(function(dataFromServer, status, headers, config) {
    	// alert(data.message);
 		
	    	$('#messageBoxError').show();
		       if(dataFromServer.userMessage){
		    	   $('.errorAdminMsg').html(dataFromServer.userMessage);    	 
		       }else {	    	
	    	$('.errorAdminMsg').html(dataFromServer.internalMessage);  //$('.errorAdminMsg').html(dataFromServer.userMessage);
		       }
		       
		       
		       $('#createappname').val('')
		 		$('#createappname').focus();		       
     	// return false;
       console.log("Submitting form failed! Error : " + data.message);
    });

	}else if(!isDate($scope.createapp.date)){
		
		$("#badDatepicker").html(" Invalid Date");
		
	}
  };
  
  $scope.originForm = angular.copy($scope.createsop);
  
  $scope.goToAppList = function() {
      $location.path('/application');
  };  
  
  
});



/*app.controller('DatepickerCtrl', function ($scope) {
	  $scope.today = function() {
	    $scope.dt = new Date();
	  };
	  $scope.today();
	  $scope.clear = function () {
	    $scope.dt = null;
	  };
	  // Disable weekend selection
	  $scope.disabled = function(date, mode) {
	    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
	  };

	  $scope.toggleMin = function() {
	    $scope.minDate = $scope.minDate ? null : new Date();
	  };
	  $scope.toggleMin();

	  $scope.open = function($event) {
	    $event.preventDefault();
	    $event.stopPropagation();

	    $scope.opened = true;
	  };

	  $scope.dateOptions = {
	    formatYear: 'yy',
	    startingDay: 1
	  };

	  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
	  $scope.format = $scope.formats[0];
});*/



/* Controller for Client Module */

app.controller("amaClientformcontroller", function($location,$scope, $http) {
	
    $scope.createClient = {};	
	
/*    $scope.createClient.checkDuplicateClients = function(item, event) {
    	var currClientVal = $('#createClientname').val();
    	
    	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
    	$http.get(GetAccountList).success(function(data) { 
   			console.log(data);	     			
	     	var savedClientName = data.response;
	     	setTimeout(function(){
		   		var checkCurrentClient = savedClientName.indexOf(currClientVal);
				if(checkCurrentClient >=0){
					dialogDupClient.dialog("open");
					//alert('Client name already exsits');
					$('#createClientName').val('')
					$('#createClientName').focus();
					return false;
				}
	     	}, 200);
	    });
    }*/
	$scope.createClient.submitForm = function(item, event) {
	console.log("Submitting form");		
	 var dataObject =  {							  
							   "clientName":$scope.createClient.ClientName,
							   "clientID":$scope.createClient.ClientCode,
							   "clientShortDescription" :$scope.createClient.clientDescription
							   
						 };//"clientShortDescription": $scope.createClient.ShortDescription
	   						
	 $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
    var responsePromise = $http.post(CreateClient, dataObject, {});
    responsePromise.success(function(dataFromServer, status, headers, config) {
       //console.log(dataFromServer.title);
    	
    	 $scope.message = 'New Client "' + $scope.createClient.ClientName + '" has been created!';
         $scope.createClient = angular.copy($scope.originForm); 
         $scope.createClientForm.$setPristine();
	       $('#alterMessageBoxCreateUser').show();
	       if(dataFromServer.userMessage){
	    	   $('.updateMsg').html(dataFromServer.userMessage);    	 
	       }else {
	    	   $('.updateMsg').html($scope.message);    
	       }         
         $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
         $http.get(GetAllClients).success(function(data) { 
         	for (var i = 0; i < data.response.length; i++){      		
         		$scope.createClient = data.response;
         	}
         	
         }); 
         //window.location.href="#application";
         $location.path('/clients');
    });
     responsePromise.error(function(dataFromServer, status, headers, config) {
    	// alert(data.message);
	    	$('#messageBoxError').show();
		       if(dataFromServer.userMessage){
		    	   $('.errorAdminMsg').html(dataFromServer.userMessage);    	 
		       }else {	    	
	    	$('.errorAdminMsg').html(dataFromServer.internalMessage);  //$('.errorAdminMsg').html(dataFromServer.userMessage);
		       }
		       
		$('#createClientName').val('')
		$('#createClientName').focus();
    	 return false;
       console.log("Submitting form failed!");
    });
  };
  $scope.originForm = angular.copy($scope.createClient);
  
  $scope.goToClients = function() {
      $location.path('/clients');
  };  
});


/* Controller for Account Module */

app.controller("amaAccountformcontroller", function($location,$scope, $http) {
	
    $scope.createAccounts = {};
    $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	$http.get(GetAllClients).success(function(data) {    
		var dataClientArr = data.response;
		console.log(dataClientArr);
     	for (var i = 0; i < dataClientArr.length; i++){      		
     		$scope.clients = dataClientArr;
     	}    	
    });    
    
	$scope.createAccounts.submitForm = function(item, event) {
	console.log("Submitting form");		
	 var dataObject =  {

				   "clientName": $scope.createAccounts.clientName,
				   "accountName": $scope.createAccounts.accountName,
				   "accountOwningCompany": $scope.createAccounts.company,
				   "Id": localStorage.getItem("_iduser"),
				   "type": localStorage.getItem("type"),
				   "WorkflowAutomationUserId": "",
				   "WorkflowAutomationPassword": "",
				   "updatedByUserId": "",
				   "updateComment": ""
			 };
/*

			   "WorkflowAutomationUserId":$scope.createAccounts.WorkflowAutomationUserId,
			   "WorkflowAutomationPassword":$scope.createAccounts.WorkflowAutomationPassword,
*/	   						
$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
    var responsePromise = $http.post(CreateAccount, dataObject, {});
    responsePromise.success(function(dataFromServer, status, headers, config) {
        //console.log(dataFromServer.title);
     	setTimeout(function(){ 
     	$scope.message = 'New Account "' + $scope.createAccounts.accountName + '" has been created!';

	       $('#alterMessageBoxCreateUser').show();
	       if(dataFromServer.userMessage){
	    	   $('.updateMsg').html(dataFromServer.userMessage);    	 
	       }else {
	    	   $('.updateMsg').html($scope.message);    
	       }
          $scope.createAccounts = angular.copy($scope.originForm); 
          $scope.createAccountForm.$setPristine();
          
          $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
          $http.get(GetApplicationList).success(function(data) { 
          	for (var i = 0; i < data.length; i++){      		
          		$scope.applications = data.response;
          	}
          });
          },200); 
     	
    	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
    	$http.get(GetUserAccess + '?userID='+localStorage.getItem("userID")).success(function(data) { 
    	//$http.get(GetUserAccess + '?userID=sauser').success(function(data) { 
    		$('#accountSelOps').html('');
    		var dataArray = data.response;
    		var accountArray = dataArray.account;  		
    		firstApplicationList.push(accountArray[0].applicationList);
         	for (var i = 0; i < accountArray.length; i++){  
         		if(typeof (accountArray[i].accountName) == 'undefined'){ accountArray[i].accountName = 'Not Defined'}
         		$('#accountSelOps').append("<option value='"+accountArray[i].accountId+"'>"+accountArray[i].accountName+"</option>");
         		firstAccountId = accountArray[0].accountId;
         		
         	} 
         	$("#accountSelOps option[value='"+firstAccountId+"']").attr("selected","selected");
         	//console.log(firstApplicationList);
         	$('#leftSelAppl').html('');
         	var applArray = firstApplicationList[0];
         	if(typeof (applArray) != 'undefined'){
	         	for (var j = 0; j < applArray.length; j++){   
	         		$('#leftSelAppl').append("<option value='"+applArray[j].applicationId+"'>"+applArray[j].applicationName+"</option>");
	         	}
    		}
         });
          //window.location.href="#application";
          $location.path('/account');
     });
      responsePromise.error(function(dataFromServer, status, headers, config) {
     	 //alert(data.message);
	    	$('#messageBoxError').show();
		       if(dataFromServer.userMessage){
		    	   $('.errorAdminMsg').html(dataFromServer.userMessage);    	 
		       }else {	    	
	    	$('.errorAdminMsg').html(dataFromServer.internalMessage);  //$('.errorAdminMsg').html(dataFromServer.userMessage);
		       } 	
		 		/*$('#createappname').val('')
		 		$('#createappname').focus();*/
		       
//     	var accountCreateErrorDialog =  $('<div>'+data.message+'</div>').dialog({
/*    	 		 closeOnEscape: false,
    	 		 autoOpen: true,
    	 		 modal: true,
    	 		 buttons: {
    	 		Close: function() {
    	 			 	$( this ).dialog( "close" );
    	 			 }
    	 		 }*/
/*			width:600,
			 closeOnEscape: true,
			 autoOpen: true,
			 modal: true,
			 open:function(){
					$(this).parent().find(".ui-dialog-titlebar-close").replaceWith('<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
					$(this).parent().find(".ui-dialog-titlebar-close").bind("click", function() {
						$(this).dialog("close");
					});
					$(this).parent().find(".ui-dialog-buttonset").children().addClass("btn btn-info");
				},
				buttons : {
					Close : function() {
						$(this).dialog("close");
					}
				}    		
    	 	});*/

    	//accountCreateErrorDialog.dialog("open");
			//alert('You could not create two different SOPs for same Alert');
			$('#createAccountname').val('')
			$('#createAccountname').focus();
			return false;
			console.log("Submitting form failed!" + data.message);
    });
  };
  $scope.originForm = angular.copy($scope.createAccounts);
  
  $scope.goToAccountList = function() {
      $location.path('/account');
  };  
});


/*Controller for application list page - Sandeep Start here*/
var currentAppId;

	app.controller('getapplist', function ($location, $scope, $http, $modal,$window){ 
		firstAccountId = $("#accountSelOps option:selected").val();	 			
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		$http.get(GetApplicationListForAccount + '?accountId='+firstAccountId).success(function(data) {
			//alert(data);
			$scope.receivedData = [];
			$scope.receivedData = data.response;
			  $scope.currentPage = 1;
			  $scope.numPerPage = 6;
			  $scope.maxSize = 5;		  
			  $scope.$watch('currentPage + numPerPage', function() {
			    var begin = (($scope.currentPage - 1) * $scope.numPerPage)
			    , end = begin + $scope.numPerPage;
			    $scope.applist = $scope.receivedData.slice(begin, end);
			  });
			  $('#leftSelAppl').html('<option value="" disabled="" selected="">Select Application</option>');
			  var currApplDataArray = data.response;
			  console.log(currApplDataArray.length);
			  for(var p = 0; p <= currApplDataArray.length - 1; p++){
				  $('#leftSelAppl').append("<option value='"+currApplDataArray[p].applicationId+"'>"+currApplDataArray[p].applicationName+"</option>");				  
			  }
		});
		$(document).on('change', '#accountSelOps', function(event) {		// newly added on 14th aug
			firstAccountId = $("#accountSelOps option:selected").val();// newly added on 14th aug
			var my_account = firstAccountId;
			//firstAccountId = '554b474ccd25122e003b1f00';
			//applicationUpdateUserId = 'sauser';
			//localStorage.setItem("accountID", my_account);
			console.log('firstAccountId in getapplist'+firstAccountId);
			console.log(my_account);
		    $scope.message = '';
			$scope.editapp={};
			// alert(firstAccountId);
			
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			$http.get(GetApplicationListForAccount + '?accountId='+firstAccountId).success(function(data) {
				$scope.receivedData = [];
				$scope.receivedData = data.response;
				  $scope.currentPage = 1;
				  $scope.numPerPage = 6;
				  $scope.maxSize = 5;			  
				  $scope.$watch('currentPage + numPerPage', function() {
				    var begin = (($scope.currentPage - 1) * $scope.numPerPage)
				    , end = begin + $scope.numPerPage;
				    $scope.applist = $scope.receivedData.slice(begin, end);
				  });	    
			});
		}); // newly added on 14th aug
	
	$scope.AppDataView = function(obj) {
		currentAppId = obj;
		
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		$http.get(GetApplication + '?applicationId='+currentAppId).success(function(data) { 
			$scope.appdetails = data.response;
			console.log("current apps: "+data.response);
		}); 
		
		dialogViewAapplication = $("#appDetails").dialog({
			width:1200,
			 closeOnEscape: false,
			 autoOpen: false,
			 modal: true,
			 open:function(){
					$(this).parent().find(".ui-dialog-titlebar-close").replaceWith('<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
					$(this).parent().find(".ui-dialog-titlebar-close").bind("click", function() {
						$("#appDetails").dialog("close");
					});
					$(this).parent().find(".ui-dialog-buttonset").children().addClass("btn btn-info");
				},
				buttons : {
					Close : function() {
						$(this).dialog("close");
					}
				}
		});

		dialogViewAapplication.dialog("open");		
		
		

	};
	$scope.AppDataDelete = function(obj) {
		var r = confirm("Are you sure to delete!");
		if (r == true) {
			firstAccountId = $("#accountSelOps option:selected").val();
			localStorage.setItem("firstAccountId", firstAccountId);
			currentAppId = obj;			
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			$http.delete(DeleteApplication + '?applicationId='+currentAppId).success(function(data) {
	  	    	console.log("Deletion successful!");
	  	    	$scope.message = "Deletion successful!";
	  	        //$location.path('/application');		
	  	        //$window.location.reload();
		        $location.path('/application');
		 		firstAccountId = $("#accountSelOps option:selected").val();	     	
		 		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		 		$http.get(GetApplicationListForAccount + '?accountId='+firstAccountId).success(function(data) {
		 			  $scope.receivedData = [];
		 			  $scope.receivedData = data.response;
		 			  $scope.currentPage = 1;
		 			  $scope.numPerPage = 6;
		 			  $scope.maxSize = 5;		  
		 			  $scope.$watch('currentPage + numPerPage', function() {
		 			    var begin = (($scope.currentPage - 1) * $scope.numPerPage)
		 			    , end = begin + $scope.numPerPage;
		 			    $scope.applist = $scope.receivedData.slice(begin, end);
		 			  });		 	    
		 		});
			});
		}
	};



		
		$scope.AppDataEdit = function(obj) {

			currentAppId = obj;
			
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			$http.get(GetApplication + '?applicationId='+currentAppId).success(function(data) { 
				$scope.appedit = data.response;
				$('appEditAccountName').val($scope.appedit.accountID);
				$('#appEditAccountName').attr("disabled","disabled");
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				$http.get(GetAccountList).success(function(data) {    
					var dataAccountArr = data.response;
					//console.log(dataAccountArr+'account list check');
			     	for (var i = 0; i < dataAccountArr.length; i++){  
			     		var editappaccountId = dataAccountArr[i]._id;
			     		var editappaccountName = dataAccountArr[i].accountName;			     		
			     		if($scope.appedit.accountID == editappaccountId){
				     		console.log('Acccount Id       '+editappaccountId);
				     		console.log('Application Name      '+editappaccountName);
				     		$('#editappaccname').html('<option selected="selected">'+editappaccountName+'</option>').attr("disabled","disabled") ;
				     	}
			     	}   	
			    });
				//$('#editappaccname').html('<option selected>'+editappaccountName+'</option>').attr("disabled","disabled") ;
				$('#editappname').val($scope.appedit.applicationName);
				$('#editappsdesc').val($scope.appedit.applicationShortDesc);
				$('#editappsupport').val($scope.appedit.applicationSupportLevel);//$('#editappsupport').val(($scope.appedit.applicationSupportLevel):| date:'medium');
				$('#editappdate').val($scope.appedit.applicationSupportStartDate);
				$('#editapptechstack').val($scope.appedit.applicationTechStack);
				$('#editappappserv').val($scope.appedit.applicationAppServer);
				$('#editappinterfacingapp').val($scope.appedit.applicationInterfacingApps);		
				toBePushedApplicationDetailsUpdateTimestamp = $scope.appedit.updateTimestamp;

			}); 

			//$scope.AppDataEdit = function(){
			dialogEditAapplication = $("#appEdit").dialog({
				width:1200,
				 closeOnEscape: false,
				 autoOpen: false,
				 modal: true,
				 open:function(){
						$(this).parent().find(".ui-dialog-titlebar-close").replaceWith('<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
						$(this).parent().find(".ui-dialog-titlebar-close").bind("click", function() {
							$("#appEdit").dialog("close");
						});
					}
			});
	
			dialogEditAapplication.dialog("open");
			$scope.saveApplication = function(item, event) {
				var accountID = firstAccountId; //localStorage.getItem("accountID");
				var applicationName = $('#editappname').val();
				var applicationShortDesc = $('#editappsdesc').val();
				var applicationSupportLevel = $('#editappsupport').val();
				var applicationSupportStartDate = $('#editappdate').val();
				var applicationTechStack = $('#editapptechstack').val();
				var applicationAppServer = $('#editappappserv').val();
				var applicationInterfacingApps = $('#editappinterfacingapp').val();
				var applicationUpdateUserId = localStorage.getItem("userID");
				var applicationUpdateComment = $('#editappcomment').val();
				/*$scope.editapp.checkDate=function(dateparam){
					if(applicationSupportStartDate !="") {
					
						if(!isDate(dateparam)){			
							$("#badDate").html(" Invalid Date");
						}			
					}
				}*/
				var submitApplicationUpdate = true;
				
				if(applicationSupportStartDate !=""){
					if(!isDate(applicationSupportStartDate)){
						submitApplicationUpdate = false;
					}
				}
					
				if(applicationName == ""){
					submitApplicationUpdate = false;

					//alert('applicationName'+applicationName+'->'+submitApplicationUpdate);
				}
				if(applicationUpdateComment == ""){
					submitApplicationUpdate = false;
					//alert('applicationUpdateComment'+applicationUpdateComment+'->'+submitApplicationUpdate);
				}
				// Defect - 201194, Owner - Radha M De
				if(applicationSupportStartDate == ""){
					submitApplicationUpdate = false;
					//alert('applicationUpdateComment'+applicationUpdateComment+'->'+submitApplicationUpdate);
				}

				if(submitApplicationUpdate == true){

					//$scope.createapp.submitForm = function(item, event) {
						//console.log("Submitting form");	//"554b474ccd25122e003b1f00",	
				 var dataObject =  {
										   "accountID": accountID, 
										   "applicationName": applicationName,
										   "applicationShortDesc": applicationShortDesc,
										   "applicationSupportLevel": applicationSupportLevel,
										   "applicationSupportStartDate": applicationSupportStartDate,
										   "applicationTechStack": applicationTechStack,
										   "applicationAppServer": applicationAppServer,
										   "applicationInterfacingApps": applicationInterfacingApps,
										   "updatedByUserId": applicationUpdateUserId,
										   "updateComment": applicationUpdateComment,
										   "updateTimestamp" :toBePushedApplicationDetailsUpdateTimestamp
								 };
						 

						 $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
						 var responsePromise = $http.put(UpdateApplication + "?applicationId="+currentAppId, dataObject, {});
						    responsePromise.success(function(dataFromServer, status, headers, config) {
						       //console.log(dataFromServer.title);
						    	 $scope.message = 'Application"' + applicationName + '" has been updated!'; //$scope.editapp.appname
						         $scope.editapp = angular.copy($scope.originForm); 
						         $scope.editAPPForm.$setPristine();
						         
							       $('#alterMessageBoxCreateUser').show();
							       if(dataFromServer.userMessage){
							    	   $('.updateMsg').html(dataFromServer.userMessage);    	 
							       }else {
							    	   $('.updateMsg').html($scope.message);    
							       } 
							 	   
						         $location.path('/application');
						         $window.location.reload();
						    });
						     responsePromise.error(function(dataFromServer, status, headers, config) {
							    	$('#messageBoxError').show();
								       if(dataFromServer.userMessage){
								    	   $('.errorAdminMsg').html(dataFromServer.userMessage);    	 
								       }else {	    	
							    	$('.errorAdminMsg').html(dataFromServer.internalMessage);  //$('.errorAdminMsg').html(dataFromServer.userMessage);
								       } 						    	 
						       console.log("Submitting form failed!");
						    });		
						     
						     $("#appEdit").dialog("close");
						
				}
				else if(!isDate(applicationSupportStartDate)){
					
					
						$("#badDate").html(" Invalid Date");
					
				}
					
			
			},
			$scope.cancelUpdate = function (){
				$("#appEdit").dialog("close");
			}


		};	
		
		
		$scope.saveApplOnEdit = function(item, event) {
			var accountID = firstAccountId; //localStorage.getItem("accountID");
			var applicationName = $('#editappname').val();
			var applicationShortDesc = $('#editappsdesc').val();
			var applicationSupportLevel = $('#editappsupport').val();
			var applicationSupportStartDate = $('#editappdate').val();
			var applicationTechStack = $('#editapptechstack').val();
			var applicationAppServer = $('#editappappserv').val();
			var applicationInterfacingApps = $('#editappinterfacingapp').val();
			var applicationUpdateUserId = localStorage.getItem("userID");
			var applicationUpdateComment = $('#editappcomment').val();
			/*$scope.editapp.checkDate=function(dateparam){
				if(applicationSupportStartDate !="") {
				
					if(!isDate(dateparam)){			
						$("#badDate").html(" Invalid Date");
					}			
				}
			}*/
			var submitApplicationUpdate = true;
			
			if(applicationSupportStartDate !=""){
				if(!isDate(applicationSupportStartDate)){
					submitApplicationUpdate = false;
				}
			}
				
			if(applicationName == ""){
				submitApplicationUpdate = false;

				//alert('applicationName'+applicationName+'->'+submitApplicationUpdate);
			}
			if(applicationUpdateComment == ""){
				submitApplicationUpdate = false;
				//alert('applicationUpdateComment'+applicationUpdateComment+'->'+submitApplicationUpdate);
			}
			if(submitApplicationUpdate == true){

				//$scope.createapp.submitForm = function(item, event) {
					//console.log("Submitting form");	//"554b474ccd25122e003b1f00",	
			 var dataObject =  {
									   "accountID": accountID, 
									   "applicationName": applicationName,
									   "applicationShortDesc": applicationShortDesc,
									   "applicationSupportLevel": applicationSupportLevel,
									   "applicationSupportStartDate": applicationSupportStartDate,
									   "applicationTechStack": applicationTechStack,
									   "applicationAppServer": applicationAppServer,
									   "applicationInterfacingApps": applicationInterfacingApps,
									   "updatedByUserId": applicationUpdateUserId,
									   "updateComment": applicationUpdateComment,
									   "updateTimestamp" :toBePushedApplicationDetailsUpdateTimestamp
							 };
					 

					 $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
					 var responsePromise = $http.put(UpdateApplication + "?applicationId="+currentAppId, dataObject, {});
					    responsePromise.success(function(dataFromServer, status, headers, config) {
					       //console.log(dataFromServer.title);
					    	 $scope.message = 'Application"' + applicationName + '" has been updated!'; //$scope.editapp.appname
					         $scope.editapp = angular.copy($scope.originForm); 
					         $scope.editAPPForm.$setPristine();
					         
						       $('#alterMessageBoxCreateUser').show();
						       if(dataFromServer.userMessage){
						    	   $('.updateMsg').html(dataFromServer.userMessage);    	 
						       }else {
						    	   $('.updateMsg').html($scope.message);    
						       } 
						 	   
					         $location.path('/application');
		firstAccountId = $("#accountSelOps option:selected").val();	     	
		//alert(firstAccountId);
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		$http.get(GetApplicationListForAccount + '?accountId='+firstAccountId).success(function(data) {
			//alert(data);
			$scope.receivedData = [];
			$scope.receivedData = data.response;
			  $scope.currentPage = 1;
			  $scope.numPerPage = 6;
			  $scope.maxSize = 5;		  
			  $scope.$watch('currentPage + numPerPage', function() {
			    var begin = (($scope.currentPage - 1) * $scope.numPerPage)
			    , end = begin + $scope.numPerPage;
			    $scope.applist = $scope.receivedData.slice(begin, end);
			  });
	    
		});							 
					         //$window.location.reload();
					    });
					     responsePromise.error(function(dataFromServer, status, headers, config) {
						    	$('#messageBoxError').show();
							       if(dataFromServer.userMessage){
							    	   $('.errorAdminMsg').html(dataFromServer.userMessage);    	 
							       }else {	    	
						    	$('.errorAdminMsg').html(dataFromServer.internalMessage);  //$('.errorAdminMsg').html(dataFromServer.userMessage);
							       } 						    	 
					       console.log("Submitting form failed!");
					    });		
					     
					     $("#appEdit").dialog("close");
					
			}
			else if(!isDate(applicationSupportStartDate)){
				
				
					$("#badDate").html(" Invalid Date");
				
			}
				
		
		};		
		
		$scope.cancelUpdateApp = function (){
			$("#appEdit").dialog("close");
		}
		
		$scope.goToAppList = function() {
		      $location.path('/application');
		};	

	  $scope.goToAppCreate = function() {
	      $location.path('/applicationCreate');
	  }; 


});  
	  /*Controller for application list page - Sandeep Ends here*/
	
	  /*Controller for client list page - Sandeep Starts here*/
	
	
	app.controller('getclientlist', function ($location, $scope, $http, $modal,$window){ 
		
	    $scope.message = '';
	    $scope.updateClient= {};
	        
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		$http.get(GetAllClients).success(function(data) { 
			$scope.receivedData = [];
			$scope.receivedData = data.response;
			  $scope.currentPage = 1;
			  $scope.numPerPage = 6;
			  $scope.maxSize = 5;

			  
			  $scope.$watch('currentPage + numPerPage', function() {
			    var begin = (($scope.currentPage - 1) * $scope.numPerPage)
			    , end = begin + $scope.numPerPage;
			    $scope.clientlist = $scope.receivedData.slice(begin, end);
			  });
	    
	 }); 
		
		
		$scope.ClientDataView = function(obj) {
			var currentClientId = obj;
			
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			$http.get(GetClient + '?Id='+currentClientId).success(function(data) { 
				$scope.clientdetails = data.response;
			}); 
			

			dialogViewClient = $("#clientDetails").dialog({
				width:1200,
				 closeOnEscape: false,
				 autoOpen: false,
				 modal: true,
				 open:function(){
						$(this).parent().find(".ui-dialog-titlebar-close").replaceWith('<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
						$(this).parent().find(".ui-dialog-titlebar-close").bind("click", function() {
							$("#clientDetails").dialog("close");
						});
						$(this).parent().find(".ui-dialog-buttonset").children().addClass("btn btn-info");
					},
					buttons : {
						Close : function() {
							$(this).dialog("close");
						}
					}
			});

			dialogViewClient.dialog("open");
			
			

		};
		$scope.ClientDataDelete = function(obj) {
			var r = confirm("Are you sure to delete!");
			if (r == true) {
				var currentClientId = obj;
				
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				$http.delete(DeleteClient + '?Id='+currentClientId).success(function(data) {
		  	    	console.log("Deletion successful!");
		  	    	$scope.message = "Deletion successful!";
		  	    	
				       $('#alterMessageBoxCreateUser').show();
				 	   $('.updateMsg').html(data.userMessage);
				 	   
				      $location.path('/clients');		
			  	      $window.location.reload();		
				});

			}
		};
		
		$scope.ClientDataEdit = function(obj) {
			var currentClientId = obj;
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			$http.get(GetClient + '?Id='+currentClientId).success(function(data) { 
				$scope.clientdetails = data.response;
				
				
				
				$('#updateClientName').val($scope.clientdetails.clientName);
				$('#updateClientDescription').val($scope.clientdetails.clientShortDescription);
				$('#updateClientCode').val($scope.clientdetails.clientID);
				toBePushClientDetailsUpdateTimestamp = $scope.clientdetails.updateTimestamp;
				
				
			}); 

			dialogEditClient = $("#clientEdit").dialog({
				width:1200,
				 closeOnEscape: false,
				 autoOpen: false,
				 modal: true,
				 open:function(){
						$(this).parent().find(".ui-dialog-titlebar-close").replaceWith('<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
						$(this).parent().find(".ui-dialog-titlebar-close").bind("click", function() {
							$("#clientEdit").dialog("close");
						});
					}
			});

			dialogEditClient.dialog("open"); // date 7th July
			
			
			$scope.updateClient.saveClient = function(item, event) {
				
				

				
				var updateClientName = $('#updateClientName').val();
				var clientShortDesc = $('#updateClientDescription').val();
				var clientCode = $('#updateClientCode').val();
				var updateClientUserId = localStorage.getItem("userID");
				var clientUpdateComment = $('#updateClientComment').val();
				
				
				var clientUpdateFormSubmission = true;
				
				if(clientUpdateComment == ""){
					clientUpdateFormSubmission = false;
				}			
				
				if(clientUpdateFormSubmission == true){
					
				 var dataObject =  {							  
										   "clientName": updateClientName,
										   "clientID": clientCode,
										   "clientShortDescription" : clientShortDesc,
										   "updatedByUserId": updateClientUserId,
										   "updateComment": clientUpdateComment,
										   "updateTimestamp": toBePushClientDetailsUpdateTimestamp
									 };			
		
			 var responsePromise = $http.put(UpdateClient + "?Id="+currentClientId, dataObject, {});
			    responsePromise.success(function(dataFromServer, status, headers, config) {
			       //console.log(dataFromServer.title);
			    	 $scope.message = 'Client"' + updateClientName + '" has been updated!'; //$scope.editapp.appname
				       $('#alterMessageBoxCreateUser').show();
				 	   $('.updateMsg').html(dataFromServer.userMessage);
			    	 
			    	 $scope.updateClient = angular.copy($scope.originForm); 
			         $scope.updateClientForm.$setPristine();

			         //window.location.href="#application";
			         $location.path('/clients');
			         $window.location.reload();
			    });
			     responsePromise.error(function(dataFromServer, status, headers, config) {
/*				$scope.message = 'Client " ' + updateClientName + '  " : ' + data.message;
				alert('Client   " ' + updateClientName + ' "   : ' + data.message);	*/
		    	$('#messageBoxError').show();
			       if(dataFromServer.userMessage){
			    	   $('.errorAdminMsg').html(dataFromServer.userMessage);    	 
			       }else {	    	
		    	$('.errorAdminMsg').html(dataFromServer.internalMessage);  //$('.errorAdminMsg').html(dataFromServer.userMessage);
			       } 					
			       console.log("Submitting form failed!");
			    });		
			     
			     $("#clientEdit").dialog("close");		
			     
			}
		}
		
		
		$scope.updateClient.cancelClient = function(){
			
		     $("#clientEdit").dialog("close");	
			
		}
		
		
		
		
		
		
		
		};
		
		
		
		
		
		
		$scope.goToClientList = function() {
		      $location.path('/clients');	
		};		

		 $scope.goToCreateClient = function() {
			      $location.path('/clientCreate');	
		 };  

	}); 

	  /*Controller for client list page - Sandeep Ends here*/	
	
	/* get function called from the getacclist controller starts */
/*	function get(offset,limit,data){
		var showData = data.slice(offset,offset+limit);
		return data.slice(offset,offset+limit);
	}*/
	/* get function called from the controller ends */
	
	
	/* getacclist controller block starts */

	
	  /*Controller for account list page - Sandeep Starts here*/
	
	app.controller('getacclist', function ($location, $scope, $http, $modal, $window){ 

	    $scope.message = '';
		$scope.updateAccount = {};
		var currentAccountId ='';

		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		$http.get(GetAccountList).success(function(data) { 
			$scope.receivedData = [];
			$scope.receivedData = data.response;
			  $scope.currentPage = 1;
			  $scope.numPerPage = 6;
			  $scope.maxSize = 5;

			  
			  $scope.$watch('currentPage + numPerPage', function() {
			    var begin = (($scope.currentPage - 1) * $scope.numPerPage)
			    , end = begin + $scope.numPerPage;
			    $scope.acclist = $scope.receivedData.slice(begin, end);
			  });
/*			  $scope.noOfPages = Math.ceil($scope.receivedData.length / $scope.numPerPage);

			  
			  $scope.setPage = function () {
				  $scope.acclist = get(($scope.currentPage - 1) * $scope.numPerPage, $scope.numPerPage, $scope.receivedData);
			  };
			 
			  $scope.$watch( 'currentPage', $scope.setPage );	*/		  

		}); 
		
		$scope.AccountDataView = function(obj) {
			var currentAccountId = obj;
			
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			$http.get(GetAccount + '?accountId='+currentAccountId).success(function(data) { 
				$scope.accountdetails = data.response;
			});			

			dialogViewAccount = $("#accountDetails").dialog({
				width:1200,
				 closeOnEscape: false,
				 autoOpen: false,
				 modal: true,
				 open:function(){
						$(this).parent().find(".ui-dialog-titlebar-close").replaceWith('<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
						$(this).parent().find(".ui-dialog-titlebar-close").bind("click", function() {
							$("#accountDetails").dialog("close");
						});
						$(this).parent().find(".ui-dialog-buttonset").children().addClass("btn btn-info");
					},
					buttons : {
						Close : function() {
							$(this).dialog("close");
						}
					}
			});

			dialogViewAccount.dialog("open"); 
			
			

		};
		
		
		$scope.AccountDataDelete = function(obj) {
			var r = confirm("Are you sure to delete! You need to delete all application associated with this account.");
			if (r == true) {
				currentAccountId = obj;
				$http.get(GetApplicationListForAccount + '?accountId='+currentAccountId).success(function(data) {
						if(data.response.length != 0){
							$('#waitAlertContainer').show();
							$('#waitContainer').show();
							$('#showApplicationList').show();
							var applicationResp = data.response;
							$('#applListData').html('');
							for (var k = 0; k < applicationResp.length; k++){  
								$('#applListData').append('<div style="border-bottom: 1px solid #bce8f1; padding:10px;">&nbsp;&nbsp;<input type="radio" class="deleteInputCheck" name="applicationRadio" value="'+applicationResp[k]._id+'" />&nbsp;&nbsp;&nbsp;&nbsp;<span style="font:12px verdana;">'+applicationResp[k].applicationName+'</span>&nbsp;&nbsp;&nbsp;&nbsp;</div>');				
							}
						}else{
							alert('No Application associated with this Account. Hence deleting the Account');
							$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
							$http.delete(DeleteAccount + '?accountId='+currentAccountId).success(function(data) {
					  	    	console.log("Account Deletion successful!");
					  	    	$scope.message = "Deletion successful!";
							    $('#alterMessageBoxCreateUser').show();
							 	$('.updateMsg').html(data.userMessage);
							 	$('#showApplicationList').hide(); 
							 	$('#waitAlertContainer').hide();
						        $location.path('/account');
						        $window.location.reload();	
							});
						}
				});
				
				
			/*	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				$http.delete(DeleteAccount + '?accountId='+currentAccountId).success(function(data) {
		  	    	console.log("Deletion successful!");
		  	    	$scope.message = "Deletion successful!";
				       $('#alterMessageBoxCreateUser').show();
				 	   $('.updateMsg').html(data.userMessage);
			         $location.path('/account');
			         $window.location.reload();		
				});
                      */
			}
		};
		 
		
		
		$scope.AccountDataEdit = function(obj) {
		var currentAccountId = obj;
		

		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		$http.get(GetAccount + '?accountId='+currentAccountId).success(function(data) { 
			$scope.accountdetails = data.response;
		$('#updateAccountClientName').html('<option selected>'+$scope.accountdetails.clientName+'</option>').attr("disabled","disabled") ;
		//$('#updateAccountClientName').val($scope.accountdetails.clientName);
		$('#updateAccountName').val($scope.accountdetails.accountName);
		$('#updateAccountCompany').val($scope.accountdetails.accountOwningCompany);
		toBePushedAccountDetailsUpdateTimestamp = $scope.accountdetails.updateTimestamp;
		});			
		

		dialogEditAccount = $("#accountEdit").dialog({
			 width:1200,
			 closeOnEscape: false,
			 autoOpen: false,
			 modal: true,
			 open:function(){
					$(this).parent().find(".ui-dialog-titlebar-close").replaceWith('<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
					$(this).parent().find(".ui-dialog-titlebar-close").bind("click", function() {
						$("#accountEdit").dialog("close");
					});
				}
		});

		dialogEditAccount.dialog("open"); // date 7th July

		$scope.updateAccount.saveAccount = function(item, event) {
			
			var updateAccountClientName = $('#updateAccountClientName').val();
			var updateAccountName = $('#updateAccountName').val();
			var updateAccountCompany = $('#updateAccountCompany').val();
			var updateAccountUserId = localStorage.getItem("userID");
			var updateAccountComment = $('#updateAccountComment').val();			
			
			
			var submitUpdateAccount = true;
			
			if(updateAccountComment == ""){
				submitUpdateAccount = false;
				console.log(updateAccountComment);
			}
			
			if(submitUpdateAccount == true){
				console.log(updateAccountClientName+'->'+updateAccountName+'->'+submitUpdateAccount);
				
			var clientName = $('#updateAccountClientName').val();
			var accountName = $('#updateAccountName').val();
			var accountOwningCompany = $('#updateAccountCompany').val();
			var updateAccountUserId =  localStorage.getItem("userID");
			var accountUpdateComment =  $('#updateAccountComment').val();
			var dataObject =  {
	   				   "clientName": updateAccountClientName,
					   "accountName": updateAccountName,
					   "accountOwningCompany": updateAccountCompany,
					   "WorkflowAutomationUserId":"",
					   "WorkflowAutomationPassword":"",
					   "updatedByUserId":  updateAccountUserId,
					   "updateComment": updateAccountComment,
					   "updateTimestamp": toBePushedAccountDetailsUpdateTimestamp

			 };

			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			var responsePromise = $http.put(UpdateAccount + "?accountId="+currentAccountId, dataObject, {});
			responsePromise.success(function(dataFromServer, status, headers, config) {
			//console.log(dataFromServer.title);
			 $scope.message = 'Account"' + updateAccountName + '" has been updated!'; //updateAccount.accountName

		       $('#alterMessageBoxCreateUser').show();
		 	   $('.updateMsg').html(dataFromServer.userMessage);
			 
			 $scope.updateAccount = angular.copy($scope.originForm); 
			 $scope.updateAccountForm.$setPristine();
			
			 //window.location.href="#application";
			 $location.path('/account');
			 $window.location.reload();
			});
			responsePromise.error(function(dataFromServer, status, headers, config) {
			//$scope.message = 'Account " ' + updateAccountName + '  " : ' + data.message;
			
			//alert('Account   " ' + updateAccountName + ' "   : ' + data.message);
	    	
	    	$('#messageBoxError').show();
		       if(dataFromServer.userMessage){
		    	   $('.errorAdminMsg').html(dataFromServer.userMessage);    	 
		       }else {	    	
	    	$('.errorAdminMsg').html(dataFromServer.internalMessage);  //$('.errorAdminMsg').html(dataFromServer.userMessage);
		       } 		
			
	    	console.log("Submitting form failed!");
			
			});		
			
			$("#accountEdit").dialog("close");
			
				}
			
			},
			$scope.updateAccount.cancelUpdate = function (){
			$("#accountEdit").dialog("close");
			}			
						
		};
		
		$scope.goToAccountList = function() {
		      $location.path('/account');
			
		};		
		
		  $scope.goToAccountCreate = function() {
		      $location.path('/accountCreate');
		  };  
		  $scope.deleteAppAsAcc = function() {
			  var applicationListArray;
			  $(".deleteInputCheck:checked").each(function() {
				  applicationListArray = this.value;
				  $(this).parent().addClass("clicked");
				});				
		      console.log(applicationListArray);
		      $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				$http.delete(DeleteApplication + '?applicationId='+applicationListArray).success(function(data) {
		  	    	console.log($('#applListData').children().length);
		  	    	$('.clicked').remove();
		  	    	if ( $('#applListData').children().length < 1 ) {
		  	    		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
						$http.delete(DeleteAccount + '?accountId='+currentAccountId).success(function(data) {
				  	    	console.log("Account Deletion successful!");
				  	    	$scope.message = "Deletion successful!";
						    $('#alterMessageBoxCreateUser').show();
						 	$('.updateMsg').html(data.userMessage);
						 	$('#showApplicationList').hide(); 
						 	$('#waitAlertContainer').hide();
					        $location.path('/account');
					        $window.location.reload();	
						});
		  	    	}
				});
		  }; 
	}); 

/*Function for Check Permission*/
	var flagCheckPM=false;	
	function checkPermission(permission,accessPanelVal){
		flagCheckPM=false;
		var userType = localStorage.getItem("type");
		if(userType != 'SuperAdmin'){
			var capabilitiesLS = localStorage.getItem("Capabilities");
			var capabilities = JSON.parse(capabilitiesLS);
			console.log('retrievedObject Capability Object: ', JSON.parse(capabilitiesLS));
			//var n=localStorage.getItem("Capabilities").length;
			for(var i=0; i<capabilities.length; i++)
			{	//console.log(capabilities[i].accessPanel+" : "+capabilities[i].capRegStr);
				if(capabilities[i].accessPanel==accessPanelVal)
				{
					var capList=capabilities[i].capRegStr;
					var permissionTemp=capList.substring(capList.lastIndexOf("(")+1,capList.lastIndexOf(")"));
					var permissionListArray=permissionTemp.split("|");
					var permissionList = permissionListArray.toString();
					var permLst = permissionList.indexOf(permission);
					if(permLst>=0)
					 {
						flagCheckPM=true;
						break;
					 }
				}
			}
			console.log("flagCheckPM: "+flagCheckPM);
			return(flagCheckPM);
		}else{
			flagCheckPM=true;
		}
		
	}

/*Function for Check Permission*/	
	
	
/*Controller for application list page - Sandeep Ends here*/
		
/*Controller for Client and Account page in SOP module ends here*/
/*Controller for Advanced Search start here*/
var currSavedSearchType = '';
app.controller("advanceSearchCtrl", function($location,$scope, $http) {
	 $scope.saveSearchWithName = function(item, event) {
		 var searchType = $("input[name='searchType']:checked").val();
			if(searchType == "byText"){
				var dataObject = {
					"searchname" : $('#savedSearchName').val(),
					"searchType":"text",
					"searchQuery": [
						{
							"searchText": $('#serachbyTextVal').val()
						}
					],
					"createdByUserId":localStorage.getItem("userID")
				};
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				var responsePromise = $http.post(saveSearchPost, dataObject, {});
				responsePromise.success(function(dataFromServer, status, headers, config) {
					 console.log(dataFromServer.userMessage);
				});
							
			}else if(searchType == "query"){
				var dataObject = {
						"searchname" : $('#savedSearchName').val(),
						"searchType":"query",
						"searchQuery": [
							{
								"SOPName": $('#searchSOPName').val(),
								"alertName":$('#searchAlertName').val(),
								"alertSeverity":$("#searchSeverity option:selected").attr('value'),
								"taskName":$('#searchTaskName').val()
							}
						],
						"createdByUserId":localStorage.getItem("userID")
				};
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				var responsePromise = $http.post(saveSearchPost, dataObject, {});
				responsePromise.success(function(dataFromServer, status, headers, config) {
					 console.log(dataFromServer.userMessage);
				});
			}
			 $('#searchWaitContainer').hide();
			 $('#saveSearchMsg').hide();
			 backToSearch();
	 };
	 
	 $scope.cancelSaveSearch = function(item, event) {
		 $('#searchWaitContainer').hide();
		 $('#saveSearchMsg').hide();
	 };
	
	 $scope.selectSavedSearch = function(item, event) {
		 var savedSearchList = $("#savedSearchList option:selected").attr('value');
		 $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	 	 $http.get(getSavedSearch+'?Id='+savedSearchList).success(function(data) {
	 		var currSavedSearch = data.response;
	 		if(currSavedSearch.searchType == 'text'){
	 			currSavedSearchType = 'text';
	 			$('#searchResultContainer').hide();
	 			$('#findBySaved').html('<div class="form-group"><label class="col-sm-2 control-label">Alert Name : </label> <div class="col-sm-10"><input type="text" id="serachbyTextValResult" style="width:270px;" /></div><div id="serachbyTextIdResult" style="display:none;"></div></div>');
	 			$('#serachbyTextIdResult').html(currSavedSearch._id);
	 			var currsearchQuery = currSavedSearch.searchQuery;
	 			for(var i=0; i< currsearchQuery.length; i++){
	 				console.log(currsearchQuery[i].searchText);
	 				$('#serachbyTextValResult').val(currsearchQuery[i].searchText);
	 			}
	 			
	 			
	 		}else if(currSavedSearch.searchType == 'query'){
	 			currSavedSearchType = 'query';
	 			$('#searchResultContainer').hide();
	 			$('#findBySaved').html('<div class="form-group"><label class="col-sm-2 control-label">SOP Name : </label> <div class="col-sm-10"><input type="text" id="serachbyQuerySOPResult" /></div><div id="serachbyTextIdResult" style="display:none;"></div></div><div class="form-group"><label class="col-sm-2 control-label">Alert Name : </label> <div class="col-sm-10"><input type="text" id="serachbyQueryAlertResult" /></div></div><div class="form-group"><label class="col-sm-2 control-label">Task Name : </label> <div class="col-sm-10"><input type="text" id="serachbyQueryTaskResult" /></div></div><div class="form-group"><label class="col-sm-2 control-label">Severity : </label> <div class="col-sm-10"><input type="text" id="serachbyQuerySeverityResult" /></div></div>');
	 			$('#serachbyTextIdResult').html(currSavedSearch._id);
	 			var currsearchQuery = currSavedSearch.searchQuery;
	 			for(var i=0; i< currsearchQuery.length; i++){
	 				$('#serachbyQuerySOPResult').val(currsearchQuery[i].SOPName);
	 				$('#serachbyQueryAlertResult').val(currsearchQuery[i].alertName);
	 				$('#serachbyQueryTaskResult').val(currsearchQuery[i].taskName);
	 				$('#serachbyQuerySeverityResult').val(currsearchQuery[i].alertSeverity);
	 			}
	 		}
	 		$('#saveSearchDelete').show();
	 	 });
	 };
	 $scope.deleteSavedSearch = function(item, event) {
		 var currentSearchId = $('#serachbyTextIdResult').html();
		 var r = confirm("Are you sure to delete!");
		    if (r == true) {
		    	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		    	$http.delete(deleteSaveSearch + '?Id='+currentSearchId).success(function(data) {
		    		alert(data.userMessage);
		    	});	
		    	$('#findBySaved').html('');
		    	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		     	$http.get(getAllSavedSearch + '?createdByUserId='+localStorage.getItem("userID")).success(function(data) {
		     		var allSavedSearch = data.response;
		     		$('#savedSearchList').html('');
		     		$('#savedSearchList').html('<option value="-1">Select Saved Search</option>');
		     		for(var i=0; i< allSavedSearch.length; i++){		     			
		     			$('#savedSearchList').append('<option value='+allSavedSearch[i]._id+'>'+allSavedSearch[i].searchname+'</option>')
		     		}
		     	});
		    } else {
		       
		    }
		 
	 };
	 $scope.fetchSavedSearchData = function(item, event){ 
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	 	$http.get(getAllSavedSearch + '?createdByUserId='+localStorage.getItem("userID")).success(function(data) {
	 		var allSavedSearch = data.response;
	 		$('#savedSearchList').html('');
	 		$('#savedSearchList').html('<option value="-1">Select Saved Search</option>');
	 		for(var i=0; i< allSavedSearch.length; i++){
	 			
	 			$('#savedSearchList').append('<option value='+allSavedSearch[i]._id+'>'+allSavedSearch[i].searchname+'</option>')
	 		}
	 	});
	 	$('#findBySaved').html('');
	 };
});	

app.controller("advanceSearchTicketCtrl", function($location,$scope, $http) {
	 $scope.saveSearchWithName = function(item, event) {
				var dataObject = {
					"searchname" : $('#savedSearchName').val(),
					"searchType":"text",
					"searchQuery": [
						{
							"searchText": $('#serachbyTextVal').val()
						}
					],
					"createdByUserId":localStorage.getItem("userID")
				};
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				var responsePromise = $http.post(saveSearchPost, dataObject, {});
				responsePromise.success(function(dataFromServer, status, headers, config) {
					 console.log(dataFromServer.userMessage);
				});
							
			 $('#searchWaitContainer').hide();
			 $('#saveSearchMsg').hide();
			 backToSearch();
	 };
	 
	 $scope.cancelSaveSearch = function(item, event) {
		 $('#searchWaitContainer').hide();
		 $('#saveSearchMsg').hide();
	 };
	
	 $scope.selectSavedSearch = function(item, event) {
		 var savedSearchList = $("#savedSearchList option:selected").attr('value');
		 $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	 	 $http.get(getSavedSearch+'?Id='+savedSearchList).success(function(data) {
	 		var currSavedSearch = data.response;
	 		if(currSavedSearch.searchType == 'text'){
	 			currSavedSearchType = 'text';
	 			$('#searchResultContainer').hide();
	 			$('#findBySaved').html('<div class="form-group"><label class="col-sm-2 control-label">Alert Name : </label> <div class="col-sm-10"><input type="text" id="serachbyTextValResult" style="width:270px;" /></div><div id="serachbyTextIdResult" style="display:none;"></div></div>');
	 			$('#serachbyTextIdResult').html(currSavedSearch._id);
	 			var currsearchQuery = currSavedSearch.searchQuery;
	 			for(var i=0; i< currsearchQuery.length; i++){
	 				console.log(currsearchQuery[i].searchText);
	 				$('#serachbyTextValResult').val(currsearchQuery[i].searchText);
	 			}
	 			
	 			
	 		}else if(currSavedSearch.searchType == 'query'){
	 			currSavedSearchType = 'query';
	 			$('#searchResultContainer').hide();
	 			$('#findBySaved').html('<div class="form-group"><label class="col-sm-2 control-label">SOP Name : </label> <div class="col-sm-10"><input type="text" id="serachbyQuerySOPResult" /></div><div id="serachbyTextIdResult" style="display:none;"></div></div><div class="form-group"><label class="col-sm-2 control-label">Alert Name : </label> <div class="col-sm-10"><input type="text" id="serachbyQueryAlertResult" /></div></div><div class="form-group"><label class="col-sm-2 control-label">Task Name : </label> <div class="col-sm-10"><input type="text" id="serachbyQueryTaskResult" /></div></div><div class="form-group"><label class="col-sm-2 control-label">Severity : </label> <div class="col-sm-10"><input type="text" id="serachbyQuerySeverityResult" /></div></div>');
	 			$('#serachbyTextIdResult').html(currSavedSearch._id);
	 			var currsearchQuery = currSavedSearch.searchQuery;
	 			for(var i=0; i< currsearchQuery.length; i++){
	 				$('#serachbyQuerySOPResult').val(currsearchQuery[i].SOPName);
	 				$('#serachbyQueryAlertResult').val(currsearchQuery[i].alertName);
	 				$('#serachbyQueryTaskResult').val(currsearchQuery[i].taskName);
	 				$('#serachbyQuerySeverityResult').val(currsearchQuery[i].alertSeverity);
	 			}
	 		}
	 		$('#saveSearchDelete').show();
	 	 });
	 };
	 $scope.deleteSavedSearch = function(item, event) {
		 var currentSearchId = $('#serachbyTextIdResult').html();
		 var r = confirm("Are you sure to delete!");
		    if (r == true) {
		    	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		    	$http.delete(deleteSaveSearch + '?Id='+currentSearchId).success(function(data) {
		    		alert(data.userMessage);
		    	});	
		    	$('#findBySaved').html('');
		    	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		     	$http.get(getAllSavedSearch + '?createdByUserId='+localStorage.getItem("userID")).success(function(data) {
		     		var allSavedSearch = data.response;
		     		$('#savedSearchList').html('');
		     		$('#savedSearchList').html('<option value="-1">Select Saved Search</option>');
		     		for(var i=0; i< allSavedSearch.length; i++){		     			
		     			$('#savedSearchList').append('<option value='+allSavedSearch[i]._id+'>'+allSavedSearch[i].searchname+'</option>')
		     		}
		     	});
		    } else {
		       
		    }
		 
	 };
	 $scope.fetchSavedSearchData = function(item, event){ 
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	 	$http.get(getAllSavedSearch + '?createdByUserId='+localStorage.getItem("userID")).success(function(data) {
	 		var allSavedSearch = data.response;
	 		$('#savedSearchList').html('');
	 		$('#savedSearchList').html('<option value="-1">Select Saved Search</option>');
	 		for(var i=0; i< allSavedSearch.length; i++){
	 			
	 			$('#savedSearchList').append('<option value='+allSavedSearch[i]._id+'>'+allSavedSearch[i].searchname+'</option>')
	 		}
	 	});
	 	$('#findBySaved').html('');
	 };
});

/*Controller for Advanced Search ends here*/
app.directive('ngFocus', ['$parse', function($parse) {
    return function(scope, element, attr) {
        var fn = $parse(attr['ngFocus']);
        element.on('focus', function(event) {
            scope.$apply(function() {
                fn(scope, {$event:event});
            });
        });
    };
}])
app.directive('ngBlur', ['$parse', function($parse) {
    return function(scope, element, attr) {
        var fn = $parse(attr['ngBlur']);
        element.on('blur', function(event) {
            scope.$apply(function() {
                fn(scope, {$event:event});
            });
        });
    };
}]);

function getJSONFromDOM(el, arr){
	arr.push({});
    el.children().each(function(){        
    	var currDom = $(this).html();
    	var currDom1 = $(this).next().val();
        arr[arr.length-1][currDom]  = currDom1 ;
    });
}
 function checkSystemLogOut(){
	 if(localStorage.getItem("TestUserID") == null){
			window.location.href = docDomain;
		}
 }
 
 function getSOPUnprocessAlertData(alertName){
	 var currAccName = $("#accountSelOps option:selected").text();
	 var currAppName = $("#applNameCreate option:selected").text();	 
	 $.ajax({
		 beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
		 },
		 contentType: 'application/json',
		 url: getAlertFromAlertAuditLog +'?alertName='+alertName+'&accountName='+currAccName+'&applicationName='+currAppName,
		 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},		
		 type: "GET",
		 success: function(data) {
			  var dataAlertGet = data.response;
			  if (typeof(dataAlertGet) != 'undefined' && dataAlertGet != null){
				  //for(var i = 0; i< dataAlertGet.length; i++){
				  $('#createAlertName').val(dataAlertGet.alertName).attr('disabled','disabled');
				  $('#alertDescTxtArea').val(dataAlertGet.alertShortDesc).attr('disabled','disabled');
				  $('#alertTypeDrp').html("<option>"+dataAlertGet.alertType+"</option>").attr('disabled','disabled');
				  $('#alertSeverityDrp').html("<option>"+dataAlertGet.alertSeverity+"</option>").attr('disabled','disabled');
				  $("#showAutoBackContainer").hide();
				  $('#alertResultContainer').hide();
				  //}	
			  }else{
				  alert('No Alert Data Avaliable');
			  }
		 },
		 error: function() { 
			 alert('No Data Avaliable');
		 }
	}); 	 
}
var sopDataArray;
var currentMapRowId;
var ioMapArray = new Array();
var choreoPathArray = new Array();
var choreographEvent;
var sourcesopIDArray = new Array();
var sourcesopValueArray = new Array();
var updateChoreoId='';
function viewChoreo(){
	dialogchoreoModelUp.dialog('open');
	$('#dataRetriveChoreo').html('');
	$('#startSOPChoreoData').html(ChoreographObj.start_sop_name);
	for(var i = 0; i < ChoreographObj.paths.length; i++){
		$('#dataRetriveChoreo').append('<tr><td>'+ChoreographObj.paths[i].fromSOPName+'</td><td>'+ChoreographObj.paths[i].toSOPName+'</td></tr>')
	}
	setTimeout(function(){
		validateCh('dataRetriveChoreo','choreoGraphChartRetrive');
	},1000);
}
function updateChoreo(){
	if($("#editChoreou").hasClass("disableClass")!=true){
		 dialogchoreoModel.dialog('open');
		 //var currAppId = $("#applNameCreate option:selected").val();
		 $('#selectStartSOP').html('<option value="Sel">Select SOP</option>');
		 $('#selectFromSOP').html('<option value="Sel">Select SOP</option>');
		 $('#selectToSOP').html('<option value="Sel">Select SOP</option>');
		// $('#sourceSOP').html('<option value="Sel">Select To SOP</option>');
		 $.ajax({
			 beforeSend: function(xhrObj){
	            xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
			 },
			 contentType: 'application/json',
			 url: getAllSops + '?accountId='+firstAccountId,
			 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},
			 dataType: "json",
			 type: "GET",
			 success: function(data) {
				 	sopDataArray = data.response; 
					if(sopDataArray != ''){
						for(i=0;i<sopDataArray.length; i++){
							$('#selectStartSOP').append("<option value='"+sopDataArray[i].SOPID+"' rel='"+sopDataArray[i].EventType+"' active='"+sopDataArray[i].activeMode+"'>"+sopDataArray[i].SOPName+"</option>");
							$('#selectFromSOP').append("<option value='"+sopDataArray[i].SOPID+"' rel='"+sopDataArray[i].EventType+"' active='"+sopDataArray[i].activeMode+"' >"+sopDataArray[i].SOPName+"</option>");
							$('#selectToSOP').append("<option value='"+sopDataArray[i].SOPID+"' rel='"+sopDataArray[i].EventType+"' active='"+sopDataArray[i].activeMode+"' alt='"+i+"'>"+sopDataArray[i].SOPName+"</option>");
							//$('#sourceSOP').append("<option value='"+sopDataArray[i].SOPID+"' alt='"+sopDataArray[i].EventType+"'>"+sopDataArray[i].SOPName+"</option>");
						}
					}
			 },
			 error: function() { 
				 alert("Error to fetch the SOP Data for Choreograph. Please try later.");
			 }
		});	
		 $('#addedSopPath').html('');
		 $('#selectStartSOP').html("<option value='"+ChoreographObj.start_sop_id+"' >" + ChoreographObj.start_sop_name+ "</option>").attr("disabled","disabled");
		 for(var i = 0; i < ChoreographObj.paths.length; i++){
				$('#addedSopPath').append('<tr><td>'+ChoreographObj.paths[i].fromSOPName+'</td><td>'+ChoreographObj.paths[i].toSOPName+'</td><td><a href="javascript:void(0)" onclick="" title="Delete SOP" class="deleteSOPRow"><span class="glyphicon glyphicon-remove-sign"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" onclick="" title="Edit SOP" class="editSOPRow"><span class="glyphicon glyphicon-edit"></span></td></tr>');
		 }
		 updateChoreoId = ChoreographObj. _id;
		 $('#tableStartPath').show();
	}else{
		console.log("button is disabled");
	}
}

function createChoreo(){
	dialogchoreoModel.dialog('open');
	if($('#selectStartSOP').attr("disabled") != "disabled"){
	 //var currAppId = $("#applNameCreate option:selected").val();
		 $('#selectStartSOP').html('<option value="Sel">Select SOP</option>');
		 $('#selectFromSOP').html('<option value="Sel">Select SOP</option>');
		 $('#selectToSOP').html('<option value="Sel">Select SOP</option>');
		// $('#sourceSOP').html('<option value="Sel">Select To SOP</option>');
		 $.ajax({
			 beforeSend: function(xhrObj){
	             xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
			 },
			 contentType: 'application/json',
			 url: getAllSops + '?accountId='+firstAccountId,
			 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},
			 dataType: "json",
			 type: "GET",
			 success: function(data) {
				 	sopDataArray = data.response; 
					if(sopDataArray != ''){
						for(i=0;i<sopDataArray.length; i++){
							$('#selectStartSOP').append("<option value='"+sopDataArray[i].SOPID+"' rel='"+sopDataArray[i].EventType+"' active='"+sopDataArray[i].activeMode+"' _id='"+sopDataArray[i]._id+"' >"+sopDataArray[i].SOPName+"</option>");
							$('#selectFromSOP').append("<option value='"+sopDataArray[i].SOPID+"' rel='"+sopDataArray[i].EventType+"' active='"+sopDataArray[i].activeMode+"' _id='"+sopDataArray[i]._id+"' >"+sopDataArray[i].SOPName+"</option>");
							$('#selectToSOP').append("<option value='"+sopDataArray[i].SOPID+"' rel='"+sopDataArray[i].EventType+"' active='"+sopDataArray[i].activeMode+"' alt='"+i+"' _id='"+sopDataArray[i]._id+"' >"+sopDataArray[i].SOPName+"</option>");
							//$('#sourceSOP').append("<option value='"+sopDataArray[i].SOPID+"' alt='"+sopDataArray[i].EventType+"'>"+sopDataArray[i].SOPName+"</option>");
						}
					}
			 },
			 error: function() { 
				 alert("Error to fetch the SOP Data for Choreograph. Please try later.");
			 }
		});	
	}
}
function showSourceSOP(){
	console.log("Source SOP Array: "+sourcesopValueArray);
	$('#sourceSOP').html('<option value="Sel">Select Source SOP</option>');
	for(var i = 0; i < sourcesopValueArray.length; i++){
		$('#sourceSOP').append("<option value='"+sourcesopValueArray[i].id+"' alt='"+sourcesopValueArray[i].type+"'>"+sourcesopValueArray[i].name+"</option>");
	}
	$('#outValParam').hide();
	$('#paramValSOPs').show();
}
function closeChoreoDialog(){
	$('#selectStartSOP').removeAttr("disabled");
	$("#choreoFrame2").hide();
	$("#choreoFrame3").hide();
	$("#choreoHumanFrame3").hide();	
	$("#tableToMap").hide();
	$("input[name='mapvalue']").prop('checked', false);
}
function fetchChoreoData(){
	if(validateGraph == ''){
		alert('Please validate before you save/update the Choreographed SOP.');
		return false;
	}else if(validateGraph == 'N'){
		alert('Please validate before you save/update the Choreographed SOP.');
		return false;
	}else if(validateGraph == 'Y'){	
		var selectedStartSOP = $('#selectStartSOP option:selected').val();
		var selectedStartSOPTxt = $('#selectStartSOP option:selected').text();
		if(updateChoreoId != ''){
			choreographEvent = {
					 "_id": updateChoreoId,
					 "start_sop_id": selectedStartSOP,
					 "start_sop_name": selectedStartSOPTxt,
					 "human_activities":humanActivities,
					 "paths": choreoPathArray
			}
		}else{
			choreographEvent = {
					 "start_sop_id": selectedStartSOP,
					 "start_sop_name": selectedStartSOPTxt,
					 "human_activities":humanActivities,
					 "paths": choreoPathArray				 
			}		
		}
		dialogchoreoModel.dialog('close');
	}	
}
function outputParamList(){
	 var currSel = $("#sourceSOP option:selected").attr('alt');
	 var currSelVal = $("#sourceSOP option:selected").val();
	 $('#outputParamChoreo').html('');
	 $.ajax({
		 beforeSend: function(xhrObj){
             xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
		 },
		 contentType: 'application/json',
		 url: getOutputAutomation + '/'+currSel+'?sopId='+currSelVal,
		 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},
		 dataType: "json",
		 type: "GET",
		 success: function(data) {
			//console.log("Output Param Data: "+data.AutomationOutput);
			var automationOutput = data.AutomationOutput;
			for(var j = 0 ; j <automationOutput.length; j++){
				$.each(automationOutput[j], function(key, value){	
					console.log(key+" - ");
					if(key != 'OutputDescription' && key != 'OutputType'){
						$('#outputParamChoreo').append("<option value='"+value+"' >"+value+"</option>");
					}
				});
			}
		 },
		 error: function() { 
			 alert("Error to fetch the automation output data. Please try later.");
		 }
	});
}
function openChoreoFrame2(param){
	if(param == 'parallel'){
		var currStartSop = $("#selectStartSOP option:selected").val();
		var currStartSopTxt = $("#selectStartSOP option:selected").text();
		var currSel = $("#selectStartSOP option:selected").attr('rel');
		$('#headFrame2').html('Paths');
		$("#choreoHumanFrame2").hide();
		if(currStartSop != 'Sel'){
			$("#choreoFrame2").show();
			$('#selectStartSOP').attr("disabled","disabled");
			$("#selectFromSOP option[value='Sel']").attr("selected","selected");
			$("#selectToSOP option[value='Sel']").attr("selected","selected");
			var sopArray = {
					"id": currStartSop,
					"name": currStartSopTxt,
					"type": currSel
			}
			var checkCurrentSOP = sourcesopIDArray.indexOf(currStartSop);
			if(checkCurrentSOP >= 0){
				console.log("SOP already exists");
			}else{
				sourcesopIDArray.push(currStartSop);
				sourcesopValueArray.push(sopArray);
			}
			currentSelectedSOPDrp = 'selectFromSOP';
			refreshSOPDropDown();
			refreshToSOPDropDown();
		}else{
			alert('Please Select Start SOP');
		}
	}else{
		$('#headFrame2').html('Human Activity');
		$("#choreoFrame2").hide();
		$("#choreoHumanFrame2").show();
		
	}
}
function openChoreoFrame3(rowId){
	if(rowId != 'humanAct'){
		$('#choreoHumanFrame3').hide();
		$('#ioMapValueHead').html('I/O Map Value');
		var currStartSop = $("#selectFromSOP option:selected").val();
		var currStartSopTxt = $("#selectFromSOP option:selected").text();
		var currSel = $("#selectFromSOP option:selected").attr('rel');
		if(currStartSop != 'Sel'){
			$('#outValParam').hide();
			$('#paramValSOPs').hide();
			$("#choreoFrame3").show();
			currentMapRowId = rowId;
			var sopArray = {
					"id": currStartSop,
					"name": currStartSopTxt,
					"type": currSel
			}
			var checkCurrentSOP = sourcesopIDArray.indexOf(currStartSop);
			if(checkCurrentSOP >= 0){
				console.log("SOP already exists");
			}else{
				sourcesopIDArray.push(currStartSop);
				sourcesopValueArray.push();
			}		
		}else{
			alert('Please Select From SOP');
		}
	}else{
		$('#choreoFrame3').hide();
		$('#choreoHumanFrame3').show();
		$('#ioMapValueHead').html('Value');
	}
}
var conditionsTdRowId=1;
function generateTableRow(tableId){	
	var SOPVaribale='<option value="none" rel="none">Select Variable</option>';
	 $.ajax({
		 beforeSend: function(xhrObj){
             xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
		 },
		 contentType: 'application/json',
		 url: getAllSops + '?accountId='+firstAccountId,
		 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},
		 dataType: "json",
		 type: "GET",
		 success: function(data) {
			 	var dataArray = data.response; 
				if(dataArray != ''){
					for(i=0;i<dataArray.length; i++){
						SOPVaribale += "<option value='"+dataArray[i].SOPID+"' rel='nonHuman' >"+dataArray[i].SOPName+"</option>";
						//changes for 9733 - Human Intervension orchestration
					}
					//Added for Human Intervention Orchestration conditions - 9733
					if(humanName !=''){
						SOPVaribale += "<option value='HA"+(hacode - 1)+"' rel='humanC'>"+humanName+"</option>";
					}
				}
				
				setTimeout(function(){
					$('#tableBodyVar1').append("<tr><td id='var"+conditionsTdRowId+"'><select id='varSel"+conditionsTdRowId+"' style='width:150px;' onchange='checkConditionsVariable(\""+conditionsTdRowId+"\");'>"+SOPVaribale+"</select></td><td id='out"+conditionsTdRowId+"'></td><td id='cond"+conditionsTdRowId+"'></td><td><a onclick='saveConditionSOP(\""+conditionsTdRowId+"\");' title='Save Condition' class='saveTask' id='savecond"+conditionsTdRowId+"' href='javascript:void(0)'><span class='glyphicon glyphicon-floppy-disk'></span></a>&nbsp;<a href='javascript:void(0);' onclick='' title='Delete' class='deleteSOPRowCondition'><span class='glyphicon glyphicon-remove-sign'></span></a></td></tr>");
				}, 1500);
		 },
		 error: function() { 
			 alert("Error to fetch the SOP Data for Choreograph. Please try later.");
		 }
	});
	conditionsTdRowId = conditionsTdRowId + 1;
}
//changes for 9733 - Human Intervension orchestration
function checkConditionsVariable(rowId){
	if(($("#varSel"+rowId+" option:selected").attr('rel')) == "humanC"){
		$("#out"+rowId).html('');
		var htmlHum = '<select>';
		for(var j=0; j < humActVal.length; j++){
			htmlHum += '<option>'+humActVal[j]+'</option>';
		}
		htmlHum += '</select>';
		$("#cond"+rowId).html(htmlHum);		
	}else if(($("#varSel"+rowId+" option:selected").attr('rel')) == "none"){
		$("#out"+rowId).html('');
		$("#cond"+rowId).html('');
	}else if(($("#varSel"+rowId+" option:selected").attr('rel')) == "nonHuman"){
		$("#out"+rowId).html('<select><option selected>sys_id</option></select>');
		$("#cond"+rowId).html('<input type="text" style="width:63px;" />');
	}
}
$(document).on('click', '.deleteSOPRow', function(event) {
	var confirmTaskDelete = confirm("This will be permanently deleted and cannot be recovered. Are you sure?");
    if (confirmTaskDelete == true) {
    	var tr = $(this).closest('tr');
    	var deleteTableIndex = $(tr).index();
		$(tr).remove();
		choreoPathArray.splice(deleteTableIndex, 1);
    }				
});

$(document).on('click', '.deleteSOPRowCondition', function(event) {
	var confirmTaskDelete = confirm("This will be permanently deleted and cannot be recovered. Are you sure?");
    if (confirmTaskDelete == true) {
    	var tr = $(this).closest('tr');
    	var deleteTableIndex = $(tr).index();
		$(tr).remove();
		//choreoPathArray.splice(deleteTableIndex, 1);
    }				
});

/*Changes for Update Choreograph Feature*/
var editTableIndex;
$(document).on('click', '.editSOPRow', function(event) {
	var tr = $(this).closest('tr');
	editTableIndex = $(tr).index();
	$("#choreoFrame2").show();
	$("#selectFromSOP option[value='"+choreoPathArray[editTableIndex].fromSOPId+"']").attr("selected","selected");
	$("#selectToSOP option[value='"+choreoPathArray[editTableIndex].toSOPId+"']").attr("selected","selected");
	var html = '';
	var currIndex = choreoPathArray[editTableIndex];
	ioMapArray = currIndex.ioMaps;
	for(var i=0; i<currIndex.ioMaps.length; i++){
		html += '<tr><td id="inputP'+i+'">'+currIndex.ioMaps[i].input+'</td><td id="mapV'+i+'">'+currIndex.ioMaps[i].type+'</td><td id="outPut'+i+'">'+currIndex.ioMaps[i].output+'</td><td><a class=" " title="Edit Parameter" onclick="openChoreoFrame3('+i+');" href="javascript:void(0)" id="editPBtn'+i+'"><span class="glyphicon glyphicon-edit"></span></a></tr>';
	}
	$('#addedSopIOTo').html(html);
	$('#tableToMap').show();
	$("#btnAddUpdate").html("Update").show();
});



/*Changes for Update Choreograph Feature - Ends here - Saumya*/
var lks = 1;
function addChoreoSOP(){
	if($("#btnAddUpdate").html() != 'Update'){
		if(($("#choreoFrame3").css('display')) == 'none' && ($("#addChoreoSOPBtn button").hasClass('disableClass')) == false){
			var selectFromSOP = $("#selectFromSOP option:selected").val();
			var selectToSOP = $("#selectToSOP option:selected").val();
			var selectFromSOPTxt = $("#selectFromSOP option:selected").text();
			var selectToSOPTxt = $("#selectToSOP option:selected").text();
			var currSel = $("#selectToSOP option:selected").attr('rel');
			if(selectFromSOP !="Sel" && selectToSOP !="Sel"){
				var tableData = '<tr><td id="sopNMfrom'+lks+'">'+selectFromSOPTxt+'</td><td id="sopNMto'+lks+'">'+selectToSOPTxt+'</td><td><a href="javascript:void(0)" onclick="" title="Delete SOP" class="deleteSOPRow"><span class="glyphicon glyphicon-remove-sign"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" onclick="" title="Edit SOP" class="editSOPRow"><span class="glyphicon glyphicon-edit"></span></td></tr>'
				$("#addedSopPath").append(tableData);
				$("#choreoFrame2").hide();
				$("#tableStartPath").show();
				lks = lks + 1;
			}else{
				alert("Please select From SOP and To SOP properly.")
			}
			var pathData;
			if(($("#selectToSOP option:selected").attr('rel')) == "humanC"){
				pathData = {
					"fromSOPId": selectFromSOP,
					"fromSOPName" : selectFromSOPTxt,
					"toHAId": selectToSOP,
					"toHAName": selectToSOPTxt,
					"ioMaps":ioMapArray,
					"conditions":conditionArray
				};
			}else{
				pathData = {
					"fromSOPId": selectFromSOP,
					"fromSOPName" : selectFromSOPTxt,
					"toSOPId": selectToSOP,
					"toSOPName": selectToSOPTxt,
					"ioMaps":ioMapArray,
					"conditions":conditionArray
				};
			}
			choreoPathArray.push(pathData);
			ioMapArray = [];
			conditionArray = [];
			$('#addedSopIOTo').html('');
			console.log(choreoPathArray);
			var sopArray = {
					"id": selectToSOP,
					"name": selectToSOPTxt,
					"type": currSel
			}
			var checkCurrentSOP = sourcesopIDArray.indexOf(selectToSOP);
			if(checkCurrentSOP >= 0){
				console.log("SOP already exists");
			}else{
				sourcesopIDArray.push(selectToSOP);
				sourcesopValueArray.push(sopArray);
			}
			$('#validateCh').show();
			$("#addChoreoSOPBtn button").addClass('disableClass');
			$('#conditionCheckbox').prop('checked' , false);
			$('#conditionCheckbox').removeAttr('checked');
			$('#conditionstableRow').hide();
			$('#tableBodyVar1').html('');
		}else{
			alert("Please set the I/O Map value.")
		}
	}else{
		document.getElementById("addedSopPath").deleteRow(editTableIndex);
		choreoPathArray.splice(editTableIndex, 1);
		
		if(($("#choreoFrame3").css('display')) == 'none' && ($("#addChoreoSOPBtn button").hasClass('disableClass')) == false){
			var selectFromSOP = $("#selectFromSOP option:selected").val();
			var selectToSOP = $("#selectToSOP option:selected").val();
			var selectFromSOPTxt = $("#selectFromSOP option:selected").text();
			var selectToSOPTxt = $("#selectToSOP option:selected").text();
			var currSel = $("#selectToSOP option:selected").attr('rel');
			if(selectFromSOP !="Sel" && selectToSOP !="Sel"){
				var tableData = '<tr><td id="sopNMfrom'+lks+'">'+selectFromSOPTxt+'</td><td id="sopNMto'+lks+'">'+selectToSOPTxt+'</td><td><a href="javascript:void(0)" onclick="" title="Delete SOP" class="deleteSOPRow"><span class="glyphicon glyphicon-remove-sign"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" onclick="" title="Edit SOP" class="editSOPRow"><span class="glyphicon glyphicon-edit"></span></td></tr>'
				$("#addedSopPath").append(tableData);
				$("#choreoFrame2").hide();
				$("#tableStartPath").show();
				lks = lks + 1;
			}else{
				alert("Please select From SOP and To SOP properly.")
			}
			//changes for 9733 - Choreograph Orchestration
			var pathData = {
				"fromSOPId": selectFromSOP,
				"fromSOPName" : selectFromSOPTxt,
				"toSOPId": selectToSOP,
				"toSOPName": selectToSOPTxt,
				"ioMaps":ioMapArray,
				"conditions":conditionArray
			};
			choreoPathArray.push(pathData);
			ioMapArray = [];
			conditionArray = [];
			$('#addedSopIOTo').html('');
			$('#tableBodyVar1').html('');
			var sopArray = {
					"id": selectToSOP,
					"name": selectToSOPTxt,
					"type": currSel
			}
			var checkCurrentSOP = sourcesopIDArray.indexOf(selectToSOP);
			if(checkCurrentSOP >= 0){
				console.log("SOP already exists");
			}else{
				sourcesopIDArray.push(selectToSOP);
				sourcesopValueArray.push(sopArray);
			}
			$('#validateCh').show();
			$("#addChoreoSOPBtn button").addClass('disableClass');
		}else{
			alert("Please set the I/O Map value.")
		}
		
	}
}
var humActVal = [];
var humanActivities = [];
var actorsArray = [];
var emailRow = 0;
var humanName;
var hacode = 1;
var conditionArray = [];
var subConditionArray = [];
function addActorsEmail(){
	$('#addedActorsValue').append('<tr id="rowAct'+emailRow+'"><td><input type="text" style="width:315px;" placeholder="Enter Email" id="emailRow'+emailRow+'" /></td><td><a href="javascript:void(0)" id="saveMailBtn'+emailRow+'" class="saveTask" title="Save Email" onclick="saveEmailHum(\''+emailRow+'\');"><span class="glyphicon glyphicon-floppy-disk"></span></a>&nbsp;&nbsp;<a class="deleteActRow" style="display:none;" id="deleteRow'+emailRow+'" title="Delete Email" onclick="deleteEmailHum(\''+emailRow+'\');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a></td></tr>');	
	emailRow = emailRow + 1;
}
function saveEmailHum(rowid){
	var currRowEmailVal = $("#emailRow"+rowid).val();
	actorsArray.push(currRowEmailVal);
	$("#emailRow"+rowid).attr("disabled","disabled");
	$("#deleteRow"+rowid).show();
	$("#saveMailBtn"+rowid).hide();
}
function saveConditionSOP(rowId){
	var haSOPID;
	var haSOPName;
	var haSOPValue;
	var haSOPOutput;
	if(($("#varSel"+rowId+" option:selected").attr('rel')) == "humanC"){
		haSOPID = $("#varSel"+rowId+" option:selected").val();
		haSOPName = $("#varSel"+rowId+" option:selected").text();
		haSOPValue = $("#cond"+rowId+" select option:selected").text();
		var humConditionArray = {
				"HAId": haSOPID,
				"HAName": haSOPName,
				"value": haSOPValue
		}
		subConditionArray.push(humConditionArray);
		conditionArray.push(subConditionArray);
		subConditionArray = [];
		$("#varSel"+rowId).attr("disabled","disabled");
		$("#cond"+rowId+" select").attr("disabled","disabled");
	}else if(($("#varSel"+rowId+" option:selected").attr('rel')) == "none"){
		alert('Please select SOP Name');
	}else if(($("#varSel"+rowId+" option:selected").attr('rel')) == "nonHuman"){		
		haSOPID = $("#varSel"+rowId+" option:selected").val();
		haSOPName = $("#varSel"+rowId+" option:selected").text();
		haSOPValue = $("#cond"+rowId+" input").val();
		haSOPOutput = $("#out"+rowId+" select option:selected").text();
		var sopConditionArray = {
				"SOPId": haSOPID,
				"SOPName": haSOPName,
				"output": haSOPOutput,
				"value" : haSOPValue
		}
		subConditionArray.push(sopConditionArray);
		conditionArray.push(subConditionArray);
		subConditionArray = [];
		$("#varSel"+rowId).attr("disabled","disabled");
		$("#out"+rowId+" select").attr("disabled","disabled");
		$("#cond"+rowId+" input").attr("disabled","disabled");
	}
	$("#savecond"+rowId).hide();
}
function deleteEmailHum(rowid){
	$("#rowAct"+rowid).remove();
	actorsArray.splice(rowid, 1);
}
function setValue(){
	var inputParam = $('#ValHumanTxt').val();
	$('#addedHumanValue').append('<tr><td>'+inputParam+'</td><td><a class="deleteRow" title="Delete Row" onclick="" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a>&nbsp;&nbsp;<a class="editRow" title="Edit Row" onclick="" href="javascript:void(0)"><span class="glyphicon glyphicon-edit"></span></a></td></tr>');
	humActVal.push(inputParam);
	$('#choreoHumanFrame3').hide();
	$('#ValHumanTxt').val('');
	$('#humanActivityAddBtn').removeClass('disableClass');
	$("#tableToValue").show();
}
function addHumanActivity(){
	humanName = $('#humanName').val();
	var humanDesc = $('#humanDesc').val();
	var humanType = $('#humanType').val();
	var humanActivitiesObj = {
			"ha_id" : "HA"+hacode,
			"ha_name": humanName,
			"ha_description": humanDesc,
			"actors": actorsArray,
			"input_type": humanType,
			"input_set": humActVal
	}
	humanActivities.push(humanActivitiesObj);
	$("#addedHumanActivities").append('<tr><td>'+humanName+'</td><td>'+humanType+'</td><td>'+humActVal+'</td><td><a class="deleteRow" title="Delete Row" onclick="" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a>&nbsp;&nbsp;<a class="editRow" title="Edit Row" onclick="" href="javascript:void(0)"><span class="glyphicon glyphicon-edit"></span></a></td></tr>');
	$("#addedHumanValue").html('');
	$("#tableToValue").hide();
	$("#humanDesc").val('');
	$("#humanName").val('');
	$("#addedActorsValue").html('');
	actorsArray = [];
	$("#choreoHumanFrame2").hide();
	$("#tableHumanActivities").show();
	hacode = hacode + 1;
	console.log(humanActivities);
}
function checkTypeVal(){
	var humanType = $("#humanType option:selected").val();
	if(humanType == 'Enum'){
		$('#EnumValAdd').show();
		$('#tableToValue').show();
	}else{
		$('#EnumValAdd').hide();
		$('#tableToValue').hide();
	}
}
function setMapValue(){	
	var inputParam = $('#inputP'+currentMapRowId).html();
	var mapRadioVal = $("input[name='mapvalue']:checked").val();
	var mapRowItem = false;
	var sourceSOP = '';
	var outputParamChoreo ='';
	if(mapRadioVal == 'Fixed'){
		var outputValTxt = $("#outputValTxt").val();
		if(outputValTxt != ''){
			$("#mapV"+currentMapRowId).html(mapRadioVal);
			$("#outPut"+currentMapRowId).html(outputValTxt);
			outputParamChoreo = outputValTxt;
			$("#outputValTxt").val('');
		}else{
			alert('Please enter the Output Value');
		}			
	}else if(mapRadioVal == 'PassThrough'){
		outputParamChoreo = $("#outputParamChoreo option:selected").val();
		var sourceSOP = $("#sourceSOP option:selected").val();
		$("#mapV"+currentMapRowId).html(mapRadioVal);
		$("#outPut"+currentMapRowId).html(outputParamChoreo);
	}if(mapRadioVal == 'Customized'){
		$("#mapV"+currentMapRowId).html(mapRadioVal);
	}
	$("#choreoFrame3").hide();
	var mapData = {
            "input": inputParam,
            "type": mapRadioVal,
            "source_sop_id": sourceSOP,
            "output" :outputParamChoreo
    };	
	ioMapArray.splice(currentMapRowId, 1);
	ioMapArray.push(mapData);
	$("#editPBtn"+currentMapRowId).addClass('disableClass');
	$("input[name='mapvalue']").prop('checked', false);
	$("#addChoreoSOPBtn").show();

	var mapTableRowCount = document.getElementById("addedSopIOTo").rows.length;
	for(var p=0; p<=mapTableRowCount - 1; p++ ){
		var mapRowVal = $("#mapV"+p).html();
		if(mapRowVal != ''){
			mapRowItem = true;
		}else{
			mapRowItem = false;
		}
	}
	if(mapRowItem == true){
		$("#addChoreoSOPBtn button").removeClass('disableClass');
	}
}
var currentSelectedSOPDrp;
function checkActivateSOP(obj){
	currentSelectedSOPDrp = obj.id;
	var activeSOPStat = $("#"+obj.id+" option:selected").attr("active");
	var activeSOPName = $("#"+obj.id+" option:selected").html();
	if(activeSOPStat == 'n'){
		$("#inactiveErrorMsg").html('This SOP '+activeSOPName+' is in Inactive status, do you want to make it active ? ');
		$("#inactiveSOPDialog").show();
	}
}
function cancelInactiveDialog(){
	$("#inactiveErrorMsg").html('');
	$("#inactiveSOPDialog").hide();
	alert('Select another SOP');
	refreshSOPDropDown();
}
function activeSelectedSOP(){
	console.log('Active SOP process start here...')
	var selectedSOPId = $("#"+currentSelectedSOPDrp+ " option:selected").attr("_id");
	var selectedSOPType = $("#"+currentSelectedSOPDrp+ " option:selected").attr("rel");
	$("#waitingMsg").show();
	var responsePromiseSelectedSOP = UpdateSOPActiveStatus + '/'+selectedSOPType+'/'+selectedSOPId;	
	 $.ajax({
		 beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
		 },
		 contentType: 'application/json',
		 url: responsePromiseSelectedSOP,
		 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},
		 dataType: "json",
		 type: "PUT",
		 success: function(data) {
			 console.log(data);
			 $("#inactiveSOPDialog").hide();
			 $("#waitingMsg").hide();
			 $("#"+currentSelectedSOPDrp+ " option:selected").removeAttr("active");
		 },
		 error: function(data) { 
			 console.log("inside error: "+data);
			 $("#inactiveSOPDialog").hide();
			 $("#waitingMsg").hide();
		 }
	});		
}

function refreshSOPDropDown(){
	 $('#'+currentSelectedSOPDrp).html('<option value="Sel">Select SOP</option>');
	 $.ajax({
		 beforeSend: function(xhrObj){
             xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
		 },
		 contentType: 'application/json',
		 url: getAllSops + '?accountId='+firstAccountId,
		 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},
		 dataType: "json",
		 type: "GET",
		 success: function(data) {
			 	sopDataArray = data.response; 
				if(sopDataArray != ''){
					for(i=0;i<sopDataArray.length; i++){
						if(currentSelectedSOPDrp != 'selectToSOP'){
							$('#'+currentSelectedSOPDrp).append("<option value='"+sopDataArray[i].SOPID+"' rel='"+sopDataArray[i].EventType+"' active='"+sopDataArray[i].activeMode+"' _id='"+sopDataArray[i]._id+"' >"+sopDataArray[i].SOPName+"</option>");
						}else{
							$('#'+currentSelectedSOPDrp).append("<option value='"+sopDataArray[i].SOPID+"' rel='"+sopDataArray[i].EventType+"' active='"+sopDataArray[i].activeMode+"' alt='"+i+"' _id='"+sopDataArray[i]._id+"' >"+sopDataArray[i].SOPName+"</option>");
						}
					}
					if(humanName !=''){
						$('#'+currentSelectedSOPDrp).append("<option value='HA"+(hacode - 1)+"' rel='humanC'>"+humanName+"</option>");
					}
				}
		 },
		 error: function() { 
			 alert("Error to fetch the SOP Data for Choreograph. Please try later.");
		 }
	});
}

function refreshToSOPDropDown(){
	 $('#selectToSOP').html('<option value="Sel">Select SOP</option>');
	 $.ajax({
		 beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
		 },
		 contentType: 'application/json',
		 url: getAllSops + '?accountId='+firstAccountId,
		 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},
		 dataType: "json",
		 type: "GET",
		 success: function(data) {
			 	sopDataArray = data.response; 
				if(sopDataArray != ''){
					for(i=0;i<sopDataArray.length; i++){
							$('#selectToSOP').append("<option value='"+sopDataArray[i].SOPID+"' rel='"+sopDataArray[i].EventType+"' active='"+sopDataArray[i].activeMode+"' alt='"+i+"' _id='"+sopDataArray[i]._id+"' >"+sopDataArray[i].SOPName+"</option>");
					}
				}
				if(humanName !=''){
					$('#selectToSOP').append("<option value='HA"+(hacode - 1)+"' rel='humanC'>"+humanName+"</option>");
				}
		 },
		 error: function() { 
			 alert("Error to fetch the SOP Data for Choreograph. Please try later.");
		 }
	});
}

function retriveAutomationInputData(){
	var selectFromSOP = $("#selectFromSOP option:selected").val();
	var selectToSOP = $("#selectToSOP option:selected").val();
	if(selectFromSOP != selectToSOP){
		var currSel = $("#selectToSOP option:selected").attr('alt');
		if (typeof(sopDataArray[currSel].AutomationInput) != 'undefined' || sopDataArray[currSel].AutomationInput != null){
			var inputParamData = sopDataArray[currSel].AutomationInput;
			var htmlAutoParam = '';
			var automationProvider = sopDataArray[currSel].AutomationProvider;
			var i = 0;
			for(var j = 0 ; j <inputParamData.length; j++){
				$.each(inputParamData[j], function(key, value){						
					if(automationProvider == 'IPSoft'){
						if(key != 'timeOut' && key != 'targetHost' && key != 'assignedGroup' && key != 'automationDesc' && key !='automationName' && key !='automationPath' && key != 'osType' && key !='severity'){
							htmlAutoParam += '<tr><td id="inputP'+i+'">' + key + '</td><td id="mapV'+i+'"></td><td id="outPut'+i+'"></td><td><a id="editPBtn'+i+'" href="javascript:void(0)" onclick="openChoreoFrame3('+i+');" title="Edit Parameter" class=" "><span class="glyphicon glyphicon-edit"></span></a></td></tr>';
							i = i + 1;
						}
					}else if(automationProvider == 'blueprism'){
						if(key != 'processName'){
							htmlAutoParam += '<tr><td id="inputP'+i+'">' + key + '</td><td id="mapV'+i+'"></td><td id="outPut'+i+'"></td><td><a id="editPBtn'+i+'" href="javascript:void(0)" onclick="openChoreoFrame3('+i+');" title="Edit Parameter" class=" "><span class="glyphicon glyphicon-edit"></span></a></td></tr>';
							i = i + 1;
						}
					}else if(automationProvider == 'IBMWorkloadAutomation'){
						htmlAutoParam += '<tr><td id="inputP'+i+'">' + key + '</td><td id="mapV'+i+'"></td><td id="outPut'+i+'"></td><td><a id="editPBtn'+i+'" href="javascript:void(0)" onclick="openChoreoFrame3('+i+');" title="Edit Parameter" class=" "><span class="glyphicon glyphicon-edit"></span></a></td></tr>';
						i = i + 1;
					}
				});
			}
		}
		$('#addedSopIOTo').html(htmlAutoParam);
		$('#tableToMap').show();
	}else{
		alert("From SOP and To SOP must have different value.");
		//$('#selectToSOP option[value=Sel]').attr('selected','selected');
		$('#tableToMap').hide();
		currentSelectedSOPDrp = 'selectToSOP';
		refreshSOPDropDown();
	}
}

function checkSOPInputData(){
	var selectFromSOP = $("#selectFromSOP option:selected").val();
	var selectToSOP = $("#selectToSOP option:selected").val();
	if(selectToSOP != 'Sel'){
		if(selectFromSOP != selectToSOP){
			$("#addChoreoSOPBtn").show();
			$("#addChoreoSOPBtn button").removeClass('disableClass');
		}else{
			alert("From SOP and To SOP must have different value.");
			currentSelectedSOPDrp = 'selectFromSOP';
			refreshSOPDropDown();
		}
	}
}

function flowToSOP(obj){
	console.log($("#selectToSOP option:selected").attr('rel'));	
	if(($("#selectToSOP option:selected").attr('rel')) == "humanC"){
		$("#addChoreoSOPBtn").show();
		$("#addChoreoSOPBtn button").removeClass('disableClass');
	}else{
		retriveAutomationInputData();
		checkActivateSOP(obj); 
	}
}

function getSOPUnprocessTicketData(ticketName){
	 var currAccName = $("#accountSelOps option:selected").text();
	 var currAppName = $("#applNameCreate option:selected").text();
	
	 $.ajax({
		 beforeSend: function(xhrObj){
             xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
		 },
		 contentType: 'application/json',
		 url: GetTicketFromAuditLog +'?ticketKey='+ticketName+'&accountName='+currAccName+'&applicationName='+currAppName,
		 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},		
		 type: "GET",
		 success: function(data) {
			  var dataAlertGet = data.response;
			  if (typeof(dataAlertGet) != 'undefined' && dataAlertGet != null){
				  //for(var i = 0; i< dataAlertGet.length; i++){
				  $('#createTicketName').val(dataAlertGet.ticketKey).attr('disabled','disabled');
				  $('#requesterTicket').val('Not Available').attr('disabled','disabled');
				  $('#assigneeGroup').val('Not Available').attr('disabled','disabled');
				  $('#assigneeTicket').val(dataAlertGet.assignee).attr('disabled','disabled');
				  $('#ticketTypeDrp').val(dataAlertGet.type).attr('disabled','disabled');
				  $('#ticketPriorityDrp').val(dataAlertGet.priority).attr('disabled','disabled');
				  $('#ticketDescTxtArea').val(dataAlertGet.subject).attr('disabled','disabled');
				  $('#ticketStatusDrp').val(dataAlertGet.status).attr('disabled','disabled');
				  $('#ticketRaisedOn').val(dataAlertGet.openedAt).attr('disabled','disabled');
				  $('#ticketCause').val(dataAlertGet.cause).attr('disabled','disabled');
				  $('#ticketSeverityDrp').val(dataAlertGet.urgency).attr('disabled','disabled');
				  $('#ticketCategory').val(dataAlertGet.category).attr('disabled','disabled');			  
				  $("#showAutoBackContainer").hide();
				  $('#alertResultContainer').hide();
				  //}	
			  }else{
				  alert('No Alert Data Avaliable');
			  }
		 },
		 error: function() { 
			 alert('No Data Avaliable');
		 }
	}); 
 }


function getSOPUnprocessTicketDataFromMultiselect(ticketName){
	 var currAccName = $("#accountSelOps option:selected").text();
	 var currAppName = $("#applNameCreate option:selected").text();
	
	 $.ajax({
		 beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
		 },
		 contentType: 'application/json',
		 url: GetTicketFromAuditLog +'?ticketKey='+ticketName+'&accountName='+currAccName+'&applicationName='+currAppName,
		 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},		
		 type: "GET",
		 success: function(data) {
			  var dataAlertGet = data.response;
			  if (typeof(dataAlertGet) != 'undefined' && dataAlertGet != null){
				  //for(var i = 0; i< dataAlertGet.length; i++){
				  //$('#createTicketName').html('<option value=\''+dataAlertGet.ticketKey+'\'>'+dataAlertGet.ticketKey+'</option>').attr('disabled','disabled');
				  $('#requesterTicket').val('Not Available').attr('disabled','disabled');
				  $('#assigneeGroup').val('Not Available').attr('disabled','disabled');
				  $('#assigneeTicket').val(dataAlertGet.assignee).attr('disabled','disabled');
				  $('#ticketTypeDrp').val(dataAlertGet.type).attr('disabled','disabled');
				  $('#ticketPriorityDrp').val(dataAlertGet.priority).attr('disabled','disabled');
				  $('#ticketDescTxtArea').val(dataAlertGet.subject).attr('disabled','disabled');
				  $('#ticketStatusDrp').val(dataAlertGet.status).attr('disabled','disabled');
				  $('#ticketRaisedOn').val(dataAlertGet.openedAt).attr('disabled','disabled');
				  $('#ticketCause').val(dataAlertGet.cause).attr('disabled','disabled');
				  $('#ticketSeverityDrp').val(dataAlertGet.urgency).attr('disabled','disabled');
				  $('#ticketCategory').val(dataAlertGet.category).attr('disabled','disabled');			  
				  $("#showAutoBackContainer").hide();
				  $('#alertResultContainer').hide();
				  //}	
			  }else{
				  alert('No Alert Data Avaliable');
			  }
		 },
		 error: function() { 
			 alert('No Data Avaliable');
		 }
	}); 
}