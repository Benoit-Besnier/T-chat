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

App.directive("messageBox", ['$compile', '$window', 'msgBus',
    function ($compile, $window, msgBus) {
        return {
            restrict: "C",
            link: function (scope, element, attr) {
                var elem = angular.element(element);

                msgBus.onMsg('messageBox.newMessage', function (event, data) {
                    newMessage(data);
                }, scope);

                /**
                 * Add HTML into DOM while binding angular instance if needed.
                 *
                 * @param elem
                 * @param html
                 */
                var writeDOM = function (elem, html) {
                    // elem.html(''); We do not want to clear previous content
                    elem.append(html);
                    $compile(elem.contents())(scope);
                };
                
                var newMessage = function (data) {
                    var html, classes, msg;

                    msg = data.msg;
                    classes = "message";

                    if (data.uid === msg.id)
                        classes += " " + "message-from-current-user";
                    else if (msg.id === "<0x00>")
                        classes += " " + "message-from-system-user";
                    else
                        classes += " " + "message-from-another-user";

                    html = "<li class='" + classes + "'>" + msg.content + "</li>";
                    writeDOM(elem, html);

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

                    console.log(writers.length);
                    if (writers.length < 1) state = "none"; else state = "block";
                    elem.css('display', state);
                    scope.counter = writers.length;
                }
            }
        }
    }
]);