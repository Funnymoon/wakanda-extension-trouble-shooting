var app = angular.module("troubleshooting", ['ngResource', 'ngRoute', 'ngSanitize']);

app.config(function($routeProvider, $locationProvider) {

    $routeProvider.when('/home', {
        templateUrl: 'app/views/home.html',
        controller: 'homeCtrl'
    }).when('/steps/:id/:os/:step', {
        templateUrl: 'app/views/steps.html',
        controller: 'stepsCtrl'
    }).when('/issues/:id', {
        templateUrl: 'app/views/issues.html',
        controller: 'issuesCtrl'
    }).otherwise({
        redirectTo: "/home"
    });
    
});

app.factory('DataFactory', ['$resource', '$q', function($resource, $q) {
    return {
        all: function(){
            return $q(function(resolve, reject) {
                studio.sendCommand('wakanda-extension-trouble-shooting.storeDependenciesStatus');
                try {
                    var solutionConfigJson = studio.extension.storage.getItem('solution-config');
                    var solutionConfig = JSON.parse(solutionConfigJson);
                    resolve(solutionConfig);
                } catch (err) {
                    reject(err);
                }
            });
        }
    };
}]);

app.sendAnalytics = function(pageUrl,pageTitle) {
    if(typeof ga != 'undefined') {
        ga('create', 'UA-29183282-2', 'http://troubleshooting.wakanda.io');
        ga('set', 'checkProtocolTask', function(){ /* nothing */ });
        ga('set', 'page', pageUrl);
        ga('set', 'title', pageTitle);
        ga('send', 'pageview',  pageUrl);
    }
};

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