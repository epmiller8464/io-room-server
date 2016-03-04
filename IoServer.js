/**
 * Created by ghostmac on 3/3/16.
 */
'use strict';
var path = require('path');
var util = require('util');
var url = require('url');
var sio = require('socket.io');

var Room = require('./lib/Room')
module.exports = IoServer;

function IoServer(http) {
    var opts = {
        transports: [
            'websocket',// 'disconnect' EVENT will work only with 'websocket'
            'polling'
            //'xhr-polling',
            //'jsonp-polling'
        ],
        log: true,
        origins: '*:*'
    };
    var io = sio(http, opts)

    var rooms = {}
    var listOfBroadcasts = {}

    io.on('connection', function (socket) {
        console.log('a user connected');
        var initiatorChannel = '';
        if (!io.isConnected) {
            io.isConnected = true;
        }

        socket.on('new-channel', function (data) {
            console.log(data)
            onNewNamespace(data.channel, data.sender);
            //socket.emit('joined-channel', data);
        });

        socket.on('join-channel', function (data) {
            console.log('join-channel: %s', data)
            socket.emit('joined-channel', data);
        });

        socket.on('presence', function (channel) {
            var isChannelPresent = !!rooms[channel];
            socket.emit('presence', isChannelPresent);
        });

        socket.on('message', function (channel) {
            if (initiatorChannel) {
                delete rooms[initiatorChannel];
            }
        });

        socket.on('disconnect', function (channel) {
            if (initiatorChannel) {
                delete rooms[initiatorChannel];
            }
        });
    });
    function onNewNamespace(channel, sender) {

        var nsp = io.of('/' + channel)
        var room = new Room(channel, nsp, {})

        room.onConnect = function(){}

        nsp.on('connection', function (socket) {
            var username;
            if (io.isConnected) {
                io.isConnected = false;
                socket.emit('connect', true);
            }

            socket.on('message', function (data) {
                if (data.sender == sender) {
                    if (!username) username = data.data.sender;

                    socket.broadcast.emit('message', data.data);
                }
            });

            socket.on('disconnect', function () {
                if (username) {
                    socket.broadcast.emit('user-left', username);
                    username = null;
                }
            });
        });
    }
}


