/**
 * Created by Benoit on 03/08/2017.
 */

var AppController = angular.module('AppController', []);

AppController.controller('View', ['$scope', 'socket',
    function ($scope, socket) {

        socket.on('connection.connected', function (msg) {
            socket.id = msg.content;
            console.log("socket.id: " + socket.id);
        });

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