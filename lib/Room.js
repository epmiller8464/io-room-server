/**
 * Created by ghostmac on 3/4/16.
 */

var uuid = require('node-uuid')
//var io = require('socket.io');

module.exports = Room;

function Room(io, opts) {
    "use strict";
    if (!(this instanceof Room))
        return new Room(opts);

    opts = opts || {};
    var self = this

    self.opts = opts
    self.id = uuid.v4() //opts.id
    self.name = opts.channel
    self.subscribers = {}
    self.isConnected = false
    self.transport = io.of('/' + opts.channel)
    self.transport.on('connection', function (socket) {
        var client_uuid = socket.id
        var u;
        self.subscribers[client_uuid] = u = new User({id: client_uuid, name: '', socket: socket, publisher: true})
        //var username;
        //socket.broadcast.emit('room-joined', self.subscribers[client_uuid]);
        socket.join(self.name)
        socket.emit('connect', true);

        socket.on('message', function (data) {
            var name = data.username;
            console.log('s: message')
            console.log(data)
            socket.broadcast.emit('message', data.data);
        });

        socket.on('signaling', function (data) {
            console.log('s: signaling')
            console.log(data)
            socket.broadcast.emit('broadcasting', {echo: data});
        });
        socket.on('error', function (error) {
            if (error) {

                socket.broadcast.emit('broadcasting', {echo: data});
            }
        });
        //socket.on('join-room', function (data) {
        //    if (data.sender) {
        //
        //        socket.broadcast.emit('broadcasting', data.data);
        //    }
        //});

        socket.on('disconnect', function () {
            //self.subscribers[
            socket.broadcast.emit('user-left', {});
        })

    });

}


function User(opts) {
    var self = this
    self.id = opts.id
    self.name = opts.name
    self.socket = opts.socket
    self.publisher = opts.publisher || false
}