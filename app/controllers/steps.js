app.controller('stepsCtrl', function($scope, $routeParams, StepsFactory ,StepsDescriptionFactory) {

    function findItem(arr, key, value) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][key] === value) {
            return (i);
        }
    }
          return -1;
    }
    
    
    var currentStepPosition = 1 ;
    
    
    if(studio.extension.storage.getItem("step")){
        
        currentStepPosition = studio.extension.storage.getItem("step") ;
        studio.extension.storage.setItem("step",null);
    }
    
    StepsFactory.getSteps({ id: $routeParams.id }).$promise.then(function(res) {

        $scope.currentType = res.__ENTITIES[0];

        $scope.currentStep = $scope.currentType.steps.__ENTITIES[findItem($scope.currentType.steps.__ENTITIES,"number", currentStepPosition)];
        
        StepsDescriptionFactory.getDescription({ id: $scope.currentStep.ID }).$promise.then(function(res) {
        	
        	
        	$scope.descriptions = res.__ENTITIES[0].description.__ENTITIES ; 
        
        });

    });


    $scope.setCurrentStep = function(step) {


        $scope.currentStep = step;
        
        StepsDescriptionFactory.getDescription({ id: $scope.currentStep.ID }).$promise.then(function(res) {
        	
        	
        	$scope.descriptions = res.__ENTITIES[0].description.__ENTITIES ; 
        
        });

    };
    
 

});


app.factory('StepsFactory', ['$resource', function($resource) {
    return $resource('http://troubleshooting.us.wak-apps.com/rest/ApplicationType/?$filter="ID =:id"&$expand=steps', null, {
        'getSteps': {
            method: 'GET'
        }
    });
}]);

app.factory('StepsDescriptionFactory', ['$resource', function($resource) {
    return $resource('http://troubleshooting.us.wak-apps.com/rest/Step/?$filter="ID =:id"&$expand=description', null, {
        'getDescription': {
            method: 'GET'
        }
    });
}]);