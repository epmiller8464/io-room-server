/**
 * Created by ghostmac on 3/3/16.
 */
'use strict';
var path = require('path');
var util = require('util');
var url = require('url');
var sio = require('socket.io');


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

    var channels = {}
    var listOfBroadcasts = {}

    io.on('connection', function (socket) {
        console.log('a user connected');
        var initiatorChannel = '';
        if (!io.isConnected) {
            io.isConnected = true;
        }

        socket.on('new-channel', function (data) {
            console.log(data)
            if (!channels[data.channel]) {
                initiatorChannel = data.channel;
            }

            channels[data.channel] = data.channel;
            onNewNamespace(data.channel, data.sender);
            data.joined = true
            socket.emit('joined-channel', data);
        });
        socket.on('join-channel', function (data) {
            console.log('join-channel: %s', data)
            if (!channels[data.channel]) {
                initiatorChannel = data.channel;
            }

            channels[data.channel] = data.channel;
            onNewNamespace(data.channel, data.sender);
            data.joined = true
            socket.emit('joined-channel', data);
        });
        socket.on('presence', function (channel) {
            var isChannelPresent = !!channels[channel];
            socket.emit('presence', isChannelPresent);
        });
        socket.on('message', function (channel) {
            if (initiatorChannel) {
                delete channels[initiatorChannel];
            }
        });
        socket.on('disconnect', function (channel) {
            if (initiatorChannel) {
                delete channels[initiatorChannel];
            }
        });
    });
    function onNewNamespace(channel, sender) {
        io.of('/' + channel).on('connection', function (socket) {
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


