app.controller('stepsCtrl', function($scope, $routeParams, StepsFactory, StepsDescriptionFactory) {

    $scope.steps = [];

    function findItem(arr, key, value) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i][key] === value) {
                return (i);
            }
        }
        return -1;
    }

    function checkDependencies(steps) {
        if (steps.length > 0) {
            steps.forEach(function(step){
                if (step.command && step.command.length > 0) {
                    $('#sidebar a[data-id="'+step.number+'"]').removeClass('success').removeClass('error');
                    var message = {
                        step : step,
                        type: $scope.currentType,
                    };
                    studio.sendCommand('wakanda-extension-trouble-shooting.getTroubleshootingDependencyCheck.'+btoa(JSON.stringify(message))); 
                } else {
                    setTimeout(function(){
                        $('#sidebar a[data-id="'+step.number+'"]').addClass('loaded');
                    },500);
                }
            })
        }
    }

    var currentStepPosition = parseInt($routeParams.step);
    if (studio.extension.storage.getItem("step")) {
        currentStepPosition = studio.extension.storage.getItem("step");
        studio.extension.storage.setItem("step", null);
    }

    StepsFactory.getSteps({
        id: $routeParams.id
    }).$promise.then(function(res) {
        $scope.currentType = res.__ENTITIES[0];
        $scope.currentStep = $scope.currentType.steps.__ENTITIES[findItem($scope.currentType.steps.__ENTITIES, "number", currentStepPosition)];

        StepsDescriptionFactory.getDescription({
            id: $scope.currentStep.ID
        }).$promise.then(function(res) {
            $scope.descriptions = res.__ENTITIES[0].description.__ENTITIES;
            checkDependencies($scope.currentType.steps.__ENTITIES);
        });
        
    });

    $scope.setCurrentStep = function(step) {
        $scope.currentStep = step;

        StepsDescriptionFactory.getDescription({
            id: $scope.currentStep.ID
        }).$promise.then(function(res) {
            checkDependencies([$scope.currentStep]);
            $scope.descriptions = res.__ENTITIES[0].description.__ENTITIES;
        });
    };
});

app.updateStepDependency = function(type, step, result) {

    setTimeout(function(){
        if (result == true) {
            $('#sidebar a[data-id="'+step+'"]').addClass('success');
        } else if (result == false) {
            $('#sidebar a[data-id="'+step+'"]').addClass('error');        
        } else {
            if (!$('#sidebar a[data-id="'+step+'"]').hasClass('success')) {
                $('#sidebar a[data-id="'+step+'"]').addClass('error');
            }
        }
    },500);
}

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