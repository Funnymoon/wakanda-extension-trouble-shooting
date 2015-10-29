app.controller('homeCtrl', function($scope, AppType, $location) {
    $scope.appType = "";
    $scope.allType = [];
    $scope.os = (navigator.userAgent.indexOf('Mac OS X') != -1) ? "mac" : "windows";
    $scope.location = $location;

    AppType.getAllType().$promise.then(function(res) {
        $scope.allType = res.__ENTITIES;
        var typeName = studio.extension.storage.getItem("nickname");
        if (typeName) {
            for (var i = 0; i < $scope.allType.length; i++) {
                var currentType = $scope.allType[i];
                if (currentType.nickname == typeName && currentType.os == $scope.os) {
                    studio.extension.storage.setItem("nickname", null);
                    $location.path("/steps/" + currentType.ID + "/1");
                    Munchkin.munchkinFunction('clickLink', { href: "/steps/" + currentType.ID + "/1"});
                }
            }
        }
    });

    $scope.goToSteps = function() {
        $scope.location.path("/steps/" + $scope.appType.ID + "/1");
        Munchkin.munchkinFunction('clickLink', { href: "/steps/" + $scope.appType.ID + "/1"});
    };

    $('#enabler').click(function(e){
        e.preventDefault();
        $('input[type="radio"][disabled]').prop("disabled", false);
    });
    
});
app.factory('AppType', ['$resource', function($resource) {
    return $resource('http://troubleshooting.us.wak-apps.com/rest/ApplicationType', null, {
        'getAllType': {
            method: 'GET'
        }
    });
}]);