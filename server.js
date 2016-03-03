/**
 * Created by ghostmac on 3/2/16.
 */
'use strict';
var path = require('path');
var util = require('util');
var url = require('url');
var express = require('express');
var app = express();
var http = require('http').Server(app);

var opts = {
    transports: [
        'websocket',
        'xhr-polling',
        'jsonp-polling'
    ]
    //,log: true
    //,origins: '*:*'
}

var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/static/index.html');
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});
app.use(express.static(path.join(__dirname, 'static')));

io.on('connection', function (socket) {
    console.log('a user connected');
});

////var express = require('express');
////var io = require('socket.io')
//var bodyParser = require('body-parser');
//var minimist = require('minimist');
//var uuid = require('node-uuid');
////var ws = require('ws');
//var morgan = require('morgan')
//var argv = minimist(process.argv.slice(2), {
//    default: {
//        as_uri: 'http://localhost:8080',
//        ws_uri: 'ws://192.168.99.100:8888/kurento'
//    }
//});
//
//var asUrl = url.parse(argv.as_uri);
//var port = asUrl.port;
//var app = express();
//app.use(express.static(path.join(__dirname, 'static')));

//var app = express().createServer();
//
//app.use(bodyParser.json());
//app.use(express.static(path.join(__dirname, 'static')));
//app.use(morgan('dev'))
//
//var server = app.listen(port, function () {
//    console.log('node-room-server started');
//    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
//});
////var server = require('http').Server(app);
//
//app.get('/', function (req, res) {
//    res.sendfile(__dirname + '/api.html');
//});
//
//
//io.on('connection', function (socket) {
//    socket.emit('news', {hello: 'world'});
//    socket.on('my other event', function (data) {
//        console.log(data);
//    });
//});
//
//var io = require('socket.io')(app);
//
//io.on('connection', function (socket) {
//    socket.emit('news', { hello: 'world' });
//    socket.on('my other event', function (data) {
//        console.log(data);
//    });
//});

//var express = require('express')
//var app = express();
//var server = require('http').createServer(app);
//var io = require('socket.io')(server,opts);
//
//app.use(express.static(path.join(__dirname, 'static')));
//app.get('/', function (req, res) {
//    res.sendfile(__dirname + '/static/api.html');
//});
//server.listen(port, function () {
//    console.log('Server listening at port %d', port);
//});

//var sso = require('socket.io')
//var server = require('http').Server(app);
//
//var io = new sso(server, opts);
//
//server.listen(8080);
//
//app.get('/', function (req, res) {
//    res.sendfile(__dirname + '/static/api.html');
//});
//
//io.sockets.on('connection', function (socket) {
//    socket.emit('news', {hello: 'world'});
//    socket.on('my other event', function (data) {
//console.log(socket);
//});
//});
