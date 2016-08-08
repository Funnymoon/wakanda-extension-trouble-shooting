stepsChecks = [];

app.controller('stepsCtrl', function($scope, $routeParams, DataFactory, $location) {

    var solutionConfig = {};

    $scope.os = (navigator.userAgent.indexOf('Mac OS X') != -1) ? "mac" : "windows";

    $scope.steps = [];

    $scope.checkStep = function() {
        $('.step .stepCheck[data-id="'+$scope.currentStepPosition+'"]').removeClass('locked');
        $scope.currentStep.stepNumber = $scope.currentStepPosition;
        checkDependencyStep($scope.currentStep);      
        studio.sendCommand('wakanda-extension-trouble-shooting.checkDependencies');
    }

    function checkDependencyStep(step) {
        if (!step.dependency || !solutionConfig.dependencies) {
            return false;
        }

        var dependency = solutionConfig.dependencies[step.dependency];
        if (!dependency || !dependency.command) {
            return false;
        }

        var dependencyCommand = dependency.command;
        if (typeof dependency.command === 'object') {
            dependencyCommand = dependency.command[$scope.os];
            if (!dependencyCommand) {
                return false;
            }
        }

        if (dependencyCommand.length < 1) {
            return false;
        }

        var message = {
            command: dependencyCommand,
            step : step.stepNumber,
            type: $scope.currentType.nickname,
        };

        studio.sendCommand('wakanda-extension-trouble-shooting.getTroubleshootingDependencyCheck.'+btoa(JSON.stringify(message))); 
    }

    function checkDependencies(steps) {
        if (steps && steps.length > 0) {
            steps.forEach(function(step, i) {
                step.stepNumber = i;
                checkDependencyStep(step);
            });
        }
    }

    $scope.currentStepPosition = parseInt($routeParams.step);

    DataFactory.all().then(function(response) {
        stepsChecks = [];
        solutionConfig = response;
        $scope.currentOs = $routeParams.os;
        $scope.currentType = solutionConfig.troubleshooting[$routeParams.id];
        var steps = $scope.currentType.steps[$scope.currentOs] || [];
        steps.forEach(function(step) {
            var dependency = solutionConfig.dependencies[step.dependency];
            if(dependency && dependency.command) {
                step.command = dependency.command;
            }
        });
        $scope.steps = steps;
        $scope.currentStep = $scope.steps[$scope.currentStepPosition];

        checkDependencies($scope.steps);
        app.sendAnalytics(window.location.hash,'tutorial: '+$scope.currentStep.name);
    });

    $scope.goPrevStep = function() {
        $scope.setCurrentStep($scope.currentStepPosition - 1);
    };

    $scope.goNextStep = function() {
        $scope.setCurrentStep($scope.currentStepPosition + 1);
    };

    $scope.setCurrentStep = function(stepNumber) {
        $scope.currentStepPosition = stepNumber;
        $('#support-label').hide();
        $scope.currentStep = $scope.steps[stepNumber];
        $scope.currentStep.stepNumber = stepNumber;
        checkDependencyStep($scope.currentStep);
        
        $('.step .stepCheck').removeClass('success').removeClass('error').html('Check');

        var currentHashArray = window.location.hash.split('/');
        currentHashArray.pop();
        $scope.currentHash = currentHashArray.join('/') + '/' + $scope.currentStepPosition;
        app.sendAnalytics($scope.currentHash,'tutorial: '+$scope.currentStep.name);
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
                    $('.step .stepCheck[data-id="'+step+'"]').removeClass('error').addClass('success').html('Checked. Check again').addClass('locked');
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