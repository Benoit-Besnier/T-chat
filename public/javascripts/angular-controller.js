/**
 * Created by Benoit on 03/08/2017.
 */

var AppController = angular.module('AppController', []);

AppController.controller('View', ['$scope', '$mdDialog', 'socket',
    function ($scope, $mdDialog, socket) {

        socket.on('connection.link', function (msg) {
            socket.id = msg.content;
            console.log("socket.id: " + socket.id);
        });

        $scope.customFullscreen = false;

        $scope.showAdvanced = function(ev) {
            $mdDialog.show({
                controller: DialogController,
                templateUrl: 'template/login',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: false,
                escapeToClose: false,
                fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
            })
                .then(function(answer) {
                    $scope.status = 'You said the information was "' + answer + '".';
                }, function() {
                    $scope.status = 'You cancelled the dialog.';
                });
        };

        function DialogController ($scope, $mdDialog) {
            $scope.username = "";

            $scope.hide = function (content) {
                $mdDialog.hide(content);
            };

            $scope.sendUsername = function () {
                if ($scope.username !== "") {
                    socket.emit('connection.connect', {
                        id: socket.id,
                        content: $scope.username
                    });
                }
            };

            socket.on('connection.connected', function (msg) {
                if (msg.success) {
                    $scope.hide();
                } else {
                    $scope.username = "";
                }

            })
        }

        $scope.showAdvanced();

    }
]);

AppController.controller('Menu', ['$scope',
    function ($scope) {

    }
]);

AppController.controller('Messages', ['$scope', 'socket', 'msgBus',
    function ($scope, socket, msgBus) {

        socket.on('chat message', function (msg){
            msgBus.emitMsg('messageBox.newMessage', {uid: socket.id, msg: msg});
        });

    }
]);

AppController.controller('Input', ['$scope', 'socket',
    function ($scope, socket) {
        var message = $scope.message = {
            content: ""
        };

        var sendMessage = $scope.sendMessage = function () {
            if (message.content !== "") {
                socket.emit('chat message', {
                    id: socket.id,
                    content: message.content
                });
                message.content = "";
            }
        };
    }
]);