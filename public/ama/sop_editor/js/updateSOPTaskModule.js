		var cronResultVar='';
		var currTableIndex = '';
		initSampleUpdate();
			$(document).on('click', '.rteClose', function(event) {				
				//var currDesc = $('#richTextEditor > div > .form-control').html();
				//$('.clickedTskDE').html(currDesc);
				//$('#richTextEditorContainer').hide();
				//$('#richTextEditor').hide();
			});
			$(document).on('click', '.addNewDesc', function(event) {
				var tr = $(this).closest('tr');
				currTableIndex = $(tr).index();
				console.log("curr Table Add Task"+currTableIndex);
				CKEDITOR.instances.editorUpdate.setData('', function()
					    {
					        this.checkDirty();
					    });				
				$("#taskEditorUpdate").dialog('open');
			});
			
			$(document).on('click', '.editDesc', function(event) {
				if($(this).hasClass('disableamend') == true){
					return false;
				}else{
					var tr = $(this).closest('tr');
					currTableIndex = $(tr).index();
					var currDesc = $(tr).find('td').eq(2).html();	
					console.log(currDesc);
					CKEDITOR.instances.editorUpdate.setData( currDesc, function()
						    {
						        this.checkDirty();
						    });				
					$("#taskEditorUpdate").dialog('open');
				}					
			});
			var currRowOrd = '';
			$(document).on('click', '.editTask', function(event) {
				
				if($(this).hasClass('clicked') == false){
					if($('.editTask').hasClass('disableamend') == true){
						return false;
					}else{
						
						var tr = $(this).closest('tr');
						currTableIndex = $(tr).index();
						//currRowOrd = $(tr).find('td').eq(0).html();
						//$(tr).find('td').eq(0).html('<select id="odrSl'+currTableIndex+'"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option value="17"><option>17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option></select>');
						//$("#odrSl"+currTableIndex+" option[value='"+currRowOrd+"']").attr("selected","selected");
						//var currName = $(tr).find('td').eq(1).html();
						//$(tr).find('td').eq(1).html('<input type="text" style="width:100px;" value="'+currName+'" />');
						$(tr).find('td').eq(3).find('.editDesc').removeClass('disableamend').removeAttr("disabled");
						var currOwner = $(tr).find('td').eq(4).html();
						console.log('currOwner '+currOwner);
						$(tr).find('td').eq(4).html('<input type="text" class="form-control" style="width:100px;" value="'+currOwner+'" />');
						$(tr).find('td').eq(5).html('<select class="form-control" style="width:160px;"><option value="0" label="Manual">Manual</option><option value="1" label="Event Based">Event Based</option><option value="2" label="Automation">Automation</option><option value="3" label="SentNotification">SentNotification</option><option value="4" label="SOP Meta based execution">SOP Meta based execution</option><option value="5" label="Logger Alert">Logger Alert</option><option value="6" label="Mail notification">Mail notification</option></select>');
						//var currDuration = $(tr).find('td').eq(5).html();
						//$(tr).find('td').eq(5).html('<input type="text" style="width:36px;" value="'+currDuration+'" />&nbsp; min');
						$(tr).find('td').eq(6).find('.saveTask').show();
						$(tr).find('td').eq(6).find('.editTask').hide();
						//var currFile = $(tr).find('td').eq(7).html();
						$(tr).find('td').eq(7).html('<input type="file" size="40" name="fileUpload" id="taskFileUpload'+currTableIndex+'">');
						$(this).addClass('clicked');
					}
				}
			});
					
			$(document).on('click', '.saveTask', function(event) {				
				if($(this).hasClass('clicked') == false){
					var tr = $(this).closest('tr');
					currTableIndex = $(tr).index();
					var currentOrder = $(tr).find('td').eq(0).html();
					//var currentOrder = $(tr).find('td').eq(0).find('select option:selected').text();					
					var checkExeOrder = taskExeArray.indexOf(currentOrder);
					console.log('taskExeArray '+taskExeArray);
					console.log('currentOrder '+currentOrder+' : currRowOrd '+currRowOrd);
					if(currentOrder != currRowOrd){
						//if(checkExeOrder >=0){
							//dialogDupExe.dialog( "open" );
							//alert('You could not save two different tasks with the same execution order');
							//return false;
						//}else{
							$(tr).find('td').eq(0).html(currentOrder);
							taskExeArray.push(currentOrder);
						//}
					}else{
						$(tr).find('td').eq(0).html(currentOrder);
					}
					//$(tr).find('td').eq(0).html(currentOrder);
					var currName = $(tr).find('td').eq(1).find('input').val();
					$(tr).find('td').eq(1).html(currName);
					$(tr).find('td').eq(2).removeClass('clickedTskDE');
					$(tr).find('td').eq(3).find('.editDesc').addClass('disableamend').attr("disabled","disabled");
					var currOwner = $(tr).find('td').eq(4).find('input').val();
					$(tr).find('td').eq(4).html(currOwner);
					var currentExecTyp = $(tr).find('td').eq(5).find('select option:selected').text();
					$(tr).find('td').eq(5).html(currentExecTyp);
					$(tr).find('td').eq(6).find('.saveTask').hide();
					$(tr).find('td').eq(6).find('.editTask').show();
					var currentFileDom = 'taskFileUpload'+currTableIndex;
					//$(this).addClass('clicked');
					$('.editTask').removeClass('clicked');
				}
			});
			
			$(document).on('click', '.deleteTask', function(event) {
				
				if($(this).hasClass('clicked') == false){
					if($('.deleteTask').hasClass('disableamend') == true){
						return false;
					}else{
						var confirmTaskDelete = confirm("This task will be permanently deleted and cannot be recovered. Are you sure?");
					    if (confirmTaskDelete == true) {
					    	var tr = $(this).closest('tr');
							$(tr).remove();
							$(this).addClass('clicked');
					    }
					}
				}
			});
			
			$(document).on('click', '#addTaskOnAmendTable', function() {
				var filesUp = new Array();
				//if($(this).hasClass('clicked') == false){
					if($('#addTaskOnAmendTable').hasClass('disableamend') == true){
						return false;
					}else{
						var MyRows = $('table#taskUpdateTable').find('tbody').find('tr');
						var MyIndexValue;
						for (var i = 0; i < MyRows.length; i++) {
							MyIndexValue = $(MyRows[i]).find('td:eq(0)').html();
							console.log("preLastOrdVal: "+MyIndexValue);
						}
						var MyIndexValueTaskDesc = parseInt(MyIndexValue);
						var MyIndexValueNew = parseInt(MyIndexValue) + 1;
						$('#taskAmendRecord').append('<tr><td>'+MyIndexValueNew+'</td><td><input class="form-control" type="text" style="width:100px;" /></td><td id="taskDesc'+MyIndexValueTaskDesc+'">Task Description..</td><td><input type="button" class="addNewDesc" value="Add Description"/></td><td><input type="text" style="width:100px;" /></td><td><select class="form-control" style="width:160px;"><option value="0" label="Manual">Manual</option><option value="1" label="Event Based">Event Based</option><option value="2" label="Automation">Automation</option><option value="3" label="SentNotification">SentNotification</option><option value="4" label="SOP Meta based execution">SOP Meta based execution</option><option value="5" label="Logger Alert">Logger Alert</option><option value="6" label="Mail notification">Mail notification</option></select></td><td style="text-align:center;" align="center"><a href="javascript:void(0)" class="editTask" title="Edit Task" style="display:none;"><span class="glyphicon glyphicon-edit" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="saveTask" ng-click="saveTask();" title="Save Task"><span class="glyphicon glyphicon-floppy-disk" style="font-size:20px;"></span></a>&nbsp;&nbsp;<a href="javascript:void(0)" class="deleteTask" title="Delete Task"><span class="glyphicon glyphicon-remove-sign" style="font-size:20px;"></span></a></td></tr>');
						$(this).addClass('clicked');
					}
				//}
			});
			
			
			$(document).on('click', '.editOutputParam', function(event) {				
				if($(this).hasClass('clicked') == false){
					if($('.editOutputParam').hasClass('disableClass') == true){
						return false;
					}else{					
						var tr = $(this).closest('tr');
						currTableIndex = $(tr).index();
						var currName = $(tr).find('td').eq(0).html();
						var currType = $(tr).find('td').eq(1).html();
						var currDesc = $(tr).find('td').eq(2).html();
						$(tr).find('td').eq(0).html('<input type="text" class="form-control" style="width:100px;" value="'+currName+'" />');
						$(tr).find('td').eq(1).html('<input type="text" class="form-control" style="width:100px;" value="'+currType+'" />');
						$(tr).find('td').eq(2).html('<input type="text" class="form-control" style="width:100px;" value="'+currDesc+'" />');
						$(tr).find('td').eq(3).find('.saveOutputParam').show();
						$(tr).find('td').eq(3).find('.editOutputParam').hide();
						$(this).addClass('clicked');
					}
				}
			});
			
			$(document).on('click', '.saveOutputParam', function(event) {				
				if($(this).hasClass('clicked') == false){
					var tr = $(this).closest('tr');
					currTableIndex = $(tr).index();
					var currName = $(tr).find('td').eq(0).find('input').val();
					var currType = $(tr).find('td').eq(1).find('input').val();
					var currDesc = $(tr).find('td').eq(2).find('input').val();
					$(tr).find('td').eq(0).html(currName);
					$(tr).find('td').eq(1).html(currType);
					$(tr).find('td').eq(2).html(currDesc);
					$('.editOutputParam').removeClass('clicked');
					$('.saveOutputParam').hide();
					$('.editOutputParam').show();
				}
			});
			
	    $(document).ready(function() {
	    	taskEditorUpdate = $("#taskEditorUpdate").dialog({
		   		 closeOnEscape: false,
		   		 autoOpen: false,
		   		 modal: true,
		   		 width:880,
		   		 buttons: {
		   		 Ok: function() {
		   				updateTaskDescription();	   			 	
		   			 }
		   		 }
	   		});
			dialogDupExe = $("#duplicateExecution").dialog({
				 closeOnEscape: false,
				 autoOpen: false,
				 modal: true,
				 buttons: {
				 Ok: function() {
					 	$( this ).dialog( "close" );
					 }
				 }
			});
			
		});
	    
	 /*   function demoTest() {
	    	var doc = new jsPDF();
	    	doc.setFontSize(22);
	    	doc.text(20, 20, 'This is a title');
	    	
	    	doc.setFontSize(16);
	    	doc.text(20, 30, 'This is some normal sized text underneath.');
	    	
	    	doc.save('Test.pdf');
	    }
	    
	    */
	    $(document).ready(function(){
	        $('#exportSOP').click(function(){
	        	//checkPermission("ViewReport","sopeditor");
	        	flagCheckPM = true;
	        	if(flagCheckPM){
		            var data = sopReportData;
		            if(data == '')
		                return;
		            JSONToCSVConvertor(data, 'SOP Report');
	        	}else{
	        		alert("You are not authorize to generate Report");
	        	}
	        });
	        $('#exportPDF').click(function(){
	        	//checkPermission("ViewReport","sopeditor");
	        	$("#richTextEditorContainer").show();
				$("#WaitAlertMsg").show();
	        	$('.element-to-render').show();
	    		var element = document.querySelectorAll(".element-to-render")[0];
	    		options = {
	    		    onrendered: function(canvas) {
	    		        //$('body').append(canvas);
	    		        var imgstring = canvas.toDataURL();
	    		        $('.result').attr('src', imgstring);
	    		    }};
	    		html2canvas(element, options);
	    		setTimeout(function(){
		        	flagCheckPM = true;
		        	if(flagCheckPM){
			            var data = sopReportData;
			           /* if(data == '')
			                return;*/
			            JSONToPDFConvertor(PDFSOPReportName, 'SOP Report' ,true);
		        	}else{
		        		alert("You are not authorize to generate Report");
		        	}
		        	$('.element-to-render').hide();
		        	$("#richTextEditorContainer").hide();
					$("#WaitAlertMsg").hide();
	    		}, 1500);
	        });	
	    });
		$(document).on('change', 'input:radio[name=executeAutomationu]', function(event) {
	         if ($("input[name='executeAutomationu']:checked").val() == 'realTime') {
	        	 $('#scheduleAutoContainerUp').hide();
	         }
	         if ($("input[name='executeAutomationu']:checked").val() == 'scheduled') {
	             $('#createTimeZoneu').html('');
	             $('#scheduleAutoContainerUp').show();
	             for(var i = 0; i<timezone.length; i++){
	            	 $('#createTimeZoneu').append('<option value="'+timezone[i]+'">'+timezone[i]+'</option>');
	             }
	         }
		});

/* Modified by Sandeep Gupta Started - for fixing deselection of option dopdown items on deselection of the random values other than Every second , minute , hour etc. radio button	*/	
		$(document).on('change', 'input:radio[name=seccronu]', function(event) {
			 if ($("input[name='seccronu']:checked").val() == 'evsecu'){
				 $("#secmultipleu option:selected").prop("selected", false);
				 $("#secmultipleu").attr("disabled","disabled");
			 }else{
				 $("#secmultipleu").removeAttr("disabled");		 
			 }
		 });
		 $(document).on('change', 'input:radio[name=mincronu]', function(event) {
			 if ($("input[name='mincronu']:checked").val() == 'evminu'){
				 $("#minmultipleu option:selected").prop("selected", false);
				 $("#minmultipleu").attr("disabled","disabled");
			 }else{
				 $("#minmultipleu").removeAttr("disabled");		 
			 }
		 });
		 $(document).on('change', 'input:radio[name=hourcronu]', function(event) {
			 if ($("input[name='hourcronu']:checked").val() == 'evhrsu'){
				 $("#hrsmultipleu option:selected").prop("selected", false);
				 $("#hrsmultipleu").attr("disabled","disabled");
			 }else{
				 $("#hrsmultipleu").removeAttr("disabled");		 
			 }
		 });
		 $(document).on('change', 'input:radio[name=daycronu]', function(event) {
			 if ($("input[name='daycronu']:checked").val() == 'evdayu'){
				 $("#daymultipleu option:selected").prop("selected", false);
				 $("#daymultipleu").attr("disabled","disabled");
			 }else{
				 $("#daymultipleu").removeAttr("disabled");		 
			 }
		 });
		 $(document).on('change', 'input:radio[name=monthcronu]', function(event) {
			 if ($("input[name='monthcronu']:checked").val() == 'evmonu'){
				 $("#monthmultipleu option:selected").prop("selected", false);
				 $("#monthmultipleu").attr("disabled","disabled");
			 }else{
				 $("#monthmultipleu").removeAttr("disabled");		 
			 }
		 });
		 $(document).on('change', 'input:radio[name=weekcronu]', function(event) {
			 if ($("input[name='weekcronu']:checked").val() == 'evwkdu'){
				 $("#weekmultipleu option:selected").prop("selected", false);
				 $("#weekmultipleu").attr("disabled","disabled");
			 }else{
				 $("#weekmultipleu").removeAttr("disabled");		 
			 }
		 });

/* Modified by Sandeep Gupta Ended - for fixing deselection of option dopdown items on deselection of the random values other than Every second , minute , hour etc. radio button	*/		 

		function updateCron(){ 
			var cronSecVar;
			var cronSecText;
			var cronMinVar;
			var cronHrsVar;
			var cronDayVar;
			var cronMonVar;
			if ($("input[name='seccronu']:checked").val() == 'evsecu') {
				var everySecSelect = $("#everySecSelectUp option:selected").text();
				if(everySecSelect == '1'){
					cronSecVar = '*';
					cronSecText = ' Every Second,';
				}else if(everySecSelect == '2'){
					cronSecVar = '2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58';
					cronSecText = ' Every Two Second,';
				}else if(everySecSelect == '3'){
					cronSecVar = '3,6,9,12,15,18,21,24,27,30,33,36,39,42,45,48,51,54,57';
					cronSecText = ' Every Three Second,';
				}else if(everySecSelect == '4'){
					cronSecVar = '4,8,12,16,20,24,28,32,36,40,44,48,52,56';
					cronSecText = ' Every Four Second,';
				}else if(everySecSelect == '5'){
					cronSecVar = '5,10,15,20,25,30,35,40,45,50,55';
					cronSecText = ' Every Five Second,';
				}else if(everySecSelect == '6'){
					cronSecVar = '6,12,18,24,30,36,42,48,54';
					cronSecText = ' Every Six Second,';
				}else if(everySecSelect == '7'){
					cronSecVar = '7,14,21,28,35,42,49,56';
					cronSecText = ' Every Seven Second,';
				}else if(everySecSelect == '8'){
					cronSecVar = '8,16,24,32,40,48,56';
					cronSecText = ' Every Eight Second,';
				}else if(everySecSelect == '9'){
					cronSecVar = '9,18,27,36,45,54';
					cronSecText = ' Every Nine Second,';
				}else if(everySecSelect == '10'){
					cronSecVar = '10,20,30,40,50';
					cronSecText = ' Every Ten Second,';
				}else if(everySecSelect == '11'){
					cronSecVar = '11,22,33,44,55';
					cronSecText = ' Every Eleven Second,';
				}else if(everySecSelect == '12'){
					cronSecVar = '12,24,36,48';
					cronSecText = ' Every Twelve Second,';
				}else if(everySecSelect == '13'){
					cronSecVar = '13,26,39,52';
					cronSecText = ' Every Thirteen Second,';
				}else if(everySecSelect == '14'){
					cronSecVar = '14,28,42,56';
					cronSecText = ' Every Fourteen Second,';
				}else if(everySecSelect == '15'){
					cronSecVar = '15,30,45';
					cronSecText = ' Every Fifteen Second,';
				}else if(everySecSelect == '16'){
					cronSecVar = '16,32,48';
					cronSecText = ' Every Sixteen Second,';
				}else if(everySecSelect == '17'){
					cronSecVar = '17,34,51';
					cronSecText = ' Every Seventeen Second,';
				}else if(everySecSelect == '18'){
					cronSecVar = '18,36,54';
					cronSecText = ' Every Eighteen Second,';
				}else if(everySecSelect == '19'){
					cronSecVar = '19,38,57';
					cronSecText = ' Every Nineteen Second,';
				}else if(everySecSelect == '20'){
					cronSecVar = '20,40';
					cronSecText = ' Every Twenty Second,';
				}else if(everySecSelect == '21'){
					cronSecVar = '21,42';
					cronSecText = ' Every Twentyone Second,';
				}else if(everySecSelect == '22'){
					cronSecVar = '22,44';
					cronSecText = ' Every Twentytwo Second,';
				}else if(everySecSelect == '23'){
					cronSecVar = '23,46';
					cronSecText = ' Every Twentythree Second,';
				}else if(everySecSelect == '24'){
					cronSecVar = '24,48';
					cronSecText = ' Every Twentyfour Second,';
				}else if(everySecSelect == '25'){
					cronSecVar = '25,50';
					cronSecText = ' Every TwentyFive Second,';
				}else if(everySecSelect == '26'){
					cronSecVar = '26,52';
					cronSecText = ' Every TwentySix Second,';
				}else if(everySecSelect == '27'){
					cronSecVar = '27,54';
					cronSecText = ' Every Twentyseven Second,';
				}else if(everySecSelect == '28'){
					cronSecVar = '28,56';
					cronSecText = ' Every TwentyEight Second,';
				}else if(everySecSelect == '29'){
					cronSecVar = '29,58';
					cronSecText = ' Every TwentyNine Second,';
				}else if(parseInt(everySecSelect) >= 30){
					cronSecVar = everySecSelect;
					cronSecText = ' Every '+everySecSelect+' Second,';
				}
			}else{
				var secmulArray = []; 
				$('#secmultipleu :selected').each(function(i, selected){ 
					secmulArray[i] = $(selected).text(); 
				});
				cronSecVar = getRanges(secmulArray);
			}
			if ($("input[name='mincronu']:checked").val() == 'evminu') {
				var everyMinSelect = $("#everyMinSelectUp option:selected").text();
				if(everyMinSelect == '1'){
					cronMinVar = '*';
					cronMinText = ' Every Minute,';
				}else if(everyMinSelect == '2'){
					cronMinVar = '2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58';
					cronMinText = ' Every Two Minute,';
				}else if(everyMinSelect == '3'){
					cronMinVar = '3,6,9,12,15,18,21,24,27,30,33,36,39,42,45,48,51,54,57';
					cronMinText = ' Every Three Minute,';
				}else if(everyMinSelect == '4'){
					cronMinVar = '4,8,12,16,20,24,28,32,36,40,44,48,52,56';
					cronMinText = ' Every Four Minute,';
				}else if(everyMinSelect == '5'){
					cronMinVar = '5,10,15,20,25,30,35,40,45,50,55';
					cronMinText = ' Every Five Minute,';
				}else if(everyMinSelect == '6'){
					cronMinVar = '6,12,18,24,30,36,42,48,54';
					cronMinText = ' Every Six Minute,';
				}else if(everyMinSelect == '7'){
					cronMinVar = '7,14,21,28,35,42,49,56';
					cronMinText = ' Every Seven Minute,';
				}else if(everyMinSelect == '8'){
					cronMinVar = '8,16,24,32,40,48,56';
					cronMinText = ' Every Eight Minute,';
				}else if(everyMinSelect == '9'){
					cronMinVar = '9,18,27,36,45,54';
					cronMinText = ' Every Nine Minute,';
				}else if(everyMinSelect == '10'){
					cronMinVar = '10,20,30,40,50';
					cronMinText = ' Every Ten Minute,';
				}else if(everyMinSelect == '11'){
					cronMinVar = '11,22,33,44,55';
					cronMinText = ' Every Eleven Minute,';
				}else if(everyMinSelect == '12'){
					cronMinVar = '12,24,36,48';
					cronMinText = ' Every Twelve Minute,';
				}else if(everyMinSelect == '13'){
					cronMinVar = '13,26,39,52';
					cronMinText = ' Every Thirteen Minute,';
				}else if(everyMinSelect == '14'){
					cronMinVar = '14,28,42,56';
					cronMinText = ' Every Fourteen Minute,';
				}else if(everyMinSelect == '15'){
					cronMinVar = '15,30,45';
					cronMinText = ' Every Fifteen Minute,';
				}else if(everyMinSelect == '16'){
					cronMinVar = '16,32,48';
					cronMinText = ' Every Sixteen Minute,';
				}else if(everyMinSelect == '17'){
					cronMinVar = '17,34,51';
					cronMinText = ' Every Seventeen Minute,';
				}else if(everyMinSelect == '18'){
					cronMinVar = '18,36,54';
					cronMinText = ' Every Eighteen Minute,';
				}else if(everyMinSelect == '19'){
					cronMinVar = '19,38,57';
					cronMinText = ' Every Nineteen Minute,';
				}else if(everyMinSelect == '20'){
					cronMinVar = '20,40';
					cronMinText = ' Every Twenty Minute,';
				}else if(everyMinSelect == '21'){
					cronMinVar = '21,42';
					cronMinText = ' Every Twentyone Minute,';
				}else if(everyMinSelect == '22'){
					cronMinVar = '22,44';
					cronMinText = ' Every Twentytwo Minute,';
				}else if(everyMinSelect == '23'){
					cronMinVar = '23,46';
					cronMinText = ' Every Twentythree Minute,';
				}else if(everyMinSelect == '24'){
					cronMinVar = '24,48';
					cronMinText = ' Every Twentyfour Minute,';
				}else if(everyMinSelect == '25'){
					cronMinVar = '25,50';
					cronMinText = ' Every Twentyfive Minute,';
				}else if(everyMinSelect == '26'){
					cronMinVar = '26,52';
					cronMinText = ' Every Twentysix Minute,';
				}else if(everyMinSelect == '27'){
					cronMinVar = '27,54';
					cronMinText = ' Every Twentyseven Minute,';
				}else if(everyMinSelect == '28'){
					cronMinVar = '28,56';
					cronMinText = ' Every TwentyEight Minute,';
				}else if(everyMinSelect == '29'){
					cronMinVar = '29,58';
					cronMinText = ' Every TwentyNine Minute,';
				}else if(parseInt(everyMinSelect) >= 30){
					cronMinVar = everyMinSelect;
					cronMinText = ' Every '+everyMinSelect+' Second,';
				}
			}else{
				var minmulArray = []; 
				$('#minmultipleu :selected').each(function(i, selected){ 
					minmulArray[i] = $(selected).text(); 
				});
				cronMinVar = getRanges(minmulArray);
			}
			if ($("input[name='hourcronu']:checked").val() == 'evhrsu') {
				var everyHourSelect = $("#everyHourSelectUp option:selected").val();
				if(everyHourSelect == '1'){
					cronHrsVar = '*';
					cronHrsText = ' Every Hours,';
				}else if(everyHourSelect == '2'){
					cronHrsVar = '2,4,6,8,10,12,14,16,18,20,22';
					cronHrsText = ' Every Two Hours,';
				}else if(everyHourSelect == '3'){
					cronHrsVar = '3,6,9,12,15,18,21';
					cronHrsText = ' Every Three Hours,';
				}else if(everyHourSelect == '4'){
					cronHrsVar = '4,8,12,16,20';
					cronHrsText = ' Every Four Hours,';
				}else if(everyHourSelect == '5'){
					cronHrsVar = '5,10,15,20';
					cronHrsText = ' Every Five Hours,';
				}else if(everyHourSelect == '6'){
					cronHrsVar = '6,12,18';
					cronHrsText = ' Every Six Hours,';
				}else if(everyHourSelect == '7'){
					cronHrsVar = '7,14,21';
					cronHrsText = ' Every Seven Hours,';
				}else if(everyHourSelect == '8'){
					cronHrsVar = '8,16';
					cronHrsText = ' Every Eight Hours,';
				}else if(everyHourSelect == '9'){
					cronHrsVar = '9,18';
					cronHrsText = ' Every Nine Hours,';
				}else if(everyHourSelect == '10'){
					cronHrsVar = '10,20';
					cronHrsText = ' Every Ten Hours,';
				}else if(everyHourSelect == '11'){
					cronHrsVar = '11,22';
					cronHrsText = ' Every Eleven Hours,';
				}else if(parseInt(everyHourSelect) >= 12){
					cronHrsVar = everyHourSelect;
					cronHrsText = ' Every '+everyHourSelect+' Hour,';
				}
			}else{
				var hrsmulArray = []; 
				$('#hrsmultipleu :selected').each(function(i, selected){ 
					hrsmulArray[i] = $(selected).val(); 
				});
				cronHrsVar = getRanges(hrsmulArray);
			}
			if ($("input[name='daycronu']:checked").val() == 'evdayu') {
				cronDayVar = '*';
			}else{
				var daymulArray = []; 
				$('#daymultipleu :selected').each(function(i, selected){ 
					daymulArray[i] = $(selected).text(); 
				});
				cronDayVar = getRanges(daymulArray);
			}
			if ($("input[name='monthcronu']:checked").val() == 'evmonu') {
				cronMonVar = '*';
			}else{
				var monmulArray = []; 
				$('#monthmultipleu :selected').each(function(i, selected){ 
					monmulArray[i] = $(selected).val(); 
				});
				cronMonVar = getRanges(monmulArray);
			}
			if ($("input[name='weekcronu']:checked").val() == 'evwkdu') {
				cronWkdVar = '*';
			}else{
				var weekmulArray = []; 
				$('#weekmultipleu :selected').each(function(i, selected){ 
					weekmulArray[i] = $(selected).val(); 
				});
				cronWkdVar = getRanges(weekmulArray);
			}
			cronResultVar = cronSecVar+' '+cronMinVar+' '+cronHrsVar+' '+cronDayVar+' '+cronMonVar+' '+cronWkdVar;
			$('#cronGenResultu').val(cronResultVar);
	}
	function updateTaskDescription(){
		var editorText = CKEDITOR.instances.editorUpdate.getData();
		console.log("editorText: "+editorText);
		$('#taskDesc'+currTableIndex).html(editorText);
		$("#taskEditorUpdate").dialog('close');
	}	
	function fetchCronDataUp(){
		if($('#cronGenResultu').val() !=''){	
			$('#triggerOnValu').val(cronResultVar);
			dialogCronExpModelUp.dialog('close');
		}else{
			alert('Please Create Cron Expression');
		}	
	}
	function getRanges(array) {
		  var ranges = [], rstart, rend;
		  for (var i = 0; i < array.length; i++) {
		    rstart = array[i];
		    rend = rstart;
		    while (array[i + 1] - array[i] == 1) {
		      rend = array[i + 1]; // increment the index if the numbers sequential
		      i++;
		    }
		    ranges.push(rstart == rend ? rstart+'' : rstart + '-' + rend);
		  }
		  return ranges;
		}