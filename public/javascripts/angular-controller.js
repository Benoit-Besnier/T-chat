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

        socket.on('connection.connected', function (msg) {
            if (msg.success) {
                $scope.user.username = msg.content.username;
                $scope.connected = true;
                // $window.localStorage.user = JSON.stringify($scope.user);
            }
        });

        $scope.showAdvanced();

        // init();
    }
]);

AppController.controller('Menu', ['$scope',
    function ($scope) {

    }
]);

AppController.controller('Messages', ['$scope', 'socket', 'msgBus', 'UserList',
    function ($scope, socket, msgBus, UserList) {

        socket.on('chat.message.public', function (msg) {
            if ($scope.connected) {
                UserList.setNewUser(msg.id, msg.username);
                console.log("New Public Message received");
                msgBus.emitMsg('messageBox.newPublicMessage', {uid: socket.id, msg: msg});
            }
        });

        socket.on('chat.message.private', function (msg) {
            if ($scope.connected) {
                console.log("New Private Message received");
                msgBus.emitMsg('messageBox.newPrivateMessage', {uid: socket.id, msg: msg});
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

AppController.controller('Input', ['$location', '$scope', '$window', 'socket', 'UserList', 'MessageParser',
    function ($location, $scope, $window, socket, UserList, MessageParser) {
        var message = $scope.message = {
            // Keep check of typing state
            typing  : false,
            timeout : undefined,
            // Data
            content : "",
            parsed_content : "",
            targets : []
        };

        $scope.disconnect = function () {
            $window.localStorage.clear();
            $window.location.href = '/';
        };

        var sendMessage = $scope.sendMessage = function () {
            if (message.content !== "" && $scope.connected) {
                message.parsed_content = MessageParser.parse(message.content);
                console.log(message.parsed_content);
                if (MessageParser.isMessagePrivate()) {
                    var targetsName, t_id;

                    targetsName = MessageParser.getTargets();
                    console.log(targetsName);
                    console.log(UserList.getUsers());
                    for (var i = 0, len = targetsName.length; i < len; ++i) {
                        t_id = UserList.getUserIdByName(targetsName[i]);
                        if (t_id != null && t_id != undefined)
                            message.targets.push(t_id);
                    }
                    console.log(message.targets.length);
                    socket.emit('chat.message.private', {
                        id              : socket.id,
                        username        : $scope.user.username,
                        targets         : message.targets,
                        raw_content     : message.content,
                        parsed_content  : message.parsed_content
                    });
                } else
                    socket.emit('chat.message.public', {
                        id              : socket.id,
                        username        : $scope.user.username,
                        raw_content     : message.content,
                        parsed_content  : message.parsed_content
                    });

                message.content = "";
                message.parsed_content = "";
                message.targets.length = 0;
                MessageParser.clear();
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