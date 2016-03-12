/**
 * Created by ghostmac on 3/2/16.
 */
'use strict';
var path = require('path');
var util = require('util');
var url = require('url');
var express = require('express');

var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();
var http = require('http').Server(app);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

//app.use(function (req, res, next) {
//res.contentType('application/json');
//console.log('use xxx')
//next();
//});

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.use(express.static(path.join(__dirname, 'static')));

//app.get('/', function (req, res) {
//    res.sendFile(__dirname + '/static/index.html');
    //res.sendFile(path.join(__dirname, 'static/index.html'));
//});

//app.get('/:r', function (req, res) {
//    res.sendFile(__dirname + '/static/index.html');
    //res.sendFile(path.join(__dirname, 'static/index.html'));
//});

var routes = require('./routes/index');
var rooms = require('./routes/users');
app.use('/', routes);
//app.use('/getAllRooms', users);
app.use('/r', rooms);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user


require('./IoServer')(http)

http.listen(3000, function () {
    console.log('listening on *:3000');
});

module.exports = app;
