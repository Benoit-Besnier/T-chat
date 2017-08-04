/**
 * Created by Benoit on 04/08/2017.
 */

'use strict';

var Users = {
    list: [],

    addUser : function (id, username) {
        if (id === undefined || id === null || username === undefined || username === null)
            return null;

        var user = {
            key : id,
            name: username
        };

        this.list.push(user);
        return user;
    },

    getUser : function (id) {
        var i, l, item;

        for (i = 0, l = this.list.length; i < l; ++i) {
            item = this.list[i];
            if (item.key === id)
                return item;
        }
        return null;
    },

    removeUser : function (id) {
        var i, l, item;

        for (i = 0, l = this.list.length; i < l; ++i) {
            item = this.list[i];
            if (item.key === id)
                return this.list.splice(i, 1)[0];
        }
        return null;
    }

};

module.exports = Users;