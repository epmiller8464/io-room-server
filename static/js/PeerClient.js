/**
 * Created by ghostmac on 6/2/16.
 */


var noop = function () {
}

var DEFAULT_CONSTRAINTS = {video: true, audio: false}

function PeerClient(opts) {
    var self = this
    self.constraints = opts.constraints || DEFAULT_CONSTRAINTS
    self.sdpConstraints = {}
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
    self.connected = false

    var pc_config = webrtcDetectedBrowser === 'firefox' ? {'iceServers': [{'urls': 'stun:23.21.150.121'}]} : {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

// Peer Connection contraints: (i) use DTLS; (ii) use data channel
    var pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': true}, {'RtpDataChannels': true}]};

    var connection;
    self.socket.on('connect', function (s) {
        console.log('client connected')

        if(!self.connected) {
            console.log('conneted to server')
            self.joinOrCreateRoom()
        }
    })

    self.socket.on('join-broadcast', function (data) {
        console.log('join-broadcast %s', data)
        self.broadcaster = false
        //navigator.getUserMedia(self.constraints, function (stream) {
        //self.localStream = stream
        // host i.e. sender should always use this!
        var sdpConstraints = {
            mandatory: {
                OfferToReceiveVideo: true,
                OfferToReceiveAudio: true
            }
        };

        var opts = {broadcaster: false, userId: self.id, sdpConstraints: sdpConstraints}

        //self.pc = initPeerConnection(opts)

        self.pc = new SimplePeer({
            initiator: false,
            stream: self.localStream,
            //trickle: false,
            offerConstraints: sdpConstraints,
            constraints: pc_constraints,
            config: pc_config
        })

        self.pc.on('signal', function (sdp) {

            self.socket.emit('message', {to: data.broadcaster, data: sdp})
            console.log('signalingState : %s -> iceGatheringState: %s , iceConnectionState: %s, connectionState: %s ', self.pc._pc.signalingState, self.pc._pc.iceGatheringState, self.pc._pc.iceConnectionState, self.pc._pc.connectionState)

        })


        self.pc.on('connect', function (data) {
            self._pendingIce.push(data)
        })

        self.pc.on('stream', function (stream) {

            if(stream) {
                var tracks = stream.getTracks();
                console.log(tracks[0].remote)
                //console.log('signalingState : %s -> iceGatheringState: %s , iceConnectionState: %s, connectionState: %s ', self.pc._pc.signalingState, self.pc._pc.iceGatheringState, self.pc._pc.iceConnectionState, self.pc._pc.connectionState)
                self.attachRemoteMedia(stream)
                //self.pc.send('tests')
            }

        })

        //}, self.handleMediaError);
    })

    self.socket.on('start-broadcasting', function () {
        console.log('start-broadcasting')
        navigator.getUserMedia(self.constraints, function (stream) {
            //self.handleUserMedia(stream, cb)
            self.broadcaster = true
            self.localStream = stream
            self.attachMedia(stream)
        }, function (e) {

            if(e) {

            }

        });
    })

    self.socket.on('call-peer', function (peer) {
//signal to the user in the data
        console.log('call-peer %s', peer)

        var sdpConstraints = {
            mandatory: {
                OfferToReceiveVideo: false,
                OfferToReceiveAudio: false
            }
        }

        var opts = {broadcaster: true, userId: self.id, stream: self.localStream, sdpConstraints: sdpConstraints}
        //connection = initPeerConnection(opts)

        self.pc = new SimplePeer({
            initiator: true,
            stream: self.localStream,
            offerConstraints: sdpConstraints,
            //trickle: false,
            channelName: self.username,
            constraints: pc_constraints,
            config: pc_config
        })
        self.pc.on('iceConnectionStateChange', function () {

            console.log('iceConnectionState: %s ', self.pc._pc.iceConnectionState);

        })

        self.pc.on('signalingStateChange', function () {

            console.log('signalingState : %s ', self.pc._pc.signalingState)

        })

        self.pc.on('icecandidate', function (c) {

            if(c) {

            }

        })


        self.pc._createOffer()

        self.pc.on('signal', function (sdp) {

            self.socket.emit('message', {to: peer.id, data: sdp})
        })


        self.pc.on('connect', function (data) {
            self._pendingIce.push(data)
        })

        self.pc.on('stream', function (stream) {

            if(stream) {

            }

        })

    })

    self.socket.on('message', function (data) {

        console.log('>> %s', JSON.stringify(data))
        if(data.data.type || data.data.candidate) {

            var k = data.data.candidate || data.data.type

            self.pc.signal(data.data)
            switch (k) {
                case "Offer":
                case "offer":
                    console.log('offer received')
                    //self.pc.signal(data.data)

                    break;

                case "Answer":
                case "answer":
                    console.log('answer received')
                    //self.pc.signal(data.data)

                    break;
                default:
                    console.log(data.data)
                    //self.pc.signal(data.data)

                    //self._pendingIce.push(data.data)
                    break;
            }


        } else {

            $('#messages').prepend('<li><p>' + data.username + '>> ' + data.data + '</p></li>')
        }
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
        self.connected = false
        if(e.toString() === 'Invalid namespace') {

        }

    })


    function onStream(event) {

        if(!(self.broadcaster) && !self.broadcastConnection) {
            var sdpConstraints = {
                mandatory: {
                    OfferToReceiveVideo: false,
                    OfferToReceiveAudio: false
                }
            }
            var opts = {broadcaster: false, userId: self.id, stream: event.stream, sdpConstraints: sdpConstraints}

            self.broadcastConnection = initPeerConnection(opts);
            //self.broadcastingConnection.onstream = function () {
            //};

            //self.broadcastingConnection.session = connection.session;
            self.broadcastingConnection._pc.addStream(event.stream); // broadcast remote stream
            //self.broadcastingConnection.dontCaptureUserMedia = true;

            // forwarder should always use this!

            //connection.broadcastingConnection.open({
            //    dontTransmit: true
            //});
        }


    }

    return self

}

PeerClient.prototype.send = function (msg) {
    var self = this
    console.log('msg', msg)
    self.socket.emit('message', {username: self.username, data: msg})
}

PeerClient.prototype.joinOrCreateRoom = function () {
    var self = this

    self.socket.emit('join-broadcast', {channel: self.channel, id: self.id, username: self.username});
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

PeerClient.prototype.handleMediaError = function (e) {
    console.log(e)
    throw new Error(e)
}


PeerClient.prototype.getUserMedia = function (cb) {
    var self = this
    cb = cb || noop
    navigator.mediaDevices.getUserMedia(self.constraints, function (stream) {

        self.localStream = stream
        return cb(stream)

    }, self.handleMediaError);
}

function initPeerConnection(opts) {/*stream, constraints, cb) {*/
    //cb = cb || noop
    var defaultConstraints = {mandatory: {OfferToReceiveAudio: false, OfferToReceiveVideo: true}}
    var broadcaster = opts.broadcaster || false,
        userId = opts.userId,
        sdpConstraints = opts.sdpConstraints || defaultConstraints,
        stream = opts.stream || false;

    var connection = new SimplePeer({
        initiator: broadcaster,
        stream: stream,
        channelName: userId,
        offerConstraints: sdpConstraints
    })
    return connection
}

PeerClient.prototype.reconnect = function () {
    var self = this
    self.updateDisplay(SEM.reconnect)

}

PeerClient.prototype.disconnect = function () {
    var self = this
    self.updateDisplay(SEM.disconnect)
    self.connected = false

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