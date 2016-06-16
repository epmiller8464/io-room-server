/**
 * Created by ghostmac on 5/11/16.
 */



//io('ws://' + location.host).emit('presence', {channel: self.room});

function SocketClient(opts) {
    var self = this
    self.room = opts.room;
    self.username = opts.username
    self.socket = opts.socket


    self.socket.on('connect', function (s) {
        //            console.log(socket)
        console.log('client connected: %s', self.username)
        //self.socket.emit('new-channel', {channel: self.room, user: self.username});

        self.socket.on('room-joined', function (data) {
            console.log('Joined response')
            console.log(data)
        });

        self.socket.on('message', function (m) {
            console.log('message: %s', m);
            $('#console_list').prepend('<li><span class="text-primary">' + m + '</span></li>')
        });

        self.socket.on('presence', function (d) {
            console.log('presence: ', d)
        });

        self.socket.on('user-left', function () {
            console.log('disconnect from socket')
        });

    });


    self.socket.on('disconnecting', function (s) {

        console.log('server disconnect signaled');

    });
}

SocketClient.prototype.sendMessage = function (data) {
    var self = this

    if (data)
        self.socket.emit('message', {data: data, username: self.username})

}

SocketClient.prototype.incomingMessage = function (data) {

    console.log(data)
    $('console_list').appendChild('<li><span class="text-primary">' + data + '</span></li>')
}

SocketClient.prototype.presence = function () {
    //        console.log(text.val())
    //do something
}
SocketClient.prototype.joinRoom = function () {
    //        console.log(text.val())
    //do something
}


SocketClient.prototype.leaveRoom = function () {
    //        console.log(text.val())
    //do something
}

