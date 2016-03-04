/**
 * Created by ghostmac on 3/4/16.
 */

var uuid = require('node-uuid')


module.exports = Room;

function Room(channel, transport, opts) {
    "use strict";
    if (!(this instanceof Room))
        return new Room(channel, transport, opts);

    opts = opts || {};
    var self = this

    self.opts = opts
    self.name = channel
    self.transport = transport
    self.subscribers = {}
    self.isConnected = false

    self.transport.on('connection', function (socket) {
        var client_uuid = uuid.v4()
        self.subscribers[client_uuid] = new User({id: client_uuid, name: '', ws: socket})
        //var username;
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


function User(opts) {
    "use strict";

    self.id = opts.pid
    self.name = opts.name
    self.socket = opts.ws

}