/**
 * Created by ghostmac on 5/25/16.
 */
var level = require('level')

var db = level('rooms.db')

db.on('ready', function () {
        console.log('level db')
    })
    .on('closing', function () {
        console.log('closing db')
    })

module.exports = db