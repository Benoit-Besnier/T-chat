/**
 * Created by Benoit on 03/08/2017.
 */

App.factory('socket', function ($rootScope) {
    var socket = io.connect();
    return {
        id                  : undefined,
        init                : function () {
            socket.removeAllListeners();
        },
        on                  : function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit                : function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        },
        removeAllListeners  : function (eventName, callback) {
            socket.removeAllListeners(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        }
    };
});

App.factory('msgBus', ['$rootScope', function ($rootScope) {
    var msgBus = {};
    msgBus.emitMsg = function(msg, data) {
        data = data || {};
        $rootScope.$emit(msg, data);
    };
    msgBus.onMsg = function(msg, func, scope) {
        var unbind = $rootScope.$on(msg, func);
        if (scope) {
            scope.$on('$destroy', unbind);
        }
    };
    return msgBus;
}]);

App.factory('ChannelManager', [
    function () {
        var channels = {
            general: []
        };
        return {
            current     : channels["general"],

            openNewChannel      : function (name) {
                channels[name] = [];
            },

            closeNewChannel     : function (name) {
                delete channels[name];
            },

            newMessageOnChannel : function (name, msg) {
                channels[name].push(msg);
            },

            getMessagesOnChannel : function (name) {
                return channels[name];
            }
        }
    }
]);

App.factory('UserList', [
   function () {
       var users = {};
       return {
           setNewUser : function (id, username) {
               if (users[id] == null || users[id] == undefined)
                   users[id] = {
                       css_color : Math.round(((Math.random() * 10000) % 17) + 1),
                       name : null,
                   };
               if (username != null || username != undefined)
                   users[id]["name"] = username;
               return users[id];
           },

           getUserColorsById : function (id) {
               if (users[id] == null || users[id] == undefined)
                   return this.setNewUser(id, null)["css_color"];
               return users[id]["css_color"];
           },

           getUserIdByName : function (name) {
               if (name == null || name == undefined)
                   return null;
               var keys = Object.keys(users);
               for (var i = 0, len = keys.length; i < len; ++i) {
                   if (users[keys[i]]["name"] == name)
                       return keys[i];
               }
               return null;
           },

           getUserNameById : function (id) {
               if (id == null || id == undefined)
                   return null;
               if (users[id] == null || users[id] == undefined)
                   return null;
               return users[id]["name"];

           },

           getUsers : function () {
               return users;
           }
       }
   }
]);

App.factory('MessageParser', [
    function () {
        var word_array = [];
        var targets = [];
        return {
            parse : function (content) {
                if (content == null || content == "")
                    return null;
                if (this.parseSubstrings(content))
                    if (this.parseTargets())
                        return this.buildParsedMessage();

                return null;
            },

            parseSubstrings : function (content) {
                if (content == null || content == "")
                    return false;
                word_array = content.split(" ");
                return word_array.length > 0;
            },

            parseTargets : function () {
                if (word_array.length == 0)
                    return false;
                var char, substr;

                for (var i = 0, len = word_array.length; i < len; ++i) {
                    char = word_array[i].charAt(0);
                    if (char == '@') {
                        substr = word_array[i].substring(1);
                        if (substr.length > 0)
                            targets.push(substr);
                    }
                    else break;
                }
                return true;
            },

            buildParsedMessage : function () {
                var parsedStr = "";
                for (var i = targets.length, len = word_array.length; i < len; ++i) {
                    parsedStr += word_array[i];
                    if (i < (len - 1))
                        parsedStr += " ";
                }
                return parsedStr;
            },

            isMessagePrivate : function () {
                return targets.length > 0;
            },

            clear : function () {
                word_array.length = 0;
                targets.length = 0;
            },

            getTargets : function() {
                return targets;
            }
        }
    }
]);