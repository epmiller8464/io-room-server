/**
 * Created by ghostmac on 3/4/16.
 */
var db = require('../db')
var User = require('./User')
var pino = require('pino')
var noop = function*() {
}
var Room = function Room(opts) {
    "use strict";
    if(!(this instanceof Room))
        return new Room(opts);

    opts = opts || {};
    var self = this
    var io = opts.io
    self.opts = opts
    self.id = opts.id
    self.channel = opts.channel
    self.nsp = null
    self.peers = null
    self.broadcaster = null
    self.isConnected = false
    self.channelIsReady = false

    //var nsp = io.of('/' + data.channel)

    //self.nsp.on('connection', Room.onConnection);
    return (self)
}

Room.prototype.peerCount = function () {
    var self = this
    return Object.keys(self.peers).length
}

Room.prototype.onJoinChannel = function (username, socket, cb) {
}

Room.prototype.onIncomingMessage = function (data) {

    pino.info(data)
    nsp.emit('message', data)
}

Room.prototype.onSignaling = function () {
}

function join(socket, cb) {
    var self = this
    if(!user)
        return cb()

    if(!self.peers) {
        self.peers = {}
    }

    if(!self.broadcaster)
        self.broadcaster = user.id

    self.peers[user.id] = user

    self.nsp.emit('channel-joined', user)
    return cb(user)
}
//
//function send(channel, username, socket, cb) {
//
//    db.get(channel, function (err, room) {
//
//        if(err)return cb(err, null)
//        if(!room)return cb(new Error('couldnt find your channel'), null)
//
//        if(room) {
//            var user = new User({
//                id: socket.id,
//                username: username
//                //socket:socket,
//            })
//
//            if(!room.peers) {
//                room.peers = {}
//            }
//
//            if(!room.initiator)
//                room.initiator = user.id
//
//            room.peers[user.id] = user
//            db.put(room.channel, room, function (err) {
//                return cb(err, room)
//            })
//        }
//
//    })
//}
module.exports = Room;


