var xmlData = '';
xmlData = sopBpmnData.value;
if(xmlData == '')
{
	xmlData = '<?xml version="1.0" encoding="UTF-8"?> <bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd"> <bpmn2:process id="Process_1" isExecutable="false"> <bpmn2:startEvent id="StartEvent_1" /> </bpmn2:process> <bpmndi:BPMNDiagram id="BPMNDiagram_1"> <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1"> <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1"> <dc:Bounds x="313" y="197" width="36" height="36" /> <bpmndi:BPMNLabel> <dc:Bounds x="286" y="233" width="90" height="20" /> </bpmndi:BPMNLabel> </bpmndi:BPMNShape> </bpmndi:BPMNPlane> </bpmndi:BPMNDiagram> </bpmn2:definitions>';
}
function sendencodedData(name)
{
	opener.setSearchResult(workflowName, document.getElementById("camunda-id").value);
	opener.setSearchResult(sopBpmnData, xmlData);
	//alert(document.getElementById("camunda-id").value);
	window.close();
	/*
	//console.log(name);
	//window.open(xmlData, name);
	//post('http://localhost:2000/postPath', {"data": xmlData});
	$.post("http://localhost:3000/postPath",
	{
		data: xmlData
	},
	function(data, status){
		alert("Data: " + data + "\nStatus: " + status);
	});
	*/
}