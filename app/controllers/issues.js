app.controller('issuesCtrl', function($scope, $routeParams, DataFactory) {

    $scope.os = (navigator.userAgent.indexOf('Mac OS X') != -1) ? "mac" : "windows";

    $scope.steps = [];

    function activateMunchkin() {
        Munchkin.munchkinFunction('clickLink', { href: window.location.hash });
    }

    DataFactory.all().$promise.then(function(response) {
        $scope.currentOs = $routeParams.os;
        $scope.issues = response.issues;
        $scope.currentIssue = $scope.issues[$routeParams.id];

        setTimeout(function(){
            activateMunchkin();
        },500);
    });

});

