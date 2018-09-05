/*******************************************************************************
 * Controllers
 */

var socket = io(location.protocol + "//" + location.host);

socket.on("connect", function() {
	console.log('server is connected to client');
});

socket.on('disconnect', function() {
	console.log('server is disconnected');
});

var formatDate = function(date) {
	if (!date)
		return "";
	return moment(date).format('YYYY-MM-DD HH:mm:ss');
}

var formatDateWithMillisecond = function(date) {
	if (!date)
		return "";
	return moment(date).format('YYYY-MM-DD HH:mm:ss.SSS');
}

var parseDate = function(date) {
	return moment(date, ['YYYY-MM-DD HH:mm:ss'], moment().locale()).toDate();
}

var parseGMTDate = function(date) {
	return moment(date).toDate();
}

var controller = function($rootScope, $scope, $http, $sce, $compile, AMAServiceMonitoringAgent) {

	$scope.accounts = {}; // {account_id : "SAP Account", account_name: "SAP
	// Account"};
	$scope.account = {}; // {account_id : "SAP Account", account_name: "SAP
	// Account"};
	$scope.applications = [];

	$scope.download_access = (localStorage.getItem('roleName') == 'OCC Manager');

	$('.selectpicker').selectpicker();

	var userid = localStorage.getItem("userID");

	$scope.overall_health = "grey";

	$scope.alert = {};
	$scope.ticket = {};

	$scope.checkHealth = function() {
		var accounts = [];
		if ($scope.account.account_id) {
			accounts.push({
				account: $scope.account.account_name,
				client: $scope.account.client_name
			});
		} else {
			for (var accountId in $scope.accounts) {
				var account = $scope.accounts[accountId];
				accounts.push({
					account: account.account_name,
					client: $scope.account.client_name
				});
			}
		}
		AMAServiceMonitoringAgent.queryHealthStatus(accounts, function(err, items) {
			var overall_health = "grey";
			var health_items = [];
			_.mapObject(items, function(item, key) {
				if (item.status_color == "red") {
					overall_health = "red";
				}
				item.error_message = "";
				if(item.error_messages && item.error_messages.length > 0){
					_.each(item.error_messages, function(message){
						item.error_message += message + "\n";
					});
				}
				

				if(key == "IPSoftHealthChecker"){
					$scope.ipsoft = item;
				} else if(key == "BluePrismHealthChecker"){
					$scope.blue_prism = item;
				} else if(key == "WorkloadAutomationHealthChecker"){
					$scope.workload_automation = item;
				} else {
					health_items.push(item);
				}
			});

			$scope.health_items = health_items;
			$scope.overall_health = overall_health;

			
		});
	}
	$scope.checkHealth();
	setInterval(function() {
		$scope.checkHealth();
	}, 60000);



	AMAServiceMonitoringAgent.getUserAccess(userid, function(err, data) {
		if (!err) {
			var accounts = data.response.account;
			$scope.accounts = {};
			$scope.applications = [];
			accounts.forEach(function(account) {
				var applications = [];
				if (account.applicationList != null) {
					account.applicationList.forEach(function(application) {
						applications.push({
							application_id: application.applicationId,
							application_name: application.applicationName
						});
						$scope.applications.push({
							application_id: application.applicationId,
							application_name: application.applicationName
						});
					});
				}
				
				if ( account.accountId != null && account.accountName != null) {
					$scope.accounts[account.accountId] = {
							account_id: account.accountId,
							account_name: account.accountName,
							client_name: account.clientName,
							applications: applications
						};
				}
			});
			// $('#selectAccount').options.add(new Option('aaa','aaa'));
			// debugger;
			document.getElementById("selectAccount").options.length = 0;
			for (var accountId in $scope.accounts) {
				var account = $scope.accounts[accountId];
				document.getElementById("selectAccount").options
					.add(new Option(account.account_name,
						account.account_id));
			}
			$('#selectAlert').prop('disabled', true);
			$('#selectApplication').prop('disabled', true);
			$('#selectAccount').selectpicker('refresh');
			defaultFilter.selected_apps = JSON.parse(JSON
				.stringify($scope.applications));
			$scope.filterCriteria.selected_apps = JSON.parse(JSON
				.stringify($scope.applications));
			RefreshTable();
		}
	});

	$('#selectAccount')
		.on(
			'change',
			function() {
				var selected = $(this).find("option:selected").val();
				document.getElementById("selectApplication").options.length = 0;
				var account = $scope.accounts[selected];
				$scope.account = account;
				$scope.applications = [];
				if (account.applications && account.applications.length > 1)
					document.getElementById("selectApplication").options
					.add(new Option("All Applications", ""));
				account.applications
					.forEach(function(application) {
						document
							.getElementById("selectApplication").options
							.add(new Option(
								application.application_name,
								application.application_id));
						$scope.applications
							.push({
								application_id: application.application_id,
								application_name: application.application_name
							});
					});
				$('#selectAlert').prop('disabled', true);
				$('#selectApplication').prop('disabled', false);
				$('#selectApplication').selectpicker('refresh');

				defaultFilter.selected_apps = JSON.parse(JSON
					.stringify($scope.applications));
				$scope.filterCriteria.selected_apps = JSON.parse(JSON
					.stringify($scope.applications));
				// debugger;
				RefreshTable(true);
				document.getElementById('showAnalyticsBtn').style.display = '';

				if (document.getElementById('showAnalyticsBtn').innerHTML == "Show Monitor") {
					document.getElementById('alertmonitoringtable').style.display = 'none';
					document
						.getElementById('applicationanalyticschart').style.display = 'none';
					$("#accountalertpiechart").empty();
					$("#accountcolumn").empty();
					$("#applicationalertpiechart").empty();
					$("#applicationbar").empty();
					$("#applicationcolumn").empty();
					document.getElementById('accountanalyticschart').style.display = '';
					document.getElementById('showAnalyticsBtn').innerHTML = "Show Monitor";
					accountAnalytics();
				}
				document.getElementById('SolManODataAlert').style.display = 'none';
				document.getElementById('ITMRESTAlert').style.display = 'none';
				document.getElementById('SQLAlert').style.display = 'none';
				document.getElementById('NetCoolHttpOSLCAlert').style.display = 'none';
				document.getElementById('ServiceNowRESTAlert').style.display = 'none';
				document.getElementById('MoreAdapters').style.display = 'none';
			});

	$('#selectApplication')
		.on(
			'change',
			function() {
				var applicationId = $(this).find("option:selected")
					.val();
				var applicationName = $(this).find("option:selected")
					.text();
				document.getElementById("selectAlert").options.length = 0;
				$scope.applications = [];
				if (applicationId == "") {
					if ($scope.account) {
						$scope.account.applications
							.forEach(function(application) {
								document
									.getElementById("selectApplication").options
									.add(new Option(
										application.application_name,
										application.application_id));
								$scope.applications
									.push({
										application_id: application.application_id,
										application_name: application.application_name
									});
							});
						$('#selectAlert').prop('disabled', true);
						$('#selectApplication').prop('disabled', false);
						$('#selectApplication').selectpicker('refresh');

						defaultFilter.selected_apps = JSON.parse(JSON
							.stringify($scope.applications));
						$scope.filterCriteria.selected_apps = JSON
							.parse(JSON
								.stringify($scope.applications));
						// debugger;
						RefreshTable(true);
						document.getElementById('showAnalyticsBtn').style.display = '';

						if (document.getElementById('showAnalyticsBtn').innerHTML == "Show Monitor") {
							document
								.getElementById('alertmonitoringtable').style.display = 'none';
							document
								.getElementById('applicationanalyticschart').style.display = 'none';
							$("#accountalertpiechart").empty();
							$("#accountcolumn").empty();
							$("#applicationalertpiechart").empty();
							$("#applicationbar").empty();
							$("#applicationcolumn").empty();
							document
								.getElementById('accountanalyticschart').style.display = '';
							document.getElementById('showAnalyticsBtn').innerHTML = "Show Monitor";
							accountAnalytics();
						}
					}
				} else {
					$scope.applications.push({
						application_id: applicationId,
						application_name: applicationName
					});

					$('#selectAlert').prop('disabled', false);
					$('#selectAlert').selectpicker('refresh');

					defaultFilter.selected_apps = JSON.parse(JSON
						.stringify($scope.applications));
					$scope.filterCriteria.selected_apps = JSON
						.parse(JSON.stringify($scope.applications));
					// debugger;
					RefreshTable(true);

					if (document.getElementById('showAnalyticsBtn').innerHTML == "Show Monitor") {
						document.getElementById('alertmonitoringtable').style.display = 'none';
						document
							.getElementById('accountanalyticschart').style.display = 'none';
						$("#accountalertpiechart").empty();
						$("#accountcolumn").empty();
						$("#applicationalertpiechart").empty();
						$("#applicationbar").empty();
						$("#applicationcolumn").empty();
						document
							.getElementById('applicationanalyticschart').style.display = '';
						document.getElementById('showAnalyticsBtn').innerHTML = "Show Monitor";
						applicationAnalytics();
					}
				}
			});

	var alertService = {};

	$rootScope.alerts = [];

	$rootScope.alertTimeout = null;

	alertService.add = function(msgs) {
		// $rootScope.alerts.pop();
		if (msgs != null && msgs.length > 0) {
			for (var ij = 0; ij < msgs.length; ij++) {
				$rootScope.alerts.push({
					'type': 'failed',
					'msg': $sce.trustAsHtml(msgs[ij]),
					'close': function() {
						alertService.closeAlert(this);
					}
				});
			}
		}

		$('#alterMessageBox').slideDown(500, function() {

			$(this).find(".close").bind("click", function() {
				if ($rootScope.alertTimeout != null) {
					clearTimeout($rootScope.alertTimeout);
				}
				$rootScope.alerts = [];
				$('#alterMessageBox').slideUp(500);
			});

			if ($rootScope.alertTimeout != null) {
				clearTimeout($rootScope.alertTimeout);
			}
			$rootScope.alertTimeout = setTimeout(function() {
				$rootScope.alerts = [];
				$('#alterMessageBox').slideUp(500);
			}, 3000);
		});
	};

	alertService.closeAlert = function(alert) {
		alertService.closeAlertIdx($rootScope.alerts.indexOf(alert));
	};

	alertService.closeAlertIdx = function(index) {
		$rootScope.alerts.splice(index, 1);
	};

	$scope.AlertService = alertService;

	$scope.showFilterDialog = function() {
		$("#FilterDialog")
			.dialog({
				width: 1200,
				modal: true,
				open: function() {
					$(this)
						.parent()
						.find(".ui-dialog-titlebar-close")
						.replaceWith(
							'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
					$(this).parent().find(
						".ui-dialog-titlebar-close").bind(
						"click",
						function() {
							$("#FilterDialog").dialog("close");
						});
					$(this).parent().find(".ui-dialog-buttonset")
						.children().addClass("btn btn-default");
					defaultFilter.from = formatDate(new Date());
					defaultFilter.to = defaultFilter.from;
					$scope.filterCriteria = JSON.parse(JSON
						.stringify(defaultFilter));
					$scope.auditLogsByFilter = [];
					$scope.showNoAlertData = false;
				},
				close: function() {
					$scope.auditLogsByFilter = [];
					$scope.showNoAlertData = false;
				},
				dragStop: function() {
					$(this).parent().css("height", "auto");
				},
				buttons: {
					Close: function() {
						$(this).dialog("close");
					}
				}
			});
	}

	$scope.showTicketsFilterDialog = function() {
		$("#TicketsFilterDialog")
			.dialog({
				width: 1200,
				modal: true,
				open: function() {
					$(this)
						.parent()
						.find(".ui-dialog-titlebar-close")
						.replaceWith(
							'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
					$(this).parent().find(
						".ui-dialog-titlebar-close").bind(
						"click",
						function() {
							$("#TicketsFilterDialog").dialog("close");
						});
					$(this).parent().find(".ui-dialog-buttonset")
						.children().addClass("btn btn-default");
					defaultFilter.from = formatDate(new Date());
					defaultFilter.to = defaultFilter.from;
					$scope.filterCriteria = JSON.parse(JSON
						.stringify(defaultFilter));
					$scope.ticketAuditLogsByFilter = [];
					$scope.showNoTicketData = false;
				},
				close: function() {
					$scope.ticketAuditLogsByFilter = [];
					$scope.showNoTicketData = false;
				},
				dragStop: function() {
					$(this).parent().css("height", "auto");
				},
				buttons: {
					Close: function() {
						$(this).dialog("close");
					}
				}
			});
	}

	$scope.showAlertsWithoutSOPsDialog = function() {
		$("#AlertsWithoutSOPsDialog")
			.dialog({
				width: 1200,
				modal: true,
				open: function() {
					$(this)
						.parent()
						.find(".ui-dialog-titlebar-close")
						.replaceWith(
							'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
					$(this).parent().find(
						".ui-dialog-titlebar-close").bind(
						"click",
						function() {
							$("#AlertsWithoutSOPsDialog").dialog("close");
						});
					$(this).parent().find(".ui-dialog-buttonset")
						.children().addClass("btn btn-default");
					defaultFilter.from = formatDate(new Date());
					defaultFilter.to = defaultFilter.from;
					$scope.filterCriteria = JSON.parse(JSON
						.stringify(defaultFilter));
					$scope.auditLogsWithoutSOPsByFilter = [];
				},
				close: function() {
					$scope.auditLogsWithoutSOPsByFilter = [];
				},
				dragStop: function() {
					$(this).parent().css("height", "auto");
				},
				buttons: {
					Close: function() {
						$(this).dialog("close");
					}
				}
			});
	}

	$scope.showTicketsWithoutSOPsDialog = function() {
		$("#TicketsWithoutSOPsDialog")
			.dialog({
				width: 1200,
				modal: true,
				open: function() {
					$(this)
						.parent()
						.find(".ui-dialog-titlebar-close")
						.replaceWith(
							'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
					$(this).parent().find(
						".ui-dialog-titlebar-close").bind(
						"click",
						function() {
							$("#TicketsWithoutSOPsDialog").dialog("close");
						});
					$(this).parent().find(".ui-dialog-buttonset")
						.children().addClass("btn btn-default");
					defaultFilter.from = formatDate(new Date());
					defaultFilter.to = defaultFilter.from;
					$scope.filterCriteria = JSON.parse(JSON
						.stringify(defaultFilter));
					$scope.ticketAuditLogsWithoutSOPsByFilter = [];
				},
				close: function() {
					$scope.ticketAuditLogsWithoutSOPsByFilter = [];
				},
				dragStop: function() {
					$(this).parent().css("height", "auto");
				},
				buttons: {
					Close: function() {
						$(this).dialog("close");
					}
				}
			});
	}

	$scope.showAlertDetailsDialog = function(alertAuditLog) {
		$scope.alert = alertAuditLog;
		$("#AlertDetailsDialog")
			.dialog({
				width: 1200,
				modal: true,
				open: function() {
					$(this)
						.parent()
						.find(".ui-dialog-titlebar-close")
						.replaceWith(
							'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
					$(this).parent().find(
						".ui-dialog-titlebar-close").bind(
						"click",
						function() {
							$("#AlertDetailsDialog").dialog("close");
						});
					$(this).parent().find(".ui-dialog-buttonset")
						.children().addClass("btn btn-default");
				},
				close: function() {},
				dragStop: function() {
					$(this).parent().css("height", "auto");
				},
				buttons: {
					Close: function() {
						$(this).dialog("close");
					}
				}
			});
	}

	$scope.showTicketDetailsDialog = function(ticketAuditLog) {
		$scope.ticket = ticketAuditLog;
		$("#TicketDetailsDialog")
			.dialog({
				width: 1200,
				modal: true,
				open: function() {
					$(this)
						.parent()
						.find(".ui-dialog-titlebar-close")
						.replaceWith(
							'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
					$(this).parent().find(
						".ui-dialog-titlebar-close").bind(
						"click",
						function() {
							$("#TicketDetailsDialog").dialog("close");
						});
					$(this).parent().find(".ui-dialog-buttonset")
						.children().addClass("btn btn-default");
				},
				close: function() {},
				dragStop: function() {
					$(this).parent().css("height", "auto");
				},
				buttons: {
					Close: function() {
						$(this).dialog("close");
					}
				}
			});
	}

	$scope.showLogContent = function(ticketAuditLog) {
//		$scope.ticket = ticketAuditLog;
		var logContentUpdateInterval = null;
		$("#TicketLogDetailsDialog")
			.dialog({
				width: 1024,
//				modal: true,
				title: ticketAuditLog.ticketNumber,
				open: function() {
					$(this)
						.parent()
						.find(".ui-dialog-titlebar-close")
						.replaceWith(
							'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
					$(this).parent().find(
						".ui-dialog-titlebar-close").bind(
						"click",
						function() {
							$("#TicketLogDetailsDialog").dialog("close");
						});
					$(this).parent().find(".ui-dialog-buttonset")
						.children().addClass("btn btn-default");
					
					updateLogContent(ticketAuditLog);
					logContentUpdateInterval = setInterval(function() {
						updateLogContent(ticketAuditLog);
					}, 1000);

				},
				close: function() {
					$("#TicketLogDetailsDialog_console").empty();
					$scope.ticket = {};
					if (logContentUpdateInterval) {
						clearInterval(logContentUpdateInterval);
						logContentUpdateInterval = null;
					}
				},
				dragStop: function() {
					$(this).parent().css("height", "auto");
				},
				buttons: {
//					Close: function() {
//						$(this).dialog("close");
//					}
				}
			});
	}

	var updateLogContent = function(ticketLog) {
		
		AMAServiceMonitoringAgent.queryTicketAuditLogs({'_id':ticketLog['_id']},
			function(err, data) {

				if (!err && data && data.length != 0) {
					var ticketAuditLog = data[0];
					
					var content = assembleLogDetails_new(ticketAuditLog);
					document.getElementById("TicketLogDetailsDialog_console").innerHTML = content;

					var data = [];
					for (var j = 0; j < ticketAuditLog.logDetails.length; j++) {
						data
						.push({
							date: formatDateWithMillisecond(parseGMTDate(ticketAuditLog.logDetails[j].timestamp)),
							close: j + 1
						});
					}
					
					var margin = {top: 10, right: 20, bottom: 90, left: 30},width = 330 - margin.left - margin.right,height = 260;
					
					var x = d3.time.scale().range([0, width]);
					
					var y = d3.scale.quantile().range([260, 240, 220, 200, 180, 160, 140, 120, 100, 80, 60, 40, 20]).domain([1,2,3,4,5,6,7,8,9,10,11,12,13]);
					
					var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format('%H:%M:%S.%L'));
					
					var yAxis = d3.svg.axis().scale(y).orient("left");
					
					var line = d3.svg.line().x(function(d) { return x(d.date); }).y(function(d) { return y(d.close); });
					
					var svg = d3.select("#alertprocessingchart" + ticketAuditLog._id).append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
					
					data.forEach(function(d,i) {
						var stop = d3.time.format("%Y-%m-%d %H:%M:%S.%L").parse(d.date);
						d.date = stop;
					});
					x.domain(d3.extent(data, function(d) { return d.date; }));
					
					svg.append("g").attr("class", "x axis").attr("id", "xAxis").attr("transform", "translate(0," + (height + 10) + ")").style('fill', 'white').call(xAxis).selectAll("text").style("text-anchor", "start").attr("transform", "rotate(90) translate(10,-12)");
					
					d3.select("#xAxis").append("text").attr("x", width-10).attr("y", -10).attr("dx", ".71em").style("text-anchor", "end").style('fill', 'white').text("TIME");
					
					svg.append("g").attr("class", "y axis").attr("transform", "translate(-10, 0)").style('fill', 'white').call(yAxis).append("text").attr("transform", "translate(15, 10)").style("text-anchor", "end").style('fill', 'white').text("STEPS");
					
					svg.append("path").datum(data).attr("class", "line").attr("d", line).selectAll("path").data(data).enter().append("path").attr("transform", function(d) { return "translate(" + x(d.date) + "," + y(d.close) + ")"; }).attr("d", d3.svg.symbol());
					
					svg.selectAll(".dot").data(data).enter().append("circle").attr("class", "dot").attr("r", 3.5).attr("cx", function(d) { return x(d.date); }).attr("cy", function(d) { return y(d.close); }).style("fill", 'orange');
					
					
					var s = new sigma({
						 graph: ticketAuditLog.workflowGraph,
						 renderer: {
						   container: "workflow_view" + ticketAuditLog._id,
						   type: "canvas"
						 },
						 settings: {
						   minNodeSize: 1,
						   maxNodeSize: 10,
						   minEdgeSize: 0.1,
						   maxEdgeSize: 2,
						   sideMargin: 0.1,
						   edgeColor: "default",
						   defaultEdgeColor: "#999",
//							+ "	   enableEdgeHovering: true,"
//							+ "	   edgeHoverSizeRatio: 2,"
					    defaultLabelColor:"#aaa",
					    defaultNodeColor:"#b956af"
						 }
					});
					CustomShapes.init(s);
					s.refresh();

				}

			});

		
	}
	
	$scope.showAllAdapters = function() {
		$("#AdaptersDialog")
			.dialog({
				width: 500,
				modal: true,
				open: function() {
					$(this)
						.parent()
						.find(".ui-dialog-titlebar-close")
						.replaceWith(
							'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
					$(this).parent().find(
						".ui-dialog-titlebar-close").bind(
						"click",
						function() {
							$("#AdaptersDialog")
								.dialog("close");
						});
					$(this).parent().find(".ui-dialog-buttonset")
						.children().addClass("btn btn-default");
					// defaultFilter.from = formatDate(new Date());
					// defaultFilter.to = defaultFilter.from;
					// $scope.filterCriteria =
					// JSON.parse(JSON.stringify(defaultFilter));
					// $scope.auditLogsByFilter = [];
					// $scope.showNoData = false;
				},
				close: function() {
					// $scope.auditLogsByFilter = [];
					// $scope.showNoData = false;
				},
				dragStop: function() {
					$(this).parent().css("height", "auto");
				},
				buttons: {
					Close: function() {
						$(this).dialog("close");
					}
				}
			});
	}

	$scope.showServiceHealthDialog = function() {
		$("#ServiceStatusDialog").dialog({
			width: 500,
			modal: true,
			open: function() {
				$(this)
					.parent()
					.find(".ui-dialog-titlebar-close")
					.replaceWith(
						'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
				$(this).parent().find(
					".ui-dialog-titlebar-close").bind(
					"click",
					function() {
						$("#ServiceStatusDialog")
							.dialog("close");
					});
				$(this).parent().find(".ui-dialog-buttonset")
					.children().addClass("btn btn-default");
			},
			close: function() {},
			dragStop: function() {
				$(this).parent().css("height", "auto");
			},
			buttons: {
				Close: function() {
					$(this).dialog("close");
				}
			}
		});
	}

	// AMAServiceMonitoringAgent.getAccounts(function(err, accounts){
	// for(var i = 0 ; i < accounts.length; i ++){
	// var account = accounts[i];
	// // if(account.accountName == "inmbz2232:KUX"){ //"SAP Account"
	// $scope.accounts[account._id] = {account_id : account._id, account_name:
	// account.accountName};
	// // }
	// }
	// });

	$scope.auditLogs = [];
	$scope.auditLogsByFilter = [];
	$scope.auditLogsWithoutSOPs = [];
	$scope.auditLogsWithoutSOPsByFilter = [];
	
	$scope.ticketAuditLogs = [];
	$scope.ticketAuditLogsByFilter = [];
	$scope.ticketAuditLogsWithoutSOPs = [];
	$scope.ticketAuditLogsWithoutSOPsByFilter = [];

	$scope.showNoAlertData = false;
	$scope.showNoTicketData = false;

	$("#filter_from_input")
		.datetimepicker({
			format: "Y-m-d H:i"
		})
		.on(
			"change",
			function(e) {

				if (new Date($(this).val().replace(/-/g, "/")) == "Invalid Date") {
					showWarningMessage("The date/ time format you entered is incorrect and will reset to the current date and time!");
					$(this).val("NaN");
				} else if (!validateDate($(this).val())) {
					showWarningMessage("The date/ time format you entered is incorrect and will reset to the current date and time!");
					$(this).val("NaN");
				}

				if (!validateDates()) {
					$("#filter_from_input-wrap").addClass("has-error");
					$("#filter_from_input-wrap")
						.attr("title",
							"The \"From\" date can't be more than the \"To\" date!");
				}
			});
	$("#filter_to_input")
		.datetimepicker({
			format: "Y-m-d H:i"
		})
		.on(
			"change",
			function(e) {

				if (new Date($(this).val().replace(/-/g, "/")) == "Invalid Date") {
					showWarningMessage("The date/ time format you entered is incorrect and will reset to the current date and time!");
					$(this).val("NaN");
				} else if (!validateDate($(this).val())) {
					showWarningMessage("The date/ time format you entered is incorrect and will reset to the current date and time!");
					$(this).val("NaN");
				}

				if (!validateDates()) {
					$("#filter_to_input-wrap").addClass("has-error");
					$("#filter_to_input-wrap")
						.attr("title",
							"The \"From\" date can't be more than the \"To\" date!");
				}
			});

	var validateDate = function(dateStr) {
		var arrDateTime = dateStr.split(" ");
		var date = arrDateTime[0];
		var time = arrDateTime[1];
		var arrDate = date.split("-");
		var year = parseInt(arrDate[0]);
		var month = parseInt(arrDate[1]);
		var day = parseInt(arrDate[2]);
		var arrTime = time.split(":");
		var hour = parseInt(arrTime[0]);
		var minute = parseInt(arrTime[1]);

		if (year < 1753 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
			return false;
		} else {
			if (year % 400 == 0 || (year % 4 == 0 && year % 100 != 0)) {
				if ((month == 2 && day > 29) || ((month == 4 || month == 6 || month == 9 || month == 11) && day > 30) || ((month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) && day > 31)) {
					return false;
				} else {
					return true;
				}
			} else {
				if ((month == 2 && day > 28) || ((month == 4 || month == 6 || month == 9 || month == 11) && day > 30) || ((month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) && day > 31)) {
					return false;
				} else {
					return true;
				}
			}
		}
	}

	var validateDates = function() {

		var formDate = parseDate($("#filter_from_input").val());

		var toDate = parseDate($("#filter_to_input").val());

		var flag = formDate.getTime() <= toDate.getTime();

		if (flag) {
			$("#filter_from_input-wrap").removeClass("has-error");
			$("#filter_from_input-wrap").attr("title", "");

			$("#filter_to_input-wrap").removeClass("has-error");
			$("#filter_to_input-wrap").attr("title", "");
		}

		return flag;
	}

	var showWarningMessage = function(message) {
		$("#WarningMessageDialog").text(message).dialog({
			width: 600,
			modal: true,
			open: function() {
				$(this).parent().find(".ui-dialog-buttonset")
					.children().addClass("btn btn-default");
			},
			buttons: {
				Close: function() {
					$(this).dialog("close");
				}
			}
		});
	}

	var defaultFilter = {
		selected_apps: $scope.applications,
		refresh_strategy: "last1hour",
		from: formatDate(new Date()),
		to: formatDate(new Date())
	}

	var filterCriteria = $scope.filterCriteria = JSON.parse(JSON
		.stringify(defaultFilter));

	// AMAServiceMonitoringAgent.getApplications(function(err, data){
	// $scope.applications = [];
	// for(var i = 0 ; i < data.length ; i++){
	// $scope.applications.push({
	// application_id : data[i]._id,
	// application_name : data[i].applicationName
	// });
	// }
	// defaultFilter.selected_apps =
	// JSON.parse(JSON.stringify($scope.applications));
	// $scope.filterCriteria.selected_apps =
	// JSON.parse(JSON.stringify($scope.applications));
	// RefreshTable();
	// });

	$scope.assembleAlertWithoutSOPDetails = function(auditLogs) {
		var content = "<table>";
		for (var j = 0; j < auditLogs.length; j++) {
			content += "<tr><td width=\"50%\" valign=\"top\"> <b>" + auditLogs[j].alertName + ":</b><td width=\"10%\" valign=\"top\">" + auditLogs[j].applicationName + "</td><td valign=\"top\">" + formatDateWithMillisecond(parseGMTDate(auditLogs[j].createTime)) + "</td></tr>";
		}
		content += "</table>";
		return content;
	}

	$scope.showWorkflow = function(auditLogId) {
//		alert("showWorkflow");
		document.getElementById("logdetails_table" + auditLogId).style.display = 'none';
		document.getElementById("workflow_container" + auditLogId).style.display = '';
		var g = {nodes:[],edges:[]};
		for (var i = 0; i < $scope.ticketAuditLogs.length; i++) {
			if ($scope.ticketAuditLogs[i]._id == auditLogId) {
				g = $scope.ticketAuditLogs[i].workflowGraph;
				break;
			}
		}
		var s = new sigma({
			 graph: g,
			 renderer: {
			   container: 'workflow_container' + auditLogId,
			   type: 'canvas'
			 },
			 settings: {
			   minNodeSize: 1,
			   maxNodeSize: 10,
			   minEdgeSize: 0.1,
			   maxEdgeSize: 2,
			   sideMargin: 0.1,
			   edgeColor: 'default',
			   defaultEdgeColor: '#999'
			 }
		});
		CustomShapes.init(s);
		s.refresh();
	}
	
	$scope.showLogDetails = function(auditLogId) {
//		alert("showLogDetails");
		document.getElementById("logdetails_table" + auditLogId).style.display = '';
		document.getElementById("workflow_container" + auditLogId).style.display = 'none';
	}
	
	$scope.assembleLogDetails = function(auditLog) {
		var	content = "<table id='logdetails_table" + auditLog._id + "'><tr><td width=\"65%\"><table>";
		if (auditLog.automationProvider == "Workflow") {
			content += "<tr><td width=\"15%\"><a role=\"button\" onclick='javascript:document.getElementById(\"" + "logdetails_table" + auditLog._id + "\").style.display = \"none\";document.getElementById(\"" + "workflow_container" + auditLog._id + "\").style.display = \"\";" +
			"var s = new sigma({"
			+ "	 graph: " + JSON.stringify(auditLog.workflowGraph) + ","
			+ "	 renderer: {"
			+ "	   container: \"workflow_view" + auditLog._id + "\","
			+ "	   type: \"canvas\""
			+ "	 },"
			+ "	 settings: {"
			+ "	   minNodeSize: 1,"
			+ "	   maxNodeSize: 10,"
			+ "	   minEdgeSize: 0.1,"
			+ "	   maxEdgeSize: 2,"
			+ "	   sideMargin: 0.1,"
			+ "	   edgeColor: \"default\","
			+ "	   defaultEdgeColor: \"#999\","
//					+ "	   enableEdgeHovering: true,"
//					+ "	   edgeHoverSizeRatio: 2,"
			+ "    defaultLabelColor:\"#aaa\","
			+ "    defaultNodeColor:\"#b956af\""
			+ "	 }"
			+ "});"
			+ "CustomShapes.init(s);"
			+ "s.refresh();' class=\"btn btn-success\">Workflow</a></td><td width=\"60%\" valign=\"top\"></td></tr>"
		}
		
		var data = [];
		for (var j = 0; j < auditLog.logDetails.length; j++) {
			content += "<tr><td width=\"15%\" valign=\"top\"> <b>STEP" + (j + 1) + ":</b><td width=\"60%\" valign=\"top\">" + auditLog.logDetails[j].message + "</td><td valign=\"top\">" + formatDateWithMillisecond(parseGMTDate(auditLog.logDetails[j].timestamp)) + "</td></tr>";
			data
			.push({
				date: formatDateWithMillisecond(parseGMTDate(auditLog.logDetails[j].timestamp)),
				close: j + 1
			});
		}
		content += "</table></td><td id=\"alertprocessingchart" + auditLog._id + "\"></td></tr></table>";
		
		content += "<script>" + "var margin = {top: 10, right: 20, bottom: 90, left: 30},width = 330 - margin.left - margin.right,height = 260;"
		
		+ "var x = d3.time.scale().range([0, width]);"
		
		+ "var y = d3.scale.quantile().range([260, 240, 220, 200, 180, 160, 140, 120, 100, 80, 60, 40, 20]).domain([1,2,3,4,5,6,7,8,9,10,11,12,13]);"
		
		+ "var xAxis = d3.svg.axis().scale(x).orient(\"bottom\").tickFormat(d3.time.format('%H:%M:%S.%L'));"
		
		+ "var yAxis = d3.svg.axis().scale(y).orient(\"left\");"
		
		+ "var line = d3.svg.line().x(function(d) { return x(d.date); }).y(function(d) { return y(d.close); });"
		
		+ "var svg = d3.select(\"#alertprocessingchart" + auditLog._id + "\").append(\"svg\").attr(\"width\", width + margin.left + margin.right).attr(\"height\", height + margin.top + margin.bottom).append(\"g\").attr(\"transform\", \"translate(\" + margin.left + \",\" + margin.top + \")\");"
		
		+ "var data = " + JSON.stringify(data) + ";"
		+ "data.forEach(function(d,i) {" + "var stop = d3.time.format(\"%Y-%m-%d %H:%M:%S.%L\").parse(d.date);"
		+ "d.date = stop;"
		+ "});"
		+ "x.domain(d3.extent(data, function(d) { return d.date; }));"
		
		+ "svg.append(\"g\").attr(\"class\", \"x axis\").attr(\"id\", \"xAxis\").attr(\"transform\", \"translate(0,\" + (height + 10) + \")\").style('fill', 'white').call(xAxis).selectAll(\"text\").style(\"text-anchor\", \"start\").attr(\"transform\", \"rotate(90) translate(10,-12)\");"
		
		+ "d3.select(\"#xAxis\").append(\"text\").attr(\"x\", width-10).attr(\"y\", -10).attr(\"dx\", \".71em\").style(\"text-anchor\", \"end\").style('fill', 'white').text(\"TIME\");"
		
		+ "svg.append(\"g\").attr(\"class\", \"y axis\").attr(\"transform\", \"translate(-10, 0)\").style('fill', 'white').call(yAxis).append(\"text\").attr(\"transform\", \"translate(15, 10)\").style(\"text-anchor\", \"end\").style('fill', 'white').text(\"STEPS\");"
		
		+ "svg.append(\"path\").datum(data).attr(\"class\", \"line\").attr(\"d\", line).selectAll(\"path\").data(data).enter().append(\"path\").attr(\"transform\", function(d) { return \"translate(\" + x(d.date) + \",\" + y(d.close) + \")\"; }).attr(\"d\", d3.svg.symbol());"
		
		+ "svg.selectAll(\".dot\").data(data).enter().append(\"circle\").attr(\"class\", \"dot\").attr(\"r\", 3.5).attr(\"cx\", function(d) { return x(d.date); }).attr(\"cy\", function(d) { return y(d.close); }).style(\"fill\", 'orange');"
		
		+ "</script>";
		
		if (auditLog.automationProvider == "Workflow") {
			var color = '';
			if (auditLog.remediationState.toLowerCase()=="completed") {
				color = '#617db4';
			} else if (auditLog.remediationState.toLowerCase()=="in progress") {
				color = '#668f3c';
			} else if (auditLog.remediationState.toLowerCase()=="error") {
				color = '#c6583e';
			} else {
				color = '#b956af';
			}
			
			content = content
			+ "      <table id='workflow_container" + auditLog._id + "' style='display:none'><tr><td><table>"
			+ "        <tr><td width=\"10%\"><a role=\"button\" onclick=\"javascript:document.getElementById('" + "logdetails_table" + auditLog._id + "').style.display = '';document.getElementById('" + "workflow_container" + auditLog._id + "').style.display = 'none';\" class=\"btn btn-success\">Log Details</a></td><td width=\"75%\" style=\"text-align:center;\"><b>" + auditLog.workflowGraph.SOPName + "</b></td><td></td></tr>"
			+ "        <tr><td></td><td><div id='workflow_view" + auditLog._id + "' style='height:300px;'></div></td><td valign=\"top\">Overall Status:<br><span style='color:" + color + "'><b>" + auditLog.remediationState + "</b></span></td></tr></table></td></tr>"
			+ "<script></script></table>";
		}
		return content;
	}

	var assembleLogDetails_new = function(auditLog) {
		var logDetailsElement = document.getElementById('logdetails_table' + auditLog._id);
		var displayLogDetails = "";
		if (logDetailsElement != null) {
			displayLogDetails = logDetailsElement.style.display;
			if (displayLogDetails == null) displayLogDetails = "";
		}
		var	content = "<table id='logdetails_table" + auditLog._id + "' style='display:" + displayLogDetails + "'><tr><td width=\"65%\"><table>";
		if (auditLog.automationProvider == "Workflow") {
			content += "<tr><td width=\"15%\"><a role=\"button\" onclick='javascript:document.getElementById(\"" + "logdetails_table" + auditLog._id + "\").style.display = \"none\";document.getElementById(\"" + "workflow_container" + auditLog._id + "\").style.display = \"\";" +
			"var s = new sigma({"
			+ "	 graph: " + JSON.stringify(auditLog.workflowGraph) + ","
			+ "	 renderer: {"
			+ "	   container: \"workflow_view" + auditLog._id + "\","
			+ "	   type: \"canvas\""
			+ "	 },"
			+ "	 settings: {"
			+ "	   minNodeSize: 1,"
			+ "	   maxNodeSize: 10,"
			+ "	   minEdgeSize: 0.1,"
			+ "	   maxEdgeSize: 2,"
			+ "	   sideMargin: 0.1,"
			+ "	   edgeColor: \"default\","
			+ "	   defaultEdgeColor: \"#999\","
//					+ "	   enableEdgeHovering: true,"
//					+ "	   edgeHoverSizeRatio: 2,"
			+ "    defaultLabelColor:\"#aaa\","
			+ "    defaultNodeColor:\"#b956af\""
			+ "	 }"
			+ "});"
			+ "CustomShapes.init(s);"
			+ "s.refresh();" +
					"' class=\"btn btn-success\">Workflow</a></td><td width=\"60%\" valign=\"top\"></td></tr>"
		}
		
		var data = [];
		for (var j = 0; j < auditLog.logDetails.length; j++) {
			content += "<tr><td width=\"15%\" valign=\"top\"> <b>STEP" + (j + 1) + ":</b><td width=\"60%\" valign=\"top\">" + auditLog.logDetails[j].message + "</td><td valign=\"top\">" + formatDateWithMillisecond(parseGMTDate(auditLog.logDetails[j].timestamp)) + "</td></tr>";
		}
		content += "</table></td><td id=\"alertprocessingchart" + auditLog._id + "\"></td></tr></table>";
		
		if (auditLog.automationProvider == "Workflow") {
			var color = '';
			if (auditLog.remediationState.toLowerCase()=="completed") {
				color = '#617db4';
			} else if (auditLog.remediationState.toLowerCase()=="in progress") {
				color = '#668f3c';
			} else if (auditLog.remediationState.toLowerCase()=="error") {
				color = '#c6583e';
			} else {
				color = '#b956af';
			}
			
			var workflowElement = document.getElementById('workflow_container' + auditLog._id);
			var displayWorkflow = "none";
			if (workflowElement != null) {
				displayWorkflow = workflowElement.style.display;
				if (displayWorkflow == null) displayWorkflow = "";
			}
			content = content
			+ "      <table id='workflow_container" + auditLog._id + "' style='display:" + displayWorkflow + "'><tr><td><table>"
//			+ "        <tr><td width=\"10%\"><a role=\"button\" onclick=\"javascript:document.getElementById('" + "logdetails_table" + auditLog._id + "').style.display = '';document.getElementById('" + "workflow_container" + auditLog._id + "').style.display = 'none';\" class=\"btn btn-success\">Log Details</a></td><td width=\"75%\" style=\"text-align:center;\"><b>" + auditLog.workflowGraph.SOPName + "</b></td><td></td></tr>"
			+ "        <tr><td width=\"10%\"><a role=\"button\" onclick=\"javascript:document.getElementById('" + "logdetails_table" + auditLog._id + "').style.display = '';document.getElementById('" + "workflow_container" + auditLog._id + "').style.display = 'none';\" class=\"btn btn-success\">Log Details</a></td><td width=\"75%\" style=\"text-align:center;\"><b></b></td><td></td></tr>"
			+ "        <tr><td></td><td><div id='workflow_view" + auditLog._id + "' style='height:300px;'></div></td><td valign=\"top\">Overall Status:<br><span style='color:" + color + "'><b>" + auditLog.remediationState + "</b></span></td></tr></table></td></tr>"
			+ "<script>"
//			+ "var s = new sigma({"
//			+ "	 graph: " + JSON.stringify(auditLog.workflowGraph) + ","
//			+ "	 renderer: {"
//			+ "	   container: \"workflow_view" + auditLog._id + "\","
//			+ "	   type: \"canvas\""
//			+ "	 },"
//			+ "	 settings: {"
//			+ "	   minNodeSize: 1,"
//			+ "	   maxNodeSize: 10,"
//			+ "	   minEdgeSize: 0.1,"
//			+ "	   maxEdgeSize: 2,"
//			+ "	   sideMargin: 0.1,"
//			+ "	   edgeColor: \"default\","
//			+ "	   defaultEdgeColor: \"#999\","
////					+ "	   enableEdgeHovering: true,"
////					+ "	   edgeHoverSizeRatio: 2,"
//			+ "    defaultLabelColor:\"#aaa\","
//			+ "    defaultNodeColor:\"#b956af\""
//			+ "	 }"
//			+ "});"
//			+ "s.refresh();"
			+ "</script></table>";
		}
		return content;
	}

	$scope.assembleLogDetails_bak = function(auditLog) {
		var	content = "<table id='logdetails_table" + auditLog._id + "'><tr><td width=\"65%\"><table>";
		if (auditLog.automationProvider == "Workflow") {
//			content += "<tr><td width=\"15%\"><button type='button' ng-click=\"showWorkflow('" + auditLog._id + "')\" class=\"btn btn-success\">Workflow</button></td><td width=\"60%\" valign=\"top\"></td></tr>"
//			content += "<tr><td width=\"15%\"><a role=\"button\" onclick=\"javascript:document.getElementById('" + "logdetails_table" + auditLog._id + "').style.display = 'none';document.getElementById('" + "workflow_container" + auditLog._id + "').style.display = '';setTimeout(function(){var w=document.getElementById('" + "workflow_container" + auditLog._id + "').clientWidth; console.log(w); document.getElementById('" + "workflow_container" + auditLog._id + "').style.width=(w-1)+'px';}, 500);" +
			content += "<tr><td width=\"15%\"><a role=\"button\" onclick='javascript:document.getElementById(\"" + "logdetails_table" + auditLog._id + "\").style.display = \"none\";document.getElementById(\"" + "workflow_container" + auditLog._id + "\").style.display = \"\";" +
			"var s = new sigma({"
			+ "	 graph: " + JSON.stringify(auditLog.workflowGraph) + ","
			+ "	 renderer: {"
			+ "	   container: \"workflow_container" + auditLog._id + "\","
			+ "	   type: \"canvas\""
			+ "	 },"
			+ "	 settings: {"
			+ "	   minNodeSize: 1,"
			+ "	   maxNodeSize: 10,"
			+ "	   minEdgeSize: 0.1,"
			+ "	   maxEdgeSize: 2,"
			+ "	   sideMargin: 0.1,"
			+ "	   edgeColor: \"default\","
			+ "	   defaultEdgeColor: \"#999\""
//					+ "	   enableEdgeHovering: true,"
//					+ "	   edgeHoverSizeRatio: 2,"
//					+ "    defaultNodeColor:'#ec5148'"
			+ "	 }"
			+ "});"
			+ "CustomShapes.init(s);"
			+ "s.refresh();" +
//
					"' class=\"btn btn-success\">Workflow</a></td><td width=\"65%\" valign=\"top\"></td><td>Overall Status:<br>" + auditLog.remediationState + "</td></tr>"
		}
		
		var data = [];
		for (var j = 0; j < auditLog.logDetails.length; j++) {
			content += "<tr><td width=\"15%\" valign=\"top\"> <b>STEP" + (j + 1) + ":</b><td width=\"60%\" valign=\"top\">" + auditLog.logDetails[j].message + "</td><td valign=\"top\">" + formatDateWithMillisecond(parseGMTDate(auditLog.logDetails[j].timestamp)) + "</td></tr>";
			data
			.push({
				date: formatDateWithMillisecond(parseGMTDate(auditLog.logDetails[j].timestamp)),
				close: j + 1
			});
		}
		content += "</table></td><td id=\"alertprocessingchart" + auditLog._id + "\"></td></tr></table>";
		
		content += "<script>" + "var margin = {top: 10, right: 20, bottom: 90, left: 30},width = 330 - margin.left - margin.right,height = 260;"
		
		+ "var x = d3.time.scale().range([0, width]);"
		
		+ "var y = d3.scale.quantile().range([260, 240, 220, 200, 180, 160, 140, 120, 100, 80, 60, 40, 20]).domain([1,2,3,4,5,6,7,8,9,10,11,12,13]);"
		
		+ "var xAxis = d3.svg.axis().scale(x).orient(\"bottom\").tickFormat(d3.time.format('%H:%M:%S.%L'));"
		
		+ "var yAxis = d3.svg.axis().scale(y).orient(\"left\");"
		
		+ "var line = d3.svg.line().x(function(d) { return x(d.date); }).y(function(d) { return y(d.close); });"
		
		+ "var svg = d3.select(\"#alertprocessingchart" + auditLog._id + "\").append(\"svg\").attr(\"width\", width + margin.left + margin.right).attr(\"height\", height + margin.top + margin.bottom).append(\"g\").attr(\"transform\", \"translate(\" + margin.left + \",\" + margin.top + \")\");"
		
		+ "var data = " + JSON.stringify(data) + ";"
		// + "var start = d3.time.format(\"%Y-%m-%d
		// %H:%M:%S\").parse(data[0].date);"
		+ "data.forEach(function(d,i) {" + "var stop = d3.time.format(\"%Y-%m-%d %H:%M:%S.%L\").parse(d.date);"
		// + "var stop = d3.time.format(\"%Y-%m-%d
		// %H:%M:%S\").parse(d.date+\":\"+i);"
		// + "d.date = d3.time.second.range(start, stop);"
		+ "d.date = stop;"
		// + "d.close = i+1;"
		+ "});"
		// + "debugger;"
		+ "x.domain(d3.extent(data, function(d) { return d.date; }));"
		// + "y.domain(d3.extent(data, function(d) { return d.close;
		// }));"
		
		// + "svg.append(\"g\").attr(\"class\", \"x
		// axis\").attr(\"transform\", \"translate(0,\" + height +
		// \")\").call(xAxis);"
		+ "svg.append(\"g\").attr(\"class\", \"x axis\").attr(\"id\", \"xAxis\").attr(\"transform\", \"translate(0,\" + (height + 10) + \")\").style('fill', 'white').call(xAxis).selectAll(\"text\").style(\"text-anchor\", \"start\").attr(\"transform\", \"rotate(90) translate(10,-12)\");"
		
		+ "d3.select(\"#xAxis\").append(\"text\").attr(\"x\", width-10).attr(\"y\", -10).attr(\"dx\", \".71em\").style(\"text-anchor\", \"end\").style('fill', 'white').text(\"TIME\");"
		
		+ "svg.append(\"g\").attr(\"class\", \"y axis\").attr(\"transform\", \"translate(-10, 0)\").style('fill', 'white').call(yAxis).append(\"text\").attr(\"transform\", \"translate(15, 10)\").style(\"text-anchor\", \"end\").style('fill', 'white').text(\"STEPS\");"
		
		+ "svg.append(\"path\").datum(data).attr(\"class\", \"line\").attr(\"d\", line).selectAll(\"path\").data(data).enter().append(\"path\").attr(\"transform\", function(d) { return \"translate(\" + x(d.date) + \",\" + y(d.close) + \")\"; }).attr(\"d\", d3.svg.symbol());"
		
		+ "svg.selectAll(\".dot\").data(data).enter().append(\"circle\").attr(\"class\", \"dot\").attr(\"r\", 3.5).attr(\"cx\", function(d) { return x(d.date); }).attr(\"cy\", function(d) { return y(d.close); }).style(\"fill\", 'orange');"
		
		+ "</script>";
		
		if (auditLog.automationProvider == "Workflow") {
			content = content
//			+ "<div id='logdetails_tabs'>"
//			+ "  <ul class='nav nav-tabs' role='tablist'>"
//			+ "	   <li role='presentation' class='active'><a href='#console_tab' aria-controls='home' role='tab' data-toggle='tab'>Log Details</a></li>"
//			+ "	   <li role='presentation'><a href='#workflow_tab' aria-controls='home' role='tab' data-toggle='tab'>Workflow</a></li>"
//			+ "  </ul>"
//			+ "  <div class='tab-content'>"
//			+ "    <div role='tabpanel' class='tab-pane active' id='console_tab'>"
//			+ "      <table>"
//			+ content
//			+ "      </table>"
//			+ "    </div>"
//			+ "	   <div role='tabpanel' class='tab-pane' id='workflow_tab'>"
			+ "      <div id='workflow_container" + auditLog._id + "' style='height:200px;display:none'>"
//			+ "        <a role=\"button\" ng-click='showLogDetails(\"" + auditLog._id + "\")' class=\"btn btn-success\">Log Details</a>"
			+ "        <a role=\"button\" onclick=\"javascript:document.getElementById('" + "logdetails_table" + auditLog._id + "').style.display = '';document.getElementById('" + "workflow_container" + auditLog._id + "').style.display = 'none';\" class=\"btn btn-success\">Log Details</a>"
			+ "<script>"
//				+ "sigma.parsers.json(\"/rest/GetWorkflowGraph\", {container:'container',settings:{defaultNodeColor:'#ec5148',minArrowSize:3}}, function(s){"
//			+ "var i,"
//			+ "s,"
//			+ "g = " + JSON.stringify(auditLog.workflowGraph) + ";"
////					+ "g = {"
////					+ "  nodes: [],"
////					+ "  edges: []"
////					+ "};"
////					+ "for (i = 0; i < 4; i++) {"
////					+ "  g.nodes.push({"
////					+ "    id: 'n' + i,"
////					+ "    label: 'Robot' + (i + 1),"
////					+ "    x: i,"
////					+ "    y: 0,"
////					+ "    color: ['#617db4','#668f3c','#c6583e','#b956af'][i],"
////					+ "    size: 1"
////					+ "  });"
////					+ "};"
////					+ "  g.nodes.push({"
////					+ "    id: 'n' + 4,"
////					+ "    label: 'Robot' + (4 + 1),"
////					+ "    x: 3,"
////					+ "    y: 1,"
////					+ "    color: ['#617db4','#668f3c','#c6583e','#b956af'][0],"
////					+ "    size: 1"
////					+ "  });"
////					+ "for (i = 0; i < 3; i++) {"
////					+ "  g.edges.push({"
////					+ "    id: 'e' + i,"
////					+ "    source: 'n' + i,"
////					+ "    target: 'n' + (i + 1),"
////					+ "    type: ["
////					+ "      'line',"
////					+ "      'curve',"
////					+ "      'arrow',"
////					+ "      'curvedArrow',"
////					+ "      'dashed',"
////					+ "      'dotted',"
////					+ "      'parallel',"
////					+ "      'tapered'"
////					+ "    ][2],"
//////					+ "    color: 'ec5148',"
////					+ "    size: 10"
////					+ "  });"
////					+ "};"
//			+ "s = new sigma({"
//			+ "	 graph: g,"
//			+ "	 renderer: {"
//			+ "	   container: 'workflow_container" + auditLog._id + "',"
//			+ "	   type: 'canvas'"
//			+ "	 },"
//			+ "	 settings: {"
//			+ "	   minNodeSize: 1,"
//			+ "	   maxNodeSize: 10,"
//			+ "	   minEdgeSize: 0.1,"
//			+ "	   maxEdgeSize: 2,"
//			+ "	   sideMargin: 0.1,"
//			+ "	   edgeColor: 'default',"
//			+ "	   defaultEdgeColor: '#999'"
////					+ "	   enableEdgeHovering: true,"
////					+ "	   edgeHoverSizeRatio: 2,"
////					+ "    defaultNodeColor:'#ec5148'"
//			+ "	 }"
//			+ "});"
//			+ "s.refresh();"
//			
////					+ "s.startForceAtlas2();"
//			
////					+ "var noverlapListener = s.configNoverlap({"
////					+ "	  nodeMargin: 0.1,"
////					+ "	  scaleNodes: 1.05,"
////					+ "	  gridSize: 75,"
////					+ "	  easing: 'quadraticInOut',"
////					+ "	  duration: 10000"
////					+ "	});"
////					+ "	noverlapListener.bind('start stop interpolate', function(e) {"
////					+ "	  console.log(e.type);"
////					+ "	  if(e.type === 'start') {"
////					+ "	    console.time('noverlap');"
////					+ "	  }"
////					+ "	  if(e.type === 'interpolate') {"
////					+ "	    console.timeEnd('noverlap');"
////					+ "	  }"
////					+ "	});"
////					+ "	s.startNoverlap();"
//			
////				+ "var config = {"
////				+ "  \"nodeMargin\": 3.0,"
////				+ "  \"scaleNodes\": 1.3"
////				+ "};"
////				+ "var listener = s.configNoverlap(config);"
////				+ "listener.bind('start stop interpolate', function(event) {"
////				+ "  console.log(event.type);"
////				+ "});"
////				+ "s.startNoverlap();"
////				+ "});"
			+ "</script></div>" 
//			+ "</div></div></div>";
//				return content;
		}

//			$compile()(scope);
			return content;
			
//		}
	}

//	$scope.assembleLogDetails2 = function(auditLog) {
//		
//			var content = "<div id=\"container\" style=\"height:200px\"><script>"
//
//				+ "var i,"
//				+ "s,"
//				+ "g = {"
//				+ "  nodes: [],"
//				+ "  edges: []"
//				+ "};"
//				+ "for (i = 0; i < 4; i++) {"
//				+ "  g.nodes.push({"
//				+ "    id: 'n' + i,"
//				+ "    label: 'Robot' + (i + 1),"
//				+ "    x: i,"
//				+ "    y: 0,"
//				+ "    color: ['#617db4','#668f3c','#c6583e','#b956af'][i],"
//				+ "    size: 1"
//				+ "  });"
//				+ "};"
//				+ "  g.nodes.push({"
//				+ "    id: 'n' + 4,"
//				+ "    label: 'Robot' + (4 + 1),"
//				+ "    x: 3,"
//				+ "    y: 1,"
//				+ "    color: ['#617db4','#668f3c','#c6583e','#b956af'][0],"
//				+ "    size: 1"
//				+ "  });"
//				+ "for (i = 0; i < 3; i++) {"
//				+ "  g.edges.push({"
//				+ "    id: 'e' + i,"
//				+ "    source: 'n' + i,"
//				+ "    target: 'n' + (i + 1),"
//				+ "    type: ["
//				+ "      'line',"
//				+ "      'curve',"
//				+ "      'arrow',"
//				+ "      'curvedArrow',"
//				+ "      'dashed',"
//				+ "      'dotted',"
//				+ "      'parallel',"
//				+ "      'tapered'"
//				+ "    ][2],"
////				+ "    color: 'ec5148',"
//				+ "    size: 10"
//				+ "  });"
//				+ "};"
//					+ "    s = new sigma({"
//					+ "	     graph: g,"
//					+ "	     renderer: {"
//					+ "	       container: 'container',"
//					+ "	       type: 'canvas'"
//					+ "	     },"
//					+ "	     settings: {"
//					+ "	       minNodeSize: 1,"
//					+ "	       maxNodeSize: 10,"
//					+ "	       minEdgeSize: 0.1,"
//					+ "	       maxEdgeSize: 2,"
//					+ "	       sideMargin: 0.1,"
//					+ "	       edgeColor: 'default',"
//					+ "	       defaultEdgeColor: '#999'"
//					+ "	     }"
//					+ "    });"
//					+ "  }"
//					+ "});";
//				content += "</script></div>";
//				return content;
//	}

	var lock = false;
	var auditLogsWithoutSOPsLock = false;
	var ticketAuditLogsWithoutSOPsLock = false;
	var interval = null;
	var executeQuery = function(queryCriteria) {
		if (!lock) {
			lock = true;
			AMAServiceMonitoringAgent.queryAlertAuditLogs(queryCriteria,
				function(err, data) {

					$scope.auditLogs = data;

//					setInterval(function() {
						$('[data-toggle="popover"]').popover({});
//					}, 1000);

					lock = false;
				});

			AMAServiceMonitoringAgent.queryTicketAuditLogs(queryCriteria,
					function(err, data) {

						$scope.ticketAuditLogs = data;

						setInterval(function() {
							$('[data-toggle="popover"]').popover({});
						}, 10000);

						lock = false;
					});

			AMAServiceMonitoringAgent
				.getAdapterStatus(function(err, data) {
					// for (var adapter in data) {
					// $('#'+adapter).attr("class","health " +
					// (data[adapter]?"green":"red"));
					// }
					//				
					// data = {"SAP Account" : {"SolManODataAlert" : true},
					// "SAP" : {"SolManODataAlert" : false}};
					var adapter_status = {};
					$scope.adapters = [];
					if ($scope.account["account_name"]) {
						var account = $scope.account;
						if (data[account.account_name]) {
							for (var adapter in data[account.account_name]) {
								if (!adapter_status[adapter])
									adapter_status[adapter] = "grey";
								if (adapter_status[adapter] == "yellow") {
									adapter_status[adapter] = "yellow";
								} else if (data[account.account_name][adapter] && adapter_status[adapter] == "grey") {
									adapter_status[adapter] = "green";
								} else if (data[account.account_name][adapter] && adapter_status[adapter] == "green") {
									adapter_status[adapter] = "green";
								} else if (data[account.account_name][adapter] && adapter_status[adapter] == "red") {
									adapter_status[adapter] = "yellow";
								} else if (!data[account.account_name][adapter] && adapter_status[adapter] == "grey") {
									adapter_status[adapter] = "red";
								} else if (!data[account.account_name][adapter] && adapter_status[adapter] == "red") {
									adapter_status[adapter] = "red";
								} else if (!data[account.account_name][adapter] && adapter_status[adapter] == "green") {
									adapter_status[adapter] = "yellow";
								}
							}
							for (var adapter in adapter_status) {
								if ($scope.adapters.length < 2) {
									$('#' + adapter)
										.attr(
											"class",
											"health " + (adapter_status[adapter]));
									$('#' + adapter).attr("style",
										"display;");
								} else {
									$('#MoreAdapters').attr("style",
										"display;");
								}

								$scope.adapters
									.push({
										name: (adapter == "SolManODataAlert") ? "SAP SolMan" : (adapter == "ITMRESTAlert") ? "IBM Tivoli" : (adapter == "SQLAlert") ? "Database" : (adapter == "NetCoolHttpOSLCAlert") ? "Netcool" :  (adapter == "ServiceNowRESTAlert") ? "ServiceNow" : (adapter == "ScheduledMaintenanceAlert") ? "Scheduled Job" : adapter,
										status: adapter_status[adapter]
									});
							}
						}
					} else {
						for (var accountId in $scope.accounts) {
							var account = $scope.accounts[accountId];
							if (data[account.account_name]) {
								for (var adapter in data[account.account_name]) {
									if (!adapter_status[adapter])
										adapter_status[adapter] = "grey";
									if (adapter_status[adapter] == "yellow") {
										adapter_status[adapter] = "yellow";
									} else if (data[account.account_name][adapter] && adapter_status[adapter] == "grey") {
										adapter_status[adapter] = "green";
									} else if (data[account.account_name][adapter] && adapter_status[adapter] == "green") {
										adapter_status[adapter] = "green";
									} else if (data[account.account_name][adapter] && adapter_status[adapter] == "red") {
										adapter_status[adapter] = "yellow";
									} else if (!data[account.account_name][adapter] && adapter_status[adapter] == "grey") {
										adapter_status[adapter] = "red";
									} else if (!data[account.account_name][adapter] && adapter_status[adapter] == "red") {
										adapter_status[adapter] = "red";
									} else if (!data[account.account_name][adapter] && adapter_status[adapter] == "green") {
										adapter_status[adapter] = "yellow";
									}
									$('#' + adapter)
										.attr(
											"class",
											"health " + (data[account.account_name][adapter] ? "green" : "red"));
								}
							}
						}
						for (var adapter in adapter_status) {
							if ($scope.adapters.length < 2) {
								$('#' + adapter)
									.attr(
										"class",
										"health " + (adapter_status[adapter]));
								$('#' + adapter).attr("style", "display;");
							} else {
								$('#MoreAdapters')
									.attr("style", "display;");
							}
							$scope.adapters
								.push({
									name: (adapter == "SolManODataAlert") ? "SAP SolMan" : (adapter == "ITMRESTAlert") ? "IBM Tivoli" : (adapter == "SQLAlert") ? "Database" : (adapter == "NetCoolHttpOSLCAlert") ? "Netcool" : (adapter == "ServiceNowRESTAlert") ? "ServiceNow" : (adapter == "ScheduledMaintenanceAlert") ? "Scheduled Job" : adapter,
									status: adapter_status[adapter]
								});
						}
					}
				});
		}

		if (!auditLogsWithoutSOPsLock) {
			auditLogsWithoutSOPsLock = true;
			AMAServiceMonitoringAgent.queryAlertAuditLogsWithoutSOPs(
				queryCriteria,
				function(err, data) {
					$scope.auditLogsWithoutSOPs = data;
//					setInterval(function() {
						$('[data-toggle="popover"]').popover({});
//					}, 1000);
					auditLogsWithoutSOPsLock = false;
				});
		}

		if (!ticketAuditLogsWithoutSOPsLock) {
			ticketAuditLogsWithoutSOPsLock = true;
			AMAServiceMonitoringAgent.queryTicketAuditLogsWithoutSOPs(
				queryCriteria,
				function(err, data) {
					$scope.ticketAuditLogsWithoutSOPs = data;
//					setInterval(function() {
						$('[data-toggle="popover"]').popover({});
//					}, 1000);
					ticketAuditLogsWithoutSOPsLock = false;
				});
		}
	}

	$scope.lastUpdateTimestamp = new Date();
	$scope.instanceMessages = [];

	var changeNotificationLock = false;
	var changeNotificationHalfLock = false;

	var trackChanges = function(queryCriteria) {
		if (!changeNotificationLock) {

			changeNotificationLock = true;

			var queryCriteria = {};

			queryCriteria["account_id"] = $scope.account.account_id;
			queryCriteria["accountName"] = $scope.account.account_name;
			queryCriteria["applications"] = [];
			queryCriteria["applicationNames"] = [];
			angular.forEach($scope.applications, function(app) {
				queryCriteria["applications"].push(app.application_id);
				queryCriteria["applicationNames"].push(app.application_name);
			});

			var to = new Date();
			var from = new Date($scope.lastUpdateTimestamp.getTime() - 1 * 1000);

			queryCriteria["updateTimestampFrom"] = new Date(from);
			queryCriteria["updateTimestampTo"] = new Date(to);

			$scope.lastUpdateTimestamp = to;

			AMAServiceMonitoringAgent.queryAlertAuditLogsWithoutSOPs(
				queryCriteria,
				function(err, data) {
					var updatedAuditLogsWithoutSOPsWithErrors = data;

					if (updatedAuditLogsWithoutSOPsWithErrors != null && updatedAuditLogsWithoutSOPsWithErrors.length > 0) {
						var msg = updatedAuditLogsWithoutSOPsWithErrors.length + " arrived alerts don't have matched SOPs. ";
						$scope.instanceMessages[$scope.instanceMessages.length] = msg;
					}

					if (changeNotificationHalfLock == false) {
						changeNotificationHalfLock = true;
					} else {
						changeNotificationLock = false;
						changeNotificationHalfLock = false;
						if ($scope.instanceMessages.length > 0) {
							alertService.add($scope.instanceMessages);
							$scope.instanceMessages = [];
						}

					}
				});

			AMAServiceMonitoringAgent.queryTicketAuditLogsWithoutSOPs(
					queryCriteria,
					function(err, data) {
						var updatedTicketAuditLogsWithoutSOPsWithErrors = data;

						if (updatedTicketAuditLogsWithoutSOPsWithErrors != null && updatedTicketAuditLogsWithoutSOPsWithErrors.length > 0) {
							var msg = updatedTicketAuditLogsWithoutSOPsWithErrors.length + " arrived tickets don't have matched SOPs. ";
							$scope.instanceMessages[$scope.instanceMessages.length] = msg;
						}

						if (changeNotificationHalfLock == false) {
							changeNotificationHalfLock = true;
						} else {
							changeNotificationLock = false;
							changeNotificationHalfLock = false;
							if ($scope.instanceMessages.length > 0) {
								alertService.add($scope.instanceMessages);
								$scope.instanceMessages = [];
							}

						}
					});

			queryCriteria["status"] = "Error";
			AMAServiceMonitoringAgent.queryAlertAuditLogs(
				queryCriteria,
				function(err, data) {
					var updatedAuditLogsWithErrors = data;

					if (updatedAuditLogsWithErrors != null && updatedAuditLogsWithErrors.length > 0) {
						var msg = "Errors happened during the remediation processes of " + updatedAuditLogsWithErrors.length + " alerts.";
						$scope.instanceMessages[$scope.instanceMessages.length] = msg;
					}

					if (changeNotificationHalfLock == false) {
						changeNotificationHalfLock = true;
					} else {
						changeNotificationLock = false;
						changeNotificationHalfLock = false;
						if ($scope.instanceMessages.length > 0) {
							alertService.add($scope.instanceMessages);
							$scope.instanceMessages = [];
						}
					}
				});
		}
	}

	$scope.RefreshInterval = null;
	var RefreshTable = function(isImmediate) {
		var queryCriteria = {};

		queryCriteria["account_id"] = $scope.account.account_id;
		queryCriteria["accountName"] = $scope.account.account_name;
		queryCriteria["applications"] = [];
		queryCriteria["applicationNames"] = [];
		angular.forEach($scope.applications, function(app) {
			queryCriteria["applications"].push(app.application_id);
			queryCriteria["applicationNames"].push(app.application_name);
		});

		if ($scope.RefreshInterval) {
			clearInterval($scope.RefreshInterval);
		}

		queryCriteria["from"] = parseDate($scope.filterCriteria.from);
		queryCriteria["to"] = parseDate($scope.filterCriteria.to);
		executeQuery(queryCriteria);

		var logic = function() {
			var to = new Date();
			var from = new Date(to.getTime() - 60 * 60 * 1000);
			queryCriteria["from"] = new Date(from);
			queryCriteria["to"] = new Date(to);
			executeQuery(queryCriteria);
		}

		if (isImmediate) {
			logic();
		}

		$scope.RefreshInterval = setInterval(function() {
			logic();
			trackChanges(queryCriteria);
		}, 8000);

	}

	var RefreshTableByFilter = $scope.RefreshTableByFilter = function(noWarning) {

		if (!validateDates()) {
			showWarningMessage("The \"From\" date can't be more than the \"To\" date !");
			return;
		}

		var queryCriteria = {};

		// queryCriteria["account_id"] = $scope.account.account_id;
		queryCriteria["applications"] = [];
		angular.forEach($scope.filterCriteria.selected_apps, function(app) {
			queryCriteria["applications"].push(app.application_id);
		});

		queryCriteria["from"] = parseDate($scope.filterCriteria.from);
		queryCriteria["to"] = parseDate($scope.filterCriteria.to);

		AMAServiceMonitoringAgent.queryAlertAuditLogs(queryCriteria, function(
			err, data) {
			console.info(data);
			$scope.auditLogsByFilter = data;
			if (data.length == 0 && !noWarning) {
				$scope.showNoAlertData = true;
//				showWarningMessage("No data !");
			}
		});

		AMAServiceMonitoringAgent.queryTicketAuditLogs(queryCriteria, function(
				err, data) {
				console.info(data);
				console.log("Data Ticket Log: "+data);
				$scope.ticketAuditLogsByFilter = data;
				if (data.length == 0 && !noWarning) {
					$scope.showNoTicketData = true;
//					showWarningMessage("No data !");
				}
			});

		if (!auditLogsWithoutSOPsLock) {
			auditLogsWithoutSOPsLock = true;
			AMAServiceMonitoringAgent.queryAlertAuditLogsWithoutSOPs(
				queryCriteria,
				function(err, data) {
					$scope.auditLogsWithoutSOPsByFilter = data;
					if (data.length == 0 && !noWarning) {
//						$scope.showNoAlertData = true;
//						showWarningMessage("No data !");
					}
					auditLogsWithoutSOPsLock = false;
				});
		}

		if (!ticketAuditLogsWithoutSOPsLock) {
			ticketAuditLogsWithoutSOPsLock = true;
			AMAServiceMonitoringAgent.queryTicketAuditLogsWithoutSOPs(
				queryCriteria,
				function(err, data) {
					$scope.ticketAuditLogsWithoutSOPsByFilter = data;
					if (data.length == 0 && !noWarning) {
//						$scope.showNoTicketData = true;
//						showWarningMessage("No data !");
					}
					ticketAuditLogsWithoutSOPsLock = false;
				});
		}
	}

	RefreshTable();

	$scope.showAlertProcessingChart2 = function(auditLog) {
		var content = "<script>" + "var margin = {top: 20, right: 20, bottom: 30, left: 50},width = 560 - margin.left - margin.right,height = 500 - margin.top - margin.bottom;"

		+"var x = d3.scale.linear().range([0, width]);"

		+ "var y = d3.scale.linear().range([height, 0]);"

		+ "var xAxis = d3.svg.axis().scale(x).orient(\"bottom\");"

		+ "var yAxis = d3.svg.axis().scale(y).orient(\"left\");"

		+ "var line = d3.svg.line().x(function(d) { return x(d.date); }).y(function(d) { return y(d.close); });"

		+ "var svg = d3.select(\"#alertprocessingchart2\").append(\"svg\").attr(\"width\", width + margin.left + margin.right).attr(\"height\", height + margin.top + margin.bottom).append(\"g\").attr(\"transform\", \"translate(\" + margin.left + \",\" + margin.top + \")\");"

		+ "var data = [{date:0,close:0},{date:0,close:0},{date:0,close:0},{date:0,close:0},{date:0,close:0},{date:0,close:0},{date:0,close:0}];" + "data.forEach(function(d,i) {" + "d.date = i+1;" + "d.close = i+1;" + "});"

		+ "x.domain(d3.extent(data, function(d) { return d.date; }));" + "y.domain(d3.extent(data, function(d) { return d.close; }));"

		+ "svg.append(\"g\").attr(\"class\", \"x axis\").attr(\"transform\", \"translate(0,\" + height + \")\").call(xAxis);"

		+ "svg.append(\"g\").attr(\"class\", \"y axis\").call(yAxis).append(\"text\").attr(\"transform\", \"rotate(-90)\").attr(\"y\", 6).attr(\"dy\", \".71em\").style(\"text-anchor\", \"end\").text(\"Step\");"

		+ "svg.append(\"path\").datum(data).attr(\"class\", \"line\").attr(\"d\", line);"

		+ "</script>";

		$('#chart2' + auditLog._id).popModal({
			html: '<div id=\"alertprocessingchart2\">' + content + '</div>',
			placement: 'leftTop',
			showCloseBut: false,
			onDocumentClickClose: true,
			onDocumentClickClosePrevent: '',
			overflowContent: false,
			inline: true,
			beforeLoadingContent: 'Please, wait...',
			onOkBut: function() {},
			onCancelBut: function() {},
			onLoad: function() {},
			onClose: function() {}
		});
	}

	$scope.showAlertProcessingChart = function(auditLog) {
		debugger;
		$("#AuditLogChart").dialog({
			width: "auto",
			// modal:true,
			// open:function() {
			// $(this).parent().find(".ui-dialog-titlebar-close").replaceWith('<div
			// class="ui-dialog-titlebar-close glyphicon glyphicon-remove"
			// style="cursor:pointer;font-weight:normal;" title="Close"></div>');
			// $(this).parent().find(".ui-dialog-titlebar-close").bind("click",
			// function() {
			// $("#FilterDialog").dialog("close");
			// });
			// $(this).parent().find(".ui-dialog-buttonset").children().addClass("btn
			// btn-default");
			// },
			// close : function() {
			// },
			// dragStop : function() {
			// $(this).parent().css("height", "auto");
			// },
			// buttons : {
			// Close : function() {
			// $(this).dialog("close");
			// }
			// }
		});
		var margin = {
				top: 20,
				right: 20,
				bottom: 30,
				left: 50
			},
			width = 960 - margin.left - margin.right,
			height = 500 - margin.top - margin.bottom;

		var x = d3.scale.linear().range([0, width]);

		var y = d3.scale.linear().range([height, 0]);

		var xAxis = d3.svg.axis().scale(x).orient("bottom");

		var yAxis = d3.svg.axis().scale(y).orient("left");

		var line = d3.svg.line().x(function(d) {
			return x(d.date);
		}).y(function(d) {
			return y(d.close);
		});

		var svg = d3.select("#AuditLogChart").append("svg").attr("width",
			width + margin.left + margin.right).attr("height",
			height + margin.top + margin.bottom).append("g").attr(
			"transform",
			"translate(" + margin.left + "," + margin.top + ")");

		var data = auditLog.logDetails;
		data.forEach(function(d, i) {
			d.date = i + 1;
			d.close = i + 1;
		});

		x.domain(d3.extent(data, function(d) {
			return d.date;
		}));
		y.domain(d3.extent(data, function(d) {
			return d.close;
		}));

		svg.append("g").attr("class", "x axis").attr("transform",
			"translate(0," + height + ")").call(xAxis);

		svg.append("g").attr("class", "y axis").call(yAxis).append("text")
			.attr("transform", "rotate(-90)").attr("y", 6).attr("dy",
				".71em").style("text-anchor", "end").text("Step");

		svg.append("path").datum(data).attr("class", "line").attr("d", line);

	}

	$scope.showAnalytics = function() {
		if (document.getElementById('accountanalyticschart').style.display == 'none' && $("#selectApplication").find("option:selected").val() == "") {
			document.getElementById('alertmonitoringtable').style.display = 'none';
			document.getElementById('applicationanalyticschart').style.display = 'none';
			$("#accountalertpiechart").empty();
			$("#accountcolumn").empty();
			$("#applicationalertpiechart").empty();
			$("#applicationbar").empty();
			$("#applicationcolumn").empty();
			document.getElementById('accountanalyticschart').style.display = '';
			document.getElementById('showAnalyticsBtn').innerHTML = "Show Monitor";
			accountAnalytics();
		} else if (document.getElementById('applicationanalyticschart').style.display == 'none' && $("#selectApplication").find("option:selected").val() != "") {
			document.getElementById('alertmonitoringtable').style.display = 'none';
			document.getElementById('accountanalyticschart').style.display = 'none';
			$("#accountalertpiechart").empty();
			$("#accountcolumn").empty();
			$("#applicationalertpiechart").empty();
			$("#applicationbar").empty();
			$("#applicationcolumn").empty();
			document.getElementById('applicationanalyticschart').style.display = '';
			document.getElementById('showAnalyticsBtn').innerHTML = "Show Monitor";
			applicationAnalytics();
		} else {
			document.getElementById('alertmonitoringtable').style.display = '';
			document.getElementById('accountanalyticschart').style.display = 'none';
			document.getElementById('applicationanalyticschart').style.display = 'none';
			$("#accountalertpiechart").empty();
			$("#accountcolumn").empty();
			$("#applicationalertpiechart").empty();
			$("#applicationbar").empty();
			$("#applicationcolumn").empty();
			document.getElementById('showAnalyticsBtn').innerHTML = "Show Analytics";
		}
	}

	var accountAnalytics = function() {
		var queryCriteria = {};

		queryCriteria["applications"] = [];
		angular.forEach($scope.applications, function(app) {
			queryCriteria["applications"].push(app.application_id);
		});
		var to = new Date();
		queryCriteria["to"] = new Date(to);
		var from = new Date(to.getTime() - 4 * 60 * 60 * 1000);
		queryCriteria["from"] = new Date(from);
		AMAServiceMonitoringAgent
			.queryAlertAuditLogs(
				queryCriteria,
				function(err, results) {

					{
						var data_map = {
							"In Progress": 0,
							"Completed": 0,
							"Error": 0,
							"No Automation": 0
						};
						var data_group = {
							"In Progress": [],
							"Completed": [],
							"Error": [],
							"No Automation": []
						};
						results.forEach(function(result) {
							if (!data_map[result.status])
								data_map[result.status] = 0;
							if (!data_group[result.status])
								data_group[result.status] = [];
							data_map[result.status] += 1;
							data_group[result.status].push(result);
						});
						var data = [];
						var ageNames = [];
						for (var status in data_map) {
							data.push({
								age: status,
								population: data_map[status],
								list: data_group[status]
							});
							ageNames.push(status);
						}
						// data =
						// [{age:'InProgress',population:20},{age:'Successful',population:80},{age:'Failure',population:10},{age:'NoAutomation',population:5}];

						var width = 580,
							height = 300,
							radius = Math
							.min(width, height) / 2;

						var color = d3.scale.ordinal().range(
							["orange", "blue", "red", "grey"]);

						var arc = d3.svg.arc().outerRadius(radius - 10)
							.innerRadius(0);

						var pie = d3.layout.pie().sort(null).value(
							function(d) {
								return d.population;
							});

						var svg = d3.select("#accountalertpiechart")
							.append("svg").attr("width", width)
							.attr("height", height).append("g")
							.attr(
								"transform",
								"translate(" + 200 + "," + height / 2 + ")");

						// data.forEach(function(d) {
						// d.population = +d.population;
						// });

						var g = svg.selectAll(".arc").data(pie(data))
							.enter().append("g").attr("class",
								"arc");

						g
							.append("path")
							.attr("d", arc)
							.style("fill", function(d) {
								return color(d.data.age);
							})
							.on(
								"click",
								function(d, i) {
									$("#ChartDetailsDialog")
										.dialog({
											width: 1200,
											modal: true,
											open: function() {
												$(
														this)
													.parent()
													.find(
														".ui-dialog-titlebar-close")
													.replaceWith(
														'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
												$(
														this)
													.parent()
													.find(
														".ui-dialog-titlebar-close")
													.bind(
														"click",
														function() {
															$(
																	"#ChartDetailsDialog")
																.dialog(
																	"close");
														});
												$(
														this)
													.parent()
													.find(
														".ui-dialog-buttonset")
													.children()
													.addClass(
														"btn btn-default");
												$scope.chartDetails = d.data.list;
											},
											close: function() {
												$scope.chartDetails = [];
											},
											dragStop: function() {
												$(
														this)
													.parent()
													.css(
														"height",
														"auto");
											},
											buttons: {
												Close: function() {
													$(
															this)
														.dialog(
															"close");
												}
											}
										});
								});

						// var ageNames =
						// ['InProgress','Successful','Failure','NoAutomation'];

						var legend = svg.selectAll(".legend").data(
								ageNames.slice()).enter().append("g")
							.attr("class", "legend").attr(
								"transform",
								function(d, i) {
									return "translate(0," + i * 20 + ")";
								});

						legend.append("rect")
							.attr("x", width / 2 - 124).attr(
								"width", 18).attr("height", 18)
							.style("fill", color);

						legend.append("text")
							.attr("x", width / 2 - 100)
							.attr("y", 9).attr("dy", ".35em")
							.style("text-anchor", "start").style(
								'fill', 'white').text(
								function(d) {
									return d;
								});
					}

					{
						var from = new Date(to.getTime() - 5 * 24 * 60 * 60 * 1000);
						queryCriteria["from"] = new Date(from);
						AMAServiceMonitoringAgent
							.queryAlertAuditLogs(
								queryCriteria,
								function(err, results) {

									var app_map = {};
									var day_map = {};
									results
										.forEach(function(
											result) {
											if (!app_map[result.applicationID])
												app_map[result.applicationID] = {
													name: result.applicationName,
													total: 0
												};
											app_map[result.applicationID].total += 1;

											var difference = "";
											var diff = to
												.getTime() - Date
												.parse(result.createTime);
											if (diff < 24 * 60 * 60 * 1000) {
												difference = "Day1";
											} else if (diff < 2 * 24 * 60 * 60 * 1000) {
												difference = "Day2";
											} else if (diff < 3 * 24 * 60 * 60 * 1000) {
												difference = "Day3";
											} else if (diff < 4 * 24 * 60 * 60 * 1000) {
												difference = "Day4";
											} else {
												difference = "Day5";
											}
											if (!day_map[difference])
												day_map[difference] = {};
											if (!day_map[difference][result.applicationID])
												day_map[difference][result.applicationID] = {
													name: result.applicationName,
													total: 0,
													list: []
												};
											day_map[difference][result.applicationID].total += 1;
											day_map[difference][result.applicationID].list
												.push(result);

										});
									var data_sort = [];
									for (var applicationID in app_map) {
										data_sort
											.push({
												id: applicationID,
												name: app_map[applicationID].name,
												total: app_map[applicationID].total,
												list: app_map[applicationID].list
											});
									};
									data_sort
										.sort(function(a, b) {
											return a.total < b.total ? 1 : -1
										});
									var data = [{
										State: 'Day-4'
									}, {
										State: 'Day-3'
									}, {
										State: 'Day-2'
									}, {
										State: 'Day-1'
									}, {
										State: 'Day-0'
									}];
									for (var i = 0; i < data_sort.length; i++) {
										if (i >= 5)
											break;
										data[0][data_sort[i].name] = (day_map["Day5"]) ? ((day_map["Day5"][data_sort[i].id]) ? {
											total: day_map["Day5"][data_sort[i].id].total,
											list: day_map["Day5"][data_sort[i].id].list
										} : {
											total: 0,
											list: []
										}) : {
											total: 0,
											list: []
										};
										data[1][data_sort[i].name] = (day_map["Day4"]) ? ((day_map["Day4"][data_sort[i].id]) ? {
											total: day_map["Day4"][data_sort[i].id].total,
											list: day_map["Day4"][data_sort[i].id].list
										} : {
											total: 0,
											list: []
										}) : {
											total: 0,
											list: []
										};
										data[2][data_sort[i].name] = (day_map["Day3"]) ? ((day_map["Day3"][data_sort[i].id]) ? {
											total: day_map["Day3"][data_sort[i].id].total,
											list: day_map["Day3"][data_sort[i].id].list
										} : {
											total: 0,
											list: []
										}) : {
											total: 0,
											list: []
										};
										data[3][data_sort[i].name] = (day_map["Day2"]) ? ((day_map["Day2"][data_sort[i].id]) ? {
											total: day_map["Day2"][data_sort[i].id].total,
											list: day_map["Day2"][data_sort[i].id].list
										} : {
											total: 0,
											list: []
										}) : {
											total: 0,
											list: []
										};
										data[4][data_sort[i].name] = (day_map["Day1"]) ? ((day_map["Day1"][data_sort[i].id]) ? {
											total: day_map["Day1"][data_sort[i].id].total,
											list: day_map["Day1"][data_sort[i].id].list
										} : {
											total: 0,
											list: []
										}) : {
											total: 0,
											list: []
										};
									}

									// var ageNames = [];
									// var
									// data=[{State:'Day1',APP1:2,APP2:1,APP3:1,APP4:2,APP5:3},{State:'Day2',APP1:2,APP2:1,APP3:1,APP4:2,APP5:3},{State:'Day3',APP1:2,APP2:1,APP3:1,APP4:2,APP5:3},{State:'Day4',APP1:2,APP2:1,APP3:1,APP4:2,APP5:3},{State:'Day5',APP1:2,APP2:1,APP3:1,APP4:2,APP5:3}];
									var ageNames = d3
										.keys(data[0])
										.filter(
											function(
												key) {
												return key !== "State";
											});

									var margin = {
											top: 20,
											right: 60,
											bottom: 30,
											left: 40
										},
										width = 400,
										height = 300;

									var x0 = d3.scale
										.ordinal()
										.rangeRoundBands(
											[0, width],
											.1);

									var x1 = d3.scale.ordinal();

									var y = d3.scale
										.linear()
										.range(
											[height, 0]);

									var color = d3.scale
										.ordinal()
										.range(
											[
												"#98abc5",
												"#8a89a6",
												"#7b6888",
												"#6b486b",
												"#a05d56",
												"#d0743c",
												"#ff8c00"
											]);

									var xAxis = d3.svg.axis()
										.scale(x0).orient(
											"bottom");

									var yAxis = d3.svg
										.axis()
										.scale(y)
										.orient("left")
										.tickFormat(
											d3
											.format(".2s"));

									var svg = d3
										.select(
											"#accountcolumn")
										.append("svg")
										.attr(
											"width",
											width + margin.left + margin.right)
										.attr(
											"height",
											height + margin.top + margin.bottom)
										.append("g")
										.attr(
											"transform",
											"translate(" + margin.left + "," + margin.top + ")");

									data
										.forEach(function(d) {
											d.ages = ageNames
												.map(function(
													name) {
													return {
														name: name,
														value: +d[name]["total"],
														list: d[name]["list"]
													};
												});
										});

									x0.domain(data
										.map(function(d) {
											return d.State;
										}));
									x1
										.domain(ageNames)
										.rangeRoundBands(
											[
												0,
												x0
												.rangeBand()
											]);
									y
										.domain([
											0,
											d3
											.max(
												data,
												function(
													d) {
													return d3
														.max(
															d.ages,
															function(
																d) {
																return d.value;
															});
												})
										]);

									svg
										.append("g")
										.attr("class",
											"x axis")
										.attr(
											"transform",
											"translate(0," + height + ")")
										.style('fill',
											'white')
										.call(xAxis);

									svg
										.append("g")
										.attr("class",
											"y axis")
										.style('fill',
											'white')
										.call(yAxis)
										.append("text")
										.attr("transform",
											"translate(-15,-8)")
										.style(
											"text-anchor",
											"start")
										.style('fill',
											'white')
										.text("Alerts");

									var state = svg
										.selectAll(".state")
										.data(data)
										.enter()
										.append("g")
										.attr("class", "g")
										.attr(
											"transform",
											function(d) {
												return "translate(" + x0(d.State) + ",0)";
											});

									state
										.selectAll("rect")
										.data(function(d) {
											return d.ages;
										})
										.enter()
										.append("rect")
										.attr(
											"width",
											x1
											.rangeBand())
										.attr(
											"x",
											function(d) {
												return x1(d.name);
											})
										.attr(
											"y",
											function(d) {
												return y(d.value);
											})
										.attr(
											"height",
											function(d) {
												return height - y(d.value);
											})
										.style(
											"fill",
											function(d) {
												return color(d.name);
											})
										.on(
											"click",
											function(d,
												i) {
												$(
														"#ChartDetailsDialog")
													.dialog({
														width: 1200,
														modal: true,
														open: function() {
															$(
																	this)
																.parent()
																.find(
																	".ui-dialog-titlebar-close")
																.replaceWith(
																	'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
															$(
																	this)
																.parent()
																.find(
																	".ui-dialog-titlebar-close")
																.bind(
																	"click",
																	function() {
																		$(
																				"#ChartDetailsDialog")
																			.dialog(
																				"close");
																	});
															$(
																	this)
																.parent()
																.find(
																	".ui-dialog-buttonset")
																.children()
																.addClass(
																	"btn btn-default");
															$scope.chartDetails = d.list;
														},
														close: function() {
															$scope.chartDetails = [];
														},
														dragStop: function() {
															$(
																	this)
																.parent()
																.css(
																	"height",
																	"auto");
														},
														buttons: {
															Close: function() {
																$(
																		this)
																	.dialog(
																		"close");
															}
														}
													});
											});

									var legend = svg
										.selectAll(
											".legend")
										.data(
											ageNames
											.slice()
											.reverse())
										.enter()
										.append("g")
										.attr("class",
											"legend")
										.attr(
											"transform",
											function(d,
												i) {
												return "translate(0," + i * 20 + ")";
											});

									legend.append("rect").attr(
											"x", width + 2)
										.attr("width", 18)
										.attr("height", 18)
										.style("fill",
											color);

									legend
										.append("text")
										.attr("x",
											width + 26)
										.attr("y", 9)
										.attr("dy", ".35em")
										.style(
											"text-anchor",
											"start")
										.style('fill',
											'white')
										.text(function(d) {
											return d;
										});

								});
					}
				});

	}

	var applicationAnalytics = function() {
		var queryCriteria = {};

		queryCriteria["applications"] = [];
		angular.forEach($scope.applications, function(app) {
			queryCriteria["applications"].push(app.application_id);
		});
		var to = new Date();
		queryCriteria["to"] = new Date(to);
		var from = new Date(to.getTime() - 4 * 60 * 60 * 1000);
		queryCriteria["from"] = new Date(from);
		AMAServiceMonitoringAgent
			.queryAlertAuditLogs(
				queryCriteria,
				function(err, results) {

					{
						var data_map = {
							"In Progress": 0,
							"Completed": 0,
							"Error": 0,
							"No Automation": 0
						};
						var data_group = {
							"In Progress": [],
							"Completed": [],
							"Error": [],
							"No Automation": []
						};
						results.forEach(function(result) {
							if (!data_map[result.status])
								data_map[result.status] = 0;
							if (!data_group[result.status])
								data_group[result.status] = [];
							data_map[result.status] += 1;
							data_group[result.status].push(result);
						});
						var data = [];
						var ageNames = [];
						for (var status in data_map) {
							data.push({
								age: status,
								population: data_map[status],
								list: data_group[status]
							});
							ageNames.push(status);
						}
						// var data =
						// [{age:'InProgress',population:20},{age:'Successful',population:80},{age:'Failure',population:10},{age:'NoAutomation',population:5}];

						var width = 580,
							height = 300,
							radius = Math
							.min(width, height) / 2;

						var color = d3.scale.ordinal().range(
							["orange", "blue", "red", "grey"]);

						var arc = d3.svg.arc().outerRadius(radius - 10)
							.innerRadius(0);

						var pie = d3.layout.pie().sort(null).value(
							function(d) {
								return d.population;
							});

						var svg = d3
							.select("#applicationalertpiechart")
							.append("svg").attr("width", width)
							.attr("height", height).append("g")
							.attr(
								"transform",
								"translate(" + 200 + "," + height / 2 + ")");

						data.forEach(function(d) {
							d.population = +d.population;
						});

						var g = svg.selectAll(".arc").data(pie(data))
							.enter().append("g").attr("class",
								"arc");

						g
							.append("path")
							.attr("d", arc)
							.style("fill", function(d) {
								return color(d.data.age);
							})
							.on(
								"click",
								function(d, i) {
									$("#ChartDetailsDialog")
										.dialog({
											width: 1200,
											modal: true,
											open: function() {
												$(
														this)
													.parent()
													.find(
														".ui-dialog-titlebar-close")
													.replaceWith(
														'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
												$(
														this)
													.parent()
													.find(
														".ui-dialog-titlebar-close")
													.bind(
														"click",
														function() {
															$(
																	"#ChartDetailsDialog")
																.dialog(
																	"close");
														});
												$(
														this)
													.parent()
													.find(
														".ui-dialog-buttonset")
													.children()
													.addClass(
														"btn btn-default");
												$scope.chartDetails = d.data.list;
											},
											close: function() {
												$scope.chartDetails = [];
											},
											dragStop: function() {
												$(
														this)
													.parent()
													.css(
														"height",
														"auto");
											},
											buttons: {
												Close: function() {
													$(
															this)
														.dialog(
															"close");
												}
											}
										});
								});

						// var ageNames =
						// ['InProgress','Successful','Failure','NoAutomation'];

						var legend = svg.selectAll(".legend").data(
								ageNames.slice()).enter().append("g")
							.attr("class", "legend").attr(
								"transform",
								function(d, i) {
									return "translate(0," + i * 20 + ")";
								});

						legend.append("rect")
							.attr("x", width / 2 - 124).attr(
								"width", 18).attr("height", 18)
							.style("fill", color);

						legend.append("text")
							.attr("x", width / 2 - 100)
							.attr("y", 9).attr("dy", ".35em")
							.style("text-anchor", "start").style(
								'fill', 'white').text(
								function(d) {
									return d;
								});
					}

					{
						var app_map = {};
						var app_group = {};
						results
							.forEach(function(result) {
								if (!app_map[result.alertID])
									app_map[result.alertID] = {
										name: result.alertName,
										total: 0
									};
								if (!app_group[result.alertID])
									app_group[result.alertID] = {
										list: []
									};
								app_map[result.alertID].total += 1;
								app_group[result.alertID].list
									.push(result);
							});
						var data_sort = [];
						for (var alertID in app_map) {
							data_sort.push({
								id: alertID,
								name: app_map[alertID].name,
								total: app_map[alertID].total,
								list: app_group[alertID].list
							});
						};
						data_sort.sort(function(a, b) {
							return a.total < b.total ? 1 : -1
						});
						var data = [];
						var ageNames = [];
						for (var i = 0; i < data_sort.length; i++) {
							if (i >= 5)
								break;
							data.push({
								name: data_sort[i].name,
								value: data_sort[i].total,
								list: data_sort[i].list
							});
							ageNames.push(data_sort[i].name);
						}

						var margin = {
								top: 20,
								right: 60,
								bottom: 30,
								left: 40
							},
							width = 400,
							height = 300;

						var x = d3.scale.linear().range([0, width]);

						var y = d3.scale.ordinal().rangeRoundBands(
							[0, height], .2);

						var xAxis = d3.svg.axis().scale(x)
							.orient("top");
						var yAxis = d3.svg.axis().scale(y).orient(
							"left");

						var svg = d3.select("#applicationbar").append(
								"svg").attr("width",
								width + margin.left + margin.right)
							.attr(
								"height",
								height + margin.top + margin.bottom)
							.append("g").attr(
								"transform",
								"translate(" + margin.left + "," + margin.top + ")");
						// d3.extent(data, function(d) { return d.value
						// / 10; })
						x.domain([0, d3.max(data, function(d) {
							return d.value;
						})]).nice();
						y.domain(data.map(function(d) {
							return d.name;
						}));

						svg
							.selectAll(".bar")
							.data(data)
							.enter()
							.append("rect")
							.attr("class", "bar positive")
							.attr("x", function(d) {
								return x(Math.min(0, d.value));
							})
							.attr("y", function(d) {
								return y(d.name);
							})
							.attr("width", function(d) {

								return Math.abs(x(d.value) - x(0));
							})
							.attr("height", y.rangeBand())
							.on(
								"click",
								function(d, i) {
									$("#ChartDetailsDialog")
										.dialog({
											width: 1200,
											modal: true,
											open: function() {
												$(
														this)
													.parent()
													.find(
														".ui-dialog-titlebar-close")
													.replaceWith(
														'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
												$(
														this)
													.parent()
													.find(
														".ui-dialog-titlebar-close")
													.bind(
														"click",
														function() {
															$(
																	"#ChartDetailsDialog")
																.dialog(
																	"close");
														});
												$(
														this)
													.parent()
													.find(
														".ui-dialog-buttonset")
													.children()
													.addClass(
														"btn btn-default");
												$scope.chartDetails = d.list;
											},
											close: function() {
												$scope.chartDetails = [];
											},
											dragStop: function() {
												$(
														this)
													.parent()
													.css(
														"height",
														"auto");
											},
											buttons: {
												Close: function() {
													$(
															this)
														.dialog(
															"close");
												}
											}
										});
								});

						svg.append("g").attr("class", "x axis").style(
								'fill', 'white').call(xAxis).append(
								"text").style("text-anchor", "start")
							.style("fill", "white").attr(
								"transform",
								"translate(" + (width + 10) + ",0)").text("Alerts");

						svg.append("g").attr("class", "y axis").style(
								'fill', 'white').call(yAxis).selectAll(
								"text").style("text-anchor", "start")
							.attr("transform", "translate(15,0)");
						// svg.append("g")
						// .attr("class", "y axis")
						// .append("line")
						// .attr("x1", x(0))
						// .attr("x2", x(0))
						// .attr("y2", height);

					}

					{
						var from = new Date(to.getTime() - 5 * 24 * 60 * 60 * 1000);
						queryCriteria["from"] = new Date(from);
						AMAServiceMonitoringAgent
							.queryAlertAuditLogs(
								queryCriteria,
								function(err, results) {
									var app_map = {};
									var day_map = {};
									results
										.forEach(function(
											result) {
											if (!app_map[result.alertID])
												app_map[result.alertID] = {
													name: result.alertName,
													total: 0
												};
											app_map[result.alertID].total += 1;

											var difference = "";
											var diff = to
												.getTime() - Date
												.parse(result.createTime);
											if (diff < 24 * 60 * 60 * 1000) {
												difference = "Day1";
											} else if (diff < 2 * 24 * 60 * 60 * 1000) {
												difference = "Day2";
											} else if (diff < 3 * 24 * 60 * 60 * 1000) {
												difference = "Day3";
											} else if (diff < 4 * 24 * 60 * 60 * 1000) {
												difference = "Day4";
											} else {
												difference = "Day5";
											}
											if (!day_map[difference])
												day_map[difference] = {};
											if (!day_map[difference][result.alertID])
												day_map[difference][result.alertID] = {
													name: result.alertName,
													total: 0,
													list: []
												};
											day_map[difference][result.alertID].total += 1;
											day_map[difference][result.alertID].list
												.push(result);

										});
									var data_sort = [];
									for (var alertID in app_map) {
										data_sort
											.push({
												id: alertID,
												name: app_map[alertID].name,
												total: app_map[alertID].total,
												list: app_map[alertID].list
											});
									};
									data_sort
										.sort(function(a, b) {
											return a.total < b.total ? 1 : -1
										});
									var data = [{
										State: 'Day-4'
									}, {
										State: 'Day-3'
									}, {
										State: 'Day-2'
									}, {
										State: 'Day-1'
									}, {
										State: 'Day-0'
									}];
									for (var i = 0; i < data_sort.length; i++) {
										if (i >= 5)
											break;
										// data[0][data_sort[i].name]=(day_map["Day5"])?((day_map["Day5"][data_sort[i].id])?day_map["Day5"][data_sort[i].id].total:0):0;
										// data[1][data_sort[i].name]=(day_map["Day4"])?((day_map["Day4"][data_sort[i].id])?day_map["Day4"][data_sort[i].id].total:0):0;
										// data[2][data_sort[i].name]=(day_map["Day3"])?((day_map["Day3"][data_sort[i].id])?day_map["Day3"][data_sort[i].id].total:0):0;
										// data[3][data_sort[i].name]=(day_map["Day2"])?((day_map["Day2"][data_sort[i].id])?day_map["Day2"][data_sort[i].id].total:0):0;
										// data[4][data_sort[i].name]=(day_map["Day1"])?((day_map["Day1"][data_sort[i].id])?day_map["Day1"][data_sort[i].id].total:0):0;
										data[0][data_sort[i].name] = (day_map["Day5"]) ? ((day_map["Day5"][data_sort[i].id]) ? {
											total: day_map["Day5"][data_sort[i].id].total,
											list: day_map["Day5"][data_sort[i].id].list
										} : {
											total: 0,
											list: []
										}) : {
											total: 0,
											list: []
										};
										data[1][data_sort[i].name] = (day_map["Day4"]) ? ((day_map["Day4"][data_sort[i].id]) ? {
											total: day_map["Day4"][data_sort[i].id].total,
											list: day_map["Day4"][data_sort[i].id].list
										} : {
											total: 0,
											list: []
										}) : {
											total: 0,
											list: []
										};
										data[2][data_sort[i].name] = (day_map["Day3"]) ? ((day_map["Day3"][data_sort[i].id]) ? {
											total: day_map["Day3"][data_sort[i].id].total,
											list: day_map["Day3"][data_sort[i].id].list
										} : {
											total: 0,
											list: []
										}) : {
											total: 0,
											list: []
										};
										data[3][data_sort[i].name] = (day_map["Day2"]) ? ((day_map["Day2"][data_sort[i].id]) ? {
											total: day_map["Day2"][data_sort[i].id].total,
											list: day_map["Day2"][data_sort[i].id].list
										} : {
											total: 0,
											list: []
										}) : {
											total: 0,
											list: []
										};
										data[4][data_sort[i].name] = (day_map["Day1"]) ? ((day_map["Day1"][data_sort[i].id]) ? {
											total: day_map["Day1"][data_sort[i].id].total,
											list: day_map["Day1"][data_sort[i].id].list
										} : {
											total: 0,
											list: []
										}) : {
											total: 0,
											list: []
										};
									}

									// var ageNames = [];
									// var
									// data=[{State:'Day1',APP1:2,APP2:1,APP3:1,APP4:2,APP5:3},{State:'Day2',APP1:2,APP2:1,APP3:1,APP4:2,APP5:3},{State:'Day3',APP1:2,APP2:1,APP3:1,APP4:2,APP5:3},{State:'Day4',APP1:2,APP2:1,APP3:1,APP4:2,APP5:3},{State:'Day5',APP1:2,APP2:1,APP3:1,APP4:2,APP5:3}];
									var ageNames = d3
										.keys(data[0])
										.filter(
											function(
												key) {
												return key !== "State";
											});

									var margin = {
											top: 20,
											right: 60,
											bottom: 30,
											left: 40
										},
										width = 700,
										height = 300;

									var x0 = d3.scale
										.ordinal()
										.rangeRoundBands(
											[0, width],
											.1);

									var x1 = d3.scale.ordinal();

									var y = d3.scale
										.linear()
										.range(
											[height, 0]);

									var color = d3.scale
										.ordinal()
										.range(
											[
												"#98abc5",
												"#8a89a6",
												"#7b6888",
												"#6b486b",
												"#a05d56",
												"#d0743c",
												"#ff8c00"
											]);

									var xAxis = d3.svg.axis()
										.scale(x0).orient(
											"bottom");

									var yAxis = d3.svg
										.axis()
										.scale(y)
										.orient("left")
										.tickFormat(
											d3
											.format(".2s"));

									var svg = d3
										.select(
											"#applicationcolumn")
										.append("svg")
										.attr(
											"width",
											width + margin.left + margin.right)
										.attr(
											"height",
											height + margin.top + margin.bottom)
										.append("g")
										.attr(
											"transform",
											"translate(" + margin.left + "," + margin.top + ")");

									data
										.forEach(function(d) {
											d.ages = ageNames
												.map(function(
													name) {
													return {
														name: name,
														value: +d[name]["total"],
														list: d[name]["list"]
													};
												});
										});

									x0.domain(data
										.map(function(d) {
											return d.State;
										}));
									x1
										.domain(ageNames)
										.rangeRoundBands(
											[
												0,
												x0
												.rangeBand()
											]);
									y
										.domain([
											0,
											d3
											.max(
												data,
												function(
													d) {
													return d3
														.max(
															d.ages,
															function(
																d) {
																return d.value;
															});
												})
										]);

									svg
										.append("g")
										.attr("class",
											"x axis")
										.attr(
											"transform",
											"translate(0," + height + ")")
										.style('fill',
											'white')
										.call(xAxis);

									svg
										.append("g")
										.attr("class",
											"y axis")
										.style('fill',
											'white')
										.call(yAxis)
										.append("text")
										.attr("transform",
											"translate(-15,-8)")
										.style(
											"text-anchor",
											"start")
										.style('fill',
											'white')
										.text("Alerts");

									var state = svg
										.selectAll(".state")
										.data(data)
										.enter()
										.append("g")
										.attr("class", "g")
										.attr(
											"transform",
											function(d) {
												return "translate(" + x0(d.State) + ",0)";
											});

									state
										.selectAll("rect")
										.data(function(d) {
											return d.ages;
										})
										.enter()
										.append("rect")
										.attr(
											"width",
											x1
											.rangeBand())
										.attr(
											"x",
											function(d) {
												return x1(d.name);
											})
										.attr(
											"y",
											function(d) {
												return y(d.value);
											})
										.attr(
											"height",
											function(d) {
												return height - y(d.value);
											})
										.style(
											"fill",
											function(d) {
												return color(d.name);
											})
										.on(
											"click",
											function(d,
												i) {
												$(
														"#ChartDetailsDialog")
													.dialog({
														width: 1200,
														modal: true,
														open: function() {
															$(
																	this)
																.parent()
																.find(
																	".ui-dialog-titlebar-close")
																.replaceWith(
																	'<div class="ui-dialog-titlebar-close glyphicon glyphicon-remove" style="cursor:pointer;font-weight:normal;" title="Close"></div>');
															$(
																	this)
																.parent()
																.find(
																	".ui-dialog-titlebar-close")
																.bind(
																	"click",
																	function() {
																		$(
																				"#ChartDetailsDialog")
																			.dialog(
																				"close");
																	});
															$(
																	this)
																.parent()
																.find(
																	".ui-dialog-buttonset")
																.children()
																.addClass(
																	"btn btn-default");
															$scope.chartDetails = d.list;
														},
														close: function() {
															$scope.chartDetails = [];
														},
														dragStop: function() {
															$(
																	this)
																.parent()
																.css(
																	"height",
																	"auto");
														},
														buttons: {
															Close: function() {
																$(
																		this)
																	.dialog(
																		"close");
															}
														}
													});
											});

									var legend = svg
										.selectAll(
											".legend")
										.data(
											ageNames
											.slice()
											.reverse())
										.enter()
										.append("g")
										.attr("class",
											"legend")
										.attr(
											"transform",
											function(d,
												i) {
												return "translate(0," + i * 20 + ")";
											});

									legend.append("rect").attr(
											"x", width + 2)
										.attr("width", 18)
										.attr("height", 18)
										.style("fill",
											color);

									legend
										.append("text")
										.attr("x",
											width + 26)
										.attr("y", 9)
										.attr("dy", ".35em")
										.style(
											"text-anchor",
											"start")
										.style('fill',
											'white')
										.text(function(d) {
											return d;
										});

								});
					}
				});

	}

	$scope.refreshAlerts = function() {
		// $scope.filterCriteria = JSON.parse(JSON.stringify(defaultFilter));
		$scope.auditLogs = [];
		$scope.ticketAuditLogs = [];
		RefreshTable(true);
		$('#FilterDialog').modal('hide');
	}

	$scope.filterAlerts = function() {
		RefreshTable();
		// $('#FilterDialog').modal('hide');
	}

	$scope.clearFilter = function() {
		defaultFilter.from = formatDate(new Date());
		defaultFilter.to = defaultFilter.from;
		$scope.filterCriteria = JSON.parse(JSON.stringify(defaultFilter));
		$scope.auditLogsByFilter = [];
		$scope.ticketAuditLogsByFilter = [];
		$scope.auditLogsWithoutSOPsByFilter = [];
		$scope.ticketAuditLogsWithoutSOPsByFilter = [];
		$scope.showNoAlertData = false;
		$scope.showNoTicketData = false;
		RefreshTableByFilter(true);
		// RefreshTable();
		// $('#FilterDialog').modal('hide');
	}

	$scope.download = function() {
		
		$("#DownloadDialog").modal('toggle');

		var queryCriteria = {};

		// queryCriteria["account_id"] = $scope.account.account_id;
		queryCriteria["applications"] = [];
		queryCriteria["timezoneOffset"] = new Date().getTimezoneOffset();
		angular.forEach($scope.applications, function(app) {
			queryCriteria["applications"].push(app.application_id);
		});

		var to = new Date();
		var from = new Date(to.getTime() - 60 * 60 * 1000);
		queryCriteria["from"] = from;
		queryCriteria["to"] = to;
		
		var activeTab = $("#tabs .ui-tabs-panel:visible").attr("id");
		
		var downloadFileHandlerCallback = function(err, data) {
			var win = window.open(data.file, '_blank');
		};
		
		if(activeTab=="fragment-1") { // fragment-1 indicates the divID of the active Alert Tab
			AMAServiceMonitoringAgent.reqDownload(queryCriteria,downloadFileHandlerCallback);
		} else { // Indicates Ticket Tab related download
			queryCriteria["forTicketDownload"] = true;
			AMAServiceMonitoringAgent.reqTicketDownload(queryCriteria,downloadFileHandlerCallback);
		}
		
	}

	$scope.downloadByFilter = function(fileType) {

		if (!validateDates()) {
			showWarningMessage("The \"From\" date can't be more than the \"To\" date !");
			return;
		}

		var queryCriteria = {};

		// queryCriteria["account_id"] = $scope.account.account_id;
		queryCriteria["applications"] = [];
		queryCriteria["timezoneOffset"] = new Date().getTimezoneOffset();
		angular.forEach($scope.filterCriteria.selected_apps, function(app) {
			queryCriteria["applications"].push(app.application_id);
		});

		queryCriteria["from"] = parseDate($scope.filterCriteria.from);
		queryCriteria["to"] = parseDate($scope.filterCriteria.to);
		AMAServiceMonitoringAgent.reqDownload(queryCriteria,
			function(err, data) {
				var win = window.open(data.file, '_blank');
			});
	}

	$scope.notify = function(auditLog) {
		AMAServiceMonitoringAgent.notify(auditLog,
			function(err, data) {
				if (err) {
					//alert(err);
					console.log("Cannot send notification");
				} else {
					//alert("Notification has been sent out.");
					console.log("Notification has been sent out.");
				}
			});
	}

	$scope.monitoring_interval = 0;
	var defer;
	socket.on("monitoring/refresh", function(interval) {
		console.log("interval : " + interval);
		$scope.monitoring_interval = interval / 1000;
		if (defer)
			clearInterval(defer);
		defer = setInterval(function() {
			$scope.monitoring_interval--;
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}, 1000);
	});
}

angular
	.module('services', ['ngResource'])
	.service(
		'AMAServiceMonitoringAgent', [
			'$http',
			function($http) {
				/*Changes for HTTP default header for common Autohrization - Saumya*/
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";	
				var service = {
					triggerAlert: function(alert, callback) {
						$http.post('/rest/monitoring', alert)
							.success(function(data) {
								callback(null, data);
							}).error(function(data, err) {
								callback(err, data);
							});
					},
					getAdapterStatus: function(callback) {
						$http.get('/rest/CheckAdapterStatus')
							.success(function(data) {
								callback(null, data);
							}).error(function(data, err) {
								callback(err, data);
							});
					},
					getAlertAuditLogs: function(alert_id,
						account_id, application_id, from, to,
						callback) {
						var query = {
							alert_id: alert_id,
							account_id: account_id,
							application_id: application_id,
							from: from,
							to: to
						};
						$http.get('/rest/AlertAuditLog', query)
							.success(function(data) {
								callback(null, data);
							}).error(function(data, err) {
								callback(err, data);
							});
					},
					reqDownload: function(queryCriteria, callback) {
						$http.post('/file/AlertAuditLog/download',
							queryCriteria).success(
							function(data) {
								callback(null, data);
							}).error(function(data, err) {
							callback(err, data);
						});
					},
					reqTicketDownload: function(queryCriteria, callback) {
						$http.post('/file/TicketAuditLog/download',
								queryCriteria).success(
								function(data) {
									callback(null, data);
								}).error(function(data, err) {
								callback(err, data);
							});
					},
					queryAlertAuditLogs: function(queryCriteria,
						callback) {
						$http.post('/rest/AlertAuditLog/query',
							queryCriteria).success(
							function(data) {
								callback(null, data);
							}).error(function(data, err) {
							callback(err, []);
						});
					},
					queryTicketAuditLogs: function(queryCriteria,
							callback) {
							$http.post('/rest/TicketAuditLog/query',
								queryCriteria).success(
								function(data) {
									callback(null, data);
								}).error(function(data, err) {
								callback(err, []);
							});
						},
					queryAlertAuditLogsWithoutSOPs: function(
						queryCriteria, callback) {
						$http
							.post(
								'/rest/AlertAuditLogWithoutSOPs/query',
								queryCriteria).success(
								function(data) {
									callback(null, data);
								}).error(
								function(data, err) {
									callback(err, []);
								});
					},
					queryTicketAuditLogsWithoutSOPs: function(
							queryCriteria, callback) {
							$http
								.post(
									'/rest/TicketAuditLogWithoutSOPs/query',
									queryCriteria).success(
									function(data) {
										callback(null, data);
									}).error(
									function(data, err) {
										callback(err, []);
									});
					},
					getWorkflowGraph: function(tal_id,
							callback) {
							$http.get('/rest/GetWorkflowGraph/' + tal_id).success(
								function(data) {
									callback(null, data);
								}).error(function(data, err) {
								callback(err, []);
							});
						},
					notify: function(
							auditLog, callback) {
							$http
								.post(
									'/rest/notify',
									auditLog).success(
									function(data) {
										callback(null, data);
									}).error(
									function(data, err) {
										callback(err, data);
									});
					},
					getApplications: function(callback) {
						$http
							.get(
								'/rest/v1/sopmeta/GetApplicationList')
							.success(function(data) {
								callback(null, data);
							}).error(function(data, err) {
								callback(err, data);
							});
					},
					getAccounts: function(callback) {
						$http
							.get(
								'/rest/v1/sopmeta/GetAccountList')
							.success(function(data) {
								callback(null, data);
							}).error(function(data, err) {
								callback(err, data);
							});
					},
					getUserAccess: function(userid, callback) {
						$http.get('/rest/v1/adminmeta/GetUserAccess?userID=' + userid).success(
							function(data) {
								callback(null, data);
							}).error(function(data, err) {
							callback(err, data);
						});
					},
					getHealthStatus: function(callback) {
						$http.get('/rest/v1/health/LastestHealthStatus').success(function(data) {
							callback(null, data);
						}).error(function(data, err) {
							callback(err, data);
						});
					},
					queryHealthStatus: function(accounts, callback) {
						$http.post('/rest/v1/health/LastestHealthStatus', accounts).success(function(data) {
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
	.factory('alertService', function($rootScope, $sce) {
		var alertService = {};

		$rootScope.alerts = [];

		$rootScope.alertTimeout = null;

		alertService.add = function(type, msg) {
			// $rootScope.alerts.pop();
			$rootScope.alerts.push({
				'type': type,
				'msg': $sce.trustAsHtml(msg),
				'close': function() {
					alertService.closeAlert(this);
				}
			});

			$('#alterMessageBox').slideDown(500, function() {

				$(this).find(".close").bind("click", function() {
					if ($rootScope.alertTimeout != null) {
						clearTimeout($rootScope.alertTimeout);
					}
					$rootScope.alerts = [];
					$('#alterMessageBox').slideUp(500);
				});

				if ($rootScope.alertTimeout != null) {
					clearTimeout($rootScope.alertTimeout);
				}
				$rootScope.alertTimeout = setTimeout(function() {
					$rootScope.alerts = [];
					$('#alterMessageBox').slideUp(500);
				}, 3000);
			});
		};

		alertService.closeAlert = function(alert) {
			alertService.closeAlertIdx($rootScope.alerts.indexOf(alert));
		};

		alertService.closeAlertIdx = function(index) {
			$rootScope.alerts.splice(index, 1);
		};

		return alertService;
	})
	.factory(
		'webInterceptor', [
			'$q',
			'$window',
			'$location',
			'alertService',
			function($q, $window, $location, alertService) {
				return {
					response: function(response) {
						return response || $q.when(response);
					},
					responseError: function(response) {
						/*alertService.add("failed", (response.data.userMessage==undefined || response.data.userMessage==null)?"GoldenBridge service not available.":response.data.userMessage);*/
						console.log("Error Service Response:"+response);
						alertService.add("failed", (response.data.userMessage==undefined || response.data.userMessage==null)? response.data:response.data.userMessage);

						return $q.reject(response);
					}
				}
			}
		])
	.config(
		[
			'$httpProvider',
			function($httpProvider) {
				$httpProvider.interceptors.push('webInterceptor');
				$httpProvider.defaults.headers.common['Authorization'] = 'Basic UW5yY2g4TVdreW1zODVuaw==';

			}
		]);

angular.module('app.filters', []).filter('formatDateTime', function() {
	return function(input) {
		if (!input)
			return "";
		var temp = moment(input).toDate();
		var date = moment(temp).format('YYYY-MM-DD HH:mm:ss');
		return date;
	}
})

var app = angular.module('app', ['ui.router', 'services', 'app.filters','ngIdle']);

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
			    		//if(deploy_type=='ON_PREM')
							//logoutURl= logoutDomain + '/ama/logout.html';
						//else
							//logoutURl= logoutDomain + '/idaas/mtfim/sps/idaas/logout';
						
			    		window.location.href = logoutDomain + '/ama/logout.html'; 
						//logoutURl;
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
			window.location.href = docDomain;
		}
}

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