/**
 * Created by Benoit on 03/08/2017.
 */

var AppController = angular.module('AppController', []);

AppController.controller('View', ['$scope', '$mdDialog', '$window', 'socket',
    function ($scope, $mdDialog, $window, socket) {
        
        $scope.user = {
            username: "",
            connected: false
        };

        function init() {
            var user = JSON.parse($window.localStorage.user);

            if (user !== undefined && user !== null && user.username !== undefined && user.username !== null) {
                $scope.user.username = user.username;
                $scope.connected = true;
            }
        }

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
            });
        }

        $scope.showAdvanced();

        socket.on('connection.connected', function (msg) {
            if (msg.success) {
                $scope.user.username = msg.content.username;
                $scope.connected = true;
                // $window.localStorage.user = JSON.stringify($scope.user);
            }
        });

        // init();
    }
]);

AppController.controller('Menu', ['$scope',
    function ($scope) {

    }
]);

AppController.controller('Messages', ['$scope', 'socket', 'msgBus',
    function ($scope, socket, msgBus) {

        socket.on('chat message', function (msg) {
            if ($scope.connected) {
                msgBus.emitMsg('messageBox.newMessage', {uid: socket.id, msg: msg});
            }
        });

        socket.on('chat.typing.start', function (msg) {
            if ($scope.connected) {
                msgBus.emitMsg('typingTracker.add', msg);
            }
        });

        socket.on('chat.typing.end', function (msg) {
            if ($scope.connected) {
                msgBus.emitMsg('typingTracker.remove', msg);
            }
        });

    }
]);

AppController.controller('Input', ['$scope', 'socket',
    function ($scope, socket) {
        var message = $scope.message = {
            // Keep check of typing state
            typing  : false,
            timeout : undefined,
            // Data
            content : ""
        };

        var sendMessage = $scope.sendMessage = function () {
            if (message.content !== "" && $scope.connected) {
                socket.emit('chat message', {
                    id      : socket.id,
                    username: $scope.user.username,
                    content : message.content
                });
                message.content = "";
            }
        };

        function timeoutFunction () {
            message.typing = false;
            if ($scope.connected) {
                socket.emit('chat.typing.end', {
                    id: socket.id,
                    username: $scope.user.username,
                    content: "stop typing..."
                });
            }
        }

        function onKeyDownNotEnter () {
            if (message.typing == false && $scope.connected) {
                message.typing = true;
                socket.emit('chat.typing.start', {
                    id      : socket.id,
                    username: $scope.user.username,
                    content : "start typing..."
                });
                message.timeout = setTimeout(timeoutFunction, 5000);
            } else {
                clearTimeout(message.timeout);
                message.timeout = setTimeout(timeoutFunction, 5000);
            }

        }

        $scope.inputWatcher = function (event) {
            if (event.which === 13) {
                clearTimeout(message.timeout);
                timeoutFunction();
                sendMessage();
            } else
                onKeyDownNotEnter();
        }
    }
]);