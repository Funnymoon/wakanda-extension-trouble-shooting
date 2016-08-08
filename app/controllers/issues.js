app.controller('issuesCtrl', function($scope, $routeParams, DataFactory) {

    $scope.os = (navigator.userAgent.indexOf('Mac OS X') != -1) ? "mac" : "windows";

    $scope.steps = [];

    DataFactory.all().then(function(response) {
        $scope.currentOs = $routeParams.os;
        $scope.issues = response.issues;
        $scope.currentIssue = $scope.issues[$routeParams.id];
        app.sendAnalytics(window.location.hash,'issue: '+$scope.currentIssue.title);
    });

});

