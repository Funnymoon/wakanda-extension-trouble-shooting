var app = angular.module("troubleshooting", ['ngResource', 'ngRoute', 'ngSanitize']);

app.config(function($routeProvider, $locationProvider) {

    $routeProvider.when('/home', {
        templateUrl: 'app/views/home.html',
        controller: 'homeCtrl'
    }).when('/steps/:id', {
        templateUrl: 'app/views/steps.html',
        controller: 'stepsCtrl'
    }).otherwise({
        redirectTo: "/home"
    });
    
});