var app = angular.module("troubleshooting", ['ngResource', 'ngRoute', 'ngSanitize']);

app.config(function($routeProvider, $locationProvider) {

    $routeProvider.when('/home', {
        templateUrl: 'app/views/home.html',
        controller: 'homeCtrl'
    }).when('/steps/:id/:os/:step', {
        templateUrl: 'app/views/steps.html',
        controller: 'stepsCtrl'
    }).otherwise({
        redirectTo: "/home"
    });
    
});

app.goToStep = function(appName, stepNumber, localOs) {
    var os = (navigator.userAgent.indexOf('Mac OS X') != -1) ? "mac" : "windows";
    var locationUrl = "#/steps/" + appName + "/" + (localOs ? localOs : os) + "/" + (stepNumber ? stepNumber : '0');
    studio.extension.storage.setItem("nickname", null);
    studio.extension.storage.setItem("step", null);
    window.location.href = locationUrl;
};

$(document).ready(function(){
    if (studio.extension.storage.getItem("nickname")) {
        app.goToStep(studio.extension.storage.getItem("nickname"),studio.extension.storage.getItem("step"));
    }
});
