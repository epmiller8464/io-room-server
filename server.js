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

//var sio = require('socket.io')
//var io = require('socket.io')(http,opts);
//var io = sio(http, opts)

app.use(function (req, res, next) {
    //res.contentType('application/json');
    //console.log('use xxx')
    next();
});

app.use(express.static(path.join(__dirname, 'static')));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/static/index.html');
});
app.get('/:r', function (req,res) {
    res.sendFile(__dirname + '/static/index.html');
});

//app.get('/r/:rid', function (req, res) {
//    res.sendFile(__dirname + '/index.html');
//});

require('./IoServer')(http)

http.listen(3000, function () {
    console.log('listening on *:3000');
});