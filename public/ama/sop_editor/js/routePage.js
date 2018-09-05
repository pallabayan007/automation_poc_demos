	var app = angular.module('AMA', ['ngRoute','ui.bootstrap','ui.bootstrap.pagination','ngIdle','configuration.editor']);
	var checkUserType = "";
	var checkRoleName = "";
	// routes
	app.config(function($routeProvider) {
		$routeProvider
			// route for the home page
			.when('/', {
				templateUrl : 'html/appMonitoringInfo.html',
				controller  : 'mainController'
			})
			
			.when('/home', {
				templateUrl : 'html/appMonitoringInfo.html',
				controller  : 'mainController'
			})
			// route for the create SOP page
			.when('/createSOP', {
				templateUrl : 'html/create-sop-defination.html',
				controller  : 'TabbedFormCtrl',
				resolve: {
			        delay: function($q, $timeout) {
			          var delay = $q.defer();
			          $timeout(delay.resolve, 10);
			         /* if(checkRoleName != 'OCC Manager'){
			        	  $timeout(delay.resolve, 1000);
			          }else{
			        	  dialogAccess.dialog("open");
			          }*/
			          return delay.promise;
			        }
			      }
			})
			// route for the create Ticket page
			.when('/faq', {
				templateUrl : 'html/faq.html',
				controller  : 'faq',
				resolve: {
			        delay: function($q, $timeout) {
			          var delay = $q.defer();
			          $timeout(delay.resolve, 1000);
			         /* if(checkRoleName != 'OCC Manager'){
			        	  $timeout(delay.resolve, 1000);
			          }else{
			        	  dialogAccess.dialog("open");
			          }*/
			          return delay.promise;
			        }
			      }
			})
			// route for the create Ticket page
			.when('/createTicket', {
				templateUrl : 'html/create-ticket-defination.html',
				controller  : 'TabbedTicketForm',
				resolve: {
			        delay: function($q, $timeout) {
			          var delay = $q.defer();
			          $timeout(delay.resolve, 1000);
			         /* if(checkRoleName != 'OCC Manager'){
			        	  $timeout(delay.resolve, 1000);
			          }else{
			        	  dialogAccess.dialog("open");
			          }*/
			          return delay.promise;
			        }
			      }
			})
			// route for the Advance Search
			.when('/advanceSearch', {
				templateUrl : 'html/advanceSearch.html',
				controller  : 'advanceSearchCtrl'
			})
			.when('/advanceSearchTicket', {
				templateUrl : 'html/advanceSearchTicket.html',
				controller  : 'advanceSearchTicketCtrl'
			})
			// route for the Amend SOP page
			.when('/amendSOP', {
				templateUrl : 'html/update-sop-defination.html',
				controller  : 'updateFormCtrl'
			})	
			// route for the application List page
			.when('/application', {
				templateUrl : 'html/application-list.html',
				controller  : 'getapplist'
			})
			// route for the application Create page
			.when('/applicationCreate', {
				templateUrl : 'html/application.html',
				controller  : 'amaappformcontroller'
			})
			// route for the clients page
			.when('/clients', {
				templateUrl : 'html/client-list.html',
				controller  : 'getclientlist',
			    resolve: {
			        delay: function($q, $timeout) {
			          var delay = $q.defer();
			          if(checkUserType != 'Normal'){
			        	  $timeout(delay.resolve, 1000);
			          }else{
			        	  dialogAccess.dialog("open");
			          }
			          return delay.promise;
			        }
			      }
			})
			// route for the clients page
			.when('/clientCreate', {
				templateUrl : 'html/clients.html',
				controller  : 'amaClientformcontroller',
			    resolve: {
			        delay: function($q, $timeout) {
			          var delay = $q.defer();
			          if(checkUserType != 'Normal'){
			        	  $timeout(delay.resolve, 1000);
			          }else{
			        	  dialogAccess.dialog("open");
			          }
			          return delay.promise;
			        }
			      }
			})
			// route for the account page
			.when('/account', {
				templateUrl : 'html/account-list.html',
				controller  : 'getacclist',
			    resolve: {
			        delay: function($q, $timeout) {
			          var delay = $q.defer();
			          if(checkUserType != 'Normal'){
			        	  $timeout(delay.resolve, 1000);
			          }else{
			        	  dialogAccess.dialog("open");
			          }
			          return delay.promise;
			        }
			      }
			})
			// route for the account page
			.when('/accountCreate', {
				templateUrl : 'html/account.html',
				controller  : 'amaAccountformcontroller',
			    resolve: {
			        delay: function($q, $timeout) {
			          var delay = $q.defer();
			          if(checkUserType != 'Normal'){
			        	  $timeout(delay.resolve, 1000);
			          }else{
			        	  dialogAccess.dialog("open");
			          }
			          return delay.promise;
			        }
			      }
			});	
	});

	// create the controller and inject Angular's $scope
	app.controller('mainController', function($scope) {
		// create a message to display in our view
		$scope.info = '';
	});

	app.controller('applController', function($scope) {
		$scope.info = 'Application List';
	});
	

	$(document).ready(function() { 
		checkUserType = localStorage.getItem("type");  
		checkRoleName = localStorage.getItem("roleName");  
	});