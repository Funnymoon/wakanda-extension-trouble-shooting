app.controller('homeCtrl', function($scope, DataFactory, $location) {
    $scope.data = {};
    $scope.os = (navigator.userAgent.indexOf('Mac OS X') != -1) ? "mac" : "windows";
    $scope.location = $location;

    DataFactory.all().$promise.then(function(response){
        $scope.data = response;
        var typeName = studio.extension.storage.getItem("nickname");
        if (typeName) {
            for (var i = 0; i < $scope.data.applications.length; i++) {
                var currentType = $scope.data.applications[i];
                if (currentType.nickname == typeName && currentType.os == $scope.os) {
                    studio.extension.storage.setItem("nickname", null);
                    $location.path("/steps/" + currentType.nickname + "/"+ $scope.appType.os + "/0");
                    Munchkin.munchkinFunction('clickLink', { href: "/steps/" + currentType.nickname + "/" + $scope.appType.os + "/0"});
                }
            }
        }
    });
    
    $scope.goToStep = function(appName) {
        app.goToStep(appName);
    };
});

app.factory('DataFactory', ['$resource', function($resource) {
    return $resource('./data.json', null, {
        'all': {
            method: 'GET'
        }
    });
}]);