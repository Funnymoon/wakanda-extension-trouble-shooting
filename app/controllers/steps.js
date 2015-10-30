stepsChecks = [];

app.controller('stepsCtrl', function($scope, $routeParams, StepsFactory, StepsDescriptionFactory) {

    $scope.steps = [];

    function activateMunchkin() {
        $("a").on('click', function(event) {
            var urlThatWasClicked = $(this).attr('href');
            Munchkin.munchkinFunction('clickLink', { href: urlThatWasClicked});
        });
    }

    function findItem(arr, key, value) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i][key] === value) {
                return (i);
            }
        }
        return -1;
    }

    $scope.checkStep = function(step) {
        $('.step .stepCheck[data-id="'+step.number+'"]').removeClass('locked');
        checkDependencies([step]);
        studio.sendCommand('wakanda-extension-mobile-core.checkDependencies');
    }

    function checkDependencies(steps) {
        if (steps.length > 0) {
            steps.forEach(function(step){
                if (step.command && step.command.length > 0) {
                    var message = {
                        step : step,
                        type: $scope.currentType,
                    };
                    studio.sendCommand('wakanda-extension-trouble-shooting.getTroubleshootingDependencyCheck.'+btoa(JSON.stringify(message))); 
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
        stepsChecks = [];
        $scope.currentType = res.__ENTITIES[0];
        $scope.currentStep = $scope.currentType.steps.__ENTITIES[findItem($scope.currentType.steps.__ENTITIES, "number", currentStepPosition)];

        $scope.steps = [];
        $scope.currentType.steps.__ENTITIES.forEach(function(element,id){
            $scope.steps.push(element);
        });
        $scope.steps = $scope.steps.sort(function(a, b) {
            return parseFloat(a.number) - parseFloat(b.number);
        });

        StepsDescriptionFactory.getDescription({
            id: $scope.currentStep.ID
        }).$promise.then(function(res) {
            $scope.descriptions = res.__ENTITIES[0].description.__ENTITIES;
        });

        checkDependencies($scope.steps);
        activateMunchkin();
    });

    $scope.goPrevStep = function() {
        $scope.setCurrentStep($scope.steps[parseInt($scope.currentStep.number) - 2]);
    };

    $scope.goNextStep = function() {
        $scope.setCurrentStep($scope.steps[parseInt($scope.currentStep.number)]);
    };

    $scope.setCurrentStep = function(step) {
        $('#support-label').hide();
        $scope.currentStep = step;

        StepsDescriptionFactory.getDescription({
            id: $scope.currentStep.ID
        }).$promise.then(function(res) {
            checkDependencies([$scope.currentStep]);
            $scope.descriptions = res.__ENTITIES[0].description.__ENTITIES;
            $('.step .stepCheck[data-id="'+step.number+'"]').removeClass('success').removeClass('error').html('Check'); 
        });
    };
});

app.updateStepDependency = function(type, step, result) {
    $('#sidebar a[data-id="'+step+'"] span.label').removeClass('label-success').removeClass('label-danger').addClass('label-default').html('...');
    if ($('.step .stepCheck[data-id="'+step+'"]').length > 0 && !$('.step .stepCheck[data-id="'+step+'"]').hasClass('locked')) { 
        $('.step .stepCheck[data-id="'+step+'"]').removeClass('success').removeClass('error').html('Checking...'); 
    }
    if (result == true || result == false) {
        stepsChecks[step] = result;
    } else {
        if (stepsChecks[step] != true && stepsChecks[step] != false) {
            stepsChecks[step] = false;
        }
        setTimeout(function(){
            if (stepsChecks[step] == true) {
                $('#sidebar a[data-id="'+step+'"] span.label').removeClass('label-danger').addClass('label-success').html('<i>Installed </i>✓');
                if ($('.step .stepCheck[data-id="'+step+'"]').length > 0 && !$('.step .stepCheck[data-id="'+step+'"]').hasClass('locked')) { 
                    $('.step .stepCheck[data-id="'+step+'"]').removeClass('error').addClass('success').html('Done! Check again');
                        $('.step .stepCheck[data-id="'+step+'"]').addClass('locked');
                }
            } else {
                $('#sidebar a[data-id="'+step+'"] span.label').removeClass('label-success').addClass('label-danger').html('<i>Missing </i>!');  
                if ($('.step .stepCheck[data-id="'+step+'"]').length > 0 && !$('.step .stepCheck[data-id="'+step+'"]').hasClass('locked')) {
                    $('#support-label').show();
                    $('.step .stepCheck[data-id="'+step+'"]').removeClass('success').addClass('error').html('I ran into issues. Check again');
                    $('.step .stepCheck[data-id="'+step+'"]').addClass('locked');
                }
            }
        },250);
    }
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