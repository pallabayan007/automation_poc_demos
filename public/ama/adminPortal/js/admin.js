/*Controller for Role and User page in ADMIN module start here*/
var currRoleNameId = '';
var currRoleTimestamp = '';
var capabilityId = new Array();
var capabilityName = new Array();
var capabilityRegStr = new Array();
var capabilityaccessPanel = new Array();
var userAccessAccountID ='';
var userAccessType = '';
var userAccessId = '';
var userAccessRoleName = '';
var userAccessActive = '';
var capabilitiesArray = [];	
var capabilityNameListArray = [];
var whiteListEmailArray = new Array();
var currWLID = '';
var currWLupdateTimestamp = '';
app.controller("InstantRoleSearchController",function($location,$scope,$http){
	$scope.changeRoleSearch = function() {
		$('#roleDataList').show();
		$('#definerolebutn').show();
		
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		$http.get(GetAllRoles).success(function(data) { 	
			var userRoleList = data.response; 
			//console.log(userRoleList);
				for(i=0;i<userRoleList.length; i++){
					$scope.items = userRoleList;
				}		
		});
	};
	
	$scope.showRoleData = function(obj) {
		checkPermission("ViewRoleCap","adminportal");
    	if(flagCheckPM){
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			$http.get(SearchRole +'?roleName='+obj).success(function(data) {
				currRoleNameId = obj;
				var roleAccessData = data.response;
				//console.log(roleAccessData);
				currRoleNameId = roleAccessData._id;
				currRoleTimestamp = roleAccessData.updateTimestamp;
				var roleCapabilities = roleAccessData.Capabilities;
				for(var i=0;i<roleCapabilities.length; i++){
					capabilityId.push(roleCapabilities[i]._id);
					capabilityName.push(roleCapabilities[i].capName);
					capabilityRegStr.push(roleCapabilities[i].capRegStr);
					capabilityaccessPanel.push(roleCapabilities[i].accessPanel);
					
				}
				$('#roleDataList').hide();
				$('#accessFrmGp').hide();
				$('#capstring').hide();
				$('#createRole').show();
				$('#createrolename').val(roleAccessData.roleName).attr("disabled","disabled");
				$('#createroledesciption').val(roleAccessData.roleDescription).attr("disabled","disabled");
				$('#capAmendRecord').html('');
				//$('#capabilityname').hide();
				$('#capabilityUpdateTable').show();
				for(var l=0; l<capabilityId.length; l++){
					$('#capAmendRecord').append('<tr><td id="capbl'+l+'" style="display:none;">'+capabilityId[l]+'</td><td id="capblname'+l+'">'+capabilityName[l]+'</td><td id="capblAccPanel'+l+'">'+capabilityaccessPanel[l]+'</td><td id="capblRegStr'+l+'" style="display:none;">'+capabilityRegStr[l]+'</td><td style="text-align:center;" align="center"><a href="javascript:void(0)" class="editCapbl disableamend" title="Edit Capability"><span class="glyphicon glyphicon-edit" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="saveCapbl" style="display:none;" title="Save Capability"><span class="glyphicon glyphicon-floppy-disk" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="deleteCapbl disableamend" title="Delete Capabiiltity"><span class="glyphicon glyphicon-remove-sign" style="font-size:20px;"></span></a></tr>');				
				}
				capabilityId.length=0;
				capabilityName.length=0;
				capabilityRegStr.length=0;
				capabilityaccessPanel.length=0;
				
				//$('#capstring').hide();
				$('#createrolesubmit').hide().addClass('amendState');
				$('#createroleupdate').hide();
			 	$('#commentSection').remove();
				$('#definerolebutn').hide();
				$('#amendrolebutton').show();
				if($('#deleterolebutton').hasClass('saAdmin')){
					$('#deleterolebutton').show();
				}
				$('#RoleSearch').hide();
				$('#addRoleCapabilities').hide();		
				$('#role_required').hide();
				$('#appTable').hide();
				$('#alterMessageBoxCreateUser').hide();
			});
    	}else{
    		alert("You do not have access privileges for this operation");
    	}
	};
});

app.controller("InstantUserSearchController",function($location,$scope,$http){
	$scope.changeSearch = function() {
		$('#alertUserList').show();
		$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		$http.get(getAllUser).success(function(data) { 
			var fetchData = data.response; 
			if(fetchData != ''){
				for(i=0;i<fetchData.length; i++){
					$scope.items = fetchData;
				}
			}else{
				alert('No User is created!');
			}
			
		});
	};
	
	$scope.showUserData = function(obj,id) {
		checkPermission("ViewUserAccess","adminportal");
    	if(flagCheckPM){
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			$http.get(GetUserAccess +'?userID='+obj).success(function(data) {
				currentuserID = id;
				var userAccessData = data.response;
				userAccessAccountID = userAccessData.accountID;
				userAccessType = userAccessData.type;
				userAccessId = userAccessData.userID;
				userAccessRoleName = userAccessData.roleName;
				userAccessActive = userAccessData.active;
				updateTimestampVal = userAccessData.updateTimestamp;
				
				$('#applicationRecord').hide();
				$('#applicationUpRecord').html('');
				var accountData = userAccessData.account;
				if (typeof(accountData[0]) != 'undefined' && accountData[0] != null){
					for (var i = 0 ; i < accountData.length; i++){
						if (typeof(accountData[i].accountName) != 'undefined' && accountData[i].accountName != null){
							var acd = "<tr><td style='display:none;'>"+accountData[i].accountId+"</td><td> "+accountData[i].accountName+"</td>";
						}
						var applArray = new Array();
						console.log(accountData[i].applicationList);
						 if (typeof(accountData[i].applicationList) != 'undefined' && accountData[i].applicationList != null){
							 applArray = accountData[i].applicationList;
						 }
						var nameArray = new Array();
						var idArray = new Array();
						for (var j = 0; j < applArray.length; j++){
							if (typeof(applArray[j].applicationName) != 'undefined' && applArray[j].applicationName != null){
								nameArray.push(applArray[j].applicationName);
								idArray.push(applArray[j].applicationId);
							}
						}
						var apl = "<td style='display:none;'>"+idArray+"</td><td>"+nameArray+"</td><td style='text-align:center;' align='center'><a href='javascript:void(0)' class='editAppl disableamend' title='Edit Application'><span class='glyphicon glyphicon-edit' style='font-size:20px;'></span></a>&nbsp;&nbsp;<a href='javascript:void(0)' class='saveAppl' style='display:none;' title='Save Application'><span class='glyphicon glyphicon-floppy-disk' style='font-size:20px;'></span></a>&nbsp;&nbsp;<a href='javascript:void(0)' class='deleteAppl disableamend' title='Delete Application'><span class='glyphicon glyphicon-remove-sign' style='font-size:20px;'></span></a></tr></tr>";		     	
						$('#applicationUpRecord').append(acd+apl);
					}
				}else{
					alert('No Account for this user');
				}
				$('#alertUserList').hide();
				$('#alterMessageBoxCreateUser').hide();
				$('#userDataList').hide();
				$('#createuserupdate').hide();
				$('#applicationTable').hide();			
				$('#createUser').show();
				$('#createusername').val(userAccessData.userName).attr("disabled","disabled");
				$('#createuserid').val(userAccessData.userID).attr("disabled","disabled");
				$('#accContent').hide();
				$('#applicationContent').hide();
				$('#applicationUpTable').show();
				$('#adminUserType').html('<option>'+userAccessData.type+'</option>').attr("disabled","disabled");
				$('#createuserrole').val(userAccessData.roleName).attr("disabled","disabled");
				$('#adminUserEmail').val(userAccessData.email).attr("disabled","disabled");
				$('#createuseractive').val(userAccessData.active).attr("disabled","disabled");
				$('#createusersubmit').hide().addClass('amendState');
				$('#defineuserbutton').hide();
				$('#amenduserbutton').show();
				if($('#deleteuserbutton').hasClass('saAdmin')){
					$('#deleteuserbutton').show();
				}
				$('#commentSectionUser').remove();
				$('#capabilitysection').hide();
				$('#UserSearch').hide();
				$('#user_required').hide();
			});
    	}else{
    		alert("You do not have access privileges for this operation");
    	}
	};
	
});

app.controller("createRoleUser",function($location,$scope,$http){
	$scope.createrole = {};	
	$scope.capRows = [];
	$scope.appCapTable = true;
		
	$scope.createrole.amendRoleData = function(obj) {
		checkPermission("UpdateRoleCap","adminportal");
    	if(flagCheckPM){
			$('#createrolename').removeAttr("disabled","disabled");
			$('#createroledesciption').removeAttr("disabled","disabled");
			$('#createcapabilityname').removeAttr("disabled","disabled");
			$('#addRoleCapabilities').show();
			//$('#capstring').show();
			$('#createroleupdate').show();
			$('#commentSection').remove();
			$('#capstring').after('<div class="form-group" id="commentSection"><label class="col-sm-2 control-label">Comments :</label><div class="col-sm-6"><input class="form-control" type="text" required="true" ng-model="createuser.comments" id="createusercomments" placeholder="Enter comment" /></div><div class="col-sm-2"><span style="color:red;" > * required</span> </div></div>');
			$('#addRoleCapabilities').hide();
			$('#role_required').hide();
			$('.deleteCapbl').removeClass('disableamend');
			$('.editCapbl').removeClass('disableamend');
			$('#addCaplUpdate').show();
    	}else{
    		alert("You do not have access privileges for this operation");
    	}
	};
	
	$scope.createrole.deleteRoleData = function(obj) {
		checkPermission("DeleteRoleCap","adminportal");
    	if(flagCheckPM){
			var r = confirm("Are you sure to delete!");
			if (r == true) {
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				$http.delete(DeleteRole + '?Id='+currRoleNameId).success(function(data) {
		  	    	//console.log("Deletion successful!");
		  	    	$scope.message = "Deletion successful!";
		  	    	$('#createRole').hide(); 
					$('#RoleSearch').show(); 
					$('#definerolebutn').show();
					$('#amendrolebutton').hide();	
				});	
			}
    	}else{
    		alert("You do not have access privileges for this operation");
    	}
	};

	$scope.createrole.changeAccessPanel = function(item, event) {
		var selectedAccessPanel = $('#useraccessPanel').val();
		$('#usersupportLevel').html('');
		$('#capstring').show();
		var getPermissinList='';
		if(selectedAccessPanel == 'sopeditor'){
			getPermissinList = GetAccessPanelPermission.sopeditor;
		}else if(selectedAccessPanel == 'dashboard'){
			getPermissinList = GetAccessPanelPermission.dashboard;
		}else if(selectedAccessPanel == 'adminportal'){
			getPermissinList = GetAccessPanelPermission.adminportal;
		}
		for(var i = 0; i< getPermissinList.length; i++){
			$('#usersupportLevel').append('<option value="'+getPermissinList[i]+'">'+getPermissinList[i]+'</option>')
		}
	};
	$scope.createrole.changeUpdateAccessPanel = function(item, event) {
		var selectedAccessPanel = $('#useraccessPanelu').val();
		$('#usersupportLevelu').html('');
		$('#capstringu').show();
		var getPermissinList='';
		if(selectedAccessPanel == 'sopeditor'){
			getPermissinList = GetAccessPanelPermission.sopeditor;
		}else if(selectedAccessPanel == 'dashboard'){
			getPermissinList = GetAccessPanelPermission.dashboard;
		}else if(selectedAccessPanel == 'adminportal'){
			getPermissinList = GetAccessPanelPermission.adminportal;
		}
		for(var i = 0; i< getPermissinList.length; i++){
			$('#usersupportLevelu').append('<option value="'+getPermissinList[i]+'">'+getPermissinList[i]+'</option>')
		}
	};
	$scope.createrole.addGeneratedCapability = function(item, event) {
		var accessPanel = $scope.createrole.accessPanel;
		var supportlevel = $scope.createrole.supportlevel;
		if(supportlevel != undefined){
			$('#waitAlertContainer').show();
			$('#WaitAlertMsg').show();	
			
			var dataObject = {
				    "AccessPanel":accessPanel,
					"Permissions":supportlevel				
				};
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		    var responsePromise = $http.post(generateCapabilityName, dataObject, {});
		    responsePromise.success(function(data, status, headers, config) {
			// $http.get(createCapabilityName+'?accesspanel='+accessPanel+'&permission='+supportlevel).success(function(data) {
				 	if(data.serviceCode == 0){
					 	var capaResp = data.response;
					 	var capRespcapabilityName = capaResp.capabilityName;
				    	setTimeout(function(){
					    	var capData = {'capname':capRespcapabilityName};
					    	if(supportlevel != null){
								$scope.appCapTable = false;
								$('#appTable').show();
								$scope.capRows.push(capRespcapabilityName);		 
							 }else{
								alert('Please Select Support Level');
							 }
					    	var perAllowData = supportlevel.toString();
							var capsuprg = perAllowData.replace(",", "|");
							var capRegx = "^"+capRespcapabilityName+"("+capsuprg+")";
							var capArrayData = {"capName":capRespcapabilityName, "capRegStr": capRegx, "accessPanel":accessPanel};
							capabilityNameListArray.push(capRespcapabilityName);
							capabilitiesArray.push(capArrayData);
							$('#roleCapList').append('<tr><td>'+capRespcapabilityName+'</tr></td>');
							$('#WaitAlertMsg').hide();
							$('#waitAlertContainer').hide();
	
							var selectedAccessPanel = $('#useraccessPanel').val();
							$('#usersupportLevel').html('');
							//$('#capstring').show();
							var getPermissinList='';
							if(selectedAccessPanel == 'sopeditor'){
								getPermissinList = GetAccessPanelPermission.sopeditor;
							}else if(selectedAccessPanel == 'dashboard'){
								getPermissinList = GetAccessPanelPermission.dashboard;
							}else if(selectedAccessPanel == 'adminportal'){
								getPermissinList = GetAccessPanelPermission.adminportal;
							}
							for(var i = 0; i< getPermissinList.length; i++){
								$('#usersupportLevel').append('<option value="'+getPermissinList[i]+'">'+getPermissinList[i]+'</option>')
							}						
							
				    	}, 500);
				 	}else{
				 		$('#showDuplicateCapability').show();
					 	$('#errorAdminCapMsg').html(data.userMessage + ". Do you want to continue?");
				 		$('#WaitAlertMsg').hide();
						//$('#waitAlertContainer').hide();
						var selectedAccessPanel = $('#useraccessPanel').val();
						$('#usersupportLevel').html('');
						//$('#capstring').show();
						var getPermissinList='';
						if(selectedAccessPanel == 'sopeditor'){
							getPermissinList = GetAccessPanelPermission.sopeditor;
						}else if(selectedAccessPanel == 'dashboard'){
							getPermissinList = GetAccessPanelPermission.dashboard;
						}else if(selectedAccessPanel == 'adminportal'){
							getPermissinList = GetAccessPanelPermission.adminportal;
						}
						for(var i = 0; i< getPermissinList.length; i++){
							$('#usersupportLevel').append('<option value="'+getPermissinList[i]+'">'+getPermissinList[i]+'</option>')
						}
				 	}
			 });	
		}else{
			alert('Please select user support level');
		}
	    
	};
	
	$scope.createrole.addGeneratedCapabilityUpdate = function(item, event) {
		$('#capblUpdate').show();
		$('#capblEditor').show();
		var accessPanel = $scope.createrole.accessPanelu;
		var supportlevel = $scope.createrole.supportlevelu;
		$('#waitAlertContainer').show();
		$('#WaitAlertMsg').show();	
		
		if(supportlevel != null){
			var dataObject = {
				    "AccessPanel":accessPanel,
					"Permissions":supportlevel				
				};
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		    var responsePromise = $http.post(generateCapabilityName, dataObject, {});
		    responsePromise.success(function(data, status, headers, config) {
		    	if(data.serviceCode == 0){
		    		setTimeout(function(){
			    		$('#waitAlertContainer').hide();
			    		$('#WaitAlertMsg').hide();
			    		var capaResp = data.response;
					 	var capRespcapabilityName = capaResp.capabilityName;					 	
					 	var capData = {'capname':capRespcapabilityName};
					 	$scope.capRows.push(capRespcapabilityName);
					 	var perAllowData = supportlevel.toString();
						var capsuprg = perAllowData.replace(",", "|");
						var capRegx = "^"+capRespcapabilityName+"("+capsuprg+")";
						var capArrayData = {"capName":capRespcapabilityName, "capRegStr": capRegx, "accessPanel":accessPanel};
						capabilityNameListArray.push(capRespcapabilityName);
						capabilitiesArray.push(capArrayData);
						//console.log(capRespcapabilityName+"  : "+capRegx+" : "+currTableIndex);
						if($("#addRoleCapabilitiesu").hasClass('addUpCapbl')){
							$('#capAmendRecord').append('<tr><td style="display:none;"></td><td id="">'+capRespcapabilityName+'</td><td id="">'+accessPanel+'</td><td id="" style="display:none;">'+capRegx+'</td><td style="text-align:center;" align="center"><a href="javascript:void(0)" class="editCapbl disableamend" title="Edit Capability"><span class="glyphicon glyphicon-edit" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="saveCapbl" style="display:none;" title="Save Capability"><span class="glyphicon glyphicon-floppy-disk" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="deleteCapbl disableamend" title="Delete Capabiiltity"><span class="glyphicon glyphicon-remove-sign" style="font-size:20px;"></span></a></tr>');
							$('#capblUpdate').hide();
							$('#capblEditor').hide();
						}else{
							$('#capblname'+currTableIndex).html(capRespcapabilityName);
							$('#capblAccPanel'+currTableIndex).html(accessPanel);
							$('#capblRegStr'+currTableIndex).html(capRegx);	
							$('#capblUpdate').hide();
							$('#capblEditor').hide();
						}
		    		},500);
		    	}else{
		    		$('#showDuplicateCapability').show();
				 	$('#errorAdminCapMsg').html(data.userMessage + ". Do you want to continue?");
			 		$('#WaitAlertMsg').hide();
		    		
		    		//$('#messageBoxError').show();
				 	//$('.errorAdminMsg').html(data.userMessage);
			 		//$('#WaitAlertMsg').hide();
					//$('#waitAlertContainer').hide();
					$('#capblUpdate').hide();
					$('#capblEditor').hide();
		    	}
		    });
		 }else{
			alert('Please Select Support Level');
		 }	 	 
	};
	
	$scope.createrole.addTaskcapability = function(item, event) {
		var capname = $scope.createrole.capabilityname;
		var permission = $scope.createrole.supportlevel;
		var capData = {'capname':capname};
		
		//console.log(capData);
		if(capname != null && permission !=null){
			$scope.appCapTable = false;
			$('#appTable').show();
			$scope.capRows.push(capData);		 
		 }else{
			alert('Please enter Capability Name and Permission');
		 }
		var perAllowData = permission.toString();
		var capsuprg = perAllowData.replace(",", "|");
		var capRegx = "^"+$scope.createrole.capabilityname+"("+capsuprg+")";
		var capArrayData = {"capName":capname, "capRegStr": capRegx};
		capabilityNameListArray.push(capname);
		capabilitiesArray.push(capArrayData);
		$('#createcapabilityname').val('');
	};
	
	$scope.createrole.submitForm = function() {
		
		if($('#createrolesubmit').hasClass('amendState')){
		    var updateUserId='';
		    $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		    $http.get(getAuthorization).success(function(data) {
		    	updateUserId = data.userName;
		    });
		    var updaterolename = $('#createrolename').val();
		    var updateroledesciption = $('#createroledesciption').val();
		    var updatecapabilityname= new Array();
		    var countTableRow = $('#capAmendRecord').children().length;

		    for (var i = 0; i < countTableRow; i++) {
		    	var rowRecord = $('#capAmendRecord tr:eq('+i+') td:eq(1)').text();
		    	updatecapabilityname.push(rowRecord);
		    }

		    var upCapblData = $('#capabilityUpdateTable').tableToJSON({ignoreHiddenRows: false});			   
			//console.log("Capability String: "+upCapblData);	   
			var dataObject = {
				"roleName": updaterolename,
				"roleDescription": updateroledesciption,
				"updateTimestamp": currRoleTimestamp,
				"capabilityNameList": updatecapabilityname,
				"Capabilities": upCapblData						
			};
			
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			var responsePromise = $http.put(UpdateRole+"?Id="+currRoleNameId, dataObject, {});	
		    responsePromise.success(function(dataFromServer, status, headers, config) {
		       console.log(dataFromServer.userMessage +' : '+status);
		       $('#alterMessageBoxCreateUser').show();
		 	   $('.updateMsg').html(dataFromServer.userMessage);
		 	   $('#createrolesubmit').removeClass('amendState');
		 	   $('#createRole').hide();
		 	   $('#RoleSearch').show();
		 	   $('#definerolebutn').show();
		 	   $('#commentSection').remove();
		 	   $('#capAmendRecord').html('');
		    });
		}else{			
			var dataObject = {
					   "roleName": $scope.createrole.rolename,
					   "roleDescription": $scope.createrole.roledescription,
					   "capabilityNameList": capabilityNameListArray,
					   "Capabilities": capabilitiesArray
			};
			//console.log('Submit Admin User: ' + $scope.createuser.username + 'Role : '+ $scope.createuser.role);
			if(capabilityNameListArray.length > 0){
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				var responsePromise = $http.post(CreateRole, dataObject, {});	
			    responsePromise.success(function(dataFromServer, status, headers, config) {
			       //console.log(dataFromServer.userMessage +' : '+status);
			    	$('#alterMessageBoxCreateUser').show();
			 	   	$('.updateMsg').html(dataFromServer.userMessage);
			 	   	$('#createRole').hide();
			 	   	$('#RoleSearch').show();
			 	   	$('#definerolebutn').show();
			 	   	$scope.capRows.length = 0;
			 	   capabilityNameListArray.length = 0;
					$('#createrolename').val('');
					$('#createroledesciption').val('');
					$('#createcapabilityname').val('');
					$('#roleCapList').html('');
			    });
			}else{
				alert('Please Add Capability');
				return false;
			}
		}
	};
});


app.controller("createAdminUser",function($location,$scope,$http){
	$scope.createuser = {};	
	var accountNameArray = new Array();
	var accountIdArray = new Array();
	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	$http.get(GetAccountList).success(function(data) { 
		var dataArr = data.response;
		//console.log("data"+dataArr);
     	for (var i = 0; i < dataArr.length; i++){      		
     		$scope.applications = dataArr;
     		accountNameArray.push(dataArr[i].accountName);
     		accountIdArray.push(dataArr[i]._id);
     	}    	
    });
	
	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
	$http.get(GetAllRoles).success(function(data) { 	
		var userRoleList = data.response; 
			for(i=0;i<userRoleList.length; i++){
				$scope.Roleitems = userRoleList;
			}		
	});
	
	$scope.createuser.getApplication = function(obj) {
		var selectedAccountId = $("#createaccountid option:selected").val();
		$http.get(GetApplicationListForAccount + '?accountId='+selectedAccountId).success(function(data) { 
			var currApppl = data.response;
			$('#applicationList').html('');
			for (var k = 0; k < currApppl.length; k++){  
	     		$('#applicationList').append("<option value='"+currApppl[k]._id+"'>"+currApppl[k].applicationName+"</option>");	     		
	     	}
			$('#applicationContent').show();
		});
	};
	$scope.createuser.getUpApplication = function(obj) {
		var selectedAccountId = $("#updateaccountid option:selected").val();
		$http.get(GetApplicationListForAccount + '?accountId='+selectedAccountId).success(function(data) { 
			var currApppl = data.response;
			$('#updateapplicationList').html('');
			for (var k = 0; k < currApppl.length; k++){  
	     		$('#updateapplicationList').append("<option value='"+currApppl[k]._id+"'>"+currApppl[k].applicationName+"</option>");	     		
	     	}
			$('#updateapplicationList').show();
		});
	};

	$scope.createuser.addApplication = function(obj) { 
		$('#applicationRecord').show();
		var selectedAccountId = $("#createaccountid option:selected").val();
		var selectedAccountName = $("#createaccountid option:selected").text();
		var applicationOptionList = $scope.createuser.applicationlist;
		var applList = []; 
		$('#applicationList :selected').each(function(i, selected){ 
			applList[i] = $(selected).text(); 
		});
		//console.log(applList);
		var rowCount = $('#applicationRecord tr').length;
		var accountIdData = [];
		for(var i=0; i<rowCount; i++){
			accountIdData.push(document.getElementById("applicationRecord").rows[i].cells[0].innerHTML);
		}
		var checkCurrentAccount = accountIdData.indexOf(selectedAccountId);
		if(applicationOptionList != null){
			if(checkCurrentAccount >= 0){
				alert("This Account is already added, please choose different account");
				return false;
			}else{
				$('#applicationRecord').append("<tr><td style='display:none;'>"+selectedAccountId+"</td><td>"+selectedAccountName+"</td><td style='display:none;'>"+applicationOptionList+"</td><td>"+applList+"</td></tr>");
				$('#applicationTable').show();
				$('#addApplication').addClass('clicked');
			}
		}else{
			alert('Please select application/s for this account');
		}
	};
	
	$scope.createuser.amendUserData = function(obj) {
		checkPermission("UpdateUserAccess","adminportal");
    	if(flagCheckPM){
			$('#createusername').removeAttr("disabled","disabled");
			$('#createuserupdate').show();
			$('#addAccUpdate').show();
			$('#createuserrole').html('');
			$('#createuserrole').removeAttr("disabled","disabled");
			$http.get(GetAllRoles).success(function(data) { 	
				var userRoleList = data.response; 
					for(i=0;i<userRoleList.length; i++){
						$('#createuserrole').append('<option value="'+userRoleList[i].roleName+'">'+userRoleList[i].roleName+'</option>');
					}
					$("#createuserrole option[value='"+userAccessRoleName+"']").attr("selected","selected");
			});
			//$('#createuserid').removeAttr("disabled","disabled");
			/*var accountOpt;
			for(var j=0; j<accountIdArray.length; j++){
				accountOpt = accountOpt + "<option value='"+accountIdArray[j]+"'>"+accountNameArray[j]+"</option>";
			}
			
			$('#createaccountid').removeAttr("disabled","disabled").html(accountOpt);*/
			
			$("#createaccountid option[value='"+userAccessAccountID+"']").attr("selected","selected");
			console.log("Loggeed in user type: "+localStorage.getItem("type"));
			if(localStorage.getItem("type")!='SuperAdmin'){
				$('#adminUserType').removeAttr("disabled","disabled").html('<option value="Normal">Normal</option><option value="Admin">Admin</option>');
				$("#adminUserType option[value='"+userAccessType+"']").attr("selected","selected");					
				$('#createuseractive').removeAttr("disabled","disabled").html('<option value="Y" selected="selected">Active</option><option value="N">In-active</option>');
			}else if(localStorage.getItem("type") =='SuperAdmin'){
				if(userAccessId == localStorage.getItem("userID")){				
					$('#adminUserType').attr("disabled","disabled");
				}else{
					$('#adminUserType').removeAttr("disabled","disabled").html('<option value="Normal">Normal</option><option value="Admin">Admin</option><option value="SuperAdmin">Super Admin</option>');
				}
				$("#adminUserType option[value='"+userAccessType+"']").attr("selected","selected");					
				$('#createuseractive').attr("disabled","disabled");
			}
			$("#createuseractive option[value='"+userAccessActive+"']").attr("selected","selected");
			$('#activeContent').after('<div class="form-group" id="commentSectionUser"><label class="col-sm-2 control-label">Comments :</label><div class="col-sm-10"><input type="text" required="true" ng-model="createuser.comments" id="createusercommentsA" placeholder="Enter comment" /><span style="color:red;" > * required</span> </div></div>');
			$('#adminUserEmail').removeAttr("disabled","disabled");
			$('#createuserupdate').show();
			//$('#commentSection').show();
			$('#UserSearch').hide();
			$('#user_required').hide();
			$('.deleteAppl').removeClass('disableamend');
			$('.editAppl').removeClass('disableamend');
    	}else{
    		alert("You do not have access privileges for this operation");
    	}	
	};
	$scope.createuser.deleteUserData = function(obj) {
		checkPermission("DeleteUserAccess","adminportal");
    	if(flagCheckPM){
			var r = confirm("Are you sure to delete!");
			if (r == true) {
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
				$http.delete(DeleteUserAccess + '?Id='+currentuserID).success(function(data) {
		  	    	//console.log("Deletion successful!");
		  	    	$('.updateMsg').html(data.userMessage);
		  	    	$('#createUser').hide(); 
					$('#UserSearch').show(); 
					$('#defineuserbutn').show();
					$('#amenduserbutton').hide();	
				});	
			}
    	}else{
    		alert("You do not have access privileges for this operation");
    	}
	}
	$scope.createuser.submitForm = function() {
		
		if($('#createusersubmit').hasClass('amendState')){
		    var updateUserId='';
		    $http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		  /*  $http.get(getAuthorization).success(function(data) {
		    	updateUserId = data.userName;
		    });*/
		  
		    var usernameupdate = $('#createusername').val();
		    var useridupdate = $('#createuserid').val();
		    //var accountidupdate = $('#createaccountid').val();
		    var userroleupdate = $('#createuserrole').val();
		    var userTypeupdate = $('#adminUserType').val();
		    var userupdate = $('#createusercommentsA').val();
		    var userupdateEmail = $('#adminUserEmail').val();
		    var userActiveData =  $("#createuseractive").val();
		    var accUpApplData = [];
		    $("#applicationUpTable tr").each(function(i){
			     if(i==0) return;
			     var accountId = $.trim($(this).find("td").eq(0).html());
			     var applicationIdListString = $.trim($(this).find("td").eq(2).html());
			     var applicationIdList = new Array();
			     applicationIdList = applicationIdListString.split(",");			     
			     accUpApplData.push({accountId: accountId, applicationIdList: applicationIdList});
			   });
		    if(userActiveData!='N'){
				var dataObject = {
					    "userName": usernameupdate,
					    "userID": useridupdate,
					    "roleName": userroleupdate,
					    "account": accUpApplData,
					    "type": userTypeupdate,
					    "active": userActiveData,
					    "email":userupdateEmail,
					    "updatedByUserId":localStorage.getItem("userID"),
					    "updateTimestamp":updateTimestampVal,
					    "updateComment":userupdate
				};
		    } else {
		    	$('#messageBoxError').show();
		    	$('.errorAdminMsg').html('Super Admin User diactivation not allowed');	
		    	
		    }
			console.log("Updateddata: "+dataObject);
			$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
		    var responsePromise = $http.put(UpdateUserAccess+"?Id="+currentuserID, dataObject, {});	
		    responsePromise.success(function(dataFromServer, status, headers, config) {
		       console.log(dataFromServer.userMessage +' : '+status);
		       $('#alterMessageBoxCreateUser').show();
		 	   $('.updateMsg').html(dataFromServer.userMessage);
		 	   $('#createusersubmit').removeClass('amendState');
		 	   $('#createUser').hide();
		 	   $('#UserSearch').show();
		 	   $('#defineuserbutton').show();
		 	   $('#createusername').val('');
		 	   $('#createaccountid').val('');
		 	   $('#adminUserEmail').val('');
		 	   $('#addAccUpdate').hide();
		    });
		}else{
			   var accountidCreate = $('#createaccountid').val();
			   var createuseractive = $('#createuseractive').val();
			   var createuserrole = $('#createuserrole').val();
			   var adminUserType = $('#adminUserType').val();			   
			   var accApplData = [];
			   $("#applicationTable tr").each(function(i){
			     if(i==0) return;
			     var accountId = $.trim($(this).find("td").eq(0).html());
			     var applicationIdListString = $.trim($(this).find("td").eq(2).html());
			     var applicationIdList = new Array();
			     applicationIdList = applicationIdListString.split(",");	
			     //console.log(applicationIdList);
			     accApplData.push({accountId: accountId, applicationIdList: applicationIdList});
			   });
			   //console.log(accApplData);
			var dataObject = {
				    "userName": $scope.createuser.username,
				    "userID": $scope.createuser.userid,
				    "roleName": createuserrole,
				    "type": adminUserType,
				    "active": createuseractive,
				    "email":$scope.createuser.email,
				    "account": accApplData
			};
			if($('#addApplication').hasClass('clicked')){
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			    var responsePromise = $http.post(CreateUserAccess, dataObject, {});	
			    responsePromise.success(function(dataFromServer, status, headers, config) {
			       //console.log(dataFromServer.userMessage +' : '+status);
			       $('#alterMessageBoxCreateUser').show();
			 	   $('.updateMsg').html(dataFromServer.userMessage);
			 	   $('#createUser').hide();
			 	   $('#UserSearch').show();
			 	   $('#applicationContent').hide();
			    });
			    responsePromise.error(function(dataFromServer, status, headers, config) {
			    	//console.log(dataFromServer.userMessage +' : '+status);
			    	$('#messageBoxError').show();
			    	$('.errorAdminMsg').html(dataFromServer.userMessage);
			    	
			   });
			}else{
				alert("Please add application associated with the account");
			}
		   
		}
	};
});
/*Controller for Role and User page in ADMIN module ends here*/
app.controller("addEmailWhiteList",function($location,$scope,$http){
	$scope.createEmailWhitelist = function() {
		//console.log("whitelist-adding");
		var emailIdWhiteListInput = $('#emailIdWhiteList').val();
		if(emailIdWhiteListInput != ''){
		var whiteListIds = $('#emailIdWhiteList').val().split(",");	
		var tmpWhiteList = [];
		    for(var i = 0; i < whiteListIds.length; i++){
		        if(tmpWhiteList.indexOf(whiteListIds[i]) == -1 && ValidateEmail(whiteListIds[i])){
		        	tmpWhiteList.push(whiteListIds[i]);
		        }
		    }

			var dataObject = {
				    "emailIDList": tmpWhiteList,
				    "clientID": localStorage.getItem("clientId"),
				    "accountID": $("#accountSelOps option:selected").val()
			};
			//console.log("Outside: "+validEmail);
				$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			    var responsePromise = $http.post(createEmailWhitelist, dataObject, {});	
			    responsePromise.success(function(dataFromServer, status, headers, config) {
			        //console.log("Sucess: "+dataFromServer.userMessage);        
			        $("#alterMessageBoxCreateUser").show();
			    	$(".updateMsg").html(dataFromServer.userMessage);
			    	var dataObject = {
			    		    "clientId": localStorage.getItem("clientId"),
			    		    "accountId": localStorage.getItem("accountId")
			    	};
			    	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
			        var responsePromise1 = $http.post(getEmailWhitelist, dataObject, {});	
			        responsePromise1.success(function(dataFromServer, status, headers, config) {
			        	//console.log("fetching data and display table");
			        	if (typeof(dataFromServer.response[0]) != 'undefined'){
					    	$('#tableWhiteListed').show();
					        $("#addedEmailList").html('');
					        $('#emailIdWhiteList').val('');
					        whiteListEmailArray = [];
					        var fetchData = dataFromServer.response[0].emailIDList;
					        currWLID = dataFromServer.response[0]._id;
					        currWLupdateTimestamp = dataFromServer.response[0].updateTimestamp;
					        for(var i=0; i<fetchData.length; i++){
					        	//console.log(fetchData[i]+ " -- ");
					        	whiteListEmailArray.push(fetchData[i]);
					        	$("#addedEmailList").append('<tr id="emailRow'+i+'"><td>'+fetchData[i]+'</td><td><a class="deleteEmail" title="Delete Email ID" onclick="removeEmailUpdate('+(i+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a></td></tr>');
					        }
			        	}
			        });
			    });
			    responsePromise.error(function(dataFromServer, status, headers, config) {
			    	//console.log("Failure: "+dataFromServer.userMessage);
			    	//$("#messageBoxError").show();
			    	//$(".errorAdminMsg").html(dataFromServer.userMessage);
			    	whiteListEmailArray = whiteListEmailArray.concat(whiteListIds);
			    	var tmpWhiteLists = [];
				    for(var i = 0; i < whiteListEmailArray.length; i++){
				        if(tmpWhiteLists.indexOf(whiteListEmailArray[i]) == -1 && ValidateEmail(whiteListEmailArray[i])){
				        	tmpWhiteLists.push(whiteListEmailArray[i]);
				        }
				    }
			    	if(dataFromServer.serviceCode == '1'){
				    	var dataObject =  {
				    				"emailIDList": tmpWhiteLists,
				    				"clientID":localStorage.getItem("clientId"),
				    				"accountID":localStorage.getItem("accountId"),
				    				"updateTimestamp":currWLupdateTimestamp
				    	};
				    	var responsePromise = $http.put(updateEmailWhitelist+"?Id="+currWLID, dataObject, {});
				        responsePromise.success(function(dataFromServer, status, headers, config) {
				        	console.log("Success put: "+dataFromServer.userMessage);
				        	$('#tableWhiteListed').show();
					        $("#addedEmailList").html('');
					        $('#emailIdWhiteList').val('');
					        whiteListEmailArray = [];
					        var fetchData = dataFromServer.response.emailIDList;
					        //currWLID = dataFromServer.response._id;
					        currWLupdateTimestamp = dataFromServer.response.updateTimestamp;
				        	for(var i=0; i<fetchData.length; i++){
				        		whiteListEmailArray.push(fetchData[i]);
					        	$("#addedEmailList").append('<tr id="emailRow'+i+'"><td>'+fetchData[i]+'</td><td><a class="deleteEmail" title="Delete Email ID" onclick="removeEmailUpdate('+(i+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a></td></tr>');
					        }
				        });
				        responsePromise.error(function(dataFromServer, status, headers, config) {
				        	console.log("Failure put: "+dataFromServer.userMessage);
				        	$("#messageBoxError").show();
				        	$(".errorAdminMsg").html(dataFromServer.userMessage);    	
				       });
			       }else{
			    	   alert("Email Ids not merged due to technical error.");
			       }
			  });
		}else{
			alert("Please enter atleast one Email Id.")
		}
	};
});

app.controller("addedEmailWhiteList",function($location,$scope,$http){
	console.log("whitelist-getting"+firstAccountId);
	var dataObject = {
		    "clientId": localStorage.getItem("clientId"),
		    "accountId": localStorage.getItem("accountId")
	};
	$http.defaults.headers.common.Authorization = "Basic UW5yY2g4TVdreW1zODVuaw==";
    var responsePromise = $http.post(getEmailWhitelist, dataObject, {});	
    responsePromise.success(function(dataFromServer, status, headers, config) {        
        if (typeof(dataFromServer.response[0]) != 'undefined'){
        	//console.log("Sucess get: "+dataFromServer.response[0].emailIDList);
	        $('#tableWhiteListed').show();
	        $("#addedEmailList").html('');
	        $('#emailIdWhiteList').val('');
	        whiteListEmailArray = [];
	        var fetchData = dataFromServer.response[0].emailIDList;
	        currWLID = dataFromServer.response[0]._id;
	        currWLupdateTimestamp = dataFromServer.response[0].updateTimestamp;
	        for(var i=0; i<fetchData.length; i++){
	        	//console.log(fetchData[i]+ " -- ");
	        	whiteListEmailArray.push(fetchData[i]);
	        	$("#addedEmailList").append('<tr id="emailRow'+i+'"><td>'+fetchData[i]+'</td><td><a class="deleteEmail" title="Delete Email ID" onclick="removeEmailUpdate('+(i+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a></td></tr>');
	        }
        }
    });
    responsePromise.error(function(dataFromServer, status, headers, config) {
    	console.log("Failure get: "+dataFromServer.userMessage);
    	$("#messageBoxError").show();
    	$(".errorAdminMsg").html(dataFromServer.userMessage);    	
   });
});

function discardDuplicate(arr){
    var tmp = [];
    for(var i = 0; i < arr.length; i++){
        if(tmp.indexOf(arr[i]) == -1 && ValidateEmail(arr[i])){
        tmp.push(arr[i]);
        }
    }
    return tmp;
}

function ValidateEmail(inputText){  
		var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;  
			if(inputText.match(mailformat))  
				return true;  
			else  
				return false; 
}

function removeEmailUpdate(rowId){
	var currentArrayLength = whiteListEmailArray.length;
	//console.log(typeof(currentArrayLength));
	if(currentArrayLength != 1){
		whiteListEmailArray.splice(rowId - 1,1);	
		var dataObject =  {
					"emailIDList": whiteListEmailArray,
					"clientID":localStorage.getItem("clientId"),
					"accountID":localStorage.getItem("accountId"),
					"updateTimestamp":currWLupdateTimestamp
		};
		console.log("dataObject "+JSON.stringify(dataObject));
		 $.ajax({
			 beforeSend: function(xhrObj){
	             xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
			 },
			 contentType: 'application/json',
			 url: updateEmailWhitelist+"?Id="+currWLID,
			 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},
			 data: JSON.stringify(dataObject),
			 dataType: "json",
			 type: "PUT",
			 success: function(data) {
				 	console.log(data.response.updateTimestamp);
				 	//currWLID = dataFromServer.response[0]._id;
			        currWLupdateTimestamp = data.response.updateTimestamp;
				 	$("#emailRow"+rowId - 1).remove();
				 	$('#tableWhiteListed').show();
			        $("#addedEmailList").html('');
			        whiteListEmailArray = [];
			        var fetchData = data.response.emailIDList;
		        	for(var i=0; i<fetchData.length; i++){
		        		whiteListEmailArray.push(fetchData[i]);
			        	$("#addedEmailList").append('<tr id="emailRow'+i+'"><td>'+fetchData[i]+'</td><td><a class="deleteEmail" title="Delete Email ID" onclick="removeEmailUpdate('+(i+1)+');" href="javascript:void(0)"><span class="glyphicon glyphicon-remove-sign"></span></a></td></tr>');
			        }
			 },
			 error: function() { 
				 alert('Updation not happen');
			 }
		}); 
	}else{
		console.log("calling delete service for single data");		
		 $.ajax({
			 beforeSend: function(xhrObj){
	             xhrObj.setRequestHeader("Authorization","Basic UW5yY2g4TVdreW1zODVuaw==");
			 },
			 contentType: 'application/json',
			 url: deleteEmailWhitelist + "?Id="+currWLID,
			 header: { 'Authorization':'Basic UW5yY2g4TVdreW1zODVuaw=='},
			 dataType: "json",
			 type: "DELETE",
			 success: function(data) {
				console.log("delete"+data);
		    	$('#tableWhiteListed').hide();
			    $("#addedEmailList").html('');
			    whiteListEmailArray = [];
			 },
			 error: function() { 
				 alert('Deletion not happen');
			 }
		}); 						
	}
}
//Controller for Create and Manage Archive
app.controller("createArchiveController",function($scope,$sce,$http,$interval){
	console.log("====Entered createArchiveController()====");
	var socket = io(location.protocol + "//" + location.host);
	var timeoutId;
	$scope.tabblinking = false;
	$scope.ticketokstatus = true;
	$scope.alertokstatus = true;
	$scope.trxokstatus = true;
	var ticketurl = systemProperties.base_uri+"/rest/AuditLogArchival/Archive/TicketAuditLog";
	$scope.clickedButton = "nothing";
	$scope.isShow = false;
	$scope.isBarShow = false;
	$scope.showModalClose = false;
	$scope.progressbarvalue = "0%";
	var archivelisturl = systemProperties.base_uri+"/rest/AuditLogArchival/ExistingArchives";
	$scope.listofarchives = null;
	function getlistofarchives(){
		$http.get(archivelisturl)
			.then(function(result) {
				console.log("node REST api called successfully : "+archivelisturl);
				$scope.listofarchives = result.data;
				if(result.data){					
					$scope.selectedName = {};
					$scope.selectedName.file = $scope.listofarchives.Results[0];					
					if(!$scope.selectedName.file){
						$scope.currentState = 'Not ready';
					}else{
						$scope.currentState = 'ok';
					}
				}				
			});	
	};
	getlistofarchives();
	function invokeservice(url){
		$http.post(url)
		.success(function(response) { 
			console.log("node REST api called successfully : "+url);
		})
		.error(function() { 
			alert("fail");
			console.log("failed to call node REST api : "+url);
		});
    }
	$scope.crtarchservice = function(){
	  $scope.clickedButton = "ticket";
	  invokeservice(ticketurl);
    };
    
    socket.on("Archive_Status", function(data){
		console.log("Listening socket emission of Archive_Status");
		$scope.modaltitle = "Archive in progress. Please wait";
		$scope.delmodaltitle = "Delete in progress. Please wait";
		$scope.isBarShow = true;
		$scope.statusofarchive = data;
		$scope.showModalClose = false;
		$scope.barcolor = "#0B4567";
		if (data == "Complete"){			
			getlistofarchives();
			$scope.progressbarvalue = "100%";
			$scope.showModalClose = true;
			$scope.modaltitle = "Complete";
			if ($scope.clickedButton == "ticket"){
				$scope.ticketokstatus = true;
				$scope.isShow = false;
				if ($scope.alertokstatus == true){
					if ($scope.trxokstatus == true){
						$scope.tabcolor = "#FFFFFF";    
						$scope.tabblinking = false;
						$interval.cancel(timeoutId);
					}
				}
				$scope.imgmessage = $sce.trustAsHtml("<span><img src=\"./images/archiving.png\" height=\"30\" width=\"30\" ></img></span>");
			} else if ($scope.clickedButton == "alert"){
				$scope.alertokstatus = true;
				$scope.isShowAlertAudit = false;
				if ($scope.ticketokstatus == true){
					if ($scope.trxokstatus == true){
						$scope.tabblinking = false;
						$interval.cancel(timeoutId);
						$scope.tabcolor = "#FFFFFF";
					}
				}
				$scope.imgalertmessage = $sce.trustAsHtml("<span><img src=\"./images/archiving.png\" height=\"30\" width=\"30\" ></img></span>");
			}else if ($scope.clickedButton == "transaction"){
				$scope.trxokstatus = true;
				$scope.isShowTrxAudit = false;
				if ($scope.ticketokstatus == true){
					if ($scope.alertokstatus == true){
						$scope.tabblinking = false;
						$interval.cancel(timeoutId);						
						$scope.tabcolor = "#FFFFFF";
					}
				}				
				$scope.imgtrxmessage = $sce.trustAsHtml("<span><img src=\"./images/archiving.png\" height=\"30\" width=\"30\" ></img></span>");
			}
		} else if (data = "Selecting records to archive..."){
			$scope.progressbarvalue = "30%";			
		}else if (data = "Creating Archive File..."){
			$scope.progressbarvalue = "70%";			
		}else if (data.includes("Error")) {
			$scope.barcolor = "#F4350E";
			$scope.progressbarvalue = "100%";
			$scope.modaltitle = "Error";
		}
	});
    //code for alert audit
	$scope.tabcolor = "#FFFFFF";
	socket.on("Ticket_Audit_Archive_Needed",function(data){
		console.log("Listening socket emission of Ticket_Audit_Archive_Needed");		
		if($scope.tabblinking == false){
			tabblink();
			$scope.tabblinking = true;
		}
		$scope.ticketokstatus = false;
		$scope.tabcolor = "#F4350E";
		$scope.isShow = true;
		console.log("Ticket_Audit_Archive_Needed available");
		alertsforticketarchival = true;
		$scope.imgmessage = $sce.trustAsHtml("<span><img title=\"Size reaches threshold limit. Please archive\" style = \"background-color:red\" src=\"./images/archiving.png\" height=\"30\" width=\"30\" ></img></span>");
	});
	if (alertsforticketarchival == false){
		$scope.imgmessage = $sce.trustAsHtml("<span><img src=\"./images/archiving.png\" height=\"30\" width=\"30\" ></img></span>");
	}
	
	var alarmurl = systemProperties.base_uri+"/rest/AuditLogArchival/Archive/AlertAuditLog";

	$scope.crtalertarchservice = function(){
		$scope.clickedButton = "alert";
		invokeservice(alarmurl);
    };
	$scope.isShowAlertAudit = false;
	socket.on("Alert_Audit_Archive_Needed",function(data){
		console.log("Listening socket emission of Alert_Audit_Archive_Needed");
		$scope.tabcolor = "#F4350E";
		if($scope.tabblinking == false){
			tabblink();
			$scope.tabblinking = true;
		}
		$scope.alertokstatus = false;
		console.log("Alert_Audit_Archive_Needed available");
		$scope.isShowAlertAudit = true;
		alertsforalertarchival = true;
		$scope.imgalertmessage = $sce.trustAsHtml("<span><img title=\"Size reaches threshold limit. Please archive\" style = \"background-color:red\" src=\"./images/archiving.png\" height=\"30\" width=\"30\" ></img></span>");
	});
	if (alertsforalertarchival == false){
		$scope.imgalertmessage = $sce.trustAsHtml("<span><img src=\"./images/archiving.png\" height=\"30\" width=\"30\" ></img></span>");
	}
	
	//code for Transaction Audit
	var trxurl = systemProperties.base_uri+"/rest/AuditLogArchival/Archive/TransactionAuditLog";	
	$scope.crttrxarchservice = function(){
	  $scope.clickedButton = "transaction";
	  invokeservice(trxurl);
    };
	$scope.isShowTrxAudit = false;
	socket.on("Transaction_Audit_Archive_Needed",function(data){
		console.log("Listening socket emission of Alert_Audit_Archive_Needed");
		$scope.tabcolor = "#F4350E";	
		if($scope.tabblinking == false){
			tabblink();
			$scope.tabblinking = true;
		}
		$scope.trxokstatus = false;
		console.log("Transaction_Audit_Archive_Needed available");
		$scope.isShowTrxAudit = true;
		alertsfortrxarchival = true;
		$scope.imgtrxmessage = $sce.trustAsHtml("<span><img title=\"Size reaches threshold limit. Please archive\" style = \"background-color:red\" src=\"./images/archiving.png\" height=\"30\" width=\"30\" ></img></span>");
	});
	if (alertsfortrxarchival == false){
		$scope.imgtrxmessage = $sce.trustAsHtml("<span><img src=\"./images/archiving.png\" height=\"30\" width=\"30\" ></img></span>");
	}
	
	function tabblink(){
		timeoutId = $interval(function() {
			if ($scope.tabcolor == "#F4350E"){
				$scope.tabcolor = "#FFFFFF";
				return;
			}
			if ($scope.tabcolor == "#FFFFFF"){
				$scope.tabcolor = "#F4350E";
				return;
			}
			
		}, 500);
	}
	
	//code for delete archive
	$scope.deleteacrhive = function(filename){
		var deleteurl = systemProperties.base_uri+"/rest/AuditLogArchival/Archive/"+filename;
		invokedeleteservice(deleteurl);
	}
	$scope.showdelModalClose = false;
	$scope.delprogressbarvalue = "20%";
	$scope.delmodaltitle = "Delete in progress. Please wait"
	$scope.delbarcolor =  "#0B4567";
	$scope.statusofdelarchive = "Delete started";
	socket.on("Delete_Archive",function(data){
		console.log("Listening socket emission of Alert_Audit_Archive_Needed");
		if (data.result == "success"){
			getlistofarchives();
			$scope.statusofdelarchive = data.result;
			$scope.showdelModalClose = true;
			$scope.delprogressbarvalue = "100%";
			$scope.delmodaltitle ="Complete";
		}else if (data.result == "success"){
			$scope.statusofdelarchive = data.result;
			$scope.showdelModalClose = true;
			$scope.delprogressbarvalue = "100%";
			$scope.delmodaltitle ="Error";
			$scope.barcolor = "#F4350E";
		}
	});
	
	function invokedeleteservice(url){
		$http.delete(url)
            .success(function (status) {
                console.log("node REST api called successfully : "+url);
            })
            .error(function (status) {
				console.log("Failed to call node REST api called : "+url+" status : "+status);
            });
    }
	
	$scope.viewcsvurl = "";
	$scope.viewacrhive = function(filename){
		var qualifiedname = filename.replace(".json","");
		$scope.viewcsvurl = systemProperties.base_uri+"/rest/AuditLogArchival/generateCSV/"+qualifiedname;
		invokeviewservice($scope.viewcsvurl,qualifiedname);		
	}
		
	function invokeviewservice(url,qualifiedname){
		$http.post(url)
		.success(function(data) { 
			console.log("node REST api called successfully : "+url);
			var blob = new Blob([data], {type: "application/csv;charset=utf-8;"});
			var csvfilename = qualifiedname+".csv";
			saveAs(blob, csvfilename);
		})
		.error(function(data) { 
			alert("fail");
			console.log("failed to call node REST api : "+url+ " error : "+data);
		});
		
	}
	
	function saveAs(blob, fileName){
		var browserName  = getbrowsername();		
		var url = window.URL.createObjectURL(blob);
	
		var doc = document.createElement("a");
		doc.href = url;
		doc.download = fileName;
		if (browserName == "Firefox"){
			document.body.appendChild(doc);
			doc.click();
			setTimeout(function(){
				document.body.removeChild(doc);
				window.URL.revokeObjectURL(url);  
			}, 100); 
		}else{
			doc.click();
			navigator.msSaveBlob(blob, fileName);
			window.URL.revokeObjectURL(url);
		}
	}
	
	
	function getbrowsername(){
		
		var nVer = navigator.appVersion;
		var nAgt = navigator.userAgent;
		var browserName  = navigator.appName;
		var nameOffset,verOffset,ix;
		if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
			browserName = "Microsoft Internet Explorer";
		}else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
			browserName = "Chrome";
		}else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
			browserName = "Firefox";
		}
		return browserName;
	}
	
});

