var uuid = require('node-uuid')
var express = require('express');
var router = express.Router();
var db = require('../db')
var Room = require('../lib/Room')
var RoomNotification = require('../lib/RoomNotification')


router.get('/:room/:username', function (req, res, next) {

    //var key = req.params.room
    //db.get(key, function (err, value) {
    //
    //    if (err) {
    //        res.writeHead(404)
    //        res.send('unauthorized')
    //    }
    //    console.log(value)
    //    res.send(value)
    //res.end()
    //})
    //var username = req.session.uid;
    req.session = null
    res.render('r', {layout: null, roomname: req.params.room, username: req.params.username});
});


router.get('/stats/:room', function (req, res, next) {

    var key = req.params.room
    db.get(key, function (err, value) {

        if(err) {
            res.writeHead(404)
            res.send('unauthorized')
        }
        console.log(value)
        res.send(JSON.stringify(value))
        res.end()
    })
    //res.render('r', {layout: null, roomname: req.params.room, username: req.session.uid});
});

router.get('/rooms/all', function (req, res, next) {

    var key = req.params.room
    //res.setHeader()


    db.createReadStream()
        .on('data', function (data) {
            console.log(data.key, '=', data.value)
            res.write(new Buffer(JSON.stringify(data)))
        })
        .on('error', function (err) {
            console.log('Oh my!', err)
        })
        .on('close', function () {
            console.log('Stream closed')
        })
        .on('end', function () {
            console.log('Stream closed')
            res.end()
        })
});


router.post('/create', function (req, res, next) {

    var u = req.body.username
    var r = req.body.channel || uuid.v4()
    //req.log.info(`post: new channel for ${u} on ${r}`)

    if(global.RoomNotification) {
        process.nextTick(function () {
            global.RoomNotification.emit('new-room', r)
        })
    }
    res.redirect('/r/' + r + '/' + u);
});
module.exports = router;
module.exports.RoomNotification = RoomNotification

//var salt = Math.round((new Date().valueOf() * Math.random())) + '';