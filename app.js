/**
 * Created by ghostmac on 3/2/16.
 */
var debug = require('debug')('io-room-server:server');
var path = require('path');
var util = require('util');
var url = require('url');
var express = require('express');
//var favicon = require('serve-favicon');
var logger = require('express-pino-logger')();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index.js');
var rooms = require('./routes/rooms.js');

var app = express();
var cookieSession = require('cookie-session')
var fs = require('fs')
var http = require('http').createServer(app);
// var server = https.createServer(app);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.set('trust proxy', 1)
// app.use(cookieSession({name: 'session', keys: [fs.readFileSync('./usj.key')]}))
app.use(cookieSession({name: 'session', secret: 'io-room-server-secret'}))
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));

app.use('/', index);
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
if(app.get('env') === 'development') {
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
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
var RoomNotification = require('./lib/RoomNotification')
global.RoomNotification = new RoomNotification()
require('./RoomServer')(http, global.RoomNotification)

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

// http.listen(process.env.NODE_PORT, function () {
//     console.log('listening on *:3000');
// });


http.listen(port);
http.on('error', onError);
http.on('listening', onListening);


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);
    
    if(isNaN(port)) {
        // named pipe
        return val;
    }
    
    if(port >= 0) {
        // port number
        return port;
    }
    
    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if(error.syscall !== 'listen') {
        throw error;
    }
    
    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;
    
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = http.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
    

module.exports = app;


