// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('fimController', function ($scope, DataFactory, $mdToast) {
    //Initialisation
    $scope.load = true;
    var objectsArray = [];
    var loadWatch;

    $scope._fimEvent = 'all'
    $scope.files = [];
    $scope.fileSearch = '';

    $scope.$parent.submenuNavItem = 'fim';

    //Print error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        if ($scope._files_blocked) {
            $scope._files_blocked = false;
        }
    };

    //Functions

    $scope.fileSearchFilter = function (search) {
        if (search) {
            DataFactory.filters.set(objectsArray['/files'], 'search', search);
        } else {
            DataFactory.filters.unset(objectsArray['/files'], 'search');
        }
    };

    $scope.fileEventFilter = function (event) {
        if (event == 'all') {
            DataFactory.filters.unset(objectsArray['/files'], 'event');
        } else {
            DataFactory.filters.set(objectsArray['/files'], 'event', event);
        }
    };

    $scope.filesObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope._files_blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/files']);
            if (DataFactory.filters.flag(objectsArray['/files'])) {
                $scope._files_blocked = true;
                DataFactory.scrollTo(objectsArray['/files'], 50)
                    .then(function (data) {
                        $scope.files.length = 0;
                        $scope.files = data.data.items;
                        DataFactory.filters.unflag(objectsArray['/files']);
                        $scope._files_blocked = false;
                    }, printError);
            } else if ((_pos > 70) || (_pos < 0)) {
                $scope._files_blocked = true;
                DataFactory.scrollTo(objectsArray['/files'], index)
                    .then(function (data) {
                        $scope.files.length = 0;
                        $scope.files = data.data.items;
                        $scope._files_blocked = false;
                    }, printError);
            } else {
                return $scope.files[_pos];
            }
        },
        getLength: function () {
            return DataFactory.getTotalItems(objectsArray['/files']);
        },
    };

    var createWatch = function () {
        loadWatch = $scope.$watch(function () {
            return $scope.$parent._agent;
        }, function () {
            DataFactory.initialize('get', '/syscheck/' + $scope.$parent._agent.id + '/files', {}, 100, 0)
                .then(function (data) {
                    DataFactory.clean(objectsArray['/files']);
                    objectsArray['/files'] = data;
                    DataFactory.get(objectsArray['/files'])
                        .then(function (data) {
                            $scope.files.length = 0;
                            $scope.files = data.data.items;
                            DataFactory.filters.register(objectsArray['/files'], 'search', 'string');
                            DataFactory.filters.register(objectsArray['/files'], 'event', 'string');
                            $scope.fileSearchFilter($scope._fileSearch);
                            $scope.fileEventFilter($scope._fimEvent);
                        }, printError);
                }, printError);
        });
    };

    var load = function () {
        DataFactory.initialize('get', '/syscheck/' + $scope.$parent._agent.id + '/files', {}, 100, 0)
            .then(function (data) {
                objectsArray['/files'] = data;
                DataFactory.get(objectsArray['/files'])
                    .then(function (data) {
                        $scope.files = data.data.items;
                        DataFactory.filters.register(objectsArray['/files'], 'search', 'string');
                        DataFactory.filters.register(objectsArray['/files'], 'event', 'string');
                        createWatch();
                        $scope.load = false;
                    }, printError);
            }, printError);
    };

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
        $scope.files.length = 0;
        loadWatch();
    });

});
