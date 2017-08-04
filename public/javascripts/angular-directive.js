/**
 * Created by Benoit on 03/08/2017.
 */

App.directive('keyBind', function() {
    return function(scope, element, attrs) {
        element.bind("keydown, keypress", function(event) {
            if(event.which === Number(attrs.key)) {
                scope.$apply(function(){
                    scope.$eval(attrs.keyBind, {'event': event});
                });

                event.preventDefault();
            }
        });
    };
});

App.directive("messageBox", ['$compile', '$window', 'msgBus', 'ChannelManager', 'UserList',
    function ($compile, $window, msgBus, ChannelManager, UserList) {
        return {
            restrict: "C",
            link: function (scope, element, attr) {
                var elem = angular.element(element);
                var current = "general";

                msgBus.onMsg('messageBox.newPublicMessage', function (event, data) {
                    if (current == "general")
                        newPublicMessage(data);
                    ChannelManager.newMessageOnChannel("general", data.msg);
                }, scope);

                msgBus.onMsg('messageBox.newPrivateMessage', function (event, data) {
                    if (current == "general")
                        newPrivateMessage(data);
                    ChannelManager.newMessageOnChannel("general", data.msg);
                }, scope);

                var writeDOM = function (elem, html) {
                    // elem.html(''); We do not want to clear previous content
                    elem.append(html);
                    $compile(elem.contents())(scope);
                };
                
                var newPublicMessage = function (data) {
                    var classes, msg;

                    msg = data.msg;
                    classes = "message";

                    if (data.uid === msg.id)
                        classes += " " + "message-from-current-user" + " " + "public-message-color-";
                    else if (msg.id === "<0x00>")
                        classes += " " + "message-from-system-user" + " " + "public-message-color-";
                    else
                        classes += " " + "message-from-another-user" + " " + "public-message-color-";

                    writeMessage(classes, "", msg);
                    autoScrollDown();
                };

                var newPrivateMessage = function (data) {
                    var classes, msg, specialString;

                    msg = data.msg;
                    classes = "message";

                    specialString = "You";
                    if (msg.targets.length > 1) specialString += " and " + (msg.targets.length - 1) + " user";
                    if (msg.targets.length > 2) specialString += "s "; else specialString += " ";
                    specialString += "received a private message send by ";

                    if (data.uid === msg.id) {
                        classes += " " + "message-from-current-user" + " " + "private-message-color-";
                        specialString = "You send a secret message to " + (msg.targets.length) + " user(s) ";
                    }
                    else if (msg.id === "<0x00>")
                        classes += " " + "message-from-system-user" + " " + "private-message-color-";
                    else
                        classes += " " + "message-from-another-user" + " " + "private-message-color-";



                    writeMessage(classes, specialString, msg);
                    autoScrollDown();
                };

                var writeMessage = function (classes, specialString, msg) {
                    var html;
                    var color = UserList.getUserColorsById(msg.id);

                    html =  "<li class='" + classes + color + "'>"
                                + specialString
                                + "<span class='username-color-" + color + " username-style'>"
                                    + msg.username
                                + "</span><br />"
                                + msg.parsed_content
                            + "</li>";
                    writeDOM(elem, html);
                };

                var autoScrollDown = function () {
                    var block = $window.document.getElementById('message-block');
                    block.scrollTop = block.scrollHeight;
                }

            }
        }
    }
]);

App.directive("typingTracker", ['$compile', 'msgBus',
    function ($compile, msgBus) {
        return {
            restrict: "C",
            link: function (scope, element, attr) {
                var writers = [];
                scope.counter = writers.length;

                msgBus.onMsg('typingTracker.add', function (event, data) {
                    addWriter(data);
                }, scope);

                msgBus.onMsg('typingTracker.remove', function (event, data) {
                    removeWriter(data);
                }, scope);

                function addWriter (msg) {
                    var i, l, item;

                    for (i = 0, l = writers.length; i < l; ++i) {
                        item = writers[i];
                        if (msg.id === item.id)
                            return;
                    }

                    writers.push(msg);
                    updateTracker();
                }

                function removeWriter (msg) {
                    var i, l, item;

                    for (i = 0, l = writers.length; i < l; ++i) {
                        item = writers[i];
                        if (msg.id === item.id) {
                            writers.splice(i, 1);
                            updateTracker();
                            return;
                        }
                    }
                }
                
                function updateTracker() {
                    var elem = angular.element(element);
                    var counter = elem.find('.counter-writers');
                    var state = "";

                    if (writers.length < 1) state = "none"; else state = "block";
                    elem.css('display', state);
                    scope.counter = writers.length;
                }
            }
        }
    }
]);