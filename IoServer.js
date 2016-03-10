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
    console.log('connecting socket.io')
    var opts = {
        transports: [
            'polling',
            'websocket',// 'disconnect' EVENT will work only with 'websocket'
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
        console.log('a user connected %s', socket.id);
        //console.log('%s', util.inspect(socket));
        //var initiatorChannel = '';
        if (!io.isConnected) {
            io.isConnected = true;
        }

        socket.on('new-channel', function (data) {
            console.log(data)
            onNewNamespace(data.channel, data.sender);
            //socket.emit('joined-channel', data);
        });

        socket.on('disconnect', function (channel) {
            //if (!channel) {
            //
            //     delete rooms[initiatorChannel];
            //}
        });

        socket.on('join-room', function (data) {
            console.log('join-channel: %s', data)
            //socket.emit('channel-joined', data);
        });

        //socket.on('presence', function (channel) {
        //    var isChannelPresent = !!rooms[channel];
        //    socket.emit('presence', isChannelPresent);
        //});

        socket.on('message', function (channel) {
            if (channel) {
                delete rooms[channel];
            }
        });
    });
    function onNewNamespace(channel, sender) {
        var room = rooms[channel]
        if (!room) {
            room = new Room(io, {channel: channel, publisher: sender})
            rooms[channel] = room
        }

        //nsp.on('connection', function (socket) {
        //    var username;
        //    if (io.isConnected) {
        //        io.isConnected = false;
        //        socket.emit('connect', true);
        //    }
        //
        //    socket.on('message', function (data) {
        //        if (data.from === from) {
        //            if (!username) username = data.data.from;
        //
        //            socket.broadcast.emit('message', data.data);
        //        }
        //    });
        //
        //    socket.on('disconnect', function () {
        //        if (username) {
        //            socket.broadcast.emit('user-left', username);
        //            username = null;
        //        }
        //    });
        //});
    }
}


