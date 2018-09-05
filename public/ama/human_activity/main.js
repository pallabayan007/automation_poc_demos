/*******************************************************************************
 * Controllers
 */

var controller = function($rootScope, $scope, $http, $sce, $compile, AMAHumanActivityService) {

	$scope.human_activity = {}; 
	
	function getURLVar(urlVarName) {
		var url = window.location.href;
		if (url.lastIndexOf('#/') == (url.length-2)) {
			url = url.slice(0, url.length-2);
		}
		var urlVars = url.slice(url.indexOf('?') + 1).split('&');
		for(i=0; i<=(urlVars.length); i++) {
			if(urlVars[i]) {
				var urlVarPair = urlVars[i].split('=');
				if (urlVarPair[0] && urlVarPair[0] == urlVarName) {
					return urlVarPair[1];
				}
			}
		}
		return "";
	}
	
//	$scope.retrieveHumanActivity = function() {
	{
//		var val = "ID";
//		var uri = window.location.href;
//		var re = new RegExp("" +val+ "=([^&?]*)", "ig"); 
//		var ha_id = (uri.match(re))?(uri.match(re)[0].substr(val.length+1)):null;
//		alert(ha_id);
		
		var ha_id = getURLVar("ID");
		
		if (ha_id) {
			AMAHumanActivityService.retrieveHumanActivity(ha_id, function(err, result) {
				if (err) {
					document.getElementById('AnswerDiv').style.display = 'none';
					document.getElementById('TaskDiv').innerHTML = ("Human Activity retrieval encounters error (\"" + result + "\"). If needed, please contact system administrator with ID=" + ha_id + ".");
				} else {
					$scope.human_activity = result;
					document.getElementById('AnswerDiv').style.display = '';
					document.getElementById('TaskDiv').innerHTML = $scope.human_activity.question;
					if ($scope.human_activity.type == "Enum") {
						document.getElementById('selectAnswer').style.display = '';
						document.getElementById("selectAnswer").options.length = 0;
						var options = JSON.parse($scope.human_activity.options);
						for (var i = 0; i < options.length; i++) {
							var option = options[i];
							document.getElementById("selectAnswer").options.add(new Option(option, option));
						}
					} else {
						document.getElementById('inputAnswer').style.display = '';
					}
				}
			});
		} else {
			document.getElementById('AnswerDiv').style.display = 'none';
			document.getElementById('TaskDiv').innerHTML = ("The human activity ID is missing. If needed, please contact system administrator.");
		}
	}
	
	$scope.submitAnswer = function() {
		var human_activity = $scope.human_activity;
		human_activity.answer = this.answer || $("#selectAnswer").find("option:selected").val();
		if (!human_activity.answer) {
			alert("Please provide response for this activity before submit. Thanks!");
			return;
		}
		human_activity.actor = localStorage.getItem("username"); // TODO
		
		AMAHumanActivityService.submitHumanActivity(human_activity._id, human_activity, function(err, result) {
			if (err) {
				alert("Human Activity submission encounters error (\"" + err + "\"). If needed, please contact system administrator with ID=" + human_activity._id + ".");
			} else {
				alert("Human Activity submission successful.");
				document.getElementById('SubmitButton').style.display = 'none';
			}
		});
		
	}

}

angular
	.module('services', ['ngResource'])
	.service(
		'AMAHumanActivityService', [
			'$http',
			function($http) {
				var service = {
						retrieveHumanActivity: function(ha_id, callback) {
							$http.get('/rest/ActiveHumanActivity/' + ha_id)
								.success(function(data) {
									callback(null, data);
								}).error(function(data, err) {
									callback(err, data);
								});
						},
						submitHumanActivity: function(ha_id, ha, callback) {
							$http.put('/rest/HumanActivity/' + ha_id + '/submit', ha)
								.success(function(data) {
									callback(null, data);
								}).error(function(data, err) {
									callback(err, data);
								});
						}
				}
				return service;
			}
		])
	// TODO
	.config(
		[
			'$httpProvider',
			function($httpProvider) {
				$httpProvider.defaults.headers.common['Authorization'] = 'Basic UW5yY2g4TVdreW1zODVuaw==';

			}
		]);

var app = angular.module('app', ['ui.router', 'services']);

app.config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise("/");
	$stateProvider.state('default', {
		url: "/",
		templateUrl: "templates/template.html",
		controller: controller
	});
});

var globalUName = '';
app.controller("UserAuth",function($scope,$http){
	var queryURL  = window.location.search.substring(8);
	localStorage.setItem("TestUserID", queryURL);
	console.log('Index page user ID: '+queryURL);
	console.log("current useId in local storage: "+globalUName);
	if(globalUName == ''){
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		$http.get(getAuthorization+'?userID='+localStorage.getItem("TestUserID")).success(function(data) {
		setTimeout(function(){
			console.log("Authorization successfull!" + data.response);
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
			        	  $("#welcome_message").html("Your access on swaransetu portal has been revoked");	
			        	  $('#homepage_content').hide(); 
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
	}
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

function checkSystemLogOut(){
	 if(localStorage.getItem("TestUserID") == null){
			window.location.href = docDomain + "/login.html?previous=" + encodeURIComponent(window.location.href);
		}
}
