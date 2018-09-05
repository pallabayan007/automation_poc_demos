app.controller("OverviewController",function($scope,$http,$sce,$window){
	var jsonurl = systemProperties.base_uri+"/rest/Systemconfig/readJSONFile/overview_config";			
			$http.get(jsonurl)
				.then(function(result) {
					$scope.jsonCont =  result.data;					
					console.log("node REST api called successfully : "+$scope.jsonCont);
					formOverview();				
				});

		function formOverview(){
				console.log("formOverview() Forming html content started");
				$scope.firstQuadHtmlCont = [];
			
				$scope.firstQuadJsonhtml = $scope.jsonCont.Contents.FirstQuadrant.Contents;
				for (x in $scope.firstQuadJsonhtml){
					if ($scope.firstQuadJsonhtml[x].Type == "Header"){
						$scope.firstQuadHtmlContHead = $sce.trustAsHtml($scope.firstQuadJsonhtml[x].Value);
					} else {
						//alert("Inside else");
						var obj = {};
						obj["Type"]=$scope.firstQuadJsonhtml[x].Type;
						obj["Value"]=$sce.trustAsHtml($scope.firstQuadJsonhtml[x].Value);
						$scope.firstQuadHtmlCont.push(obj);
					}
				}
				
				$scope.secondQuadHtmlCont = [];
				$scope.secondQuadJsonhtml = $scope.jsonCont.Contents.SecondQuadrant.Contents;
				for (x in $scope.secondQuadJsonhtml){					
					if ($scope.secondQuadJsonhtml[x].Type == "Header"){
						$scope.secondQuadHtmlContHead = $sce.trustAsHtml($scope.secondQuadJsonhtml[x].Value);
					} else {
						var obj = {};
						obj["Type"]=$scope.secondQuadJsonhtml[x].Type;
						obj["Value"]=$sce.trustAsHtml($scope.secondQuadJsonhtml[x].Value);
						$scope.secondQuadHtmlCont.push(obj);
					}
				}
			
				$scope.thirdQuadHtmlCont = [];			
				$scope.thirdQuadJsonhtml = $scope.jsonCont.Contents.ThirdQuadrant.Contents;
				for (x in $scope.thirdQuadJsonhtml){					
					if ($scope.thirdQuadJsonhtml[x].Type == "Header"){
						$scope.thirdQuadHtmlContHead = $sce.trustAsHtml($scope.thirdQuadJsonhtml[x].Value);
					} else {
						var obj = {};
						obj["Type"]=$scope.thirdQuadJsonhtml[x].Type;
						obj["Value"]=$sce.trustAsHtml($scope.thirdQuadJsonhtml[x].Value);
						$scope.thirdQuadHtmlCont.push(obj);
					}
				}
				
								
				$scope.fourthQuadHtmlCont = [];			
				$scope.fourthQuadJsonhtml = $scope.jsonCont.Contents.FourthQuadrant.Contents;
				for (x in $scope.fourthQuadJsonhtml){
					if ($scope.fourthQuadJsonhtml[x].Type == "Header"){
						$scope.fourthQuadHtmlContHead = $sce.trustAsHtml($scope.fourthQuadJsonhtml[x].Value);
					} else {
						var obj = {};
						obj["Type"]=$scope.fourthQuadJsonhtml[x].Type;
						obj["Value"]=$sce.trustAsHtml($scope.fourthQuadJsonhtml[x].Value);
						$scope.fourthQuadHtmlCont.push(obj);
					}
				}
				
				$scope.fifthQuadHtmlCont = [];			
				$scope.fifthQuadJsonhtml = $scope.jsonCont.Contents.FifthQuadrant.Contents;
				for (x in $scope.fifthQuadJsonhtml){
					if ($scope.fifthQuadJsonhtml[x].Type == "Header"){
						$scope.fifthQuadHtmlContHead = $sce.trustAsHtml($scope.fifthQuadJsonhtml[x].Value);
					} else {
						var obj = {};
						obj["Type"]=$scope.fifthQuadJsonhtml[x].Type;
						obj["Value"]=$sce.trustAsHtml($scope.fifthQuadJsonhtml[x].Value);
						$scope.fifthQuadHtmlCont.push(obj);
					}
				}
				
				$scope.sixthQuadHtmlCont = [];			
				$scope.sixthQuadJsonhtml = $scope.jsonCont.Contents.SixthQuadrant.Contents;
				for (x in $scope.sixthQuadJsonhtml){
					if ($scope.sixthQuadJsonhtml[x].Type == "Header"){
						$scope.sixthQuadHtmlContHead = $sce.trustAsHtml($scope.sixthQuadJsonhtml[x].Value);
					} else {
						var obj = {};
						obj["Type"]=$scope.sixthQuadJsonhtml[x].Type;
						obj["Value"]=$sce.trustAsHtml($scope.sixthQuadJsonhtml[x].Value);
						$scope.sixthQuadHtmlCont.push(obj);
					}
				}
				
				console.log("formOverview() Forming html content finished");
		}
});