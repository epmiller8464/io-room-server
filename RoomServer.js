/*

 */
var uuid = require('node-uuid')
var pino = require('pino')()
var db = require('./db')
var Room = require('./lib/Room')
var User = require('./lib/user')

var noop = function () {
}
var rooms = {}
var io;
var createServer = function (http, emitter) {

    var opts = {
        transports: [
            'polling',
            'websocket',
            'xhr-polling',
            'jsonp-polling'
        ],
        log: false,
        origins: '*:*'
    }// 'disconnect' EVENT will work only with 'websocket
    io = require('socket.io')(http, opts)

    io.on('connection', function (socket) {
        pino.info('a user connected %s', socket.id);
        socket.on('create-join-channel', function (data) {

            getRoom(data.channel, function (err, room) {

                if(err || !room) {

                    createChannel(data, function (err, newRoom) {

                        if(err) {
                            pino.error(err)
                        }
                        socket.emit('%s created', room.channel)
                    })
                } else {
                    var user = new User({
                        id: socket.id,
                        username: data.username
                        //socket: socket
                    })

                    if(!room.peers) {
                        room.peers = {}
                    }

                    if(!room.broadcaster) {

                        room.broadcaster = user.id
                    }

                    room.peers[user.id] = user

                    if(Object.keys(room.peers).length === 2) {

                        room.channelIsReady = true

                        //nsp.to(room.initiator).emit('start-signaling')
                    }

                    if(Object.keys(room.peers).length > 1) {
                        //nsp.to(data.id).emit('start-signaling')
                    }

                    //process.nextTick(function (r) {
                    saveRoom(r)
                    //})


                }
            })
        })

        socket.on('disconnect', function () {

            //room.nsp.emit('leaving')
            //
        })
    })

    //db.on('put', onPut)


    emitter.on('new-room', function (roomId) {

        if(roomId) {
            pino.info('new-room event -> %s ', roomId)
            var data = {channel: roomId}
            getRoom(data.channel, function (err, room) {

                if(err || !(room)) {

                    createChannel({channel: roomId}, function (err, room) {

                        //if(!err && room) {
                        //    io.to(room.channel).emit('channel-created')
                        //
                        //}
                    })
                } else {
                    //io.to(room.channel).emit('channel-created')
                    //var peerMap = Object.keys(room.peers).map(function (key) {
                    //    return room.peers[key]
                    //});

                    //
                    //io.to(data.channel).emit('channel-joined', {
                    //    broadcasting: room.channelIsReady,
                    //    peers: peerMap
                    //})
                    //var nsp = io.nsps[room.channel]
                    //getRoom(socket.nsp.name, function (err, r) {
                    //
                    //    if(r) {
                    //        var peers = r.peers
                    //        //nsp.emit('message', data)
                    //        for(var peerId in peers) {
                    //            var peer = peers[peerId]
                    //            if(peer.id !== socket.id) {
                    //                //io.to(peerId).emit('message', data)
                    //                socket.broadcast.to(peer.id).emit('peer-answer', data)
                    //            }
                    //        }
                    //    }
                    //})
                }
            });
        }
    })
}


function createChannel(data, cb) {

    cb = cb || noop

    var room = new Room({
        id: data.channel,
        channel: data.channel,
        peers: null,
        broadcaster: null,
        channelIsReady: false
    })


    saveRoom(room, function (err, room) {
        pino.info('room %s created', room.channel)
        var nsp = io.of('/' + data.channel)
        nsp.on('connection', function (socket) {
            pino.info('new connection in room: %s ', room.channel)

            socket.join(room.channel);

            //socket.on('join-channel', function (data) {
            //
            //    getRoom(data.channel, function (err, r) {
            //
            //        if(!r.peers) {
            //            r.peers = {}
            //            //io.to(r.channel).emit('channel-created')
            //            nsp.emit('channel-created')
            //
            //
            //        }
            //
            //        var user = new User({
            //            id: socket.id,
            //            username: data.username
            //        })
            //
            //        if(!r.initiator) {
            //            r.initiator = user.id.toString()
            //        }
            //
            //        r.peers[user.username] = user
            //
            //        if(Object.keys(r.peers).length > 1) {
            //
            //            r.channelIsReady = true
            //            //io.to(r.initiator).emit('channel-ready')
            //            socket.broadcast.to(r.channel).emit('channel-ready')
            //        }
            //
            //        //process.nextTick(function (r) {
            //        saveRoom(r)
            //        //})
            //
            //        if(r.channelIsReady) {
            //            var peerMap = Object.keys(r.peers).map(function (key) {
            //                return r.peers[key]
            //            });
            //
            //            //socket.broadcast.to(r.initiator).emit('channel-joined', {
            //            nsp.emit('channel-joined', {
            //                peerId: user.id,
            //                broadcasting: r.channelIsReady,
            //                broadcaster: r.initiator,
            //                peers: peerMap
            //            })
            //        }
            //    })
            //});

            socket.on('join-broadcast', function (data) {
                var user;
                getRoom(data.channel, function (err, r) {

                    if(!r.peers) {
                        r.peers = {}
                    }

                    if(r.peers[data.id]) {
                        user = r.peers[data.id]
                    } else {
                        user = new User({
                            id: socket.id,
                            username: data.username,
                            channel: data.channel
                        })
                    }

                    if(!r.broadcaster) {
                        r.broadcaster = user.id.toString()
                        user.broadcaster = true
                    }
                    r.peers[user.id] = user


                    if(user.broadcaster) {
                        socket.emit('start-broadcasting');
                    } else {
                        //socket.emit('join-broadcast', user);
                        nsp.to(r.broadcaster).emit('call-peer', user)
                        nsp.to(user.id).emit('join-broadcast', {broadcaster: r.broadcaster});


                    }
                    saveRoom(r)
                })
            });

            socket.on('message', function (msg) {
                console.log('incoming msg %s', msg)
                if(msg.to) {
                    nsp.to(msg.to).emit('message', msg)

                } else {

                    socket.broadcast.emit('message', msg);
                }
            });

            //socket.on('peer-offer', function (data) {
            //    console.log('peer-data', data.data)
            //    getRoom(socket.nsp.name, function (err, r) {
            //
            //        if(r) {
            //            var peers = r.peers
            //            //nsp.emit('message', data)
            //            for(var peerId in peers) {
            //                var peer = peers[peerId]
            //                if(peer.id !== socket.id) {
            //                    //io.to(peerId).emit('message', data)
            //                    socket.broadcast.to(peer.id).emit('peer-offer', data)
            //                }
            //            }
            //        }
            //    })
            //})
            //
            //socket.on('peer-answer', function (data) {
            //    console.log('peer-data', data.data)
            //    getRoom(socket.nsp.name, function (err, r) {
            //
            //        if(r) {
            //            var peers = r.peers
            //            //nsp.emit('message', data)
            //            for(var peerId in peers) {
            //                var peer = peers[peerId]
            //                if(peer.id !== socket.id) {
            //                    //io.to(peerId).emit('message', data)
            //                    socket.broadcast.to(peer.id).emit('peer-answer', data)
            //                }
            //            }
            //        }
            //    })
            //})
            //
            //socket.on('start-signaling', function (data) {
            //    //console.log('peer-data', data.data)
            //    getRoom(socket.nsp.name, function (err, r) {
            //
            //        if(r) {
            //            var peers = r.peers
            //            //nsp.emit('message', data)
            //            for(var peerId in peers) {
            //                var peer = peers[peerId]
            //                if(peer.id !== socket.id) {
            //                    //io.to(peerId).emit('message', data)
            //                    socket.broadcast.to(peer.id).emit('start-signaling', data)
            //                }
            //            }
            //        }
            //    })
            //})
            //
            //socket.on('peer-ice', function (data) {
            //    console.log('peer-ice', data.data)
            //    getRoom(socket.nsp.name, function (err, r) {
            //
            //        if(r) {
            //            var peers = r.peers
            //            //nsp.emit('message', data)
            //            for(var peerId in peers) {
            //                var peer = peers[peerId]
            //                if(peer.id !== socket.id) {
            //                    //io.to(peerId).emit('message', data)
            //                    socket.broadcast.to(peer.id).emit('peer-ice', data)
            //                }
            //            }
            //        }
            //
            //    })
            //})
            //
            //socket.on('waiting-for-peers', function (data) {
            //    console.log('peer-ice', data.data)
            //    getRoom(socket.nsp.name, function (err, r) {
            //
            //        if(r) {
            //
            //        }
            //
            //    })
            //})

            socket.on('disconnect', function (e) {

                if(e) {
                    console.log('opps RoomServer encountered an error: %s', e)
                }
            })

            socket.on('error', function (e) {

                if(e) {
                    console.log('opps RoomServer encountered an error: %s', e)
                }
            })
        });
    })
}


function getRoom(roomId, cb) {
    cb = cb || noop

    if(!(roomId) || roomId.toString().length == 0)
        cb(null, null)
    roomId = roomId.replace('/', '')
    db.get(roomId, function (err, r) {
        var room = r ? JSON.parse(r) : null
        return cb(err, room);
    })
}

function saveRoom(room, cb) {
    cb = cb || noop
    db.put(room.channel, room, {valueEncoding: 'json'}, function (err) {

        return cb(err, room);
    })
}

function getStats() {

}

function presence() {

}

function disconnect() {

}

function onPut(key, value) {

    pino.info('put event -> %s : %s', key, value)
    createChannel({channel: key})
}

function joinChannel(data, socket, cb) {
    var self = this
    db.get(self.channel, function (err, room) {

        if(err)return cb(err, null)
        if(!room)return cb(new Error('couldnt find your channel'), null)


        if(room) {
            var user = new User({
                id: socket.id,
                username: username
                //socket:socket,
            })

            if(!room.peers) {
                room.peers = {}
            }

            if(!room.broadcaster)
                room.broadcaster = user.id
            room.peers[user.id] = user
            db.put(room.channel, room, function (err) {
                return cb(err, room)
            })
        }

    })
}

function send(channel, username, socket, cb) {

    db.get(channel, function (err, room) {

        if(err)return cb(err, null)
        if(!room)return cb(new Error('couldnt find your channel'), null)

        if(room) {
            var user = new User({
                id: socket.id,
                username: username
                //socket:socket,
            })

            if(!room.peers) {
                room.peers = {}
            }

            if(!room.broadcaster)
                room.broadcaster = user.id

            room.peers[user.id] = user
            db.put(room.channel, room, function (err) {
                return cb(err, room)
            })
        }

    })
}


module.exports = createServer
