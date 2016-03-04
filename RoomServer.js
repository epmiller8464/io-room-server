/**
 * Created by ghostmac on 3/3/16.
 */

module.exports = exports = IoServer;

function IoServer(http) {
    var io = require('socket.io').listen(http, {
        log: false,
        origins: '*:*'
    });

    io.set('transports', [
        'websocket', // 'disconnect' EVENT will work only with 'websocket'
        'xhr-polling',
        'jsonp-polling'
    ]);

    var listOfBroadcasts = {};

    io.on('connection', function(socket) {
        var currentUser;
        var sessionId = uuid.v4()

        socket.on('join-broadcast', function(user) {
            currentUser = user;

            user.numberOfViewers = 0;
            if (!listOfBroadcasts[user.broadcastid]) {
                listOfBroadcasts[user.broadcastid] = {
                    broadcasters: {},
                    allusers: {},
                    typeOfStreams: user.typeOfStreams // object-booleans: audio, video, screen
                };
            }

            var firstAvailableBroadcaster = getFirstAvailableBraodcater(user);
            if (firstAvailableBroadcaster) {
                listOfBroadcasts[user.broadcastid].broadcasters[firstAvailableBroadcaster.userid].numberOfViewers++;
                socket.emit('join-broadcaster', firstAvailableBroadcaster, listOfBroadcasts[user.broadcastid].typeOfStreams);

                console.log('User <', user.userid, '> is trying to get stream from user <', firstAvailableBroadcaster.userid, '>');
            } else {
                currentUser.isInitiator = true;
                socket.emit('start-broadcasting', listOfBroadcasts[user.broadcastid].typeOfStreams);

                console.log('User <', user.userid, '> will be next to serve broadcast.');
            }

            listOfBroadcasts[user.broadcastid].broadcasters[user.userid] = user;
            listOfBroadcasts[user.broadcastid].allusers[user.userid] = user;
        });

        socket.on('message', function(message) {
            socket.broadcast.emit('message', message);
        });

        socket.on('disconnect', function() {
            if (!currentUser) return;
            if (!listOfBroadcasts[currentUser.broadcastid]) return;
            if (!listOfBroadcasts[currentUser.broadcastid].broadcasters[currentUser.userid]) return;

            delete listOfBroadcasts[currentUser.broadcastid].broadcasters[currentUser.userid];
            if (currentUser.isInitiator) {
                delete listOfBroadcasts[currentUser.broadcastid];
            }
        });
        //console.log(util.inspect(socket))
        console.log('connected to ws server - session: %s', sessionId);
        socket.on('error', function (error) {
            console.log('Error: ' + error);
        });

        socket.on('close', function () {
            console.log('Connection closing: ' + sessionId + ' closed');
        });

        socket.on('message', function (_message) {
            var message = JSON.parse(_message);
            console.log('Connection ' + sessionId + ' received message ', message);
            var jsonRpc = message

            //roomServer.roomHandler.handleRequest()

        })
    });

    function getFirstAvailableBraodcater(user) {
        var broadcasters = listOfBroadcasts[user.broadcastid].broadcasters;
        var firstResult;
        for (var userid in broadcasters) {
            if (broadcasters[userid].numberOfViewers <= 3) {
                firstResult = broadcasters[userid];
                continue;
            } else delete listOfBroadcasts[user.broadcastid].broadcasters[userid];
        }
        return firstResult;
    }
}
