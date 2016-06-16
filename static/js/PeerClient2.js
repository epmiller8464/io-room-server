/**
 * Created by ghostmac on 6/2/16.
 */


var noop = function () {
}

var DEFAULT_CONSTRAINTS = {video: true, audio: false}

function PeerClient(opts) {
    var self = this
    self.peers = opts.peers || []
    self.constraints = opts.constraints || DEFAULT_CONSTRAINTS
    self.peers = {}
    self.channel = opts.channel || null
    self.username = opts.username || null
    self.socket = opts.socket
    self.id = self.socket.id
    self._pendingIce = []
    self.pc = null
    self.broadcastConnection = null
    self.localStream = null
    self.broadcaster = false
    self.emitter = new EventEmitter();

    self.socket.on('connect', function (s) {
        console.log('client connected')
        self.id = self.socket.id
        self.joinOrCreateRoom()
        navigator.getUserMedia(self.constraints, function (stream) {
            //self.handleUserMedia(stream, cb)
            self.localStream = stream
            self.attachMedia(stream)
            self.socket.emit('waiting-for-peers', {peerId: self.id})
        }, self.handleMediaError);

        //self.getUserMedia(function (stream) {
        //
        //    self.localStream = stream
        //    self.attachMedia(stream)
        //    self.socket.emit('waiting-for-peers', {peerId: self.id})
        //})
    })

    self.socket.on('join-broadcast', function (data) {

        /*{broadcasting:true,broadcaster:id,peers:[]}*/
        self.channelReady = true
        self.broadcaster = true
        self.updatePeers(data.peers)


        if(!(self.peers[data.peerId])) {

            self.createPeerConnection(function (pc) {

                if(pc) {
                    self.peers[data.peerId] = pc
                    self.socket.emit('start-signaling', {peerId: data.peerId})
                }
            })
        }
    })

    self.socket.on('start-broadcasting', function (data) {

        if(!self.started) {

            /*{broadcasting:true,broadcaster:id,peers:[]}*/
            self.channelReady = true
            self.broadcaster = false
            //self.updatePeers(data.peers)

            self.createPeerConnection(function (pc) {

                if(pc) {
                    self.peers[data.peerId] = pc
                }
            })
        }
    })

    self.socket.on('message', function (data) {
        console.log('>> ' + data)
        $('#messages').prepend('<li><p>' + data.username + '>> ' + data.data + '</p></li>')
    })

    self.socket.on('connect-error', function (e) {

        console.log('connect-error: %s', e)
        self.updateDisplay(SEM.connecterror)
    })

    self.socket.on('connect-timeout', function (e) {
        self.updateDisplay(SEM.connecttimeout)

        console.log('connection timeout %s', self.socket.id)
    })

    self.socket.on('reconnect', function (n) {
        self.reconnect()
        console.log('client %s reconnected to room %s - attempt(%s)', self.socket.id, self.socket.nsp, n)
    })

    self.socket.on('reconnecting', function (n) {
        self.updateDisplay(SEM.reconnecting)

        console.log('reconnecting : %s', n)
    })

    self.socket.on('reconnect-attempt', function (e) {
        self.updateDisplay(SEM.reconnectattempt)

        console.log('client %s attempting to reconnect to room %s', self.socket.id, self.socket.nsp)
    })

    self.socket.on('reconnect-error', function (e) {
        self.updateDisplay(SEM.reconnecterror)

        console.log('reconnect-error -> client %s failed to reconnect to room %s', self.socket.id, self.socket.nsp)
    })

    self.socket.on('reconnect-failed', function (e) {
        self.updateDisplay(SEM.reconnectfailed)

        console.log('reconnect-failed -> client %s attempting to reconnect to room %s ---> failed', self.socket.id, self.socket.nsp)
    })

    self.socket.on('disconnect', function (e) {

        self.disconnect();
    })

    self.socket.on('error', function (e) {
        console.log('socket error: %s', e)
        self.updateDisplay(SEM.error)

        if(e.toString() === 'Invalid namespace') {

        }

    })


}

PeerClient.prototype.send = function (msg) {
    var self = this
    console.log('msg', msg)
    self.socket.emit('message', {username: self.username, data: msg})
}

PeerClient.prototype.joinOrCreateRoom = function () {
    var self = this

    self.socket.emit('join-channel', {channel: self.channel, peerId: self.id, username: self.username});
    self.updateDisplay(SEM.connect)
}

PeerClient.prototype.startBroadcasting = function () {
    var self = this

}
PeerClient.prototype.joinBroadcast = function () {
    var self = this
}

PeerClient.prototype.attachMedia = function (stream) {

    var video = document.querySelector('#loopBack')
    video.src = window.URL.createObjectURL(stream)
    video.play()
}

PeerClient.prototype.attachRemoteMedia = function (stream) {

    var video = document.querySelector('#vid')
    video.src = window.URL.createObjectURL(stream)
    video.play()
}

PeerClient.prototype.getUserMedia = function (cb) {
    var self = this
    cb = cb || noop
    //if(!isViewer) {
    //navigator.mediaDevices.getUserMedia(options)
    //    .then(gotStream)
    //navigator.getUserMedia(self.constraints, self.handleUserMedia, self.handleMediaError);
    navigator.mediaDevices.getUserMedia(self.constraints, function (stream) {
        //self.handleUserMedia(stream, cb)
        return cb(stream)

    }, self.handleMediaError);
    //} else {
    //    navigator.getUserMedia(self.constraints, self.handleViewerMedia, self.handleMediaError);
    //navigator.getUserMedia(self.constraints, function (stream) {
    //
    //    self.handleUserMedia(stream, cb)
    //}, self.handleMediaError);
    //}
}
PeerClient.prototype.handleMediaError = function (e) {
    console.log(e)
    throw new Error(e)
}

//PeerClient.prototype.handleMediaError = function (e) {
//    console.log(e)
//    throw new Error(e)
//}
//

PeerClient.prototype.checkChannelState = function () {

    var self = this

    return (!self.started) && self.channelReady && (self.localStream !== undefined || self.localStream !== null)

}


PeerClient.prototype.createPeerConnection = function (cb) {
    cb = cb || noop

    var self = this

    var pc = new SimplePeer({
        initiator: self.broadcaster,
        stream: self.localStream
    })

    pc.on('signal', function (data) {
        self.started = true
        //peer2.signal(data)

        //if(data.type && data.type === 'offer') {
        var d = {peerId: self.id, data: data}
        self.socket.emit('peer-data', d);

        //}
        if(data.type && data.type === 'answer') {

            self.socket.emit('peer-answer', {peerId: self.id, data: data});
        }

        //else {
        //    self.socket.emit('peer-ice', {peerId: self.id, data: data});
        //
        //self.iceCandidate(data)
        //}
    })

    pc.on('connect', function () {
        console.log('peer connected')
        self.started = false
        if(arguments) {

        }
    })

    pc.on('stream', function (stream) {
        // got remote video stream, now let's show it in a video tag
        //var video = document.querySelector('video')
        //video.src = window.URL.createObjectURL(stream)
        //video.play()
        self.broadcasting = true
        self.attachRemoteMedia(stream)
    })

    return cb(pc)
}

PeerClient.prototype.disconnect = function () {
    var self = this
    self.updateDisplay(SEM.disconnect)

    self.started = false
    if(self.pc) {

        self.pc.destroy(function () {

            if(arguments) {

            }

        })
    }
}

PeerClient.prototype.updatePeers = function (peers) {
    $('#peers').children().remove()
    self.peers = []
    for(var i = 0; i < peers.length; i++) {
        var p = peers[i]
        self.peers.push(p)
        userJoined(p)
    }

}

PeerClient.prototype.updateDisplay = function (evtId) {
    var self = this
    var key = EvtMap[evtId]
    var s = 'text-success',
        w = 'text-warning',
        d = 'text-danger',
        add = s,
        remove = d;


    switch (key) {
        case 'connect':

            break;
        case 'connect-error':
        case 'connect-timeout':

            break;
        case 'disconnect':
            remove = s
            add = w
            break;
        case 'error':
        case 'reconnect':
        case 'reconnecting':
        case 'reconnect-error':
        case 'reconnect-attempt':
        case 'reconnect-failed':
            remove = s
            add = d
            break;

    }
    console.log(key)

    $('#heartBeat').addClass(add).removeClass(remove)
    $('#serverState').text(key)

    //var socketInfo = new {sid: self.socket.id, nsp: self.socket.nsp, room: self.socket.io.nsps }
    var socketInfo = {sid: self.socket.id, nsp: self.socket.nsp, room: self.channel}

    $('#sid').text(socketInfo.sid)
    $('#snsp').text(socketInfo.nsp)
    $('#srid').text(socketInfo.room)
}

function userJoined(data) {
    var html = '<li class="list-group-item" style="font-size: 0.75em;">' +
        '    <h6 class="pull-left">' + data.username + '</h6>' +
        '    <span style="padding-top: 10px; padding-left: 10px;"' +
        '          class="glyphicon glyphicon-heart text-success"></span>' +
        '</li>';

    $('#peers').prepend(html)
}

var SocketEvts = ['connect', 'connect-error', 'connect-timeout', 'disconnect', 'error', 'reconnect', 'reconnecting', 'reconnect-error', 'reconnect-attempt', 'reconnect-failed']

var EvtMap = (function () {
    var map = {}

    for(var i = 0; i < SocketEvts.length; i++) {
        var kvp = SocketEvts[i]
        map[kvp] = kvp
    }
    return map
})()


var SEM = {
    connect: 'connect',
    connecterror: 'connect-error',
    connecttimeout: 'connect-timeout',
    disconnect: 'disconnect',
    error: 'error',
    reconnect: 'reconnect',
    reconnecting: 'reconnecting',
    reconnecterror: 'reconnect-error',
    reconnectattempt: 'reconnect-attempt',
    reconnectfailed: 'reconnect-failed'
}