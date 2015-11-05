stepsChecks = [];

app.controller('stepsCtrl', function($scope, $routeParams, DataFactory) {

    $scope.os = (navigator.userAgent.indexOf('Mac OS X') != -1) ? "mac" : "windows";

    $scope.steps = [];

    function activateMunchkin() {
        Munchkin.munchkinFunction('clickLink', { href: window.location.hash });
    }

    $scope.checkStep = function() {
        $('.step .stepCheck[data-id="'+$scope.currentStepPosition+'"]').removeClass('locked');
        checkDependencies([$scope.currentStep]);
        studio.sendCommand('wakanda-extension-mobile-core.checkDependencies');
    }

    function checkDependencies(steps) {
        if (steps) {
            switch (steps.length) {
                case 0:
                    break;
                case 1:
                    var step = steps[0];
                    if (step.command && step.command.length > 0) {
                        var message = {
                            command: step.command,
                            step : $scope.currentStepPosition,
                            type: $scope.currentType.nickname,
                        };
                        studio.sendCommand('wakanda-extension-trouble-shooting.getTroubleshootingDependencyCheck.'+btoa(JSON.stringify(message))); 
                    }
                    break;
                default:
                    steps.forEach(function(step,key){
                        if (step.command && step.command.length > 0) {
                            var message = {
                                command: step.command,
                                step : key,
                                type: $scope.currentType.nickname,
                            };
                            studio.sendCommand('wakanda-extension-trouble-shooting.getTroubleshootingDependencyCheck.'+btoa(JSON.stringify(message))); 
                        }
                    })
                    break;
            }
        }
    }

    $scope.currentStepPosition = parseInt($routeParams.step);

    DataFactory.all().$promise.then(function(response) {
        stepsChecks = [];
        $scope.currentOs = $routeParams.os;
        $scope.currentType = response.applications[$routeParams.id];
        $scope.steps = $scope.currentType.steps[$scope.currentOs];
        $scope.currentStep = $scope.steps[$scope.currentStepPosition];

        checkDependencies($scope.steps);
        setTimeout(function(){
            activateMunchkin();
        },500);
    });

    $scope.goPrevStep = function() {
        $('.step .stepCheck').removeClass('success').removeClass('error').html('Check');
        $scope.setCurrentStep($scope.currentStepPosition - 1);
    };

    $scope.goNextStep = function() {
        $('.step .stepCheck').removeClass('success').removeClass('error').html('Check');
        $scope.setCurrentStep($scope.currentStepPosition + 1);
    };

    $scope.setCurrentStep = function(stepNumber) {
        $scope.currentStepPosition = stepNumber;
        $('#support-label').hide();
        $scope.currentStep = $scope.steps[stepNumber];
        checkDependencies([$scope.currentStep]);
        $('.step .stepCheck[data-id="'+stepNumber+'"]').removeClass('success').removeClass('error').html('Check');
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
                    $('.step .stepCheck[data-id="'+step+'"]').removeClass('error').addClass('success').html('Done! Check again').addClass('locked');
                }
            } else {
                $('#sidebar a[data-id="'+step+'"] span.label').removeClass('label-success').addClass('label-danger').html('<i>Missing </i>');  
                if ($('.step .stepCheck[data-id="'+step+'"]').length > 0 && !$('.step .stepCheck[data-id="'+step+'"]').hasClass('locked')) {
                    $('#support-label').show();
                    $('.step .stepCheck[data-id="'+step+'"]').removeClass('success').addClass('error').html('Not found! Check again').addClass('locked');
                }
            }
        },150);
    }
}